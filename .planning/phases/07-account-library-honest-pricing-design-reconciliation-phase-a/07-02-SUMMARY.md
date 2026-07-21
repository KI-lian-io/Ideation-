---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
plan: 02
subsystem: database
tags: [supabase, postgres, stripe, entitlements, node-test]

# Dependency graph
requires:
  - phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
    provides: "Stage 3 accounts foundation (0001_stage3_accounts.sql), accountsEnabled() gate, application_packages/humanizer_purchases tables"
provides:
  - "Live-project migration 0002_pass.sql: humanizer_purchases.expires_at column, pass_30d user_id constraint, three-tier enforce_package_limit (subscription unlimited / live pass 25 / free 1)"
  - "PASS_PRICE_CENTS (1499) and PASS_STORAGE_CAP (25) constants in humanizer.ts"
  - "checkPassEntitlement, updatePackageTitle, getActivePass, listPaketPurchases helpers in account.ts"
affects: [account-library-gallery, storage-gate, pass-modal, konto-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-db-row-entitlement-check, accountsEnabled-gated-noop-helper]

key-files:
  created:
    - scanready/supabase/migrations/0002_pass.sql
  modified:
    - scanready/src/lib/humanizer.ts
    - scanready/src/lib/account.ts
    - scanready/src/lib/__tests__/humanizer.test.ts
    - scanready/src/lib/__tests__/account.test.ts
    - scanready/docs/stage3-accounts.md

key-decisions:
  - "checkPassEntitlement lives in account.ts, not humanizer.ts, and is NOT forced through PaymentIntentLike/checkHumanizerEntitlement: a Pass is a standing DB-row window (expires_at), not a single-use Stripe PI token, so it gets its own pure function per 07-PATTERNS.md guidance"
  - "PASS_STORAGE_CAP=25 is documented as MUST match the 25 hardcoded in the enforce_package_limit trigger; no code path derives one from the other, so this is a manual-sync contract to watch on any future storage-limit change"
  - "updatePackageTitle does not itself branch on read_only; RLS blocks the write server-side and the gallery UI hides the control client-side (deferred to a later slice), consistent with 07-PATTERNS.md instruction"

patterns-established:
  - "Live-pass entitlement check: pure function taking a nullable { expires_at: string | null } row, returns boolean via Date comparison against Date.now() - no I/O, directly unit-testable like mapSaveError"

requirements-completed: [SC-03]

# Metrics
duration: 10min
completed: 2026-07-07
status: complete
---

# Phase 07 Plan 02: Pass Data Layer Summary

**Migration 0002_pass.sql adds a three-tier storage-limit trigger (subscription/live-pass/free) plus PASS_PRICE_CENTS and four typed, accountsEnabled()-gated account helpers, all proven by 8 new node:test assertions.**

## Performance

- **Duration:** ~10 min for this resumed session (Task 3 implementation + verification); Tasks 1-2 completed in a prior session segment (commit 5e726e9 at 2026-07-07T11:47:02+02:00)
- **Completed:** 2026-07-07T09:52:17Z
- **Tasks:** 3 (1 auto, 1 checkpoint:human-action, 1 auto/tdd)
- **Files modified:** 5 (1 migration created, 2 lib files extended, 2 test files extended) + 1 doc file for the migration-apply record

## Accomplishments
- Migration 0002_pass.sql written, applied to the live Frankfurt Supabase project (`thgmhbzimnjcaoqyyiyp`), and advisor-verified clean
- PASS_PRICE_CENTS (1499) and PASS_STORAGE_CAP (25) constants added beside the existing price constants
- Four new account.ts helpers: checkPassEntitlement (pure), updatePackageTitle, getActivePass, listPaketPurchases (all accountsEnabled()-gated)
- 8 new node:test assertions covering the Pass entitlement window (null row, null expires_at, past, future) plus the price constant and the accounts-disabled no-op behavior of updatePackageTitle

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 0002_pass.sql (expires_at, three-tier limit, pass_30d constraint)** - `5e726e9` (feat)
2. **Task 2: [BLOCKING] Apply migration 0002 to live Supabase + advisor check** - no commit (checkpoint resolved by the orchestrator applying the migration live via `mcp__supabase__apply_migration`; no repo file changed)
3. **Task 3: PASS_PRICE_CENTS + pure/typed account helpers + tests** - `e4978c4` (feat)

**Plan metadata:** (this commit, docs: complete plan)

_Note: no separate test → feat commit split for Task 3 - the plan's tdd="true" behavior list was implemented and its tests added in the same commit, matching this codebase's existing convention (see the analogous mapSaveError/checkHumanizerPi test-and-implementation pairing already in git history for this file set)._

## Files Created/Modified
- `scanready/supabase/migrations/0002_pass.sql` - expires_at column, pass_30d user_id check constraint, three-tier enforce_package_limit() (subscription unlimited / live pass 25 / free 1), advisory-lock race guard preserved
- `scanready/src/lib/humanizer.ts` - PASS_PRICE_CENTS = 1499, PASS_STORAGE_CAP = 25
- `scanready/src/lib/account.ts` - checkPassEntitlement, updatePackageTitle, getActivePass, listPaketPurchases
- `scanready/src/lib/__tests__/humanizer.test.ts` - PASS_PRICE_CENTS assertion
- `scanready/src/lib/__tests__/account.test.ts` - checkPassEntitlement (4 cases) + updatePackageTitle no-op case
- `scanready/docs/stage3-accounts.md` - recorded the migration 0002 live-apply and advisor-clean result

## Decisions Made
- checkPassEntitlement kept as a standalone pure function in account.ts (DB-row shape) rather than extending PaymentIntentLike/checkHumanizerEntitlement in humanizer.ts (Stripe-PI shape) - the two entitlement models are structurally different and mixing them would blur the "PI is a single-use token, Pass is a standing window" distinction the codebase already relies on.
- No em-dash characters introduced anywhere in the touched files (verified via grep).

## Deviations from Plan

None - plan executed exactly as written. Task 2's checkpoint was resolved by the orchestrator (not this executor) applying the migration via Supabase MCP; that resolution is recorded here per the resume instructions rather than as a deviation.

## Migration Apply Verification (Task 2 resolution)

Migration 0002_pass.sql was applied via `mcp__supabase__apply_migration` to the live Frankfurt project `thgmhbzimnjcaoqyyiyp` (result: `success:true`). Live verification confirmed:
- `humanizer_purchases.expires_at` column exists
- constraint `humanizer_purchases_pass_requires_user` exists
- `enforce_package_limit()` definition contains `pass_30d` and `>= 25`
- trigger `trg_enforce_package_limit` is present

Supabase security advisors showed **zero new findings** from this migration. The only advisor output remaining is the two pre-existing WARNs already known to the founder: the intentional `delete_own_account()` SECURITY DEFINER RPC, and the auth leaked-password-protection dashboard toggle. This result is also recorded in `scanready/docs/stage3-accounts.md`.

## Issues Encountered
None.

## User Setup Required

None for this plan - the migration apply (the one item that needed live infrastructure access) was completed by the orchestrator during the Task 2 checkpoint, as recorded above. No further founder action is required to consider this plan's scope done. Downstream UI slices (Pass modal, storage gate, gallery rename control) that will consume these helpers are separate, not-yet-executed plans in this phase.

## Next Phase Readiness
- The Pass data layer (migration + entitlement helpers) is ready for the A2/A3/A4 waves that build the Pass purchase flow, storage-gate UI, and gallery rename control on top of it.
- `PASS_STORAGE_CAP` and the trigger's hardcoded `25` are two independent sources of truth that must be changed together if the cap value ever changes - flagged in code comments, not currently covered by an automated cross-check.
- No blockers.

---
*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: scanready/supabase/migrations/0002_pass.sql
- FOUND: scanready/src/lib/humanizer.ts
- FOUND: scanready/src/lib/account.ts
- FOUND commit: 5e726e9
- FOUND commit: e4978c4
