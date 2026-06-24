# GTM-03: Paid Conversion-Test Spec

> **STATUS: BLOCKED**
>
> This spec is authored and ready. The paid test CANNOT run until BOTH preconditions below are satisfied:
>
> 1. **Phase-6 analytics funnel is live** — OPS-01 PostHog events (`start`, `parse_done`, `letter_done`, `copy`, `download`) must be instrumented and verified. Without these events, the success metric (cost per completed flow) cannot be measured.
> 2. **Organic-proof gate has cleared** — the Phase-6 funnel must show **N = 50 completed organic flows** before any paid spend is authorised (see [Organic-Proof Gate](#organic-proof-gate-d-15) below).
>
> Do not set up a campaign, enter payment details, or spend a single euro until both boxes are checked.

---

## Artifacts This Phase Produces

This is one of three distribution artifacts produced in Phase 5 — Distribution Operationalization:

| File | GTM Tag | Description |
|------|---------|-------------|
| `distribution/community-plan.md` | GTM-01 | Build-in-public / Reddit community plan + 3 post drafts |
| `distribution/seo-keyword-plan.md` | GTM-02 | SEO keyword clusters + 6-month publishing cadence |
| `distribution/paid-test-spec.md` | GTM-03 | **This file** — paid conversion-test spec |

---

## Purpose and Framing

This spec fully defines a paid search conversion test on Google Search. Its only purpose is to answer one question: **"Does any stranger who clicks this ad actually finish the flow?"**

It is a directional signal, not an optimisation campaign. At a €100 budget, no ROAS calculation, no bid optimisation, and no A/B creative testing is possible or warranted. Any question that assumes scale ("what's our cost per conversion at volume?") is the wrong question — that comes after the organic channel is validated and a real campaign budget is justified.

The test is authored now so that the moment both preconditions clear, there is zero decision-making overhead. The keyword, match type, budget, cap, metric, and gate are all locked. Execution requires only a Keyword Planner confirmation and an account setup.

---

## Channel (D-11)

**Channel:** Google Search only.

**Why Google Search:** High-intent pull traffic. Someone typing "german cv converter" into Google is actively looking for a tool that does exactly what ScanReady does. This is the highest-quality click the €100 budget can buy.

**TikTok is out of scope for this budget (D-12):** TikTok short-form is an organic experiment that folds into the build-in-public plan (GTM-01). It earns its own separate paid test only if organic short-form shows traction — with its own separate budget allocation, discussed at that time. The €100 cap specified in this document is Google Search only and does not include TikTok.

---

## Keyword (D-11)

### Primary Candidate

| Keyword | Match Type | Rationale |
|---------|------------|-----------|
| `german cv converter` | **Exact match** `[german cv converter]` | Highest tool-intent specificity. The searcher already knows they want a converter — they are not browsing, they are looking for a tool. Likely lowest CPC of the three candidates due to low commercial competition. |

### Alternate Candidates (use if primary fails volume check)

| Keyword | Match Type | Why It's a Fallback |
|---------|------------|---------------------|
| `cv to lebenslauf` | Exact or phrase | Names the exact transformation. Very specific. May have near-zero volume as an exact search string; use phrase match if so. |
| `lebenslauf erstellen englisch` | Phrase match | German-language searcher who needs English guidance — niche and high-intent but German-language ad copy required. |

**All volumes are [ASSUMED].** Real volumes must be confirmed before launch — see [Pre-Launch Validation](#pre-launch-validation) below.

### Keyword Planner Validation Step (Required Before Launch)

> Open: Google Ads → Tools → Keyword Planner → Discover New Keywords.
> Enter each candidate. If `german cv converter` shows fewer than 100 searches/month in the Germany + international targeting, it does not have enough volume to spend €100 in a 30-day window.
>
> **Fallback rule:** If the primary candidate has fewer than 100/month volume, switch to `cv to lebenslauf` (phrase match). If that also fails the 100/month threshold, use `german cv` (phrase match `"german cv"`) — broader, higher volume, lower intent specificity, but at least the €100 reaches people within the window.

---

## Success Metric (D-13)

**Primary metric:** Cost per completed flow.

A **completed flow** is defined as: user visits the tool → submits CV (`start` event) → receives and views their Lebenslauf (`parse_done` event) → submits job posting + personalization answers → views and copies or downloads their Anschreiben (`copy` or `download` event).

This metric is identical to the v1 success metric defined for the product itself: the flow is only valuable if someone completes it end to end.

**Secondary metric (diagnostic only):** Conversion rate = completed flows / clicks. Useful for isolating where drop-off occurs (if anyone clicks but no one completes), but not the primary success signal at this budget.

### Phase-6 Dependency (Hard Blocker)

This metric **cannot be measured** without the Phase-6 analytics funnel. The PostHog events that define the flow stages must be live and verified before the campaign runs:

| Event | Fires When | Phase-6 Plan |
|-------|-----------|--------------|
| `start` | User submits CV text to `/api/parse` | OPS-01 |
| `parse_done` | Lebenslauf result is displayed | OPS-01 |
| `letter_done` | Anschreiben streaming completes | OPS-01 |
| `copy` | User copies Anschreiben to clipboard | OPS-01 |
| `download` | User downloads Anschreiben (if download is implemented by Phase 6) | OPS-01 |

The Google Ads conversion bridge (sending a PostHog `copy` or `download` event to Google Ads as a conversion signal) is expected to use the Google Ads Conversion API or a `gtag.js` snippet. The exact integration pattern is a Phase-6 implementation decision. **[ASSUMED — standard pattern; validate in Phase 6.]**

**Cross-reference:** ROADMAP.md → Phase 6 (Analytics): OPS-01 (funnel events), TRUST-02 (zero-PII PostHog configuration).

---

## Budget (D-14)

**Hard cap: €100 total. No overrun under any circumstances.**

This is a one-time test allocation. If €100 is spent without sufficient signal (see What Counts as Sufficient Signal below), the answer is to revisit organic channels — not to add more paid budget. Paid is a test, not a channel.

### Click-Volume Honesty

Based on Germany-adjusted CPC benchmarks for the Career & Employment sector (US benchmark: $5.16/click, Germany approximately 31% lower → ~€3.30/click at the Career/Employment average; lower commercial intent for a free niche tool suggests the lower end):

| CPC Scenario | Estimated Clicks from €100 | Completed Flows at 5% CVR | Completed Flows at 10% CVR |
|-------------|---------------------------|---------------------------|----------------------------|
| €1.50/click (optimistic — low-competition niche) | ~67 clicks | ~3 | ~7 |
| €2.50/click (central estimate) | ~40 clicks | ~2 | ~4 |
| €3.50/click (pessimistic — broader competition) | ~29 clicks | ~1–2 | ~3 |

**All CPC and CVR figures are [ASSUMED].** Real CPC is confirmed in Keyword Planner. Real CVR is only visible once clicks arrive.

**What €100 actually buys:** A directional answer to "does anyone who clicks complete the flow?" It does NOT buy:
- Statistical significance (standard guidance is 200–300 clicks for directional data; this test will not reach that)
- Bid optimisation signal
- Creative A/B testing data
- ROAS or LTV insight

If anyone asks "what should our ROAS target be?" — that framing is wrong for this test.

### Daily Cap and Test Window

To consume €100 over a controlled window without burning it in a single day:

- **Daily cap:** €5–10/day
- **Test window:** 10–20 days
- **Total:** €100 maximum (daily cap × days ≤ €100)

Set the daily cap in the Google Ads campaign budget field before launch. Do not adjust it upward during the test.

### Exact Match Behaviour Note

Exact match `[german cv converter]` in Google Ads triggers only on that exact query or very close variants (e.g., plurals, spelling corrections). This is intentional: it maximises control and minimises wasted spend at a small budget. If volume is too low to spend €100 in 30 days, switch to phrase match `"german cv converter"` (broader, catches surrounding words) or move to a fallback keyword — see [Keyword Planner Validation](#keyword-planner-validation-step-required-before-launch).

---

## Organic-Proof Gate (D-15)

**Do not spend until the Phase-6 funnel shows N completed organic flows.**

### Default Threshold

**N = 50 completed organic flows.**

This means: 50 unique users who arrived via organic channels (Reddit, direct, SEO, word-of-mouth — not paid) completed the full flow (start → copy/download) as recorded by the Phase-6 PostHog funnel.

### Why N = 50

The research-suggested range is 20–50. The default is set at 50 because:

- 20 completions could arrive in a week from a single viral post and not represent general demand.
- 50 provides a more meaningful signal that the product works for strangers who were not referred by a specific post or context.
- At 50 completions, the landing-page-to-flow-completion rate is visible enough to make a reasonable estimate of what paid traffic will convert at.

**Kilian finalises N once the Phase-6 funnel is live and organic velocity is visible.** If organic completions arrive very slowly (fewer than 10/month), revisit the product and community plan before spending on paid. If they arrive quickly (50+ in the first month), the gate clears faster than expected.

### Why the Gate Exists (Pitfall 5)

Paid spend before organic proof tests the keyword and ad, not the product. If the flow does not convert for people who found it organically and wanted it, paid traffic will not fix that — it will burn €100 learning that the landing page or tool does not work for strangers. The organic gate ensures the product is working before money amplifies it.

---

## Pre-Launch Validation

Before any campaign is created or spend is authorised, complete the following steps:

| Step | Action | Who | Status |
|------|--------|-----|--------|
| 1 | Phase-6 analytics funnel (OPS-01) is live and verified | Phase-6 executor | Blocked (Phase 6 not started) |
| 2 | Organic-proof gate: PostHog shows N ≥ 50 completed organic flows | Kilian (via PostHog dashboard) | Blocked (Phase 6 not started) |
| 3 | Google Ads account exists or is created (no spend yet — just account access) | Kilian | Unknown — confirm account exists |
| 4 | Google Ads Keyword Planner: validate `german cv converter` monthly volume | Kilian (in Keyword Planner) | Required before launch |
| 5 | If primary keyword has <100/mo volume, select fallback keyword from the alternates table | Kilian | Contingent on Step 4 |
| 6 | Google Ads conversion action configured (PostHog event → Google Ads conversion bridge) | Phase-6 executor or Kilian | Blocked (Phase 6 dependency) |
| 7 | Set daily cap to €5–10/day before enabling campaign | Kilian | Do when creating campaign |
| 8 | Confirm ad copy is guardrail-clean (no income/outcome claims — see below) | Kilian | Review before launch |

---

## Ad Copy Direction

Write one text ad. The spec does not prescribe copy word for word — the founder writes it in their voice. Guardrails apply:

### Required

- Headline leads with the capability, not an outcome claim: what the tool does ("Convert your CV to a German Lebenslauf"), not what it earns the user ("Land your dream German job").
- Description mentions: native-quality, no data stored, free, AI-assisted.
- Zero-retention as a feature: "Your CV is never stored." or "Nothing is saved."
- CTA links to `/` (landing page) — the landing already explains the norm gap and the tool. Do not link directly to `/app` (the tool) without the landing context.

### Prohibited (CLAUDE.md guardrails)

| Prohibited | Example to Avoid | Why |
|------------|-----------------|-----|
| Income/earnings claims | "Get the job faster" / "Increase your salary" | FTC/ASA violation |
| Outcome/success claims | "Recruiters will choose you" / "Pass the ATS screen" | Misleading; unverifiable |
| Detection-evasion framing | "Bypass AI detection" / "Sounds human" | Misrepresents the product; ethical risk |
| Nationality-specific targeting | "For Americans in Germany" | Reduces audience; exclusionary |
| Fabrication implication | "We enhance your experience" / "We add skills" | Fraud liability; grounded-only is the moat |

**Authentic** in copy means: the output reflects the applicant's real voice and real background — not that it evades detection systems.

### Sample Headline Directions (Not Final Copy)

- "German CV from Your English Resume — Free, Instant, Nothing Stored"
- "Convert Your CV to a German Lebenslauf — AI, Grounded in Your Real Background"
- "Win the 8-Second German Recruiter Scan — Free Lebenslauf + Cover Letter"

These are directions only. Kilian writes the final copy. Have a native German speaker review the German output quality claim framing before launch.

---

## Phase-6 Dependency Summary

| Dependency | Phase | Requirement | Blocks |
|-----------|-------|-------------|--------|
| PostHog funnel events (OPS-01) | Phase 6 | `start`, `parse_done`, `letter_done`, `copy`, `download` instrumented | Success metric cannot be measured |
| PostHog zero-PII config (TRUST-02) | Phase 6 | `autocapture:false`, `ip:false`, `person_profiles:'identified_only'` | GDPR trust signal preserved |
| Google Ads conversion bridge | Phase 6 | PostHog `copy`/`download` → Google Ads Conversion API or gtag.js | Paid conversion measurement |
| Organic proof gate (D-15) | Phase 6 | 50 completed flows visible in PostHog | Gate cannot clear without the funnel |

**Cross-reference:** `.planning/ROADMAP.md` — Phase 6: Analytics + Zero-PII. OPS-01 and TRUST-02 are Phase 6 plans.

---

## What Success Looks Like

**Question this test answers:** Does anyone who clicks a Google Search ad for `german cv converter` complete the full ScanReady flow?

**Positive signal:** ≥2 completed flows from 30–70 clicks. This indicates the keyword-to-landing-page-to-tool funnel is working for strangers. It does not justify scaling paid; it justifies researching the next hypothesis (ad copy variations, other keywords, pricing).

**Negative signal:** 0 completed flows from 30–70 clicks. This points to a funnel problem (landing page, tool UX, or keyword mismatch) — not a budget problem. Do not spend more money to find out if the next 30 clicks convert better. Diagnose the funnel with organic users instead.

**The test ends** when either €100 is spent or 30 days have elapsed (whichever comes first). Do not extend the test or add budget mid-run.

---

## Assumptions and Confidence

| Claim | Confidence | Source | Risk if Wrong |
|-------|-----------|--------|---------------|
| Germany CPC ~€1.50–€3.50/click | LOW | US Career/Employment benchmarks (WordStream 2025) × 0.69 Germany discount | Real CPC could be outside this range; Keyword Planner validation is mandatory |
| `german cv converter` has enough volume to spend €100 in 30 days | LOW [ASSUMED] | Reasoning from keyword specificity; not verified | Volume may be near-zero; fallback keyword required |
| 5–10% landing-to-completed-flow CVR is achievable | LOW [ASSUMED] | SaaS freemium benchmarks (First Page Sage); tool type may differ | CVR could be much lower; organic data provides the real benchmark pre-launch |
| PostHog ↔ Google Ads conversion bridge works via gtag.js or Conversion API | LOW [ASSUMED] | Standard integration pattern; not validated | Phase-6 implementation must confirm; may require additional work |
| N = 50 organic completions is a meaningful gate | MEDIUM | Judgment; research suggested 20–50 range | N may be too low or too high; Kilian adjusts once funnel velocity is visible |

---

## Non-Negotiable Guardrails Checklist

Before any spend is authorised, confirm all items below:

- [ ] Phase-6 analytics funnel (OPS-01) is live
- [ ] Organic-proof gate: PostHog shows ≥50 completed organic flows
- [ ] Google Ads Keyword Planner confirms chosen keyword has ≥100/mo volume (or fallback keyword selected)
- [ ] Daily budget cap set to €5–10/day before campaign goes live
- [ ] Ad copy contains no income claims, no outcome/success claims, no detection-evasion framing
- [ ] Ad copy is nationality-neutral
- [ ] CTA links to landing page `/`, not directly to `/app`
- [ ] Conversion tracking action is configured and tested before enabling the campaign
- [ ] Test end condition confirmed: stop at €100 spent or 30 days elapsed, whichever comes first

---

*Authored: 2026-06-24*
*Authored by: Phase 5 planning executor, grounded in 05-CONTEXT.md (D-11 through D-15) and 05-RESEARCH.md (§GTM-03)*
*Status: BLOCKED — Phase 6 not started; organic-proof gate not yet clearable*
*Last reviewed: (awaiting founder review — checkpoint below)*
