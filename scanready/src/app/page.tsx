'use client'
import React, { useReducer, useState } from 'react'
import type { Lebenslauf } from '@/lib/schema'
import { isLebenslaufBasicallyEmpty, toPlainText } from '@/lib/lebenslauf-utils'
import { LebenslaufEditor, reorder } from '@/components/LebenslaufEditor'
import type { LebenslaufAction } from '@/components/LebenslaufEditor'

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

type AppPhase = 'input' | 'loading' | 'result' | 'error' | 'junk'

type AppState = {
  phase: AppPhase
  resumeText: string // persists through all phases — needed for /api/cover-letter
  lebenslauf: Lebenslauf | null
  sectionOrder: string[]
  errorMessage: string | null
}

// AppAction union: page lifecycle actions + all Lebenslauf editor actions
type AppAction =
  | { type: 'SET_RESUME_TEXT'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'PARSE_SUCCESS'; payload: Lebenslauf }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'PARSE_JUNK' }
  | { type: 'RESET' }
  | LebenslaufAction

// Static, deterministic — no Date.now, Math.random, or window (hydration safety)
const initialState: AppState = {
  phase: 'input',
  resumeText: '',
  lebenslauf: null,
  sectionOrder: ['personal', 'experience', 'education', 'skills', 'languages'],
  errorMessage: null,
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
}: {
  lebenslauf: Lebenslauf
  sectionOrder: string[]
  dispatch: React.Dispatch<AppAction>
  onReset: () => void
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
      />
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
// Main page component
// ---------------------------------------------------------------------------

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState)

  async function handleSubmit() {
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

  async function handleRetry() {
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
          payload: (body as { error?: string }).error ?? 'Failed to parse CV.',
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
      dispatch({ type: 'PARSE_ERROR', payload: 'Network error — please try again.' })
    }
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
      </main>
    </div>
  )
}
