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
