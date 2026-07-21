---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
plan: 01
subsystem: database
tags: [supabase, postgres, security-definer, rls, migration]

# Dependency graph
requires:
  - phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
    provides: Stage 3 accounts schema (0001-0003 migrations, delete_own_account grant-hardening pattern)
provides:
  - "application_packages.status text column + application_packages_status_check CHECK (null or one of 5 lowercase keys)"
  - "set_package_status(uuid, text) SECURITY DEFINER RPC, ownership-checked via auth.uid(), granted authenticated-only"
  - "application_packages.cv_id nullable with FK re-created ON DELETE SET NULL (was NOT NULL + CASCADE)"
  - "subscriptions.cancel_at_period_end boolean not null default false"
  - "Live-applied, advisor-clean schema on the Frankfurt project (thgmhbzimnjcaoqyyiyp), unblocking all dependent Phase-B plans"
affects: [08-02, 08-03, 08-04, 08-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grant-hardening pattern reused: revoke all from public/anon, grant execute to authenticated only, applied to a second SECURITY DEFINER RPC (set_package_status) after delete_own_account"
    - "Null-tolerant CHECK constraints on any column touched by ON DELETE SET NULL or account-deletion cascades (the 0002/0003 lesson, now applied a third time)"

key-files:
  created:
    - scanready/supabase/migrations/0004_library_phase_b.sql
  modified:
    - scanready/docs/stage3-accounts.md

key-decisions:
  - "set_package_status deliberately bypasses the read_only qualifier in application_packages_update_own_and_editable: status is package metadata, not document content, so it stays editable on read_only rows without weakening the document-content write lock"
  - "cv_id FK changed from NOT NULL + ON DELETE CASCADE to nullable + ON DELETE SET NULL: packages render from their own snapshotted lebenslauf JSONB, never a live link to cvs, so deleting a CV must not delete its packages (Bewerbungen behalten ihre Kopie)"
  - "Accepted one new advisor WARN (set_package_status flagged by the authenticated-security-definer lint) as an intentional, documented exception, identical reasoning to the existing delete_own_account exception: authenticated-only grant + in-body auth.uid() ownership check + single-column update + input validation make it safe by construction"

requirements-completed: [SC-01, SC-03, SC-04, SC-06]

# Metrics
duration: multi-day (paused-project blocker spanned 2026-07-19 to 2026-07-20)
completed: 2026-07-20
status: complete
---

# Phase 8 Plan 1: Migration 0004 (schema foundation for CV reuse, status, Plus lifecycle) Summary

**Migration 0004 shipped and live-applied: application_packages status column + set_package_status RPC, cv_id FK changed from CASCADE to SET NULL, and subscriptions.cancel_at_period_end, unblocking all five downstream Phase-B plans.**

## Performance

- **Tasks:** 2 (Task 1: write migration + runbook entry; Task 2: blocking checkpoint to apply live)
- **Files modified:** 2 (0004_library_phase_b.sql created, stage3-accounts.md appended twice)

## Accomplishments

- Migration 0004 written following the 0001-0003 conventions: four DDL groups (status column + CHECK, set_package_status RPC + grant hardening, cv_id nullable + FK SET NULL, subscriptions.cancel_at_period_end), each with a WHY comment block, idempotent guards mirroring the 0002 do-block pattern.
- Migration applied live to the Frankfurt Supabase project (`thgmhbzimnjcaoqyyiyp`) via `mcp__supabase__apply_migration`, success confirmed.
- Security advisor run post-apply: only one new finding, and it is an expected, accepted exception (see Decisions).
- Live object probes and rolled-back behavioral probes both passed, confirming the schema behaves exactly as designed under real Postgres constraint/trigger evaluation, not just in the SQL text.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 0004_library_phase_b.sql + append the runbook entry** - `407b0fe` (feat)
2. **Task 2: [BLOCKING] Apply migration 0004 to live Supabase + advisor check** - `b5611b3` (docs: recorded the initial paused-project block) then `b444ab3` (docs: recorded the successful live apply once resolved)

**Plan metadata:** this SUMMARY commit (docs: complete plan)

## Files Created/Modified

- `scanready/supabase/migrations/0004_library_phase_b.sql` - the four DDL groups: `application_packages.status` + CHECK, `set_package_status()` SECURITY DEFINER RPC + grant hardening, `cv_id` nullable + FK re-created `ON DELETE SET NULL`, `subscriptions.cancel_at_period_end`
- `scanready/docs/stage3-accounts.md` - runbook entries: initial pending entry (Task 1), the paused-project block entry (`b5611b3`), and the final applied entry with full advisor/probe results (`b444ab3`)

## Decisions Made

See `key-decisions` in frontmatter. Additionally:
- The checkpoint resolution path (paused project restore -> async backup landing -> retry apply) is documented in full in `scanready/docs/stage3-accounts.md` lines 68-103; this SUMMARY does not duplicate that prose, per resume instructions (the runbook file was read-only during this closeout).

## Deviations from Plan

None beyond the plan's own explicit checkpoint mechanism.

### Checkpoint Resolution (not a deviation - the plan's designed blocking gate)

**Task 2 hit its designed `[BLOCKING]` checkpoint**, exactly as the plan anticipated: the Supabase Frankfurt project (`thgmhbzimnjcaoqyyiyp`) was paused when the migration-apply step ran on 2026-07-19, so `mcp__supabase__apply_migration` could not reach it. This was recorded verbatim in `stage3-accounts.md` (commit `b5611b3`) and surfaced to the orchestrator as an open checkpoint rather than silently skipped or worked around.

Resolution: the founder restored the paused project. Immediately after restore, the database came up with platform schemas only (zero public tables, zero auth users) because Supabase restores compute before the backup lands, and the backup landed asynchronously a few minutes later. The orchestrator correctly waited rather than attempting to rebuild the schema from scratch, and the full pre-pause state (0001-0003 objects, founder auth user) returned on its own. Migration 0004 was then applied successfully (`mcp__supabase__apply_migration`, `success: true`), and `b444ab3` records the completed advisor check and behavioral probes.

## Issues Encountered

- **Paused Supabase project blocked the live apply** (2026-07-19 to 2026-07-20). Resolved by founder restore; see Checkpoint Resolution above. No schema or code workaround was needed once the project was live again - the migration applied cleanly on the first retry.
- **One new (expected, accepted) security advisor WARN**: `set_package_status` is flagged by the same authenticated-security-definer lint that already flags `delete_own_account`. This is not a defect: the function is authenticated-only (revoked from public/anon), checks `user_id = auth.uid()` in-body (never trusts a client-supplied id), touches only the `status` column, and validates `new_status` against the five allowed keys before writing. Documented as an accepted advisor exception in `stage3-accounts.md`, matching the precedent already set for `delete_own_account`.

## User Setup Required

None - no new external service configuration required. The Supabase project itself already existed (created in Phase 7); this plan only added schema objects to it.

## Next Phase Readiness

- All five Phase-8 plans (08-01 through 08-05) are now fully complete. Migration 0004 is live and advisor-clean, so plans 08-02 (CV-reuse attach-or-new), 08-03 (Meine Lebenslaeufe / cv_id SET NULL), 08-04 (status chip + set_package_status RPC), and 08-05 (cancel_at_period_end lifecycle) are no longer running against a schema gap - the false-positive verification risk called out in this plan's objective is closed.
- `delete_own_account()` was probed post-migration and still succeeds; the FK change and null-tolerant CHECK do not interfere with account deletion cascades.
- Phase 8 is complete: 5/5 plans executed. No known blockers remain for this phase.

---
*Phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: `.planning/phases/08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-/08-01-SUMMARY.md`
- FOUND: commit `407b0fe` (Task 1: migration 0004 written)
- FOUND: commit `b5611b3` (checkpoint: paused-project block recorded)
- FOUND: commit `b444ab3` (Task 2 resolved: migration applied live, advisor-clean, probes recorded)
- FOUND: commit `0b359ea` (this SUMMARY committed)
- FOUND: commit `e499208` (STATE.md + ROADMAP.md tracking updates committed)
