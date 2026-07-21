---
phase: "05"
plan: "01"
subsystem: "distribution/community"
status: complete
tags: ["gtm", "reddit", "build-in-public", "community", "content", "gtm-01"]
dependency_graph:
  requires: []
  provides: ["community-plan", "reddit-subreddit-shortlist", "first-three-posts", "per-sub-rule-verification-checklist"]
  affects: ["distribution-launch", "build-in-public-cadence"]
tech_stack:
  added: []
  patterns: ["[ASSUMED]-flagging for unverifiable data (member counts, sidebar rules)", "founder-verification checklist as in-artifact human gate", "PII-redaction via bracketed placeholders in proof posts"]
key_files:
  created:
    - distribution/community-plan.md
  modified: []
decisions:
  - "Reddit-led, low-profile, story/value-first motion (D-01, D-02); LinkedIn optional/sparing. Tool link goes in profile or first comment, never the post body."
  - "8-subreddit shortlist each carries a LOW/MEDIUM/HIGH self-promo risk tier; member counts flagged [ASSUMED] because research could not fetch live Reddit data (bot-blocked)."
  - "≥1-week-per-subreddit staggering — never launch across multiple subs simultaneously (coordinated-spam ban-signal mitigation, T-05-03)."
  - "Cadence ~1 post/week anchored to the founder's real application milestones (D-03); TikTok kept as an optional organic experiment with no paid spend (D-12)."
  - "Post 3 before/after proof uses bracketed [REDACTED] placeholders for the founder's real CV; PII-redaction is a conscious founder decision, not a default exposure (T-05-01)."
requirements_completed: ["GTM-01"]
metrics:
  completed_at: "2026-06-24T16:40:00+02:00"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 1
---

# Phase 05 Plan 01: Community / Build-in-Public Plan Summary

**Reddit-led build-in-public distribution plan — 8-subreddit shortlist with per-sub self-promo risk tiers, ≥1-week staggering, ~1-post/week milestone-anchored cadence, three fully drafted posts, and a mandatory per-sub rule-verification checklist (GTM-01).**

## Performance

- **Duration:** ~5 min (build)
- **Completed:** 2026-06-24T16:40:00+02:00
- **Tasks:** 3 (2 authoring + 1 founder-verify checkpoint, approved)
- **Files modified:** 1

## Accomplishments
- Authored `distribution/community-plan.md` (479 lines): strategy, subreddit shortlist, cadence.
- Drafted the first three posts — educational (Post 1), listicle (Post 2), before/after founder-CV proof (Post 3) — each adapted to its destination sub, links kept out of post bodies.
- Built a per-subreddit rule-verification checklist (Section 6) plus general pre-posting checks, explicitly stating rules are [ASSUMED] and must be human-verified live.

## Task Commits

1. **Task 1: Author the community plan body — strategy, subreddit shortlist, cadence** — `0f466c0` (docs)
2. **Task 2: Draft the first three posts and the per-sub rule-verification checklist** — `0f466c0` (docs; written in the same artifact pass)
3. **Task 3: Founder review — posts, PII-redaction decision, per-sub rule verification** — checkpoint:human-verify, **approved by founder 2026-06-24**

## Files Created/Modified
- `distribution/community-plan.md` — GTM-01 community/build-in-public distribution plan.

## Decisions Made
See frontmatter `decisions`. All guardrails applied: no income/outcome claims; "authentic" = voice/quality (not detection-evasion); nationality-neutral; GDPR zero-retention messaged; grounded-never-fabricated framing.

## Deviations from Plan
None — plan executed as written. Tasks 1 and 2 were authored in a single artifact write (one commit) rather than two; content scope unchanged.

## Issues Encountered
None.

## User Setup Required
Founder responsibilities documented in-artifact, to discharge **before any post goes live**:
- Verify each target subreddit's live sidebar/pinned rules from a logged-in account (research could not fetch them).
- Decide the PII-redaction question on Post 3 (default: redact all real CV details).

## Next Phase Readiness
GTM-01 artifact ready. Distribution can begin once the founder completes per-sub rule verification and PII-redaction decisions. Pairs with GTM-02 (SEO) and GTM-03 (paid, blocked until Phase 6).

---
*Phase: 05-distribution-operationalization*
*Completed: 2026-06-24*
