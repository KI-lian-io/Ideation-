---
phase: "05"
plan: "02"
subsystem: "distribution/seo"
status: complete
tags: ["gtm", "seo", "keywords", "content-cadence", "cornerstone-guides", "gtm-02"]
dependency_graph:
  requires: []
  provides: ["seo-keyword-plan", "keyword-clusters-en-de", "two-cornerstone-guide-topics", "6-month-publishing-cadence", "keyword-validation-step"]
  affects: ["content-production", "organic-acquisition"]
tech_stack:
  added: []
  patterns: ["[ASSUMED]-flagging on all keyword volumes/CPCs (no live API access)", "mandatory Keyword Planner validation step before publishing", "cornerstone guides carry required /app CTAs with guardrail documentation"]
key_files:
  created:
    - distribution/seo-keyword-plan.md
  modified: []
decisions:
  - "Vocabulary (D-08): 'German CV' is the dominant English head term (competitor-SERP grounded), 'German resume' secondary for US-origin searchers, 'Lebenslauf' secondary/explanatory only — never the primary English title."
  - "Three keyword clusters (D-07): A = expat EN long-tail (Low–Med competition); B = German KI/AI first-mover terms (Very Low competition); C = German transactional terms (higher competition, deferred)."
  - "Head terms to avoid: 'lebenslauf vorlage' (incumbent-owned) and 'resume builder' (US-walled)."
  - "Two cornerstone evergreen guides (D-09) targeting Cluster A + cover-letter terms, each with required CTAs to /app."
  - "6-month cadence (D-10) front-loads both cornerstones in Months 1–2; Sept–Oct peak flagged a STRETCH GOAL [ASSUMED], not a dependency."
  - "All volumes labelled [ASSUMED]; mandatory Google Ads Keyword Planner validation of ~10 top terms before publishing cornerstones (D-08 honesty step)."
requirements_completed: ["GTM-02"]
metrics:
  completed_at: "2026-06-24T16:40:00+02:00"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 1
---

# Phase 05 Plan 02: SEO Keyword Plan Summary

**SEO keyword plan — 'German CV' head-term decision, three [ASSUMED]-flagged EN+DE keyword clusters, two cornerstone evergreen guides with /app CTAs, a front-loaded 6-month cadence, and a mandatory Keyword Planner validation step (GTM-02).**

## Performance

- **Duration:** ~2 min (build)
- **Completed:** 2026-06-24T16:40:00+02:00
- **Tasks:** 3 (2 authoring + 1 founder-verify checkpoint, approved)
- **Files modified:** 1

## Accomplishments
- Authored `distribution/seo-keyword-plan.md` (276 lines): vocabulary decision, clusters, head-terms-to-avoid, cornerstone topics.
- Added the 6-month month-by-month publishing cadence and the explicit keyword-volume validation step.
- Kept all volume/competition figures labelled [ASSUMED]; surfaced Keyword Planner validation as a pre-publish gate.

## Task Commits

1. **Task 1: Author keyword clusters and cornerstone guide topics** — `7d71b07` (docs)
2. **Task 2: Author 6-month publishing cadence and keyword-validation step** — `84276c0` (docs)
3. **Task 3: Founder review — clusters, cadence, keyword-volume validation** — checkpoint:human-verify, **approved by founder 2026-06-24**

## Files Created/Modified
- `distribution/seo-keyword-plan.md` — GTM-02 SEO keyword list + publishing cadence.

## Decisions Made
See frontmatter `decisions`. Guardrails applied: no income claims; grounded-only; [ASSUMED] labels on all unverified data.

## Deviations from Plan
None — plan executed exactly as written (two atomic commits, one per task).

## Issues Encountered
None.

## User Setup Required
Founder responsibility documented in-artifact, to discharge **before publishing**:
- Validate the ~10 top keyword terms in the free Google Ads Keyword Planner; adjust content bets if real volumes differ materially from the [ASSUMED] estimates.

## Next Phase Readiness
GTM-02 artifact ready. Content production can begin after Keyword Planner validation. Cornerstone guides will link the live `/app` tool. Pairs with GTM-01 (community) and GTM-03 (paid, blocked until Phase 6).

---
*Phase: 05-distribution-operationalization*
*Completed: 2026-06-24*
