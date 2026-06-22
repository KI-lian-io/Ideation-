# Requirements: ScanReady

**Defined:** 2026-06-22
**Core Value:** The German output is native-quality and trustworthy — norm-correct, never fabricated — so a German recruiter takes the applicant seriously in the 8-second scan.

> Backend note: `/api/parse` (CV → grounded Lebenslauf) and `/api/cover-letter` (streamed, grounded Anschreiben) already exist and typecheck. Most v1 requirements are about making the existing capability **visible, trustworthy, and reachable** through a UI, plus deploy + distribution. Requirements marked _(backend exists)_ are enforced server-side and need only to be surfaced.

## v1 Requirements

### Pre-flight (PRE)

- [x] **PRE-01**: App runs on Node ≥ 20.9 — `engines` pinned in package.json + `.nvmrc` committed (Next 16 hard requirement; local env is 18.14.0)
- [x] **PRE-02**: Anthropic SDK call shapes (`messages.parse` + `output_config`, `messages.stream`) confirmed against installed `@anthropic-ai/sdk@0.105` before UI is built on them
- [x] **PRE-03**: `.env.local` setup documented + `.env.example` tracked (`ANTHROPIC_API_KEY`)

### CV Input & Parse (INPUT)

- [x] **INPUT-01**: User can paste résumé text and submit it for conversion
- [x] **INPUT-02**: User sees a prominent zero-retention / "nothing is stored" statement above the CV field before submitting
- [x] **INPUT-03**: User sees a clear loading state while the CV is parsed, and a readable error if parsing fails

### Lebenslauf Output (LL)

- [x] **LL-01**: User sees their CV restructured as a German Lebenslauf — reverse-chronological, DIN-style sections, `DD.MM.YYYY` dates, personal-data block, signature placeholder
- [x] **LL-02**: User sees a bilingual "what changed and why" panel — English explanations rendered from `normGapNotes[]` (pure client-side; no API change)
- [x] **LL-03**: User sees nuanced photo guidance from `photoAdvice` (optional per AGG, expected in practice) — never mandated
- [x] **LL-04**: User can copy the Lebenslauf output to clipboard

### Anschreiben Flow (CL)

- [x] **CL-01**: User can paste a target job posting
- [x] **CL-02**: User answers the 3–5 personalization questions (from the `PERSONALIZATION_QUESTIONS` constant)
- [x] **CL-03**: User sees the Anschreiben stream live as it generates (consumed via `response.body.getReader()`, not EventSource)
- [x] **CL-04**: Generated Anschreiben is grounded only in CV facts + the user's answers — no fabrication _(backend exists; surfaced in UI copy)_
- [x] **CL-05**: User sees a "have a native German speaker review this" nudge on the finished letter
- [x] **CL-06**: User can copy the Anschreiben output to clipboard

### Trust & Compliance (TRUST)

- [ ] **TRUST-01**: No user CV/output is persisted server-side — the flow stays stateless _(backend exists; must not regress)_
- [ ] **TRUST-02**: Analytics capture funnel events only, never CV/PII content — PostHog `autocapture:false`, `ip:false`, `person_profiles:'identified_only'`
- [ ] **TRUST-03**: Both API routes reject oversized input via a length guard (cost + abuse boundary)

### Analytics & Deploy (OPS)

- [ ] **OPS-01**: Funnel events fire — `start`, `parse_done`, `letter_done`, `copy`, `download`
- [ ] **OPS-02**: App is deployed publicly on Vercel with the cover-letter stream completing within the function time limit (confirm plan/`maxDuration`)
- [ ] **OPS-03**: Production env is configured (ANTHROPIC_API_KEY, PostHog key) and Node pinned to 20.x on Vercel

### Design & Landing (UI)

- [ ] **UI-01**: A conversion-oriented landing communicates the value — trust-forward, zero-retention stated loudly, German-market-credible (not generic AI-purple), built via claude.ai/design
- [ ] **UI-02**: The tool UI presents the full flow on one page and is mobile-readable

### Distribution (GTM)

- [ ] **GTM-01**: A build-in-public / community plan exists — founder job-search story leads, Reddit (r/germany, r/expats) + LinkedIn cadence
- [ ] **GTM-02**: An SEO keyword list + publishing cadence exists — expat-EN long-tail + emerging German "KI" terms, treated as a 6-month horizon
- [ ] **GTM-03**: A paid conversion-test spec exists — specific keyword, success metric, and budget cap — to run only after organic validation (test, not a channel)

## v2 Requirements

Deferred. Tracked, not in the current roadmap.

### Input/Output formats (FMT)

- **FMT-01**: PDF upload (client-side text extraction via `unpdf`)
- **FMT-02**: PDF download of the Lebenslauf/Anschreiben
- **FMT-03**: `.docx` download

### Monetization (PAY)

- **PAY-01**: Finish-line paywall (€19–29/application, €39–49 bundle) + Stripe
- **PAY-02**: B2B channel (university career services, relocation firms)

### Enhancements (ENH)

- **ENH-01**: LinkedIn profile import
- **ENH-02**: ATS keyword scoring against the job posting

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| AI-detection "humanizer" / detection-evasion | Ethical + product line; our "authentic voice" is personalization from the user's own answers, never evasion |
| User accounts / login | Breaks the zero-retention moat and GDPR posture; not needed for the flow |
| Template gallery / multiple Lebenslauf styles | German format is prescriptive — offering choice teaches the wrong lesson |
| CV enrichment / "enhance my experience" | Fabricating qualifications = fraud + liability |
| Photo upload / embedding | GDPR Art. 9 complexity + scope creep; we give guidance, not processing |
| Europass output | Negative signal to German HR — actively harmful |
| Earnings / income claims | FTC/ASA line — sell the capability, never income |
| Paid as a growth channel (v1) | Paid is a LAST conversion *test*, not acquisition |
| Parallel B2B pilot now | Deferred to protect focus; B2C-first |

## Traceability

Each v1 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PRE-01 | Phase 1 | Complete |
| PRE-02 | Phase 1 | Complete |
| PRE-03 | Phase 1 | Complete |
| INPUT-01 | Phase 1 | Complete |
| INPUT-02 | Phase 1 | Complete |
| INPUT-03 | Phase 1 | Complete |
| LL-01 | Phase 1 | Complete |
| LL-02 | Phase 1 | Complete |
| LL-03 | Phase 1 | Complete |
| LL-04 | Phase 1 | Complete |
| CL-01 | Phase 2 | Complete |
| CL-02 | Phase 2 | Complete |
| CL-03 | Phase 2 | Complete |
| CL-04 | Phase 2 | Complete |
| CL-05 | Phase 2 | Complete |
| CL-06 | Phase 2 | Complete |
| TRUST-01 | Phase 3 | Pending |
| TRUST-02 | Phase 3 | Pending |
| TRUST-03 | Phase 3 | Pending |
| OPS-01 | Phase 3 | Pending |
| OPS-02 | Phase 4 | Pending |
| OPS-03 | Phase 4 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| GTM-01 | Phase 5 | Pending |
| GTM-02 | Phase 5 | Pending |
| GTM-03 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-22*
*Last updated: 2026-06-22 after roadmap creation (traceability populated)*
