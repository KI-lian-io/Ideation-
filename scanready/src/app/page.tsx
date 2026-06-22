'use client'
import React, { useReducer, useState, useRef, useEffect } from 'react'
import type { Lebenslauf } from '@/lib/schema'
import { isLebenslaufBasicallyEmpty, toPlainText } from '@/lib/lebenslauf-utils'
import { LebenslaufEditor, reorder } from '@/components/LebenslaufEditor'
import type { LebenslaufAction } from '@/components/LebenslaufEditor'
import { NormGapPanel } from '@/components/NormGapPanel'
import { PERSONALIZATION_QUESTIONS } from '@/lib/prompts'

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
  lebenslauf: Lebenslauf | null
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
      return { ...state, phase: 'result', lebenslauf: action.payload }
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
      const blank = { role: '', company: '', location: null, start: null, end: null, bullets: [] }
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
      const blank = { qualification: '', institution: '', location: null, start: null, end: null }
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
          languages: [...state.lebenslauf.languages, { language: '', level: null }],
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
    case 'SET_JOB_POSTING':
      return { ...state, jobPosting: action.payload }
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
  const isSubmitDisabled = resumeText.trim().length === 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
          Convert your CV to a German Lebenslauf
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Paste your US or UK resume below. We will reformat it to a norm-correct German
          tabellarischer Lebenslauf, grounded strictly in your real CV facts.
        </p>
      </div>

      {/* Zero-retention reassurance — calm inline line with lock icon (D-14 / INPUT-02) */}
      <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <LockIcon />
        Your CV is never stored or used for training — processing is stateless and zero-retention.
      </p>

      <textarea
        value={resumeText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your resume here — name, contact info, work history, education, skills…"
        rows={18}
        className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        aria-label="Resume text"
      />

      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="self-end rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Convert to Lebenslauf
      </button>
    </div>
  )
}

function LoadingView() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Parsing your CV, please wait">
      <div className="animate-pulse flex flex-col gap-3">
        {/* Skeleton blocks simulating the Lebenslauf layout (D-15 / INPUT-03) */}
        <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-2/5 rounded bg-zinc-200 dark:bg-zinc-700" />

        <div className="mt-4 h-5 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />

        <div className="mt-4 h-5 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-3/5 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Converting your CV to a German Lebenslauf…
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
  lebenslauf: Lebenslauf
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
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Lebenslauf
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy button — D-04 / LL-04 */}
          <button
            onClick={handleCopy}
            aria-label="Lebenslauf in Zwischenablage kopieren"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {copyState === 'copied' ? 'Kopiert ✓' : 'Lebenslauf kopieren'}
          </button>
          {/* Start over — D-16 */}
          <button
            onClick={onReset}
            className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
          >
            Start over / paste a new CV
          </button>
        </div>
      </div>

      {/* Inline copy error (transient 3000ms) */}
      {copyState === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Kopieren fehlgeschlagen — bitte manuell auswählen.
        </p>
      )}

      {/* WYSIWYG Lebenslauf editor (D-01 / D-02 / D-03 / D-12) */}
      <LebenslaufEditor
        lebenslauf={lebenslauf}
        sectionOrder={sectionOrder}
        dispatch={dispatch}
        photoAdvice={lebenslauf.photoAdvice}
      />

      {/* Collapsible bilingual norm-gap panel (D-05 / LL-02) — below the editor so CV stays hero */}
      <NormGapPanel normGapNotes={lebenslauf.normGapNotes} />

      {/* Cover letter CTA — next step in the flow */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
          Anschreiben schreiben
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Generate an authentic German cover letter grounded in your Lebenslauf. You will answer
          3–5 short questions so the letter sounds like you, not generic AI prose.
        </p>
        <button
          onClick={onStartCoverLetter}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Something went wrong
        </p>
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{message}</p>
      </div>
      <button
        onClick={onRetry}
        disabled={resumeText.trim().length === 0}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          That did not look like a CV
        </p>
        <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
          We could not find a recognisable name and work or education history. Try pasting more
          of your resume — include your name, contact info, and at least one job or degree.
        </p>
      </div>

      {/* Preserve pasted text so user can fix/expand it (D-17) */}
      <textarea
        value={resumeText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your resume here…"
        rows={12}
        className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        aria-label="Resume text"
      />
      <button
        onClick={onRetry}
        disabled={resumeText.trim().length === 0}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
  const canSubmit = jobPosting.trim().length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
          Anschreiben
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Paste the job posting and answer the questions below. The letter is grounded strictly in
          your Lebenslauf facts and your own words.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Job posting <span className="text-red-500">*</span>
        </label>
        <textarea
          value={jobPosting}
          onChange={(e) => onJobPostingChange(e.target.value)}
          placeholder="Paste the full job posting here…"
          rows={8}
          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          aria-label="Job posting"
        />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          A few quick questions — so the letter sounds like you, not generic AI prose:
        </p>
        {answers.map((a, i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">{a.question}</label>
            <textarea
              value={a.answer}
              onChange={(e) => onAnswerChange(i, e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              aria-label={`Answer to question ${i + 1}`}
            />
          </div>
        ))}
      </div>

      {/* Native-speaker nudge (D-09 moved from prompt to UI) */}
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Native-quality German is the goal — but before sending to a real recruiter, have a native
          German speaker review the final letter.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Anschreiben schreiben
        </button>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
        >
          Back to Lebenslauf
        </button>
      </div>
    </div>
  )
}

function CoverLetterStreamingView({ letterText }: { letterText: string }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Generating Anschreiben">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Anschreiben</p>
      {letterText ? (
        // Render as preformatted text — no dangerouslySetInnerHTML (T-02-01 XSS guard)
        <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
          {letterText}
        </pre>
      ) : (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-3 h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-3/5 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      )}
      <p className="text-sm text-zinc-400 dark:text-zinc-500">Generating Anschreiben…</p>
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header: section label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Anschreiben</p>

      {/* One-shot click-to-edit hint — hidden after first interaction */}
      {showEditHint && (
        <p className="text-sm text-zinc-400">Klicken zum Bearbeiten</p>
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
        className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        aria-label="Anschreiben"
      />

      {/* Native-speaker trust callout — distinct block below letter (D-09 / CL-05)
          This callout (+ grounding in prompts.ts) is how CL-04/CL-05 surface in the UI */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Hinweis</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Bitte lassen Sie dieses Anschreiben von einem Muttersprachler prüfen, bevor Sie es absenden.
        </p>
      </div>

      {/* Inline copy error (transient 3000ms) */}
      {copyState === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Kopieren fehlgeschlagen — bitte manuell auswählen.
        </p>
      )}

      {/* Action row — flex, gap-3, wraps on mobile (CL-06 / D-07) */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Copy — primary button (CL-06) */}
        <button
          onClick={handleCopy}
          aria-label="Anschreiben in Zwischenablage kopieren"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {copyState === 'copied' ? 'Kopiert ✓' : 'Anschreiben kopieren'}
        </button>

        {/* Download .txt — browser-native Blob, no server round-trip (D-07) */}
        <button
          onClick={handleDownload}
          aria-label="Anschreiben als .txt herunterladen"
          className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
        >
          .txt herunterladen
        </button>

        {/* Regenerieren — re-runs same jobPosting + answers from reducer state */}
        <button
          onClick={onRegenerate}
          aria-label="Anschreiben neu generieren"
          className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
        >
          Regenerieren
        </button>

        {/* Start over — dispatches RESET; no confirmation (D-06 / D-16) */}
        <button
          onClick={onReset}
          aria-label="Zurücksetzen und neues Lebenslauf einfügen"
          className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
        >
          Start over
        </button>
      </div>
    </div>
  )
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

  async function handleGenerateLetter() {
    const cvText = toPlainText(state.lebenslauf!, state.sectionOrder)
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
        // from an upstream proxy/5xx (WR-01).
        dispatch({
          type: 'COVER_LETTER_ERROR',
          payload: 'Generation failed — please try again.',
        })
        return
      }
      const reader = res.body.getReader()
      // stream:true is MANDATORY — prevents umlaut corruption (ä/ö/ü split across chunks)
      const decoder = new TextDecoder('utf-8', { fatal: false })
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) setLetterText((prev) => prev + chunk)
      }
      // Flush any remaining bytes buffered by the streaming decoder
      const tail = decoder.decode()
      if (tail) setLetterText((prev) => prev + tail)
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
        const body = await res.json().catch(() => ({}))
        dispatch({
          type: 'PARSE_ERROR',
          payload: (body as { error?: string }).error ?? 'Failed to parse CV. Please try again.',
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
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col justify-center py-12 px-6 bg-white dark:bg-black sm:px-12">
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
            onBack={() => dispatch({ type: 'PARSE_SUCCESS', payload: state.lebenslauf! })}
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
  )
}
