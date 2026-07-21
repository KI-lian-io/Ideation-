# Feature Research

**Domain:** CV/cover-letter conversion tool for expats applying in Germany
**Researched:** 2026-06-22
**Confidence:** HIGH (domain well-understood from prior concept research; feature expectations confirmed by competitor analysis and user-facing tool reviews)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text-paste CV input | Every comparable tool (FlowCV, Kickresume, Enhancv) starts with paste or upload; no-upload v1 is fine but paste must be zero-friction | LOW | Already implemented in backend; UI input needed |
| Lebenslauf output — structured sections | Users have read guides (OphyAI, LiveInGermany, HalloGermany) listing the mandatory sections: Persönliche Daten, Berufserfahrung, Ausbildung, Kenntnisse, Hobbys, Unterschrift placeholder | LOW | Schema already enforces sections |
| Reverse-chronological ordering | Every German CV guide and tool enforces this; wrong ordering signals format illiteracy instantly | LOW | Schema already handles |
| DIN 5008 date formatting (TT.MM.JJJJ) | Mentioned by Appliit, OphyAI, GoAusbildung as a distinguishing German standard; date format errors are visible on a first scan | LOW | Prompt/schema must enforce |
| Anschreiben output | 42% of German HR ignore applications without one; 71% call it essential (from concept research). Users arriving at this tool expect both documents | MEDIUM | Backend streamed generation already implemented |
| Norm-gap explanation | Users don't know what they don't know — that is the entire value prop. An unexplained conversion looks like random reformatting. Every guide (OphyAI, VisualCV, HalloGermany) describes the gap but none auto-explains it per-field in the tool itself | MEDIUM | normGapNotes field already in schema |
| Copy to clipboard | Standard across all comparable tools (Grammarly, LazyApply, AIApply, Enhancv). Missing copy = friction at the most critical moment | LOW | Simple browser API |
| Download as PDF | Expected by 100% of users who finish the flow. Comparable tools (Resume.io, Zety, Enhancv) all offer PDF as primary format. PDF preserves DIN 5008 margins | MEDIUM | Requires print-to-PDF or a PDF generation library |
| Privacy/zero-retention statement | 79% of respondents in Pew Research worry about personal data used without consent. CVs contain DOB, nationality, address — GDPR Article 9 sensitive data. Resumly, Smallpdf, iLovePDF all use "deleted within X" as a conversion feature. Without a visible statement, trust-sensitive users bounce before pasting | LOW | A single prominent banner/line; no code complexity |
| Bilingual output: German doc + English explanation | Expat users cannot trust a German document they cannot read. Appliit explicitly notes "users review everything in English before downloading German versions." Without English context, the user has no way to verify correctness and will not trust the output | HIGH | Core differentiator AND table stakes for this specific audience — it is both |
| Photo guidance (nuanced, non-mandating) | ~82% of German recruiters still expect a Bewerbungsfoto; at the same time the AGG makes it legally optional. Every credible German CV guide (OphyAI, cv-creator.co.uk, airesume.guru) explains the nuance. A tool that silently omits a photo field or mandates one is wrong in different ways | LOW | Text guidance + optional placeholder note in output; no image processing needed in v1 |
| Employment-gap handling note | German CVs must be "gapless" — gaps over 3 months must be explained. This is alien to US/UK applicants. If the tool silently ignores gaps, the output will draw recruiter scrutiny | LOW | Prompt instructs; normGapNotes surfaces in output |
| Signature placeholder | German Anschreiben and Lebenslauf conventionally close with "Ort, Datum" + signature line. Omitting it marks the document as foreign. All German templates include it | LOW | Text placeholder in output; no image handling |
| Streamed Anschreiben delivery | Users waiting for a cover letter expect visible progress — streaming is now standard (Grammarly, Kickresume, Rezi all show generation in real time). A blank screen during generation increases abandonment | MEDIUM | Backend already streams; UI must render incrementally |
| Mobile-readable output display | A significant share of expats will access via mobile (checking progress, sharing link). The output must render readably on small screens even if it is not mobile-first for editing | LOW | Tailwind responsive classes |

---

### Differentiators (Competitive Advantage)

Features that set ScanReady apart. Not universally expected, but high-value for the target user.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-field English "why this changed" explanations | Competitors (Appliit, OphyAI, GoAusbildung) do not explain individual field decisions inline. Appliit reviews in English but does not explain the norm behind each change. ScanReady showing "DOB added — German Lebenslauf always includes date of birth; omitting it signals a foreign format" builds trust AND educates. This is the moat. | MEDIUM | normGapNotes fields in schema already support this; UI must surface prominently alongside the German output |
| Authentic-voice Anschreiben from 3–5 targeted questions | The #1 German rejection reason is "no company-specific motivation." Generic AI cover letters are actively disqualifying. No competitor collects structured personalization questions before generating. The right questions (proud achievement, why this company, Germany motivation, colleague description, gap/pivot) are the craft. | MEDIUM | Already implemented in prompts.ts; UI must present questions clearly with purpose explained |
| Grounded-only generation (anti-fabrication) | Comparable tools (Kickresume, Zety, Enhancv) AI-generate content freely, inventing achievements and responsibilities. ScanReady never invents facts — every claim traces to the uploaded CV. This is both a legal/ethical requirement and a differentiator for trust-sensitive users who fear AI hallucination on job applications | LOW | Already enforced in schema + prompts; UI should state "we only use what you give us" |
| GDPR zero-retention as a named feature | Most US tools (Kickresume, Rezi, Enhancv) store documents indefinitely for account holders and do not prominently state otherwise. Resumly has privacy controls but they require an account. ScanReady's stateless processing — no account, no storage, no training on user data — is a headline feature, not a footnote, especially for GDPR-aware European users and privacy-conscious expats uploading DOB + nationality | LOW | Banner, privacy section on landing page; no code complexity |
| "Have a native speaker review" nudge | All German guides (Expatrio, HalloGermany, OphyAI) recommend a native speaker review. Building this honest nudge into the tool establishes credibility and sets appropriate expectations — signalling quality awareness rather than false confidence. No AI tool currently does this. | LOW | Text in output footer; already in prompts.ts |
| Specific Chancenkarte / Opportunity Card positioning | No competitor targets this cohort explicitly: 11,500 people in Germany specifically to job-hunt, English-speaking, highly qualified, maximum urgency. Speaking directly to this group in copy and onboarding converts higher than generic "expats in Germany" | LOW | Copy and landing page; no engineering complexity |
| No-account, no-signup flow | Kickresume requires mandatory signup before accessing the builder. Zety gates download behind payment after a full build. Enhancv offers guest access but stores documents. ScanReady's no-friction entry (paste → get output) removes the largest single drop-off point in comparable tools | LOW | Already the architecture; must be stated clearly in UX |

---

### Anti-Features (Deliberately NOT Built)

Features that seem desirable but are out of scope, ethically wrong, or actively harmful to the MVP.

| Feature | Why Requested | Why NOT to Build It | What to Do Instead |
|---------|---------------|---------------------|--------------------|
| User accounts and saved applications | Users assume persistence is better; competitors (Kickresume, Resumonk) all have dashboards | Breaks zero-retention GDPR posture (the moat); adds auth, DB, session management complexity; v1 success metric is start→copy/download rate, not return visits | State clearly: "nothing is saved — download before you close." Stateless is the feature. |
| Application tracking dashboard | Job seekers applying to multiple roles want to track status | Requires accounts + DB; turns a sharp single-tool into a broad platform; competitors (Teal, Swooped) own this with years of head start | Out of scope. Provide a "start a new application" CTA to restart the flow instead. |
| Template gallery / design picker | Resume builders (Kickresume 40+ templates, Zety) all offer visual variety | German Lebenslauf format is prescriptive — DIN 5008 leaves little design freedom. A template gallery implies interchangeable formats, which teaches the wrong lesson. The correct output is not a design choice. | Ship one DIN-5008-correct format. Explain why it is right. |
| AI-detection humanizer / detection-evasion | Users may request "make it sound less AI" in the detection-evasion sense | This is the ethical line from necessity-tools-strategy.md §5: indefensible product, poisons adjacent legitimate tools. Also technically theatrical — detection accuracy is poor. | Our "authentic voice" = personalization from the user's own answers to the 3–5 questions. Personalization is the real humanizer. State this explicitly. |
| Fabrication or CV enrichment ("enhance my experience") | Users want impressive bullets; Kickresume and Rezi offer AI bullet enhancement | Fabricating qualifications on a job application is fraud and potential liability. Zero tolerance — enforced structurally in schema + prompts. | State clearly: "we reformat and restructure only — we never invent facts." Frame this as a quality and trust signal, not a limitation. |
| Photo upload and processing | Users want a professional photo embedded in the Lebenslauf | Facial image processing adds significant complexity (storage, GDPR Article 9 special-category data, embedding into PDF), v1 has no DB; the photo question is nuanced (optional by AGG) | Provide clear written guidance on photo requirements (size, style, placement, the AGG nuance). Instruct user to add their own photo to the downloaded .docx before sending. |
| Europass output option | Some users know Europass and assume it is professional | German advisors and HR explicitly recommend against Europass for private-sector German jobs — it is a negative signal. Offering it would actively harm users. | Explain why Europass is wrong for this context in the norm-gap notes. |
| ATS keyword score / ATS optimization | Comparable tools (OphyAI, Resumly, Appliit) market "98% ATS pass rate" | German ATS (Personio, Softgarden, d.vinci) parse correctly-formatted Lebenslauf documents; DIN 5008 compliance + proper text-based PDF is sufficient. Keyword optimization for the Lebenslauf itself is less critical than for the Anschreiben, which is already tailored to the job posting. ATS score theatre adds complexity without proportional value for v1. | Focus on DIN-5008 compliance and grounded Anschreiben keyword alignment. Add ATS scoring only if user feedback identifies it as a felt pain. |
| Multi-language Anschreiben (English version) | Expats may want an English cover letter for English-language postings | The product's moat is German-market compliance. English Anschreiben is a commodity any LLM generates. Offering it dilutes focus and contradicts the "German application expert" positioning. | State scope clearly: this tool converts to German application standards. For English postings, standard tools suffice. |
| Subscription / monthly pricing | SaaS is the default business model assumption | v1 is free; subscription requires accounts + billing infrastructure; the planned monetization is a one-shot finish-line paywall (€19–29) — episodic job applications don't fit a subscription model | When monetization is added, use one-shot pricing or non-expiring credits per BUILD_PLAN §4. |
| Income / salary outcome claims | Marketing instinct to promise results | FTC/ASA-clean requirement from PROJECT.md and necessity-tools-strategy.md §5. "Get hired faster" is acceptable; salary claims or "land your dream job" headlines are not. | Sell the capability: "a German application that passes the 8-second recruiter scan." |
| Mandatory paid download gate at v1 | Finish-line paywall is the planned monetization | v1 success metric is completion rate and quality validation through dogfooding — a paywall in v1 blocks the dogfood loop and prevents real feedback | Add paywall only in Phase 3 (BUILD_PLAN), after quality and demand are proven. |
| LinkedIn import | Kickresume, Teal, Rezi all offer LinkedIn profile import | LinkedIn's API restricts scraping; requires OAuth, profile permission flows; adds significant auth/legal complexity; v1 is text-paste | Text-paste is v1. LinkedIn import is a v2 consideration if users request it. |

---

## Feature Dependencies

```
CV text input (paste)
    └──required by──> Parse API call
                          └──required by──> Lebenslauf display + norm-gap notes
                                                └──enables──> Job posting input + personalization questions
                                                                  └──required by──> Streamed Anschreiben
                                                                                        └──enables──> Copy / Download

Bilingual English explanations
    └──enhances──> Lebenslauf display (shown alongside German output)
    └──enhances──> Norm-gap notes (the English "why" IS the norm-gap feature)

Photo guidance text
    └──requires──> Lebenslauf display (shown as part of the norm-gap section)
    └──independent of──> Photo upload (NOT building photo upload in v1)

Privacy/zero-retention statement
    └──enhances──> Trust before CV paste (landing page + tool header)
    └──independent of──> All other features (copy only)

Download as PDF
    └──requires──> Lebenslauf display rendered
    └──conflicts with──> Photo embedding (photo processing not built in v1 — download = user adds photo to .docx manually)

"Have a native speaker review" nudge
    └──requires──> Anschreiben complete
    └──enhances──> Trust by setting appropriate expectations
```

### Dependency Notes

- **Parse API → Lebenslauf display:** The norm-gap explanations only make sense once parsing is complete; the UI should not show the job-posting step until parsing is confirmed successful.
- **Bilingual explanations enhance Lebenslauf display:** The English "why" is not a separate section — it lives inline or adjacent to the German output fields. The layout decision matters: side-by-side (German | English explanation) or accordion (German field → expand for English rationale).
- **PDF download conflicts with photo embedding:** Users must be told explicitly in the download flow to add their own photo to the .docx before converting to PDF. This is not a bug — it is a deliberate scope constraint.

---

## MVP Definition

### Launch With (v1 — current milestone)

The minimum to validate the core value prop: "an expat can paste their CV and get a trustworthy German Lebenslauf + Anschreiben."

- [ ] Text-paste CV input — the entry point for the entire flow
- [ ] Norm-gap report (normGapNotes) displayed in English — validates the education value prop
- [ ] Structured German Lebenslauf output — the primary conversion artifact
- [ ] Bilingual presentation: German output + English explanation per change — the core differentiator AND table stakes for trust
- [ ] Photo guidance note in norm-gap section — essential for German-market credibility; text only
- [ ] Signature placeholder note in Lebenslauf — prevents a visible format error
- [ ] Job posting text-paste + 3–5 personalization questions — required for authentic-voice Anschreiben
- [ ] Streamed Anschreiben with DIN-5008 structure — the second primary artifact
- [ ] "Have a native speaker review" nudge at end of Anschreiben — trust + honesty signal
- [ ] Copy to clipboard for both outputs — minimum viable export
- [ ] Zero-retention privacy statement (banner or prominent note) — conversion requirement for trust-sensitive users
- [ ] PostHog events: start, parse_done, letter_done, copy/download — required to measure completion rate

### Add After Validation (v1.x)

Features to add once core quality and demand are confirmed through dogfooding.

- [ ] PDF download — trigger: users ask for formatted PDF; adds print-to-PDF or jsPDF; do after verifying .docx copy suffices
- [ ] Download as .docx — trigger: users want to edit before sending; simpler than PDF generation
- [ ] PDF upload (not just text paste) — trigger: users have PDF CVs they cannot easily copy-paste; currently text-paste only per PROJECT.md
- [ ] Input-length guard (both API routes) — cost + trust boundary; add before public traffic

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Finish-line paywall (€19–29/application) — only after quality + demand proven per BUILD_PLAN Phase 3
- [ ] LinkedIn import — only if text-paste proves too high-friction for a significant share
- [ ] ATS keyword scoring — only if user feedback identifies it as a felt pain post-launch
- [ ] Chancenkarte-specific onboarding flow — nice once the Chancenkarte cohort is confirmed as the primary user
- [ ] B2B API / bulk processing — Phase 4 per BUILD_PLAN; only after B2C is proven

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Text-paste CV input | HIGH | LOW | P1 |
| Lebenslauf structured output | HIGH | LOW (backend done) | P1 |
| Norm-gap explanations in English | HIGH | LOW (schema done, UI needed) | P1 |
| Bilingual display (German + English why) | HIGH | MEDIUM (layout decision) | P1 |
| Streamed Anschreiben | HIGH | LOW (backend done, UI needed) | P1 |
| 3–5 personalization questions UI | HIGH | LOW | P1 |
| Copy to clipboard | HIGH | LOW | P1 |
| Zero-retention privacy statement | HIGH | LOW (copy only) | P1 |
| Photo guidance text | MEDIUM | LOW | P1 |
| Native-speaker nudge | MEDIUM | LOW | P1 |
| Signature placeholder | MEDIUM | LOW | P1 |
| PostHog analytics events | MEDIUM | LOW | P1 |
| Employment-gap handling note | MEDIUM | LOW (prompt-level) | P1 |
| PDF download | HIGH | MEDIUM | P2 |
| .docx download | HIGH | MEDIUM | P2 |
| PDF upload | MEDIUM | MEDIUM | P2 |
| Input-length guard | LOW (user) / HIGH (ops) | LOW | P2 |
| Finish-line paywall | HIGH (business) | HIGH | P3 |
| ATS keyword scoring | LOW | MEDIUM | P3 |
| LinkedIn import | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for dogfood-launch (v1 milestone)
- P2: Add after confirming v1 quality + completion rate
- P3: Phase 3+ or requires explicit user demand

---

## Competitor Feature Analysis

| Feature | Appliit | OphyAI | Kickresume / Enhancv | ScanReady approach |
|---------|---------|--------|----------------------|--------------------|
| German Lebenslauf output | Yes, DIN 5008 | Yes, ATS-optimized | No (US-norm-first) | Yes, DIN 5008 + grounded-only |
| Anschreiben / cover letter | Yes, per-job | Via Bewerbungsschreiben builder | Generic cover letter | Yes, streamed, authentic-voice via 3–5 Qs |
| English explanation of German norms | Partial (English review UI, not per-field) | No | No | Yes — per-field "why this changed" is the moat |
| Personalization questions before generation | No | No | No (AI fills from profile) | Yes — 3–5 targeted questions |
| Zero-retention / no account | No (account required) | No (account required) | No (account required) | Yes — stateless, no account |
| Photo guidance | DIN placement in template | Photo on/off toggle | Not German-specific | Nuanced text guidance per AGG nuance |
| Privacy statement | Not prominent | Not prominent | Not prominent | Prominent banner; GDPR posture as feature |
| Fabrication guard | Not explicit | Not explicit | AI enriches freely | Structural (schema + prompt), stated to user |
| Native-speaker review nudge | Not present | Not present | Not present | Yes, at Anschreiben completion |
| Grounded generation (no hallucination) | Not stated | Not stated | No | Yes — core product guarantee |
| No-signup flow | No (account required for full output) | No | Enhancv offers guest access; still stores | Yes — no account, nothing stored |

---

## Sources

- Competitor products: Appliit (appliit.de), OphyAI (ophyai.com), Kickresume, Enhancv, Zety, FlowCV, Resume.io, Rezi, Resumly
- German application norm sources: OphyAI German CV Guide 2026, LiveInGermany.de, HalloGermany, Expatrio, cv-creator.co.uk, airesume.guru, GoAusbildung
- Feature expectation data: concept research in cv-germany-expat-concept.md (42% HR ignore no-cover-letter; 71% call it essential; 82% recruiter photo expectation)
- Privacy / GDPR user behavior: Pew Research (79% data concern), Resumly privacy post, necessity-tools-strategy.md §5
- Anti-feature rationale: necessity-tools-strategy.md (AI humanizers, YouTube DMCA, ethical line), PROJECT.md out-of-scope list, BUILD_PLAN.md §7 guardrails
- UX flow comparisons: Applyarc "Best AI Cover Letter Generators 2026" review, Wobo "7 Best AI Cover Letter Generators in 2026", OphyAI "Free ATS Resume Tools Germany 2026"

---
*Feature research for: CV/cover-letter conversion tool for expats applying in Germany (ScanReady)*
*Researched: 2026-06-22*
