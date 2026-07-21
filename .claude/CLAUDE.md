<!-- GSD:project-start source:PROJECT.md -->

## Project

**ScanReady (working name)**

ScanReady is a free, stateless web tool that helps expats job-hunting in Germany turn a US/UK résumé into a norm-correct German **Lebenslauf** and generate an authentic-voice German **Anschreiben** (cover letter), grounded strictly in their real CV facts and their own answers. It's a tight-scope learning side project, dogfooded on the owner's own live applications.

**Core Value:** The German output is native-quality and trustworthy — norm-correct and never fabricated — so a German recruiter takes the applicant seriously in the 8-second scan. If everything else fails, the quality and grounding of the German documents must hold.

### Constraints

- **Tech stack**: Next.js 16 + TS + Tailwind + Claude API + Zod v4 — already scaffolded; don't re-litigate.
- **Runtime**: Node ≥ 20.9 required (Next 16) — local env currently 18.14.0.
- **Models**: `GENERATION_MODEL = claude-opus-4-8` (cover letter — quality is the moat); `PARSE_MODEL = claude-opus-4-8` (cost lever: switch to `claude-sonnet-4-6` once parse quality confirmed).
- **Legal / ethics**: grounded-only generation; GDPR zero-retention; native-quality German + a "have a native speaker review" nudge; nuanced photo guidance; no income claims; no detection-evasion.
- **Scope**: tight learning side project — keep scope minimal; do not re-open strategy exploration.
- **Budget**: free MVP; paid only as a later conversion test.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Core Stack (Already Locked — Confirm Only)

| Technology | Installed Version | Status | Verdict |
|------------|-------------------|--------|---------|
| next | 16.2.9 | Locked | Confirmed correct. Node >=20.9.0 required — local env (18.14.0) must be upgraded before `npm install` works. |
| react / react-dom | 19.2.4 | Locked | Current. `use()` hook available for promise-based data. |
| @anthropic-ai/sdk | ^0.105.0 | Locked | Verified 0.105.0 is the current release. All API shapes confirmed (see SDK Helpers section). |
| zod | ^4.4.3 | Locked | Confirmed compatible with @anthropic-ai/sdk — peer dep range is `^3.25.0 \|\| ^4.0.0`. No changes needed. |
| tailwindcss | ^4 | Locked | Correct. |

## Remaining Build: Technology Decisions

### 1. Streaming (Client-side consumption of `/api/cover-letter`)

### 2. Client-Side State (Multi-Step Flow)

### 3. Analytics (PostHog)

# posthog-node NOT needed for v1 — all events are client-side funnel events

- `posthog-js`: latest is `1.391.2` (published 2026-06-20). Pin to `^1.391.0`.
- `posthog-node`: defer — needed only if you add server-side flag evaluation or server-initiated events. Not required for the four funnel events (`start`, `parse_done`, `letter_done`, `copy_download`).

### 4. PDF Text Extraction (Near-Term Add — Not v1)

| Library | Verdict | Reason |
|---------|---------|--------|
| `unpdf` | **Recommended** | Works browser + Node.js + edge. Modern async API. Ships serverless PDF.js build. |
| `pdfjs-dist` | OK but verbose | Same underlying engine as unpdf; unpdf is the cleaner wrapper. |
| `pdf-parse` | Avoid | Node.js only — cannot run in browser. Wrong for client-side extraction. |
| `pdf-lib` | Wrong tool | For creating/modifying PDFs, not extracting text. |

### 5. Deployment (Vercel)

| Plan | Max duration |
|------|-------------|
| Hobby | 300s |
| Pro | 800s (1800s extended, beta) |

## SDK Helpers: @anthropic-ai/sdk@0.105 Verification

### `messages.parse` + `zodOutputFormat` + Zod v4

- `@anthropic-ai/sdk@0.105.0` declares zod as `"^3.25.0 || ^4.0.0"` (optional peer dep). **Zod v4 is officially supported.**
- Import path `@anthropic-ai/sdk/helpers/zod` is correct and unchanged.
- Parameter name is `output_config` (not the deprecated `output_format`). The existing code uses `output_config: { format: zodOutputFormat(LebenslaufSchema) }` — correct.
- `response.parsed_output` returns the typed, Zod-validated object or `null` on failure.
- `response.stop_reason === 'refusal'` check is the correct guard.

### `messages.stream` + adaptive thinking

- `thinking: { type: 'adaptive' }` is the correct syntax for `claude-opus-4-8`. Using `budget_tokens` causes a 400 error on this model — correctly omitted.
- The `for await (const event of stream)` async iterator pattern is the correct way to consume the stream in a route handler.
- Filter: `event.type === 'content_block_delta' && event.delta.type === 'text_delta'` correctly selects only text content. Thinking blocks emit `thinking_delta` type — these are correctly excluded by the existing filter, so they never appear in the streamed response to the client.
- The `.on('text', cb)` shorthand is also valid but harder to pipe into a `ReadableStream` controller. The iterator approach is the right choice for this pattern.

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| @anthropic-ai/sdk | 0.105.0 | zod ^3.25 \|\| ^4.x | Zod 4 officially supported as optional peer dep |
| next | 16.2.9 | Node >=20.9.0 | Node 18 not supported; local env must be upgraded |
| posthog-js | ^1.391.0 | Next.js 16, React 19 | instrumentation-client.ts pattern; Suspense wrapper required for pageview tracker |
| unpdf | ^1.6.2 | All JS runtimes | Dynamic import to avoid blocking initial load |
| zod | 4.4.3 | @anthropic-ai/sdk 0.105 | Standard schema primitives only; avoid .min/.max on numbers |

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

## Installation Commands (Remaining Work)

# Upgrade Node first (required for Next.js 16)

# nvm use 20 OR nvm install 20 OR brew install node@20

# Install current dependencies (after Node upgrade)

# Add analytics

# Add PDF support (Phase 1, not now)

# npm install unpdf@^1.6.2

## Sources

- Next.js 16.2.9 official streaming guide (`nextjs.org/docs/app/guides/streaming`, last updated 2026-05-13) — confirmed ReadableStream route handler pattern and client-side reader loop — MEDIUM confidence
- Vercel Functions Limits (`vercel.com/docs/functions/limitations`, last updated 2026-06-02) — confirmed 300s hobby max duration with Fluid Compute — MEDIUM confidence
- Vercel Node.js versions (`vercel.com/docs/functions/runtimes/node-js/node-js-versions`) — confirmed Node 24.x default, 20/22/24 available — MEDIUM confidence
- `@anthropic-ai/sdk` GitHub `package.json` (`github.com/anthropics/anthropic-sdk-typescript/blob/main/package.json`) — confirmed Zod peer dep range `^3.25.0 || ^4.0.0` — MEDIUM confidence
- Anthropic structured outputs docs (`platform.claude.com/docs/en/build-with-claude/structured-outputs`) — confirmed `output_config.format` parameter shape and `parsed_output` field — MEDIUM confidence
- PostHog Next.js docs (`posthog.com/docs/libraries/next-js`) + DEV Community article on Suspense gotcha — confirmed instrumentation-client.ts pattern and Suspense/useSearchParams requirement — MEDIUM confidence (cross-checked two sources)
- `unpdf` GitHub (`github.com/unjs/unpdf`) — confirmed v1.6.2, browser support, API — MEDIUM confidence
- Web search: `posthog-js` latest version 1.391.2, npm 2026-06-20 — LOW confidence (websearch, not verified against npm registry directly)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
