---
phase: quick
plan: 260701-jxh
subsystem: ui
tags: [tailwind, design-system, css-theme, react]

# Dependency graph
requires:
  - phase: 04-design-and-deploy
    provides: shipped globals.css @theme block, ui.tsx primitives (btnClass/CARD/EYEBROW), Warm Editorial Broadsheet design system
provides:
  - reconciled globals.css @theme tokens matching the exported "ScanReady Design System" (brand-error/warn/tag, ink-soft, slate, stone, band-from/to)
  - SKILL_CHIP and NORM_NOTE reusable class-string consts in ui.tsx, same idiom as CARD/EYEBROW
  - two hand-rolled call sites (skill pill, Hinweis callout) now consume the shared consts
affects: [design-system-export-followups, future-ui-work-touching-ui.tsx]

# Tech tracking
tech-stack:
  added: []
  patterns: [additive @theme token extension without renaming existing tokens, exported const class-strings over inline-style components for static pills/callouts]

key-files:
  created: []
  modified:
    - scanready/src/app/globals.css
    - scanready/src/components/ui.tsx
    - scanready/src/components/SkillChips.tsx
    - scanready/src/app/app/page.tsx

key-decisions:
  - "Kept shipped globals.css accent hover/chip/tint hexes (#0b6e58/#d2e9e1/#eef6f2) as authoritative over DESIGN.md's frontmatter values, since shipped code + the export agree and are already live on Vercel — did not churn production color."
  - "Added 8 new @theme tokens (brand-error/warn/tag, ink-soft, slate, stone, band-from/to) purely additively; no existing token renamed or removed."
  - "Matched the app's existing primitive idiom (exported const class-strings) rather than porting the export's inline-style JSX components (Tag/NormNote) — SKILL_CHIP and NORM_NOTE are one-line const strings like CARD/EYEBROW."
  - "Hinweis callout intentionally shifted from plain-paper box to the accent-tint NORM_NOTE wash, aligning its visual role with the exported NormNote component (it is a norm/annotation note)."

patterns-established:
  - "New functional/semantic colors matching an external design-system export are added to @theme as additive-only entries, grouped under a short comment, never renaming pre-existing tokens consumed by live Tailwind classes."

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-07-01
status: complete
---

# Quick Task 260701-jxh: Apply ScanReady Design System Export to App Summary

**Reconciled globals.css @theme tokens and extracted SKILL_CHIP/NORM_NOTE class-string primitives so the shipped app matches the exported "ScanReady Design System" — zero visual regression, additive-only token changes.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-01T12:16:00Z
- **Completed:** 2026-07-01T12:28:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `globals.css` @theme block now carries the exported brand-error/warn/tag, ink-soft, slate, stone, and band-from/to tokens at the exact hexes from `ScanReady Design System/tokens/colors.css` — all additive, no existing token touched.
- Stale "AreaButler design system" / "AreaButler UI primitives" naming replaced with "ScanReady" / "Warm Editorial Broadsheet" in both `globals.css` and `ui.tsx` doc comments.
- `ui.tsx` exports two new reusable primitives, `SKILL_CHIP` and `NORM_NOTE`, matching the existing `CARD`/`EYEBROW` const-string idiom.
- Both previously hand-rolled call sites now consume the shared consts: the skill pill in `SkillChips.tsx` (rendered classes unchanged) and the Hinweis callout in `app/page.tsx` (now renders on the accent-tint wash instead of plain paper, matching the exported NormNote's role).

## Task Commits

Each task was committed atomically:

1. **Task 1: Reconcile globals.css @theme tokens and fix stale AreaButler naming** - `7ea7b6d` (feat)
2. **Task 2: Extract SKILL_CHIP + NORM_NOTE primitives into ui.tsx and wire the two hand-rolled call sites** - `65a10f3` (feat)

_No TDD tasks in this plan — plain auto tasks, single commit each._

## Files Created/Modified
- `scanready/src/app/globals.css` - Renamed AreaButler → ScanReady header comment; added 8 additive @theme tokens (brand-error/warn/tag, ink-soft, slate, stone, band-from/to)
- `scanready/src/components/ui.tsx` - Renamed AreaButler → ScanReady docblock; added `SKILL_CHIP` and `NORM_NOTE` exported class-string consts
- `scanready/src/components/SkillChips.tsx` - Skill-pill div now imports and uses `SKILL_CHIP` (layout classes `flex items-center gap-1` retained at call site)
- `scanready/src/app/app/page.tsx` - Hinweis callout div now imports and uses `NORM_NOTE` instead of inline `rounded-lg border border-hair bg-paper px-4 py-3`

## Decisions Made
- Left the accent hover/chip/tint hex discrepancy between the export+shipped code (`#0b6e58`/`#d2e9e1`/`#eef6f2`) and DESIGN.md's frontmatter (`#0c9379`/`#cfe9e0`/`#eef7f3`) unresolved in code — see "Known Discrepancies" below.
- Matched the app's existing const-string primitive idiom instead of porting the export's inline-style JSX `Tag`/`NormNote` components, to avoid introducing a second styling pattern into `ui.tsx`.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched their `<action>` blocks precisely; all verification commands passed on the first attempt.

## Known Discrepancies (flagged for human follow-up, not fixed in this plan)

**DESIGN.md frontmatter accent-hover/chip/tint hexes differ from the shipped app + export.** Per the plan's `reconciliation_findings`, the shipped `globals.css` and the exported `ScanReady Design System/tokens/colors.css` agree exactly on `--accent-deep: #0b6e58`, `--accent-soft: #d2e9e1`, `--accent-tint: #eef6f2` — these are already live on Vercel. `scanready/DESIGN.md`'s YAML frontmatter instead lists `#0c9379` / `#cfe9e0` / `#eef7f3` for the same roles. This plan intentionally did NOT touch the live accent ramp (churning production color for no benefit, when the export we're reconciling against already agrees with what ships). A human should align `DESIGN.md`'s frontmatter to the shipped/export values (or explicitly decide DESIGN.md's values are the intended future direction) — this is a two-line YAML edit, not a code change.

## Issues Encountered

None. `npx tsc --noEmit` passed cleanly after both tasks. Dev server started successfully (Node v22 available locally per project memory) and both `/` (landing, HTTP 200) and `/app` (tool, HTTP 200) routes rendered without errors — no visual regression observed on the landing route; the Hinweis callout's new accent-tint styling only becomes visible after generating a cover letter, which is beyond a quick automated smoke check, but the underlying `bg-accent-tint`/`text-ink-soft` Tailwind utilities resolve correctly since `tsc` and the class-const wiring both pass and `bg-accent-tint` was already a live token before this plan (only `text-ink-soft` is newly added, and it's now defined in `@theme`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- No blockers. The app's design tokens and primitives are now in lockstep with the exported "ScanReady Design System" for the palette and the two extracted primitives.
- Follow-up (optional, non-blocking): align `DESIGN.md` frontmatter's accent-hover/chip/tint hexes to the shipped/export values (see "Known Discrepancies" above).

## Self-Check: PASSED

- FOUND: scanready/src/app/globals.css (verified via Edit tool success + grep)
- FOUND: scanready/src/components/ui.tsx (verified via Edit tool success + grep)
- FOUND: scanready/src/components/SkillChips.tsx (verified via Edit tool success + grep)
- FOUND: scanready/src/app/app/page.tsx (verified via Edit tool success + grep)
- FOUND: commit 7ea7b6d (git log --oneline confirms)
- FOUND: commit 65a10f3 (git log --oneline confirms)

---
*Phase: quick*
*Completed: 2026-07-01*
