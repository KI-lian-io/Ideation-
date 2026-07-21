# Phase 5: Distribution Operationalization - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce three concrete distribution **artifacts** (documentation, not app code) so launch can start the moment the live tool is public:
1. A build-in-public / community plan (GTM-01)
2. An SEO keyword list + 6-month publishing cadence (GTM-02)
3. A paid conversion-test spec (GTM-03)

This phase writes the playbook; it does not execute the campaigns or change the shipped app. The paid test in particular cannot *run* until the Phase-6 analytics funnel exists and the organic-proof gate clears.

</domain>

<decisions>
## Implementation Decisions

### Community / Build-in-Public (GTM-01)
- **D-01:** Reddit-led and deliberately **low-profile ("under the radar")**. The loud public LinkedIn build-log is downplayed — LinkedIn is optional/sparing for the founder story, not the engine.
- **D-02:** Self-promotion approach = **story/value-led soft mention**: post genuine value (the norm-gap insight, the real job-hunt experience), mention the tool once naturally, link in profile / first comment. Respects strict subreddit self-promo rules and the "sell capability, never income" guardrail.
- **D-03:** Cadence = ~**1 substantive post/week, anchored to real application milestones** from the founder's live job hunt (dogfooding generates the material).
- **D-04:** Target communities = **r/germany, r/expats, PLUS niche application/CV-writing subreddits to be identified by research**. Research MUST surface each target sub's self-promotion rules before any post goes out (avoid removals/bans).
- **D-05:** First **3 posts** drafted as the artifact: (1) the **"8-second scan" / German norm-gap explainer**; (2) a **recruiter-expectations checklist** ("what German recruiters expect that foreign CVs get wrong"); (3) a real **before→after of the founder's own CV→Lebenslauf** as the proof piece. The personal-diary angle was dropped — these are utility + proof, not a journal.
- **D-06:** Post format = **visual-heavy** (before/after screenshots, carousels). On strict text-first subreddits, lead with substantive text and embed the single key visual (platform-fit adaptation, not a separate format).

### SEO (GTM-02)
- **D-07:** Keyword clusters = **balanced EN + DE from the start** — expat-EN long-tail AND emerging German "KI Lebenslauf"-style terms.
- **D-08:** **MANDATORY research input — terminology is data-driven, not assumed.** Searcher vocabulary differs by cohort: US searchers say "resume", UK/international say "CV", German is "Lebenslauf". The keyword list and head-term choices MUST be backed by real search-volume data (e.g. "resume Germany" vs "CV Germany" vs "Lebenslauf in English"). May surface landing-copy implications — note for a future copy pass (the landing already shipped in Phase 4).
- **D-09:** Content form = **hybrid**: 2 cornerstone evergreen guides (e.g. the norm-gap / 8-second scan; DIN 5008 / Anschreiben structure) that link to the live tool, plus long-tail posts hanging off them. **No programmatic/templated pages** (premature pre-traffic, thin-content risk).
- **D-10:** Cadence = **front-load the 2–3 cornerstone guides now** so they index and age before the **Sept–Oct application peak (~3–4 months out)**, then **~2 long-tail posts/month**. The peak is a stretch goal, not a dependency. 6-month horizon.

### Paid conversion test (GTM-03)
- **D-11:** Channel = **Google Search, one specific high-intent keyword** (exact/phrase match). Paid is a conversion *test*, never a growth channel.
- **D-12:** **TikTok = organic short-form experiment only** (folds into the build-in-public plan), NOT part of the €100 paid budget. It earns its own separate paid test later only if organic traction appears.
- **D-13:** Success metric = **cost per completed flow** (start → copy/download) — ties directly to the v1 success metric. Requires the **Phase-6 analytics funnel** to be live to measure.
- **D-14:** **Hard budget cap = €100** total for the test.
- **D-15:** **Gate = organic proof first** — do not spend until the funnel shows a threshold of real organic finished sessions. Locks "only after organic validation". Exact N set once analytics is live (see Claude's Discretion).

### Claude's Discretion
- The exact subreddit shortlist and the per-sub rule research (within D-04).
- The exact keyword list and head-term selection (data-driven per D-08).
- The exact N for the organic-proof gate threshold (D-15) — set when the Phase-6 funnel exists.
- Where the three artifacts physically live in the repo (e.g. a `distribution/` or `docs/` folder with three markdown files) — planner's call.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Strategy & positioning
- `cv-germany-expat-concept.md` — validated concept: norm-gap value prop, market, competitors, search-volume context, monetization
- `BUILD_PLAN.md` §Distribution — channel sequence (build-in-public → SEO → paid LAST), founder-led content thesis
- `necessity-tools-strategy.md` §3 SEO-led growth model + §4 monetization — SEO-as-moat, finish-line gate, ethics landmines
- `low-barrier-tools-strategy.md` §4 Monetization & Unit Economics — the paid-ads CAC vs LTV math that justifies paid-as-test-only
- `.planning/PROJECT.md` — core value, customer (internationals; launch motion on the reachable US/UK + uni-grad cohort), guardrails, Key Decisions
- `.planning/REQUIREMENTS.md` — GTM-01 / GTM-02 / GTM-03 acceptance bullets
- `.planning/ROADMAP.md` §Phase 5 — goal + the three success criteria

### Live product (CTA destination)
- `scanready/src/app/page.tsx` — the landing (`/`) every distribution CTA points to; carries the "8-second scan" positioning copy to reuse
- `scanready/src/app/app/page.tsx` — the tool (`/app`)
- `scanready/public/og-image.svg` — OG card for shared link previews

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Landing `/` + tool `/app` (shipped Phase 4): the conversion destination — all distribution CTAs link here. No new app code needed for this phase.
- OG card (`scanready/public/og-image.svg`): drives link previews on Reddit / LinkedIn / TikTok shares.
- Locked positioning copy ("Win the 8-second German recruiter scan"; authentic + norm-correct): reuse verbatim across posts and SEO for message consistency.

### Established Patterns
- Project-wide guardrails apply to ALL distribution copy: no income/outcome claims; "authentic" = quality/voice, never detection-evasion; nationality-neutral messaging.

### Integration Points
- GTM-03's metric (cost per completed flow) and gate (organic finished-session threshold) **depend on the Phase-6 analytics funnel** (start, parse_done, letter_done, copy/download). Artifacts can be authored now, but the paid test cannot execute until Phase 6 is live and the organic threshold is met. The planner should flag this dependency explicitly.

</code_context>

<specifics>
## Specific Ideas

- The before→after proof post (D-05) uses the founder's own real CV→Lebenslauf (dogfood).
- The "8-second scan" frame is the through-line across community, SEO, and paid — one consistent message.
- This is a documentation/artifact-only phase — no app code changes expected.

</specifics>

<deferred>
## Deferred Ideas

- **TikTok paid test** — separate, later, its own budget; only if organic short-form shows traction (D-12).
- **Parallel B2B pilot** (university career services, relocation firms) — deferred per PROJECT.md; revisit post-validation.
- **Landing-copy tweaks from SEO terminology findings** — a future copy pass (landing shipped in Phase 4).
- **Finish-line paywall / monetization (v2)** — gated on this phase's distribution producing traffic + proof.
- **Name finalization** (ScanReady is a placeholder) — pre-launch decision.

None of the above are in Phase 5 scope; captured so they aren't lost.

</deferred>

---

*Phase: 05-distribution-operationalization*
*Context gathered: 2026-06-23*
