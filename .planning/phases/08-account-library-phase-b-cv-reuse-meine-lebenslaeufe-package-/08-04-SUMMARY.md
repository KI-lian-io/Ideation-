---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
plan: 04
subsystem: account-library
tags: [react, typescript, supabase, i18n, status-tracking]

# Dependency graph
requires:
  - phase: 08-01
    provides: migration 0004_library_phase_b.sql's set_package_status RPC + application_packages.status column (live apply still blocked on the paused Supabase project; this plan's TypeScript targets that schema)
  - phase: 08-03
    provides: PackageCard/CvSection layout convention this plan slots StatusChip into without restructuring
provides:
  - setPackageStatus(client, packageId, status) RPC caller (account.ts)
  - StatusChip primitive (ui.tsx) - five-state pill/dropdown, reuses KebabMenu's focusTrap
  - status.* i18n key group (five state labels + set/undo/auto-suggest/aria affordances)
  - StatusChip wired into both galleries' PackageCard badge rows (not gated on read_only) + status-aware filters
  - AppShell auto-suggest: first export/copy of a saved package sets status to 'beworben' with an inline undoable notice
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "StatusChip reuses KebabMenu's exact focusTrap/outside-click/Escape lifecycle rather than duplicating it - only the trigger's two visual states (set-status pill vs. null ghost) and the check-marked option list are new"
    - "Status is the ONE write in account.ts that must NOT be hidden on read_only rows (deliberate inverted exception to updatePackageTitle's convention) - safety comes from the RPC's ownership-only check, not from client-side gating"
    - "hasSuggestedStatus is a ref (not state) so the once-only guard is read/written synchronously, closing the race window where handleCopy and a near-simultaneous handleDownload could both pass the check before either write lands"

key-files:
  created: []
  modified:
    - scanready/src/lib/account.ts
    - scanready/src/lib/__tests__/account.test.ts
    - scanready/src/components/ui.tsx
    - scanready/src/lib/i18n.tsx
    - scanready/src/app/app/page.tsx
    - scanready/src/app/konto/KontoClient.tsx

key-decisions:
  - "A new save resets hasSuggestedStatus/statusSuggestionVisible for the freshly-saved package (addition beyond the plan's literal wording, Rule 2 correctness): saveApplicationPackage always inserts a new row, so without this reset a second save in the same AppShell mount would silently inherit the first package's already-suggested state"
  - "handleReset also clears savedPackageId/hasSuggestedStatus/statusSuggestionVisible: a fresh start-over means no saved row is in scope until the user saves again, matching the existing paket-unlock reset in the same function"
  - "statusOptions()/statusLabelFor() are duplicated per-file (app/page.tsx and KontoClient.tsx) rather than shared, following the existing packageCompanyCity precedent (07-05 key-decision: a five-line pure derivation with no other shared import between the two files)"
  - "Chevron direction (open vs. closed) is done via a CSS rotate on one glyph rather than swapping SVG paths, matching the mockup's visual intent without adding a second glyph component"

requirements-completed: [SC-03, SC-05, SC-06]

# Metrics
duration: 25min
completed: 2026-07-19
status: complete
---

# Phase 8 Plan 4: Status chip Summary

**Per-package status chip (Entwurf/Beworben/Interview/Absage/Zusage) on every package card in both galleries, editable via a never-cycling dropdown that stays active on read-only rows because writes route through the ownership-checked `set_package_status` RPC, plus an inline undoable auto-suggest to "Beworben" on the first export or copy of a saved package.**

## Performance

- **Duration:** ~25 min (60f1064 to 355fd72)
- **Started:** 2026-07-19 (after 08-03's plan-metadata commit)
- **Completed:** 2026-07-19
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `account.ts`: `setPackageStatus(client, packageId, status)` calls the `set_package_status` RPC (migration 0004), `accountsEnabled()`-gated, returning `{ok, message?}`. Documented as the deliberate INVERTED exception to `updatePackageTitle`'s read_only convention - this is the one write that must stay visible/editable on read-only rows, since status is package metadata, not document content, and the RPC's own `user_id = auth.uid()` check is what keeps it safe.
- `account.test.ts`: three new tests - accounts-disabled no-op, correct `rpc('set_package_status', {package_id, new_status})` call shape, and RPC-error passthrough.
- `ui.tsx`: `StatusChip` primitive exported alongside `KebabMenu` - a badge-shaped trigger (five-state pill with a colored dot + chevron, or a dashed ghost "Status setzen" pill when unset) that opens a floating menu of the five states in pipeline order with a check on the current value. Reuses `KebabMenu`'s exact `focusTrap`/outside-click/Escape lifecycle (no duplicated trap logic) and never cycles on click - the trigger only toggles `open`.
- `i18n.tsx`: `status.*` key group added to `Dict`/`en`/`de` in lockstep - the five state labels (`statusEntwurf`/`Beworben`/`Interview`/`Absage`/`Zusage`) lifted verbatim from `08-status.dc.html`'s copy deck, plus `statusSetLabel`/`statusUndo`/`statusAutoSuggestNote`/`statusChangeAria` newly authored in the same tone.
- `app/page.tsx` + `KontoClient.tsx`: `StatusChip` rendered at the right end of both `PackageCard` badge rows, explicitly NOT gated on `read_only` (each site carries an inline comment documenting the deliberate exception); `onStatusChange` calls `setPackageStatus` then `refresh()` in each owning section (`SavedApplications`, `SavedPackagesSection`). Both galleries' client-side filters now also match the i18n status label text via a small `statusOptions()`/`statusLabelFor()` helper duplicated per-file (same convention as `packageCompanyCity`).
- `app/page.tsx` (AppShell): `savedPackageId` state tracks the row a `Speichern` click just saved; `suggestBeworben()` (guarded by a synchronous `hasSuggestedStatus` ref) fires from `handleExportLebenslaufPdf`/`handleExportLetterPdf` and from `onFirstExportOrCopy`, threaded into `ResultView`'s and `CoverLetterResultView`'s `handleCopy`/`handleDownload`. An inline `aria-live` notice with a `Rueckgaengig`/`Undo` button (reverting status to `entwurf`) renders beside each view's `SaveApplicationButton` - never a modal. A new save or a full reset both clear the suggestion state so a fresh package gets its own once-only nudge.

## Task Commits

Each task was committed atomically:

1. **Task 1: setPackageStatus caller + StatusChip primitive + status.\* copy** - `60f1064` (feat)
2. **Task 2: StatusChip in both galleries + status-aware filter** - `1f8996f` (feat)
3. **Task 3: auto-suggest 'beworben' on first export/copy + inline undo** - `355fd72` (feat)

**Plan metadata:** committed alongside this summary.

## Files Created/Modified

- `scanready/src/lib/account.ts` - `setPackageStatus` RPC caller
- `scanready/src/lib/__tests__/account.test.ts` - `setPackageStatus` disabled-gate/rpc-shape/error tests
- `scanready/src/components/ui.tsx` - `StatusChip` + `StatusChipOption` export, `ChevronGlyph`, `STATUS_DOT_CLASS`
- `scanready/src/lib/i18n.tsx` - `status.*` key group in `Dict`/`en`/`de`
- `scanready/src/app/app/page.tsx` - `StatusChip` in `PackageCard`, `statusOptions`/`statusLabelFor` helpers, filter update, `savedPackageId`/`hasSuggestedStatus`/`suggestBeworben`/inline undo notice in `AppShell`, `onFirstExportOrCopy` threaded into `ResultView`/`CoverLetterResultView`
- `scanready/src/app/konto/KontoClient.tsx` - `StatusChip` in `PackageCard`, `statusOptions`/`statusLabelFor` helpers, filter update, `handleStatusChange` in `SavedPackagesSection`

## Decisions Made

See `key-decisions` in frontmatter above (reset-on-new-save, reset-on-full-reset, per-file helper duplication, CSS-rotate chevron).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - missing correctness] Reset the once-only suggestion guard on a new save and on full reset**
- **Found during:** Task 3
- **Issue:** The plan's literal wording sets `hasSuggestedStatus.current = true` once per `AppShell` mount and never resets it. Since `saveApplicationPackage` always inserts a NEW row per save (never updates an existing one), a second `Speichern` click within the same mount (e.g. via the "New Anschreiben, same Lebenslauf" continuation path) would silently inherit the first package's already-suggested state and never nudge the second package's status.
- **Fix:** `handleSavePackage` resets `hasSuggestedStatus.current = false` and `statusSuggestionVisible = false` whenever a save succeeds with a new `packageId`; `handleReset` does the same alongside its existing `clearPaket()` call.
- **Files modified:** `scanready/src/app/app/page.tsx`
- **Commit:** `355fd72`

None of the other deviations rose to Rule 1-4 - the rest of the plan (RPC shape, StatusChip mechanics, gallery wiring, copy) was implemented as specified.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (Migration 0004's live apply remains blocked on the paused Supabase project per 08-01's founder gate; this plan's TypeScript changes target that schema but do not touch the live DB.)

## Next Phase Readiness

- `StatusChip`, `setPackageStatus`, and the `status.*` i18n group are complete and self-contained; no further phase depends on this plan's output per the roadmap (`affects: []`).
- Full test suite (139 tests), `tsc --noEmit`, and `next build` all green.
- No em-dash in any touched file; new German copy (`statusSetLabel`, `statusUndo`, `statusAutoSuggestNote`, `statusChangeAria`) is newly authored in the same tone as the rest of the phase (the five state labels themselves are lifted verbatim from `08-status.dc.html`), still flagged for native-speaker review alongside the rest of this phase's copy per the standing founder gate in `scanready/docs/humanizer-golive.md`.

---
*Phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-*
*Completed: 2026-07-19*

## Self-Check: PASSED

All modified files (`scanready/src/lib/account.ts`, `scanready/src/lib/__tests__/account.test.ts`, `scanready/src/components/ui.tsx`, `scanready/src/lib/i18n.tsx`, `scanready/src/app/app/page.tsx`, `scanready/src/app/konto/KontoClient.tsx`) and all three task commit hashes (60f1064, 1f8996f, 355fd72) verified present.
