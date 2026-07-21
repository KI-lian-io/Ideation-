---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
plan: 01
subsystem: ui
tags: [tailwind-v4, react, nextjs-metadata, favicon, a11y]

# Dependency graph
requires: []
provides:
  - shadow-sheet / shadow-sheet-hero / shadow-modal Tailwind v4 @theme tokens
  - Seven ui.tsx primitives (SheetCard, MonoBadge, EmptyState, SavedConfirmationPanel, InlineRenameField, KebabMenu, BottomSheet) for the library/save/storage-gate surfaces
  - Six founder brand SVGs in public/, favicon.ico regenerated, layout.tsx icons + openGraph.images wired
  - Branded /not-found page (misprint-correction notice, DE primary / EN caption)
affects: [07-02, 07-03, 07-04, 07-05, 07-06, 07-07, 07-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ui.tsx is now a 'use client' module (three of the seven new primitives own focus/keyboard state); pure exports (Btn, CARD, EYEBROW, ...) remain safely importable from Server Components"
    - "Shared focusTrap() helper in ui.tsx replicates PaketModal's Escape+Tab dialog trap, scoped to KebabMenu/BottomSheet's own container ref instead of a dialog ref"
    - "Primitives never hardcode copy: every label/status/timestamp is a caller-supplied prop, i18n stays out of ui.tsx"
    - "favicon.ico regenerated via sharp (SVG -> PNG rasterization) + Pillow (PNG -> multi-size ICO), no new npm dependency"

key-files:
  created:
    - scanready/src/app/not-found.tsx
    - scanready/public/favicon.svg
    - scanready/public/og-scanready.svg
    - scanready/public/scanready-lockup.svg
    - scanready/public/scanready-lockup-dark.svg
    - scanready/public/scanready-mark.svg
    - scanready/public/scanready-stacked.svg
    - scanready/public/favicon.ico
  modified:
    - scanready/src/app/globals.css
    - scanready/src/components/ui.tsx
    - scanready/src/app/layout.tsx
    - scanready/src/app/page.tsx
    - scanready/src/app/de/page.tsx

key-decisions:
  - "ui.tsx gained a 'use client' directive since KebabMenu, InlineRenameField and BottomSheet own focus/keyboard state; the file's prior no-hooks doctrine now applies only to the const-style primitives"
  - "MonoBadge/EmptyState/SavedConfirmationPanel/KebabMenu/InlineRenameField/BottomSheet keep PascalCase names (not the file's existing UPPER_SNAKE convention) to match the plan's exact grep-checked export names and to signal they are shell components, not one-line style consts"
  - "Fixed stale /og-image.svg references in src/app/page.tsx and src/app/de/page.tsx (not in the plan's files_modified list) because the plan's own acceptance criteria requires zero remaining references under scanready/src"

requirements-completed: [SC-08]

# Metrics
duration: 26min
completed: 2026-07-07
status: complete
---

# Phase 07 Plan 01: A0 Foundation (shadow tokens, ui.tsx primitives, founder assets, /not-found) Summary

**Seven new ui.tsx primitives (SheetCard, MonoBadge, EmptyState, SavedConfirmationPanel, InlineRenameField, KebabMenu, BottomSheet) plus three Tailwind v4 shadow tokens, six founder SVG brand assets wired into layout.tsx metadata, and a branded misprint-correction /not-found page.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-07-07T09:14:00Z (approx.)
- **Completed:** 2026-07-07T09:40:24Z
- **Tasks:** 3
- **Files modified:** 15 (2 CSS/component, 6 assets copied + 1 regenerated, 1 asset deleted, 3 metadata files, 1 new route)

## Accomplishments

- Added `--shadow-sheet`, `--shadow-sheet-hero`, `--shadow-modal` to the Tailwind v4 `@theme` block, copied verbatim from the design export's `ds-update/tokens/shadows.css`, generating the `shadow-sheet`/`shadow-sheet-hero`/`shadow-modal` utility classes every later 07-0x plan will use.
- Built all seven A0 primitives in `src/components/ui.tsx`: `SheetCard` (const class string), `MonoBadge` (present/ghost/editable/readonly variants, never red for the "fehlt" ghost state), `EmptyState` (dashed shelf with an aria-live mono status line), `SavedConfirmationPanel` (accent-tint save confirmation), `InlineRenameField` (serif input, Enter saves / Escape cancels), `KebabMenu` and `BottomSheet` (desktop/mobile action menus sharing a `focusTrap()` helper lifted from `PaketModal.tsx`'s Escape+Tab pattern).
- Swapped the six founder brand SVGs into `public/`, replaced the off-brand `og-image.svg` with `og-scanready.svg`, regenerated `favicon.ico` (32x32 + 16x16), and wired `layout.tsx` metadata (`icons`, `openGraph.images`) plus fixed the two other pages still pointing at the retired file.
- Shipped `src/app/not-found.tsx`: a plain server component lifting the "Korrektur der Redaktion" / "Diese Seite ist beim Umbruch verrutscht." copy deck verbatim from design surface 06, with the English line as a secondary caption (no `LangProvider`), a static three-plate misregistered "404" effect, and zero motion.

## Task Commits

Each task was committed atomically:

1. **Task 1: Shadow tokens + seven ui.tsx primitives** - `a177fce` (feat)
2. **Task 2: Founder asset swap + favicon + Open Graph metadata** - `6c68494` (feat)
3. **Task 3: Branded /not-found page from surface 06** - `45b728f` (feat)

**Plan metadata:** committed separately after this summary (see final commit).

## Files Created/Modified

- `scanready/src/app/globals.css` - added the three shadow `@theme` tokens (Elevation section)
- `scanready/src/components/ui.tsx` - added `'use client'`, `SheetCard`, `MonoBadge`, `EmptyState`, `SavedConfirmationPanel`, `InlineRenameField`, `KebabMenu`, `BottomSheet`, and a shared `focusTrap()` helper
- `scanready/public/favicon.svg`, `og-scanready.svg`, `scanready-lockup.svg`, `scanready-lockup-dark.svg`, `scanready-mark.svg`, `scanready-stacked.svg` - founder brand assets copied from the design export
- `scanready/public/favicon.ico` - regenerated multi-size ICO
- `scanready/public/og-image.svg` - removed (replaced by `og-scanready.svg`)
- `scanready/src/app/layout.tsx` - `metadata.icons` + `metadata.openGraph.images` added, stand-in-mark comment referencing `naming-shortlist.md`
- `scanready/src/app/page.tsx`, `scanready/src/app/de/page.tsx` - `openGraph.images` URL updated from the retired `og-image.svg` to `og-scanready.svg`
- `scanready/src/app/not-found.tsx` - new branded 404 route

## Decisions Made

- `ui.tsx` now carries `'use client'` because three of the seven new primitives (`KebabMenu`, `InlineRenameField`, `BottomSheet`) own focus/keyboard state via hooks. The file's header comment was updated to explain that pure exports (`Btn`, `CARD`, `EYEBROW`, ...) remain safely composable into Server Components; this was verified by keeping `src/app/preise/page.tsx` (a server component importing `Btn`/`CARD`/`EYEBROW`) building cleanly.
- The seven new primitives keep PascalCase names per the plan's exact acceptance-criteria grep pattern, diverging from the file's existing `UPPER_SNAKE` convention for pure style consts (`CARD`, `EYEBROW`, `SKILL_CHIP`, `NORM_NOTE`). This distinguishes "shell primitives with behavior/props" from "one-line style consts," matching the plan's own doctrine note.
- `favicon.ico` was regenerated without adding a new npm dependency: `sharp` (already present in `node_modules` as a Next.js/Vercel dependency) rasterizes the SVG to PNG at 16x16 and 32x32, then Python's Pillow (already available locally) packs both PNGs into one multi-size `.ico`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed two additional stale `/og-image.svg` references outside the plan's files_modified list**
- **Found during:** Task 2 (Founder asset swap + favicon + Open Graph metadata)
- **Issue:** The plan's `files_modified` list for Task 2 only named `layout.tsx`, but `src/app/page.tsx` and `src/app/de/page.tsx` also had `openGraph.images` entries pointing at the retired `/og-image.svg`. The plan's own acceptance criteria explicitly requires `grep -rn "og-image.svg" scanready/src` to return no matches.
- **Fix:** Updated both files' `openGraph.images` URL to `/og-scanready.svg` with matching `alt` text.
- **Files modified:** `scanready/src/app/page.tsx`, `scanready/src/app/de/page.tsx`
- **Verification:** `grep -rn "og-image.svg" scanready/src` returns no matches; `npm run build` passes with both routes still statically generated.
- **Committed in:** `6c68494` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix, in-scope per the plan's own acceptance criteria)
**Impact on plan:** No scope creep; the fix was required to satisfy the plan's stated Task 2 acceptance criteria.

## Issues Encountered

- The plan's Task 1 frontmatter set `tdd="true"`, but the task's own `<action>`/`<files_modified>` never specified a test file (a CSS token addition and seven UI primitives with no `<behavior>` block), and project config has `workflow.tdd_mode: false`. Treated as a standard `auto` task, verified via `npx tsc --noEmit` and the acceptance-criteria greps as the plan's own `<verify>` block specifies. No RED/GREEN/REFACTOR commit sequence was produced for Task 1.
- The `/not-found.tsx` doc comment initially explained the "no animation" intent using the literal substrings `scan-sweep` and `reduced-motion-safe`, which false-positived against the plan's own acceptance-criteria grep (`scan-sweep|animate-|motion-`) even though no such CSS classes were actually used. Reworded the comment to describe the same intent without those literal substrings; re-verified the grep returns 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The shadow tokens and seven primitives are ready for 07-02 through 07-08 to build the library gallery, save moment, storage gate, Pass modal, and Preise v2 surfaces on top of.
- Founder brand assets and metadata are live in the codebase (still stand-ins pending the naming decision in `naming-shortlist.md`); no founder gate blocks this.
- `/not-found` is live and will render for any route not yet built in this phase (e.g. Phase B surfaces 07/08/09), so unfinished phase boundaries fail gracefully rather than 404-ing generically.
- No blockers for 07-02 (Pass data + API), which does not depend on any of this plan's primitives directly but does depend on the locked A0 -> A1 build order per `07-CONTEXT.md`.

---
*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 13 claimed created/modified files exist on disk, `og-image.svg` is confirmed removed, and all three task commit hashes (`a177fce`, `6c68494`, `45b728f`) are present in `git log`.
