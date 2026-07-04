'use client'
import React, { useReducer, useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Lebenslauf } from '@/lib/schema'
import { isLebenslaufBasicallyEmpty, toPlainText } from '@/lib/lebenslauf-utils'
import { LebenslaufEditor, reorder } from '@/components/LebenslaufEditor'
import type { LebenslaufAction } from '@/components/LebenslaufEditor'
import { NormGapPanel } from '@/components/NormGapPanel'
import { PERSONALIZATION_QUESTIONS, questionsForPosting } from '@/lib/prompts'
import { INVALID_INPUT_SENTINEL } from '@/lib/sentinel'
import { btnClass, CARD, EYEBROW, NORM_NOTE } from '@/components/ui'

// Dynamic: keeps Stripe.js (and its cookies) out of the page until the modal opens.
const HumanizerModal = dynamic(() => import('@/components/HumanizerModal'), { ssr: false })

// ---------------------------------------------------------------------------
// Stable identity keys for editable list entries
// ---------------------------------------------------------------------------

/**
 * Client-side-only stable id, attached to every experience/education entry
 * when it enters state (PARSE_SUCCESS or an ADD action). React list keys
 * must track logical identity, not array position — otherwise a reorder or
 * remove dispatch shifts indices while EditableField's internal `draft`
 * (which only resyncs when NOT editing — see EditableField.tsx) stays mounted
 * against the same DOM node, silently attaching an in-flight edit to a
 * DIFFERENT entry (bug: index-keyed lists cross-write on reorder/remove).
 *
 * `_uid` is never sent to the API and never appears in copy/download output —
 * see handleGenerateLetter (uses toPlainText, field-by-field) and toPlainText
 * itself in lebenslauf-utils.ts (also field-by-field, never spreads the entry).
 */
type WithUid<T> = T & { _uid: string }

type LebenslaufWithUids = Omit<Lebenslauf, 'experience' | 'education' | 'languages'> & {
  experience: WithUid<Lebenslauf['experience'][number]>[]
  education: WithUid<Lebenslauf['education'][number]>[]
  languages: WithUid<Lebenslauf['languages'][number]>[]
}

function withUids(l: Lebenslauf): LebenslaufWithUids {
  return {
    ...l,
    experience: l.experience.map((e) => ({ ...e, _uid: crypto.randomUUID() })),
    education: l.education.map((e) => ({ ...e, _uid: crypto.randomUUID() })),
    languages: l.languages.map((lang) => ({ ...lang, _uid: crypto.randomUUID() })),
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
  resumeText: string // persists through all phases — needed for /api/cover-letter
  lebenslauf: LebenslaufWithUids | null
  sectionOrder: string[]
  errorMessage: string | null
  jobPosting: string
  answers: { question: string; answer: string }[]
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
  | { type: 'SET_ANSWER'; payload: { index: number; answer: string } }
  | { type: 'COVER_LETTER_STREAMING' }
  | { type: 'COVER_LETTER_DONE' }
  | { type: 'COVER_LETTER_ERROR'; payload: string }
  | { type: 'BACK_TO_RESULT' }
  | LebenslaufAction

// Static, deterministic — no Date.now, Math.random, or window (hydration safety)
const initialState: AppState = {
  phase: 'input',
  resumeText: '',
  lebenslauf: null,
  sectionOrder: ['personal', 'experience', 'education', 'skills', 'languages'],
  errorMessage: null,
  jobPosting: '',
  answers: PERSONALIZATION_QUESTIONS.map((q) => ({ question: q, answer: '' })),
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
      return initialState

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
      const blank = { role: '', company: '', location: null, start: null, end: null, bullets: [], _uid: crypto.randomUUID() }
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
        const bullets = e.bullets.map((b, bi) => (bi === action.bulletIndex ? action.value : b))
        return { ...e, bullets }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, experience: exp } }
    }
    case 'ADD_BULLET': {
      if (!state.lebenslauf) return state
      const exp = state.lebenslauf.experience.map((e, i) => {
        if (i !== action.expIndex) return e
        return { ...e, bullets: [...e.bullets, ''] }
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
    // Skills — categorized (D-09)
    // -------------------------------------------------------------------------
    case 'UPDATE_SKILL': {
      if (!state.lebenslauf) return state
      const skills = state.lebenslauf.skills.map((cat, ci) => {
        if (ci !== action.catIndex) return cat
        return {
          ...cat,
          skills: cat.skills.map((s, si) => (si === action.skillIndex ? action.value : s)),
        }
      })
      return { ...state, lebenslauf: { ...state.lebenslauf, skills } }
    }
    case 'ADD_SKILL': {
      if (!state.lebenslauf) return state
      const skills = state.lebenslauf.skills.map((cat, ci) => {
        if (ci !== action.catIndex) return cat
        return { ...cat, skills: [...cat.skills, ''] }
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
          skills: [...state.lebenslauf.skills, { category: '', skills: [] }],
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
      // questions) and sync answers by question identity so typed answers survive.
      const questions = questionsForPosting(action.payload)
      const answers = questions.map(
        (q) => state.answers.find((a) => a.question === q) ?? { question: q, answer: '' }
      )
      return { ...state, jobPosting: action.payload, answers }
    }
    case 'SET_ANSWER': {
      const answers = state.answers.map((a, i) =>
        i === action.payload.index ? { ...a, answer: action.payload.answer } : a
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
      // Dedicated navigation action — clearer than overloading PARSE_SUCCESS and
      // avoids a non-null assertion on state.lebenslauf (IN-01).
      return { ...state, phase: 'result' }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Lock icon — inline SVG, no icon library dependency
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
  const RESUME_LIMIT = 30_000
  const resumeOverLimit = resumeText.length > RESUME_LIMIT
  const isSubmitDisabled = resumeText.trim().length === 0 || resumeOverLimit

  const [extracting, setExtracting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Monotonic request id — guards against a slower, earlier extraction overwriting
  // a faster, later one (or a stale error clobbering a subsequent success).
  const extractionIdRef = useRef(0)

  async function handleFile(file: File) {
    const requestId = ++extractionIdRef.current
    setUploadError(null)
    setExtracting(true)
    try {
      const { extractCvText, CvExtractError, EXTRACT_ERROR_MESSAGES } = await import('@/lib/extract-cv')
      try {
        const text = await extractCvText(file)
        if (requestId !== extractionIdRef.current) return // superseded — drop this result
        onTextChange(text)
        setUploadedName(file.name)
      } catch (err) {
        if (requestId !== extractionIdRef.current) return // superseded — drop this result
        setUploadedName(null)
        if (err instanceof CvExtractError) {
          setUploadError(EXTRACT_ERROR_MESSAGES[err.reason])
        } else {
          setUploadError('The file could not be read. Please copy the text into the field manually.')
        }
      }
    } finally {
      if (requestId === extractionIdRef.current) setExtracting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink mb-1">
          Convert your CV to a German Lebenslauf
        </h1>
        <p className="text-sm text-muted">
          Paste your US or UK resume below — or upload it as PDF. We will reformat it to a norm-correct German
          tabellarischer Lebenslauf, grounded strictly in your real CV facts.
        </p>
      </div>

      {/* Zero-retention reassurance — calm inline line with lock icon (D-14 / INPUT-02) */}
      <p className="flex items-center gap-2 text-sm text-muted">
        <LockIcon />
        Your CV is never stored or used for training — processing is stateless and zero-retention.
      </p>

      {/* CV file upload — extraction runs in the browser; the file is never uploaded (INPUT-02) */}
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
          {extracting ? 'Reading file …' : 'Upload PDF or .txt'}
        </button>
        <span className="text-sm text-muted" role="status">
          {uploadedName
            ? <>Imported from <span className="font-mono">{uploadedName}</span> — review &amp; edit below</>
            : 'Read locally in your browser — the file never leaves your device.'}
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
        placeholder="Paste your resume here — name, contact info, work history, education, skills…"
        rows={18}
        className={`w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${dragOver ? 'border-accent ring-2 ring-accent/30' : ''}`}
        aria-label="Resume text"
      />
      <p className={`text-sm text-right ${resumeOverLimit ? 'text-red-500' : 'text-muted'}`}>
        {resumeText.length.toLocaleString('de-DE')} / 30.000
        {resumeOverLimit && ' — too long'}
      </p>

      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className={`${btnClass('primary')} self-end`}
      >
        Convert to Lebenslauf
      </button>
    </div>
  )
}

const LOADING_MESSAGES = [
  'Reading your CV…',
  'Mapping to German norms…',
  'Structuring the Lebenslauf…',
  'Almost there…',
]

function LoadingView() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Parsing your CV, please wait">
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
      <p className="text-sm text-muted">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  )
}

function ResultView({
  lebenslauf,
  sectionOrder,
  dispatch,
  onReset,
  onStartCoverLetter,
}: {
  lebenslauf: LebenslaufWithUids
  sectionOrder: string[]
  dispatch: React.Dispatch<AppAction>
  onReset: () => void
  onStartCoverLetter: () => void
}) {
  // Copy button state — local, not in reducer (D-04 / UI-SPEC)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  async function handleCopy() {
    const text = toPlainText(lebenslauf, sectionOrder)
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header: label + action buttons */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className={EYEBROW}>
          Lebenslauf
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy button — D-04 / LL-04 */}
          <button
            onClick={handleCopy}
            aria-label="Copy Lebenslauf to clipboard"
            className={btnClass('primary')}
          >
            {copyState === 'copied' ? 'Copied ✓' : 'Copy Lebenslauf'}
          </button>
          {/* Start over — D-16 */}
          <button
            onClick={onReset}
            className={`${btnClass('secondary')} shrink-0`}
          >
            Start over / paste a new CV
          </button>
        </div>
      </div>

      {/* Visually-hidden live mirror so screen readers announce copy state changes
          without making the visible error paragraph itself a chatty aria-live region. */}
      <span className="sr-only" aria-live="polite">
        {copyState === 'copied' ? 'Copied to clipboard.' : copyState === 'error' ? 'Copy failed.' : ''}
      </span>

      {/* Inline copy error (transient 3000ms) */}
      {copyState === 'error' && (
        <p className="text-sm text-red-600">
          Copy failed — please select the text manually.
        </p>
      )}

      {/* Two-column: document (Lebenslauf) left, bilingual annotation right at desktop;
          stacks on mobile. Print-proof "document + margin notes" layout (DESIGN.md). */}
      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        {/* WYSIWYG Lebenslauf editor (D-01 / D-02 / D-03 / D-12) */}
        <LebenslaufEditor
          lebenslauf={lebenslauf}
          sectionOrder={sectionOrder}
          dispatch={dispatch}
          photoAdvice={lebenslauf.photoAdvice}
        />

        {/* Bilingual norm-gap panel (D-05 / LL-02) — the annotation column */}
        <NormGapPanel normGapNotes={lebenslauf.normGapNotes} />
      </div>

      {/* Cover letter CTA — next step in the flow */}
      <div className="rounded-lg border border-hair bg-paper p-5">
        <p className="text-sm font-semibold text-ink mb-1">
          Write Anschreiben
        </p>
        <p className="text-sm text-muted mb-4">
          Generate an authentic German cover letter grounded in your Lebenslauf. You will answer
          3–5 short questions so the letter sounds like you, not generic AI prose.
        </p>
        <p className="text-sm text-muted mb-4">
          Free to generate. An optional Humanizer+ polish (one-time 2,99&nbsp;€, no subscription)
          is available on the finished letter.
        </p>
        <button
          onClick={onStartCoverLetter}
          className={btnClass('primary')}
        >
          Write Anschreiben →
        </button>
      </div>
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
  return (
    <div className="flex flex-col gap-4" role="alert">
      <div className="rounded-lg border border-red-100 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">
          Something went wrong
        </p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      <button
        onClick={onRetry}
        disabled={resumeText.trim().length === 0}
        className={`${btnClass('primary')} self-start`}
      >
        Try again
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
  return (
    <div className="flex flex-col gap-4" role="alert">
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-700">
          That did not look like a CV
        </p>
        <p className="mt-1 text-sm text-amber-600">
          We could not find a recognisable name and work or education history. Try pasting more
          of your resume — include your name, contact info, and at least one job or degree.
        </p>
        <p className="mt-2 text-sm text-amber-600">
          Tip: free generations are limited per hour — make each attempt count.
        </p>
      </div>

      {/* Preserve pasted text so user can fix/expand it (D-17) */}
      <textarea
        value={resumeText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your resume here…"
        rows={12}
        className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label="Resume text"
      />
      <button
        onClick={onRetry}
        disabled={resumeText.trim().length === 0}
        className={`${btnClass('primary')} self-start`}
      >
        Try again
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
  answers: { question: string; answer: string }[]
  onJobPostingChange: (v: string) => void
  onAnswerChange: (index: number, v: string) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const POSTING_LIMIT = 15_000
  const ANSWER_LIMIT = 2_000
  const postingOverLimit = jobPosting.length > POSTING_LIMIT
  const anyAnswerOverLimit = answers.some((a) => a.answer.length > ANSWER_LIMIT)
  const canSubmit = jobPosting.trim().length > 0 && !postingOverLimit && !anyAnswerOverLimit

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-ink mb-1">
          Anschreiben
        </h2>
        <p className="text-sm text-muted">
          Paste the job posting and answer the questions below. The letter is grounded strictly in
          your Lebenslauf facts and your own words.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink">
          Job posting <span className="text-red-500">*</span>
        </label>
        <textarea
          value={jobPosting}
          onChange={(e) => onJobPostingChange(e.target.value)}
          placeholder="Paste the full job posting here…"
          rows={8}
          className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label="Job posting"
        />
        <p className={`text-sm text-right ${postingOverLimit ? 'text-red-500' : 'text-muted'}`}>
          {jobPosting.length.toLocaleString('de-DE')} / 15.000
          {postingOverLimit && ' — too long'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-ink">
          A few quick questions — so the letter sounds like you, not generic AI prose:
        </p>
        {answers.map((a, i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-sm text-muted">{a.question}</label>
            <textarea
              value={a.answer}
              onChange={(e) => onAnswerChange(i, e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              aria-label={`Answer to question ${i + 1}`}
            />
            <p className={`text-sm text-right ${a.answer.length > ANSWER_LIMIT ? 'text-red-500' : 'text-muted'}`}>
              {a.answer.length.toLocaleString('de-DE')} / 2.000
              {a.answer.length > ANSWER_LIMIT && ' — answer too long'}
            </p>
          </div>
        ))}
      </div>

      {/* Native-speaker nudge (D-09 moved from prompt to UI) */}
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm text-amber-700">
          Native-quality German is the goal — but before sending to a real recruiter, have a native
          German speaker review the final letter.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={btnClass('primary')}
        >
          Write my Anschreiben
        </button>
        <button
          onClick={onBack}
          className={btnClass('secondary')}
        >
          Back to Lebenslauf
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
  return (
    <div className="flex flex-col gap-4">
      <p className={EYEBROW}>Anschreiben</p>
      {letterText ? (
        // Render as preformatted text — no dangerouslySetInnerHTML (T-02-01 XSS guard)
        <pre className="whitespace-pre-wrap font-serif-text text-base text-ink leading-[1.65]">
          {letterText}
        </pre>
      ) : (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-4 w-3/4 rounded bg-faint" />
          <div className="h-4 w-2/3 rounded bg-faint" />
          <div className="h-4 w-1/2 rounded bg-faint" />
          <div className="mt-3 h-4 w-4/5 rounded bg-faint" />
          <div className="h-4 w-3/5 rounded bg-faint" />
        </div>
      )}
      <p className="text-sm text-muted">
        {letterText ? 'Generating Anschreiben…' : 'Composing… (the first sentences take a few seconds)'}
      </p>
      <span className="sr-only" role="status">
        {letterText ? '' : 'Generating your Anschreiben…'}
      </span>
    </div>
  )
}

function CoverLetterResultView({
  letterText,
  setLetterText,
  onRegenerate,
  onReset,
}: {
  letterText: string
  setLetterText: (text: string) => void
  onRegenerate: () => void
  onReset: () => void
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  // One-shot edit hint — dismissed on first interaction (D-06)
  const [showEditHint, setShowEditHint] = useState(true)
  const [humanizerOpen, setHumanizerOpen] = useState(false)
  // Pre-refinement letter, kept so the user can restore (null = not refined yet)
  const [originalLetter, setOriginalLetter] = useState<string | null>(null)
  // This view only mounts once the letter is done streaming — announce completion
  // once on mount, then clear so it doesn't linger as stale status text.
  const [readyAnnouncement, setReadyAnnouncement] = useState('Anschreiben ready.')
  useEffect(() => {
    const t = setTimeout(() => setReadyAnnouncement(''), 1000)
    return () => clearTimeout(t)
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

      {/* Header: section label */}
      <p className={EYEBROW}>Anschreiben</p>

      {/* One-shot click-to-edit hint — hidden after first interaction */}
      {showEditHint && (
        <p className="text-sm text-muted">Click to edit</p>
      )}

      {/* Editable letter block — plain controlled textarea, NOT EditableField (rows={3} hardcoded there)
          Letter is read-only during streaming; editing available only here in cover_letter_result (D-06)
          No dangerouslySetInnerHTML — XSS guard (T-02-05) */}
      <textarea
        value={letterText}
        onChange={(e) => {
          setLetterText(e.target.value)
          if (showEditHint) setShowEditHint(false)
        }}
        onFocus={() => { if (showEditHint) setShowEditHint(false) }}
        rows={18}
        className="w-full resize-y rounded-lg border border-hair bg-paper px-4 py-3 font-serif-text text-base text-ink leading-[1.65] placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label="Anschreiben"
      />

      {/* Native-speaker trust callout — distinct block below letter (D-09 / CL-05)
          This callout (+ grounding in prompts.ts) is how CL-04/CL-05 surface in the UI */}
      <div className={NORM_NOTE}>
        <p className={`${EYEBROW} mb-1`}>Note</p>
        <p className="text-sm text-muted">
          Before you send it: have a native German speaker review the final letter.
        </p>
      </div>

      {/* Visually-hidden live mirror so screen readers announce copy state changes
          without making the visible error paragraph itself a chatty aria-live region. */}
      <span className="sr-only" aria-live="polite">
        {copyState === 'copied' ? 'Copied to clipboard.' : copyState === 'error' ? 'Copy failed.' : ''}
      </span>

      {/* Inline copy error (transient 3000ms) */}
      {copyState === 'error' && (
        <p className="text-sm text-red-600">
          Copy failed — please select the text manually.
        </p>
      )}

      {/* Action row — flex, gap-3, wraps on mobile (CL-06 / D-07) */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Humanizer+ upsell — one-shot purchase, additive refinement (spec D1/D3) */}
        <button
          onClick={() => setHumanizerOpen(true)}
          disabled={letterOverHumanizerLimit}
          aria-label="Buy Feinschliff mit Humanizer+"
          className={btnClass('accent')}
        >
          Feinschliff mit Humanizer+ — 2,99 €
        </button>

        {/* Copy — primary button (CL-06) */}
        <button
          onClick={handleCopy}
          aria-label="Copy Anschreiben to clipboard"
          className={btnClass('primary')}
        >
          {copyState === 'copied' ? 'Copied ✓' : 'Copy Anschreiben'}
        </button>

        {/* Download .txt — browser-native Blob, no server round-trip (D-07) */}
        <button
          onClick={handleDownload}
          aria-label="Download Anschreiben as .txt"
          className={`${btnClass('secondary')} shrink-0`}
        >
          Download .txt
        </button>

        {/* Regenerate — re-runs same jobPosting + answers from reducer state */}
        <button
          onClick={onRegenerate}
          aria-label="Regenerate Anschreiben"
          className={`${btnClass('secondary')} shrink-0`}
        >
          Regenerate
        </button>

        {/* Start over — dispatches RESET; no confirmation (D-06 / D-16) */}
        <button
          onClick={onReset}
          aria-label="Reset and paste a new Lebenslauf"
          className={`${btnClass('secondary')} shrink-0`}
        >
          Start over
        </button>
      </div>

      {/* Over-limit hint — only rendered when the letter exceeds the Humanizer+ cap */}
      {letterOverHumanizerLimit && (
        <p className="text-sm text-muted">
          Humanizer+ is available for letters up to 10,000 characters — yours is currently{' '}
          {letterText.length.toLocaleString('en-US')}.
        </p>
      )}

      {/* .txt-only forewarning — sets expectations until PDF export ships */}
      <p className="text-sm text-muted">
        .txt for now — paste into your own template. PDF export is coming.
      </p>

      {originalLetter !== null && (
        <button
          onClick={() => {
            setLetterText(originalLetter)
            setOriginalLetter(null)
          }}
          className={`${btnClass('secondary')} self-start`}
        >
          Restore original
        </button>
      )}

      {/* Rendered only once opened — next/dynamic's import() fires on first render of this
          element, and the module-level loadStripe() call would fetch Stripe.js (and its
          fraud-prevention cookies) as soon as the letter finishes, not on the actual click,
          if this were mounted unconditionally with open={false}. */}
      {humanizerOpen && (
        <HumanizerModal
          letterText={letterText}
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
 * Maps a non-ok fetch Response to an English client message. Status 429/403 get
 * dedicated English copy (rate-limit / same-origin block — never server-authored,
 * so there's no German string to preserve). Everything else falls through to the
 * server's own `error` field when present (400s are authoritative and already
 * German-localized for the user) — otherwise `fallback`.
 */
async function describeFetchFailure(res: Response, fallback: string): Promise<string> {
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After'))
    const minutes = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter / 60) : null
    return minutes
      ? `Too many requests — the free tier is rate-limited. Please try again in about ${minutes} minutes.`
      : 'Too many requests — the free tier is rate-limited. Please try again in a few minutes.'
  }
  if (res.status === 403) {
    return 'Request blocked. Please use the app directly at this site and try again.'
  }
  const body = await res.json().catch(() => ({}))
  return (body as { error?: string }).error ?? fallback
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [letterText, setLetterText] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Abort any in-flight cover-letter request on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // Warn before leaving the tab once there's real work in progress — anything past
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
    const cvText = toPlainText(state.lebenslauf, state.sectionOrder)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    dispatch({ type: 'COVER_LETTER_STREAMING' })
    setLetterText('')
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobPosting: state.jobPosting, answers: state.answers }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        // Surface a controlled message — never render the raw server body, which
        // could be an HTML error page, gateway text, or stack-trace-ish output
        // from an upstream proxy/5xx (WR-01). 429/403 get dedicated English copy;
        // other 4xxs fall back to the server's (German, authoritative) error field.
        dispatch({
          type: 'COVER_LETTER_ERROR',
          payload: res.ok
            ? 'Generation failed — please try again.'
            : await describeFetchFailure(res, 'Generation failed — please try again.'),
        })
        return
      }
      const reader = res.body.getReader()
      // stream:true is MANDATORY — prevents umlaut corruption (ä/ö/ü split across chunks)
      const decoder = new TextDecoder('utf-8', { fatal: false })
      // Local mirror of the streamed text — the `letterText` React state is stale
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
          payload:
            "Your input wasn't recognized as a CV and job posting. Please check that both fields contain the real documents — then try again.",
        })
        return
      }
      // A stream can end cleanly but empty (thinking-only output, refusal, or a
      // max_tokens cut with zero text deltas). Guard the done transition on
      // non-empty content so the user never sees a blank "successful" letter (WR-02).
      if (acc.trim().length === 0) {
        dispatch({
          type: 'COVER_LETTER_ERROR',
          payload: 'No letter was generated — please try again.',
        })
        return
      }
      dispatch({ type: 'COVER_LETTER_DONE' })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      dispatch({ type: 'COVER_LETTER_ERROR', payload: 'Network error — please try again.' })
    }
  }

  // Shared CV-parse driver used by both the initial submit and the retry paths.
  // Both entry points dispatch SUBMIT first, then run identical fetch/parse/dispatch
  // logic — extracted here so the 422 / empty-Lebenslauf / error handling can never
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
          payload: await describeFetchFailure(res, 'Failed to parse CV. Please try again.'),
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
        payload: 'Network error — please check your connection and try again.',
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
      {/* Top-bar wordmark — links back to the landing (UI-SPEC §F item 2) */}
      <div className="border-b border-hair h-14 flex items-center px-6">
        <a href="/" className="text-sm font-semibold text-ink tracking-tight">
          ScanReady
          <span className="text-eyebrow font-mono text-sm ml-1">DE</span>
        </a>
      </div>

      <div className="flex flex-col flex-1 items-center bg-paper font-sans px-4 py-8 sm:py-12">
      <main aria-label="ScanReady tool" className={`w-full max-w-3xl flex-col ${CARD} px-6 py-10 sm:px-12 sm:py-12`}>
        {state.phase === 'input' && (
          <InputView
            resumeText={state.resumeText}
            onTextChange={(text) => dispatch({ type: 'SET_RESUME_TEXT', payload: text })}
            onSubmit={handleSubmit}
          />
        )}

        {state.phase === 'loading' && <LoadingView />}

        {state.phase === 'result' && state.lebenslauf && (
          <ResultView
            lebenslauf={state.lebenslauf}
            sectionOrder={state.sectionOrder}
            dispatch={dispatch}
            onReset={() => dispatch({ type: 'RESET' })}
            onStartCoverLetter={() => dispatch({ type: 'START_COVER_LETTER' })}
          />
        )}

        {state.phase === 'error' && (
          <ErrorView
            message={state.errorMessage ?? 'An unexpected error occurred.'}
            resumeText={state.resumeText}
            onRetry={handleRetry}
          />
        )}

        {state.phase === 'junk' && (
          <JunkView
            resumeText={state.resumeText}
            onTextChange={(text) => dispatch({ type: 'SET_RESUME_TEXT', payload: text })}
            onRetry={handleRetry}
          />
        )}

        {state.phase === 'cover_letter_input' && (
          <CoverLetterInputView
            jobPosting={state.jobPosting}
            answers={state.answers}
            onJobPostingChange={(v) => dispatch({ type: 'SET_JOB_POSTING', payload: v })}
            onAnswerChange={(i, v) => dispatch({ type: 'SET_ANSWER', payload: { index: i, answer: v } })}
            onSubmit={handleGenerateLetter}
            onBack={() => dispatch({ type: 'BACK_TO_RESULT' })}
          />
        )}

        {state.phase === 'cover_letter_streaming' && (
          <CoverLetterStreamingView letterText={letterText} />
        )}

        {state.phase === 'cover_letter_result' && (
          <CoverLetterResultView
            letterText={letterText}
            setLetterText={setLetterText}
            onRegenerate={handleGenerateLetter}
            onReset={() => dispatch({ type: 'RESET' })}
          />
        )}

        {/* cover_letter_error: reuse ErrorView — onRetry re-runs same inputs losslessly
            (jobPosting + answers persist in reducer through streaming/error phases) */}
        {state.phase === 'cover_letter_error' && (
          <ErrorView
            message={state.errorMessage ?? 'Cover letter generation failed.'}
            resumeText={state.jobPosting}
            onRetry={handleGenerateLetter}
          />
        )}
      </main>
      </div>
    </>
  )
}
