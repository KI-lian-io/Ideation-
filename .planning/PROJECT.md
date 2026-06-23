# ScanReady (working name)

## What This Is

ScanReady is a free, stateless web tool that helps internationals job-hunting in Germany turn their foreign résumé into a norm-correct German **Lebenslauf** and generate an authentic-voice German **Anschreiben** (cover letter), grounded strictly in their real CV facts and their own answers. It's a tight-scope learning side project, dogfooded on the owner's own live applications.

## Core Value

The German output is native-quality and trustworthy — norm-correct and never fabricated — so a German recruiter takes the applicant seriously in the 8-second scan. If everything else fails, the quality and grounding of the German documents must hold.

## Business Context

- **Customer**: Internationals applying for jobs in Germany — anyone who didn't grow up writing German applications. Primary *addressable* market is the full international inflow (non-EU skilled migrants on the Chancenkarte/Blue Card — India/Turkey/China-led — plus international grads of German universities and US/UK expats). **Launch go-to-market motion** stays on the *reachable* cohort: US/UK expats (founder dogfoods; his story is the build-in-public content) + intl uni grads. Landing copy is nationality-neutral so the larger inflow converts via SEO. Later B2B: university career services, relocation firms. *(Re-opened 2026-06-23 — Phase 4 discussion + research; was "US/UK English-speaking expats".)*
- **Revenue model**: Free MVP now; later a finish-line one-shot paywall (€19–29/application, €39–49 bundle) once output quality + demand are proven; B2B channel later.
- **Success metric**: Do strangers complete the flow and want the output (start → copy/download rate)? Revenue is a later test, not the v1 metric.
- **Strategy notes**: `BUILD_PLAN.md`, `cv-germany-expat-concept.md`, `necessity-tools-strategy.md`, `low-barrier-tools-strategy.md`.

## Requirements

### Validated

<!-- "Validated" here = implemented in the existing scanready/ backend and typechecks. NOT yet validated with real users — dogfooding in Phase 0 is what confirms value. -->

- ✓ CV → structured German Lebenslauf via grounded structured output — existing (`scanready/src/app/api/parse`)
- ✓ Streamed authentic-voice Anschreiben grounded in CV facts + the applicant's answers — existing (`scanready/src/app/api/cover-letter`)
- ✓ Anti-fabrication enforced in both the system prompts and the Zod schema (unknown → null) — existing (`scanready/src/lib/{prompts,schema}.ts`)
- ✓ Stateless / zero-retention backend — no DB, nothing persisted server-side — existing

### Active

<!-- Current scope. Hypotheses until shipped + dogfood-confirmed. -->

- [ ] Front-end UI for the full flow: paste/upload CV → Lebenslauf + norm-gap notes → paste job posting + answer 3–5 questions → streamed Anschreiben → copy/download
- [ ] **Bilingual output** — German documents PLUS an English explanation of every change/choice, so the expat trusts and learns from the result
- [ ] Design pass — conversion-oriented landing + tool UI (trust-forward, zero-retention stated loudly, German-market-credible, not generic AI-purple) via claude.ai/design
- [ ] PostHog analytics events (start, parse_done, letter_done, copy/download)
- [ ] Deploy to Vercel
- [ ] Performance-marketing / distribution operationalization — founder-led build-in-public content, SEO keyword list + cadence ahead of the Sept–Oct application peak, paid as a LAST conversion test
- [ ] PDF upload (v1 is text-paste only)
- [ ] Input-length guard on both API routes (cost + trust boundary)
- [ ] Verify Anthropic SDK call shapes (`messages.parse` + `output_config`, `messages.stream`) against installed `@anthropic-ai/sdk@0.105` before building UI on top

### Out of Scope

- **AI-detection "humanizer" / detection-evasion** — our "authentic voice" is personalization from the user's own answers, never detection evasion. Ethical + product line.
- **Earnings / income claims** — FTC/ASA-clean; sell the capability, never income.
- **Fabricating any CV fact** (employers, titles, dates, skills) — fraud + liability.
- **User accounts / data persistence in v1** — zero-retention is a feature, not a gap.
- **Paid acquisition as a growth channel (v1)** — paid is a LAST conversion *test*, not a channel.
- **Parallel B2B pilot now** — deferred to protect focus; B2C-first. Revisit post-validation.
- **Mandating a photo** — optional under the AGG; provide nuanced guidance only, user's choice.

## Context

- Concept validated through prior research (`cv-germany-expat-concept.md`): norm-gap value prop, 2024–26 immigration tailwinds (Opportunity Card wedge), expat-EN long-tail + emerging German "KI" search terms, competitive whitespace, localization moat.
- App scaffolded: **Next.js 16** (App Router, TS) + Tailwind + `@anthropic-ai/sdk` + Zod v4. Backend routes built and typecheck; `src/app/page.tsx` is still create-next-app boilerplate.
- Owner is applying for jobs in Germany **now** → dogfood, and the application story *is* the build-in-public content.
- **Build snags (found this session):** local Node is v18.14.0 but Next 16 needs **Node ≥ 20.9** — must bump before `npm install`/`dev`. `.env.example` is referenced in docs but not tracked — create `scanready/.env.local` with `ANTHROPIC_API_KEY`.
- `scanready/AGENTS.md` warns this Next.js (v16) has breaking changes vs. training data — read `node_modules/next/dist/docs/` before writing app code.

## Constraints

- **Tech stack**: Next.js 16 + TS + Tailwind + Claude API + Zod v4 — already scaffolded; don't re-litigate.
- **Runtime**: Node ≥ 20.9 required (Next 16) — local env currently 18.14.0.
- **Models**: `GENERATION_MODEL = claude-opus-4-8` (cover letter — quality is the moat); `PARSE_MODEL = claude-opus-4-8` (cost lever: switch to `claude-sonnet-4-6` once parse quality confirmed).
- **Legal / ethics**: grounded-only generation; GDPR zero-retention; native-quality German + a "have a native speaker review" nudge; nuanced photo guidance; no income claims; no detection-evasion.
- **Scope**: tight learning side project — keep scope minimal; do not re-open strategy exploration.
- **Budget**: free MVP; paid only as a later conversion test.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build the CV-for-Germany "relief" tool over the "dream-engine" ideas | High intent, low legal risk, real localization moat + B2B channel | — Pending |
| Bilingual output (German docs + English explanation of changes) | Expat trusts/learns from output; differentiation | — Pending |
| B2C-first beachhead (Chancenkarte / expat communities, founder-led) | Fastest feedback, no gatekeepers; B2B deferred to protect focus | — Pending |
| Re-open customer → "internationals applying for jobs in Germany" (neutral copy); broaden *messaging*, keep *launch* motion on reachable cohort (US/UK + uni grads) | US/UK are a minority of the actual inflow; the norm-gap + authenticity pain is non-native-universal; broadening is messaging-only (zero backend change) — but a solo founder can't build-in-public into India/Turkey communities, so don't pivot the GTM there | — Pending (Phase 4) |
| Dual-angle positioning under the "8-second scan" frame: authentic/grounded voice + norm-correct localization | Sells the whole product, not half; authentic angle ships as quality/voice, never detection-evasion; no outcome/income claims | — Pending (Phase 4) |
| Keep "ScanReady" as placeholder name | Don't let naming block the build; revisit pre-launch | — Pending |
| Distribution: founder-led/build-in-public → SEO → paid LAST (as a test) | Zero budget; €50–100 paid is a conversion test, not a channel | — Pending |
| Grounding via prompt + Zod schema, not a flag | Fabrication = fraud/liability; enforce structurally | ✓ Good |
| Stateless / zero-retention (no DB in v1) | GDPR posture as a feature; trust | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state

---
*Last updated: 2026-06-23 — Phase 4 discussion re-opened the target customer (broadened to "internationals applying for jobs in Germany", nationality-neutral messaging) + locked dual-angle positioning. Messaging-only; no backend change.*
