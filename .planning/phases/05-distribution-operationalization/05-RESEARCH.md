# Phase 5: Distribution Operationalization - Research

**Researched:** 2026-06-24
**Domain:** GTM distribution — community/Reddit strategy, SEO keyword research, Google Ads conversion test
**Confidence:** MEDIUM (subreddit member counts LOW; keyword volume inference MEDIUM; CPC benchmarks LOW-MEDIUM)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Community / Build-in-Public (GTM-01)**
- D-01: Reddit-led, deliberately low-profile. LinkedIn is optional/sparing.
- D-02: Self-promotion approach = story/value-led soft mention. Post genuine value, mention the tool once naturally, link in profile/first comment.
- D-03: Cadence = ~1 substantive post/week, anchored to real application milestones.
- D-04: Target communities = r/germany, r/expats, PLUS niche application/CV-writing subreddits to be identified by research.
- D-05: First 3 posts drafted as artifact: (1) 8-second scan/norm-gap explainer, (2) recruiter-expectations checklist, (3) before→after founder CV→Lebenslauf proof piece.
- D-06: Post format = visual-heavy. On strict text-first subreddits, lead with substantive text and embed the single key visual.

**SEO (GTM-02)**
- D-07: Balanced EN + DE keyword clusters from the start.
- D-08: MANDATORY data-driven — keyword list and head-term choices must be backed by real search-volume data.
- D-09: Hybrid content form: 2 cornerstone evergreen guides + long-tail posts hanging off them. No programmatic pages.
- D-10: Front-load 2–3 cornerstone guides now to index before Sept–Oct peak, then ~2 long-tail posts/month. 6-month horizon.

**Paid Conversion Test (GTM-03)**
- D-11: Google Search, one specific high-intent keyword, exact/phrase match only.
- D-12: TikTok = organic experiment only, NOT part of €100 paid budget.
- D-13: Success metric = cost per completed flow (start → copy/download). Requires Phase-6 analytics funnel.
- D-14: Hard budget cap = €100 total.
- D-15: Gate = organic proof first — do not spend until funnel shows threshold of real organic finished sessions.

### Claude's Discretion
- The exact subreddit shortlist and per-sub rule research (within D-04).
- The exact keyword list and head-term selection (data-driven per D-08).
- The exact N for the organic-proof gate threshold (D-15) — set when Phase-6 funnel exists.
- Where the three artifacts physically live in the repo.

### Deferred Ideas (OUT OF SCOPE)
- TikTok paid test (separate, later, only if organic traction appears).
- Parallel B2B pilot.
- Landing-copy tweaks from SEO findings (Phase 4 is done).
- Finish-line paywall / monetization (v2).
- Name finalization.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GTM-01 | A build-in-public / community plan exists — founder job-search story leads, Reddit (r/germany, r/expats) + LinkedIn cadence | Subreddit shortlist with rules, post format guidance, self-promo risk tiers |
| GTM-02 | An SEO keyword list + publishing cadence exists — expat-EN long-tail + emerging German "KI" terms, 6-month horizon | CV/resume vocabulary data, German KI-term evidence, Sept–Oct seasonality evidence, competitor landscape |
| GTM-03 | A paid conversion-test spec exists — specific keyword, success metric, budget cap — to run only after organic validation | CPC benchmarks, €100 click-volume estimate, conversion benchmark, exact/phrase match mechanics, Phase-6 dependency flag |
</phase_requirements>

---

## Summary

This phase produces three markdown artifacts (a community plan, an SEO keyword list + cadence, and a paid test spec) so distribution can start the moment the live tool is public. No app code changes are involved.

**GTM-01 community research** found that Reddit's sitewide 90/10 self-promotion norm is widely enforced, but no direct scraping of subreddit sidebars was possible (Reddit blocks fetches). Per-sub rules must be treated as [ASSUMED] from indirect evidence, with the planner confirming them via direct subreddit visit before drafting posts. Subreddit member counts are estimates from third-party trackers. The indirect evidence strongly suggests r/germany and r/expats tolerate value-first story posts; r/resumes and r/cscareerquestionsEU are community-culture focused (peer feedback) and likely hostile to any product mention. City subs (r/berlin, r/munich) and r/digitalnomad are lower-risk secondary channels.

**GTM-02 keyword research** found that the English-speaking expat cohort uses both "CV" and "resume" interchangeably when searching for German job application help, with "German CV" slightly dominating as the primary term across established competitors' titles and H1s. Real volume figures from paid tools are not accessible without an account; the cv-germany-expat-concept.md estimates (1K–30K/mo per term, LOW competition) remain the best available signal and are [ASSUMED]. German "KI Lebenslauf" / "KI Anschreiben" terms have real editorial presence (Indeed DE, Karrierebibel, Canva, Kickresume all have DE pages) confirming growing search demand, though exact volumes are unverified. Sept–Oct application peak is supported by qualitative evidence from multiple career sources.

**GTM-03 paid test research** found that US-dollar Career & Employment CPC benchmarks are $2–$5.16/click (WordStream 2025 data). Germany's CPC is approximately 31% lower than the US average, suggesting approximately €1.40–€3.60 per click for this niche — meaning €100 buys roughly 27–70 clicks. That is directional but not statistically significant for a per-completed-flow read unless landing-page conversion is very high (≥10%). The planner should set realistic expectations: €100 = signal-gathering, not optimisation data.

**Primary recommendation:** Write all three artifacts now; flag the Phase-6 analytics dependency explicitly in GTM-03; confirm each subreddit's rules via direct visit before any post goes out.

---

## Architectural Responsibility Map

This is a documentation/artifact phase — there is no app architecture. The "tiers" below map to content ownership:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Community post drafting | Founder (Kilian) | — | Authenticity requires founder voice |
| Subreddit rule verification | Founder (Kilian) | — | Must read sidebar in real account context |
| SEO artifact authoring | AI (research-grounded) | Founder review | Keyword data + competitor analysis |
| Paid test spec | AI (data-grounded) | Founder sets gate N | Mechanic/budget is formula; gate N needs funnel data |
| Analytics dependency (Phase-6) | Phase-6 scope | — | GTM-03 cannot run until OPS-01 is live |

---

## GTM-01: Community / Build-in-Public Research

### Subreddit Shortlist

> Member counts are best-effort estimates from third-party tracking tools (gummysearch.com, redpulse.io, thehiveindex.com). Reddit removed publicly visible subscriber counts in September 2025 and replaced them with rolling 28-day visitor/contribution metrics. All member figures are [ASSUMED] unless noted otherwise.

| Subreddit | Est. Members | Self-Promo Risk | Format | Rationale |
|-----------|-------------|-----------------|--------|-----------|
| r/germany | ~1.5M–2M [ASSUMED] | **MEDIUM** — story/value posts likely tolerated; blatant product links removed | Both text and image | Largest English-language Germany community; norm-gap content is native fit |
| r/expats | ~248K [LOW: gummysearch.com] | **MEDIUM** — community evidence shows tool-mention posts exist but are informal | Both | Direct audience: internationals navigating relocation; tool mentions observed [ASSUMED] |
| r/cscareerquestionsEU | ~171K [LOW: gummysearch.com] | **HIGH** — tech career community, very sensitive to product promotion | Text-first | Only relevant if post is pure career advice; German CV norm-gap explainer could work without any product mention |
| r/jobs | ~2.58M [LOW: redpulse.io] | **HIGH** — general career advice; members "skeptical of overt promotions"; product mentions backlash common | Text-first | Large but risky; value only if purely educational |
| r/resumes | ~500K [LOW: theinterviewguys.com] | **HIGH** — peer critique culture; before/after format fits but product links likely removed | Image OK for before/after | The before→after proof post (D-05) could fit as a CV critique request; no product link in body |
| r/digitalnomad | ~1M [ASSUMED] | **LOW-MEDIUM** — tool-sharing culture, remote-work audience | Both | Germany-focused subtopic; Chancenkarte angle has traction |
| r/berlin / r/munich | <100K each [ASSUMED] | **LOW-MEDIUM** | Both | City-specific, smaller; locals + expats; lower mod scrutiny |
| r/GermanyExpats | ~379 [LOW: gummysearch.com] | **LOW** — tiny, niche | Text | Very small; minimal reach but zero risk |

**Subs NOT to use:** r/cscareerquestions (US-focused, ~800K–2.4M, strict moderation, no European relevance).

### Reddit Self-Promotion Rules — Site-Wide Norms

**Sources:** [redship.io/blog/reddit-self-promotion-rules](https://redship.io/blog/reddit-self-promotion-rules), [replyagent.ai/blog/reddit-self-promotion-rules-naturally-mention-product](https://www.replyagent.ai/blog/reddit-self-promotion-rules-naturally-mention-product), [vadimkravcenko.com/qa/self-promotion-on-reddit-the-right-way](https://vadimkravcenko.com/qa/self-promotion-on-reddit-the-right-way/) [ASSUMED — all are secondary guides, not Reddit official docs]

The canonical Reddit principle: *"It's fine to be a Redditor with a website; it's not fine to be a website with a Reddit account."* [ASSUMED: widely cited across multiple sources as Reddit's official framing]

**Sitewide 90/10 rule:** 90% of account activity should be genuine participation (comments, non-promotional posts, upvotes); no more than 10% self-promotional. Some subreddits enforce stricter ratios (99/1 enforced via automod). [ASSUMED — from multiple secondary sources, not directly verified on Reddit official policy page]

**Consequences for violation:** Post/comment removal → subreddit ban → sitewide shadow ban (posts invisible to all without notification — hardest to recover from). [ASSUMED — consistent across all sources]

**Safe patterns observed across sources:**
1. Build 2–4 weeks of genuine participation before any promotional mention
2. Answer a question genuinely, then mention the tool if directly relevant ("I actually built something for this…")
3. Disclose founder affiliation immediately ("disclaimer: I built this")
4. Post the tool in profile/pinned comment rather than post body
5. Never argue with moderator removals

**Per-sub rules MUST be verified via direct sidebar visit before any post.** [ASSUMED — no subreddit-specific rules could be directly fetched]

### Post Format by Sub Type

| Sub type | Image posts | Text-only posts | Planner action |
|----------|-------------|-----------------|----------------|
| r/germany, r/expats, r/digitalnomad | Generally allowed | Yes | Use visual for before/after (D-05); text-first for explainer (D-05 post 1) |
| r/cscareerquestionsEU, r/jobs, r/resumes | Text-first preferred; before/after image may be acceptable in r/resumes | Yes | Default to substantive text; embed one key screenshot |
| r/berlin / r/munich | Both | Yes | No restriction observed |

### Three Draft Post Directions (D-05 input)

These are content directions — exact drafts are the artifact output, not research output:

1. **Post 1 — "8-second scan" norm-gap explainer:** "Why German recruiters reject US/UK CVs in 8 seconds (and what they actually look for)" — pure value, educational, no product mention. Link tool in profile bio only.
2. **Post 2 — Recruiter expectations checklist:** "14 things German recruiters expect that international CVs always get wrong" — listicle format, high shareability, no product link in body.
3. **Post 3 — Before/after founder proof piece:** Founder's own CV → Lebenslauf transformation (anonymized details, real changes visible). On r/resumes: frame as requesting critique. On r/germany/r/expats: frame as sharing the experience. Soft mention: "I built a tool that helped me do this — happy to share if useful."

---

## GTM-02: SEO Research

### D-08 — Vocabulary Question: "CV" vs "Resume" for English Speakers

**The core finding:** English-speaking expats searching for German job application help use **both "CV" and "resume" as interchangeable terms**, but established competitors overwhelmingly lead with **"German CV"** as the primary head term. [LOW — inferred from SERP analysis and competitor page H1 inspection; no paid keyword tool access]

**Evidence from competitor pages (all [LOW: WebFetch]):

| Page | Primary H1/Title term | Secondary terms used |
|------|----------------------|----------------------|
| liveingermany.de ("German CV Tips + Template") | "German CV" | "Lebenslauf," "English CV," "resume" |
| novoresume.com ("How to Write a German CV") | "German CV" | "resume," "Lebenslauf" |
| ophyai.com ("German CV Guide 2026") | "German CV" | "Lebenslauf," "German resume" |
| expatninja.de ("The Complete German Resume (Lebenslauf) Guide") | "German Resume (Lebenslauf)" | "CV" |
| germanycareercoach.com | Targets all three explicitly | "Resume, CV, and German Resume (Lebenslauf)" |

**Interpretation:** "German CV" is the dominant English-language search term for this topic. "German resume" is an alternative used by US-origin searchers. UK/international searchers say "CV." Targeting both in content (using "German CV" in the head term + "resume" as a secondary) captures both cohorts. [ASSUMED — logical inference from competitor patterns; not verified with actual volume data]

**cv-germany-expat-concept.md prior estimates** (described as "third-party tools," likely Semrush, flagged as [ASSUMED] in the original doc):
- "german cv," "cv for germany," "english cv germany," "resume for germany," "how to write a german cv": ~1K–30K/mo each, LOW competition
- "lebenslauf vorlage" (~201K/mo in Germany): HIGH competition, avoid

These volume estimates carry over from the prior research as the best available signal. They remain [ASSUMED] — not independently verified in this session.

**Terminology recommendation:** Use "German CV" as the primary head term in all SEO content. Include "German resume" as a secondary term. Avoid "Lebenslauf" as the primary English-language title (it's the German term; use it as a secondary/explanatory term). [ASSUMED — based on competitor analysis]

### German "KI" Terms

**Finding:** The "KI Lebenslauf" / "KI Anschreiben" / "Lebenslauf mit KI" space has real editorial presence — Indeed DE, Karrierebibel, Canva, Kickresume, Livecareer DE all have dedicated pages. This confirms the terms are real, actively searched, and growing. [LOW — from WebSearch SERP evidence and page inspection; no volume data]

**Key evidence:**
- Indeed DE published "Wie Sie Ihren Lebenslauf mit KI erstellen" (H1 uses "KI" as the primary term) [LOW: WebFetch]
- Karrierebibel 2026 Bewerbungstrends article discusses KI-assisted applications as a mainstream topic [LOW: WebFetch]
- Canva has an active "KI-Lebenslauf-Generator" landing page [LOW: WebSearch SERP]
- ATS/KI optimisation is identified as a primary Bewerbungstrend for 2026 [LOW: WebFetch]
- No dominant single-owner exists yet for the expat-specific angle ("How to use KI to convert a foreign CV for Germany") — this is the gap ScanReady occupies [ASSUMED — inferred from SERP gaps]

**Volume estimate:** No verified figures. The original concept doc estimated <20K/mo, growing, LOW competition for these terms. [ASSUMED — carry-forward from prior research]

### Keyword Clusters (Planner-Actionable)

Organised by intent and language. All volumes are [ASSUMED] unless noted.

**Cluster A — Expat EN Long-Tail (Primary SEO entry point)**
| Keyword | Est. Volume | Competition | Intent |
|---------|------------|-------------|--------|
| german cv | 1K–10K/mo [ASSUMED] | Low-Medium | Informational + tool |
| how to write a german cv | 1K–5K/mo [ASSUMED] | Low | Informational |
| cv for germany | 1K–5K/mo [ASSUMED] | Low | Informational |
| german resume format | 500–2K/mo [ASSUMED] | Low | Informational |
| resume germany | 500–2K/mo [ASSUMED] | Low | Informational |
| english cv germany | 500–2K/mo [ASSUMED] | Low | Informational |
| lebenslauf in english | 500–2K/mo [ASSUMED] | Low | Informational |
| lebenslauf template english | 200–1K/mo [ASSUMED] | Low | Navigational/tool |
| german cover letter template | 500–2K/mo [ASSUMED] | Low | Navigational/tool |
| anschreiben in english | 200–1K/mo [ASSUMED] | Low | Informational |

**Cluster B — German KI/AI Terms (First-mover window)**
| Keyword | Est. Volume | Competition | Intent |
|---------|------------|-------------|--------|
| ki lebenslauf | <5K/mo [ASSUMED] | Low | Informational + tool |
| lebenslauf mit ki erstellen | <5K/mo [ASSUMED] | Low | Tool |
| ki anschreiben | <5K/mo [ASSUMED] | Low | Tool |
| lebenslauf ki tool | <2K/mo [ASSUMED] | Very Low | Tool |
| anschreiben ki erstellen | <2K/mo [ASSUMED] | Very Low | Tool |

**Cluster C — German Transactional (Higher competition — later)**
| Keyword | Est. Volume | Competition | Intent |
|---------|------------|-------------|--------|
| lebenslauf erstellen | ~27K/mo [ASSUMED: from concept doc, Semrush cited] | Medium-High | Tool |
| anschreiben erstellen | ~10K/mo [ASSUMED] | Medium | Tool |
| lebenslauf generator | <20K/mo [ASSUMED] | Medium | Tool |

**Head terms to avoid (D-10 logic):**
- lebenslauf vorlage (~201K/mo — owned by Bundesagentur für Arbeit, karrierebibel DR78, lebenslauf.de) [ASSUMED: from concept doc]
- resume builder (300–450K/mo US — irrelevant and walled) [ASSUMED: from concept doc]

### Cornerstone Guide Topics (D-09)

Two cornerstone evergreen guides that earn organic traffic AND link to the live tool:

**Cornerstone 1:** "German CV Guide for Expats: What German Recruiters Expect (That US/UK CVs Always Get Wrong)"
- Targets: "german cv," "how to write a german cv," "cv for germany," "german resume format"
- CTA: Link to ScanReady tool at conclusion
- Norm-gap + DIN 5008 + 8-second scan thesis all live here
- Justification: Multiple competitors rank here; none lead with the expat-conversion angle

**Cornerstone 2:** "How to Write a German Cover Letter (Anschreiben) That Doesn't Sound Like Every Other AI Letter"
- Targets: "german cover letter," "anschreiben english," "ki anschreiben," "authentic german cover letter"
- CTA: Link to ScanReady tool's cover letter flow
- Bridges the authentic-voice differentiator to search intent
- Justification: DIN 5008 Anschreiben structure is a confirmed real search ("DIN 5008 Cover Letter" returns Wikipedia, university guides, and career sites — real search demand) [LOW: WebSearch SERP evidence]

### Sept–Oct Seasonality Evidence

**Finding:** September–October is a confirmed secondary hiring peak in Germany (primary peak is January–February). The evidence is qualitative but multi-sourced:
- immigration-consultant.de: "September to November: companies ramp up hiring to fill positions before year-end" [LOW: WebFetch]
- immigrantspirit.com: "By September 1st the hiring season begins again because managers want a full team before the year ends" [LOW: WebSearch]
- blog.theinterviewguys.com seasonal report: September–October identified as secondary peak globally, consistent with Germany [LOW: WebFetch]
- Multiple career coaching sources for Germany agree [LOW: multiple WebSearch hits]

**No Google Trends data was obtained** — Google Trends rate-limited the direct fetch. The seasonality assertion is plausible and consistently supported across qualitative sources but carries [ASSUMED] status for exact timing.

**Implication for cadence:** Front-loading the two cornerstone guides in July–August (3+ months before Sept–Oct) is justified. Guides published in July will have ~60–90 days to index before the hiring uptick. [ASSUMED — standard SEO indexing window; no source for exact German-market indexing speed]

### 6-Month Publishing Cadence (D-10 summary for planner)

| Month | Content | Channel | Target keywords |
|-------|---------|---------|-----------------|
| Month 1 (now) | Cornerstone 1: German CV Guide for Expats | SEO blog | german cv, how to write a german cv |
| Month 1–2 | Cornerstone 2: German Cover Letter (Anschreiben) | SEO blog | german cover letter, ki anschreiben |
| Month 2–3 | Long-tail: "Chancenkarte CV: How to Apply for Jobs in Germany on an Opportunity Card" | SEO blog | chancenkarte cv, opportunity card germany jobs |
| Month 3–4 | Long-tail: "What Is DIN 5008? The German Letter Format Explained for Internationals" | SEO blog | din 5008 english, german business letter format |
| Month 4–5 | Long-tail: "KI Lebenslauf: Can AI Really Help You Apply for Jobs in Germany?" | SEO blog | ki lebenslauf, lebenslauf mit ki |
| Month 5–6 | Long-tail: "German CV Photo: Do You Really Need One? (The AGG Explained)" | SEO blog | german cv photo, lebenslauf foto |

**Sept–Oct peak target:** Cornerstones and first 2 long-tail pieces indexed before the peak.

---

## GTM-03: Paid Conversion Test Research

### Google Ads CPC Benchmarks

**US Career & Employment CPC (WordStream 2025, based on 16,446 campaigns Apr 2024–Mar 2025):**
- Average CPC: **$5.16** [LOW: WebFetch from wordstream.com — US-market, not Germany-specific]
- Average CTR: 6.57%
- Average Conversion Rate: 4.33%
- Average CPL: $62.80

**Education sector CPC (get-ryze.ai 2026 data):**
- Average Search CPC: **$2.40** [LOW: WebFetch]
- Conversion Rate: 2.8%–3.39%

**Germany CPC adjustment:**
Germany's average CPC is approximately **31% lower than the US average** [LOW: WordStream CPC-by-country study, WebFetch]. Applied to Career/Employment:
- Adjusted Germany estimate: **~$3.60/click (~€3.30/click)** at the Career/Employment benchmark
- Adjusted Germany estimate: **~$1.65/click (~€1.50/click)** at the Education benchmark

**Note:** These figures are US-centric benchmarks adjusted by a country discount factor. For a niche free-tool keyword like "german cv expat" (lower commercial intent than "jobs near me"), CPC should be at the lower end or below these averages. [ASSUMED — lower commercial intent = lower CPC]

### €100 Budget: Estimated Click Volume

| CPC Scenario | Est. Clicks from €100 | Completed flows (at 5% CVR) | Completed flows (at 10% CVR) |
|-------------|----------------------|----------------------------|------------------------------|
| €1.50/click (optimistic) | ~67 clicks | ~3 | ~7 |
| €2.50/click (central) | ~40 clicks | ~2 | ~4 |
| €3.50/click (pessimistic) | ~29 clicks | ~1–2 | ~3 |

**Interpretation:** €100 will buy 30–70 clicks depending on keyword and competition. At typical SaaS tool flow-completion rates (5–15% of visitors who land on a free tool complete the full flow [ASSUMED — from SaaS freemium data; a free tool with fast time-to-value can reach 13–16% visitor-to-activation per First Page Sage data; WebFetch]), the test will generate 2–10 completed flows at most. [ASSUMED]

This is **directional signal, not statistical significance.** The spec must be honest about this: €100 answers "did anyone who clicked complete the flow?" not "what is my cost per conversion at scale?" That's by design (D-14 is explicitly a *test*, not a channel).

### Candidate High-Intent Keywords for GTM-03

These are recommended single-keyword candidates for the exact/phrase match test. All volumes are [ASSUMED]:

| Keyword | Intent | Est. CPC | Rationale |
|---------|--------|----------|-----------|
| `german cv converter` | High — tool-seeker | €1–3 [ASSUMED] | Tool intent; small volume; likely minimal competition |
| `cv to lebenslauf` | High — exact task | €1–2 [ASSUMED] | Directly names the transformation; very specific |
| `lebenslauf erstellen englisch` | High — task + language | €1–3 [ASSUMED] | German-language searcher who needs English guidance; niche |

**Recommendation for GTM-03:** Start with `german cv converter` (exact match) — highest specificity for the exact tool action, likely lowest CPC competition, and cleanest signal that the clicker understands the offering. [ASSUMED]

### Conversion Tracking Architecture (Phase-6 dependency)

The GTM-03 spec requires PostHog funnel events to measure "cost per completed flow." Per Phase 6 (TRUST-02, OPS-01):
- `start` event fires when user submits CV to /api/parse
- `parse_done` fires when Lebenslauf is displayed
- `letter_done` fires when Anschreiben streaming completes
- `copy` or `download` fires on clipboard copy / download

PostHog is free for up to 1M events/month [LOW: posthog.com pricing, WebSearch]. Conversion tracking integration with Google Ads requires a URL-based conversion (e.g., thank-you page) or a Google Ads → PostHog event bridge. The simplest v1 approach: fire a PostHog event on the `copy` action and send it as a Google Ads conversion via the Google Ads conversion API or a gtag.js snippet. [ASSUMED — standard Google Ads + PostHog integration pattern; not verified in this session]

**Hard dependency:** GTM-03 CANNOT RUN until Phase 6 analytics funnel is live (OPS-01). The spec can be authored in Phase 5 but must carry a "BLOCKED until Phase 6" status.

### Campaign Mechanics (Google Ads)

- **No mandatory minimum spend:** Google Ads has no required minimum daily budget. A €5–10/day daily cap for a 10–20 day test hits the €100 cap cleanly [LOW: multiple WebFetch sources].
- **Exact match behavior:** Exact match `[german cv converter]` only triggers on that exact query (or very close variants). This maximises control and minimises wasted spend at small budgets. [LOW: semrush.com/blog/keyword-match-types WebSearch]
- **Under 100 clicks = directional only:** Standard advice is 200–300 clicks for directional data, 500+ for optimisation [LOW: newframedigital.com WebFetch]. At €100, the test will not reach 100 clicks at most realistic CPCs. Frame as "does any stranger finish the flow?" not "what's our optimised CPA?"
- **Conversion rate benchmark for a free tool:** SaaS tools with sub-5-minute time-to-value can achieve 13–16% visitor-to-activation. More conservatively, 5–10% landing-page-to-completed-flow is a reasonable benchmark for a free tool. [LOW: firstpagesage.com WebFetch]

---

## Standard Stack

**Not applicable:** This is a documentation/artifact phase. No packages are installed. No library research needed.

## Package Legitimacy Audit

**Not applicable:** No new packages are installed in this phase.

---

## Architecture Patterns

### Recommended Artifact Structure

```
distribution/
├── community-plan.md       # GTM-01: Reddit build-in-public plan + 3 post drafts
├── seo-keyword-plan.md     # GTM-02: Keyword clusters + 6-month cadence
└── paid-test-spec.md       # GTM-03: Keyword, budget, metric, gate, Phase-6 dependency
```

All three files are the deliverable. No code changes.

### Anti-Patterns to Avoid

- **Posting on all subreddits simultaneously at launch:** Simultaneous tool launches across multiple subs are a common ban trigger (coordinated spam signal). Stagger posts by ≥1 week per community.
- **Linking the tool in the post body on the first post:** Even story posts with a link get removed in many subs. Link goes in profile bio or first comment only.
- **Publishing SEO content without internal links to the tool:** Every content page must end with a CTA linking to `/` (landing) or `/app` (tool). Orphan content does not convert.
- **Running GTM-03 before Phase-6 analytics:** The "cost per completed flow" metric literally cannot be measured without OPS-01 and TRUST-02 live.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyword research | Custom scraper | Google Search Console (free, post-traffic) or Semrush/Ahrefs trial | This phase is about drafting the plan — keyword estimates are good enough; actual data comes post-launch |
| Subreddit rule lookup | Automated scraper | Manual sidebar visit per sub before each post | Reddit blocks bots; rules change; human check is required anyway |
| Analytics funnel | Custom event tracking | PostHog (already decided) | Free up to 1M events; already in Phase-6 plan |
| Google Ads campaign setup | Custom ad network | Google Ads UI | Standard tooling; no abstraction needed at this budget |

---

## Common Pitfalls

### Pitfall 1: Treating €100 as a campaign budget rather than a test
**What goes wrong:** Team optimises headlines, bids, and creatives expecting ROI from €100. Nothing can be optimised at 30–70 clicks.
**Why it happens:** Conflating "paid test" with "paid campaign."
**How to avoid:** Frame the spec explicitly: "€100 = a single question: does anyone who clicks finish the flow?" Accept that no conversion optimisation is possible at this scale.
**Warning signs:** If anyone asks "what should our ROAS be?" — wrong frame.

### Pitfall 2: Posting the same story/value post across multiple subs without adaptation
**What goes wrong:** Subreddit moderators see cross-posted content and remove it as spam.
**Why it happens:** Efficiency mindset; same content seems fine.
**How to avoid:** Each post must be rewritten for the sub's tone and framing. The "8-second scan" explainer for r/germany reads differently than the same concept for r/cscareerquestionsEU.

### Pitfall 3: Assuming "CV" is the only English head term (ignoring "resume")
**What goes wrong:** SEO content misses US-origin searchers who say "German resume" not "German CV."
**Why it happens:** UK/European vocabulary bias.
**How to avoid:** Target both in content. Primary H1: "German CV Guide for Expats." Body includes "resume" naturally 3–5 times. Both cohorts find the page.

### Pitfall 4: Skipping direct subreddit rule verification before posting
**What goes wrong:** Post removed by automoderator within minutes. Account flagged. Future posts shadow-banned.
**Why it happens:** Relying on research-summarised rules rather than checking the actual sidebar.
**How to avoid:** Before drafting any post, open the sub on the founder's actual account and read the pinned rules. Do this for each sub separately — rules differ and change.

### Pitfall 5: Launching GTM-03 before organic proof threshold
**What goes wrong:** Paid spend burns before the product has been validated with real organic users. €100 is wasted learning that the landing page converts poorly, not that the keyword is wrong.
**Why it happens:** Impatience; wanting "data."
**How to avoid:** Gate is locked in D-15. Phase-6 funnel must show N completed organic flows before paid turns on. N is a discretion item for the planner (suggested range: 20–50 completed flows from organic channels).

---

## Runtime State Inventory

**Not applicable:** This is a greenfield documentation phase. No existing runtime state (databases, stored data, service configs, OS registrations, or build artifacts) is affected. Phase produces new markdown files only.

---

## Environment Availability

**Not applicable:** This phase produces markdown artifacts. No external dependencies (databases, CLIs, API keys, or services) are required for the planning or writing work.

One forward dependency to flag:
| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| PostHog analytics funnel (Phase 6) | GTM-03 execution | ✗ (Phase 6) | GTM-03 spec can be written now; execution is blocked until Phase 6 ships OPS-01 |
| Google Ads account | GTM-03 execution | Unknown | Planner should confirm Kilian has or can create a Google Ads account; no spend needed until gate clears |

---

## Security Domain

`security_enforcement: true` is set. Applicability to a documentation phase:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in distribution artifacts |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Public content |
| V5 Input Validation | No | No user input in this phase |
| V6 Cryptography | No | No secrets handled |

### Distribution-Specific Guardrails (from CLAUDE.md)

These are not ASVS-category concerns but are non-negotiable constraints on all distribution copy:

| Guardrail | Constraint | Risk if Violated |
|-----------|-----------|-----------------|
| No income/outcome claims | "Sell the capability, never income" | FTC/ASA violation; misleading advertising |
| "Authentic" = personalization quality | Never frame as AI-detection evasion | Product misrepresentation; ethical risk |
| Nationality-neutral messaging | Do not target a single nationality | Community perception; reduces addressable audience |
| GDPR zero-retention as a feature | State it prominently in all posts/content | Trust signal; regulatory credibility |
| Grounded generation | Never imply the tool can "enhance" or "add" experience | Fraud liability (CV embellishment = misrepresentation) |
| Native-quality German + review nudge | Include in all content that describes the output | Sets accurate quality expectations |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Build-in-public = loud LinkedIn daily logs | Story-led Reddit posts anchored to real milestones | 2023–2025 shift as LinkedIn became performative | Authenticity signal matters more than volume |
| SEO = target highest-volume head terms | Target low-competition long-tail + emerging AI terms first | Ongoing | Realistic for zero-DA domain |
| Paid ads = growth channel from day 1 | Paid as a conversion test, last | Standard lean startup methodology | Preserves budget for learning, not scaling |
| Reddit marketing = post and hope | 90/10 community-first, story-led | Platform enforcement tightened ~2022–2024 | Soft approach is now the only reliably working approach |

**Deprecated/outdated:**
- LinkedIn daily build logs: still work for some founders but algorithmic reach has declined; not the primary engine for this project.
- Reddit direct product promotion: shadow-banned near-universally; value-first is the only path.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | r/germany member count ~1.5M–2M | Subreddit Shortlist | Reach estimate is off; does not affect strategy |
| A2 | r/germany and r/expats tolerate value-first story posts | Subreddit Shortlist | Posts get removed; planner must verify sidebar rules |
| A3 | Per-sub rules inferred from general Reddit guides, not direct sidebar reads | All GTM-01 sections | Critical: actual rules may differ; MUST verify before posting |
| A4 | "German CV" is the dominant English head term | D-08 Vocabulary | Wrong term emphasis in SEO content; addressable post-launch with Search Console |
| A5 | cv-germany-expat-concept.md volume estimates (1K–30K/mo per long-tail term) | Keyword Clusters | Volume may be much lower; organic channel takes longer |
| A6 | German KI Lebenslauf terms are growing but low-volume | German KI Terms | First-mover window may already be closing, or terms may be too small to matter |
| A7 | Sept–Oct hiring peak is qualitatively supported but lacks Google Trends verification | Seasonality | Content may not benefit from the anticipated peak; Jan–Feb peak may be more important |
| A8 | Germany CPC ~31% below US average → ~€1.50–€3.50/click | CPC Estimates | CPC for this specific niche could be significantly different; only Google Ads Keyword Planner can verify |
| A9 | €100 buys 30–70 clicks | €100 Budget Estimate | Depends entirely on actual CPC; could be fewer than 20 if competition is higher |
| A10 | Free tool landing-to-flow completion: 5–15% is a plausible benchmark | Conversion Benchmark | Tool may have much higher or lower completion; benchmarks from different tool types |
| A11 | `german cv converter` is a good GTM-03 keyword candidate | Candidate Keywords | Volume may be near-zero; planner should verify in Google Ads Keyword Planner before campaign setup |
| A12 | Organic proof gate N = 20–50 completed flows suggested | GTM-03 Gate | N should be set by Kilian based on confidence level; 20 may be too low for a meaningful signal |
| A13 | PostHog ↔ Google Ads conversion bridge works via gtag.js or Conversions API | Conversion Tracking | Requires Phase-6 implementation validation; not tested in this session |

---

## Open Questions

1. **Per-subreddit rules (critical)**
   - What we know: General Reddit 90/10 norm; r/expats has tool-mention posts that appear tolerated; r/germany has large active moderation
   - What's unclear: Exact rules for each target sub, karma gates, account-age requirements, image post rules
   - Recommendation: Kilian reads each sub's sidebar before the planner drafts posts; add a checklist task to the community-plan artifact

2. **Actual keyword volumes**
   - What we know: Competitor page evidence and prior concept-doc estimates suggest "german cv"-cluster terms are 1K–30K/mo, low competition
   - What's unclear: Exact monthly volumes, especially for the KI/AI terms which had no prior estimates
   - Recommendation: Run a free Google Ads Keyword Planner check on the ~10 key terms before finalising the keyword list artifact; flag this as a Wave 0 task in the plan

3. **Google Ads keyword viability for GTM-03**
   - What we know: "german cv converter" is a plausible high-intent candidate; CPC likely in the €1.50–€3.50 range
   - What's unclear: Whether this keyword has enough monthly volume to spend €100 in a reasonable test window (30 days)
   - Recommendation: Verify in Google Ads Keyword Planner before committing; if volume is <100/mo, pick a broader phrase-match term

4. **Organic proof gate threshold (D-15)**
   - What we know: Gate exists; N is a discretion item; Phase-6 funnel must be live
   - What's unclear: What N means practically — 20 organic completions may arrive in week 1 or take 3 months
   - Recommendation: Set N = 50 as the initial spec default, with a note that Kilian adjusts once the funnel is live and the organic velocity is visible

---

## Sources

### Primary (MEDIUM confidence — official/authoritative but fetched indirectly)
- WordStream 2025 Google Ads Benchmarks (16,446 campaigns Apr 2024–Mar 2025) — Career & Employment CPC $5.16, CVR 4.33% — [WebFetch: wordstream.com/blog/2025-google-ads-benchmarks]
- get-ryze.ai 2026 Google Ads benchmarks — Education CPC $2.40, Employment Services CPC $2.04 — [WebFetch]
- WordStream average CPC by country — Germany 31% below US average — [WebFetch: wordstream.com/blog/average-cost-per-click]
- First Page Sage SaaS Freemium Conversion Rates (86 companies, Q1 2022–Q3 2025) — 13.7% visitor-to-freemium; 3.7% freemium-to-paid — [WebFetch]
- newframedigital.com Google Ads budget guide — No minimum spend; <100 clicks = directional only — [WebFetch]

### Secondary (LOW confidence — general guides, third-party summaries)
- Reddit self-promotion guides (redship.io, replyagent.ai, vadimkravcenko.com) — 90/10 rule, consequences, safe patterns
- Competitor SEO pages (liveingermany.de, novoresume.com, ophyai.com, expatninja.de, germanycareercoach.com) — vocabulary analysis
- gummysearch.com/redpulse.io — r/expats 248K members, r/cscareerquestionsEU 171K, r/jobs 2.58M
- immigration-consultant.de, immigrantspirit.com, blog.theinterviewguys.com — Sept–Oct hiring peak evidence
- indeed.de, karrierebibel.de — German KI Lebenslauf term confirmation
- cv-germany-expat-concept.md — prior keyword volume estimates carried forward (Semrush-cited in original, [ASSUMED] for exact figures)

### Tertiary (LOW confidence — SERP evidence only)
- SERP inspection for "KI Lebenslauf" queries: Canva, Livecareer DE, Kickresume, Indeed DE pages confirm real editorial presence
- SERP inspection for "german cv" queries: 8+ established competitor pages confirms keyword is actively contested but winnable on expat-specific angle

---

## Metadata

**Confidence breakdown:**
- Subreddit rules: LOW — not verifiable without direct Reddit access; all rules must be confirmed pre-posting
- Keyword volumes: LOW — no paid tool access; prior concept-doc estimates and SERP inference only
- KI terms (existence): MEDIUM — SERP evidence confirms real editorial presence
- CPC estimates: LOW — US benchmarks with country adjustment; real CPCs must be verified in Keyword Planner
- Seasonality (Sept–Oct peak): MEDIUM — qualitative multi-source consensus
- Conversion benchmarks: LOW — SaaS benchmarks applied to a different tool type

**Research date:** 2026-06-24
**Valid until:** 2026-09-24 (90 days) — keyword landscape is stable; subreddit rules can change at any time
