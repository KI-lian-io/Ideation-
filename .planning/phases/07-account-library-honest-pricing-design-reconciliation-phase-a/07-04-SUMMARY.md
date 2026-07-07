---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
plan: 04
subsystem: ui
tags: [react, nextjs, i18n, accounts, save-flow]

# Dependency graph
requires:
  - phase: 07-01
    provides: SavedConfirmationPanel and InlineRenameField ui.tsx primitives
provides:
  - Save card (title field pre-filled + pre-selected from derivePackageTitle, provenance line, contents-reminder line, Speichern/Abbrechen) on both the Lebenslauf and Anschreiben result views
  - In-place saved-confirmation panel (checkmark, timestamp, editable title via InlineRenameField wired to updatePackageTitle, library link) replacing the card on success
  - save.* i18n keys (saveLabel, saveSuggestionHint, saveContents, saveConfirmed, saveConfirmedLink, saveCancelCta, saveTitleAriaLabel, saveRenameAria) in both en and de
affects: [07-05, 07-06, 07-07, 07-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SaveApplicationButton's state union ('idle'|'saving'|'saved'|'signed_out'|'limit'|'error') is extended, not replaced: the idle/saving/signed_out/limit/error states all render the same save-card shell (title field + provenance + contents + Speichern/Abbrechen), only 'saved' swaps in SavedConfirmationPanel"
    - "SavedConfirmationPanel's single `timestamp` prop carries a composed string (`${t.saveConfirmed} · ${savedAt}`) since the primitive (built in 07-01, out of this plan's files_modified) exposes no separate label slot"
    - "Renaming after save calls the pre-existing updatePackageTitle helper (src/lib/account.ts) directly - optimistic update with revert-on-failure, gated behind the pencil affordance, never automatic"

key-files:
  created: []
  modified:
    - scanready/src/lib/i18n.tsx
    - scanready/src/app/app/page.tsx

key-decisions:
  - "Abbrechen resets the title input back to the derivePackageTitle suggestion rather than closing/hiding the card - the card is always mounted (no separate open/expand step per this plan's literal task text), so there is nothing else for 'cancel' to discard"
  - "The Speichern button label was shortened from the old single-flow 'Save application'/'Bewerbung speichern' sentence to the compact 'Save'/'Speichern' matching the design mockup's card button, reusing the existing saveApplicationCta key rather than adding a new one"

requirements-completed: [SC-02]

# Metrics
duration: 20min
completed: 2026-07-07
status: complete
---

# Phase 07 Plan 04: A2 Save Moment (save card + saved-confirmation panel) Summary

**SaveApplicationButton rebuilt into a save card with a pre-filled/pre-selected editable title on both result views, replaced in place by SavedConfirmationPanel (checkmark, timestamp, editable title, library link) on success, saving still explicit-click-only.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-07T10:00:00Z (approx.)
- **Completed:** 2026-07-07T10:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Lifted the surface-05 save-moment copy deck verbatim into `i18n.tsx`: `saveLabel`, `saveSuggestionHint`, `saveContents`, `saveConfirmed`, `saveConfirmedLink` (from the `.dc.html` 1c table) plus `saveCancelCta`, `saveTitleAriaLabel`, `saveRenameAria` (button/aria-label copy visible in the same mock but not in the dotted-key table), added to both `en` and `de` under the `satisfies Dict` guard.
- Rebuilt `SaveApplicationButton` into a save card mounted on both `ResultView` (Lebenslauf) and `CoverLetterResultView` (Anschreiben): title input pre-filled AND pre-selected (via `onFocus={(e) => e.target.select()}`) from `derivePackageTitle(jobPosting)`, a provenance caption ("Vorschlag aus der Stellenanzeige"), a contents-reminder line, and Speichern/Abbrechen buttons - rendered for every state except `'saved'`.
- On successful save, the card is replaced in place by `SavedConfirmationPanel`: checkmark + composed "Gespeichert · HH:MM" timestamp, an editable title (pencil affordance opens `InlineRenameField`, Enter commits via the pre-existing `updatePackageTitle` helper with optimistic-update-and-revert-on-failure), and a library link to `/konto`.
- `handleSavePackage` now takes the card's title-input value as `packageTitle` instead of deriving it itself; both call sites (`onSavePackage={(title) => handleSavePackage(null, title)}` / `(letterText, title)`) updated. `onSave` remains reachable only from the Speichern click handler - no blur/effect/navigation-driven save path exists.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lift surface-05 save.* copy into i18n.tsx** - `5c6336c` (feat)
2. **Task 2: Rebuild SaveApplicationButton into a save card on both result views** - `d1b11f2` (feat)

**Plan metadata:** committed separately after this summary (see final commit).

## Files Created/Modified

- `scanready/src/lib/i18n.tsx` - added `save.*` keys to the `Dict` type and both `en`/`de` literals; shortened `saveApplicationCta` to the compact button label
- `scanready/src/app/app/page.tsx` - rebuilt `SaveApplicationButton` (save card + `SavedConfirmationPanel` swap, `PencilGlyph` local helper), added `jobPosting` prop to `ResultView`, updated `onSavePackage`/`handleSavePackage` signatures to thread the card's title value through to `saveApplicationPackage`

## Decisions Made

- Abbrechen resets the title field to the suggestion rather than acting as a dismiss/close control, since the card has no separate collapsed state in this plan's scope.
- `SavedConfirmationPanel`'s single `timestamp` prop is used to carry both "Gespeichert" and the HH:MM time (composed string) since the primitive itself is out of this plan's `files_modified` and exposes no separate status-label slot.

## Deviations from Plan

None - plan executed exactly as written. `updatePackageTitle` already existed in `src/lib/account.ts` (built ahead of this phase), so the pencil affordance was wired to a real write immediately rather than deferring to the gallery plan, per the plan's own "if not yet wired here" fallback clause.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The save card and `SavedConfirmationPanel` are live on both result views; a signed-in user can now save an application under an editable title and see real confirmation, which is the surface the account library (07-05+) will browse.
- `updatePackageTitle` is now exercised from the tool flow (not just planned for the gallery), so 07-05's gallery rename control has a working precedent to match.
- The `state === 'limit'` branch is left as-is (plain hint paragraph) inside the card per plan instruction; 07-06's `StorageGate` replaces its content next.

---
*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Completed: 2026-07-07*

## Self-Check: PASSED

Both task commit hashes (`5c6336c`, `d1b11f2`) are present in `git log`; `scanready/src/lib/i18n.tsx` and `scanready/src/app/app/page.tsx` exist and contain the claimed `save.*` keys and `SavedConfirmationPanel`/`InlineRenameField` usage; `npx tsc --noEmit` and `npm test` (121/121) both exit 0.
