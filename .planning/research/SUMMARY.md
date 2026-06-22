# Project Research Summary

**Project:** ScanReady
**Domain:** Stateless single-page AI document transformation tool — US/UK résumé → German Lebenslauf + Anschreiben
**Researched:** 2026-06-22
**Confidence:** HIGH (stack and architecture grounded in first-party source code; features and pitfalls corroborated across multiple independent sources)

---

## Executive Summary

ScanReady is a tight-scope, free, stateless web tool built on an already-working Next.js 16 + Claude API backend. The remaining work is entirely front-end: a four-step wizard UI, a design pass, PostHog analytics, and Vercel deployment. The backend routes (`/api/parse` and `/api/cover-letter`) are complete, typechecked, and architecturally sound — no API or schema changes are needed to ship bilingual output or the cover-letter flow. The recommended build sequence is: unblock Node 18→20.9 first (hard prerequisite for everything), then build the UI in two sub-phases (parse flow, then cover-letter flow), then wire analytics + security guards, then do the design pass and deploy, and finally operationalize distribution.

The product's primary differentiators — per-field English "why this changed" explanations, grounded-only generation, GDPR zero-retention, authentic-voice Anschreiben from 5 personalization questions, and no-account flow — are already structurally enforced in the backend. The front-end must make them *visible*, not implement them. The bilingual layer requires zero API changes: `normGapNotes` and `photoAdvice` are already English prose in the parse response. The state machine must retain `resumeText` across all steps because `/api/cover-letter` takes the original CV text, not the parsed Lebenslauf JSON. The stream is raw `text/plain` consumed via `response.body.getReader()`, not SSE.

The single highest-risk pre-launch failure mode is PostHog autocapture capturing CV content — this directly destroys the zero-retention claim and triggers GDPR exposure. It must be disabled (`autocapture: false`, `ip: false`) before any public traffic. The second highest-risk failure is the Node 18 local environment blocking all UI work. SEO is a 6-month horizon; community distribution (Reddit, LinkedIn, founder story) is the realistic first channel; paid is a conversion measurement test, not a growth channel.

---

## Key Findings

### Recommended Stack

The core stack is locked: Next.js 16.2.9, React 19, Tailwind 4, `@anthropic-ai/sdk@0.105`, Zod 4.4.3. No re-evaluation needed. The only remaining technology decisions are analytics (`posthog-js@^1.391.0` via `instrumentation-client.ts` — not `@posthog/next`, which is pre-release), client state (`useReducer` in a single top-level client component — not Zustand, not react-hook-form, not Vercel AI SDK), and PDF extraction (`unpdf` client-side when added in v1.x — not `pdf-parse` which is Node-only). The Vercel AI SDK must not be added — it has known Zod v4 incompatibilities with the Anthropic structured-output layer, distinct from the direct SDK which is confirmed compatible.

**Core technologies:**
- `next@16.2.9`: App Router — **requires Node ≥ 20.9.0**; local env is 18.14.0 and must be upgraded before `npm install` runs
- `@anthropic-ai/sdk@0.105`: `messages.parse()` + `zodOutputFormat` for structured output; `messages.stream()` + `thinking:{type:"adaptive"}` for cover letter — both verified correct
- `posthog-js@^1.391.0`: client-side funnel analytics via `instrumentation-client.ts`; `autocapture:false` and `ip:false` are mandatory
- `useReducer` (built-in React): atomic step transitions for the 4-step wizard; five+ interdependent fields make individual `useState` calls race-prone
- `unpdf@^1.6.2`: client-side PDF text extraction (v1.x addition, not v1); lazy-import to avoid blocking initial load

**Do NOT add:** Vercel AI SDK, Zustand, react-hook-form, `@posthog/next`, `pdf-parse`, react-query/SWR, next-auth.

### Expected Features

**Must have (table stakes for v1 launch):**
- Text-paste CV input — entry point; no upload required in v1
- Structured German Lebenslauf output with DIN 5008 date formatting (TT.MM.JJJJ), reverse-chronological order, personal data block, signature placeholder
- Bilingual display: German output alongside English "what changed and why" panel — `normGapNotes[]` + `photoAdvice` from the parse response, zero API changes needed
- Photo guidance text (nuanced: legally optional per AGG, practically expected by ~82% recruiters) — already in `photoAdvice` field
- 3–5 personalization questions UI — `PERSONALIZATION_QUESTIONS` is a client-importable constant from `@/lib/prompts`; no API call needed
- Streamed Anschreiben with visible live progress — advance step on first chunk so text appears immediately
- "Have a native speaker review" nudge at Anschreiben completion
- Copy to clipboard for both outputs
- Zero-retention privacy statement — prominent banner above CV textarea, not buried in footer
- PostHog funnel events: `start`, `parse_done`, `letter_done`, `copy`, `download`

**Should have (differentiators — ship with v1):**
- Per-field English "why this changed" explanations inline (the moat — no competitor does this)
- Grounded-only generation stated to the user ("we only use what you give us")
- No-account/no-signup framing stated explicitly in UX
- Chancenkarte / expat-specific copy on landing page

**Defer to v1.x:**
- PDF download, .docx download, PDF upload
- Input-length guard on API routes (add before meaningful public traffic)

**Defer to v2+:**
- Finish-line paywall (€19–29)
- LinkedIn import, ATS keyword scoring, B2B API

**Explicitly never build:**
- AI-detection humanizer / evasion, user accounts, template gallery, CV fabrication/"enhance my experience", photo upload/embedding, Europass output, multi-language Anschreiben, subscription pricing

### Architecture Approach

Single-page four-step state machine. `page.tsx` owns all state via `useReducer`; each step component is presentational. `/api/parse` returns JSON (awaited with standard `fetch`); `/api/cover-letter` returns raw `text/plain` (consumed via `response.body.getReader()` + `TextDecoder` — not `EventSource`, not Vercel AI SDK hooks). Both backend routes are unchanged. The bilingual layer is purely a UI rendering decision.

**Critical data flow constraint:** `resumeText` (the original CV paste) must be preserved in `PageState` through all steps. `/api/cover-letter` takes `cvText: state.resumeText` — the raw original text — not the parsed Lebenslauf JSON.

**Major components:**
1. `page.tsx` — step machine + all state + API call handlers (Client Component)
2. `CVInputStep` — textarea + "Parse CV" submit; disabled during loading
3. `LebenslaufStep` + `NormGapPanel` — renders parsed German sections + English explanations from `normGapNotes[]` and `photoAdvice`; receives `Lebenslauf` prop, makes no API calls
4. `PersonalizationStep` — job posting textarea + 5 Q&A inputs from `PERSONALIZATION_QUESTIONS` constant
5. `AnschreibenStep` + `CopyDownloadPanel` — streaming text view via ReadableStream reader; copy/download on stream close
6. `lib/posthog.ts` — typed event helpers; PostHog init with `autocapture:false`, `ip:false`, `person_profiles:'identified_only'`

### Critical Pitfalls

1. **Node 18 local environment blocks everything** — Next.js 16 requires Node ≥20.9.0. Fix first: `nvm use 20`, add `"engines":{"node":">=20.9.0"}` to `package.json`, create `.nvmrc`, pin Vercel project to Node 20.x. Hard prerequisite for all UI work.

2. **PostHog autocapture captures CV PII — launch blocker** — PostHog's default autocapture records DOM text from textareas, including CV content. Mandatory init: `autocapture: false`, `ip: false`, `person_profiles: 'identified_only'`. Audit event stream before going live.

3. **Passing Lebenslauf JSON (not resumeText) to /api/cover-letter** — retain `state.resumeText` through all steps and pass it as `cvText` to the cover-letter route.

4. **Using EventSource for the cover-letter stream** — backend returns raw `text/plain`, not `text/event-stream`. Use `response.body.getReader()`.

5. **Next.js 16 async request APIs** — `cookies()`, `headers()`, `params`, `searchParams` are all async (Promise-returning). Enforce `await` from day one.

6. **Vercel function timeout on cover-letter stream** — `maxDuration: 120` is silently capped at 60s on Hobby plan. Deploy on Pro; verify in staging.

7. **SEO timeline mismatch** — fewer than 6% of new pages reach Google top 10 within a year. Community distribution is the realistic first channel. Treat SEO as 6-month horizon.

---

## Implications for Roadmap

### Phase 1: Pre-flight + Parse Flow (unblocks everything)
**Rationale:** Node upgrade is a hard prerequisite. Parse flow is the foundation the wizard builds on.
**Delivers:** Node 18→20.9 upgrade done; end-to-end CV paste → Lebenslauf display + bilingual norm-gap notes; dogfoodable by Kilian.
**Addresses:** CV input, Lebenslauf output, normGapNotes + photoAdvice as bilingual "What changed and why" panel, privacy banner.
**Avoids:** Node mismatch (fix first), Next.js 16 async API pitfall (enforce from first component), passing parsed JSON to cover-letter (retain resumeText from step one).
**Research flag:** Standard patterns. No additional research phase needed.

### Phase 2: Cover Letter Flow
**Rationale:** Depends on Phase 1 step machine and resumeText retention.
**Delivers:** Full working flow — personalization questions → streamed Anschreiben → copy/download + native-speaker nudge. Product complete and dogfoodable end-to-end.
**Addresses:** 3–5 personalization questions UI, streamed Anschreiben with live progress, copy to clipboard, grounded-only generation stated in UI.
**Avoids:** EventSource anti-pattern (use getReader()), thinking-delta leak (already filtered; document constraint), form state loss on API error.
**Research flag:** Standard patterns. No additional research phase needed.

### Phase 3: Analytics + Security Guards
**Rationale:** Must exist before public traffic. PostHog event callsites require Phases 1–2 to have real UI triggers.
**Delivers:** Funnel visibility (start→parse_done→letter_done→copy/download rate), PostHog with zero PII capture, input-length guard, rate limiting.
**Addresses:** All 5 PostHog funnel events; `autocapture:false` + `ip:false` (launch blocker); `cvText.length > 15000` → 400; Suspense wrapper for PageviewTracker.
**Avoids:** PostHog PII capture (verify via event stream audit before go-live), Anthropic key in client bundle.
**Research flag:** Standard patterns. Suspense/useSearchParams requirement is a known gotcha — implement explicitly.

### Phase 4: Design Pass + Vercel Deploy
**Rationale:** Design pass most effective on a fully working flow. Deploy wires everything into production.
**Delivers:** Conversion-oriented landing page + tool UI (trust-forward, zero-retention stated prominently, German-market-credible). Live Vercel deployment with all env vars, Node 22.x pinned.
**Addresses:** Mobile-readable output, zero-retention banner placement (above textarea), maxDuration declared in vercel.json, Vercel Pro plan confirmed.
**Avoids:** maxDuration capped at 60s (Hobby plan), cold-start latency, German norm mistakes (native-speaker review gate before public launch).
**Research flag:** Needs native-speaker quality review before launch (human review gate, not a research phase). Vercel plan tier must be confirmed before deploying cover-letter route.

### Phase 5: Distribution Operationalization
**Rationale:** Only meaningful after live dogfooded tool. Community before SEO; paid last.
**Delivers:** Build-in-public content plan (founder job-search story leads), Reddit/LinkedIn cadence, SEO keyword list (6-month horizon), paid test criteria defined before any spend.
**Addresses:** Chancenkarte/expat copy, community backlinks, Sept–Oct peak as stretch SEO goal.
**Avoids:** SEO timeline mismatch (6-month horizon), build-in-public product-push trap (90% story, 10% product), paid before organic validation, budget creep past €150.
**Research flag:** Paid test criteria must be defined explicitly (keyword, success metric, budget cap) before Phase 5 executes.

### Phase Ordering Rationale
- Node upgrade is a hard prerequisite; belongs at the start, not discovered mid-build
- Parse flow before cover-letter flow: step machine and resumeText retention must exist before the cover-letter call is wired
- Analytics before deploy: PostHog misconfiguration is a launch blocker easiest to catch before real traffic
- Design pass after working flow: designer styles real behavior, not a skeleton
- Distribution after deploy: community trust requires a live, working tool to demonstrate

### Research Flags
Phases needing deeper research during planning: **Phase 5** (paid test criteria must be defined; SEO keyword targeting for expat-EN long-tail).
Standard patterns (skip research-phase): **Phases 1, 2, 3, 4** — architecture, streaming, analytics, and deployment patterns are fully documented in research files.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | All packages confirmed from live npm/GitHub/Vercel docs; posthog-js version from web search only |
| Features | HIGH | Backend is first-party source; feature expectations corroborated across multiple competitor and guide sources |
| Architecture | HIGH | Grounded in first-party source code and owner-authored PROJECT.md / BUILD_PLAN.md |
| Pitfalls | MEDIUM | Technical pitfalls verified against official docs; product/GTM pitfalls MEDIUM via web sources |

**Overall confidence:** HIGH for technical decisions; MEDIUM for GTM/SEO timing.

### Gaps to Address
- **Vercel plan tier:** Confirm Pro plan before Phase 4 deploy; Hobby caps cover-letter at 60s
- **Native-speaker quality gate:** No native-speaker review of actual model output yet; required before Phase 4 public launch
- **PARSE_MODEL cost:** Switch to `claude-sonnet-4-6` after Phase 1 dogfood confirms parse quality (~5× cost reduction)
- **Input-length threshold:** 15,000-character guard is a starting point; tune based on observed CV lengths during dogfooding
- **Paid test keyword:** Define specific keyword, bid, and success metric before any Phase 5 spend

---

## Sources

### Primary (HIGH confidence — first-party)
- `scanready/src/app/api/parse/route.ts` — structured output implementation, Zod schema usage
- `scanready/src/app/api/cover-letter/route.ts` — streaming implementation, adaptive thinking config
- `scanready/src/lib/{schema,prompts,anthropic}.ts` — Lebenslauf schema, personalization questions, model config
- `.planning/PROJECT.md` — requirements, constraints, decisions, out-of-scope
- `BUILD_PLAN.md` — phased roadmap, monetization sequence, distribution guardrails

### Secondary (MEDIUM confidence — official docs)
- Next.js 16.2.9 streaming guide (nextjs.org/docs/app/guides/streaming, 2026-05-13)
- Vercel Functions Limits (vercel.com/docs/functions/limitations, 2026-06-02)
- `@anthropic-ai/sdk` GitHub package.json — Zod peer dep range `^3.25.0 || ^4.0.0`
- Anthropic structured outputs docs (platform.claude.com)
- PostHog Next.js docs + GDPR compliance guide
- Next.js 16 upgrade guide

### Tertiary (MEDIUM-LOW confidence — web sources)
- Ahrefs 2M-page SEO ranking timeline study — 6% of pages reach top-10 within a year
- German CV format guides: OphyAI, LiveInGermany, HalloGermany, Expatrio — DIN 5008 norms, AGG photo nuance
- Competitor feature analysis: Appliit, OphyAI, Kickresume, Enhancv, Zety, Rezi

---
*Research completed: 2026-06-22*
*Ready for roadmap: yes*
