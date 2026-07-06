# CLAUDE.md — Session Handoff & Where to Continue

> Read this first. It's the map for picking up this project in a new session.
> Owner: Kilian Hartmann. Branch: `claude/ecom-low-barrier-tools-zpyb10`. Open draft PR: **#1** (`KI-lian-io/scanready`).

---

## TL;DR — what this repo is

An **ideation → execution** repo. We explored "low-barrier tools to build a business online," narrowed through research, and **converged on one thing to build**: an AI tool that helps **expats apply for jobs in Germany** — converts a foreign CV into a proper German **Lebenslauf** and writes an authentic-voice **Anschreiben** (cover letter). The **full product is built, shipped, and live on Vercel** — the four-step flow works end-to-end (now incl. **PDF/txt CV upload, client-side extraction**), abuse protection is in (rate limiting, origin check, injection hardening), and **monetization Stage 1 ("Humanizer+" €2.99 one-shot refinement via Stripe) is code-complete on the branch** — gated for go-live only by founder actions (`scanready/docs/humanizer-golive.md`). Analytics (PostHog funnel) remains backlogged.

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

**✅ Done — post-v1.0 session (2026-07, commits `6e33efb`..`f520e1d`, all reviewed + pushed):**
- **Monetization Stage 1 — "Humanizer+"** (spec: `docs/superpowers/specs/2026-07-03-monetization-humanizer-design.md`, plan: `docs/superpowers/plans/2026-07-03-humanizer-stage1.md`, tracking: issue #2): €2.99 one-shot refinement of the finished Anschreiben (3 directions: Formeller/Moderner/Prägnanter), Stripe Payment Element in a modal, **stateless Stripe-as-token** fulfillment (`/api/humanizer/intent` + `/api/humanize`; PI marked consumed only after full delivery; disconnect-safe; paid attempt persisted in sessionStorage → no duplicate charge). Legal pages (`/impressum`, `/datenschutz`, `/agb`, §356(5) Widerruf checkbox) + Gehaltsvorstellung/Eintrittstermin conditional questions shipped alongside.
- **Abuse protection** — per-IP rate limiting (`src/lib/abuse-guards.ts`, Upstash sliding window, hashed IPs, **fail-open when env unset**), same-origin check on all POST routes, prompt-injection hardening with `UNGÜLTIGE EINGABE` sentinel + early stream abort (client shows German error; refusal biased "when in doubt, do the task" after a live false positive — see `src/lib/sentinel.ts`).
- **CV upload** — PDF (`unpdf`, dynamically imported) + .txt, **extraction fully client-side** (file never leaves the browser; zero-retention intact), drag-and-drop + button in InputView.
- Pricing/market decisions locked: free tier stays maximally generous (full letter, copy, .txt); paid = one-shot honest pricing (anti trial-trap positioning — competitors' $2-trial→$26/4wks pattern is the foil); print-PDF export will join a "Bewerbungspaket" bundle (~€4.99–7.99/application) when built; **accounts/subscription parked (Stage 3)** until Humanizer+ shows conversion.
- **Positioning research + messaging** (`positioning-fact-check-2026-07.md`): stay internationals-first (natives = adjacency later, via trust/anti-Abofalle door); **"8-second" claim retired everywhere** (US-lore; DACH evidence ~43s) → title/tagline is now "Win the German Recruiter's First Scan"; evidenced hooks in copy: 64% spelling-dealbreaker, 61% prefer two pages.
- **Bug hunt (28 confirmed findings, all fixed)** — highlights: critical index-key editor corruption fixed via `_uid` keys; malformed-JSON 500s → German 400s; parse-truncation 422; English UI chrome standardized (German = documents + legal only); 429/403 mapped to actionable messages; beforeunload guard; a11y pass (modal focus trap/Escape, aria-live, `lang="de"` on legal pages). Remaining same-class item: issue #10 (bullets/skill-chips index keys).
- **Honest-nudge conversion layer**: 3-step goal-gradient indicator, "N norm gaps fixed" quantified value, peak-end completion header, price anchor + risk-reversal at the pay moment, post-copy continuation path ("New Anschreiben, same Lebenslauf"), price disclosed before the letter step.
- **Design: "Typesetting Theater" (award push, Phase 1 live)** — spec: `scanready/docs/art-direction-typesetting-theater.md`. Hero typesetting loop (scan-sweep signature, date snap to `03/2024 – heute`, DIN annotation pins), broadsheet masthead, paper grain, print details; plus print-sheet document surfaces (`.doc-sheet`), staggered parse reveal, stream caret, phase motion — all reduced-motion-safe. Phase 2 shipped 2026-07-05 (see below); Phase 3 pending founder assets.
- **Humanizer picker de-paralyzed** (founder churn feedback): `recommendDirection()` heuristic recommends per-posting (badge + accent border, first position), German register samples on each card, restore-reassurance line.
- **Prompt grounding hardened after real-CV verification** (founder's actual CV, all 3 paths): DIN letterhead placeholders (model had invented a street address + date — now `[Straße Hausnummer]`, `[Ort], [Datum]`), no-markdown rule, German dates (`03/2024 – heute`), Abschlussnote retained, competency labels Germanized.

**✅ Done — cleanup session (2026-07-05, UAT'd via live parse):**
- **Complete EN/DE UI language toggle** (`src/lib/i18n.tsx`, ~160 keys, localStorage-persisted, top-bar toggle on `/app`): all tool chrome switches; documents/DIN section labels stay German; Widerruf checkbox stays German (legal text). Personalization questions refactored to `{id, en, de}` — answers keyed by id, wire contract to `/api/cover-letter` unchanged (English question text resolved at request boundary).
- **Bilingual generated notes**: `normGapNotes` and `photoAdvice` are now `{en, de}` objects (schema + PARSE_SYSTEM change) so DE mode shows native-German notes. Verified live: parse returns natural German.
- **Result-view layout**: norm-gap panel is a collapsed full-width strip ABOVE the document; two-column grid removed; tool card widened to `max-w-4xl`. Fixes the "narrow document" complaint.
- **Photo upload (display-only)**: dashed 3:4 frame top-right of Persönliche Daten, client-side object URL only (never uploaded, never serialized — zero-retention intact), 8 MB/type validation, removable.
- **Landing fixed for honesty**: founder story rewritten — Kilian is GERMAN, not an expat ("Built by a German, for everyone applying here"); proof section is now a "What actually changes" norm-transform grid + honestly-labeled illustrative example + explicit "no testimonials yet" line. Never fabricate testimonials.
- **Em-dash ban (site-wide convention going forward)**: all "—" removed from src/public (76 replaced; landing/layout separately); `TYPOGRAPHY_RULES` block added to all three system prompts so generated documents avoid them too. Only allowed occurrence: the prompt rule itself in `prompts.ts`.
- **Naming research done** → [`naming-shortlist.md`](naming-shortlist.md). Finalists (all .de+.com free at research time): Bewerbungsfertig, CV Broadsheet, German CV Co. "Scan-" naming should be dropped (Jobscan owns the pattern). Founder decision pending; DPMA/EUIPO check before committing.

**✅ Done — build-options session (2026-07-05 evening, 62→74 tests, tsc + next build green):**
- **Issue #10 closed**: bullets + skills/skill-categories now carry stable `_uid` keys (same class as the fixed `acda8b5` editor bug); pure wrap/strip helpers live in `lebenslauf-utils.ts`; `stripUids()` is the single serialization boundary (uid can never reach API/copy output, asserted in `lebenslauf-uid-boundary.test.ts`, 11 tests).
- **Typesetting Theater Phase 2 shipped** (landing + tool): folio section numbers, founder-note drop cap, DACH-stat pull quote (hanging punctuation + @supports guard), proof section upgraded to hero fidelity (doc-sheet + static DIN pins), looping scan-sweep over the parse LoadingView skeleton. Phase 3 still needs founder assets (wordmark, OG image, 404 misprint).
- **Analytics code-complete (cookieless PostHog)**: `src/instrumentation-client.ts` + typed `src/lib/analytics.ts`; EU cloud, `persistence:'memory'` (keine-Cookies claim stays literally true), autocapture/recording off, anonymous-only, env-gated fail-open (OFF until `NEXT_PUBLIC_POSTHOG_KEY` is set in Vercel). 7 events; conversion = `humanizer_paid` / `letter_done`. Datenschutz has an honest Reichweitenmessung section; setup steps in `docs/humanizer-golive.md`.
- **Distribution refresh for honesty**: all three `distribution/` docs de-em-dashed and re-grounded per `positioning-fact-check-2026-07.md` — "8-second" retired everywhere (Post 1 is now the ~43s myth-busting explainer), Post 2 corrected (Anschreiben "where asked for", two-page norm, 64% spelling hook), Post 3 no longer fabricates an expat identity (German founder dogfooding his own live applications).

**✅ Done — Stage 3 build session (2026-07-06, goal-directed; 74→114 tests, tsc + build green, everything env-gated OFF until founder provisions keys):**
- **Print-PDF export shipped**: DIN 5008 A4 print views for Lebenslauf (+ Ort/Datum/Unterschrift closing block, client-side editable string, schema untouched) and Anschreiben via `#print-root` + `@media print` + `window.print()` — no PDF lib, no server round-trip, photo prints from its local object URL. `PrintSheet.tsx`, print CSS in `globals.css`.
- **Bewerbungspaket live (4,99 € one-shot pro Bewerbung)**: second SKU on the stateless Stripe-as-token rails (`feature:'paket'`); gates the PDF export buttons (copy + .txt stay free) and includes one Humanizer+ refinement (`/api/humanize` accepts both PI kinds via `checkHumanizerEntitlement`; paket PIs spend `humanizer_used`, never the PDF unlock). `PaketModal` mirrors the Humanizer payment UX incl. Widerruf checkbox; unlock persists in sessionStorage, server-re-verified via `/api/paket/verify`, cleared on full reset only.
- **Stage 3 accounts, full stack, opt-in retention**: Supabase EU foundation (`src/lib/supabase/*`, migration `supabase/migrations/0001_stage3_accounts.sql` with owner-only RLS, free=1-package BEFORE-INSERT guard incl. per-user advisory lock, read-only downgrade helpers, `delete_own_account()` RPC), Google OAuth via `/auth/callback`, `AccountProvider` (no-op stubs when env unset). UI: `AccountMenu` in the tool bar, explicit save-application buttons (never auto-save), saved-packages loader in InputView (`LOAD_PACKAGE`), `/konto` dashboard (packages, subscription, GDPR deletion).
- **Subscription billing rails**: `/api/subscription/checkout` (Stripe Checkout), signature-authenticated idempotent webhook (`/api/stripe/webhook`, handles pre/post-Basil period-end shapes, syncs read-only state), `/api/subscription/cancel`, and the §312k **`/kuendigen`** page (statutory wording, linked from every footer, on-screen receipt confirmation) — flagged for founder legal review.
- **Legal texts are env-aware**: Datenschutz §7 (Konto/opt-in storage/auth cookies) and the AGB subscription section render ONLY while `accountsEnabled()`, so live legal text always matches deployed config. EN landing trust band re-scoped to "No account needed…" (DE was already scoped).
- **Stage 3+ German presence**: `/de` landing (native German, "Bestehen Sie den ersten Blick.", ~43s pull quote, hreflang alternates) and `/preise` (anti-Abofalle manifesto, free/2,99/4,99 cards, subscription teased "geplant").

**⏳ NOT done (founder gates — all steps in `scanready/docs/humanizer-golive.md` + `scanready/docs/stage3-accounts.md`):**
1. **Humanizer+/Bewerbungspaket go-live**: real data in `src/lib/legal-data.ts` (FOUNDER_TODO), VAT decision, Stripe keys + purchase/refund drill + paket E2E + print QA, native-speaker review (now incl. PaketModal//preise//kuendigen/Datenschutz§7/AGB), Anthropic spend cap, Upstash env vars.
2. **Analytics gate**: PostHog EU project + `NEXT_PUBLIC_POSTHOG_KEY` in Vercel. GTM-03 blocked until events flow.
3. **Stage 3 activation — PARTIALLY DONE (2026-07-06, live founder session)**: ✅ Supabase EU project created (Frankfurt, ref `thgmhbzimnjcaoqyyiyp`), ✅ migration applied + security-advisor-verified (function-grant hardening applied live AND in the repo migration after the advisor caught a cross-user RPC vector), ✅ Google OAuth configured and tested (sign-in works, `handle_new_user` trigger verified: profiles row created), ✅ local `scanready/.env.local` has URL + publishable key (NOTE: value goes under our var name `NEXT_PUBLIC_SUPABASE_ANON_KEY`; new-style `sb_publishable_...` keys are drop-in). ⏳ Remaining: accounts E2E (save → limit → load), Vercel env vars (Preview first, Production last), Stripe subscription Price (3,99–5,99 € decision) + `STRIPE_WEBHOOK_SECRET` + `SUPABASE_SERVICE_ROLE_KEY`, §312k/AGB/Datenschutz legal review on a preview deploy.
4. Deferred: .docx, LinkedIn import, ATS scoring, `lang="en"`→`de` follow-up, TT Phase 3 (founder assets).

---

## Decisions (resolved — recorded in `.planning/PROJECT.md`)

1. **Output language:** ✅ **Bilingual** — German documents plus an English explanation of each change/choice, so the applicant trusts and learns from the result. (A German-*or*-English content mode is logged as an optional near-term item, not the USP.)
2. **Beachhead:** ✅ **B2C-first**, founder-led; parallel B2B pilot deferred. Customer was also broadened (2026-06-23) to **"internationals applying for jobs in Germany"** with nationality-neutral landing copy; launch motion stays on the reachable cohort (US/UK expats + intl uni grads).
3. **Working name:** ✅ **Keep *ScanReady* as a placeholder; revisit pre-launch.** Naming research is now done (`naming-shortlist.md`, 2026-07-05); founder pick + DPMA check pending.

Distribution sequence (agreed, now operationalized in `distribution/`): **(A) Reddit/build-in-public first** (Kilian is applying now → his story is the content), **SEO second**, **(C) €50–100 paid LAST as a conversion test, not a channel.**

---

## Non-negotiable guardrails

- **Sell the capability, never income.** No earnings claims (FTC/ASA-clean).
- **Grounded-only generation.** Never fabricate employers/titles/dates/skills — fabrication = fraud + liability. Enforced in `prompts.ts` + the Zod schema; keep it that way.
- **Native-quality German** + keep the "have a native speaker review" nudge in the cover letter.
- **Photo guidance is nuanced** — optional by AGG, expected in practice, user's choice. Never mandate.
- **Zero-retention / GDPR as a feature** — no DB, nothing persisted, no training on user data. (Still true for everything shipped. Decision 2026-07: IF Stage-3 accounts ever get built, retention becomes an explicit **opt-in for account holders only**; the anonymous flow stays stateless.)
- **NOT an AI-detection "humanizer."** Our "authentic voice" = personalization from the user's own answers. Never build detection-evasion. (The shipped **Humanizer+** honors this: it's a grounded tone/register refinement with a direction picker — additive tailoring, never AI-signature stripping; guardrails asserted in tests.)

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
- **design-sync follow-up:** ✅ done — the full DesignSync export lives at [`scanready/ScanReady Design System/`](scanready/ScanReady%20Design%20System/) (`tokens/`, `components/`, `templates/`, `guidelines/`, `SKILL.md`; now committed) and has been reconciled into the live app. The in-app preview library at [`scanready/design-system/`](scanready/design-system/) remains a reference, not a to-do.
- **Award push layer:** "Typesetting Theater" extends (never replaces) this system — spec + phase plan in [`scanready/docs/art-direction-typesetting-theater.md`](scanready/docs/art-direction-typesetting-theater.md).

## Git / deploy gotchas
- **Push needs the repo-owner account:** `gh auth switch --hostname github.com --user KI-lian-io` first — the default `LiloAdmin` gets 403.
- Shell cwd drifts between Bash calls — use absolute paths.
- **Vercel production is STALE (discovered 2026-07-06):** production (`scanready-alpha.vercel.app`) still serves the 2026-06-23 build; every push since only created Preview deployments (Vercel's production branch setting doesn't point at our branch). Fix in the Vercel dashboard: promote the latest deployment OR set Production Branch = `claude/ecom-low-barrier-tools-zpyb10`. Current prod predates even the legal pages — promote before anything else public happens.
- **Supabase MCP is wired** (`.mcp.json`, project-scoped to `thgmhbzimnjcaoqyyiyp`): interactive sessions can inspect tables, run SQL/migrations and the security advisors directly (`mcp__supabase__*`). Auth via OAuth on first interactive use; headless sessions may not have it.

## Suggested first message for the new session
> "Continue ScanReady. Everything on the branch is code-complete, reviewed, and pushed (114/114 tests): v1.0, Humanizer+ Stage 1, Bewerbungspaket (4,99 € one-shot: DIN print-PDF export + included refinement), full Stage 3 accounts/subscription stack (Supabase EU + Google OAuth + Stripe webhook + §312k /kuendigen, all env-gated OFF), /de landing + /preise anti-Abofalle page, cookieless PostHog analytics (env-gated), Typesetting Theater Phases 1+2. **Founder gates first** (all steps in `scanready/docs/humanizer-golive.md` + `scanready/docs/stage3-accounts.md`): (1) legal-data FOUNDER_TODOs (urgent, site is public), VAT decision; (2) Stripe TEST keys → E2E for Humanizer+ AND Bewerbungspaket incl. print QA; (3) PostHog EU key (GTM-03 blocked); (4) Stage 3 activation is PARTIALLY done (Supabase project live, migration applied + advisor-clean, Google OAuth tested locally — see the status line in 'NOT done' above): remaining are the accounts E2E, Vercel env vars, subscription Price decision (3,99–5,99 €) + webhook secret + service-role key, §312k/AGB legal review on a preview deploy; (5) **promote Vercel production** — it still serves the 2026-06-23 build, previews only since (see Git/deploy gotchas); (6) native-speaker review of all new German copy; (7) name pick from `naming-shortlist.md` + DPMA check. **Build options after that:** (a) Typesetting Theater Phase 3 (needs founder assets); (b) start distribution from `distribution/` — Post 1 (~43s myth-buster) is ready pending per-sub rule checks; (c) E2E/UAT follow-ups once keys exist. Gotchas: `gh auth switch --user KI-lian-io` before pushing; local node is v22 (works) despite older docs saying 18; Supabase MCP available via `.mcp.json`."
