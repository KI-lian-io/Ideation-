---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
plan: 02
subsystem: account-library
tags: [supabase, react, typescript, i18n, cv-reuse]

# Dependency graph
requires:
  - phase: 08-01
    provides: migration 0004_library_phase_b.sql schema (cv_id nullable FK on delete set null, status column) that this plan's TypeScript types target
provides:
  - cv-overlap.ts pure heuristic (cvOverlapRatio, bestCvMatch, CV_ATTACH_THRESHOLD) for preselecting attach-vs-new
  - account.ts existingCvId attach path in saveApplicationPackage, listCvs, updateCvTitle, CvRow type, nullable cv_id/status on ApplicationPackageRow
  - cvs.* i18n key group (attach/new radio copy, snapshot note, attach-meta) in en/de lockstep
  - attach-or-new radio wired into SaveApplicationButton, threaded through ResultView/CoverLetterResultView/AppShell
  - null-cv_id guards in handleLoadPackage/handleDuplicatePackage
affects: [08-03 (konto Meine Lebenslaeufe section will consume listCvs/updateCvTitle/CvRow), 08-04 (status feature will use ApplicationPackageRow.status)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure overlap heuristic (token-set intersection over the smaller set, not Jaccard) so a trimmed edit of the same CV still preselects attach"
    - "Attach-path branch in saveApplicationPackage skips the cvs insert entirely rather than inserting-then-linking, so there is no orphan-cleanup concern on that branch"

key-files:
  created:
    - scanready/src/lib/cv-overlap.ts
    - scanready/src/lib/__tests__/cv-overlap.test.ts
  modified:
    - scanready/src/lib/account.ts
    - scanready/src/lib/__tests__/account.test.ts
    - scanready/src/lib/i18n.tsx
    - scanready/src/app/app/page.tsx
    - scanready/package.json

key-decisions:
  - "cvOverlapRatio uses intersection-over-smaller-set (not Jaccard/union) so a shorter edit of the same CV still preselects attach - a missed attach match is worse UX than an occasional over-eager one, since save-as-new is always one click away"
  - "cvsAttachMeta is called with usage count 0 inside SaveApplicationButton's CV picker (packages aren't fetched in this component); the real per-CV usage count is deferred to 08-03's konto section where listPackages() results are already grouped by cv_id"
  - "Attach-path failure in saveApplicationPackage never deletes the reused cvs row (unlike save-as-new's 895e03d orphan-cleanup), since that row pre-existed the call and may be used by other packages"

requirements-completed: [SC-01, SC-05, SC-06]

# Metrics
duration: 10min
completed: 2026-07-19
status: complete
---

# Phase 8 Plan 2: CV-reuse attach-or-new radio Summary

**Attach-or-new radio in the save flow backed by a token-overlap heuristic (cvOverlapRatio/bestCvMatch), an existingCvId attach path in saveApplicationPackage that skips the cvs insert entirely, and null-safe cv_id handling for packages whose CV was later deleted.**

## Performance

- **Duration:** ~10 min (366b541 to f76eb2d)
- **Started:** 2026-07-19T21:18:20+02:00
- **Completed:** 2026-07-19T21:25:53+02:00
- **Tasks:** 3 (Task 1 has RED+GREEN commits)
- **Files modified:** 6 (2 new, 4 modified)

## Accomplishments
- `cv-overlap.ts`: pure `cvOverlapRatio`/`bestCvMatch`/`CV_ATTACH_THRESHOLD` (0.8), 10 passing tests, no React/I/O so it runs directly under `node --test`
- `account.ts`: `existingCvId` attach branch in `saveApplicationPackage` (skips the cvs insert, never deletes the reused row on failure); `listCvs`/`updateCvTitle` mirroring the existing `listPackages`/`updatePackageTitle` pattern; `CvRow` type; `ApplicationPackageRow.cv_id` now `string | null` and `status: string | null` added for migration 0004's schema
- `i18n.tsx`: `cvs.*` save-flow key group added to `Dict` + `en` + `de` in lockstep, German lifted verbatim from `07-lebenslaeufe.dc.html`'s 1b mockup / 1c copy deck
- `app/page.tsx`: `SaveApplicationButton` renders the attach-or-new radio when the user has 1+ CVs, preselected via `bestCvMatch(currentCvText, cvs)`; `existingCvId` threaded through `onSave` → `handleSavePackage` → `saveApplicationPackage`; `handleLoadPackage`/`handleDuplicatePackage` skip the `cvs` lookup and fall back to empty `resumeText` when `pkg.cv_id` is null

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): cv-overlap.ts failing tests** - `366b541` (test)
2. **Task 1 (GREEN): cv-overlap.ts implementation** - `39f2e6d` (feat)
3. **Task 2: account.ts attach path + listCvs/updateCvTitle + cvs.\* i18n** - `7dc77ae` (feat)
4. **Task 3: attach-or-new radio + existingCvId threading + null cv_id guards** - `f76eb2d` (feat)

**Plan metadata:** committed alongside this summary.

_Note: Task 1 is `tdd="true"` per the plan frontmatter - RED then GREEN, as required._

## Files Created/Modified
- `scanready/src/lib/cv-overlap.ts` - Pure token-overlap heuristic (`cvOverlapRatio`, `bestCvMatch`, `CV_ATTACH_THRESHOLD`)
- `scanready/src/lib/__tests__/cv-overlap.test.ts` - 10 behavior tests (identical/disjoint/subset/empty/threshold cases)
- `scanready/src/lib/account.ts` - `existingCvId` attach branch, `listCvs`, `updateCvTitle`, `CvRow` type, nullable `cv_id`/`status` on `ApplicationPackageRow`
- `scanready/src/lib/__tests__/account.test.ts` - Attach-path tests (no cvs insert, no delete-on-limit-error) + `listCvs`/`updateCvTitle` accounts-disabled no-op tests
- `scanready/src/lib/i18n.tsx` - `cvs.*` key group in `Dict`/`en`/`de`
- `scanready/src/app/app/page.tsx` - Attach-or-new radio in `SaveApplicationButton`; `cvs`/`currentCvText` threaded through `ResultView`/`CoverLetterResultView`/`AppShell`; null-`cv_id` guards in `handleLoadPackage`/`handleDuplicatePackage`
- `scanready/package.json` - Added `cv-overlap.test.ts` to the explicit test file list

## Decisions Made
- `cvOverlapRatio`: intersection-over-smaller-set rather than Jaccard, so a trimmed/shortened edit of the same CV still crosses the 0.8 threshold (see key-decisions above)
- `cvsAttachMeta` called with a literal `0` usage count in the save-flow picker since `SaveApplicationButton` doesn't fetch packages; the real grouped count is deferred to 08-03's `/konto` section, which already has `listPackages()` results in scope
- Kept the attach-path's package-insert failure handling free of any cvs delete (unlike save-as-new's 895e03d fix) since the reused row pre-existed the call

## Deviations from Plan

None - plan executed exactly as written. The three tasks, their file lists, and their acceptance criteria were all followed as specified; no Rule 1-4 auto-fixes were needed.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. (Migration 0004's live apply remains blocked on the paused Supabase project per 08-01's founder gate; this plan's TypeScript changes target that schema but do not touch the live DB.)

## Next Phase Readiness
- `listCvs`/`updateCvTitle`/`CvRow` are ready for 08-03's `/konto` "Meine Lebensläufe" section to consume directly
- `ApplicationPackageRow.status` is typed and ready for 08-04's status feature
- Full test suite (136 tests), `tsc --noEmit`, and `next build` all green
- No em-dash in any touched file; new German copy (`cvsAssignLabel`, `cvsAttachOption`, `cvsNewOption`, `cvsNewOptionHint`, `cvsSnapshotNote`, `cvsAttachMeta`) is lifted verbatim from the 07-lebenslaeufe.dc.html deck but still flagged for native-speaker review alongside the rest of this phase's copy (per the standing founder gate in `scanready/docs/humanizer-golive.md`)

---
*Phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created/modified files and all four task commit hashes (366b541, 39f2e6d, 7dc77ae, f76eb2d) verified present.
