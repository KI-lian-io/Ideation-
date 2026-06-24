# GTM-02: SEO Keyword Plan — ScanReady

**Phase:** 05 — Distribution Operationalization
**Requirement:** GTM-02
**Status:** Draft — keyword volumes are [ASSUMED] estimates; see Validation Step before publishing.
**Authored:** 2026-06-24

---

## Artifacts This Phase Produces

This plan is one of three Phase-5 distribution artifacts. All three live in `distribution/`:

| File | Requirement | Description |
|------|-------------|-------------|
| `distribution/community-plan.md` | GTM-01 | Reddit build-in-public plan + 3 post drafts |
| `distribution/seo-keyword-plan.md` | GTM-02 | Keyword clusters + cornerstone guide topics + 6-month publishing cadence *(this file)* |
| `distribution/paid-test-spec.md` | GTM-03 | Google Search conversion-test spec + €100 budget + Phase-6 gate |

Every SEO content page must end with a CTA linking to the live landing page (`/`) or the tool (`/app`). Orphan content does not convert.

---

## Vocabulary Decision (D-08)

**This decision is data-grounded — not assumed — at the head-term level.** Competitor SERP analysis found that established pages targeting English-speaking expats overwhelmingly use "German CV" as the primary H1/title term:

| Competitor page | Primary term | Secondary terms |
|----------------|--------------|-----------------|
| liveingermany.de | "German CV" | Lebenslauf, English CV, resume |
| novoresume.com | "German CV" | resume, Lebenslauf |
| ophyai.com | "German CV Guide 2026" | Lebenslauf, German resume |
| expatninja.de | "German Resume (Lebenslauf)" | CV |
| germanycareercoach.com | Targets all three explicitly | Resume, CV, Lebenslauf |

**Ruling:**

- **Primary English head term: "German CV"** — dominant across competitor H1s and likely search intent for UK/European/international searchers.
- **Secondary English term: "German resume"** — used by US-origin searchers; must appear naturally in body copy (3–5 times per page) to capture that cohort. Pitfall 3 from research: never assume "CV" is the only English head term.
- **"Lebenslauf"** — used as a secondary/explanatory term in English content (e.g., "the German CV is called a Lebenslauf"). Never use as the primary English-language title; it is a German term and will miss the English-speaking expat who does not yet know the word.

> **Volume confidence:** Exact search volumes for "German CV" vs "German resume" are [ASSUMED] based on competitor SERP patterns and prior concept-doc estimates. Verify before publishing (see §Keyword Validation Step).

---

## Keyword Clusters

All estimated monthly volumes are **[ASSUMED]** — carried from prior research (cv-germany-expat-concept.md, SERP inference). No paid keyword tool was used. The Validation Step below must be completed before publishing cornerstone content.

### Cluster A — Expat EN Long-Tail (Primary SEO Entry Point)

Target audience: English-speaking internationals searching in English for German job application help.

| Keyword | Est. Volume | Competition | Intent |
|---------|-------------|-------------|--------|
| german cv | 1K–10K/mo [ASSUMED] | Low–Medium | Informational + tool |
| how to write a german cv | 1K–5K/mo [ASSUMED] | Low | Informational |
| cv for germany | 1K–5K/mo [ASSUMED] | Low | Informational |
| german resume format | 500–2K/mo [ASSUMED] | Low | Informational |
| resume germany | 500–2K/mo [ASSUMED] | Low | Informational |
| english cv germany | 500–2K/mo [ASSUMED] | Low | Informational |
| lebenslauf in english | 500–2K/mo [ASSUMED] | Low | Informational |
| lebenslauf template english | 200–1K/mo [ASSUMED] | Low | Navigational/tool |
| german cover letter template | 500–2K/mo [ASSUMED] | Low | Navigational/tool |
| anschreiben in english | 200–1K/mo [ASSUMED] | Low | Informational |

**Cluster A logic:** These terms are low-competition long-tail with clear expat-specific intent. Multiple established competitors already rank here, confirming real search demand — but none lead with the expat-conversion angle (foreign CV → norm-correct German Lebenslauf). That gap is ScanReady's entry point.

### Cluster B — German KI/AI Terms (First-Mover Window)

Target audience: German-speaking job-seekers already comfortable using AI tools, searching in German.

| Keyword | Est. Volume | Competition | Intent |
|---------|-------------|-------------|--------|
| ki lebenslauf | <5K/mo [ASSUMED] | Low | Informational + tool |
| lebenslauf mit ki erstellen | <5K/mo [ASSUMED] | Low | Tool |
| ki anschreiben | <5K/mo [ASSUMED] | Low | Tool |
| lebenslauf ki tool | <2K/mo [ASSUMED] | Very Low | Tool |
| anschreiben ki erstellen | <2K/mo [ASSUMED] | Very Low | Tool |

**Cluster B logic:** KI (Künstliche Intelligenz = AI) Lebenslauf terms have confirmed real editorial presence — Indeed DE, Karrierebibel, Canva, Kickresume, and Livecareer DE all have dedicated pages as of mid-2026. The terms are actively searched and growing. No dominant single owner exists for the expat-specific angle ("use KI to convert a foreign CV for Germany") — that is the gap ScanReady can own first. Volume is small but competition is very low; a first-mover ranking is achievable on zero domain authority.

### Cluster C — German Transactional (Higher Competition — Later)

Target audience: German-speaking job-seekers seeking any CV/cover-letter creation tool.

| Keyword | Est. Volume | Competition | Intent |
|---------|-------------|-------------|--------|
| lebenslauf erstellen | ~27K/mo [ASSUMED] | Medium–High | Tool |
| anschreiben erstellen | ~10K/mo [ASSUMED] | Medium | Tool |
| lebenslauf generator | <20K/mo [ASSUMED] | Medium | Tool |

**Cluster C logic:** High volume but dominated by established German-language incumbents (karrierebibel.de, lebenslauf.de, Canva). These terms are not a realistic early target for a zero-DA domain. Pursue only after organic traction from Clusters A and B is confirmed and the domain starts accumulating authority.

### Head Terms to Avoid

| Term | Est. Volume | Reason to Avoid |
|------|-------------|-----------------|
| lebenslauf vorlage | ~201K/mo [ASSUMED] | Owned by Bundesagentur für Arbeit, karrierebibel (DR 78), lebenslauf.de — unwinnable at zero DA |
| resume builder | 300–450K/mo [ASSUMED, US] | US market, completely walled by Indeed, Zety, Canva — irrelevant audience, impossible competition |

---

## Cornerstone Guide Topics (D-09)

Two evergreen cornerstone guides published first. They index and age before the Sept–Oct application peak (see §6-Month Cadence). Long-tail posts link back to these cornerstones.

**No programmatic or templated pages.** Thin content pre-traffic is a ranking risk. Every page is written individually. (D-09)

### Cornerstone 1: German CV Guide for Expats

**Working title:** "German CV Guide for Expats: What German Recruiters Expect (That US/UK CVs Always Get Wrong)"

**Target keywords:** german cv, how to write a german cv, cv for germany, german resume format

**Structure outline:**
1. Why German recruiters reject international CVs in 8 seconds (the norm gap)
2. What a Lebenslauf is (and how it differs from a CV/resume)
3. DIN 5008 format norms: structure, length, photo, contact, sections
4. What German recruiters expect that US/UK CVs always miss (checklist)
5. German resume vs German CV: why the terminology matters (captures both cohorts)
6. Common mistakes and how to fix them

**CTA (required, at end of article):**
> "Ready to convert your CV into a norm-correct German Lebenslauf? ScanReady converts your CV into a Lebenslauf and writes your Anschreiben — grounded in your real experience, in native-quality German."
> [Convert my CV → ScanReady tool at /app]

**Guardrail check:**
- Does not claim to enhance or add experience — converts and formats only.
- No earnings/income claims.
- Nationality-neutral: "US/UK CVs" in the title is a descriptive example; the tool works for any non-German CV. Body copy uses "international" and "expat" broadly.
- "Authentic" framing: the tool produces personalized output, not detection-evasion output.
- Zero-retention stated: tool processes CV data in-session; nothing is stored.

---

### Cornerstone 2: German Cover Letter (Anschreiben) Guide

**Working title:** "How to Write a German Cover Letter (Anschreiben) That Doesn't Sound Like Every Other AI Letter"

**Target keywords:** german cover letter, german cover letter template, anschreiben in english, ki anschreiben, authentic german cover letter

**Structure outline:**
1. Why German cover letters (Anschreiben) are structurally different from UK/US letters
2. DIN 5008 Anschreiben structure: date, address block, subject line, opening, body, closing
3. What German hiring managers read in an Anschreiben (and what makes them stop)
4. Why AI-generated Anschreiben sound the same — and how personalization changes that
5. The 5 questions that make an Anschreiben feel genuine (the ScanReady personalization approach)
6. Checking your German: why native-speaker review matters even with AI output

**CTA (required, at end of article):**
> "ScanReady writes your Anschreiben in native-quality German — grounded in your own answers, not generic phrases. Your experience, your voice."
> [Write my Anschreiben → ScanReady tool at /app]

**"Authentic" / AI-letter framing — guardrail note:**
The title phrase "doesn't sound like every other AI letter" refers to **personalization quality** — output that reflects the applicant's own experience, motivations, and voice, drawn from their answers to the five personalization questions. It does NOT refer to AI-detection evasion, circumventing ATS scanners, or passing AI-detection tools. This distinction must be maintained in all body copy. Never write anything that implies ScanReady makes output "undetectable" or "passes AI checkers."

**Additional guardrails:**
- "Have a native speaker review your Anschreiben before submitting" nudge must appear in the article.
- No earnings or outcome claims.
- Nationality-neutral: any non-German-speaking applicant.
- Zero-retention stated.

---

## Keyword Validation Step (D-08 Mandate — Do Before Publishing)

> **All keyword volumes in this document are [ASSUMED] estimates.** They are carried from prior research (cv-germany-expat-concept.md, SERP inference from competitor pages). No paid keyword tool was used during research. Before publishing either cornerstone guide, the founder must verify the top terms.

**Action required (Google Ads Keyword Planner — free, no spend needed):**

1. Go to [Google Ads](https://ads.google.com) → Tools → Keyword Planner → "Discover new keywords."
2. Enter these ~10 terms one batch at a time:
   - `german cv`
   - `how to write a german cv`
   - `cv for germany`
   - `german resume format`
   - `german cover letter`
   - `ki lebenslauf`
   - `lebenslauf mit ki erstellen`
   - `ki anschreiben`
   - `german cv converter`
   - `lebenslauf in english`
3. Set location to Germany + United Kingdom + United States (to capture all three searcher cohorts). Language: German + English.
4. Record the actual average monthly search volume and competition level for each term.
5. If "German CV" shows significantly lower volume than "German resume," swap the primary/secondary terms in all content before publishing.
6. If KI-cluster terms show near-zero volume (<100/mo), deprioritize Cornerstone 2's KI angle and focus on the DIN 5008 / structural angle instead.
7. Note findings in this file or a separate `distribution/keyword-validation-log.md`.

**This step satisfies the D-08 data-driven mandate and addresses Open Question 2 from the research phase.**

---

## 6-Month Publishing Cadence (D-10)

**Goal:** Front-load the two cornerstone guides immediately so they accumulate indexing time and domain authority before the Sept–Oct application peak. Then publish ~2 long-tail posts/month to build topic cluster depth.

**Sept–Oct Application Peak — STRETCH GOAL, NOT A DEPENDENCY:**
> Germany has a confirmed secondary hiring peak in Sept–Oct (primary peak is Jan–Feb). The evidence is qualitative and multi-sourced but the exact timing carries **[ASSUMED]** status — no Google Trends data was obtained to verify the precise peak window. Do not make the entire cadence dependent on hitting this window. Cornerstones published now will have 60–90 days to index before the uptick — that is the indexing-window rationale for front-loading. If the Sept–Oct peak does not materialize, the content still earns long-term organic traffic.

### Month-by-Month Cadence

| Month | Content | Channel | Target Keywords | Notes |
|-------|---------|---------|-----------------|-------|
| **Month 1** (now, July 2026) | **Cornerstone 1:** "German CV Guide for Expats: What German Recruiters Expect (That US/UK CVs Always Get Wrong)" | SEO blog | german cv, how to write a german cv, cv for germany, german resume format | Publish first — highest search volume, broadest entry point. Complete keyword validation step before publishing. |
| **Month 1–2** (July–Aug 2026) | **Cornerstone 2:** "How to Write a German Cover Letter (Anschreiben) That Doesn't Sound Like Every Other AI Letter" | SEO blog | german cover letter, anschreiben in english, ki anschreiben | Publish immediately after Cornerstone 1. Both cornerstones must be live before Sept–Oct to maximize indexing window. |
| **Month 2–3** (Aug–Sept 2026) | **Long-tail 1:** "Chancenkarte CV: How to Apply for Jobs in Germany on an Opportunity Card" | SEO blog | chancenkarte cv, opportunity card germany jobs, chancenkarte lebenslauf | Topical authority for visa-specific angle; Chancenkarte is a 2024 program with growing search interest. Links back to Cornerstone 1. |
| **Month 3–4** (Sept–Oct 2026) | **Long-tail 2:** "What Is DIN 5008? The German Business Letter Format Explained for Internationals" | SEO blog | din 5008 english, din 5008 cover letter, german business letter format | Supports Cornerstone 2; DIN 5008 is a confirmed real search with results from Wikipedia, university guides, and career sites. Links back to Cornerstone 2. |
| **Month 4–5** (Oct–Nov 2026) | **Long-tail 3:** "KI Lebenslauf: Can AI Really Help You Apply for Jobs in Germany?" | SEO blog | ki lebenslauf, lebenslauf mit ki erstellen, ki lebenslauf tool | First-mover play for Cluster B. Targets German-language searchers. Framing: honest assessment of AI-assisted applications, not a puff piece. Links back to both cornerstones + tool CTA. |
| **Month 5–6** (Nov–Dec 2026) | **Long-tail 4:** "German CV Photo: Do You Really Need One? (The AGG Explained)" | SEO blog | german cv photo, lebenslauf foto, foto im lebenslauf | Nuanced photo guidance topic (see guardrail below). High shareability. Links back to Cornerstone 1. |

### Photo / AGG Topic — Guardrail Note (Month 5–6)

The German Equal Treatment Act (Allgemeines Gleichbehandlungsgesetz, AGG) means photos are **optional per law** but **widely expected in practice** by German employers. The article must reflect this nuance:

- State clearly that photos are not legally required under the AGG.
- State clearly that German recruiter convention still expects them in most industries.
- Never mandate a photo. Present the tradeoffs and let the applicant decide.
- ScanReady's `photoAdvice` output in the Lebenslauf schema already surfaces this nuance — the article reinforces it.

This is not a legal grey area to exploit for clicks; it is a real norm-gap that confuses internationals and is genuinely helpful to explain.

---

## Content Requirements (All Pages)

Every page in this SEO plan must meet all of the following before publishing:

**Linking:**
- [ ] Ends with a CTA linking to `/` (landing) or `/app` (tool) — specific anchor text that describes the action (e.g., "Convert my CV to a German Lebenslauf").
- [ ] Links back to at least one cornerstone guide (for long-tail posts).
- [ ] Internal links are natural — not forced keyword stuffing.

**Guardrails (non-negotiable):**
- [ ] No income or outcome claims. Do not write "get the job," "land interviews," "boost your chances" in a way that promises a result. State capability: "ScanReady converts your CV into a norm-correct Lebenslauf and writes your Anschreiben."
- [ ] "Authentic" / AI framing = personalization quality only. Never imply or state that ScanReady makes output "undetectable by AI checkers," "passes ATS scanners," or "avoids AI filters." Any such framing is product misrepresentation and must be rejected.
- [ ] Nationality-neutral. The tool works for any non-German-speaking international. "US/UK" examples are illustrative, not exclusive.
- [ ] Zero-retention stated at least once per page (a trust signal, not boilerplate). Example: "ScanReady processes your CV in-session — nothing is stored or used for training."
- [ ] Native-quality German nudge: at least one mention that the output should be reviewed by a native speaker before submission (especially in Cornerstone 2 and Long-tail 3).
- [ ] Grounded generation: never imply the tool adds, enhances, or creates experience that wasn't in the original CV. The tool converts and formats; it never fabricates.

---

## Linking Map

Every piece of content links to the live tool:

```
Cornerstone 1 (German CV Guide)  ──┐
                                   ├── → /app (ScanReady tool)
Cornerstone 2 (Anschreiben Guide) ─┘
       ↑                ↑
Long-tail 1          Long-tail 2
(Chancenkarte)       (DIN 5008)
       ↑                ↑
Long-tail 3          Long-tail 4
(KI Lebenslauf)      (CV Photo/AGG)
```

All long-tail posts link back to at least one cornerstone, and both cornerstones link directly to `/app`. No orphan content.

---

## Relationship to Other GTM Artifacts

| This plan | Coordinates with |
|-----------|-----------------|
| Keyword clusters (Cluster A) | `community-plan.md` — the "8-second scan" explainer post (D-05 Post 1) mirrors Cornerstone 1's positioning; reuse framing |
| Cornerstone 2's "authentic voice" differentiator | `paid-test-spec.md` — paid ad copy must use the same capability framing, not outcome claims |
| Cadence timing | Phase-6 analytics (`posthog-js` PostHog funnel events) must be live before GTM-03 paid test runs |

---

*Last updated: 2026-06-24*
*Research basis: 05-RESEARCH.md §GTM-02 (keyword clusters, vocabulary finding, KI terms, seasonality evidence, cornerstone topics)*
*Decisions implemented: D-07, D-08, D-09, D-10*
