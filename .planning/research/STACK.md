# Stack Research — ScanReady (Remaining Build)

**Domain:** Single-page AI-powered document transformation tool (Next.js 16 App Router)
**Researched:** 2026-06-22
**Confidence:** MEDIUM (all findings cross-checked against official docs; versions pinned from live npm/GitHub/Vercel sources)

> **Scope note:** The core stack is already locked and scaffolded (Next.js 16.2.9, React 19, Tailwind 4, @anthropic-ai/sdk 0.105, Zod 4.4.3). This file covers only the remaining build decisions: streaming patterns, client state, PDF extraction, analytics, and deployment specifics.

---

## Core Stack (Already Locked — Confirm Only)

| Technology | Installed Version | Status | Verdict |
|------------|-------------------|--------|---------|
| next | 16.2.9 | Locked | Confirmed correct. Node >=20.9.0 required — local env (18.14.0) must be upgraded before `npm install` works. |
| react / react-dom | 19.2.4 | Locked | Current. `use()` hook available for promise-based data. |
| @anthropic-ai/sdk | ^0.105.0 | Locked | Verified 0.105.0 is the current release. All API shapes confirmed (see SDK Helpers section). |
| zod | ^4.4.3 | Locked | Confirmed compatible with @anthropic-ai/sdk — peer dep range is `^3.25.0 \|\| ^4.0.0`. No changes needed. |
| tailwindcss | ^4 | Locked | Correct. |

---

## Remaining Build: Technology Decisions

### 1. Streaming (Client-side consumption of `/api/cover-letter`)

**Decision: The existing pattern is correct. No change needed.**

The current `cover-letter/route.ts` creates a `ReadableStream`, enqueues `TextEncoder` chunks for each `text_delta` event, and returns `new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })`. This is the idiomatic Next.js 16 App Router pattern, confirmed in the official streaming guide (v16.2.9, last updated 2026-05-13).

**Client-side consumption pattern** (what to build in the UI component):

```typescript
// In a 'use client' component
const res = await fetch('/api/cover-letter', { method: 'POST', body: JSON.stringify(payload) });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setStreamedText(prev => prev + decoder.decode(value, { stream: true }));
}
```

**Why not SSE (Server-Sent Events):** SSE adds a structured event-framing protocol on top of plain text. The cover-letter route emits raw text only — no event types, no reconnection needed. Plain `ReadableStream` is simpler and sufficient.

**Why not Vercel AI SDK `useChat`/`streamText`:** Over-engineering. This app owns both the route and the client; the Anthropic SDK already gives a clean stream. Adding Vercel AI SDK as an abstraction layer introduces a dependency with its own Zod v4 incompatibilities (distinct from the direct Anthropic SDK — see pitfalls).

**Recommended header addition** (low-risk improvement):

```typescript
return new Response(body, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',  // add this
  },
});
```

**Safari buffering note:** Safari buffers streaming responses until 1,024 bytes are received. For a German cover letter (typically 400–600 words), this threshold is exceeded within the first few chunks. Not a practical issue.

---

### 2. Client-Side State (Multi-Step Flow)

**Decision: `useReducer` in a single top-level `'use client'` component. No external state library.**

The flow has four sequential steps with interdependent state transitions:

```
Step 0: CV input (cvText)
  → dispatch PARSE_START → Step 1 (isLoading)
  → dispatch PARSE_DONE(lebenslauf) → Step 2
Step 2: Job posting + 3–5 Q&A answers
  → dispatch STREAM_START → Step 3 (isStreaming)
  → dispatch STREAM_CHUNK(text) → accumulate
  → dispatch STREAM_DONE → Step 3 final
```

**Why `useReducer` over multiple `useState` calls:** Five or more interdependent state fields (currentStep, cvText, lebenslauf, answers, streamedText, isStreaming) managed with individual `useState` calls creates race conditions on step transitions — e.g., `setLebenslauf(data)` and `setCurrentStep(2)` are two separate re-renders. A reducer makes transitions atomic.

**Why not Zustand:** Zustand's value is cross-component global state without Provider wrapping. All state here lives in one linear component tree on a single page. Zustand would add a dependency without adding value. Add it only if state needs to be shared across unrelated subtrees (not the case here).

**Why not React Context:** Context is for sharing values across deeply-nested components without prop drilling. With a 4-step wizard in a single-page component, passing props one level deep to step sub-components is cleaner and more explicit than a context provider.

**Recommended state shape:**

```typescript
type Step = 0 | 1 | 2 | 3;
type Action =
  | { type: 'SET_CV'; cvText: string }
  | { type: 'PARSE_START' }
  | { type: 'PARSE_DONE'; lebenslauf: Lebenslauf }
  | { type: 'PARSE_ERROR'; message: string }
  | { type: 'SET_ANSWERS'; answers: Answer[] }
  | { type: 'STREAM_START' }
  | { type: 'STREAM_CHUNK'; text: string }
  | { type: 'STREAM_DONE' }
  | { type: 'RESET' };

type State = {
  step: Step;
  cvText: string;
  lebenslauf: Lebenslauf | null;
  answers: Answer[];
  streamedText: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
};
```

---

### 3. Analytics (PostHog)

**Decision: `posthog-js` only (no `posthog-node` for v1). Initialize via `instrumentation-client.ts`.**

**Install:**

```bash
npm install posthog-js
# posthog-node NOT needed for v1 — all events are client-side funnel events
```

**Versions:**
- `posthog-js`: latest is `1.391.2` (published 2026-06-20). Pin to `^1.391.0`.
- `posthog-node`: defer — needed only if you add server-side flag evaluation or server-initiated events. Not required for the four funnel events (`start`, `parse_done`, `letter_done`, `copy_download`).

**Setup — `instrumentation-client.ts` at project root** (supported since Next.js 15.3, works in Next.js 16):

```typescript
// scanready/instrumentation-client.ts
import posthog from 'posthog-js';
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
  defaults: '2026-01-30',
  capture_pageview: false,   // manual — see PageviewTracker below
  capture_pageleave: true,
});
```

**Pageview tracking — CRITICAL Suspense requirement:**

`useSearchParams()` in App Router requires a `<Suspense>` boundary. Without it, the build fails with `missing-suspense-with-csr-bailout`. Wrap the `PageviewTracker` component:

```typescript
// In layout.tsx:
<Suspense fallback={null}>
  <PageviewTracker />
</Suspense>

// PageviewTracker.tsx ('use client'):
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!pathname || !(posthog as any).__loaded) return;
    const qs = searchParams?.toString();
    posthog.capture('$pageview', { $current_url: qs ? `${pathname}?${qs}` : pathname });
  }, [pathname, searchParams]);
  return null;
}
```

**Why not `@posthog/next`:** Pre-release as of June 2026. Not ready for production use.

**Environment variables to add to `.env.local` and Vercel:**

```
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<token>
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

### 4. PDF Text Extraction (Near-Term Add — Not v1)

**Decision: `unpdf` for client-side extraction. Do NOT send the raw PDF to the server.**

**Install (when building PDF support, not now):**

```bash
npm install unpdf
```

**Version:** `1.6.2` (released April 2026, actively maintained, MIT, 1.2k GitHub stars).

**Why `unpdf` over alternatives:**

| Library | Verdict | Reason |
|---------|---------|--------|
| `unpdf` | **Recommended** | Works browser + Node.js + edge. Modern async API. Ships serverless PDF.js build. |
| `pdfjs-dist` | OK but verbose | Same underlying engine as unpdf; unpdf is the cleaner wrapper. |
| `pdf-parse` | Avoid | Node.js only — cannot run in browser. Wrong for client-side extraction. |
| `pdf-lib` | Wrong tool | For creating/modifying PDFs, not extracting text. |

**Why client-side extraction (browser, not server route):**

Sending raw PDF bytes to a server route wastes bandwidth and hits Vercel's 4.5 MB request body limit for larger CVs. Extract text in the browser, send the extracted string to `/api/parse` — same API already used for the text-paste path.

**Usage pattern (browser `'use client'` component):**

```typescript
import { extractText, getDocumentProxy } from 'unpdf';

async function extractPDFText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}
```

**Bundle size note:** unpdf bundles PDF.js (~300 KB gzipped). Acceptable for a CV tool — users expect some load time for PDF processing. Use dynamic import (`import('unpdf')`) to lazy-load only when the user selects a PDF, so it does not block initial page load.

---

### 5. Deployment (Vercel)

**Node.js version — action required:**

Next.js 16 requires Node **>=20.9.0**. Local dev environment is 18.14.0 — must upgrade before running `npm install` or `npm run dev`.

Add to `scanready/package.json`:

```json
{
  "engines": {
    "node": ">=20.9.0"
  }
}
```

Vercel's default is now Node 24.x; specify `"node": "22.x"` in `package.json` engines or in Vercel Project Settings if you want a pinned LTS version.

**Function duration limits (confirmed from Vercel docs, updated 2026-06-02):**

With Fluid Compute enabled (default for all new projects since April 2025):

| Plan | Max duration |
|------|-------------|
| Hobby | 300s |
| Pro | 800s (1800s extended, beta) |

The existing `maxDuration: 120` (cover letter) and `maxDuration: 60` (parse) are both within hobby limits. No concern here — the 60s hobby limit was a myth from the pre-Fluid Compute era.

**Streaming:** Vercel Node.js runtime supports streaming natively. No extra configuration needed. The existing `export const runtime = "nodejs"` in both routes is correct.

**Required environment variable on Vercel:**

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Deploy steps:** Connect GitHub repo to Vercel project → framework auto-detected as Next.js → zero-config. Push to main branch triggers deploy.

---

## SDK Helpers: @anthropic-ai/sdk@0.105 Verification

### `messages.parse` + `zodOutputFormat` + Zod v4

**Status: Existing code in `parse/route.ts` is correct. No changes needed.**

Key verifications:
- `@anthropic-ai/sdk@0.105.0` declares zod as `"^3.25.0 || ^4.0.0"` (optional peer dep). **Zod v4 is officially supported.**
- Import path `@anthropic-ai/sdk/helpers/zod` is correct and unchanged.
- Parameter name is `output_config` (not the deprecated `output_format`). The existing code uses `output_config: { format: zodOutputFormat(LebenslaufSchema) }` — correct.
- `response.parsed_output` returns the typed, Zod-validated object or `null` on failure.
- `response.stop_reason === 'refusal'` check is the correct guard.

**Zod v4 schema safety:** The existing `LebenslaufSchema` uses only `z.object`, `z.array`, `z.string`, `z.nullable`, `z.string().nullable()` — all map cleanly to JSON Schema primitives that Anthropic's API accepts. The known failure mode (API rejecting schemas) is triggered by `z.number().min()`, `z.number().max()`, `z.exclusiveMinimum()` — none present in LebenslaufSchema.

**The Zod v4 incompatibility found on the web is NOT relevant here:** That issue is in the `vercel/ai` SDK provider (the abstraction layer), not in `@anthropic-ai/sdk` used directly. Using the Anthropic SDK directly, as this project does, is safe with Zod v4.

### `messages.stream` + adaptive thinking

**Status: Existing code in `cover-letter/route.ts` is correct. No changes needed.**

Key verifications:
- `thinking: { type: 'adaptive' }` is the correct syntax for `claude-opus-4-8`. Using `budget_tokens` causes a 400 error on this model — correctly omitted.
- The `for await (const event of stream)` async iterator pattern is the correct way to consume the stream in a route handler.
- Filter: `event.type === 'content_block_delta' && event.delta.type === 'text_delta'` correctly selects only text content. Thinking blocks emit `thinking_delta` type — these are correctly excluded by the existing filter, so they never appear in the streamed response to the client.
- The `.on('text', cb)` shorthand is also valid but harder to pipe into a `ReadableStream` controller. The iterator approach is the right choice for this pattern.

---

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| @anthropic-ai/sdk | 0.105.0 | zod ^3.25 \|\| ^4.x | Zod 4 officially supported as optional peer dep |
| next | 16.2.9 | Node >=20.9.0 | Node 18 not supported; local env must be upgraded |
| posthog-js | ^1.391.0 | Next.js 16, React 19 | instrumentation-client.ts pattern; Suspense wrapper required for pageview tracker |
| unpdf | ^1.6.2 | All JS runtimes | Dynamic import to avoid blocking initial load |
| zod | 4.4.3 | @anthropic-ai/sdk 0.105 | Standard schema primitives only; avoid .min/.max on numbers |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `vercel/ai` (AI SDK) | Its Zod v4 provider layer has known incompatibilities with Anthropic structured outputs; adds abstraction over SDK the project already uses directly | Continue using `@anthropic-ai/sdk` directly |
| `zustand` | No cross-component global state needed; single-page linear flow | `useReducer` in the page component |
| `react-hook-form` | 3–5 text answers and a textarea input; full form library is overkill | Controlled inputs with reducer state |
| `@posthog/next` | Pre-release as of June 2026 | `posthog-js` with `instrumentation-client.ts` |
| `pdf-parse` | Node.js only; cannot run client-side | `unpdf` (works browser + server) |
| `react-query` / `swr` | No cache-invalidation or background-refetch needed; stateless one-shot API calls | Direct `fetch` in event handlers |
| `next-auth` | Zero-retention MVP, no auth in scope | N/A — not needed |

---

## Installation Commands (Remaining Work)

```bash
cd scanready

# Upgrade Node first (required for Next.js 16)
# nvm use 20 OR nvm install 20 OR brew install node@20

# Install current dependencies (after Node upgrade)
npm install

# Add analytics
npm install posthog-js@^1.391.0

# Add PDF support (Phase 1, not now)
# npm install unpdf@^1.6.2
```

---

## Sources

- Next.js 16.2.9 official streaming guide (`nextjs.org/docs/app/guides/streaming`, last updated 2026-05-13) — confirmed ReadableStream route handler pattern and client-side reader loop — MEDIUM confidence
- Vercel Functions Limits (`vercel.com/docs/functions/limitations`, last updated 2026-06-02) — confirmed 300s hobby max duration with Fluid Compute — MEDIUM confidence
- Vercel Node.js versions (`vercel.com/docs/functions/runtimes/node-js/node-js-versions`) — confirmed Node 24.x default, 20/22/24 available — MEDIUM confidence
- `@anthropic-ai/sdk` GitHub `package.json` (`github.com/anthropics/anthropic-sdk-typescript/blob/main/package.json`) — confirmed Zod peer dep range `^3.25.0 || ^4.0.0` — MEDIUM confidence
- Anthropic structured outputs docs (`platform.claude.com/docs/en/build-with-claude/structured-outputs`) — confirmed `output_config.format` parameter shape and `parsed_output` field — MEDIUM confidence
- PostHog Next.js docs (`posthog.com/docs/libraries/next-js`) + DEV Community article on Suspense gotcha — confirmed instrumentation-client.ts pattern and Suspense/useSearchParams requirement — MEDIUM confidence (cross-checked two sources)
- `unpdf` GitHub (`github.com/unjs/unpdf`) — confirmed v1.6.2, browser support, API — MEDIUM confidence
- Web search: `posthog-js` latest version 1.391.2, npm 2026-06-20 — LOW confidence (websearch, not verified against npm registry directly)

---

*Stack research for: ScanReady — Next.js 16 AI document transformation tool*
*Researched: 2026-06-22*
