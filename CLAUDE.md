# CLAUDE.md — Session Handoff & Where to Continue

> Read this first. It's the map for picking up this project in a new session.
> Owner: Kilian Hartmann. Branch: `claude/ecom-low-barrier-tools-zpyb10`. Open draft PR: **#1** (`KI-lian-io/scanready`).

---

## TL;DR — what this repo is

An **ideation → execution** repo. We explored "low-barrier tools to build a business online," narrowed through research, and **converged on one thing to build**: an AI tool that helps **expats apply for jobs in Germany** — converts a foreign CV into a proper German **Lebenslauf** and writes an authentic-voice **Anschreiben** (cover letter). The **full product is built, shipped, and live on Vercel** — the four-step flow works end-to-end, security guards are in, the design pass is done, and the distribution artifacts are written. The only roadmap item left is the **optional Phase 6 analytics funnel** (PostHog).

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
| `scanready/` | **The app** — Next.js (App Router, TS, Tailwind) + Claude API. Marketing landing at `/`, tool at `/app`. |
| `.planning/` | **Source of truth for project status** — `ROADMAP.md`, `STATE.md`, `PROJECT.md`, phase plans. Phases 1–5 done (83%). |
| `distribution/` | Phase-5 GTM artifacts — `community-plan.md`, `seo-keyword-plan.md`, `paid-test-spec.md`. |

---

## Current build state (`/scanready`)

**✅ Done — phases 1–5 complete (`.planning/ROADMAP.md` + `STATE.md`: 83%, 14/14 plans):**
- **Full four-step UI** — paste CV → Lebenslauf + bilingual norm-gap notes (inline WYSIWYG editor, skill chips, language dropdown, optional-photo callout) → paste job posting + answer 3–5 questions → **streamed** Anschreiben → copy/download. Route split: marketing landing at `/`, tool at `/app`. (Phases 1–2)
- **Backend** — `src/lib/{anthropic,schema,prompts}.ts`; `src/app/api/parse/route.ts` (structured output, `messages.parse()` + `zodOutputFormat`) and `src/app/api/cover-letter/route.ts` (streamed, adaptive thinking). `GENERATION_MODEL` & `PARSE_MODEL` = `claude-opus-4-8` (cost lever: switch `PARSE_MODEL` to `claude-sonnet-4-6` once parse quality is confirmed).
- **Security guards** — per-field input-length limits (400 + German message) on both API routes, client-side char counters + disabled submit, no rejected-content logging, still stateless. (Phase 3)
- **Design pass + deploy** — trust-forward, German-market-credible landing + tool UI, WCAG-AA; **live on Vercel** with `vercel.json` `maxDuration` and Node pinned. (Phase 4)
- **Distribution artifacts** under `distribution/` — `community-plan.md` (Reddit-led build-in-public), `seo-keyword-plan.md` (EN + DE clusters, 6-month cadence), `paid-test-spec.md` (one keyword, cost-per-completed-flow, €100 cap, organic-proof gate). (Phase 5)

**⏳ NOT done (all that's left):**
1. **Phase 6 — Analytics (optional, low-priority, plans TBD).** PostHog funnel (`start`, `parse_done`, `letter_done`, `copy`, `download`), cookieless / zero-PII / EU Cloud, production-only, fails silent. Flagged a post-launch follow-up — the tool can ship without it.
2. **GTM-03 paid conversion test — BLOCKED on Phase 6** (needs the funnel to measure cost-per-completed-flow) and gated behind organic validation (N≈50).
3. Deferred to v2 (`.planning/STATE.md`): PDF upload/download + .docx, finish-line paywall (€19–29) + Stripe, B2B channel, LinkedIn import, ATS scoring.

---

## Decisions (resolved — recorded in `.planning/PROJECT.md`)

1. **Output language:** ✅ **Bilingual** — German documents plus an English explanation of each change/choice, so the applicant trusts and learns from the result. (A German-*or*-English content mode is logged as an optional near-term item, not the USP.)
2. **Beachhead:** ✅ **B2C-first**, founder-led; parallel B2B pilot deferred. Customer was also broadened (2026-06-23) to **"internationals applying for jobs in Germany"** with nationality-neutral landing copy; launch motion stays on the reachable cohort (US/UK expats + intl uni grads).
3. **Working name:** ✅ **Keep *ScanReady* as a placeholder; revisit pre-launch.** Not a blocker.

Distribution sequence (agreed, now operationalized in `distribution/`): **(A) Reddit/build-in-public first** (Kilian is applying now → his story is the content), **SEO second**, **(C) €50–100 paid LAST as a conversion test, not a channel.**

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
npm run dev                  # http://localhost:3000  (full UI: landing at /, tool at /app)
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

## Design system — "Warm Editorial Broadsheet" (current, settled)

A full design pass landed after phases 1–5. Don't re-open the exploration; build new UI against the spec.

- **Canonical spec:** [`scanready/DESIGN.md`](scanready/DESIGN.md) — YAML-frontmatter in the claude.ai/design (`DesignSync`) schema. Provenance table records every source-conflict resolution.
- **Identity:** WIRED editorial authority × Starbucks warmth × ScanReady navy/serif. Deep-green accent `#0a7d63` (4 tiers, the only accent), navy ink `#1b2430`, warm paper `#f0eee9`, **6px editorial buttons (not pills)**, 12px cards, navy color-block band. Four type voices: Iowan display serif · **Source Serif 4 reading serif for the generated Lebenslauf/Anschreiben (they render like print)** · Inter UI · Geist Mono taupe labels.
- **Where it lives:** primitives in [`scanready/src/components/ui.tsx`](scanready/src/components/ui.tsx) (`btnClass`/`Btn`, `CARD`, `EYEBROW`); tokens in [`scanready/src/app/globals.css`](scanready/src/app/globals.css) Tailwind v4 `@theme`; fonts wired in `layout.tsx` (Inter + Geist Mono + Source Serif 4 via `next/font`).
- **How we got here:** AreaButler → AreaButler×Mintlify blend → this (a getdesign.md agent survey of ~14 brands picked WIRED as anchor, Starbucks for warmth).
- **design-sync follow-up:** sync-ready preview library at [`scanready/design-system/`](scanready/design-system/) (`overview.html` + README, `@dsCard` markers). Pushing to claude.ai/design is **blocked in web Claude Code** (needs interactive `/design-login`); run from a real terminal or use Claude Design's "Send to Claude Code Web". Then expand the overview card into per-component cards.

## Git / deploy gotchas
- **Push needs the repo-owner account:** `gh auth switch --hostname github.com --user KI-lian-io` first — the default `LiloAdmin` gets 403.
- Shell cwd drifts between Bash calls — use absolute paths.

## Suggested first message for the new session
> "Continue ScanReady. Product built + deployed (phases 1–5); the **Warm Editorial Broadsheet** design system is implemented and committed (see `scanready/DESIGN.md`). Options: (a) push the design system to claude.ai/design from an interactive terminal via `/design-login` + `scanready/design-system/`; (b) build the **optional Phase 6 analytics funnel** (PostHog, unblocks GTM-03); or (c) start distribution from `distribution/`. Either way, clear the native-speaker German quality gate before going public, and `gh auth switch --user KI-lian-io` before pushing."
