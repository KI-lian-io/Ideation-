# CLAUDE.md — Session Handoff & Where to Continue

> Read this first. It's the map for picking up this project in a new session.
> Owner: Kilian Hartmann. Branch: `claude/ecom-low-barrier-tools-zpyb10`. Open draft PR: **#1** (`KI-lian-io/scanready`).

---

## TL;DR — what this repo is

An **ideation → execution** repo. We explored "low-barrier tools to build a business online," narrowed through research, and **converged on one thing to build**: an AI tool that helps **expats apply for jobs in Germany** — converts a US/UK CV into a proper German **Lebenslauf** and writes an authentic-voice **Anschreiben** (cover letter). The MVP backend is **scaffolded and working**; the **UI is the next task**.

Working product name: **ScanReady** (placeholder — "win the 8-second German recruiter scan"). Rename freely.

---

## How we got here (decision trail)

1. Explored the **"dream engine"** — aspirational get-rich tools (ssemble.com pattern). → `low-barrier-tools-strategy.md`.
2. Pivoted to the **"relief engine"** — necessity/chore tools (PDF/transcript/citation utilities) used under deadline pressure. → `necessity-tools-strategy.md`.
3. Kilian proposed a sharp niche: **CV/cover-letter tailoring for expats in Germany**, with an authentic-voice "humanizer" (the *personalization* kind, NOT AI-detection evasion). Research validated it. → `cv-germany-expat-concept.md`.
4. Decided to **build it as a free side-project MVP**, dogfooded on Kilian's own live job applications. Execution plan → `BUILD_PLAN.md`. Code scaffolded → `/scanready`.

**This is a side project for learning/experimenting.** Keep scope tight. Don't re-open the strategy exploration unless asked.

---

## Repo map

| Path | What |
|---|---|
| `low-barrier-tools-strategy.md` | Strategy: aspirational "dream" tools (psychology, FTC line, ideas). Context, not active work. |
| `necessity-tools-strategy.md` | Strategy: "relief"/chore tools (SEO-as-moat, ethics). Context. |
| `cv-germany-expat-concept.md` | **The validated concept** (norm gap, market, competitors, search volumes, monetization). |
| `BUILD_PLAN.md` | **The execution plan** (scope, stack, phased roadmap, distribution, guardrails). |
| `scanready/` | **The app** — Next.js (App Router, TS, Tailwind) + Claude API. |

---

## Current build state (`/scanready`)

**✅ Done (typechecks, pushed):**
- `create-next-app` scaffold (TS, Tailwind, App Router, `src/`).
- `src/lib/anthropic.ts` — Anthropic client + model config. `GENERATION_MODEL` & `PARSE_MODEL` = `claude-opus-4-8`. Cost lever: switch `PARSE_MODEL` to `claude-sonnet-4-6` once parse quality is confirmed.
- `src/lib/schema.ts` — Zod `LebenslaufSchema` (incl. `normGapNotes`, `photoAdvice`).
- `src/lib/prompts.ts` — grounded system/user prompt builders + the 5 personalization questions.
- `src/app/api/parse/route.ts` — CV → Lebenslauf via **structured output** (`messages.parse()` + `zodOutputFormat`).
- `src/app/api/cover-letter/route.ts` — **streamed** Anschreiben (`messages.stream`, adaptive thinking).
- `.env.example` (needs `ANTHROPIC_API_KEY`).

**⏳ NOT done (next tasks, in priority order):**
1. **Front-end UI** — the single-page flow: paste/upload CV → show Lebenslauf + norm-gap notes → paste job posting + answer 3–5 questions → stream the Anschreiben → copy/download. `src/app/page.tsx` is still create-next-app boilerplate.
2. **Design pass** — landing + tool UI via the `artifact-design` skill (trust-forward, zero-retention stated, not generic AI-purple). See BUILD_PLAN §6.
3. **PDF upload** (v1 is text-paste only) + **PostHog** analytics events.
4. **Deploy to Vercel.**
5. Later: finish-line paywall (€19–29) + Stripe; B2B; sister tools.

---

## Decisions still OPEN for Kilian (ask before building UI)

1. **Output language:** German-only, or **bilingual** (German docs + an English explanation of each change so the expat trusts it)? *Recommended: bilingual.*
2. **Beachhead:** B2C (Chancenkarte / expat communities) first, or a B2B university/relocation pilot in parallel? *Recommended: B2C first.*
3. **Working name:** keep *ScanReady* or rename?

Distribution sequence already agreed: **(A) Reddit/build-in-public first** (Kilian is applying now → his story is the content), SEO second, **(C) €50–100 paid LAST as a conversion test, not a channel.**

---

## Non-negotiable guardrails

- **Sell the capability, never income.** No earnings claims (FTC/ASA-clean).
- **Grounded-only generation.** Never fabricate employers/titles/dates/skills — fabrication = fraud + liability. Enforced in `prompts.ts` + the Zod schema; keep it that way.
- **Native-quality German** + keep the "have a native speaker review" nudge in the cover letter.
- **Photo guidance is nuanced** — optional by AGG, expected in practice, user's choice. Never mandate.
- **Zero-retention / GDPR as a feature** — no DB, nothing persisted, no training on user data.
- **NOT an AI-detection "humanizer."** Our "authentic voice" = personalization from the user's own answers. Never build detection-evasion.

---

## Run it

```bash
cd scanready
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000  (API routes work; UI is boilerplate)
npx tsc --noEmit             # typecheck
```

## Claude API notes (for whoever continues)
- Default model `claude-opus-4-8`. Adaptive thinking: `thinking: {type:"adaptive"}` (no `budget_tokens` — it 400s on 4.8).
- Structured output: `messages.parse()` + `zodOutputFormat(schema)` from `@anthropic-ai/sdk/helpers/zod`. **Requires Zod v4** (installed).
- Streaming: `messages.stream()`, read `content_block_delta` / `text_delta`.
- When doing more Claude work, invoke the **`claude-api`** skill for current patterns.

## Git / PR
- Develop on **`claude/ecom-low-barrier-tools-zpyb10`**. PR **#1** is open as draft and auto-updates on push.
- Commit trailers used in this project:
  - `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  - `Claude-Session: https://claude.ai/code/session_01AUduhRehdKK8N4cnvbUoH7`

---

## Suggested first message for the new session
> "Continue ScanReady. I want **[German-only | bilingual]** output. Build the front-end UI for the full flow (paste CV → Lebenslauf + norm-gap notes → job posting + 3–5 questions → streamed Anschreiben → copy/download), then do a design pass with artifact-design."
