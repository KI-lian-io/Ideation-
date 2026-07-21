# Phase 02: Cover Letter Flow — Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 3 (1 major extension, 1 one-line edit, 1 read-only reuse)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scanready/src/app/page.tsx` | component (extend) | event-driven + streaming | itself (Phase 1 `useReducer` state machine) | exact |
| `scanready/src/lib/prompts.ts` | utility (one-line edit) | transform | itself (existing `COVER_LETTER_SYSTEM`) | exact |
| `scanready/src/lib/anthropic.ts` | config (one-line edit) | — | itself (existing `GENERATION_MODEL`) | exact |

New view components introduced inside `page.tsx` (same-file pattern as Phase 1):

| New Component (inside page.tsx) | Role | Data Flow | Closest Analog |
|----------------------------------|------|-----------|----------------|
| `CoverLetterInputView` | component | request-response | `InputView` (page.tsx lines 314–361) |
| `CoverLetterStreamingView` | component | streaming | `LoadingView` (page.tsx lines 363–386) |
| `CoverLetterResultView` | component | event-driven | `ResultView` (page.tsx lines 388–459) |

---

## Pattern Assignments

### `page.tsx` — Reducer extension

**Analog:** `page.tsx` lines 13–59 (existing `AppPhase`, `AppState`, `AppAction`, `initialState`, `reducer`)

**AppPhase extension** (current: line 13):
```typescript
// CURRENT (line 13) — extend this union in-place:
type AppPhase = 'input' | 'loading' | 'result' | 'error' | 'junk'

// EXTENDED — add four cover-letter phases:
type AppPhase =
  | 'input' | 'loading' | 'result' | 'error' | 'junk'
  | 'cover_letter_input'
  | 'cover_letter_streaming'
  | 'cover_letter_result'
  | 'cover_letter_error'
```

**AppState extension** (current: lines 15–21):
```typescript
// CURRENT — add three new fields after errorMessage:
type AppState = {
  phase: AppPhase
  resumeText: string
  lebenslauf: Lebenslauf | null
  sectionOrder: string[]
  errorMessage: string | null
  // NEW — cover-letter sub-flow inputs; must survive streaming so Regenerate works
  jobPosting: string
  answers: { question: string; answer: string }[]
}
```

**AppAction extension** (current: lines 24–31 — add after `RESET` line):
```typescript
// NEW actions for cover-letter sub-flow:
| { type: 'START_COVER_LETTER' }
| { type: 'SET_JOB_POSTING'; payload: string }
| { type: 'SET_ANSWER'; payload: { index: number; answer: string } }
| { type: 'COVER_LETTER_STREAMING' }
| { type: 'COVER_LETTER_DONE' }
| { type: 'COVER_LETTER_ERROR'; payload: string }
| { type: 'COVER_LETTER_REGENERATE' }
```

**initialState extension** (current: lines 34–40):
```typescript
// CURRENT initialState — add two new zero-value fields:
const initialState: AppState = {
  phase: 'input',
  resumeText: '',
  lebenslauf: null,
  sectionOrder: ['personal', 'experience', 'education', 'skills', 'languages'],
  errorMessage: null,
  // NEW:
  jobPosting: '',
  answers: PERSONALIZATION_QUESTIONS.map(q => ({ question: q, answer: '' })),
}
```

**Reducer switch cases** — copy the pattern from lines 47–59; add these cases in the same switch:
```typescript
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
case 'COVER_LETTER_REGENERATE':
  return { ...state, phase: 'cover_letter_streaming', errorMessage: null }
// RESET already returns initialState (line 59) — covers jobPosting + answers for free
```

**Home() phase dispatch** (current: lines 617–651) — add cover-letter phase branches:
```typescript
{state.phase === 'cover_letter_input' && state.lebenslauf && (
  <CoverLetterInputView
    jobPosting={state.jobPosting}
    answers={state.answers}
    onJobPostingChange={(v) => dispatch({ type: 'SET_JOB_POSTING', payload: v })}
    onAnswerChange={(i, v) => dispatch({ type: 'SET_ANSWER', payload: { index: i, answer: v } })}
    onGenerate={handleGenerateLetter}
    onReset={() => dispatch({ type: 'RESET' })}
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
{state.phase === 'cover_letter_error' && (
  <ErrorView
    message={state.errorMessage ?? 'Generation failed.'}
    resumeText={state.jobPosting}
    onRetry={handleGenerateLetter}
  />
)}
```

---

### `page.tsx` — `handleGenerateLetter` async function

**Analog:** `handleSubmit` (page.tsx lines 537–575) — same pattern: `dispatch` to loading phase → `fetch` → parse response → `dispatch` result/error.

**Streaming reader loop** (new, no direct analog — use RESEARCH.md verified pattern):
```typescript
// Place in Home() body alongside handleSubmit / handleRetry
// letterText: local useState (NOT reducer) — avoids full re-render per token
const [letterText, setLetterText] = useState('')
const abortRef = useRef<AbortController | null>(null)

async function handleGenerateLetter() {
  // Snapshot cvText at click-time (D-02)
  const cvText = toPlainText(state.lebenslauf!, state.sectionOrder)

  // Cancel any in-flight request (Regenerate path)
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller

  dispatch({ type: 'COVER_LETTER_STREAMING' })
  setLetterText('')

  try {
    const res = await fetch('/api/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cvText,
        jobPosting: state.jobPosting,
        answers: state.answers,
      }),
      signal: controller.signal,
    })

    if (!res.ok || !res.body) {
      const msg = await res.text().catch(() => 'Generation failed.')
      dispatch({ type: 'COVER_LETTER_ERROR', payload: msg })
      return
    }

    const reader = res.body.getReader()
    // CRITICAL: { stream: true } keeps multi-byte UTF-8 (German umlauts) intact
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      if (chunk) setLetterText(prev => prev + chunk)
    }
    // Flush any remaining bytes
    const tail = decoder.decode()
    if (tail) setLetterText(prev => prev + tail)

    dispatch({ type: 'COVER_LETTER_DONE' })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return // intentional cancel
    dispatch({ type: 'COVER_LETTER_ERROR', payload: 'Network error — please try again.' })
  }
}

// Abort on unmount — copy useEffect cleanup pattern
useEffect(() => {
  return () => abortRef.current?.abort()
}, [])
```

---

### `CoverLetterInputView` (new function component inside page.tsx)

**Analog:** `InputView` (page.tsx lines 314–361) — same structure: heading, zero-retention line, textarea(s), disabled submit button.

**Heading + zero-retention line pattern** (lines 327–341):
```typescript
// Copy this block; update heading and description text
<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
  Anschreiben schreiben
</h1>
<p className="text-sm text-zinc-500 dark:text-zinc-400">
  ...description...
</p>
<p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
  <LockIcon />
  Your CV is never stored or used for training — processing is stateless and zero-retention.
</p>
```

**Job posting textarea** (copy InputView textarea: lines 343–350; update label + placeholder):
```typescript
<textarea
  value={jobPosting}
  onChange={(e) => onJobPostingChange(e.target.value)}
  placeholder="Paste the full job posting here…"
  rows={8}
  className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
  aria-label="Job posting"
/>
```

**Personalization question textareas** (same textarea class; render via `answers.map`):
```typescript
{answers.map((a, i) => (
  <div key={i} className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
      {i + 1}. {a.question}
      {i === 4 && <span className="ml-1 text-xs font-normal text-zinc-400">(optional)</span>}
    </label>
    <textarea
      value={a.answer}
      onChange={(e) => onAnswerChange(i, e.target.value)}
      rows={3}
      className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
    />
  </div>
))}
```

**Submit button — disabled pattern** (copy from lines 352–358):
```typescript
// Disabled until jobPosting is non-empty (D-04)
<button
  onClick={onGenerate}
  disabled={jobPosting.trim().length === 0}
  className="self-end rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
>
  Anschreiben generieren
</button>
```

**Start over button** (copy secondary button from ResultView lines 431–437):
```typescript
<button
  onClick={onReset}
  className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
>
  Start over
</button>
```

---

### `CoverLetterStreamingView` (new function component inside page.tsx)

**Analog:** `LoadingView` (page.tsx lines 363–386) — animate-pulse skeleton until first token; switch to live letter block on first chunk.

**Pre-token skeleton** (copy lines 366–385 verbatim; change aria-label and status text):
```typescript
// Show this block when letterText.length === 0
<div className="flex flex-col gap-4" role="status" aria-label="Anschreiben wird generiert">
  <div className="animate-pulse flex flex-col gap-3">
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
  <p className="text-sm text-zinc-400 dark:text-zinc-500">Anschreiben wird generiert…</p>
</div>
```

**Live letter block** (shown when letterText.length > 0; read-only `<pre>`; no EditableField during stream per D-06):
```typescript
// Switch skeleton → live text on first chunk; render as text node (no dangerouslySetInnerHTML per XSS guard)
{letterText.length === 0 ? (
  <SkeletonBlock />  // animate-pulse above
) : (
  <pre className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100 font-sans">
    {letterText}
  </pre>
)}
```

---

### `CoverLetterResultView` (new function component inside page.tsx)

**Analog:** `ResultView` (page.tsx lines 388–459) — same structure: header label + action buttons, content block, copy pattern.

**Copy button pattern** (copy from lines 399–412 verbatim):
```typescript
// Local state, not in reducer — exact same pattern as ResultView.handleCopy
const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

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
```

**Copy button render** (copy from lines 422–429; update label + button text):
```typescript
<button
  onClick={handleCopy}
  aria-label="Anschreiben in Zwischenablage kopieren"
  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
>
  {copyState === 'copied' ? 'Kopiert ✓' : 'Anschreiben kopieren'}
</button>
```

**Copy error inline** (copy from lines 441–445):
```typescript
{copyState === 'error' && (
  <p className="text-sm text-red-600 dark:text-red-400">
    Kopieren fehlgeschlagen — bitte manuell auswählen.
  </p>
)}
```

**Download .txt button** (browser-native Blob; no server round-trip):
```typescript
function handleDownload() {
  const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'anschreiben.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// Button: same secondary-button class as "Start over" in ResultView (lines 431–437)
<button
  onClick={handleDownload}
  className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
>
  .txt herunterladen
</button>
```

**Editable letter block** — use plain `<textarea rows={18}>` NOT `EditableField` (RESEARCH.md Open Question #1: `EditableField` hardcodes `rows={3}`; the letter needs `rows={18}`):
```typescript
// After stream: controlled textarea — same border/bg/text classes as InputView textarea (line 348)
<textarea
  value={letterText}
  onChange={(e) => setLetterText(e.target.value)}
  rows={18}
  className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
  aria-label="Anschreiben"
/>
```

**Native-speaker trust callout** (D-09 — distinct block below the letter; NOT inline in the letter):
```typescript
// Amber-toned info callout — same rounded-lg border pattern as JunkView (lines 500–508)
<div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
    Vor dem Versenden prüfen lassen
  </p>
  <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
    Bitte lass das Anschreiben von einem deutschen Muttersprachler gegenlesen, bevor du es abschickst.
  </p>
</div>
```

**Regenerate button** (secondary-button style; re-invokes `handleGenerateLetter` which already aborts any prior in-flight request):
```typescript
<button
  onClick={onRegenerate}
  className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
>
  Neu generieren
</button>
```

**Start over button** (copy from ResultView lines 431–437; dispatches `RESET`):
```typescript
<button
  onClick={onReset}
  className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
>
  Start over / neue Bewerbung
</button>
```

**"Write Anschreiben" CTA in `ResultView`** — add after `NormGapPanel` (line 456):
```typescript
// Primary CTA button at the bottom of the existing ResultView
<button
  onClick={() => dispatch({ type: 'START_COVER_LETTER' })}
  className="self-start rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
>
  Anschreiben schreiben
</button>
```

---

### `src/lib/prompts.ts` — D-09 one-line edit

**Analog:** itself (lines 53–57)

**Current lines 53–57:**
```typescript
- End with a short note (in [brackets]) reminding the user to have a native German
  speaker review before sending.

Write only the letter (plus the bracketed review note). No preamble.`;
```

**After edit — delete lines 53–55, update line 57:**
```typescript
Write only the letter. No preamble.`;
```

Grounding directives (lines 42–51) are untouched. This is the only change to `prompts.ts`.

---

### `src/lib/anthropic.ts` — pre-execution gate (restore GENERATION_MODEL)

**Not a phase feature — a pre-execution gate.** Must be done before any dogfooding.

**Current (to verify):** `GENERATION_MODEL = "claude-haiku-4-5"` (temporary user edit)
**Required:** `GENERATION_MODEL = "claude-opus-4-8"` (quality moat for cover letter)

This is the very first task in Phase 2 execution.

---

## Shared Patterns

### Zero-retention inline reassurance line
**Source:** `src/app/page.tsx` lines 337–341 (`InputView`)
**Apply to:** `CoverLetterInputView`
```typescript
<p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
  <LockIcon />
  Your CV is never stored or used for training — processing is stateless and zero-retention.
</p>
```

### Primary action button (enabled + disabled states)
**Source:** `src/app/page.tsx` lines 352–358 (`InputView`)
**Apply to:** "Anschreiben generieren" button in `CoverLetterInputView`
```typescript
className="self-end rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
```

### Secondary action button (ghost/outline style)
**Source:** `src/app/page.tsx` lines 431–437 (`ResultView`)
**Apply to:** "Start over", "Neu generieren", ".txt herunterladen" buttons
```typescript
className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
```

### Textarea (input fields)
**Source:** `src/app/page.tsx` lines 343–350 (`InputView`)
**Apply to:** Job posting textarea and all 5 personalization question textareas; post-stream editable letter block
```typescript
className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
```

### Error view (red callout + retry)
**Source:** `src/app/page.tsx` lines 461–487 (`ErrorView`)
**Apply to:** `cover_letter_error` phase — wire "Try again" to re-invoke `handleGenerateLetter`
```typescript
<div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Something went wrong</p>
  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{message}</p>
</div>
```

### Copy-button state machine
**Source:** `src/app/page.tsx` lines 399–412 (`ResultView.handleCopy`)
**Apply to:** Anschreiben copy button in `CoverLetterResultView`
```typescript
const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
// success: setCopyState('copied') + setTimeout 1500ms
// failure: setCopyState('error') + setTimeout 3000ms
// render: copyState === 'copied' ? 'Kopiert ✓' : 'Anschreiben kopieren'
```

### Section label (eyebrow text)
**Source:** `src/app/page.tsx` line 419 (`ResultView`)
**Apply to:** Anschreiben section header in `CoverLetterResultView`
```typescript
<p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
  Anschreiben
</p>
```

---

## No Analog Found

All new work has a close analog in the existing codebase. No files require falling back to RESEARCH.md patterns exclusively — but the streaming reader loop in `handleGenerateLetter` has no pre-existing analog in `page.tsx` (Phase 1 used a single JSON response, not a streaming reader). That pattern is fully specified in RESEARCH.md "Core Implementation Pattern: Client-Side Streaming Reader" and is reproduced in the Pattern Assignments section above.

---

## Metadata

**Analog search scope:** `scanready/src/app/page.tsx`, `scanready/src/components/EditableField.tsx`, `scanready/src/lib/prompts.ts`, `scanready/src/app/api/cover-letter/route.ts`
**Files read:** 4 source files (complete reads — all under 2,000 lines)
**Pattern extraction date:** 2026-06-22
