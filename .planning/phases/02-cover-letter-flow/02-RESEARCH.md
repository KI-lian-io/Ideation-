# Phase 02: Cover Letter Flow — Research

**Researched:** 2026-06-22
**Domain:** React 19 / Next.js 16 client-side streaming consumer, useReducer extension, UI wiring
**Confidence:** HIGH (grounded entirely in the actual scanready/ source files and Next.js 16 local docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** "Write Anschreiben" CTA on the Lebenslauf result extends the same single-page `useReducer` flow — no separate page/route. `AppPhase` union gains cover-letter phases. `resumeText` already persists.
- **D-02:** Ground the letter in the edited Lebenslauf: `cvText = toPlainText(current edited Lebenslauf state)`. `POST /api/cover-letter` with `{ cvText, jobPosting, answers }`.
- **D-03:** Present all 5 `PERSONALIZATION_QUESTIONS` at once as a single form of labelled textareas.
- **D-04:** Job posting is required to generate — disable "Anschreiben generieren" until job-posting field is non-empty.
- **D-05:** Stream tokens live into a read-only styled letter block via `response.body.getReader()` (LOCKED — NOT EventSource). Show `animate-pulse` skeleton until first token.
- **D-06:** On stream completion, letter becomes editable (reuse `EditableField` / textarea). "Regenerate" re-runs same inputs. "Start over" dispatches `RESET`. No editing during stream.
- **D-07:** Finished letter actions: Copy to clipboard (reuse "Kopiert ✓" pattern) + plain-text `.txt` download. PDF/.docx deferred.
- **D-08:** German letter only — no bilingual English-explanation panel for the cover letter.
- **D-09:** Native-speaker-review nudge is a distinct trust callout below the letter. Drop the inline `[bracket]` review note from `COVER_LETTER_SYSTEM` (one-line prompt edit — only backend change in this phase).

### Claude's Discretion
- Exact reducer phase names + action shapes for the cover-letter sub-flow.
- Whether to show a soft "answer at least one question" hint, and its wording.
- `.txt` filename convention (e.g. `anschreiben.txt`).
- Typewriter cadence / whether to render raw streamed text directly vs lightly buffered.

### Deferred Ideas (OUT OF SCOPE)
- PDF download of the Anschreiben/Lebenslauf (FMT-02) — v2.
- `.docx` download (FMT-03) — v2.
- Bilingual "why these claims" explanation panel for the cover letter — rejected for v1.
- One-at-a-time question wizard — rejected in favor of the single form.
- PDF upload / client-side extraction (FMT-01) — v2.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CL-01 | User can paste a target job posting | UI-SPEC `CoverLetterInput` textarea spec; `buildCoverLetterUser` takes `jobPosting` string |
| CL-02 | User answers the 3–5 personalization questions from `PERSONALIZATION_QUESTIONS` | `PERSONALIZATION_QUESTIONS` array confirmed as 5 items in `prompts.ts` line 75–81; form pattern documented |
| CL-03 | User sees Anschreiben stream live — consumed via `response.body.getReader()`, not EventSource | Streaming reader loop pattern confirmed; route emits `text/plain; charset=utf-8` chunks |
| CL-04 | Generated Anschreiben grounded only in CV facts + user answers — no fabrication | `COVER_LETTER_SYSTEM` enforces grounding; backend exists; UI copy and D-09 callout surface it |
| CL-05 | User sees "have a native German speaker review this" nudge on the finished letter | D-09 trust callout; `COVER_LETTER_SYSTEM` bracket note to drop (one-line edit) |
| CL-06 | User can copy the Anschreiben output to clipboard | Copy pattern from `ResultView.handleCopy` reused; `.txt` download added |
</phase_requirements>

---

## Summary

Phase 2 is **UI wiring, not new backend**. The streamed endpoint (`/api/cover-letter`) is built, tested, and typechecks. The work is connecting the existing `useReducer` state machine in `page.tsx` to three new views — an input form, a streaming view, and a result view — and making one one-line edit to `prompts.ts`.

The core implementation risk is the **client-side streaming reader loop**: consuming `response.body.getReader()` correctly in a React 19 `'use client'` component requires `TextDecoder` with `{ stream: true }`, an async loop that appends chunks to a local state buffer, a clean dispatch to the reducer on completion, and proper teardown if the component unmounts mid-stream. This is not conceptually complex but has specific failure modes (render thrashing from too many `setState` calls per token, cursor-fight if editing is allowed during stream, orphaned readers on unmount) that must be handled correctly the first time.

The reducer extension is mechanical: `AppPhase` gains four new string literals, `AppState` gains three new fields (`jobPosting`, `answers`, `letterText`), and four new actions are added. Because `RESET` already returns `initialState`, Start-over works for free. The `resumeText` field already persists through all phases, and the `lebenslauf` + `sectionOrder` fields remain in state when transitioning to `cover_letter_input`, so `toPlainText(lebenslauf, sectionOrder)` can be called at submission time.

The `EditableField` component, the `animate-pulse` skeleton, the "Kopiert ✓" copy pattern, and `toPlainText` are all available as-is with confirmed signatures. No new packages are needed; the `.txt` download uses browser-native `Blob` + `URL.createObjectURL`.

**Primary recommendation:** Implement the streaming reader loop as a standalone `handleGenerateLetter` async function (not a `useEffect`) — called from a button click handler — to avoid the stale-closure and cleanup complexity of a `useEffect`-based approach. Store the `AbortController` in a `useRef` for teardown on unmount or Regenerate.

**Pre-execution gate (not a Phase 2 task, but must happen first):** `anthropic.ts` currently has `GENERATION_MODEL = "claude-haiku-4-5"` (a temporary user edit, per CONTEXT.md deferred section). Flip it back to `"claude-opus-4-8"` before dogfooding — Opus is the quality moat for the cover letter.

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` and `.claude/CLAUDE.md` are binding on all planning decisions:

| Constraint | Source | Implication for Phase 2 |
|-----------|--------|------------------------|
| No new packages in Phase 2 | `.claude/CLAUDE.md` "What NOT to Add" + UI-SPEC | `.txt` download uses `Blob` / `URL.createObjectURL` — no library |
| No `vercel/ai` SDK | `.claude/CLAUDE.md` | Confirmed: phase uses `@anthropic-ai/sdk` directly via existing route |
| No `zustand`, no `react-hook-form` | `.claude/CLAUDE.md` | `useReducer` extension only; controlled inputs only |
| No `react-query` / `swr` | `.claude/CLAUDE.md` | Direct `fetch` in event handler |
| No `font-bold` or `font-medium` | `01-UI-SPEC.md` (inherited) | Only `font-normal` / `font-semibold` in all new markup |
| No `text-lg`, `text-xl`, `text-3xl` | `01-UI-SPEC.md` (inherited) | Only `text-sm`, `text-xs`, `text-2xl` |
| No `dangerouslySetInnerHTML` | `EditableField.tsx` comment; T-01-08 threat model | Streamed letter rendered as text node in `<pre>` or controlled `<textarea>` |
| Grounded-only generation; no fabrication | `CLAUDE.md` guardrails | `COVER_LETTER_SYSTEM` prompt stays untouched except D-09 one-line edit |
| Zero-retention / GDPR | `CLAUDE.md` guardrails | No state persisted; no DB; no server-side logging of CV or letter content |
| `GENERATION_MODEL = claude-opus-4-8` for cover letter | `CLAUDE.md` | Current `anthropic.ts` has `claude-haiku-4-5` — must be restored before dogfooding |
| Read `node_modules/next/dist/docs/` before writing app code | `scanready/AGENTS.md` | Executor must read relevant guide before writing any `page.tsx` extension |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Job posting input + personalization form | Browser / Client | — | Pure controlled-input state in `useReducer`; no server involvement until submit |
| `cvText` grounding snapshot | Browser / Client | — | `toPlainText(lebenslauf, sectionOrder)` called client-side at submission time |
| Cover letter generation | API / Backend | — | Existing `/api/cover-letter` route; Node.js runtime; `GENERATION_MODEL` |
| Token streaming (emit) | API / Backend | — | `ReadableStream` controller in `route.ts`; `Content-Type: text/plain; charset=utf-8` |
| Token streaming (consume) | Browser / Client | — | `response.body.getReader()` loop in `'use client'` component |
| Streaming state (skeleton → letter → editable) | Browser / Client | — | `useReducer` phase transitions; local `letterText` state |
| Post-stream editing | Browser / Client | — | `EditableField` / textarea swap after `done: true` |
| Copy to clipboard | Browser / Client | — | `navigator.clipboard.writeText` in event handler |
| `.txt` download | Browser / Client | — | `Blob` + `URL.createObjectURL` — no server round-trip |
| Native-speaker trust callout | Browser / Client | — | Static UI element rendered in `cover_letter_result` phase |
| D-09 prompt edit | API / Backend | — | One-line delete in `COVER_LETTER_SYSTEM` in `prompts.ts` |

---

## Standard Stack

### Core (already installed — confirm only)

No new packages. All implementation is in existing stack.

| Asset | Location | Purpose | Status |
|-------|----------|---------|--------|
| `useReducer` + `AppState` | `src/app/page.tsx` lines 13–286 | State machine for the full flow | Extend with 4 new phases |
| `/api/cover-letter` | `src/app/api/cover-letter/route.ts` | Streamed Anschreiben generation | Already built; `maxDuration=120` |
| `COVER_LETTER_SYSTEM` | `src/lib/prompts.ts` line 40–57 | System prompt | One-line edit: drop the trailing `[bracket]` note (lines 53–55) |
| `buildCoverLetterUser` | `src/lib/prompts.ts` lines 63–72 | User message builder | Signature: `{ cvText, jobPosting, answers: {question,answer}[] }` — use as-is |
| `PERSONALIZATION_QUESTIONS` | `src/lib/prompts.ts` lines 75–81 | The 5 questions | Array of 5 strings — render all at once (D-03) |
| `toPlainText` | `src/lib/lebenslauf-utils.ts` lines 56–152 | Lebenslauf → plain text for grounding | Signature: `(l: Lebenslauf, sectionOrder: string[]) => string` |
| `EditableField` | `src/components/EditableField.tsx` | Click-to-edit swap | Signature: `{ value, placeholder?, multiline?, onSave, onBlurFormat?, className? }` |

### Package Legitimacy Audit

No new packages installed in Phase 2. Zero vetting required.

---

## Architecture Patterns

### System Architecture Diagram

```
User (browser)
     |
     | clicks "Anschreiben schreiben"
     v
[useReducer] -- AppPhase: cover_letter_input
     |
     | user fills jobPosting + answers
     | clicks "Anschreiben generieren"
     v
[handleGenerateLetter()]
     |-- toPlainText(lebenslauf, sectionOrder) --> cvText string
     |-- AbortController.signal attached
     |
     | POST /api/cover-letter { cvText, jobPosting, answers }
     v
[/api/cover-letter route.ts]              [Next.js Node.js runtime]
     |-- anthropic.messages.stream()
     |-- for await event: text_delta
     |-- controller.enqueue(encoder.encode(text))
     |-- controller.close()
     |
     | ReadableStream<Uint8Array> body
     | Content-Type: text/plain; charset=utf-8
     v
[handleGenerateLetter() — reader loop]
     |-- response.body.getReader()
     |-- TextDecoder({ stream: true })
     |-- dispatch COVER_LETTER_STREAMING (first chunk triggers phase transition)
     |-- while !done: decode chunk, setLetterText(prev => prev + chunk)
     |-- on done: dispatch COVER_LETTER_DONE
     |-- on error: dispatch COVER_LETTER_ERROR
     v
[useReducer] -- AppPhase: cover_letter_streaming
     |  (letterText in local useState, not reducer — avoids reducer re-render on every token)
     v
[useReducer] -- AppPhase: cover_letter_result
     |
     | user copies / downloads / edits / regenerates / resets
     v
navigator.clipboard.writeText(letterText)  -- copy
Blob + URL.createObjectURL               -- .txt download
EditableField or <textarea rows={18}>    -- inline edit
dispatch COVER_LETTER_REGENERATE         -- re-run same inputs
dispatch RESET                           -- return to initialState (Phase 1)
```

### Recommended File Structure Extension

```
src/
├── app/
│   ├── page.tsx                    # EXTEND: new phases, reducer actions, views
│   └── api/
│       └── cover-letter/
│           └── route.ts            # ONE-LINE EDIT: drop bracket note from COVER_LETTER_SYSTEM
├── lib/
│   └── prompts.ts                  # ONE-LINE EDIT: drop bracket note in COVER_LETTER_SYSTEM
└── components/
    └── EditableField.tsx           # NO CHANGE — reused as-is
```

All new cover-letter views can live as named function components inside `page.tsx` (matching the Phase 1 pattern: `InputView`, `LoadingView`, `ResultView`, `ErrorView`, `JunkView` are all in `page.tsx`). No new component files required unless the executor prefers extraction.

---

## Core Implementation Pattern: Client-Side Streaming Reader

[VERIFIED: node_modules/next/dist/docs/01-app/02-guides/streaming.md lines 731–752]

The route handler emits raw `Uint8Array` chunks. The client reader loop:

```typescript
// Source: next/dist/docs/01-app/02-guides/streaming.md (verified locally)
// Pattern adapted for the cover-letter component

const abortRef = useRef<AbortController | null>(null)

async function handleGenerateLetter() {
  // 1. Snapshot the cvText at click-time (D-02)
  const cvText = toPlainText(lebenslauf!, sectionOrder)

  // 2. Cancel any in-flight request (Regenerate path)
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller

  // 3. Transition to streaming phase
  dispatch({ type: 'COVER_LETTER_STREAMING' })
  setLetterText('')

  try {
    const res = await fetch('/api/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText, jobPosting, answers }),
      signal: controller.signal,
    })

    if (!res.ok || !res.body) {
      const msg = await res.text().catch(() => 'Generation failed.')
      dispatch({ type: 'COVER_LETTER_ERROR', payload: msg })
      return
    }

    const reader = res.body.getReader()
    // CRITICAL: { stream: true } keeps multi-byte UTF-8 sequences intact
    // across chunk boundaries (e.g., German umlauts split across two chunks)
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      if (chunk) {
        setLetterText(prev => prev + chunk)
      }
    }
    // Flush any remaining bytes in the decoder buffer
    const tail = decoder.decode()
    if (tail) setLetterText(prev => prev + tail)

    dispatch({ type: 'COVER_LETTER_DONE' })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return // intentional cancel
    dispatch({ type: 'COVER_LETTER_ERROR', payload: 'Network error — please try again.' })
  }
}

// Cleanup on unmount
useEffect(() => {
  return () => abortRef.current?.abort()
}, [])
```

**Why `letterText` is local `useState`, not in the reducer:**
- Reducers must be pure and synchronous. Appending a token per chunk in the reducer would cause a full re-render of the entire `Home` component on every token.
- Keeping `letterText` in a local `useState` within the `CoverLetterStreaming` / `CoverLetterResult` view component means only that sub-tree re-renders per token.
- The reducer only transitions phases (`COVER_LETTER_STREAMING`, `COVER_LETTER_DONE`, `COVER_LETTER_ERROR`) — coarse-grained transitions, not per-token updates.
- On `COVER_LETTER_DONE`, the `letterText` value is already in the local state and the result view reads it directly. No need to copy it into the reducer.

---

## Reducer Extension Pattern

[VERIFIED: scanready/src/app/page.tsx lines 13–59]

Current `AppPhase` union (line 13):
```typescript
type AppPhase = 'input' | 'loading' | 'result' | 'error' | 'junk'
```

Extended union (add four new phases):
```typescript
type AppPhase = 
  | 'input' | 'loading' | 'result' | 'error' | 'junk'
  | 'cover_letter_input'
  | 'cover_letter_streaming'
  | 'cover_letter_result'
  | 'cover_letter_error'
```

New `AppState` fields (add to existing shape):
```typescript
type AppState = {
  phase: AppPhase
  resumeText: string           // EXISTING — persists through all phases
  lebenslauf: Lebenslauf | null  // EXISTING — remains set from Phase 1 result
  sectionOrder: string[]       // EXISTING — needed by toPlainText at CL submission time
  errorMessage: string | null  // EXISTING — reused for cover_letter_error message
  // NEW — cover-letter sub-flow inputs (must survive streaming so Regenerate works)
  jobPosting: string
  answers: { question: string; answer: string }[]
}
```

New actions:
```typescript
| { type: 'START_COVER_LETTER' }                           // result → cover_letter_input
| { type: 'SET_JOB_POSTING'; payload: string }
| { type: 'SET_ANSWER'; payload: { index: number; answer: string } }
| { type: 'COVER_LETTER_STREAMING' }                       // cover_letter_input → streaming
| { type: 'COVER_LETTER_DONE' }                            // streaming → result
| { type: 'COVER_LETTER_ERROR'; payload: string }          // streaming → error
| { type: 'COVER_LETTER_REGENERATE' }                      // result → streaming (same inputs)
```

`initialState` gains two new zero-value fields:
```typescript
const initialState: AppState = {
  // ...existing fields unchanged...
  jobPosting: '',
  answers: [],
}
```

`RESET` already returns `initialState` (line 59) — this covers `jobPosting` and `answers` reset for free.

---

## Reuse Map: Confirmed Asset Signatures

[VERIFIED: scanready/ source files read directly]

### `toPlainText`
- File: `src/lib/lebenslauf-utils.ts` lines 56–152
- Signature: `toPlainText(l: Lebenslauf, sectionOrder: string[]): string`
- Output: plain text with German DIN section headings, no HTML
- Call site: `const cvText = toPlainText(state.lebenslauf!, state.sectionOrder)` at "Anschreiben generieren" click
- No changes needed

### `EditableField`
- File: `src/components/EditableField.tsx`
- Props: `{ value: string | null, placeholder?: string, multiline?: boolean, onSave: (newValue: string) => void, onBlurFormat?: (raw: string) => string, className?: string }`
- Multiline mode: renders `<textarea rows={3}>` with blur-commit and Escape-cancel
- For the post-stream editable letter: use with `multiline={true}`. The `rows={3}` in `EditableField` multiline is hardcoded — the UI-SPEC calls for `rows={18}` for the letter. Executor must either: (a) pass `className` with height override, or (b) render a plain controlled `<textarea rows={18}>` instead of `EditableField` for the letter block. Option (b) is simpler and avoids the `EditableField` row-count mismatch.
- `onBlurFormat` is not needed for the letter (no date normalization)
- No API changes needed

### Copy-button pattern
- File: `src/app/page.tsx` lines 400–413 (`ResultView.handleCopy`)
- Pattern: local `useState<'idle' | 'copied' | 'error'>('idle')`, `navigator.clipboard.writeText(text)`, success → `'copied'` for 1500ms, catch → `'error'` for 3000ms
- Copy the pattern verbatim for the Anschreiben copy button

### `animate-pulse` skeleton
- File: `src/app/page.tsx` lines 363–386 (`LoadingView`)
- Pattern: `<div role="status" aria-label="..."><div className="animate-pulse flex flex-col gap-3">...</div><p className="text-sm text-zinc-400">...</p></div>`
- Reuse skeleton block markup verbatim; change `aria-label` and status text to German per UI-SPEC

### Error view
- File: `src/app/page.tsx` lines 461–487 (`ErrorView`)
- Pattern: red callout box (`border-red-100 bg-red-50`) + "Something went wrong" heading + "Try again" button
- Reuse for `cover_letter_error` phase; wire "Try again" to re-run the same `handleGenerateLetter` call

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plain-text `.txt` download | A server endpoint that returns the file | `Blob` + `URL.createObjectURL` + `<a download>` | No server round-trip needed; letter is already in client state; browser handles the download natively |
| Multi-byte character decoding across chunk boundaries | Manual byte-splicing logic | `new TextDecoder()` with `{ stream: true }` flag | The flag buffers incomplete multi-byte sequences (e.g., ä, ö, ü) between `decode()` calls; without it, umlauts in chunks that land on a byte boundary produce replacement characters (U+FFFD) |
| Abort-on-unmount | No cleanup / ignoring unmount | `AbortController` stored in `useRef`, aborted in `useEffect` cleanup | Without abort, the reader loop continues running after the component is gone, causing "Can't perform a React state update on an unmounted component" and memory leaks |
| Re-render throttling | Manual batching / debounce of token appends | `setLetterText(prev => prev + chunk)` (functional update) | React 19 auto-batches state updates. The functional update form avoids stale closure issues. One re-render per chunk is acceptable for a single text block; do not add artificial buffering/debounce |
| Regenerate state management | Complex "save old letter" flow | Keep `jobPosting` + `answers` in reducer state; `handleGenerateLetter` re-reads them | The inputs are already in state from the first run; Regenerate just re-invokes `handleGenerateLetter` after transitioning to `cover_letter_streaming`. Old letter is overwritten — expected per D-06 |

**Key insight:** The browser Web Streams API (`getReader()` + `TextDecoder`) is the correct, complete solution for this use case. Any wrapper (EventSource, Vercel AI SDK streaming helpers, SSE parsers) adds indirection over an already-working plain-text stream.

---

## Common Pitfalls

### Pitfall 1: `TextDecoder` without `{ stream: true }` corrupts German umlauts
**What goes wrong:** German text contains multi-byte UTF-8 characters (ä = 0xC3 0xA4, ö = 0xC3 0xB6, ü = 0xC3 0xBC). When a chunk boundary falls between the two bytes of such a character, `decode(value)` without `stream: true` emits U+FFFD (replacement character) and discards the second byte — corrupting every umlaut that lands on a boundary.
**Why it happens:** Without `{ stream: true }`, the decoder treats each `decode()` call as a complete buffer and flushes any incomplete sequence immediately.
**How to avoid:** Always instantiate `new TextDecoder()` (no constructor args) and call `decoder.decode(value, { stream: true })` inside the loop, then `decoder.decode()` (no args) after the loop to flush remaining bytes.
**Warning signs:** "Replacement character" boxes (?) appearing in the streamed letter; corrupted ä/ö/ü.

### Pitfall 2: Editing the letter during streaming (cursor fight)
**What goes wrong:** If `EditableField` is active while tokens are appending to `letterText`, every token append triggers a re-render, clobbering the user's cursor position and drafts.
**Why it happens:** The `value` prop of `EditableField` updates externally while the user is editing.
**How to avoid:** D-06 locks this — the letter block is `<pre>` (read-only, no `EditableField`) during `cover_letter_streaming`. The `EditableField` / `<textarea>` only mounts in `cover_letter_result` after `COVER_LETTER_DONE`.
**Warning signs:** Users report cursor jumping mid-edit; draft text lost after a render.

### Pitfall 3: Orphaned reader on unmount or Regenerate
**What goes wrong:** User clicks "Regenerate" or "Start over" while a stream is in progress. The old `reader.read()` loop is still awaiting — it will complete, call `setLetterText` on the now-irrelevant component, and cause state corruption or React warnings.
**Why it happens:** `fetch` with `getReader()` is an async imperative loop; React has no automatic cleanup for imperative async work.
**How to avoid:** Store `AbortController` in `useRef`. Call `controller.abort()` at the start of `handleGenerateLetter` (cancels any previous in-flight request) and in a `useEffect` cleanup (abort on unmount). The `catch` block must check `err.name === 'AbortError'` and return silently.
**Warning signs:** Two letters streaming simultaneously (if you click Regenerate too fast); React warning "Can't perform a state update on an unmounted component."

### Pitfall 4: Pre-token silence mistaken for a hang
**What goes wrong:** The `animate-pulse` skeleton is dismissed too early (e.g., on `fetch` promise resolution rather than on first non-empty chunk), leaving a blank area before the first token arrives.
**Why it happens:** Adaptive thinking in `claude-opus-4-8` processes reasoning before emitting text. Thinking blocks are filtered server-side (`thinking_delta` excluded in `route.ts` lines 38–41), so the client sees no events for several seconds.
**How to avoid:** Keep the skeleton visible until `letterText.length > 0` (i.e., the first non-empty `chunk` has arrived). Do not transition away from the skeleton on `response.ok` — only on the first actual text chunk. The UI-SPEC and D-05 confirm: hold skeleton for the full pre-token pause; no timeout fallback.
**Warning signs:** Brief flash of empty white space before the letter starts streaming.

### Pitfall 5: `answers` array shape mismatch
**What goes wrong:** `buildCoverLetterUser` (verified: `prompts.ts` line 64–72) expects `answers: { question: string; answer: string }[]`. If the form state stores answers as `string[]` (indexed by question), the builder will receive the wrong shape.
**Why it happens:** It is tempting to store answers as `string[]` and map them on submit. The map step is easy to forget or misindex.
**How to avoid:** Store answers in reducer as `{ question: string; answer: string }[]` from the start, initialized from `PERSONALIZATION_QUESTIONS`. On `SET_ANSWER { index, answer }`, update `answers[index].answer` — the `question` field is set at initialization from `PERSONALIZATION_QUESTIONS[index]`.

### Pitfall 6: `GENERATION_MODEL` is currently `claude-haiku-4-5`
**What goes wrong:** The cover letter generates but is noticeably lower quality than expected.
**Why it happens:** `src/lib/anthropic.ts` line 17 shows `GENERATION_MODEL = "claude-haiku-4-5"` — a temporary edit by the user during testing (documented in CONTEXT.md deferred section).
**How to avoid:** The very first task in Phase 2 must restore `GENERATION_MODEL` to `"claude-opus-4-8"`. This is a one-line edit, but failing to do it means all dogfooding runs use the wrong model.
**Warning signs:** Letter generation completes quickly (Haiku is much faster); cover letter prose quality is generic.

---

## Code Examples

### `.txt` Download (browser-native, no server)

```typescript
// Source: browser Web APIs — standard pattern
// Filename: anschreiben.txt (locked per CONTEXT.md Claude's Discretion)
function handleDownload(letterText: string) {
  const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'anschreiben.txt'
  a.click()
  URL.revokeObjectURL(url)
}
```

### "Click to edit" one-shot dismiss hint

```typescript
// Source: UI-SPEC § CoverLetterResult
// Local state — not in reducer; disappears after first click
const [showEditHint, setShowEditHint] = useState(true)

// In render:
{showEditHint && (
  <p
    className="text-sm text-zinc-400 cursor-pointer"
    onClick={() => setShowEditHint(false)}
  >
    Klicken zum Bearbeiten
  </p>
)}
```

### D-09 Prompt Edit — one line to remove from `COVER_LETTER_SYSTEM`

Current `COVER_LETTER_SYSTEM` (prompts.ts lines 53–55):
```
- End with a short note (in [brackets]) reminding the user to have a native German
  speaker review before sending.

Write only the letter (plus the bracketed review note). No preamble.
```

After edit (delete the note directive, update final instruction):
```
Write only the letter. No preamble.
```

The trust nudge moves to the UI (distinct callout block per D-09 / UI-SPEC). Grounding directives (lines 42–51) are untouched.

### `buildCoverLetterUser` call site

```typescript
// Source: prompts.ts lines 63–72 (verified signature)
// Called inside handleGenerateLetter, after form submission

const payload = {
  cvText: toPlainText(state.lebenslauf!, state.sectionOrder),
  jobPosting: state.jobPosting,
  answers: state.answers, // shape: { question: string; answer: string }[]
}

const res = await fetch('/api/cover-letter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: controller.signal,
})
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| SSE / EventSource for streaming text | `response.body.getReader()` on a `text/plain` stream | No special server protocol needed; route already emits plain text; EventSource requires `text/event-stream` format |
| `useState` per-field form | Controlled inputs in `useReducer` | Consistent with existing Phase 1 pattern; avoids component-local state drift |
| Copy via `document.execCommand('copy')` | `navigator.clipboard.writeText()` | `execCommand` is deprecated; Clipboard API is the current standard |

**Deprecated / outdated:**
- `document.execCommand('copy')`: deprecated; avoid — `navigator.clipboard.writeText` is already in use in Phase 1.
- `EventSource` / `text/event-stream` for this route: the route emits `text/plain`, not SSE format. EventSource would fail silently or mis-parse.

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` per config.

### Applicable ASVS Categories (ASVS Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 2; zero-retention MVP |
| V3 Session Management | No | Stateless; no sessions |
| V4 Access Control | No | No user accounts |
| V5 Input Validation | Yes | Job posting and answers are user-controlled strings sent to the API. The backend (`route.ts` line 14–19) validates presence only. Length guard is Phase 3 (TRUST-03) — not in Phase 2 scope. Client-side: disable submit if `jobPosting.trim() === ''` (D-04). |
| V6 Cryptography | No | No crypto in Phase 2 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via streamed letter content | Tampering | Render streamed `letterText` as text node in `<pre>` (not `dangerouslySetInnerHTML`). After stream, if using `EditableField`, values are rendered as controlled `value` props — not HTML. No injection vector. |
| Prompt injection via job posting | Tampering | `COVER_LETTER_SYSTEM` grounding directives are the mitigation — already in place. Phase 2 does not weaken them. The D-09 edit only removes the bracket note; all grounding/anti-fabrication lines stay. |
| User CV/PII in browser state | Info disclosure | `resumeText`, `lebenslauf`, `letterText` live in component memory only. `RESET` clears all state. No `localStorage`, no `sessionStorage`, no server persistence. Consistent with zero-retention guarantee. |
| Clipboard access prompt (HTTPS required) | — | `navigator.clipboard.writeText` requires a secure context (HTTPS). In local dev on `localhost`, it works. On Vercel (Phase 4), HTTPS is automatic. No action needed in Phase 2. |

---

## Environment Availability

Phase 2 is UI code changes + one prompt edit. No new external tools required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥ 20.9 | Next.js 16 (PRE-01) | Confirmed complete in Phase 1 | 20.x | N/A — already resolved |
| `ANTHROPIC_API_KEY` | `/api/cover-letter` | Must be set in `.env.local` | — | No fallback; required for generation |
| `GENERATION_MODEL` = claude-opus-4-8 | Quality moat | Currently `claude-haiku-4-5` — must be restored | — | No fallback; restore before dogfooding |

**Missing dependencies with no fallback:**
- `GENERATION_MODEL` must be restored to `claude-opus-4-8` in `src/lib/anthropic.ts` before the first dogfooding run.

---

## Open Questions

1. **`EditableField` vs plain `<textarea>` for post-stream letter editing**
   - What we know: `EditableField` with `multiline={true}` renders `rows={3}` (hardcoded in component). UI-SPEC calls for `rows={18}` for the letter block.
   - What's unclear: Whether to extend `EditableField` to accept a `rows` prop, or just use a plain controlled `<textarea rows={18}>` for the letter block specifically.
   - Recommendation: Use a plain controlled `<textarea rows={18}>` for the letter block. It is simpler, avoids modifying `EditableField`, and the `EditableField` click-to-edit swap interaction is not needed here (the letter is always in edit mode after `done`). The "Klicken zum Bearbeiten" hint is a one-shot dismiss implemented separately.

2. **`answers` initialization in reducer vs component**
   - What we know: `PERSONALIZATION_QUESTIONS` is a static array of 5 strings imported from `prompts.ts`. The form renders all 5 at once (D-03).
   - What's unclear: Whether to initialize `answers` in `initialState` as `PERSONALIZATION_QUESTIONS.map(q => ({ question: q, answer: '' }))` (pre-populated in reducer) or to do the mapping only at `fetch` call time.
   - Recommendation: Pre-populate in `initialState`. This makes the reducer self-consistent and simplifies the `SET_ANSWER` action (just update `answers[index].answer` by index). Avoids a mapping step at submit time that could introduce index errors.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `navigator.clipboard.writeText` works in all browsers targeted (Phase 2 is pre-deploy, local dev only) | Security Domain | Low risk in Phase 2; HTTPS is not required on `localhost`. In Phase 4 (Vercel), HTTPS is automatic. |
| A2 | React 19 auto-batches `setLetterText(prev => prev + chunk)` calls in the reader loop, so one render fires per chunk (not multiple) | Core streaming pattern | If wrong: additional renders per token, but no correctness issue. Unlikely to be wrong — React 19 batching is a documented guarantee. |

**All other claims are VERIFIED** against files read in this session:
- Streaming reader pattern: `node_modules/next/dist/docs/01-app/02-guides/streaming.md`
- Route output shape: `src/app/api/cover-letter/route.ts`
- Reducer structure: `src/app/page.tsx`
- `EditableField` API: `src/components/EditableField.tsx`
- `toPlainText` signature: `src/lib/lebenslauf-utils.ts`
- `buildCoverLetterUser` signature + `PERSONALIZATION_QUESTIONS`: `src/lib/prompts.ts`
- `GENERATION_MODEL` current value: `src/lib/anthropic.ts`
- UI styling contract: `.planning/phases/02-cover-letter-flow/02-UI-SPEC.md`

---

## Sources

### Primary (HIGH confidence — local codebase, verified by direct file read)

| File | Lines Read | What Was Verified |
|------|-----------|-------------------|
| `scanready/src/app/api/cover-letter/route.ts` | All | Route signature, streaming mechanism, `Content-Type`, `maxDuration=120`, `answers` shape, adaptive thinking usage |
| `scanready/src/app/page.tsx` | All | `AppPhase` union, `AppState` shape, `AppAction` union, `reducer` switch, `initialState`, copy-button pattern, `LoadingView` skeleton, `ErrorView` pattern, `ResultView` layout |
| `scanready/src/lib/prompts.ts` | All | `COVER_LETTER_SYSTEM` content (bracket note to remove), `buildCoverLetterUser` signature, `PERSONALIZATION_QUESTIONS` array (5 items) |
| `scanready/src/lib/lebenslauf-utils.ts` | All | `toPlainText(l, sectionOrder)` signature and output format |
| `scanready/src/components/EditableField.tsx` | All | Props interface, multiline mode, `rows={3}` hardcoded, commit/cancel logic |
| `scanready/src/lib/anthropic.ts` | All | `GENERATION_MODEL = "claude-haiku-4-5"` (needs restore to opus-4-8) |

### Secondary (MEDIUM confidence — Next.js local docs, read from node_modules)

| File | Lines Read | What Was Verified |
|------|-----------|-------------------|
| `node_modules/next/dist/docs/01-app/02-guides/streaming.md` | All | `response.body.getReader()` + `TextDecoder` client-side pattern; chunked transfer; Route Handler streaming; Safari 1024-byte buffer note |

### Planning documents read (HIGH confidence — project artifacts)

- `.planning/phases/02-cover-letter-flow/02-CONTEXT.md` — all decisions D-01..D-09, locked
- `.planning/phases/02-cover-letter-flow/02-UI-SPEC.md` — full styling/interaction contract
- `.planning/phases/01-pre-flight-parse-flow/01-CONTEXT.md` — Phase 1 decisions carried forward
- `.planning/REQUIREMENTS.md` — CL-01..CL-06 requirements
- `.planning/STATE.md` — project state

---

## Metadata

**Confidence breakdown:**
- Standard stack / reuse map: HIGH — read directly from source files this session
- Streaming reader pattern: MEDIUM — from Next.js local docs (next/dist/docs), which are authoritative for the installed version
- Pitfalls: HIGH — derived from reading actual route + component code; no external sources needed
- Architecture: HIGH — grounded in the existing reducer structure

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stable stack — no external dependencies changing)
