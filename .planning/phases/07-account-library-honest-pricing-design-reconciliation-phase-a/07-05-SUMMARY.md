---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
plan: 05
subsystem: ui
tags: [react, nextjs, i18n, accounts, supabase]

# Dependency graph
requires:
  - phase: 07-01
    provides: "SheetCard, KebabMenu, InlineRenameField, MonoBadge, EmptyState, BottomSheet ui.tsx primitives"
  - phase: 07-02
    provides: "updatePackageTitle helper in account.ts"
  - phase: 07-04
    provides: "save card + SavedConfirmationPanel on both result views (the packages this gallery browses)"
provides:
  - "Card gallery on /konto (SavedPackagesSection) and /app (SavedApplications): mono date + kebab, serif title/inline rename, company middot city, LL/AS/STELLENANZEIGE mono badges (dashed 'fehlt' ghost variant), NUR LESEN/BEARBEITBAR pills, client-side title/company filter"
  - "Kebab actions (Oeffnen/Neue Bewerbung aus dieser/Umbenennen/Loeschen) wired to listPackages/updatePackageTitle/deletePackage with the existing refresh()-after-mutation idiom"
  - "handleDuplicatePackage in app/page.tsx: LOAD_PACKAGE with an empty posting step and no restored Anschreiben, never auto-saving"
  - "Plain window.location query-string bridge (?package=&action=) so /konto's Oeffnen/Neue-Bewerbung-aus-dieser links land on /app and trigger the same handlers"
  - "library.* i18n keys (title, empty state, kebab labels, rename helper, filter placeholder, readonly/editable badges, storage-transparency footer) in both en and de"
affects: [07-06, 07-07, 07-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Read-only rows hide the rename affordance entirely (kebab item omitted via array spread, not a disabled control) while delete always stays available - the RLS-silently-no-ops guardrail applied at the UI layer"
    - "company middot city derived from the package's own saved Lebenslauf (experience[0]), never a separate stored field or invented value"
    - "Cross-page deep link via plain window.location.search + history.replaceState instead of next/navigation's useSearchParams, avoiding a Suspense-boundary requirement for a one-shot /konto -> /app handoff"
    - "Mobile kebab replacement: KebabMenu hidden below sm, a plain 44px trigger button shown below sm that opens a single shared BottomSheet mounted once per gallery"

key-files:
  created: []
  modified:
    - scanready/src/lib/i18n.tsx
    - scanready/src/app/konto/KontoClient.tsx
    - scanready/src/app/app/page.tsx

key-decisions:
  - "packageCompanyCity() is duplicated (not extracted to a shared lib) in KontoClient.tsx and app/page.tsx - a five-line pure derivation with no other shared import between the two files, per the plan's files_modified scope"
  - "BEARBEITBAR/NUR LESEN pills only render once at least one package in the list is read_only (anyReadOnly), matching the design's downgrade-state (1c) mockup rather than showing an editable pill on every card in the common all-editable case (1a)"
  - "Storage-transparency footer uses the exact trimmed sentence from 07-CONTEXT.md's extra_constraints (dropping the deck's 'Ein gespeichertes Paket enthaelt' / 'A saved package contains' preamble) since the plan explicitly specified that literal string as the required footer copy"
  - "/konto's Oeffnen and Neue Bewerbung aus dieser navigate to /app?package=<id>&action=open|duplicate (plain window.location.assign) since /konto has no tool reducer to load a package into; app/page.tsx reads and strips that query string once per session settle via a plain URLSearchParams read, not useSearchParams"
  - "'Delete all saved data' and 'Datenschutz Paragraph 7' footer links from the design mockup were reduced to a single Datenschutz link (reusing the existing humanizerPrivacyLink copy) - a full delete-all-packages action isn't in this plan's scope (account.ts has no such helper) and the existing DangerZoneSection already covers full account deletion"

requirements-completed: [SC-01]

# Metrics
duration: 25min
completed: 2026-07-07
status: complete
---

# Phase 07 Plan 05: A2 Library Gallery (Design Surface 01) Summary

**Both /konto and /app now render saved application packages as the design surface-01 card gallery (mono date + kebab, serif title, company middot city, LL/AS/STELLENANZEIGE badges) with inline rename, duplicate-and-tailor with an empty posting step, delete-with-confirm, and a client-side filter; read-only rows hide the rename control while delete stays available.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-07T10:40:00Z (approx.)
- **Completed:** 2026-07-07T10:47:12Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Lifted the surface-01 `library.*` copy deck verbatim into `i18n.tsx`: title, empty-state status/body/CTA, kebab action labels (Oeffnen/Neue Bewerbung aus dieser/Umbenennen/Loeschen), the inline-rename helper ("Enter speichern middot Esc abbrechen"), the filter placeholder, the readonly badge/banner, an editable-pill label, the free-tier storage line, and the exact storage-transparency footer sentence from `07-CONTEXT.md` - all added to both `en` and `de` under the `satisfies Dict` guard.
- Rebuilt `SavedPackagesSection` on `/konto` into the card gallery: `SheetCard`-shelled cards with a mono date + `KebabMenu`, a serif title that becomes an `InlineRenameField` on rename (committing via the pre-existing `updatePackageTitle` helper), a company middot city line derived from the package's own saved Lebenslauf, a hairline, and a `MonoBadge` row (LL/AS/STELLENANZEIGE, dashed "fehlt" ghost variant for a missing document, NUR LESEN/BEARBEITBAR pills). Read-only rows render flat (no shadow) and omit the Umbenennen kebab item entirely (delete stays available). Truly-empty state uses the `EmptyState` primitive; a client-side title/company filter and the storage-transparency footer sit below the grid.
- Rebuilt `SavedApplications` on `/app` into the same card gallery (compact, single-column, embedded in the input view), reusing the exact same kebab actions but driving them directly against the page's own reducer/account.ts calls (no cross-page hop needed since the tool state already lives here). On touch the floating `KebabMenu` is replaced by a shared `BottomSheet` (44px targets).
- Added `handleDuplicatePackage` in `app/page.tsx`: dispatches the same `LOAD_PACKAGE` action as the existing `handleLoadPackage`, but with `jobPosting: ''` and no restored Anschreiben - a fresh tailoring pass on the same Lebenslauf that is never auto-saved (a duplicate is only persisted on an explicit Speichern click, going through the same DB limit trigger as any save).
- Wired a plain `window.location`-based query-string bridge (`?package=<id>&action=open|duplicate`) so `/konto`'s Oeffnen/Neue-Bewerbung-aus-dieser links - which have no tool reducer to load a package into - land on `/app` and trigger `handleLoadPackage`/`handleDuplicatePackage` once the signed-in session is confirmed, then strip the query string via `history.replaceState`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lift surface-01 library.* copy into i18n.tsx** - `f6de0da` (feat)
2. **Task 2: Rebuild SavedPackagesSection (KontoClient) as the card gallery** - `2e5b245` (feat)
3. **Task 3: Rebuild /app SavedApplications as the gallery + duplicate-and-tailor** - `16b6d23` (feat)

**Plan metadata:** committed separately after this summary (see final commit).

## Files Created/Modified

- `scanready/src/lib/i18n.tsx` - added `library.*` Dict keys (title, empty state, kebab menu labels, rename helper, filter placeholder, readonly/editable badges, storage-free line, storage-transparency footer) to the type and both `en`/`de` literals
- `scanready/src/app/konto/KontoClient.tsx` - rebuilt `SavedPackagesSection` into the card gallery (`packageCompanyCity` helper, `PackageCard` component, filter state, rename state, open/duplicate navigation to `/app`)
- `scanready/src/app/app/page.tsx` - rebuilt `SavedApplications` into the compact card gallery (own `packageCompanyCity`/`PackageCard`, mobile `BottomSheet`), added `handleDuplicatePackage`, added the `?package=&action=` query-string bridge effect in `AppShell`, threaded `onDuplicatePackage` through `InputView`

## Decisions Made

- `packageCompanyCity()` is a small pure helper duplicated in both files rather than extracted into a shared module, since this plan's `files_modified` scope is exactly these three files and the two galleries share no other import today.
- BEARBEITBAR/NUR LESEN pills only appear once at least one package in the current list is `read_only` (the common all-editable case shows no extra pill), matching the design's downgrade-state mockup rather than the fully-editable mockup.
- The storage-transparency footer renders the exact trimmed sentence given in `07-CONTEXT.md`'s extra constraints (dropping the deck's "Ein gespeichertes Paket enthaelt" / "A saved package contains" preamble), since that literal string is both the plan's explicit instruction and the acceptance-criteria-checked substring.
- `/konto`'s Oeffnen and Neue Bewerbung aus dieser use a plain `window.location.assign('/app?package=...&action=...')` hop (not a shared reducer, since `/konto` has none); `app/page.tsx` reads and clears that query string via `URLSearchParams`/`history.replaceState` rather than `next/navigation`'s `useSearchParams`, avoiding a Suspense-boundary requirement for what is otherwise a fully client-rendered page.
- The design mockup's "Alle gespeicherten Daten loeschen" (delete-all) and "Datenschutz Paragraph 7" footer links were reduced to a single existing Datenschutz link (reusing `t.humanizerPrivacyLink`): a delete-all-packages action has no backing helper in `account.ts` today and is out of this plan's scope, and the pre-existing `DangerZoneSection` already offers full GDPR account deletion.

## Deviations from Plan

None - plan executed exactly as written. The query-string bridge between `/konto` and `/app` was left to Claude's discretion per the plan's own "exact component file layout" / "minor... judgment calls" clause; it was implemented within the plan's existing `files_modified` list (no new files, no new API routes).

## Issues Encountered

- `npx eslint` flags three pre-existing issues in the touched files (a `react-hooks/set-state-in-effect` warning in both `SavedPackagesSection`'s and `SavedApplications`' initial-fetch `useEffect`, and a `no-html-link-for-pages` error on the top-bar wordmark `<a href="/">`). Verified via `git stash` that all three exist identically at the pre-plan HEAD - out of this task's scope per the deviation rules' scope boundary, not fixed.
- An eslint "unused eslint-disable directive" warning on the new query-string bridge effect was self-inflicted (an unnecessary `exhaustive-deps` suppression comment that the rule didn't actually need) - removed it before committing rather than leaving new lint noise.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The library gallery is live on both `/konto` and `/app`, giving 07-04's save moment somewhere real to browse/reuse/manage - `updatePackageTitle`, `listPackages`, and `deletePackage` are all now exercised from two real UI surfaces.
- 07-06 (A3 storage gate) can build directly on the `SaveApplicationButton`'s `state === 'limit'` branch unchanged by this plan; nothing here touches that code path.
- 07-07/07-08's Pass modal and Preise v2 work are unaffected; this plan only touched the gallery surface (surface 01) and its `library.*` copy namespace.
- `next build` passes cleanly with this plan's changes alongside the already-shipped `/api/pass/intent`/`/api/pass/verify` routes from other in-flight phase-7 plans.

---
*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: scanready/src/lib/i18n.tsx (library.* keys present in both en/de)
- FOUND: scanready/src/app/konto/KontoClient.tsx (SheetCard/KebabMenu/MonoBadge/EmptyState present, photoUrl absent)
- FOUND: scanready/src/app/app/page.tsx (SheetCard/KebabMenu/BottomSheet/LOAD_PACKAGE present)
- FOUND commit: f6de0da
- FOUND commit: 2e5b245
- FOUND commit: 16b6d23
- `cd scanready && npx tsc --noEmit && npm test` (121/121) and `npm run build` all exit 0
