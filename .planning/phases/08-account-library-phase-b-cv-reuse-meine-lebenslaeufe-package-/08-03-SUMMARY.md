---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
plan: 03
subsystem: account-library
tags: [react, typescript, supabase, i18n, cv-reuse]

# Dependency graph
requires:
  - phase: 08-02
    provides: listCvs/updateCvTitle/CvRow (account.ts) that this plan's KontoClient section consumes directly, plus the cvs.* i18n key-group convention
provides:
  - "?cv=<id>" deep-link bridge in AppShell's one-shot query-string effect, mirroring the existing ?package=&action= bridge
  - "Meine Lebenslaeufe" section on /konto (CvSection/CvCard) with usage counts, inline rename, safe delete
  - cvs.* /konto-section i18n key group (heading, usage, Stand label, kebab items, delete note, empty state)
affects: [08-04 (status feature will add a StatusChip to PackageCard in the same file)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-CV usage count derived client-side from already-fetched listPackages() rows grouped by cv_id, no new SQL query (same convention as packageCompanyCity)"
    - "CV delete is a plain owner-scoped table delete with no RPC and no application_packages write; safety comes entirely from migration 0004's `on delete set null` FK, not from application code"

key-files:
  created: []
  modified:
    - scanready/src/app/app/page.tsx
    - scanready/src/lib/i18n.tsx
    - scanready/src/app/konto/KontoClient.tsx

key-decisions:
  - "cvsMenuRename and its Enter/Esc helper text reuse libraryMenuRename/libraryRenameHelper directly (identical wording to the packages gallery) instead of duplicating a new i18n key, per the plan's explicit reuse-if-identical instruction"
  - "'Neue Bewerbung mit diesem CV' and 'Ansehen' both resolve to the same handleReuse -> /app?cv=<id> bridge: viewing a CV IS loading it into the tool, there is no separate read-only preview surface"
  - "Delete confirmation composes from the two required keys (t.cvsMenuDelete + t.cvsDeleteNote) via window.confirm rather than adding a dedicated cvsDeleteConfirm key, since KebabMenu's item shape has no room for an inline note under a destructive item"
  - "Shipped as a section on the existing single-scroll /konto (parity with PassSection/SavedPackagesSection/SubscriptionSection) rather than the tab bar shown in the 07 mockup - explicitly flagged as planner's discretion in the plan"

requirements-completed: [SC-02, SC-05, SC-06]

# Metrics
duration: 12min
completed: 2026-07-19
status: complete
---

# Phase 8 Plan 3: CV-reuse Meine Lebenslaeufe section Summary

**"Meine Lebenslaeufe" section on /konto listing saved CVs with per-CV usage counts (derived from packages grouped by cv_id), inline rename, safe delete, and a "Neue Bewerbung mit diesem CV" action that lands the CV text back into the tool via a new `?cv=` deep-link bridge.**

## Performance

- **Duration:** ~12 min (09ff2f6 to fca7571)
- **Started:** 2026-07-19T21:32:20+02:00 (after 08-02's plan-metadata commit)
- **Completed:** 2026-07-19T21:37:59+02:00
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `app/page.tsx`: the existing one-shot `?package=&action=` deep-link effect now also handles `?cv=<id>` - fetches the `cvs` row via the RLS-scoped browser client (a foreign id resolves to `null` and changes nothing), dispatches `SET_RESUME_TEXT`, and leaves `state.phase` at `input` so the user still clicks Convert explicitly (no auto-parse from a mere navigation)
- `KontoClient.tsx`: new `CvSection`/`CvCard` rendered below `SavedPackagesSection`, modeled directly on it - `listCvs()` + `listPackages()` fetched once on mount, usage count computed client-side (`packages.filter(p => p.cv_id === cv.id).length`), `EmptyState` when the user has no CVs, `SheetCard`/`MonoBadge`/`KebabMenu`/`InlineRenameField` reused as-is
- Kebab menu order matches the 07 mockup's stated priority: `Neue Bewerbung mit diesem CV` (primary reuse action, first) / `Ansehen` (same bridge) / `Umbenennen` (`updateCvTitle`) / destructive `Loeschen` (plain `cvs` delete, confirm carries the "Bewerbungen behalten ihre Kopie" note)
- `i18n.tsx`: `cvsHeading`/`cvsUsage`/`cvsStandLabel`/`cvsMenuNewApplication`/`cvsMenuView`/`cvsMenuDelete`/`cvsDeleteNote`/`cvsEmptyStatus`/`cvsEmptyBody`/`cvsEmptyCta` added to `Dict` + `en` + `de` in lockstep; German lifted verbatim from `07-lebenslaeufe.dc.html`'s 1a mockup ("Meine Lebensläufe", "Neue Bewerbung mit diesem CV", "Ansehen", "Löschen", "Bewerbungen behalten ihre Kopie.") and 1c copy deck ("In {count} Bewerbungen verwendet")

## Task Commits

Each task was committed atomically:

1. **Task 1: ?cv= deep-link bridge in the tool** - `09ff2f6` (feat)
2. **Task 2: Meine Lebenslaeufe section on /konto + cvs.\* /konto copy** - `fca7571` (feat)

**Plan metadata:** committed alongside this summary.

## Files Created/Modified
- `scanready/src/app/app/page.tsx` - `?cv=<id>` branch added to the existing `?package=&action=` one-shot deep-link effect
- `scanready/src/lib/i18n.tsx` - `cvs.*` /konto-section key group in `Dict`/`en`/`de`
- `scanready/src/app/konto/KontoClient.tsx` - new `CvSection`/`CvCard`, `listCvs`/`updateCvTitle`/`CvRow` imports, rendered between `SavedPackagesSection` and `SubscriptionSection`

## Decisions Made
- See `key-decisions` in frontmatter above (rename-key reuse, unified reuse/view handler, confirm-dialog composition, section-not-tabs discretion)

## Deviations from Plan

None - plan executed exactly as written. Both tasks, their file lists, and their acceptance criteria were followed as specified; no Rule 1-4 auto-fixes were needed.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. (Migration 0004's live apply remains blocked on the paused Supabase project per 08-01's founder gate; this plan's TypeScript changes target that schema but do not touch the live DB.)

## Next Phase Readiness
- `CvSection`/`CvCard` follow the exact `PackageCard`/badge-row shape 08-04's `StatusChip` needs to slot into the neighboring `PackageCard` without restructuring
- Full test suite (136 tests), `tsc --noEmit`, and `next build` all green
- No em-dash in any touched file; new German copy (`cvsHeading`, `cvsUsage`, `cvsStandLabel`, `cvsMenuNewApplication`, `cvsMenuView`, `cvsMenuDelete`, `cvsDeleteNote`, `cvsEmptyStatus`, `cvsEmptyBody`, `cvsEmptyCta`) is lifted verbatim from `07-lebenslaeufe.dc.html` where the deck provided it (heading, kebab items, delete note, usage line) and newly authored in the same tone otherwise (empty state), all still flagged for native-speaker review alongside the rest of this phase's copy per the standing founder gate in `scanready/docs/humanizer-golive.md`

---
*Phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-*
*Completed: 2026-07-19*

## Self-Check: PASSED

All modified files (`scanready/src/app/app/page.tsx`, `scanready/src/lib/i18n.tsx`, `scanready/src/app/konto/KontoClient.tsx`) and both task commit hashes (09ff2f6, fca7571) verified present.
