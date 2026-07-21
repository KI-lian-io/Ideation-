---
phase: "05"
plan: "03"
subsystem: "distribution/paid"
status: complete
tags: ["gtm", "paid", "google-ads", "conversion-test", "blocked-on-phase-6", "gtm-03"]
dependency_graph:
  requires: []
  provides: ["paid-test-spec", "cost-per-completed-flow-metric", "100eur-budget-cap", "organic-proof-gate"]
  affects: ["phase-6-analytics", "paid-conversion-test"]
tech_stack:
  added: []
  patterns: ["BLOCKED status banner at top of spec — authored now, forbidden to run until preconditions clear", "directional-not-statistical honesty framing on small budgets", "hard cross-phase dependency declared in-artifact (OPS-01 funnel)"]
key_files:
  created:
    - distribution/paid-test-spec.md
  modified: []
decisions:
  - "Channel (D-11): Google Search only; one primary keyword '[german cv converter]' (exact match) with two documented fallbacks."
  - "D-12: the €100 budget is Google Search only; TikTok paid is explicitly out of scope and deferred to its own later, organic-gated test."
  - "Success metric (D-13): cost per completed flow (start → copy/download) — requires the Phase-6 PostHog funnel."
  - "Budget (D-14): hard €100 cap, €5–10/day × 10–20 days; ~30–70 clicks → ~2–10 completed flows, framed as a directional signal, not statistically significant optimisation data."
  - "Organic-proof gate (D-15): default N=50 completed organic flows before any spend; founder finalises N once Phase-6 funnel velocity is visible."
  - "Hard dependency on Phase-6 OPS-01 events and the PostHog ↔ Google Ads conversion bridge; spec is BLOCKED from running until Phase 6 is live AND the organic-proof gate clears."
requirements_completed: ["GTM-03"]
metrics:
  completed_at: "2026-06-24T16:40:00+02:00"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 1
---

# Phase 05 Plan 03: Paid Conversion-Test Spec Summary

**Paid conversion-test spec — one high-intent Google keyword, cost-per-completed-flow metric, hard €100 cap, organic-proof gate (N=50), and a declared hard dependency on the Phase-6 funnel. Authored now, BLOCKED from running (GTM-03).**

## Performance

- **Duration:** ~4 min (build)
- **Completed:** 2026-06-24T16:40:00+02:00
- **Tasks:** 2 (1 authoring + 1 founder-verify checkpoint, approved)
- **Files modified:** 1

## Accomplishments
- Authored `distribution/paid-test-spec.md` (274 lines) with a top-of-file BLOCKED banner and zero spend instructions.
- Defined keyword, success metric, hard budget cap, daily cap mechanic, organic-proof gate, and the Phase-6 dependency.
- Added a pre-launch validation table and a guardrail checklist; framed €100 honestly as a directional signal.

## Task Commits

1. **Task 1: Author the paid-test spec — keyword, metric, budget, gate, Phase-6 dependency** — `9515514` (docs)
2. **Task 2: Founder review — keyword, metric, cap, gate, Phase-6 dependency** — checkpoint:human-verify, **approved by founder 2026-06-24**

## Files Created/Modified
- `distribution/paid-test-spec.md` — GTM-03 paid conversion-test spec (BLOCKED until Phase 6 + organic gate).

## Decisions Made
See frontmatter `decisions`. Guardrails applied: no income/outcome claims; authentic = voice not detection-evasion; nationality-neutral; zero-retention preserved.

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
Founder responsibilities documented in-artifact, to discharge **before any launch (and not before Phase 6 + organic gate)**:
- Confirm/create a Google Ads account and validate the candidate keyword's volume in Keyword Planner (no spend needed for the check).
- Finalise the organic-proof gate N once the Phase-6 funnel is live and organic velocity is visible.

## Next Phase Readiness
GTM-03 artifact ready but intentionally **BLOCKED**. Establishes a hard dependency on Phase 6 (OPS-01 analytics funnel + PostHog↔Google Ads bridge). No paid spend may begin until Phase 6 is live and the organic-proof gate clears.

---
*Phase: 05-distribution-operationalization*
*Completed: 2026-06-24*
