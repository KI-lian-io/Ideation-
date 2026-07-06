---
phase: quick
plan: 260706-n4r
subsystem: database
tags: [supabase, accounts, data-hygiene, gdpr]

# Dependency graph
requires:
  - phase: 05-stage3-accounts (session, not GSD-tracked)
    provides: saveApplicationPackage() and the enforce_package_limit() DB trigger
provides:
  - Best-effort cleanup of the orphaned cvs row when a package save is blocked by the free-tier limit trigger
affects: [account.ts, saveApplicationPackage, stage3-accounts]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Best-effort cleanup delete: fire-and-forget, never inspect result/error, never alter the caller-facing return value"]

key-files:
  created: []
  modified:
    - scanready/src/lib/account.ts
    - scanready/src/lib/__tests__/account.test.ts

key-decisions:
  - "Used a bare `await client.from(\"cvs\").delete().eq(\"id\", cv.id)` with no try/catch and no inspection of its result, since the Supabase query builder resolves (never rejects) on a Postgres error -- keeps the pkgError branch's return value byte-identical to before."
  - "Test uses a hand-rolled fake SupabaseClient (cast via `as unknown as SupabaseClient`) recording calls, matching the existing no-framework, no-new-deps test style in this file."

requirements-completed: [QUICK-260706-n4r]

# Metrics
duration: ~12min
completed: 2026-07-06
status: complete
---

# Quick Task 260706-n4r: Fix orphaned cvs row leak in saveApplicationPackage Summary

**Best-effort `cvs` row cleanup added to the pkgError branch of `saveApplicationPackage()` so blocked (limit) saves no longer leak full-CV-text rows.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3 (all auto)
- **Files modified:** 2

## Accomplishments
- Closed a real data-leak: every free-tier user who clicked "save" past their 1-package limit was previously leaving one orphaned `cvs` row (containing full CV text) behind forever.
- Added a unit test proving the cleanup delete fires with the correct `cv.id` on a `package_limit` trigger error, while the `SaveResult` returned to the caller stays exactly `{ ok: false, reason: 'limit' }`.
- Zero regressions: full suite (115 tests, up from 114) and `tsc --noEmit` are green.

## Task Commits

Both code tasks were combined into a single commit per the plan's guidance (same logical change: fix + its test):

1. **Task 1 + Task 2: cvs cleanup delete + unit test** - `895e03d` (fix)
2. **Task 3: full suite + typecheck verification** - no new changes; both were already green, nothing to commit.

**Plan metadata:** committed separately by the orchestrator (docs commit), not included here.

## Files Created/Modified
- `scanready/src/lib/account.ts` - Added a best-effort `client.from("cvs").delete().eq("id", cv.id)` call in the `pkgError` branch of `saveApplicationPackage()`, with a comment explaining why (cvs row inserted before the package insert, which was then rejected by `enforce_package_limit()`). The branch's return value (`mapSaveError(pkgError)`) is unchanged.
- `scanready/src/lib/__tests__/account.test.ts` - Added `saveApplicationPackage: blocked (limit) save cleans up the orphaned cvs row`, driving a hand-rolled fake `SupabaseClient` whose package insert returns a `package_limit` error, asserting both the returned `SaveResult` and that the cleanup delete was called exactly once with `cv-123`.

## Decisions Made
- No try/catch around the cleanup delete: the Supabase Postgrest query builder resolves with `{ error }` rather than throwing on a database error, so a bare `await` is safe and simplest. This also guarantees the fix can never itself change the branch's return value.
- Test env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set immediately before the call and cleared in a `finally`, since `accountsEnabled()` reads them fresh on every invocation (no module-level caching) -- confirmed by reading `src/lib/supabase/config.ts` before writing the test.

## Deviations from Plan

None - plan executed exactly as written.

One environment note (not a deviation, no code impact): `scanready/node_modules` did not exist in this fresh worktree, so `npm install` was run once before any verification command (`npx tsc`, `node --test`) could execute. This is normal worktree setup, not a plan or code change.

## Issues Encountered
- `npx tsc` initially resolved to an unrelated global `tsc` binary because `node_modules` was missing in this worktree; running `npm install` first resolved it to the project's local TypeScript 5, after which `npx tsc --noEmit` ran clean.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Fix is self-contained to `saveApplicationPackage()`; no follow-up work required for this task.
- Broader Stage 3 accounts founder-gate items (Supabase env vars in Vercel, Stripe subscription price, etc.) are tracked separately in `scanready/docs/stage3-accounts.md` and `.planning/STATE.md`, unaffected by this change.

---
*Phase: quick*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: scanready/src/lib/account.ts
- FOUND: scanready/src/lib/__tests__/account.test.ts
- FOUND: commit 895e03d
