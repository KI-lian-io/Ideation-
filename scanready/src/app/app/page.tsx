'use client'
import React, { useReducer, useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Lebenslauf } from '@/lib/schema'
import {
  isLebenslaufBasicallyEmpty,
  toPlainText,
  stripUids,
  withBulletUids,
  withSkillCategoryUids,
  defaultOrtDatum,
  answersToWire,
  wireAnswersToIds,
  derivePackageTitle,
} from '@/lib/lebenslauf-utils'
import type { LebenslaufEditorState } from '@/lib/lebenslauf-utils'
import { LebenslaufEditor, reorder, DEFAULT_PHOTO_TRANSFORM } from '@/components/LebenslaufEditor'
import type { LebenslaufAction, PhotoTransform } from '@/components/LebenslaufEditor'
import { NormGapPanel } from '@/components/NormGapPanel'
import { PrintLebenslauf, PrintAnschreiben } from '@/components/PrintSheet'
import { PERSONALIZATION_QUESTIONS, questionsForPosting, recommendDirection } from '@/lib/prompts'
import { INVALID_INPUT_SENTINEL } from '@/lib/sentinel'
import { btnClass, CARD, EYEBROW, NORM_NOTE } from '@/components/ui'
import { LangProvider, useLang } from '@/lib/i18n'
import { track } from '@/lib/analytics'
import { AccountMenu } from '@/components/AccountMenu'
import { StorageGate } from '@/components/StorageGate'
import { PassStatusChip } from '@/components/PassStatusChip'
import { useAccount } from '@/components/AccountProvider'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { accountsEnabled } from '@/lib/supabase/config'
import { paymentsEnabled } from '@/lib/payments-config'
import {
  saveApplicationPackage,
  updatePackageTitle,
  listPackages,
  listCvs,
  deletePackage,
  getPackage,
  getActivePass,
  getLatestPass,
  type ApplicationPackageRow,
  type CvRow,
  type SaveResult,
} from '@/lib/account'
import { bestCvMatch } from '@/lib/cv-overlap'
import {
  SavedConfirmationPanel,
  InlineRenameField,
  SheetCard,
  MonoBadge,
  KebabMenu,
  BottomSheet,
  EmptyState,
  type KebabMenuItem,
} from '@/components/ui'

// Dynamic: keeps Stripe.js (and its cookies) out of the page until the modal opens.
const HumanizerModal = dynamic(() => import('@/components/HumanizerModal'), { ssr: false })
const PaketModal = dynamic(() => import('@/components/PaketModal'), { ssr: false })
const PassModal = dynamic(() => import('@/components/PassModal'), { ssr: false })

/** sessionStorage key for a paid Bewerbungspaket: stores ONLY the PaymentIntent
 * id (never document content), so a reload restores the unlock after a server
 * re-verification instead of charging again. */
const PAKET_PURCHASE_KEY = 'paket_purchase'

// ---------------------------------------------------------------------------
// Stable identity keys for editable list entries
// ---------------------------------------------------------------------------

/**
 * Client-side-only stable id, attached to every experience/education entry
 * when it enters state (PARSE_SUCCESS or an ADD action). React list keys
 * must track logical identity, not array position – otherwise a reorder or
 * remove dispatch shifts indices while EditableField's internal `draft`
 * (which only resyncs when NOT editing – see EditableField.tsx) stays mounted
 * against the same DOM node, silently attaching an in-flight edit to a
 * DIFFERENT entry (bug: index-keyed lists cross-write on reorder/remove).
 *
 * The same failure mode applies to experience bullets and skills/skill-categories
 * (raw string[] in the schema): withBulletUids/withSkillCategoryUids in
 * lebenslauf-utils.ts wrap those the same way.
 *
 * `_uid` is never sent to the API and never appears in copy/download output:
 * see handleGenerateLetter and ResultView's handleCopy, both of which call
 * stripUids() before toPlainText (also field-by-field, never spreads the entry).
 */
type LebenslaufWithUids = LebenslaufEditorState

function withUids(l: Lebenslauf): LebenslaufWithUids {
  return {
    ...l,
    experience: l.experience.map((e) => ({
      ...e,
      _uid: crypto.randomUUID(),
      bullets: withBulletUids(e.bullets),
    })),
    education: l.education.map((e) => ({ ...e, _uid: crypto.randomUUID() })),
    languages: l.languages.map((lang) => ({ ...lang, _uid: crypto.randomUUID() })),
    skills: withSkillCategoryUids(l.skills),
  }
}

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

type AppPhase =
  | 'input'
  | 'loading'
  | 'result'
  | 'error'
  | 'junk'
  | 'cover_letter_input'
  | 'cover_letter_streaming'
  | 'cover_letter_result'
  | 'cover_letter_error'

type AppState = {
  phase: AppPhase
  resumeText: string // persists through all phases – needed for /api/cover-letter
  lebenslauf: LebenslaufWithUids | null
  sectionOrder: string[]
  errorMessage: string | null
  jobPosting: string
  answers: { id: string; answer: string }[]
  /** Client-side-only object URL for the uploaded photo (change 4). Never sent to
   * any API – see LebenslaufEditor's PersonalSection and toPlainText, neither of
   * which reference it. Revoked on replace/remove/reset to avoid blob URL leaks. */
  photoUrl: string | null
  /** Display crop for the photo: CSS-transform pan/zoom applied inside the fixed
   * 3:4 frame. x/y are translate percentages of the frame, zoom is 1..3. Purely
   * visual – when PDF export ships, the same numbers drive the canvas crop. */
  photoTransform: PhotoTransform
}

// AppAction union: page lifecycle actions + all Lebenslauf editor actions
type AppAction =
  | { type: 'SET_RESUME_TEXT'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'PARSE_SUCCESS'; payload: Lebenslauf }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'PARSE_JUNK' }
  | { type: 'RESET' }
  | {
      type: 'LOAD_PACKAGE'
      payload: {
        resumeText: string
        lebenslauf: Lebenslauf
        jobPosting: string
        answers: { id: string; answer: string }[]
      }
    }
  | { type: 'START_COVER_LETTER' }
  | { type: 'SET_JOB_POSTING'; payload: string }
  | { type: 'SET_ANSWER'; payload: { id: string; answer: string } }
  | { type: 'COVER_LETTER_STREAMING' }
  | { type: 'COVER_LETTER_DONE' }
  | { type: 'COVER_LETTER_ERROR'; payload: string }
  | { type: 'BACK_TO_RESULT' }
  | LebenslaufAction

// Static, deterministic – no Date.now, Math.random, or window (hydration safety)
const initialState: AppState = {
  phase: 'input',
  resumeText: '',
  lebenslauf: null,
  sectionOrder: ['personal', 'profil', 'experience', 'education', 'skills', 'languages'],
  errorMessage: null,
  jobPosting: '',
  answers: PERSONALIZATION_QUESTIONS.map((q) => ({ id: q.id, answer: '' })),
  photoUrl: null,
  photoTransform: DEFAULT_PHOTO_TRANSFORM,
}

// Revokes a photo object URL if one exists – best-effort, no-op on null/undefined.
function revokePhoto(url: string | null | undefined) {
  if (url) URL.revokeObjectURL(url)
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // Page lifecycle
    // -------------------------------------------------------------------------
    case 'SET_RESUME_TEXT':
      return { ...state, resumeText: action.payload }
    case 'SUBMIT':
      return { ...state, phase: 'loading', errorMessage: null }
    case 'PARSE_SUCCESS':
      return { ...state, phase: 'result', lebenslauf: withUids(action.payload) }
    case 'PARSE_ERROR':
      return { ...state, phase: 'error', errorMessage: action.payload }
    case 'PARSE_JUNK':
      // Preserve resumeText so user can fix/expand it (D-17)
      return { ...state, phase: 'junk' }
    case 'RESET':
      revokePhoto(state.photoUrl)
      return initialState
    case 'LOAD_PACKAGE':
      // Loads a saved application package into the result phase. lebenslauf arrives
      // as the plain (uid-free) schema shape from Postgres; wrap it the same way
      // PARSE_SUCCESS does. Photo is never persisted (zero-retention guardrail for
      // the display-only crop), so it resets to null/default here.
      revokePhoto(state.photoUrl)
      return {
        ...state,
        phase: 'result',
        resumeText: action.payload.resumeText,
        lebenslauf: withUids(action.payload.lebenslauf),
        jobPosting: action.payload.jobPosting,
        answers: action.payload.answers,
        photoUrl: null,
        photoTransform: DEFAULT_PHOTO_TRANSFORM,
        errorMessage: null,
      }

    // -------------------------------------------------------------------------
    // Photo (client-side-only, display-only – see AppState.photoUrl doc comment)
    // -------------------------------------------------------------------------
    case 'SET_PHOTO':
      revokePhoto(state.photoUrl) // replacing: revoke the previous URL first
      return { ...state, photoUrl: action.url, photoTransform: DEFAULT_PHOTO_TRANSFORM }
    case 'REMOVE_PHOTO':
      revokePhoto(state.photoUrl)
      return { ...state, photoUrl: null, photoTransform: DEFAULT_PHOTO_TRANSFORM }
    case 'SET_PHOTO_TRANSFORM':
      return { ...state, photoTransform: action.transform }

    // -------------------------------------------------------------------------
    // Personal data
    // -------------------------------------------------------------------------
    case 'UPDATE_PERSONAL': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          personal: { ...state.lebenslauf.personal, [action.field]: action.value },
        },
      }
    }

    // -------------------------------------------------------------------------
    // Kurzprofil (professional summary)
    // -------------------------------------------------------------------------
    case 'UPDATE_PROFIL': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: { ...state.lebenslauf, profil: action.value || null },
      }
    }

    // -------------------------------------------------------------------------
    // Experience
    // -------------------------------------------------------------------------
    case 'UPDATE_EXPERIENCE': {
      if (!state.lebenslauf) return state
      const exp = state.lebenslauf.experience.map((e, i) =>
        i === action.index ? { ...e, [action.field]: action.value } : e
      )
      return { ...state, lebenslauf: { ...state.lebenslauf, experience: exp } }
    }
    case 'ADD_EXPERIENCE': {
      if (!state.lebenslauf) return state
      const blank = { role: '', company: '', location: null, start: null, end: null, bullets: [] as ReturnType<typeof withBulletUids>, _uid: crypto.randomUUID() }
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          experience: [...state.lebenslauf.experience, blank],
        },
      }
    }
    case 'REMOVE_EXPERIENCE': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          experience: state.lebenslauf.experience.filter((_, i) => i !== action.index),
        },
      }
    }
    case 'REORDER_EXPERIENCE': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          experience: reorder(state.lebenslauf.experience, action.from, action.to),
        },
      }
    }

    // -------------------------------------------------------------------------
    // Bullets
    // -------------------------------------------------------------------------
    case 'UPDATE_BULLET': {
      if (!state.lebenslauf) return state
      const exp = state.lebenslauf.experience.map((e, i) => {
        if (i !== action.expIndex) return e
        // Update by array position (dispatch still carries the render-time index),
        // but only the `text` field changes – `_uid` stays put, so the React key
        // never moves and an in-flight edit on a sibling bullet can't cross-write.
        const bullets = e.bullets.map((b, bi) => (bi === action.bulletIndex ? { ...b, text: action.value } : b))
        return { ...e, bullets }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, experience: exp } }
    }
    case 'ADD_BULLET': {
      if (!state.lebenslauf) return state
      const exp = state.lebenslauf.experience.map((e, i) => {
        if (i !== action.expIndex) return e
        return { ...e, bullets: [...e.bullets, { _uid: crypto.randomUUID(), text: '' }] }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, experience: exp } }
    }
    case 'REMOVE_BULLET': {
      if (!state.lebenslauf) return state
      const exp = state.lebenslauf.experience.map((e, i) => {
        if (i !== action.expIndex) return e
        return { ...e, bullets: e.bullets.filter((_, bi) => bi !== action.bulletIndex) }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, experience: exp } }
    }

    // -------------------------------------------------------------------------
    // Education
    // -------------------------------------------------------------------------
    case 'UPDATE_EDUCATION': {
      if (!state.lebenslauf) return state
      const edu = state.lebenslauf.education.map((e, i) =>
        i === action.index ? { ...e, [action.field]: action.value } : e
      )
      return { ...state, lebenslauf: { ...state.lebenslauf, education: edu } }
    }
    case 'ADD_EDUCATION': {
      if (!state.lebenslauf) return state
      const blank = { qualification: '', institution: '', location: null, start: null, end: null, _uid: crypto.randomUUID() }
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          education: [...state.lebenslauf.education, blank],
        },
      }
    }
    case 'REMOVE_EDUCATION': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          education: state.lebenslauf.education.filter((_, i) => i !== action.index),
        },
      }
    }
    case 'REORDER_EDUCATION': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          education: reorder(state.lebenslauf.education, action.from, action.to),
        },
      }
    }

    // -------------------------------------------------------------------------
    // Skills – categorized (D-09)
    // -------------------------------------------------------------------------
    case 'UPDATE_SKILL': {
      if (!state.lebenslauf) return state
      const skills = state.lebenslauf.skills.map((cat, ci) => {
        if (ci !== action.catIndex) return cat
        return {
          ...cat,
          // Same identity rule as UPDATE_BULLET: update `text` in place by position,
          // `_uid` never moves.
          skills: cat.skills.map((s, si) => (si === action.skillIndex ? { ...s, text: action.value } : s)),
        }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, skills } }
    }
    case 'ADD_SKILL': {
      if (!state.lebenslauf) return state
      const skills = state.lebenslauf.skills.map((cat, ci) => {
        if (ci !== action.catIndex) return cat
        return { ...cat, skills: [...cat.skills, { _uid: crypto.randomUUID(), text: '' }] }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, skills } }
    }
    case 'REMOVE_SKILL': {
      if (!state.lebenslauf) return state
      const skills = state.lebenslauf.skills.map((cat, ci) => {
        if (ci !== action.catIndex) return cat
        return { ...cat, skills: cat.skills.filter((_, si) => si !== action.skillIndex) }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, skills } }
    }
    case 'ADD_SKILL_CATEGORY': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          skills: [...state.lebenslauf.skills, { category: '', skills: [], _uid: crypto.randomUUID() }],
        },
      }
    }
    case 'REMOVE_SKILL_CATEGORY': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          skills: state.lebenslauf.skills.filter((_, ci) => ci !== action.catIndex),
        },
      }
    }
    case 'UPDATE_SKILL_CATEGORY_NAME': {
      if (!state.lebenslauf) return state
      const skills = state.lebenslauf.skills.map((cat, ci) =>
        ci === action.catIndex ? { ...cat, category: action.value } : cat
      )
      return { ...state, lebenslauf: { ...state.lebenslauf, skills } }
    }

    // -------------------------------------------------------------------------
    // Languages
    // -------------------------------------------------------------------------
    case 'UPDATE_LANGUAGE': {
      if (!state.lebenslauf) return state
      const langs = state.lebenslauf.languages.map((l, i) =>
        i === action.index ? { ...l, [action.field]: action.value } : l
      )
      return { ...state, lebenslauf: { ...state.lebenslauf, languages: langs } }
    }
    case 'ADD_LANGUAGE': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          languages: [...state.lebenslauf.languages, { language: '', level: null, _uid: crypto.randomUUID() }],
        },
      }
    }
    case 'REMOVE_LANGUAGE': {
      if (!state.lebenslauf) return state
      return {
        ...state,
        lebenslauf: {
          ...state.lebenslauf,
          languages: state.lebenslauf.languages.filter((_, i) => i !== action.index),
        },
      }
    }

    // -------------------------------------------------------------------------
    // Section order (D-12)
    // -------------------------------------------------------------------------
    case 'REORDER_SECTION':
      return { ...state, sectionOrder: reorder(state.sectionOrder, action.from, action.to) }

    // -------------------------------------------------------------------------
    // Cover letter sub-flow
    // -------------------------------------------------------------------------
    case 'START_COVER_LETTER':
      return { ...state, phase: 'cover_letter_input' }
    case 'SET_JOB_POSTING': {
      // Re-derive the question list from the posting (conditional Gehalt/Eintrittstermin
      // questions) and sync answers by question id so typed answers survive across
      // language toggles (the label shown changes; the id and the stored answer don't).
      const questions = questionsForPosting(action.payload)
      const answers = questions.map(
        (q) => state.answers.find((a) => a.id === q.id) ?? { id: q.id, answer: '' }
      )
      return { ...state, jobPosting: action.payload, answers }
    }
    case 'SET_ANSWER': {
      const answers = state.answers.map((a) =>
        a.id === action.payload.id ? { ...a, answer: action.payload.answer } : a
      )
      return { ...state, answers }
    }
    case 'COVER_LETTER_STREAMING':
      return { ...state, phase: 'cover_letter_streaming', errorMessage: null }
    case 'COVER_LETTER_DONE':
      return { ...state, phase: 'cover_letter_result' }
    case 'COVER_LETTER_ERROR':
      return { ...state, phase: 'cover_letter_error', errorMessage: action.payload }
    case 'BACK_TO_RESULT':
      // Dedicated navigation action – clearer than overloading PARSE_SUCCESS and
      // avoids a non-null assertion on state.lebenslauf (IN-01).
      return { ...state, phase: 'result' }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Lock icon – inline SVG, no icon library dependency
// ---------------------------------------------------------------------------

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5V4.5a2 2 0 1 0-4 0V6h4Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Goal-gradient step indicator
// ---------------------------------------------------------------------------

/**
 * Editorial progress line shown once the user has made some progress – never on
 * input/loading (no progress claim before any progress exists). Three labeled
 * steps, mono EYEBROW-style: completed = accent + filled dot, current = ink +
 * ring dot, upcoming = muted + hollow dot.
 *
 * Lebenslauf/Anschreiben stay identical in both UI languages (they are the German
 * document names, not chrome); only "Questions"/"Fragen" is localized.
 */
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useLang()
  const stepLabels = [t.stepLebenslauf, t.stepQuestions, t.stepAnschreiben] as const
  return (
    <div
      className="flex items-center gap-3 mb-2"
      aria-label={t.stepAriaLabel(current, stepLabels[current - 1])}
    >
      {stepLabels.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3
        const status = step < current ? 'done' : step === current ? 'current' : 'upcoming'
        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <span className="h-px w-6 bg-hair" aria-hidden="true" />}
            <span
              className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] ${
                status === 'upcoming' ? 'text-muted' : status === 'current' ? 'text-ink' : 'text-accent'
              }`}
            >
              <span
                aria-hidden="true"
                className={
                  status === 'done'
                    ? 'h-1.5 w-1.5 rounded-full bg-accent'
                    : status === 'current'
                      ? 'h-1.5 w-1.5 rounded-full border border-ink'
                      : 'h-1.5 w-1.5 rounded-full border border-muted'
                }
              />
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phase views
// ---------------------------------------------------------------------------

function InputView({
  resumeText,
  onTextChange,
  onSubmit,
  onLoadPackage,
  onDuplicatePackage,
}: {
  resumeText: string
  onTextChange: (text: string) => void
  onSubmit: () => void
  /** Stage 3 accounts: dispatches LOAD_PACKAGE for the chosen saved application.
   * SavedApplications renders nothing when accounts are disabled or signed out. */
  onLoadPackage: (pkg: ApplicationPackageRow) => void
  /** Stage 3 accounts: "Neue Bewerbung aus dieser" - loads the package's CV +
   * Lebenslauf with an EMPTY posting step (never restores the old Anschreiben). */
  onDuplicatePackage: (pkg: ApplicationPackageRow) => void
}) {
  const { t } = useLang()
  const RESUME_LIMIT = 30_000
  const resumeOverLimit = resumeText.length > RESUME_LIMIT
  const resumeNearLimit = resumeText.length > RESUME_LIMIT * 0.8
  const isSubmitDisabled = resumeText.trim().length === 0 || resumeOverLimit

  const [extracting, setExtracting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Monotonic request id – guards against a slower, earlier extraction overwriting
  // a faster, later one (or a stale error clobbering a subsequent success).
  const extractionIdRef = useRef(0)

  async function handleFile(file: File) {
    const requestId = ++extractionIdRef.current
    setUploadError(null)
    setExtracting(true)
    try {
      const { extractCvText, CvExtractError } = await import('@/lib/extract-cv')
      try {
        const text = await extractCvText(file)
        if (requestId !== extractionIdRef.current) return // superseded – drop this result
        onTextChange(text)
        setUploadedName(file.name)
      } catch (err) {
        if (requestId !== extractionIdRef.current) return // superseded – drop this result
        setUploadedName(null)
        // extract-cv keeps its reason codes English/internal; the display site (here)
        // maps them through the active-language dictionary instead of importing
        // EXTRACT_ERROR_MESSAGES directly, so upload errors follow the UI toggle.
        if (err instanceof CvExtractError) {
          setUploadError(t.extractErrors[err.reason])
        } else {
          setUploadError(t.extractGenericError)
        }
      }
    } finally {
      if (requestId === extractionIdRef.current) setExtracting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
          {t.inputHeadline}
        </h1>
        <p className="text-sm text-muted">
          {t.inputIntro}
        </p>
      </div>

      {/* Zero-retention reassurance – calm inline line with lock icon (D-14 / INPUT-02) */}
      <p className="flex items-center gap-2 text-sm text-muted">
        <LockIcon />
        {t.zeroRetention}
      </p>

      {/* CV file upload – extraction runs in the browser; the file is never uploaded (INPUT-02) */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = '' // same file re-selectable
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className={btnClass('secondary')}
        >
          {extracting ? t.uploadButtonBusy : t.uploadButton}
        </button>
        <span className="text-sm text-muted" role="status">
          {uploadedName
            ? t.uploadHintImported(uploadedName)
            : t.uploadHintDefault}
        </span>
      </div>
      {uploadError && (
        <p className="text-sm text-red-600" role="status">{uploadError}</p>
      )}

      <textarea
        value={resumeText}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={extracting}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (extracting) return // matches the upload button's disabled state
          const f = e.dataTransfer.files?.[0]
          if (f) handleFile(f)
        }}
        placeholder={t.resumePlaceholder}
        rows={18}
        className={`w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${dragOver ? 'border-accent ring-2 ring-accent/30' : ''}`}
        aria-label={t.resumeAriaLabel}
      />
      {/* Counter only appears once it's actually useful – past 80% of the limit, or over it. */}
      {resumeNearLimit && (
        <p className={`text-sm text-right ${resumeOverLimit ? 'text-red-500' : 'text-muted'}`}>
          {resumeText.length.toLocaleString('de-DE')} / 30.000
          {resumeOverLimit && ` – ${t.tooLongSuffix}`}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className={`${btnClass('primary')} self-end`}
      >
        {t.submitCta}
      </button>

      {/* Stage 3 accounts: saved applications for the signed-in user. Renders
          nothing when accounts are disabled or the user is signed out. */}
      <SavedApplications onOpen={onLoadPackage} onDuplicate={onDuplicatePackage} />
    </div>
  )
}

/**
 * Derives the "company · city" line from the package's own saved Lebenslauf
 * (most recent experience entry, index 0). Grounded in data the user already
 * saved - never a separate stored field, never invented. Returns null when
 * the Lebenslauf has no experience entries, so the caller skips the line
 * entirely rather than rendering an empty one. Same helper as KontoClient.tsx's
 * (kept local here rather than shared - the two galleries have no other shared
 * import today and this is a five-line pure derivation).
 */
function packageCompanyCity(pkg: ApplicationPackageRow): string | null {
  const latest = pkg.lebenslauf.experience[0]
  if (!latest) return null
  return latest.location ? `${latest.company} · ${latest.location}` : latest.company
}

/** One saved-package card for the compact in-tool gallery: same anatomy and
 * kebab actions as the /konto gallery (mono date + kebab, serif title or
 * inline rename, company · city, hairline, mono document-type badge row).
 * On touch (`sm:hidden` trigger), the kebab is replaced by a BottomSheet the
 * caller mounts once for whichever card is open (44px targets). */
function PackageCard({
  pkg,
  anyReadOnly,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onOpen,
  onDuplicate,
  onDelete,
  onOpenSheet,
}: {
  pkg: ApplicationPackageRow
  anyReadOnly: boolean
  isRenaming: boolean
  renameValue: string
  onRenameChange: (value: string) => void
  onRenameStart: (pkg: ApplicationPackageRow) => void
  onRenameCommit: (pkg: ApplicationPackageRow, value: string) => void
  onRenameCancel: () => void
  onOpen: (pkg: ApplicationPackageRow) => void
  onDuplicate: (pkg: ApplicationPackageRow) => void
  onDelete: (pkg: ApplicationPackageRow) => void
  onOpenSheet: (pkg: ApplicationPackageRow) => void
}) {
  const { t } = useLang()
  const companyCity = packageCompanyCity(pkg)

  const items: KebabMenuItem[] = [
    { label: t.libraryMenuOpen, onSelect: () => onOpen(pkg) },
    { label: t.libraryMenuDuplicate, onSelect: () => onDuplicate(pkg) },
    ...(pkg.read_only ? [] : [{ label: t.libraryMenuRename, onSelect: () => onRenameStart(pkg) }]),
    { label: t.libraryMenuDelete, onSelect: () => onDelete(pkg), destructive: true },
  ]

  return (
    <div
      className={
        pkg.read_only
          ? 'flex flex-col gap-2 rounded-xl border border-hair bg-paper px-4 py-3.5'
          : `${SheetCard} flex flex-col gap-2 px-4 py-3.5`
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
          {new Date(pkg.updated_at).toLocaleDateString('de-DE')}
        </span>
        {/* Desktop/pointer: floating KebabMenu. Touch (<sm): a plain trigger
            that opens the shared BottomSheet mounted once by the caller. */}
        <span className="hidden sm:inline-flex">
          <KebabMenu items={items} ariaLabel={t.libraryMenuAriaLabel(pkg.title)} />
        </span>
        <button
          type="button"
          aria-label={t.libraryMenuAriaLabel(pkg.title)}
          onClick={() => onOpenSheet(pkg)}
          className="inline-flex h-11 w-11 items-center justify-center rounded text-muted hover:bg-faint sm:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {isRenaming ? (
        <InlineRenameField
          value={renameValue}
          onChange={onRenameChange}
          onSave={(value) => onRenameCommit(pkg, value)}
          onCancel={onRenameCancel}
          ariaLabel={t.saveTitleAriaLabel}
        />
      ) : (
        <span className={`font-serif-text text-base font-semibold leading-tight ${pkg.read_only ? 'text-slate' : 'text-ink'}`}>
          {pkg.title}
        </span>
      )}
      {isRenaming && <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-stone">{t.libraryRenameHelper}</p>}

      {companyCity && <span className="text-xs text-muted">{companyCity}</span>}

      <div className="h-px bg-hair" />

      <div className="flex flex-wrap items-center gap-1.5">
        <MonoBadge>LL</MonoBadge>
        {pkg.anschreiben ? <MonoBadge>AS</MonoBadge> : <MonoBadge variant="ghost">AS fehlt</MonoBadge>}
        {pkg.job_posting ? (
          <MonoBadge>STELLENANZEIGE</MonoBadge>
        ) : (
          <MonoBadge variant="ghost">STELLENANZEIGE fehlt</MonoBadge>
        )}
        {pkg.read_only ? (
          <MonoBadge variant="readonly">{t.libraryReadonlyBadge}</MonoBadge>
        ) : anyReadOnly ? (
          <MonoBadge variant="editable">{t.libraryEditableBadge}</MonoBadge>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Lists the signed-in user's saved application packages on the input view as
 * the same card gallery as /konto (compact: stacked single column within the
 * narrower tool card). Fetches once when a user is present (accountsEnabled()
 * && user); renders nothing while signed out or disabled, matching every
 * other Stage 3 UI.
 */
function SavedApplications({
  onOpen,
  onDuplicate,
}: {
  onOpen: (pkg: ApplicationPackageRow) => void
  onDuplicate: (pkg: ApplicationPackageRow) => void
}) {
  const { t } = useLang()
  const { user } = useAccount()
  const [packages, setPackages] = useState<ApplicationPackageRow[] | null>(null)
  const [filter, setFilter] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [sheetFor, setSheetFor] = useState<ApplicationPackageRow | null>(null)

  async function refresh() {
    if (!user) return
    const rows = await listPackages(getSupabaseBrowserClient(), user.id)
    setPackages(rows)
  }

  useEffect(() => {
    if (!accountsEnabled() || !user) {
      setPackages(null)
      return
    }
    let cancelled = false
    listPackages(getSupabaseBrowserClient(), user.id).then((rows) => {
      if (!cancelled) setPackages(rows)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleDelete(pkg: ApplicationPackageRow) {
    if (!window.confirm(t.kontoDeleteConfirm)) return
    await deletePackage(getSupabaseBrowserClient(), pkg.id)
    await refresh()
  }

  function handleRenameStart(pkg: ApplicationPackageRow) {
    setRenamingId(pkg.id)
    setRenameValue(pkg.title)
  }

  function handleRenameCancel() {
    setRenamingId(null)
    setRenameValue('')
  }

  async function handleRenameCommit(pkg: ApplicationPackageRow, value: string) {
    const trimmed = value.trim()
    setRenamingId(null)
    if (!trimmed || trimmed === pkg.title) return
    await updatePackageTitle(getSupabaseBrowserClient(), pkg.id, trimmed)
    await refresh()
  }

  if (!accountsEnabled() || !user || packages === null) return null

  const needle = filter.trim().toLowerCase()
  const filtered = needle
    ? packages.filter((pkg) => {
        const companyCity = packageCompanyCity(pkg) ?? ''
        return pkg.title.toLowerCase().includes(needle) || companyCity.toLowerCase().includes(needle)
      })
    : packages
  const anyReadOnly = packages.some((pkg) => pkg.read_only)

  const sheetItems: KebabMenuItem[] = sheetFor
    ? [
        { label: t.libraryMenuOpen, onSelect: () => onOpen(sheetFor) },
        { label: t.libraryMenuDuplicate, onSelect: () => onDuplicate(sheetFor) },
        ...(sheetFor.read_only ? [] : [{ label: t.libraryMenuRename, onSelect: () => handleRenameStart(sheetFor) }]),
        { label: t.libraryMenuDelete, onSelect: () => handleDelete(sheetFor), destructive: true },
      ]
    : []

  return (
    <div className="mt-2 flex flex-col gap-3 border-t border-hair pt-6">
      <div className="flex items-center justify-between gap-3">
        <p className={EYEBROW}>{t.libraryTitle}</p>
        {packages.length > 0 && (
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t.libraryFilterPlaceholder}
            aria-label={t.libraryFilterPlaceholder}
            className="w-40 rounded-md border border-hair bg-paper px-2.5 py-1 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none sm:w-56"
          />
        )}
      </div>

      {packages.length === 0 ? (
        <EmptyState
          status={t.libraryEmptyStatus}
          body={t.libraryEmptyBody}
          ctaLabel={t.libraryEmptyCta}
          onCtaClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
      ) : (
        <>
          {anyReadOnly && <p className="text-xs text-muted">{t.libraryReadonlyBanner}</p>}
          <div className="flex flex-col gap-3">
            {filtered.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                anyReadOnly={anyReadOnly}
                isRenaming={renamingId === pkg.id}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameStart={handleRenameStart}
                onRenameCommit={handleRenameCommit}
                onRenameCancel={handleRenameCancel}
                onOpen={onOpen}
                onDuplicate={onDuplicate}
                onDelete={handleDelete}
                onOpenSheet={setSheetFor}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-start gap-2 border-t border-hair pt-4 text-xs text-muted">
        <LockGlyph />
        <span>
          {t.libraryFooterContents}{' '}
          <a href="/datenschutz" className="underline" lang="de">
            {t.humanizerPrivacyLink}
          </a>
        </span>
      </div>

      {sheetFor && (
        <BottomSheet items={sheetItems} onClose={() => setSheetFor(null)} title={sheetFor.title} />
      )}
    </div>
  )
}

function LoadingView() {
  const { t } = useLang()
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % t.loadingMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [t.loadingMessages.length])

  return (
    <div className="flex flex-col gap-4" role="status" aria-label={t.loadingAriaLabel}>
      <div className="relative animate-pulse flex flex-col gap-3">
        {/* Brand scan-sweep over the skeleton: looping variant of the hero's
            signature motion (Typesetting Theater Phase 2). Decorative; hidden
            entirely under prefers-reduced-motion via the .scan-sweep rule. */}
        <div className="scan-sweep scan-sweep-loop" aria-hidden="true" />
        {/* Skeleton blocks simulating the Lebenslauf layout (D-15 / INPUT-03) */}
        <div className="h-6 w-1/3 rounded bg-faint" />
        <div className="h-4 w-1/2 rounded bg-faint" />
        <div className="h-4 w-2/5 rounded bg-faint" />

        <div className="mt-4 h-5 w-1/4 rounded bg-faint" />
        <div className="h-4 w-3/4 rounded bg-faint" />
        <div className="h-4 w-2/3 rounded bg-faint" />
        <div className="h-4 w-1/2 rounded bg-faint" />

        <div className="mt-4 h-5 w-1/4 rounded bg-faint" />
        <div className="h-4 w-3/5 rounded bg-faint" />
        <div className="h-4 w-1/2 rounded bg-faint" />
      </div>
      {/* Keyed by message index so each swap remounts and replays a 150ms crossfade
          instead of the text silently jumping to the next message. */}
      <p key={messageIndex} className="text-sm text-muted phase-enter">
        {t.loadingMessages[messageIndex]}
      </p>
    </div>
  )
}

function ResultView({
  lebenslauf,
  sectionOrder,
  photoUrl,
  photoTransform,
  dispatch,
  onReset,
  onStartCoverLetter,
  onExportPdf,
  paketUnlocked,
  onRequestPaket,
  onSavePackage,
  onRequestPass,
  jobPosting,
  cvs,
  currentCvText,
}: {
  lebenslauf: LebenslaufWithUids
  sectionOrder: string[]
  photoUrl: string | null
  photoTransform: PhotoTransform
  dispatch: React.Dispatch<AppAction>
  onReset: () => void
  onStartCoverLetter: () => void
  onExportPdf: (ortDatum: string) => void
  /** Bewerbungspaket unlock state, owned by AppShell (Stripe PI in sessionStorage,
   * server-verified). Locked: the export button opens the purchase modal instead. */
  paketUnlocked: boolean
  onRequestPaket: () => void
  /** Stage 3 accounts: saves the current Lebenslauf (anschreiben: null at this
   * step) under the given title, optionally attaching to an existing cvs row.
   * Renders nothing via SaveApplicationButton when accounts are disabled. */
  onSavePackage: (title: string, existingCvId?: string) => Promise<SaveResult | 'signed_out'>
  /** Opens PassModal (07-07) - StorageGate's Pass CTA in the save rail's
   * state==='limit' branch routes through this seam instead of the 07-06
   * /preise fallback. */
  onRequestPass: () => void
  /** Feeds the save card's title suggestion (derivePackageTitle) - empty until
   * the user has moved past this step at least once, same value the Anschreiben
   * step already carries in reducer state. */
  jobPosting: string
  /** Signed-in user's saved CVs, for the attach-or-new radio. Empty when signed
   * out or accounts are disabled. */
  cvs: CvRow[]
  /** The CV text this Lebenslauf was generated from (state.resumeText) - fed
   * into bestCvMatch to preselect the attach radio. */
  currentCvText: string
}) {
  const { t } = useLang()
  // Copy button state – local, not in reducer (D-04 / UI-SPEC)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  // Ort/Datum line for the DIN signature block on the printed Lebenslauf – a plain,
  // user-editable string (never part of LebenslaufSchema, never sent to any API; see
  // PrintSheet.tsx's doc comment). Derived ONCE on first render via lazy initializer
  // so a later edit to personal.address doesn't silently overwrite what the user typed.
  const [ortDatum, setOrtDatum] = useState(() => defaultOrtDatum(lebenslauf.personal.address, new Date()))

  async function handleCopy() {
    const text = toPlainText(stripUids(lebenslauf), sectionOrder)
    try {
      await navigator.clipboard.writeText(text)
      track('copy_download', { kind: 'lebenslauf_copy' })
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 3000)
    }
  }

  const normGapCount = lebenslauf.normGapNotes.length

  // Exit ramp is demoted to a confirm-guarded text link (churn-risk fix) – reset
  // discards the converted Lebenslauf, so a deliberate confirm step replaces the
  // old always-available secondary button that sat above the document.
  function handleResetClick() {
    if (window.confirm(t.startOverConfirm)) {
      onReset()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={1} />

      {/* Display-serif header – value first. The norm-gap count doubles as its subtitle
          instead of repeating as a separate paragraph, so the number and the detail it
          refers to read as one unit directly above the document. The duplicate "LEBENSLAUF"
          eyebrow that used to sit above this is gone – the step indicator already carries
          that label (churn-risk fix). */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-3xl font-semibold text-ink">
          {t.resultHeadline}
        </h2>
        <p className="text-sm text-muted">
          {normGapCount > 0 ? t.normGapsFixed(normGapCount) : t.resultGroundedOnly}
        </p>
      </div>

      {/* Full-width layout: NormGapPanel sits ABOVE the document as its own collapsible
          strip (collapsed by default), then the full-width Lebenslauf editor. Replaces the
          former two-column document+notes grid – the document is the hero, and the notes
          are one click away rather than competing for lg: width (result-view layout change). */}
      <div className="reveal-stagger" style={{ '--i': 0 } as React.CSSProperties}>
        <NormGapPanel normGapNotes={lebenslauf.normGapNotes} />
      </div>

      {/* WYSIWYG Lebenslauf editor (D-01 / D-02 / D-03 / D-12) – now full-width */}
      <LebenslaufEditor
        lebenslauf={lebenslauf}
        sectionOrder={sectionOrder}
        dispatch={dispatch}
        photoAdvice={lebenslauf.photoAdvice}
        photoUrl={photoUrl}
        photoTransform={photoTransform}
      />

      {/* Visually-hidden live mirror so screen readers announce copy state changes
          without making the visible error paragraph itself a chatty aria-live region. */}
      <span className="sr-only" aria-live="polite">
        {copyState === 'copied' ? t.copied : copyState === 'error' ? t.copyFailedAria : ''}
      </span>

      {/* Inline copy error (transient 3000ms) */}
      {copyState === 'error' && (
        <p className="text-sm text-red-600">
          {t.copyFailed}
        </p>
      )}

      {/* Actions after value: Copy + Write Anschreiben live together as the natural next
          steps, right below the document (churn-risk fix – was a button row above the
          header, asking for copy before the value was even visible). */}
      <div className="rounded-lg border border-hair bg-paper p-5">
        <p className="text-sm font-semibold text-ink mb-1">
          {t.writeAnschreibenTitle}
        </p>
        <p className="text-sm text-muted mb-4">
          {t.writeAnschreibenBody}
        </p>
        <p className="text-sm text-muted mb-4">
          {t.writeAnschreibenPrice}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onStartCoverLetter}
            className={btnClass('primary')}
          >
            {t.writeAnschreibenCta}
          </button>
          {/* Copy button – D-04 / LL-04 – moved beside Write Anschreiben so the forward
              path dominates instead of competing with it above the document. */}
          <button
            onClick={handleCopy}
            aria-label={t.copyLebenslaufAria}
            className={btnClass('secondary')}
          >
            {copyState === 'copied' ? t.copied : t.copyLebenslauf}
          </button>
          {/* Export as PDF – browser print-to-PDF (window.print()), no server round-trip,
              no PDF library. Gated behind the Bewerbungspaket (4,99 € one-shot per
              application): locked, the button opens the purchase modal; unlocked, it
              routes through the single onExportPdf seam (AppShell's
              handleExportLebenslaufPdf). Copy and .txt download stay free. */}
          {(paketUnlocked || paymentsEnabled()) && (
            <button
              onClick={() => (paketUnlocked ? onExportPdf(ortDatum) : onRequestPaket())}
              aria-label={t.exportPdfAria}
              className={btnClass('secondary')}
            >
              {paketUnlocked ? t.exportPdfCta : t.paketLockedExportCta}
            </button>
          )}
        </div>
        {paketUnlocked && (
          <p className="mt-2 text-xs font-semibold text-accent">{t.paketUnlockedBadge}</p>
        )}

        {/* Stage 3 accounts: save this Lebenslauf (anschreiben: null at this step).
            Renders nothing when accounts are disabled. */}
        <div className="mt-4">
          <SaveApplicationButton
            onSave={onSavePackage}
            onRequestPass={onRequestPass}
            jobPosting={jobPosting}
            cvs={cvs}
            currentCvText={currentCvText}
          />
        </div>

        {/* Ort/Datum for the printed signature block – editable so the user controls
            exactly what prints (see defaultOrtDatum in lebenslauf-utils.ts). Purely a
            print-time UI string: never added to the schema, never sent to any API.
            Only relevant once printing is unlocked. */}
        {paketUnlocked && (
          <div className="flex flex-col gap-1 mt-4">
            <label htmlFor="ort-datum-input" className="text-sm text-muted">
              {t.ortDatumLabel}
            </label>
            <input
              id="ort-datum-input"
              type="text"
              value={ortDatum}
              onChange={(e) => setOrtDatum(e.target.value)}
              className="w-full max-w-xs rounded-md border border-hair bg-card px-3 py-1.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted">{t.exportPdfHint}</p>
          </div>
        )}
      </div>

      {/* Exit ramp – demoted to a small muted text link at the very bottom of the view,
          guarded by a confirm dialog (D-16 revised / churn-risk fix). */}
      <button
        onClick={handleResetClick}
        className="self-start text-sm text-muted hover:text-ink cursor-pointer underline underline-offset-2"
      >
        {t.startOverLink}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PencilGlyph: small edit-affordance icon for the saved-title rename control.
// Local (not exported) - mirrors ui.tsx's own local CheckGlyph convention.
// ---------------------------------------------------------------------------
function PencilGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// LockGlyph: storage-transparency footer icon for SavedApplications.
// Local (not exported) - mirrors KontoClient.tsx's own local LockGlyph.
// ---------------------------------------------------------------------------
function LockGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-accent"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Save application (Stage 3 accounts) – shared between ResultView and
// CoverLetterResultView. Renders nothing when accounts are disabled. Never
// auto-saves: onSave is invoked ONLY from handleClick below (the explicit
// Speichern click) - no blur/navigation/effect-driven save path exists here
// (zero-retention guardrail for the anonymous flow, and honest about what
// accounts do, Datenschutz §7).
//
// Save-moment rebuild (design surface 05, 07-04): the former single button is
// now a save card (title field pre-filled + pre-selected from
// derivePackageTitle, a provenance line, a contents-reminder line) that
// stays mounted for every state except 'saved', where it is replaced in
// place by SavedConfirmationPanel (checkmark, timestamp, editable title via
// InlineRenameField, library link). The extended state union is unchanged;
// only the idle/saving render and the post-save render are new.
// ---------------------------------------------------------------------------
function SaveApplicationButton({
  onSave,
  onRequestPass,
  jobPosting,
  cvs,
  currentCvText,
}: {
  onSave: (title: string, existingCvId?: string) => Promise<SaveResult | 'signed_out'>
  /** Opens PassModal (07-07) - passed straight through to StorageGate's
   * onChoosePass in the state==='limit' branch below. */
  onRequestPass: () => void
  jobPosting: string
  /** Signed-in user's saved CVs. Empty (or accounts off) renders no radio -
   * today's only historical behavior (always save-as-new). */
  cvs: CvRow[]
  /** The CV text this Lebenslauf/letter was generated from - fed into
   * bestCvMatch to preselect the attach radio. */
  currentCvText: string
}) {
  const { t } = useLang()
  const [state, setState] = useState<
    'idle' | 'saving' | 'saved' | 'signed_out' | 'limit' | 'error'
  >('idle')
  // Suggestion is recomputed from jobPosting once per mount (this component's
  // parent view remounts on every phase transition - see the `key={state.phase}`
  // wrapper in AppShell - so a fresh posting always yields a fresh suggestion).
  const [suggestedTitle] = useState(() => derivePackageTitle(jobPosting))
  const [title, setTitle] = useState(suggestedTitle)
  const [savedTitle, setSavedTitle] = useState(suggestedTitle)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [savedPackageId, setSavedPackageId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState(false)

  // Attach-or-new radio (plan 08-02): computed once per mount, same "fresh
  // suggestion per phase transition" rationale as suggestedTitle above.
  // Preselects "attach" when an existing CV clearly matches (>=80% token
  // overlap, cv-overlap.ts); otherwise "new" is the default (today's only
  // historical behavior). attachCvId defaults to the matched CV, or the most
  // recent CV (cvs is newest-first from listCvs) if the user switches to
  // "attach" manually with no clear match.
  const [preselect] = useState(() => bestCvMatch(currentCvText, cvs))
  const [saveMode, setSaveMode] = useState<'attach' | 'new'>(preselect ? 'attach' : 'new')
  const [attachCvId, setAttachCvId] = useState<string>(preselect?.id ?? cvs[0]?.id ?? '')

  if (!accountsEnabled()) return null

  async function handleClick() {
    setState('saving')
    const result = await onSave(title, saveMode === 'attach' ? attachCvId : undefined)
    if (result === 'signed_out') {
      setState('signed_out')
      return
    }
    if (result.ok) {
      setSavedTitle(title)
      setSavedPackageId(result.packageId)
      setSavedAt(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }))
      setState('saved')
      return
    }
    setState(result.reason)
  }

  // Renaming after save uses the already-existing updatePackageTitle helper
  // (src/lib/account.ts) - a real write, gated behind the pencil affordance,
  // never fired automatically. Optimistic update with revert-on-failure.
  async function handleRenameCommit(value: string) {
    setRenaming(false)
    const trimmed = value.trim()
    if (!trimmed || trimmed === savedTitle || !savedPackageId) return
    const previous = savedTitle
    setSavedTitle(trimmed)
    setRenameError(false)
    const client = getSupabaseBrowserClient()
    const result = await updatePackageTitle(client, savedPackageId, trimmed)
    if (!result.ok) {
      setSavedTitle(previous)
      setRenameError(true)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {state === 'saved' ? (
        <SavedConfirmationPanel
          timestamp={`${t.saveConfirmed} · ${savedAt ?? ''}`}
          libraryHref="/konto"
          libraryLabel={t.saveConfirmedLink}
          titleSlot={
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {renaming ? (
                  <InlineRenameField
                    value={renameValue}
                    onChange={setRenameValue}
                    onSave={handleRenameCommit}
                    onCancel={() => setRenaming(false)}
                    ariaLabel={t.saveRenameAria}
                  />
                ) : (
                  <>
                    <span className="font-serif text-base font-semibold text-ink">
                      {savedTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameValue(savedTitle)
                        setRenaming(true)
                      }}
                      aria-label={t.saveRenameAria}
                      className="text-stone hover:text-ink"
                    >
                      <PencilGlyph />
                    </button>
                  </>
                )}
              </div>
              {renameError && (
                <p className="text-xs text-red-600">{t.saveApplicationErrorHint}</p>
              )}
            </div>
          }
        />
      ) : (
        <div className={`${SheetCard} p-4`}>
          <p className={`${EYEBROW} mb-2`}>{t.saveLabel}</p>
          <input
            type="text"
            aria-label={t.saveTitleAriaLabel}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => e.target.select()}
            disabled={state === 'saving'}
            className="w-full rounded-md border border-accent bg-card px-3 py-2 font-serif text-base font-semibold text-ink shadow-[0_0_0_2px_rgba(10,125,99,0.18)] outline-none disabled:opacity-60"
          />
          {/* Attach-or-new radio (plan 08-02, design surface 07 mockup 1b) - only
              rendered once the user has 1+ saved CVs; explicit-save-only still
              holds (this only changes what the Speichern click below sends). */}
          {cvs.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <p className={`${EYEBROW}`}>{t.cvsAssignLabel}</p>
              <label
                className={`flex items-start gap-2.5 rounded-md border p-2.5 cursor-pointer ${
                  saveMode === 'attach' ? 'border-accent' : 'border-hair'
                }`}
              >
                <input
                  type="radio"
                  name="save-cv-mode"
                  checked={saveMode === 'attach'}
                  onChange={() => setSaveMode('attach')}
                  disabled={state === 'saving'}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {t.cvsAttachOption}
                  </span>
                  {saveMode === 'attach' && (
                    <select
                      value={attachCvId}
                      onChange={(e) => setAttachCvId(e.target.value)}
                      disabled={state === 'saving'}
                      aria-label={t.cvsAttachOption}
                      className="mt-1.5 w-full rounded-md border border-hair bg-card px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                    >
                      {cvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.title} · {t.cvsAttachMeta(new Date(cv.updated_at).toLocaleDateString('de-DE'), 0)}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
              </label>
              <label
                className={`flex items-start gap-2.5 rounded-md border p-2.5 cursor-pointer ${
                  saveMode === 'new' ? 'border-accent' : 'border-hair'
                }`}
              >
                <input
                  type="radio"
                  name="save-cv-mode"
                  checked={saveMode === 'new'}
                  onChange={() => setSaveMode('new')}
                  disabled={state === 'saving'}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-ink">{t.cvsNewOption}</span>
                  <span className="block text-xs text-muted mt-0.5">{t.cvsNewOptionHint}</span>
                </span>
              </label>
              <p className="text-xs text-muted">{t.cvsSnapshotNote}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone">
            <PencilGlyph />
            {t.saveSuggestionHint}
          </div>
          <p className="mt-3 border-t border-hair pt-2.5 text-xs text-muted">
            {t.saveContents}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleClick}
              disabled={state === 'saving' || title.trim().length === 0}
              className={btnClass('accent', 'sm')}
            >
              {state === 'saving' ? t.saveApplicationSaving : t.saveApplicationCta}
            </button>
            {/* Abbrechen discards the edited title back to the suggestion - there is
                no separate "open" step to close out of, the card is always mounted
                here, so "cancel" resets the field rather than hiding anything. */}
            <button
              type="button"
              onClick={() => setTitle(suggestedTitle)}
              disabled={state === 'saving'}
              className={btnClass('secondary', 'sm')}
            >
              {t.saveCancelCta}
            </button>
          </div>
          {state === 'signed_out' && (
            <p className="mt-2 text-sm text-muted">
              {t.saveApplicationSignedOutHint}{' '}
              <a href="/konto" target="_blank" rel="noopener noreferrer" className="underline">
                {t.kontoLink}
              </a>
            </p>
          )}
          {state === 'limit' && (
            <div className="mt-2">
              <StorageGate onChoosePass={onRequestPass} />
            </div>
          )}
          {state === 'error' && (
            <p className="mt-2 text-sm text-red-600">{t.saveApplicationErrorHint}</p>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {state === 'saved' ? t.saveApplicationSaved : ''}
      </span>
    </div>
  )
}

function ErrorView({
  message,
  resumeText,
  onRetry,
}: {
  message: string
  resumeText: string
  onRetry: () => void
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4" role="alert">
      <div className="rounded-lg border border-red-100 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">
          {t.errorTitle}
        </p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      <button
        onClick={onRetry}
        disabled={resumeText.trim().length === 0}
        className={`${btnClass('primary')} self-start`}
      >
        {t.tryAgain}
      </button>
    </div>
  )
}

function JunkView({
  resumeText,
  onTextChange,
  onRetry,
}: {
  resumeText: string
  onTextChange: (text: string) => void
  onRetry: () => void
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4" role="alert">
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-700">
          {t.junkTitle}
        </p>
        <p className="mt-1 text-sm text-amber-600">
          {t.junkBody}
        </p>
        <p className="mt-2 text-sm text-amber-600">
          {t.junkTip}
        </p>
      </div>

      {/* Preserve pasted text so user can fix/expand it (D-17) */}
      <textarea
        value={resumeText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={t.junkPlaceholder}
        rows={12}
        className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={t.resumeAriaLabel}
      />
      <button
        onClick={onRetry}
        disabled={resumeText.trim().length === 0}
        className={`${btnClass('primary')} self-start`}
      >
        {t.tryAgain}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cover letter views
// ---------------------------------------------------------------------------

function CoverLetterInputView({
  jobPosting,
  answers,
  onJobPostingChange,
  onAnswerChange,
  onSubmit,
  onBack,
}: {
  jobPosting: string
  answers: { id: string; answer: string }[]
  onJobPostingChange: (v: string) => void
  onAnswerChange: (id: string, v: string) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const { lang, t } = useLang()
  const POSTING_LIMIT = 15_000
  const ANSWER_LIMIT = 2_000
  const postingOverLimit = jobPosting.length > POSTING_LIMIT
  const postingNearLimit = jobPosting.length > POSTING_LIMIT * 0.8
  const anyAnswerOverLimit = answers.some((a) => a.answer.length > ANSWER_LIMIT)
  const canSubmit = jobPosting.trim().length > 0 && !postingOverLimit && !anyAnswerOverLimit

  // Questions re-derived from the current jobPosting (same conditional-question logic
  // the reducer uses for SET_JOB_POSTING) so the rendered label always matches the
  // active UI language and the current posting's conditional questions.
  const questions = questionsForPosting(jobPosting)

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={2} />

      <div>
        <h2 className="font-serif text-3xl font-semibold text-ink mb-2">
          {t.clHeadline}
        </h2>
        <p className="text-sm text-muted">
          {t.clIntro}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink">
          {t.jobPostingLabel} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={jobPosting}
          onChange={(e) => onJobPostingChange(e.target.value)}
          placeholder={t.jobPostingPlaceholder}
          rows={8}
          className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={t.jobPostingAria}
        />
        {postingNearLimit && (
          <p className={`text-sm text-right ${postingOverLimit ? 'text-red-500' : 'text-muted'}`}>
            {jobPosting.length.toLocaleString('de-DE')} / 15.000
            {postingOverLimit && ` – ${t.tooLongSuffix}`}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-ink">
          {t.questionsIntro}
        </p>
        {answers.map((a, i) => {
          const question = questions.find((q) => q.id === a.id)
          return (
            <div key={a.id} className="flex flex-col gap-1">
              <label className="text-sm text-muted">{question?.[lang] ?? ''}</label>
              <textarea
                value={a.answer}
                onChange={(e) => onAnswerChange(a.id, e.target.value)}
                rows={2}
                className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                aria-label={t.answerAria(i + 1)}
              />
              {a.answer.length > ANSWER_LIMIT * 0.8 && (
                <p className={`text-sm text-right ${a.answer.length > ANSWER_LIMIT ? 'text-red-500' : 'text-muted'}`}>
                  {a.answer.length.toLocaleString('de-DE')} / 2.000
                  {a.answer.length > ANSWER_LIMIT && ` – ${t.answerTooLong}`}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Native-speaker nudge (D-09 moved from prompt to UI) – same advisory callout role
          as the identical note in CoverLetterResultView, so both use NORM_NOTE rather
          than a one-off amber treatment. */}
      <div className={NORM_NOTE}>
        <p className="text-sm text-ink-soft">
          {t.nativeSpeakerNote}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={btnClass('primary')}
        >
          {t.submitLetterCta}
        </button>
        <button
          onClick={onBack}
          className={btnClass('secondary')}
        >
          {t.backToLebenslauf}
        </button>
      </div>
    </div>
  )
}

function CoverLetterStreamingView({ letterText }: { letterText: string }) {
  // Not an aria-live region: the container re-renders on every streamed chunk, and an
  // aria-live wrapper around that would make screen readers announce the letter
  // word-by-word as it streams in. Instead, a separate visually-hidden role="status"
  // below announces only the start/completion transitions.
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={3} />
      <p className={EYEBROW}>{t.streamingSectionLabel}</p>
      {letterText ? (
        // Same print-sheet presentation as the result view, so the transition from
        // streaming → result doesn't change the document's visual identity.
        <div className="doc-sheet px-8 py-10 sm:px-12 sm:py-14" lang="de">
          {/* Render as preformatted text – no dangerouslySetInnerHTML (T-02-01 XSS guard) */}
          <pre className="whitespace-pre-wrap font-serif-text text-lg leading-[1.7] text-ink [hyphens:auto]">
            {letterText}
            <span aria-hidden="true" className="stream-caret">▍</span>
          </pre>
        </div>
      ) : (
        <div className="doc-sheet px-8 py-10 sm:px-12 sm:py-14">
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-4 w-3/4 rounded bg-faint" />
            <div className="h-4 w-2/3 rounded bg-faint" />
            <div className="h-4 w-1/2 rounded bg-faint" />
            <div className="mt-3 h-4 w-4/5 rounded bg-faint" />
            <div className="h-4 w-3/5 rounded bg-faint" />
          </div>
        </div>
      )}
      <p className="text-sm text-muted">
        {letterText ? t.streamingInProgress : t.streamingComposing}
      </p>
      <span className="sr-only" role="status">
        {letterText ? '' : t.streamingAriaGenerating}
      </span>
    </div>
  )
}

function CoverLetterResultView({
  letterText,
  setLetterText,
  jobPosting,
  onRegenerate,
  onReset,
  onExportPdf,
  onNewLetter,
  paketUnlocked,
  paketPi,
  onRequestPaket,
  onSavePackage,
  onRequestPass,
  cvs,
  currentCvText,
}: {
  letterText: string
  setLetterText: (text: string) => void
  jobPosting: string
  onRegenerate: () => void
  onReset: () => void
  onExportPdf: () => void
  onNewLetter: () => void
  /** Bewerbungspaket unlock state, owned by AppShell. paketPi is the succeeded
   * PaymentIntent id; it doubles as the prepaid token for the included
   * Humanizer+ refinement (HumanizerModal skips payment while it is unspent). */
  paketUnlocked: boolean
  paketPi: string | null
  onRequestPaket: () => void
  /** Stage 3 accounts: saves the current Lebenslauf + letter under the given
   * title, optionally attaching to an existing cvs row. Renders nothing via
   * SaveApplicationButton when accounts are disabled. */
  onSavePackage: (title: string, existingCvId?: string) => Promise<SaveResult | 'signed_out'>
  /** Opens PassModal (07-07) - passed straight through to SaveApplicationButton. */
  onRequestPass: () => void
  /** Signed-in user's saved CVs, for the attach-or-new radio. */
  cvs: CvRow[]
  /** The CV text this application was generated from (state.resumeText). */
  currentCvText: string
}) {
  const { t } = useLang()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  // One-shot edit hint – dismissed on first interaction (D-06)
  const [showEditHint, setShowEditHint] = useState(true)
  const [humanizerOpen, setHumanizerOpen] = useState(false)
  // Pre-refinement letter, kept so the user can restore (null = not refined yet)
  const [originalLetter, setOriginalLetter] = useState<string | null>(null)
  // This view only mounts once the letter is done streaming – announce completion
  // once on mount, then clear so it doesn't linger as stale status text.
  const [readyAnnouncement, setReadyAnnouncement] = useState(t.readyAnnouncement)
  // Deliberately empty deps: announce-once-on-mount only. t.readyAnnouncement is read
  // once into initial state above, not referenced here, so no exhaustive-deps issue.
  useEffect(() => {
    const timeoutId = setTimeout(() => setReadyAnnouncement(''), 1000)
    return () => clearTimeout(timeoutId)
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letterText)
      track('copy_download', { kind: 'letter_copy' })
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 3000)
    }
  }

  function handleDownload() {
    const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'anschreiben.txt'
    a.click()
    URL.revokeObjectURL(url)
    track('copy_download', { kind: 'letter_download' })
  }

  const HUMANIZER_LIMIT = 10_000
  const letterOverHumanizerLimit = letterText.length > HUMANIZER_LIMIT

  return (
    <div className="flex flex-col gap-6">
      {/* Announces the streaming→result transition once, then clears itself */}
      <span className="sr-only" role="status">{readyAnnouncement}</span>

      <StepIndicator current={3} />

      {/* Peak-end completion framing – the flow's final view, so it opens on the
          finish line rather than restating the section label first (D-XX). One-time
          rise-in on mount underscores the completion moment. */}
      <div className="phase-enter">
        <h2 className="font-serif text-3xl font-semibold text-ink mb-2">
          {t.clResultHeadline}
        </h2>
        <p className="text-sm text-muted">
          {t.clResultSubline}
        </p>
      </div>

      {/* Header: section label */}
      <p className={EYEBROW}>{t.streamingSectionLabel}</p>

      {/* One-shot click-to-edit hint – hidden after first interaction */}
      {showEditHint && (
        <p className="text-sm text-muted">{t.clickToEdit}</p>
      )}

      {/* Print-sheet presentation – the letter reads like a document, not a form field.
          Textarea inside is borderless/transparent; the sheet itself carries the focus
          ring via focus-within (hairline → accent, see .doc-sheet in globals.css). */}
      <div className="doc-sheet px-8 py-10 sm:px-12 sm:py-14 phase-enter" lang="de">
        {/* Editable letter block – plain controlled textarea, NOT EditableField (rows={3} hardcoded there)
            Letter is read-only during streaming; editing available only here in cover_letter_result (D-06)
            No dangerouslySetInnerHTML – XSS guard (T-02-05) */}
        <textarea
          value={letterText}
          onChange={(e) => {
            setLetterText(e.target.value)
            if (showEditHint) setShowEditHint(false)
          }}
          onFocus={() => { if (showEditHint) setShowEditHint(false) }}
          rows={18}
          className="w-full resize-y border-0 bg-transparent px-0 py-0 font-serif-text text-lg leading-[1.7] text-ink [hyphens:auto] placeholder:text-muted focus:outline-none focus:ring-0"
          aria-label={t.letterAria}
        />
      </div>

      {/* Native-speaker trust callout – distinct block below letter (D-09 / CL-05)
          This callout (+ grounding in prompts.ts) is how CL-04/CL-05 surface in the UI */}
      <div className={NORM_NOTE}>
        <p className={`${EYEBROW} mb-1`}>{t.noteLabel}</p>
        <p className="text-sm text-muted">
          {t.noteBody}
        </p>
      </div>

      {/* Visually-hidden live mirror so screen readers announce copy state changes
          without making the visible error paragraph itself a chatty aria-live region. */}
      <span className="sr-only" aria-live="polite">
        {copyState === 'copied' ? t.copied : copyState === 'error' ? t.copyFailedAria : ''}
      </span>

      {/* Inline copy error (transient 3000ms) */}
      {copyState === 'error' && (
        <p className="text-sm text-red-600">
          {t.copyFailed}
        </p>
      )}

      {/* Action row – flex, gap-3, wraps on mobile (CL-06 / D-07) */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Humanizer+ upsell – one-shot purchase, additive refinement (spec D1/D3) */}
        {paymentsEnabled() && (
          <button
            onClick={() => setHumanizerOpen(true)}
            disabled={letterOverHumanizerLimit}
            aria-label={t.humanizerCtaAria}
            className={btnClass('accent')}
          >
            {t.humanizerCta}
          </button>
        )}

        {/* Copy – primary button (CL-06) */}
        <button
          onClick={handleCopy}
          aria-label={t.copyLetterAria}
          className={btnClass('primary')}
        >
          {copyState === 'copied' ? t.copied : t.copyLetter}
        </button>

        {/* Download .txt – browser-native Blob, no server round-trip (D-07) */}
        <button
          onClick={handleDownload}
          aria-label={t.downloadAria}
          className={`${btnClass('secondary')} shrink-0`}
        >
          {t.downloadCta}
        </button>

        {/* Export as PDF – browser print-to-PDF (window.print()), no server round-trip,
            no PDF library. Gated behind the Bewerbungspaket (4,99 € one-shot per
            application): locked, the button opens the purchase modal; unlocked, it
            routes through the single onExportPdf seam (AppShell's
            handleExportLetterPdf). Copy and the .txt download stay free. */}
        {(paketUnlocked || paymentsEnabled()) && (
          <button
            onClick={() => (paketUnlocked ? onExportPdf() : onRequestPaket())}
            aria-label={t.exportPdfAria}
            className={`${btnClass('secondary')} shrink-0`}
          >
            {paketUnlocked ? t.exportPdfCta : t.paketLockedExportCta}
          </button>
        )}

        {/* Regenerate – re-runs same jobPosting + answers from reducer state */}
        <button
          onClick={onRegenerate}
          aria-label={t.regenerateAria}
          className={`${btnClass('secondary')} shrink-0`}
        >
          {t.regenerateCta}
        </button>

        {/* Start over – dispatches RESET; no confirmation (D-06 / D-16) */}
        <button
          onClick={onReset}
          aria-label={t.resetAria}
          className={`${btnClass('secondary')} shrink-0`}
        >
          {t.resetCta}
        </button>
      </div>

      {/* Stage 3 accounts: save this Lebenslauf + letter. Renders nothing when
          accounts are disabled. */}
      <SaveApplicationButton
        onSave={onSavePackage}
        onRequestPass={onRequestPass}
        jobPosting={jobPosting}
        cvs={cvs}
        currentCvText={currentCvText}
      />

      {/* Honest price anchor – one line, muted, sits with the Humanizer+ CTA context */}
      <p className="text-sm text-muted">
        {t.priceAnchor}
      </p>

      {/* Over-limit hint – only rendered when the letter exceeds the Humanizer+ cap */}
      {letterOverHumanizerLimit && (
        <p className="text-sm text-muted">
          {t.overHumanizerLimit(letterText.length.toLocaleString('en-US'))}
        </p>
      )}

      {/* .txt-only forewarning – sets expectations until PDF export ships */}
      <p className="text-sm text-muted">
        {t.txtForewarning}
      </p>

      {/* Print-dialog hint – only meaningful once the export is unlocked */}
      {paketUnlocked && (
        <p className="text-sm text-muted">
          {t.exportPdfHint}
        </p>
      )}

      {originalLetter !== null && (
        <button
          onClick={() => {
            setLetterText(originalLetter)
            setOriginalLetter(null)
          }}
          className={`${btnClass('secondary')} self-start`}
        >
          {t.restoreOriginal}
        </button>
      )}

      {/* Continuation path – always shown as the final block, not gated on copyState
          so it doesn't disappear if the user never uses the copy button (e.g. downloads
          or copies via keyboard selection instead). */}
      <div className="border-t border-hair pt-6">
        <p className="text-sm text-muted mb-3">
          {t.continuationIntro}
        </p>
        <button onClick={onNewLetter} className={btnClass('secondary')}>
          {t.newLetterCta}
        </button>
      </div>

      {/* Rendered only once opened – next/dynamic's import() fires on first render of this
          element, and the module-level loadStripe() call would fetch Stripe.js (and its
          fraud-prevention cookies) as soon as the letter finishes, not on the actual click,
          if this were mounted unconditionally with open={false}. */}
      {humanizerOpen && (
        <HumanizerModal
          letterText={letterText}
          recommended={recommendDirection(jobPosting, letterText)}
          prepaidPaymentIntentId={paketPi}
          onClose={() => setHumanizerOpen(false)}
          onDone={(refined) => {
            setOriginalLetter((prev) => prev ?? letterText)
            setLetterText(refined)
            setHumanizerOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fetch failure → client-facing message mapping
// ---------------------------------------------------------------------------

/**
 * Maps a non-ok fetch Response to a client message in the active UI language.
 * Status 429/403 get dedicated localized copy (rate-limit / same-origin block:
 * never server-authored, so there's no German-only string to preserve). Everything
 * else falls through to the server's own `error` field when present.
 *
 * ponytail: the server's 400 error bodies are always German (see api/parse and
 * api/cover-letter route.ts), even when the active UI language is English. This is
 * a known simplification: localizing every server-side validation message would
 * require duplicating them in prompts/route code, which isn't worth it for the
 * handful of body-shape/length-limit errors that hit this path. Left as-is.
 */
async function describeFetchFailure(
  res: Response,
  t: ReturnType<typeof useLang>['t'],
  fallback: string
): Promise<string> {
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After'))
    const minutes = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter / 60) : null
    return t.rateLimited(minutes)
  }
  if (res.status === 403) {
    return t.requestBlocked
  }
  const body = await res.json().catch(() => ({}))
  return (body as { error?: string }).error ?? fallback
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function AppShell() {
  const { t } = useLang()
  const { user, loading: accountLoading } = useAccount()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [letterText, setLetterText] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  // Which document (if any) is currently mounted into #print-root for a
  // window.print() call – single source of truth so only one print-only
  // region is ever live at a time, regardless of which result view triggered
  // it. See handlePrintLebenslauf / handlePrintLetter below and the
  // body.printing-lebenslauf / body.printing-letter CSS toggle in globals.css.
  const [printJob, setPrintJob] = useState<
    | { kind: 'lebenslauf'; lebenslauf: Lebenslauf; sectionOrder: string[]; photoUrl: string | null; ortDatum: string }
    | { kind: 'letter'; letterText: string }
    | null
  >(null)

  // Bewerbungspaket unlock: the succeeded PaymentIntent id (null = locked).
  // Server-verified before it ever unlocks anything; persisted in
  // sessionStorage so a reload within the session doesn't re-charge. Per
  // application by design ("pro Bewerbung", spec D3): RESET clears it.
  const [paketPi, setPaketPi] = useState<string | null>(null)
  const [paketOpen, setPaketOpen] = useState(false)

  // Bewerbungsphase-Pass (07-07): a standing DB-row entitlement, not a Stripe
  // PI token, so its status is read fresh from the account.ts helpers rather
  // than persisted in sessionStorage. passRow is the most recent pass_30d row
  // (active or expired, or null if the user never bought one) - fed straight
  // into PassStatusChip, which derives active/expired via checkPassEntitlement.
  // packageCount is the signed-in user's saved-application count, shown as the
  // storage meter's numerator once a Pass is active.
  const [passRow, setPassRow] = useState<{ expires_at: string } | null>(null)
  const [packageCount, setPackageCount] = useState(0)
  const [passOpen, setPassOpen] = useState(false)

  // Signed-in user's saved CVs (`cvs` table rows), fetched alongside the Pass
  // status below. Feeds the save flow's attach-or-new radio (SaveApplicationButton):
  // bestCvMatch(currentCvText, cvs) preselects "attach" when an existing CV
  // clearly matches, else "save as new" (today's only historical behavior).
  const [cvs, setCvs] = useState<CvRow[]>([])

  // Fetches the signed-in user's Pass status + saved-application count + saved
  // CVs. getActivePass is the same RLS-scoped entitlement source the fulfillment
  // routes (/api/humanize, /api/paket/verify) use server-side; when it's null
  // the most recent Pass may simply have lapsed, so getLatestPass (no expiry
  // filter) sources the real date for the neutral expired chip. `cancelled`
  // is an optional guard for the mount effect below (same idiom as
  // SavedApplications' own fetch effect); handlePassPurchased below fires it
  // without one since the modal it responds to is unmounting either way.
  async function refreshPassStatus(cancelled?: () => boolean) {
    if (!accountsEnabled() || !user) {
      if (!cancelled?.()) {
        setPassRow(null)
        setPackageCount(0)
        setCvs([])
      }
      return
    }
    const client = getSupabaseBrowserClient()
    const active = await getActivePass(client, user.id)
    const [row, packages, userCvs] = await Promise.all([
      active ? Promise.resolve(active) : getLatestPass(client, user.id),
      listPackages(client, user.id),
      listCvs(client, user.id),
    ])
    if (cancelled?.()) return
    setPassRow(row)
    setPackageCount(packages.length)
    setCvs(userCvs)
  }

  useEffect(() => {
    let cancelled = false
    // Same accepted pattern as SavedApplications'/StorageGate's own mount-time
    // data-fetch effects in this file: an async read that resolves into local
    // state has no non-effect equivalent here (there is no external
    // subscription to attach to - it's a one-shot Supabase read).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshPassStatus(() => cancelled)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshPassStatus closes over `user`, which is the deliberate trigger
  }, [user])

  function handlePassPurchased() {
    setPassOpen(false)
    refreshPassStatus()
  }

  // Restore a paid Paket after a reload: never trust the stored id alone,
  // ask the server (Stripe) whether it is a succeeded paket PI. On a definitive
  // rejection (402: wrong_feature / not_paid) drop the stored id; on transient
  // failures (network / 502 / 503) keep it stored but stay locked, the next
  // mount retries.
  useEffect(() => {
    const stored = (() => {
      try {
        const raw = sessionStorage.getItem(PAKET_PURCHASE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return typeof parsed?.paymentIntentId === 'string' ? (parsed.paymentIntentId as string) : null
      } catch {
        return null
      }
    })()
    if (!stored) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/paket/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: stored }),
        })
        if (cancelled) return
        if (res.ok) {
          setPaketPi(stored)
        } else if (res.status === 402) {
          sessionStorage.removeItem(PAKET_PURCHASE_KEY)
        }
      } catch {
        // transient: stay locked, keep the stored id for the next attempt
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function handlePaketUnlocked(paymentIntentId: string) {
    try {
      sessionStorage.setItem(PAKET_PURCHASE_KEY, JSON.stringify({ paymentIntentId }))
    } catch {
      // storage unavailable (private mode edge case): the in-memory unlock still works
    }
    setPaketPi(paymentIntentId)
    setPaketOpen(false)
  }

  function clearPaket() {
    try {
      sessionStorage.removeItem(PAKET_PURCHASE_KEY)
    } catch {
      // ignore: nothing stored
    }
    setPaketPi(null)
  }

  // Abort any in-flight cover-letter request on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // Drives the print-to-PDF flow: once a printJob mounts #print-root's content
  // and the matching body.printing-* class, wait one paint (rAF) so the browser
  // has laid out the print-only DOM before calling window.print() – then clear
  // the job on the browser's own afterprint event, whether the user printed,
  // saved as PDF, or cancelled the dialog (all three fire afterprint).
  useEffect(() => {
    if (!printJob) return
    const bodyClass = printJob.kind === 'lebenslauf' ? 'printing-lebenslauf' : 'printing-letter'
    document.body.classList.add(bodyClass)

    function cleanup() {
      document.body.classList.remove(bodyClass)
      setPrintJob(null)
    }
    window.addEventListener('afterprint', cleanup)

    const raf = requestAnimationFrame(() => {
      window.print()
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('afterprint', cleanup)
      document.body.classList.remove(bodyClass)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- printJob identity change is the only trigger; bodyClass is derived from it
  }, [printJob])

  // Warn before leaving the tab once there's real work in progress – anything past
  // 'input' has either an in-flight request or unsaved generated content the user
  // would lose on an accidental reload/close.
  useEffect(() => {
    const guardedPhases: AppPhase[] = [
      'result',
      'cover_letter_input',
      'cover_letter_streaming',
      'cover_letter_result',
    ]
    if (!guardedPhases.includes(state.phase)) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.phase])

  // Explicit user action only (no auto-save – zero-retention guardrail). Re-checks
  // auth via the browser client at click time (not just AccountProvider's context
  // state), since the user may have signed in from another tab after this page
  // mounted. Returns a typed outcome the two result views render feedback for.
  async function handleSavePackage(
    anschreiben: string | null,
    packageTitle: string,
    existingCvId?: string
  ): Promise<SaveResult | 'signed_out'> {
    if (!accountsEnabled()) return { ok: false, reason: 'error', message: 'accounts_disabled' }
    const client = getSupabaseBrowserClient()
    const {
      data: { user: freshUser },
    } = await client.auth.getUser()
    if (!freshUser) return 'signed_out'
    if (!state.lebenslauf) return { ok: false, reason: 'error', message: 'no_lebenslauf' }

    const questions = questionsForPosting(state.jobPosting)
    return saveApplicationPackage(client, freshUser.id, {
      cvText: state.resumeText,
      existingCvId,
      jobPosting: state.jobPosting || null,
      answers: answersToWire(state.answers, questions),
      lebenslauf: stripUids(state.lebenslauf),
      anschreiben,
      packageTitle,
    })
  }

  async function handleGenerateLetter() {
    // Explicit guard instead of a non-null assertion: this path is only reachable
    // after PARSE_SUCCESS today, but the invariant is implicit and a future phase-graph
    // refactor could make lebenslauf null here and crash toPlainText(null) (IN-02).
    if (!state.lebenslauf) return
    const cvText = toPlainText(stripUids(state.lebenslauf), state.sectionOrder)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    dispatch({ type: 'COVER_LETTER_STREAMING' })
    setLetterText('')
    try {
      // API contract is {question, answer}[] with the ENGLISH question text
      // (buildCoverLetterUser in prompts.ts embeds it verbatim): this keeps the
      // prompt sent to the model deterministic regardless of the applicant's UI
      // language. Reducer state stores {id, answer}[] so answers survive an EN/DE
      // toggle; translate to the wire shape here, at the request boundary.
      const questions = questionsForPosting(state.jobPosting)
      const wireAnswers = state.answers.map((a) => ({
        question: questions.find((q) => q.id === a.id)?.en ?? '',
        answer: a.answer,
      }))
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobPosting: state.jobPosting, answers: wireAnswers }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        // Surface a controlled message – never render the raw server body, which
        // could be an HTML error page, gateway text, or stack-trace-ish output
        // from an upstream proxy/5xx (WR-01). 429/403 get dedicated localized copy;
        // other 4xxs fall back to the server's (German, authoritative) error field.
        dispatch({
          type: 'COVER_LETTER_ERROR',
          payload: res.ok
            ? t.generationFailedOk
            : await describeFetchFailure(res, t, t.generationFailedFallback),
        })
        return
      }
      const reader = res.body.getReader()
      // stream:true is MANDATORY – prevents umlaut corruption (ä/ö/ü split across chunks)
      const decoder = new TextDecoder('utf-8', { fatal: false })
      // Local mirror of the streamed text – the `letterText` React state is stale
      // inside this closure, so post-stream decisions must read `acc` (WR-05).
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) {
          acc += chunk
          setLetterText((prev) => prev + chunk)
        }
      }
      // Flush any remaining bytes buffered by the streaming decoder
      const tail = decoder.decode()
      if (tail) {
        acc += tail
        setLetterText((prev) => prev + tail)
      }
      if (acc.trimStart().startsWith(INVALID_INPUT_SENTINEL)) {
        dispatch({
          type: 'COVER_LETTER_ERROR',
          payload: t.invalidInputCoverLetter,
        })
        return
      }
      // A stream can end cleanly but empty (thinking-only output, refusal, or a
      // max_tokens cut with zero text deltas). Guard the done transition on
      // non-empty content so the user never sees a blank "successful" letter (WR-02).
      if (acc.trim().length === 0) {
        dispatch({
          type: 'COVER_LETTER_ERROR',
          payload: t.emptyLetter,
        })
        return
      }
      track('letter_done')
      dispatch({ type: 'COVER_LETTER_DONE' })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      dispatch({ type: 'COVER_LETTER_ERROR', payload: t.networkErrorLetter })
    }
  }

  // Shared CV-parse driver used by both the initial submit and the retry paths.
  // Both entry points dispatch SUBMIT first, then run identical fetch/parse/dispatch
  // logic – extracted here so the 422 / empty-Lebenslauf / error handling can never
  // silently diverge between the two callers.
  async function runParse() {
    dispatch({ type: 'SUBMIT' })
    track('cv_submitted')

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: state.resumeText }),
      })

      if (res.status === 422) {
        dispatch({ type: 'PARSE_JUNK' })
        return
      }

      if (!res.ok) {
        dispatch({
          type: 'PARSE_ERROR',
          payload: await describeFetchFailure(res, t, t.parseFailedFallback),
        })
        return
      }

      const data = (await res.json()) as { lebenslauf: Lebenslauf }

      if (isLebenslaufBasicallyEmpty(data.lebenslauf)) {
        dispatch({ type: 'PARSE_JUNK' })
        return
      }

      track('parse_done')
      dispatch({ type: 'PARSE_SUCCESS', payload: data.lebenslauf })
    } catch {
      dispatch({
        type: 'PARSE_ERROR',
        payload: t.networkErrorParse,
      })
    }
  }

  async function handleSubmit() {
    await runParse()
  }

  async function handleRetry() {
    await runParse()
  }

  // Full start-over: clears the reducer AND the Bewerbungspaket unlock. The
  // Paket is "pro Bewerbung" (spec D3): a new application is a new purchase.
  // Deliberately NOT cleared by onNewLetter (new posting, same Lebenslauf):
  // re-locking a just-paid export mid-session would read as exactly the trap
  // pattern the /preise page positions against.
  function handleReset() {
    clearPaket()
    dispatch({ type: 'RESET' })
  }

  // ---------------------------------------------------------------------------
  // Print / PDF export – single seam per document, gated in the result views
  // behind the Bewerbungspaket unlock (paketPi). Both route through printJob
  // state above, which mounts the matching PrintSheet component into
  // #print-root and triggers window.print() via the printJob effect. No PDF
  // library, no server round-trip: entirely the browser's native
  // print-to-PDF pipeline.
  // ---------------------------------------------------------------------------
  function handleExportLebenslaufPdf(ortDatum: string) {
    if (!state.lebenslauf) return
    track('copy_download', { kind: 'lebenslauf_pdf' })
    setPrintJob({
      kind: 'lebenslauf',
      lebenslauf: stripUids(state.lebenslauf),
      sectionOrder: state.sectionOrder,
      photoUrl: state.photoUrl,
      ortDatum,
    })
  }

  function handleExportLetterPdf() {
    track('copy_download', { kind: 'letter_pdf' })
    setPrintJob({ kind: 'letter', letterText })
  }

  // Opens a saved application package into the tool. cv_text lives on the
  // separate `cvs` row (account.ts's ApplicationPackageRow only carries
  // cv_id), so this reads it directly via the browser client rather than
  // extending account.ts's query shape. Wire answers ({question: en-text,
  // answer}) are mapped back to reducer-state {id, answer} by matching against
  // the current question list for the stored posting; unmatched stored answers
  // are dropped. Opening a read_only package is allowed (view/copy): re-saving
  // always inserts a NEW row, which the DB limit trigger blocks for free
  // accounts, so the read-only row itself can never be overwritten.
  async function handleLoadPackage(pkg: ApplicationPackageRow) {
    const client = getSupabaseBrowserClient()
    // pkg.cv_id is null when the source CV was later deleted (migration 0004's
    // `on delete set null` FK) -- the package still renders from its own
    // snapshotted lebenslauf/anschreiben, so only run the cvs lookup when a
    // live cv_id exists; otherwise fall back to an empty CV text rather than
    // querying with a null id (T-08-09).
    const cv = pkg.cv_id
      ? (await client.from('cvs').select('cv_text').eq('id', pkg.cv_id).maybeSingle()).data
      : null
    const jobPosting = pkg.job_posting ?? ''
    const questions = questionsForPosting(jobPosting)
    dispatch({
      type: 'LOAD_PACKAGE',
      payload: {
        resumeText: (cv as { cv_text?: string } | null)?.cv_text ?? '',
        lebenslauf: pkg.lebenslauf,
        jobPosting,
        answers: wireAnswersToIds(pkg.answers, questions),
      },
    })
    if (pkg.anschreiben) {
      setLetterText(pkg.anschreiben)
      dispatch({ type: 'COVER_LETTER_DONE' })
    }
  }

  // "Neue Bewerbung aus dieser": loads the package's CV + Lebenslauf via the
  // same LOAD_PACKAGE action as handleLoadPackage, but with an EMPTY posting
  // step and no restored Anschreiben - a fresh tailoring pass on the same
  // Lebenslauf, never an implicit save. The duplicate is only ever persisted
  // if the user later clicks Speichern, which inserts a NEW row and goes
  // through the same DB limit trigger as any other save.
  async function handleDuplicatePackage(pkg: ApplicationPackageRow) {
    const client = getSupabaseBrowserClient()
    // Same null-cv_id guard as handleLoadPackage above (T-08-09).
    const cv = pkg.cv_id
      ? (await client.from('cvs').select('cv_text').eq('id', pkg.cv_id).maybeSingle()).data
      : null
    const questions = questionsForPosting('')
    dispatch({
      type: 'LOAD_PACKAGE',
      payload: {
        resumeText: (cv as { cv_text?: string } | null)?.cv_text ?? '',
        lebenslauf: pkg.lebenslauf,
        jobPosting: '',
        answers: wireAnswersToIds(pkg.answers, questions),
      },
    })
  }

  // Cross-page bridge from /konto, which has no tool reducer of its own:
  // ?package=<id>&action=open|duplicate loads that package here once the
  // user's session is known, then strips the query string so a later reload
  // doesn't repeat it. Plain window.location parsing (not next/navigation's
  // useSearchParams) so this client component doesn't need a Suspense
  // boundary just for a one-shot deep link.
  //
  // ?cv=<id> is the CV-reuse variant (08-03's "Neue Bewerbung mit diesem CV" /
  // "Ansehen" kebab actions on /konto's Meine Lebenslaeufe section): it fetches
  // that single cvs row directly (RLS cvs_select_own scopes the read to the
  // owner, so a foreign id resolves to null and changes nothing) and dispatches
  // SET_RESUME_TEXT with its cv_text. It deliberately leaves state.phase at
  // 'input' rather than auto-submitting -- the user still has to click Convert,
  // matching the explicit-action guardrail already documented on
  // handleSavePackage (no silent auto-parse from a mere navigation).
  useEffect(() => {
    if (accountLoading || !accountsEnabled() || !user) return
    const params = new URLSearchParams(window.location.search)
    const packageId = params.get('package')
    const cvId = params.get('cv')
    if (!packageId && !cvId) return
    const action = params.get('action')
    window.history.replaceState(null, '', window.location.pathname)
    ;(async () => {
      const client = getSupabaseBrowserClient()
      if (packageId) {
        const pkg = await getPackage(client, packageId)
        if (!pkg) return
        if (action === 'duplicate') {
          await handleDuplicatePackage(pkg)
        } else {
          await handleLoadPackage(pkg)
        }
        return
      }
      const { data } = await client
        .from('cvs')
        .select('cv_text')
        .eq('id', cvId as string)
        .maybeSingle()
      const cvText = (data as { cv_text?: string } | null)?.cv_text
      if (typeof cvText === 'string') {
        dispatch({ type: 'SET_RESUME_TEXT', payload: cvText })
      }
    })()
  }, [accountLoading, user])

  return (
    <>
      {/* Top-bar wordmark – links back to the landing (UI-SPEC §F item 2). Same centered
          max-w-4xl container as the landing nav (src/app/page.tsx) for visual parity
          between marketing and tool. Language toggle sits on the right of the same row. */}
      <div className="border-b border-hair h-14 flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full flex items-center justify-between">
          <a href="/" className="text-sm font-semibold text-ink tracking-tight">
            ScanReady
            <span className="text-eyebrow font-mono text-sm ml-1">DE</span>
          </a>
          <div className="flex items-center gap-4">
            <PassStatusChip pass={passRow} packageCount={packageCount} compact />
            <AccountMenu />
            <LangToggle />
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 items-center bg-paper font-sans px-4 py-8 sm:py-12">
      <main aria-label="ScanReady tool" className={`w-full max-w-4xl flex-col ${CARD} px-6 py-10 sm:px-12 sm:py-12`}>
        {/* Each phase view's root is keyed by phase + wrapped in .phase-enter so a phase
            transition always mounts fresh and replays the 200ms rise-in (shared motion
            pattern with the reveal-stagger / doc-sheet completion moments above). */}
        {state.phase === 'input' && (
          <div key={state.phase} className="phase-enter">
            <InputView
              resumeText={state.resumeText}
              onTextChange={(text) => dispatch({ type: 'SET_RESUME_TEXT', payload: text })}
              onSubmit={handleSubmit}
              onLoadPackage={handleLoadPackage}
              onDuplicatePackage={handleDuplicatePackage}
            />
          </div>
        )}

        {state.phase === 'loading' && (
          <div key={state.phase} className="phase-enter">
            <LoadingView />
          </div>
        )}

        {state.phase === 'result' && state.lebenslauf && (
          <div key={state.phase} className="phase-enter">
            <ResultView
              lebenslauf={state.lebenslauf}
              sectionOrder={state.sectionOrder}
              photoUrl={state.photoUrl}
              photoTransform={state.photoTransform}
              dispatch={dispatch}
              onReset={handleReset}
              onStartCoverLetter={() => dispatch({ type: 'START_COVER_LETTER' })}
              onExportPdf={handleExportLebenslaufPdf}
              paketUnlocked={paketPi !== null}
              onRequestPaket={() => setPaketOpen(true)}
              onSavePackage={(title, existingCvId) => handleSavePackage(null, title, existingCvId)}
              onRequestPass={() => setPassOpen(true)}
              jobPosting={state.jobPosting}
              cvs={cvs}
              currentCvText={state.resumeText}
            />
          </div>
        )}

        {state.phase === 'error' && (
          <div key={state.phase} className="phase-enter">
            <ErrorView
              message={state.errorMessage ?? t.errorGeneric}
              resumeText={state.resumeText}
              onRetry={handleRetry}
            />
          </div>
        )}

        {state.phase === 'junk' && (
          <div key={state.phase} className="phase-enter">
            <JunkView
              resumeText={state.resumeText}
              onTextChange={(text) => dispatch({ type: 'SET_RESUME_TEXT', payload: text })}
              onRetry={handleRetry}
            />
          </div>
        )}

        {state.phase === 'cover_letter_input' && (
          <div key={state.phase} className="phase-enter">
            <CoverLetterInputView
              jobPosting={state.jobPosting}
              answers={state.answers}
              onJobPostingChange={(v) => dispatch({ type: 'SET_JOB_POSTING', payload: v })}
              onAnswerChange={(id, v) => dispatch({ type: 'SET_ANSWER', payload: { id, answer: v } })}
              onSubmit={handleGenerateLetter}
              onBack={() => dispatch({ type: 'BACK_TO_RESULT' })}
            />
          </div>
        )}

        {state.phase === 'cover_letter_streaming' && (
          <div key={state.phase} className="phase-enter">
            <CoverLetterStreamingView letterText={letterText} />
          </div>
        )}

        {state.phase === 'cover_letter_result' && (
          <div key={state.phase} className="phase-enter">
            <CoverLetterResultView
              letterText={letterText}
              setLetterText={setLetterText}
              jobPosting={state.jobPosting}
              onRegenerate={handleGenerateLetter}
              onReset={handleReset}
              onExportPdf={handleExportLetterPdf}
              paketUnlocked={paketPi !== null}
              paketPi={paketPi}
              onRequestPaket={() => setPaketOpen(true)}
              onNewLetter={() => {
                // Clear only the posting – SET_JOB_POSTING('') resyncs the answer list
                // by question identity, so typed base answers (style/motivation) survive
                // and only job-specific questions reset. Answers are intentionally left
                // untouched otherwise.
                dispatch({ type: 'SET_JOB_POSTING', payload: '' })
                dispatch({ type: 'START_COVER_LETTER' })
              }}
              onSavePackage={(title, existingCvId) => handleSavePackage(letterText, title, existingCvId)}
              onRequestPass={() => setPassOpen(true)}
              cvs={cvs}
              currentCvText={state.resumeText}
            />
          </div>
        )}

        {/* cover_letter_error: reuse ErrorView – onRetry re-runs same inputs losslessly
            (jobPosting + answers persist in reducer through streaming/error phases) */}
        {state.phase === 'cover_letter_error' && (
          <div key={state.phase} className="phase-enter">
            <ErrorView
              message={state.errorMessage ?? t.generationFailedFallback}
              resumeText={state.jobPosting}
              onRetry={handleGenerateLetter}
            />
          </div>
        )}
      </main>
      </div>

      {/* Print-only region for the browser's native print-to-PDF flow (window.print(),
          driven by the printJob effect above). Invisible on screen (display:none via
          #print-root in globals.css) and out of the a11y tree – aria-hidden so it never
          surfaces to assistive tech while sitting in the DOM unprinted. Mounts exactly
          one document at a time, matching whichever body.printing-* class is active. */}
      <div id="print-root" aria-hidden="true">
        {printJob?.kind === 'lebenslauf' && (
          <PrintLebenslauf
            lebenslauf={printJob.lebenslauf}
            sectionOrder={printJob.sectionOrder}
            photoUrl={printJob.photoUrl}
            ortDatum={printJob.ortDatum}
          />
        )}
        {printJob?.kind === 'letter' && <PrintAnschreiben letterText={printJob.letterText} />}
      </div>

      {/* Bewerbungspaket purchase – mounted at shell level because both result views
          (Lebenslauf + Anschreiben) can open it. Conditionally mounted for the same
          Stripe.js-cookie reason as HumanizerModal. */}
      {paketOpen && (
        <PaketModal
          onClose={() => setPaketOpen(false)}
          onUnlocked={handlePaketUnlocked}
        />
      )}

      {/* Bewerbungsphase-Pass purchase (07-07) - mounted at shell level for the
          same reason as PaketModal: both result views' SaveApplicationButton can
          open it, and next/dynamic keeps Stripe.js out of the page until it does. */}
      {passOpen && (
        <PassModal
          onClose={() => setPassOpen(false)}
          onPurchased={handlePassPurchased}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Language toggle – EN / DE, top bar right side (change 1)
// ---------------------------------------------------------------------------

function LangToggle() {
  const { lang, setLang, t } = useLang()
  const langBtnClass = (active: boolean) =>
    `font-mono text-xs uppercase tracking-[0.18em] px-1.5 py-1 min-h-[44px] flex items-center transition-colors ${
      active ? 'text-ink' : 'text-muted hover:text-ink'
    }`
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t.switchLangLabel}>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={langBtnClass(lang === 'en')}
      >
        EN
      </button>
      <span className="text-eyebrow text-xs" aria-hidden="true">/</span>
      <button
        type="button"
        onClick={() => setLang('de')}
        aria-pressed={lang === 'de'}
        className={langBtnClass(lang === 'de')}
      >
        DE
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component – wraps AppShell in LangProvider so every descendant
// (including the top-bar toggle) can read/set the active UI language.
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <LangProvider>
      <AppShell />
    </LangProvider>
  )
}
