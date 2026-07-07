# Roadmap: ScanReady

## Overview

ScanReady starts from a working backend and ships a complete, dogfoodable product. Phase 1 unblocks the environment and delivers the full CV-to-Lebenslauf wizard step. Phase 2 adds the cover-letter flow, completing the end-to-end product. Phase 3 adds input-length security guards. Phase 4 does the design pass and deploys to production. Phase 5 operationalizes distribution as a set of concrete deliverable artifacts. The analytics funnel is backlogged (see "## Backlog") rather than an active phase — pull it into a future milestone if analytics becomes a priority.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Pre-flight + Parse Flow** - Upgrade Node, confirm SDK shapes, and deliver the end-to-end CV paste → Lebenslauf + bilingual norm-gap display (completed 2026-06-22)
- [x] **Phase 2: Cover Letter Flow** - Add job posting input, personalization questions, and streamed Anschreiben with copy/download — product complete end-to-end (completed 2026-06-22)
- [x] **Phase 3: Security Guards** - Input-length guards on both API routes + keep the flow stateless — safe to put real (and oversized/abusive) input in front of users (completed 2026-06-23)
- [x] **Phase 4: Design Pass + Vercel Deploy** - Conversion-oriented landing and tool UI, then deploy to production with all env vars and runtime pinned (completed 2026-06-23)
- [x] **Phase 5: Distribution Operationalization** - Produce the build-in-public content plan, SEO keyword list, and paid-test spec as deliverable artifacts (completed 2026-06-24)
- [ ] **Phase 7: Account Library + Honest Pricing (design Phase A)** - Reconcile the six claude.ai/design Phase-A surfaces into the live app behind Stage 3 env gates: library card gallery, Bewerbungsphase-Pass SKU, storage gate, Pass modal, preise v2, foundation primitives + founder assets

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

**Plans**: 4/4 plans complete
**Wave 1**

- [x] 01-01-PLAN.md — Walking skeleton: Node 20.9 pre-flight + thinnest paste→parse→render slice (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Backend grounding-safe schema + prompt upgrade: categorized skills, German language levels, concise norm-gap notes (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — WYSIWYG editor core: inline edit, add/remove/reorder entries+sections, date soft-format, copy, start over (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Categorized skill chips + language dropdown + collapsible norm-gap panel + optional-photo callout (Wave 4)

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

**Plans**: 2/2 plans complete
**Wave 1**

- [x] 02-01-PLAN.md — Model restore + D-09 prompt edit + reducer extension + live-streaming slice (result → job-posting/question form → getReader stream → read-only letter) (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Finished-letter result view: editable letter, native-speaker trust callout, copy + .txt download, Regenerieren, Start over, error retry (Wave 2)

**UI hint**: yes

### Phase 3: Security Guards

**Goal**: Both API routes reject oversized input and nothing is persisted server-side — the tool is safe for real traffic
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TRUST-01, TRUST-03
**Success Criteria** (what must be TRUE):

  1. Submitting a CV (`resumeText`/`cvText`), job posting, or answer over its per-field length threshold returns a 400 with a user-readable German message
  2. Both API routes (`/api/parse`, `/api/cover-letter`) enforce the per-field length limits before calling the model
  3. A client-side character counter + disabled submit prevents oversized input in normal use
  4. No user data is persisted server-side and guard rejections do not log rejected content — confirmed by reviewing both routes

**Plans**: 2/2 plans complete

**Wave 1**

- [x] 03-01-PLAN.md — Parse-route guard slice: server-side 30k resumeText 400 (German JSON) + InputView live char counter & disabled submit + no-rejection-logging (Wave 1)

**Wave 2** *(blocked on Wave 1 — shares page.tsx)*

- [x] 03-02-PLAN.md — Cover-letter-route guard slice: server-side 30k/15k/2k 400s aligned to JSON shape + CoverLetterInputView job-posting & per-answer counters & disabled submit (Wave 2)

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

**Plans**: 3/3 plans complete

**Wave 1**

- [x] 04-01-PLAN.md — Brand foundation (Lora serif, deep-blue accent, light-only, metadata) + D-01 route split (tool → /app) + tool UI retrofit & WCAG-AA pass (Wave 1)

**Wave 2** *(blocked on Wave 1 — needs tokens + freed / route)*

- [x] 04-02-PLAN.md — Marketing landing at / : 6-section blueprint, static before/after mockups, scroll micro-motion, OG card, copy-guardrail + WCAG-AA sweep (Wave 2)

**Wave 3** *(blocked on Wave 2 — deploys the whole app)*

- [x] 04-03-PLAN.md — Vercel deploy: vercel.json + maxDuration 300, ANTHROPIC_API_KEY in prod, Node 20.x, live SC4 stream-duration measurement + documented fallback (Wave 3)

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

**Plans**: 3/3 plans complete

**Wave 1** *(all three artifacts are independent — fully parallelizable)*

- [x] 05-01-PLAN.md — GTM-01 community plan: Reddit-led build-in-public, subreddit shortlist + risk tiers, ~1-post/week cadence, 3 drafted posts, per-sub rule-verification checklist (Wave 1)
- [x] 05-02-PLAN.md — GTM-02 SEO keyword plan: EN + DE clusters ("German CV" head term), 2 cornerstone guides, 6-month cadence with Sept–Oct stretch goal + Keyword-Planner validation step (Wave 1)
- [x] 05-03-PLAN.md — GTM-03 paid-test spec: one Google Search keyword, cost-per-completed-flow metric, €100 cap, organic-proof gate (N≈50), Phase-6 analytics dependency flagged BLOCKED (Wave 1)

### Phase 7: Account Library + Honest Pricing (design Phase A)

**Goal**: The six Phase-A design surfaces (01-library, 02-storage-gate, 03-pass, 04-preise, 05-save-moment, 06-founder-assets) are reconciled into the live app behind the existing Stage 3 env gates: saved applications render as a card gallery with rename/duplicate/delete, the save moment becomes an editable-title save card, the free storage limit shows an honest Pass/Plus chooser, the Bewerbungsphase-Pass (14,99 EUR, 30 days, non-renewing, account-required) is purchasable on new rails with DB-tier storage limits, /preise shows the 4-card ladder, and founder assets + 404 ship. Everything stays inert until founder keys exist.
**Mode:** mvp
**Depends on**: Phase 5 (plus the post-v1.0 Stage 3 accounts stack, Humanizer+/Bewerbungspaket rails, and the committed design export - not GSD phases)
**Requirements**: TBD (spec lives in scanready/docs/design-impl-plan-library-pricing.md + scanready/docs/prd-account-library-pricing.md)
**Success Criteria** (what must be TRUE):

  1. Saved packages render as the card gallery on both /konto (SavedPackagesSection) and /app (SavedApplications): mono date + kebab row, serif title, company line, badge row (LL / AS / STELLENANZEIGE with dashed "fehlt"), inline rename, "Neue Bewerbung aus dieser", delete with confirm, NN/g empty state, storage-transparency footer; read-only rows HIDE edit controls (never disable); no photos anywhere in cards
  2. SaveApplicationButton is a save card on BOTH result views: title pre-filled AND pre-selected from derivePackageTitle with provenance line, saved-confirmation panel (checkmark + timestamp + editable title + library link); saving stays explicit-only (no autosave/blur-save)
  3. Migration supabase/migrations/0002_pass.sql adds humanizer_purchases.expires_at + kind='pass_30d' (requires user_id) and re-creates enforce_package_limit() with three tiers (subscription unlimited, live pass 25, free 1) keeping the advisory-lock race guard; PASS_PRICE_CENTS = 1499 exists beside the other price constants
  4. /api/pass/intent mints a Pass PaymentIntent ONLY for authenticated users; a live pass window (pass_30d, expires_at > now()) grants PDF export + refinements via the extended entitlement check; anonymous humanizer/paket stateless rails are byte-for-byte untouched in behavior
  5. StorageGate replaces the state==='limit' text hint as an inline dismissible panel (Pass featured + Plus "Geplant", honest delete-instead footer, purchase-history anchor variant at 2+ paket purchases, dismissal persisted in sessionStorage, no countdowns or fake scarcity)
  6. PassModal mirrors PaketModal's payment UX but with the DISTINCT proportional Widerruf consent wording (§356(4)/§357a BGB, NOT Paket's §356(5) text) and "Endet automatisch" framed as a feature; active chip ("Pass aktiv bis TT.MM.JJJJ" + storage meter) and neutral expired state exist; new German copy + Widerruf variant flagged for native-speaker + legal review
  7. /preise shows the 4-card ladder (2,99 / 4,99 / 14,99 featured with per-application math / Plus 5,99 "Geplant" non-buyable), the free-tier manifesto pull quote, and the anti-Abofalle before/after comparison; prices match the code constants
  8. The six founder SVGs are in public/, favicon + openGraph.images wired in layout.tsx, src/app/not-found.tsx built from surface 06; npx tsc --noEmit, the full test suite, and next build all pass; no em-dash in any new copy; all new surfaces are inert when accounts/Stripe env vars are unset

**Plans**: 5/8 plans executed

**Wave 1** *(parallel - no file overlap; the authorized A0 + A1 foundation)*

- [x] 07-01-PLAN.md — A0 foundation: shadow tokens + seven ui.tsx primitives + founder assets/favicon/OG metadata + surface-06 not-found (Wave 1)
- [x] 07-02-PLAN.md — A1 Pass data: migration 0002 (expires_at + three-tier limit) + [BLOCKING] live schema push + PASS_PRICE_CENTS/PASS_STORAGE_CAP + account helpers + tests (Wave 1)

**Wave 2** *(parallel - Pass API, save moment, and preise touch disjoint files)*

- [x] 07-03-PLAN.md — A1 Pass API: auth-gated /api/pass/intent + /api/pass/verify (idempotent pass row) + additive pass entitlement in humanize/paket (Wave 2)
- [x] 07-04-PLAN.md — A2 save moment: SaveApplicationButton rebuilt as an editable-title save card + SavedConfirmationPanel on both result views (Wave 2)
- [x] 07-08-PLAN.md — A5 preise v2: four-card ladder (prices from constants) + free-tier manifesto + anti-Abofalle comparison (Wave 2)

**Wave 3** *(blocked on 07-04 - shares app/page.tsx + i18n.tsx)*

- [ ] 07-05-PLAN.md — A2 library gallery: card gallery on /konto + /app, kebab actions, inline rename, duplicate-and-tailor, read-only hides edit controls, empty state (Wave 3)

**Wave 4** *(blocked on 07-05 - shares app/page.tsx + i18n.tsx)*

- [ ] 07-06-PLAN.md — A3 storage gate: StorageGate inline chooser replaces the limit hint, Pass featured + Plus "Geplant", 2+-purchase anchor, sessionStorage dismissal (Wave 4)

**Wave 5** *(blocked on 07-03 + 07-06 - shares app/page.tsx + KontoClient.tsx + i18n.tsx; final build gate)*

- [ ] 07-07-PLAN.md — A4 Pass modal + lifecycle: PassModal (distinct §356(4)/§357a Widerruf) + active/expired chips + StorageGate Pass CTA wire (Wave 5)

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Pre-flight + Parse Flow | 4/4 | Complete    | 2026-06-22 |
| 2. Cover Letter Flow | 2/2 | Complete   | 2026-06-22 |
| 3. Security Guards | 2/2 | Complete    | 2026-06-23 |
| 4. Design Pass + Vercel Deploy | 3/3 | Complete    | 2026-06-23 |
| 5. Distribution Operationalization | 3/3 | Complete    | 2026-06-24 |
| 7. Account Library + Honest Pricing (design Phase A) | 5/8 | In Progress|  |

## Backlog

Not scheduled — pull into a future milestone if analytics becomes a priority.

### Phase 6: Analytics (post-launch)

**Goal**: The PostHog funnel fires the five events with zero CV/PII capture — added as a low-priority post-MVP follow-up to measure usage once the tool is live
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: TRUST-02, OPS-01
**Success Criteria** (what must be TRUE):

  1. PostHog fires `start`, `parse_done`, `letter_done`, `copy`, and `download` events, visible in the PostHog (EU Cloud) dashboard
  2. PostHog is initialized cookieless (`persistence: 'memory'`) with `autocapture: false`, `ip: false`, `person_profiles: 'identified_only'` — no CV/PII text in the event stream and no consent banner required
  3. Analytics fires only in production and degrades silently if the PostHog key is unset or PostHog is blocked — never breaking the core flow

**Plans**: TBD
