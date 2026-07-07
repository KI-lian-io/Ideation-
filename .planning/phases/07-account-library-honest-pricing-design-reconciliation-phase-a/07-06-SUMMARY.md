---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
plan: 06
subsystem: ui
tags: [react, nextjs, i18n, accounts, pricing]

# Dependency graph
requires:
  - phase: 07-01
    provides: "CARD/EYEBROW/btnClass ui.tsx primitives"
  - phase: 07-02
    provides: "listPaketPurchases and PASS_PRICE_CENTS (account.ts / humanizer.ts)"
  - phase: 07-05
    provides: "the save rail (SaveApplicationButton) whose state==='limit' branch this plan replaces"
provides:
  - "StorageGate.tsx: inline dismissible storage-limit chooser (Pass featured + Plus 'Geplant', honest delete-instead footer, 2+-purchase anchor ledger, sessionStorage dismissal)"
  - "gate.* i18n keys (title, subtitle, Pass/Plus card copy, honest footer, parameterized anchor-ledger copy) in both en and de"
  - "StorageGate wired into the save rail's state==='limit' branch, replacing the old single-sentence text hint"
affects: [07-07, 07-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Price display always formatted from the shared *_PRICE_CENTS constants via a small per-file Intl.NumberFormat helper (duplicated from src/app/preise/page.tsx's formatEuroCents, same two-call-site reasoning as packageCompanyCity in 07-05), never a hardcoded price string"
    - "Panels that only ever render inside a fixed-width rail column stack with a plain flex-col, not a viewport-breakpoint Tailwind grid (sm:grid-cols-2 reacts to window width, not container width, and would misrender at desktop viewport widths)"

key-files:
  created:
    - scanready/src/components/StorageGate.tsx
  modified:
    - scanready/src/lib/i18n.tsx
    - scanready/src/app/app/page.tsx

key-decisions:
  - "StorageGate fetches its own anchor data (listPaketPurchases via useAccount()'s user + getSupabaseBrowserClient) rather than taking it as a prop, keeping the call site (app/page.tsx) to a single onChoosePass prop per the plan's 'or fetch it inside' option"
  - "Plus tier's 5,99 EUR/Monat price is a literal i18n string (gatePlusPrice), not derived from a *_PRICE_CENTS constant, because Plus is not yet purchasable and has no Stripe amount anywhere in the codebase - PASS_PRICE_CENTS is the only price this task's acceptance criteria required to come from a constant"
  - "The Pass/Plus cards render in a single flex-col stack always, not a responsive 2-col grid, because StorageGate only ever renders inside the ~340px save rail regardless of viewport width - a mid-build deviation from a design mockup detail (the 1a anatomy view happens to show a wide 720px 2-column layout) toward the mockup's own 1c 'in context' view, which stacks the same two cards vertically"
  - "onChoosePass's fallback (until 07-07 ships PassModal) navigates via window.location.assign('/preise') rather than /app's own reducer, since there is no Pass-purchase state machine in this plan's scope yet"

requirements-completed: [SC-05]

# Metrics
duration: 25min
completed: 2026-07-07
status: complete
---

# Phase 07 Plan 06: A3 Storage-Gate Chooser (Design Surface 02) Summary

**New StorageGate.tsx replaces the state==='limit' text hint with an inline dismissible Pass-vs-Plus chooser, anchored on the signed-in user's real paket spend once they have 2+ purchases, with sessionStorage dismissal and zero countdown/scarcity copy.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-07T11:00:00Z (approx.)
- **Completed:** 2026-07-07T11:25:00Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Lifted the surface-02 `gate.*` copy deck verbatim into `i18n.tsx`: eyebrow, title, subtitle, the Pass card (name, "Empfohlen" badge, price-unit string, two feature lines, CTA, the honest "läuft automatisch aus" line), the Plus card (name, "Geplant" badge, price, price-unit, two feature lines, "Benachrichtigen lassen" CTA, the honest cancellation-terms line), the delete-instead footer + "Später" dismiss label, and the parameterized anchor-ledger copy (line-item date formatter, sum label, Pass-comparison label, the full anchor sentence, and the Pass CTA with an inlined price) - 29 new keys total, added to both `en` and `de` under the `satisfies Dict` guard.
- Built `StorageGate.tsx`: a `'use client'` inline panel (never a modal) that reads its own dismissal flag from sessionStorage on mount and writes it back on dismiss, mirroring the paid-attempt persistence idiom already used elsewhere in `app/page.tsx`. It fetches the signed-in user's paket purchase history via `listPaketPurchases` (RLS select-own) and renders the two-card Pass/Plus chooser by default, or - only once there are 2+ paket purchases - an anchor variant showing a real mono ledger of the user's own purchase dates/amounts, a running sum, a comparison line against the Pass price, and the same parameterized sentence from the copy deck. All prices route through a small `Intl.NumberFormat`-based helper reading `PASS_PRICE_CENTS`, never a hardcoded "14,99".
- Wired `StorageGate` into the save rail's `state === 'limit'` branch in `app/page.tsx`, replacing the old single-sentence `saveApplicationLimitHint` paragraph. `onChoosePass` currently falls back to `window.location.assign('/preise')` with a code comment noting 07-07 replaces this with opening the real `PassModal`.
- Mid-build fix: the Pass/Plus cards were initially laid out as a `grid-cols-1 sm:grid-cols-2`, matching the design deck's wide 1a anatomy view. Since `StorageGate` only ever renders inside the narrow (~340px) save rail, that Tailwind breakpoint reacts to *viewport* width, not the rail's own width, and would have squeezed two cards into a 340px column on any normal desktop window. Corrected to always stack vertically (`flex flex-col`), matching the deck's own 1c "in context" view.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lift surface-02 gate.* copy into i18n.tsx** - `6017342` (feat)
2. **Task 2: Build the StorageGate component** - `ef92b34` (feat), `1731603` (fix - stack cards vertically), `ea574cc` (fix - silence set-state-in-effect lint on the sessionStorage read)
3. **Task 3: Wire StorageGate into the save-rail limit branch** - `20768f8` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified

- `scanready/src/components/StorageGate.tsx` - new: the inline dismissible storage-gate panel, its `DefaultVariant` (Pass/Plus chooser) and `AnchorVariant` (purchase-history ledger) sub-components, and the local `formatEuroCents`/`formatPurchaseDate` helpers
- `scanready/src/lib/i18n.tsx` - added the `gate.*` `Dict` keys (29 keys) to the type and both `en`/`de` literals
- `scanready/src/app/app/page.tsx` - imported `StorageGate`, replaced the `state === 'limit'` text-hint paragraph with `<StorageGate onChoosePass={...} />`

## Decisions Made

- The anchor ledger's line-item and sum labels distinguish the literal "Zwei Pakete gekauft"/"Two packages bought" wording from the design deck (exactly at count 2) from a generalized `"${count} Pakete gekauft"` form for any higher count, since the deck only illustrates the 2-purchase case but the underlying data can hold more.
- `formatPurchaseDate` always renders `de-DE` `DD.MM.YYYY` regardless of UI language, matching the deck's ledger format - this is a financial/receipt-style formatting decision (like `savedAt`'s existing `de-DE` time format elsewhere in this file), not a UI-chrome translation.
- Kept `gatePassName`/`gatePlusName` ("Bewerbungsphase-Pass"/"ScanReady Plus") identical in both language dictionaries, the same convention already used for `paketEyebrow`/`humanizerEyebrow` product names.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a viewport-breakpoint grid that would misrender inside the narrow save rail**
- **Found during:** Task 2 (Build the StorageGate component)
- **Issue:** The Pass/Plus two-card layout used `grid-cols-1 sm:grid-cols-2`, a Tailwind viewport breakpoint. Since `StorageGate` only ever renders inside the ~340px save rail (never at the design deck's wide 720px standalone width), a normal desktop browser window would trigger the `sm:` breakpoint and squeeze both cards into the narrow rail column instead of stacking them.
- **Fix:** Changed the container to a plain `flex flex-col` so the cards always stack vertically, matching the deck's own 1c "in context" view (the actual shipping placement).
- **Files modified:** `scanready/src/components/StorageGate.tsx`
- **Verification:** `npx tsc --noEmit` clean; visual layout now matches the narrow-rail design reference at any viewport width.
- **Committed in:** `1731603`

**2. [Rule 3 - Blocking] Fixed the set-state-in-effect lint error on the sessionStorage dismissal read**
- **Found during:** Task 3 verification (running `npx eslint` across the touched files as part of the CLAUDE.md-driven pre-commit check)
- **Issue:** `npx eslint src/components/StorageGate.tsx` reported an error for calling `setDismissed` synchronously inside the post-mount `useEffect` reading sessionStorage.
- **Fix:** Added the same `eslint-disable-next-line react-hooks/set-state-in-effect` suppression, with the same justifying comment, that `i18n.tsx`'s `LangProvider` already uses for its own hydration-safe post-mount localStorage read - the identical, already-accepted pattern in this codebase.
- **Files modified:** `scanready/src/components/StorageGate.tsx`
- **Verification:** `npx eslint src/components/StorageGate.tsx` now reports zero problems.
- **Committed in:** `ea574cc`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking lint fix)
**Impact on plan:** Both fixes are necessary for correct rendering and a clean lint pass; no scope creep beyond `StorageGate.tsx`.

## Issues Encountered

- `npx eslint` on `src/app/app/page.tsx` still reports the same 3 pre-existing issues flagged in 07-05's summary (the gallery fetch effect's `set-state-in-effect`, an unused `exhaustive-deps` disable directive, and the top-bar wordmark's `no-html-link-for-pages`). Confirmed via `git stash` that all three exist identically before this plan's Task 3 edit - out of this task's scope per the deviation rules' scope boundary, not fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `StorageGate` is live in the save rail; hitting the free storage limit now shows the honest Pass/Plus chooser instead of a plain sentence, with the anchor ledger appearing automatically once a user has bought 2+ Pakete.
- `onChoosePass`'s `/preise` fallback is the explicit seam 07-07 replaces: swap it for opening the real `PassModal` once that plan ships, no other change needed in `StorageGate.tsx` or its call site.
- `npx tsc --noEmit`, `npm test` (121/121), and `npm run build` all pass cleanly with this plan's changes on top of the already-shipped `/api/pass/intent`/`/api/pass/verify` routes and the account library (07-05).

---
*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: scanready/src/components/StorageGate.tsx
- FOUND: scanready/src/lib/i18n.tsx (gate.* keys present in both en/de)
- FOUND: scanready/src/app/app/page.tsx (StorageGate wired into state==='limit' branch)
- FOUND commit: 6017342
- FOUND commit: ef92b34
- FOUND commit: 1731603
- FOUND commit: ea574cc
- FOUND commit: 20768f8
- `cd scanready && npx tsc --noEmit && npm test` (121/121) and `npm run build` all exit 0
