# Roadmap: ScanReady

## Overview

ScanReady starts from a working backend and ships a complete, dogfoodable product. Phase 1 unblocks the environment and delivers the full CV-to-Lebenslauf wizard step. Phase 2 adds the cover-letter flow, completing the end-to-end product. Phase 3 wires analytics and security guards before any public traffic. Phase 4 does the design pass and deploys to production. Phase 5 operationalizes distribution as a set of concrete deliverable artifacts.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Pre-flight + Parse Flow** - Upgrade Node, confirm SDK shapes, and deliver the end-to-end CV paste → Lebenslauf + bilingual norm-gap display
- [ ] **Phase 2: Cover Letter Flow** - Add job posting input, personalization questions, and streamed Anschreiben with copy/download — product complete end-to-end
- [ ] **Phase 3: Analytics + Security Guards** - Wire PostHog funnel events (zero PII), add input-length guards — safe to put in front of real users
- [ ] **Phase 4: Design Pass + Vercel Deploy** - Conversion-oriented landing and tool UI, then deploy to production with all env vars and runtime pinned
- [ ] **Phase 5: Distribution Operationalization** - Produce the build-in-public content plan, SEO keyword list, and paid-test spec as deliverable artifacts

## Phase Details

### Phase 1: Pre-flight + Parse Flow

**Goal**: App runs on Node 20.9, SDK call shapes are confirmed, and a user can paste a CV and see a German Lebenslauf with bilingual norm-gap explanations
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PRE-01, PRE-02, PRE-03, INPUT-01, INPUT-02, INPUT-03, LL-01, LL-02, LL-03, LL-04
**Success Criteria** (what must be TRUE):

  1. `npm run dev` starts without error on Node 20.9; `engines` field is pinned in `package.json` and `.nvmrc` is committed
  2. User can paste résumé text, submit, see a loading state, and receive a German Lebenslauf with correct DIN-format dates and reverse-chronological structure
  3. A bilingual "what changed and why" panel renders from `normGapNotes[]` and `photoAdvice` — no additional API call required
  4. A prominent zero-retention statement appears above the CV textarea before the user submits
  5. User can copy the Lebenslauf output to clipboard

**Plans**: 3/4 plans executed
**Wave 1**

- [x] 01-01-PLAN.md — Walking skeleton: Node 20.9 pre-flight + thinnest paste→parse→render slice (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Backend grounding-safe schema + prompt upgrade: categorized skills, German language levels, concise norm-gap notes (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — WYSIWYG editor core: inline edit, add/remove/reorder entries+sections, date soft-format, copy, start over (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-04-PLAN.md — Categorized skill chips + language dropdown + collapsible norm-gap panel + optional-photo callout (Wave 4)

**UI hint**: yes

### Phase 2: Cover Letter Flow

**Goal**: A user can complete the full product flow — paste a job posting, answer personalization questions, watch the Anschreiben stream live, and copy the finished letter
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CL-01, CL-02, CL-03, CL-04, CL-05, CL-06
**Success Criteria** (what must be TRUE):

  1. User can paste a target job posting and advance to the personalization step
  2. User sees and answers the 3–5 personalization questions drawn from `PERSONALIZATION_QUESTIONS`
  3. Anschreiben text appears live as it streams — first chunk visible within seconds of submitting
  4. A "have a native German speaker review this" nudge appears on the finished letter
  5. User can copy the completed Anschreiben to clipboard

**Plans**: TBD
**UI hint**: yes

### Phase 3: Analytics + Security Guards

**Goal**: Funnel events fire in PostHog with zero CV/PII capture, and both API routes reject oversized input — the tool is safe for real users
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TRUST-01, TRUST-02, TRUST-03, OPS-01
**Success Criteria** (what must be TRUE):

  1. PostHog fires `start`, `parse_done`, `letter_done`, `copy`, and `download` events visible in the PostHog dashboard
  2. PostHog is initialized with `autocapture: false`, `ip: false`, `person_profiles: 'identified_only'` — no CV text appears in the PostHog event stream
  3. Submitting a CV or job posting over the length threshold returns a 400 error with a user-readable message
  4. No user data is persisted server-side — confirmed by reviewing both API routes and the PostHog event stream

**Plans**: TBD

### Phase 4: Design Pass + Vercel Deploy

**Goal**: The landing page and tool UI are conversion-oriented and German-market-credible, and the app is publicly live on Vercel with streaming completing within the function time limit
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, OPS-02, OPS-03
**Success Criteria** (what must be TRUE):

  1. Landing page communicates the core value (zero-retention, grounded output, norm-correct) without generic AI-purple aesthetics — trust-forward and German-market-credible
  2. The tool UI presents the full four-step flow on one page and is readable on a mobile screen
  3. The app is publicly reachable on a Vercel URL with `ANTHROPIC_API_KEY` and PostHog key configured in the production environment
  4. The cover-letter stream completes end-to-end on Vercel without hitting the function time limit — `maxDuration` declared in `vercel.json` and Vercel plan tier confirmed

**Plans**: TBD
**UI hint**: yes

### Phase 5: Distribution Operationalization

**Goal**: Three concrete distribution artifacts exist — a build-in-public content plan, an SEO keyword list with cadence, and a paid-test spec — so distribution can start the moment the live tool is ready
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: GTM-01, GTM-02, GTM-03
**Success Criteria** (what must be TRUE):

  1. A written build-in-public / community plan exists: founder job-search story as the lead, Reddit (r/germany, r/expats) and LinkedIn cadence documented, first 3 posts drafted
  2. An SEO keyword list exists covering expat-EN long-tail and emerging German "KI" terms, with a 6-month publishing cadence and the Sept–Oct application peak flagged as the stretch goal
  3. A paid conversion-test spec exists: one specific keyword, a defined success metric, and a hard budget cap — with an explicit "only after organic validation" gate documented

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Pre-flight + Parse Flow | 3/4 | In Progress|  |
| 2. Cover Letter Flow | 0/TBD | Not started | - |
| 3. Analytics + Security Guards | 0/TBD | Not started | - |
| 4. Design Pass + Vercel Deploy | 0/TBD | Not started | - |
| 5. Distribution Operationalization | 0/TBD | Not started | - |
