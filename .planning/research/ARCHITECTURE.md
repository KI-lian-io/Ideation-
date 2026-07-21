# Architecture Research

**Domain:** Single-page multi-step AI form flow (Next.js App Router, stateless)
**Researched:** 2026-06-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     page.tsx (Client Component)                  │
│                  Step state machine (useState)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ CVInputStep  │  │ LebenslaufStep│  │  PersonalizationStep   │ │
│  │              │  │              │  │  (job posting +        │ │
│  │ <textarea>   │  │ Lebenslauf   │  │   5 Q&A inputs)        │ │
│  │ "Parse CV"   │  │ NormGapPanel │  │   "Generate Letter"    │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                 │                       │              │
├─────────┼─────────────────┼───────────────────────┼──────────────┤
│         │    Fetch calls  │                       │              │
│  POST /api/parse          │            POST /api/cover-letter    │
│  ← { lebenslauf }         │            ← ReadableStream (text)   │
│                           │                                      │
│              ┌────────────────────────────────────┐              │
│              │      AnschreibenStep               │              │
│              │      StreamingTextView             │              │
│              │      CopyDownloadPanel             │              │
│              └────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┴───────────────────┐
              │     Existing Backend (unchanged)    │
              │                                     │
              │  /api/parse   — structured output   │
              │  /api/cover-letter — streamed text  │
              └─────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `page.tsx` | Owns all page state; drives step machine; calls APIs | Client Component with `useState` / `useReducer` |
| `CVInputStep` | Textarea for CV paste; "Parse" submit button; loading state | Controlled form element |
| `LebenslaufStep` | Renders parsed German Lebenslauf sections; shows normGapNotes + photoAdvice | Pure display; receives `Lebenslauf` prop |
| `NormGapPanel` | Renders `normGapNotes[]` + `photoAdvice` as English explanations | No API call — data is already in parse result |
| `PersonalizationStep` | Job-posting textarea + 5 Q&A inputs (from `PERSONALIZATION_QUESTIONS`); "Generate Anschreiben" submit | Controlled form; receives questions from prompts constant |
| `AnschreibenStep` | Reads `Response.body` stream; appends chunks to local state; shows streamed text live | `useRef` / `useState` for accumulating stream |
| `CopyDownloadPanel` | Copy-to-clipboard + download as .txt; shown once stream is complete | No API; operates on final string |
| `PostHogEvents` | Fire `start`, `parse_done`, `letter_done`, `copy`, `download` events | Thin wrapper around posthog-js calls |

## Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx               # Client Component — step machine + API calls
│   ├── layout.tsx             # Existing; add PostHog provider here
│   ├── globals.css            # Existing
│   └── api/
│       ├── parse/route.ts     # Existing — unchanged
│       └── cover-letter/route.ts  # Existing — unchanged
├── components/
│   ├── steps/
│   │   ├── CVInputStep.tsx          # Step 1: paste CV
│   │   ├── LebenslaufStep.tsx       # Step 2: show parsed result
│   │   ├── PersonalizationStep.tsx  # Step 3: job posting + Q&A
│   │   └── AnschreibenStep.tsx      # Step 4: stream + copy/download
│   └── ui/
│       ├── NormGapPanel.tsx         # English explanations panel
│       ├── LebenslaufPreview.tsx    # Formatted Lebenslauf display
│       └── CopyDownloadPanel.tsx    # Copy + download buttons
└── lib/
    ├── anthropic.ts     # Existing — unchanged
    ├── prompts.ts       # Existing — unchanged
    ├── schema.ts        # Existing — unchanged
    └── posthog.ts       # New: PostHog client init + typed event helpers
```

### Structure Rationale

- **`components/steps/`:** Each step is a distinct screen slice. Keeping steps separate means each can be built, tested, and styled independently without touching page.tsx or the others.
- **`components/ui/`:** Sub-components that render data (NormGapPanel, LebenslaufPreview) and action panels (CopyDownload) live separately so they can be restyled during the design pass without touching step logic.
- **`lib/posthog.ts`:** Centralising PostHog here keeps event names as typed constants and makes them easy to audit.

## Architectural Patterns

### Pattern 1: Top-Down Step State Machine in page.tsx

**What:** `page.tsx` holds a single `step` discriminant plus all cross-step data in one `useState` object. Each step component receives only what it needs as props and fires a callback to advance.

**When to use:** Four clearly sequential steps with shared data passed forward. Far simpler than a dedicated state library for this scope.

**Trade-offs:** All state lives at root — easy to follow; will feel slightly over-populated if the form grows past ~8 fields. Acceptable for this scope.

**Example:**
```typescript
type Step = "input" | "lebenslauf" | "personalization" | "anschreiben";

interface PageState {
  step: Step;
  resumeText: string;         // needed for /api/cover-letter (cvText param)
  lebenslauf: Lebenslauf | null;
  jobPosting: string;
  answers: { question: string; answer: string }[];
  letterText: string;
}

// In page.tsx:
const [state, setState] = useState<PageState>({ step: "input", ... });
```

### Pattern 2: Fetch-then-Advance for /api/parse

**What:** On "Parse CV" submit, call `fetch('/api/parse', ...)`, await the JSON response, store `lebenslauf` in page state, then advance `step` to `"lebenslauf"`.

**When to use:** Synchronous (non-streaming) JSON endpoint. Simple async/await pattern; no special reader needed.

**Trade-offs:** Blocks UI while Anthropic responds (~5–15 s for Opus). Show a spinner / skeleton; disable the submit button. Do not poll — wait for the response.

**Example:**
```typescript
async function handleParse() {
  setLoading(true);
  const res = await fetch("/api/parse", {
    method: "POST",
    body: JSON.stringify({ resumeText: state.resumeText }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  setState(s => ({ ...s, lebenslauf: data.lebenslauf, step: "lebenslauf" }));
  posthog.capture("parse_done");
  setLoading(false);
}
```

### Pattern 3: ReadableStream Reader for /api/cover-letter

**What:** Call `fetch('/api/cover-letter', ...)`, get `response.body`, create a `ReadableStreamDefaultReader`, loop `reader.read()` in a while loop, decode each `Uint8Array` chunk with `TextDecoder`, and append to a `useState` string. Advance `step` to `"anschreiben"` immediately on first chunk so the UI shows the streaming view before the full letter arrives.

**When to use:** The cover-letter route returns `text/plain` as a raw stream — no SSE framing, no JSON. Read it as raw bytes.

**Trade-offs:** More verbose than EventSource, but EventSource requires `text/event-stream` format which the backend does not use. The raw reader is the correct match for this backend contract.

**Example:**
```typescript
async function handleGenerate() {
  const res = await fetch("/api/cover-letter", {
    method: "POST",
    body: JSON.stringify({ cvText: state.resumeText, jobPosting: state.jobPosting, answers: state.answers }),
    headers: { "Content-Type": "application/json" },
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  setState(s => ({ ...s, step: "anschreiben", letterText: "" }));
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    setState(s => ({ ...s, letterText: s.letterText + decoder.decode(value) }));
  }
  posthog.capture("letter_done");
}
```

## Data Flow

### Full Request Flow

```
User pastes CV
    ↓
CVInputStep (state.resumeText)
    ↓ "Parse CV" button
page.tsx → POST /api/parse { resumeText }
    ↓ await JSON
state.lebenslauf = Lebenslauf   ← KEEP state.resumeText (needed later for /api/cover-letter)
step → "lebenslauf"
    ↓
LebenslaufStep renders:
  - German Lebenslauf sections (from state.lebenslauf)
  - NormGapPanel: state.lebenslauf.normGapNotes[] + .photoAdvice  (English — already in parse output)
"Looks good, continue" button
    ↓
step → "personalization"
PersonalizationStep:
  - jobPosting textarea
  - 5 Q&A inputs (PERSONALIZATION_QUESTIONS from prompts.ts)
    ↓ "Generate Anschreiben" button
page.tsx → POST /api/cover-letter {
  cvText: state.resumeText,       ← original text, NOT the parsed JSON
  jobPosting: state.jobPosting,
  answers: state.answers
}
    ↓ ReadableStream chunks
state.letterText accumulates
step → "anschreiben" (on first chunk)
    ↓
AnschreibenStep renders letterText live
CopyDownloadPanel shown when stream closes
```

### Key Data Notes

1. **`resumeText` must be preserved in page state through all steps.** `/api/cover-letter` takes `cvText` (the original text), not the structured `Lebenslauf` JSON. The parse result is display-only; the grounding contract for the cover letter route uses the raw CV text again.

2. **Bilingual content requires NO schema or prompt changes.** `normGapNotes` and `photoAdvice` are already written in English by the model (the system prompt for `/api/parse` is English). The UI renders them as an "What changed and why" panel alongside the German Lebenslauf — pure front-end labeling, zero API changes.

3. **PERSONALIZATION_QUESTIONS is a client-importable constant.** `PersonalizationStep` can import it directly from `@/lib/prompts` — no API call needed to fetch questions.

4. **Streaming step transition.** Advance `step` to `"anschreiben"` on the first chunk (not after the full stream), so the user sees text appearing immediately rather than a long blank wait.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–100 users/day | Current approach is correct — stateless, no DB, no queue needed |
| 100–2k users/day | Add Vercel Edge Config rate limiting on API routes; monitor Anthropic cost per parse vs. per letter; switch PARSE_MODEL to claude-sonnet-4-6 |
| 2k+ users/day | Add input-length guard (already flagged in PROJECT.md Active items) to bound per-request token cost; consider request queuing if Anthropic rate limits bite |

### Scaling Priorities

1. **First bottleneck:** Anthropic API cost. Parse is Opus (expensive). Switch `PARSE_MODEL` to `claude-sonnet-4-6` as soon as parse quality is confirmed via dogfood.
2. **Second bottleneck:** Vercel serverless cold starts on the cover-letter route (`maxDuration: 120`). Acceptable at MVP scale; revisit if p95 latency becomes a UX problem.

## Anti-Patterns

### Anti-Pattern 1: Calling /api/parse twice to get bilingual output

**What people do:** Add a second API call or a `/api/explain` route to generate English explanations of the Lebenslauf changes.

**Why it's wrong:** `normGapNotes` and `photoAdvice` are already English prose in the parse response. The model writes them in English because the system prompt is in English. A second call wastes ~$0.05–0.15 per user, adds latency, and creates a new failure mode.

**Do this instead:** Render `normGapNotes[]` and `photoAdvice` from `state.lebenslauf` directly in the UI. Label them "What changed and why" — that is the bilingual layer.

### Anti-Pattern 2: Storing lebenslauf in URL params or localStorage

**What people do:** Persist parsed output in the URL or localStorage to allow back-navigation or reload recovery.

**Why it's wrong:** The Lebenslauf JSON contains personal data (name, DOB, address, phone). Persisting it contradicts the zero-retention GDPR posture that is a core trust differentiator. It also bloats the URL.

**Do this instead:** Keep state in React component memory only. If the user reloads, they start over — this is correct and expected for a stateless tool. Phrase the UI so the flow is clearly single-session.

### Anti-Pattern 3: EventSource for the cover-letter stream

**What people do:** Try to use the browser's `EventSource` API to read the streamed response.

**Why it's wrong:** `EventSource` requires the server to emit `text/event-stream` format with `data: ...` framing. The `/api/cover-letter` route returns raw `text/plain` — no SSE framing. EventSource will never emit a message event.

**Do this instead:** Use `response.body.getReader()` (ReadableStream reader) to consume raw byte chunks as shown in Pattern 3 above.

### Anti-Pattern 4: Passing lebenslauf JSON (not resumeText) to /api/cover-letter

**What people do:** Send the structured `Lebenslauf` object as the `cvText` parameter to the cover-letter route because it "has all the CV data."

**Why it's wrong:** The cover-letter prompt is designed to be grounded in the applicant's original plain-text CV. The structured JSON strips context, formatting cues, and nuance that Anthropic's model uses to generate an authentic voice. The `buildCoverLetterUser` prompt builder explicitly labels the param `APPLICANT CV (facts to ground in)`.

**Do this instead:** Store `state.resumeText` (the original paste content) alongside `state.lebenslauf` throughout the flow, and pass `resumeText` as `cvText` to the cover-letter call.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Anthropic API | Server-side only via `@anthropic-ai/sdk`; never called from browser | API key in `.env.local`; never expose to client |
| PostHog | Browser-side via `posthog-js`; init in `layout.tsx` or a Provider component | Events: `start`, `parse_done`, `letter_done`, `copy`, `download` |
| Vercel | Deploy via `vercel.json` or zero-config Next.js detection | Set `ANTHROPIC_API_KEY` as Vercel env var; `maxDuration` already set on both routes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` ↔ step components | Props + callbacks (no context needed at this scale) | Steps are presentational; page owns all mutation |
| `page.tsx` ↔ `/api/parse` | `fetch` → `await res.json()` | Response shape: `{ lebenslauf: Lebenslauf }` |
| `page.tsx` ↔ `/api/cover-letter` | `fetch` → `res.body.getReader()` raw stream | No JSON wrapping; raw `text/plain` chunks |
| `PersonalizationStep` ↔ `PERSONALIZATION_QUESTIONS` | Direct import from `@/lib/prompts` | Client-side constant; no request needed |

## Build Order / Phase Dependencies

This is the primary output for the roadmap. Dependencies run top-to-bottom — each phase unblocks the next.

**Phase A — Skeleton + Parse flow (unblocks everything)**
Build `page.tsx` step machine + `CVInputStep` + `LebenslaufStep` + `NormGapPanel`. Wire to existing `/api/parse`. Confirm the parse→display loop works end-to-end. Dogfood Kilian's own CV.

**Phase B — Personalization + Cover Letter flow**
Build `PersonalizationStep` + `AnschreibenStep` with streaming reader + `CopyDownloadPanel`. Phase A's step machine and `state.resumeText` retention are prerequisites.

**Phase C — PostHog + Input guards**
Add `lib/posthog.ts`, fire the 5 events, add input-length guards on both API routes (already flagged in PROJECT.md Active). Requires Phase A and B to exist so event triggers have real callsites.

**Phase D — Design pass + Deploy**
Design pass (Tailwind, trust-forward, German-market credible). Vercel deploy with `ANTHROPIC_API_KEY`. Phases A–C must be complete so the designer is styling a working flow, not a skeleton.

No phase requires backend changes. The bilingual output (normGapNotes / photoAdvice) ships in Phase A as a UI label decision — zero API changes.

## Sources

- Codebase analysis: `scanready/src/app/api/parse/route.ts`, `scanready/src/app/api/cover-letter/route.ts`, `scanready/src/lib/schema.ts`, `scanready/src/lib/prompts.ts` — HIGH confidence (first-party source code)
- Product spec: `.planning/PROJECT.md`, `BUILD_PLAN.md` — HIGH confidence (owner-authored)
- Streaming pattern: Web Streams API (`ReadableStreamDefaultReader`) — standard browser API; matches `text/plain; charset=utf-8` response header on the cover-letter route

---
*Architecture research for: ScanReady front-end integration*
*Researched: 2026-06-22*
