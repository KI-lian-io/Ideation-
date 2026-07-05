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
} from '@/lib/lebenslauf-utils'
import type { LebenslaufEditorState } from '@/lib/lebenslauf-utils'
import { LebenslaufEditor, reorder } from '@/components/LebenslaufEditor'
import type { LebenslaufAction } from '@/components/LebenslaufEditor'
import { NormGapPanel } from '@/components/NormGapPanel'
import { PERSONALIZATION_QUESTIONS, questionsForPosting, recommendDirection } from '@/lib/prompts'
import { INVALID_INPUT_SENTINEL } from '@/lib/sentinel'
import { btnClass, CARD, EYEBROW, NORM_NOTE } from '@/components/ui'
import { LangProvider, useLang } from '@/lib/i18n'

// Dynamic: keeps Stripe.js (and its cookies) out of the page until the modal opens.
const HumanizerModal = dynamic(() => import('@/components/HumanizerModal'), { ssr: false })

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
}

// AppAction union: page lifecycle actions + all Lebenslauf editor actions
type AppAction =
  | { type: 'SET_RESUME_TEXT'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'PARSE_SUCCESS'; payload: Lebenslauf }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'PARSE_JUNK' }
  | { type: 'RESET' }
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
  sectionOrder: ['personal', 'experience', 'education', 'skills', 'languages'],
  errorMessage: null,
  jobPosting: '',
  answers: PERSONALIZATION_QUESTIONS.map((q) => ({ id: q.id, answer: '' })),
  photoUrl: null,
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

    // -------------------------------------------------------------------------
    // Photo (client-side-only, display-only – see AppState.photoUrl doc comment)
    // -------------------------------------------------------------------------
    case 'SET_PHOTO':
      revokePhoto(state.photoUrl) // replacing: revoke the previous URL first
      return { ...state, photoUrl: action.url }
    case 'REMOVE_PHOTO':
      revokePhoto(state.photoUrl)
      return { ...state, photoUrl: null }

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
}: {
  resumeText: string
  onTextChange: (text: string) => void
  onSubmit: () => void
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
      <div className="animate-pulse flex flex-col gap-3">
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
  dispatch,
  onReset,
  onStartCoverLetter,
}: {
  lebenslauf: LebenslaufWithUids
  sectionOrder: string[]
  photoUrl: string | null
  dispatch: React.Dispatch<AppAction>
  onReset: () => void
  onStartCoverLetter: () => void
}) {
  const { t } = useLang()
  // Copy button state – local, not in reducer (D-04 / UI-SPEC)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  async function handleCopy() {
    const text = toPlainText(stripUids(lebenslauf), sectionOrder)
    try {
      await navigator.clipboard.writeText(text)
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
        </div>
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
  onNewLetter,
}: {
  letterText: string
  setLetterText: (text: string) => void
  jobPosting: string
  onRegenerate: () => void
  onReset: () => void
  onNewLetter: () => void
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
        <button
          onClick={() => setHumanizerOpen(true)}
          disabled={letterOverHumanizerLimit}
          aria-label={t.humanizerCtaAria}
          className={btnClass('accent')}
        >
          {t.humanizerCta}
        </button>

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
  const [state, dispatch] = useReducer(reducer, initialState)
  const [letterText, setLetterText] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Abort any in-flight cover-letter request on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

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
          <LangToggle />
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
              dispatch={dispatch}
              onReset={() => dispatch({ type: 'RESET' })}
              onStartCoverLetter={() => dispatch({ type: 'START_COVER_LETTER' })}
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
              onReset={() => dispatch({ type: 'RESET' })}
              onNewLetter={() => {
                // Clear only the posting – SET_JOB_POSTING('') resyncs the answer list
                // by question identity, so typed base answers (style/motivation) survive
                // and only job-specific questions reset. Answers are intentionally left
                // untouched otherwise.
                dispatch({ type: 'SET_JOB_POSTING', payload: '' })
                dispatch({ type: 'START_COVER_LETTER' })
              }}
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
