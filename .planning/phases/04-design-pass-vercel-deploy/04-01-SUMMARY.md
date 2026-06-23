---
phase: "04"
plan: "01"
subsystem: "frontend/brand"
status: complete
tags: ["brand-identity", "routing", "accessibility", "light-only", "design-pass"]
dependency_graph:
  requires: []
  provides: ["brand-tokens", "route-split", "tool-ui-light-only"]
  affects: ["04-02-PLAN.md", "04-03-PLAN.md"]
tech_stack:
  added: ["Lora (next/font/google)"]
  patterns: ["CSS custom properties for brand tokens", "App Router nested route", "light-only Tailwind"]
key_files:
  created:
    - scanready/src/app/app/page.tsx
    - scanready/src/app/page.tsx
  modified:
    - scanready/src/app/layout.tsx
    - scanready/src/app/globals.css
    - scanready/src/components/LebenslaufEditor.tsx
    - scanready/src/components/NormGapPanel.tsx
    - scanready/src/components/SkillChips.tsx
decisions:
  - "Tool route: /app (D-01 default path)"
  - "placeholder-zinc-400 syntax: Tailwind v4 variant-colon form (placeholder:text-zinc-400)"
  - "Section eyebrow labels: upgraded from text-xs to text-sm per consolidated type scale (D-19)"
  - "CoverLetterInputView h2: upgraded to text-3xl to match the unified 28px heading tier"
  - "font-medium replaced with font-semibold on labels (prohibited 500 weight, UI-SPEC)"
metrics:
  duration_seconds: 390
  completed_at: "2026-06-23T19:23:47Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 7
---

# Phase 04 Plan 01: Brand Foundation + Route Split Summary

Brand tokens (Lora serif, deep-blue accent `#1d4ed8`, light-only surface, reduced-motion guard) wired app-wide; tool flow moved from `/` to `/app`; all dark-mode variants stripped and WCAG-AA contrast gaps closed.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Brand foundation: layout.tsx metadata + Lora, globals.css light-only | b82adcb | Done |
| 2 | Route split (D-01): move tool to /app, placeholder at / | 00a5d5e | Done |
| 3 | Tool UI retrofit: strip dark:, upgrade h1, remove shadows, WCAG-AA | 1820d8e | Done |

## What Was Built

**Task 1 — Brand foundation:**
- `layout.tsx`: Added `Lora` to `next/font/google` imports alongside existing Geist fonts; instantiated with `variable: "--font-lora"`, wired onto `<html>` className. Replaced "Create Next App" metadata with real title (`ScanReady — Win the 8-Second German Recruiter Scan`), description, and minimal `openGraph` block per UI-SPEC §A.
- `globals.css`: Removed the entire `@media (prefers-color-scheme: dark)` block (D-12 light-only). Removed `Arial, Helvetica, sans-serif` body override; wired `var(--font-geist-sans), system-ui, sans-serif`. Set `--foreground: #18181b` (zinc-900 text token). Added `--font-serif: var(--font-lora), Georgia, serif` and `--color-accent: #1d4ed8` to `:root`. Appended `prefers-reduced-motion` guard disabling all animations/transitions.

**Task 2 — Route split:**
- Created `src/app/app/` directory; moved `src/app/page.tsx` → `src/app/app/page.tsx` via `git mv` (history preserved). Zero functional/logic changes to the AppState machine.
- Added minimal top-bar wordmark above tool content: `border-b border-zinc-200 h-14` bar with `<a href="/">ScanReady <span class="text-blue-700">DE</span></a>`.
- Wrapped tool content in `<main aria-label="ScanReady tool">` semantic landmark (UI-SPEC §Accessibility Tool UI).
- Replaced `src/app/page.tsx` with a clean Server Component placeholder (no `'use client'`) linking to `/app`. Plan 02 owns this file for the full landing.
- `npx tsc --noEmit` passes: `@/` import aliases resolve unchanged from the nested route path.

**Task 3 — Tool UI retrofit:**
- Stripped all `dark:` classes: 61 from `page.tsx`, 12 from `LebenslaufEditor.tsx`, 3 from `NormGapPanel.tsx`, 2 from `SkillChips.tsx`. `EditableField.tsx` confirmed 0 — no change.
- Upgraded primary `<h1>` ("Convert your CV to a German Lebenslauf") from `text-2xl` to `text-3xl` (D-19/UI-SPEC §F item 5, unified 28px tier). Also upgraded `CoverLetterInputView` `<h2>` ("Anschreiben") to `text-3xl` to match the same heading tier.
- Removed all `shadow-sm` from textareas and primary buttons (D-11 flat surfaces, UI-SPEC §F item 6).
- Added `focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2` to all interactive buttons and textareas (WCAG-AA visible focus, D-19).
- Upgraded section eyebrow labels from `text-xs text-zinc-400` to `text-sm text-zinc-500` (WCAG-AA contrast: zinc-400 = 3.1:1 fails; zinc-500 = 7.5:1 passes; consolidated type scale eliminates text-xs).
- Fixed remaining readable text from `text-zinc-400` → `text-zinc-500` (status text "Klicken zum Bearbeiten", "Generating Anschreiben…", "Hinweis" label).
- Fixed `placeholder-zinc-400` → `placeholder:text-zinc-400` (Tailwind v4 variant-colon syntax).
- Replaced `font-medium` (prohibited 500 weight) → `font-semibold` on label elements.
- Tool primary CTA color stays `bg-zinc-900 hover:bg-zinc-700` per UI-SPEC §F item 3 (landing uses blue; tool uses zinc-900).

## Verification

All grep gates passed:
- `FOUNDATION_OK` — Lora wired, metadata updated, dark media block removed, `--font-serif` + `--color-accent` present, reduced-motion guard present.
- `ROUTE_SPLIT_OK` — `src/app/app/page.tsx` exists with `'use client'` + AppState, `href="/"` present; `src/app/page.tsx` is Server Component with `href="/app"`, no AppState.
- `RETROFIT_OK` — 0 `dark:` classes remain, `text-3xl` present, `shadow-sm` absent, `focus-visible:ring` present, `aria-label="ScanReady tool"` present.
- `npx tsc --noEmit` passes after all three tasks.

## Deviations from Plan

### Auto-applied tweaks (within plan scope)

**1. [Rule 2 - Critical Correctness] Upgraded CoverLetterInputView `<h2>` to `text-3xl`**
- **Found during:** Task 3
- **Issue:** UI-SPEC §Typography unifies the section/tool heading tier at 28px (`text-3xl`). The `<h2>` ("Anschreiben") in CoverLetterInputView was still at `text-2xl` (24px). Per "Section title / tool heading" row, both landing `<h2>` section headings and the tool's main heading tier are unified at 28px.
- **Fix:** Upgraded `<h2>` className from `text-2xl` to `text-3xl` — class change only, no copy change.
- **Files modified:** `scanready/src/app/app/page.tsx`

**2. [Rule 2 - Critical Correctness] Character counter labels upgraded from `text-xs` to `text-sm`**
- **Found during:** Task 3
- **Issue:** UI-SPEC §Typography explicitly states "The `text-xs` (12px) is eliminated from the scale entirely." Character counters ("3000 / 30.000") remained at `text-xs`.
- **Fix:** Upgraded to `text-sm` for spec compliance.
- **Files modified:** `scanready/src/app/app/page.tsx`

**3. [Rule 2 - Critical Correctness] `font-medium` → `font-semibold` on labels**
- **Found during:** Task 3
- **Issue:** UI-SPEC §Typography declares "`font-medium` (500) remains prohibited everywhere." Two `<label>` and `<p>` elements in CoverLetterInputView used `font-medium`.
- **Fix:** Changed to `font-semibold` (600) — the correct weight per the declared 2-weight system.
- **Files modified:** `scanready/src/app/app/page.tsx`

**4. [Rule 2 - Critical Correctness] `placeholder-zinc-400` → `placeholder:text-zinc-400` (Tailwind v4 syntax)**
- **Found during:** Task 3
- **Issue:** Tailwind v4 uses variant-colon syntax for pseudo-element modifiers. `placeholder-zinc-400` is v3 syntax.
- **Fix:** Updated to `placeholder:text-zinc-400` on all textareas.
- **Files modified:** `scanready/src/app/app/page.tsx`

**5. [Rule 3 - Blocking] `<main>` landmark added in Task 2 (not Task 3)**
- **Found during:** Task 2 (while adding the top-bar and restructuring the return JSX)
- **Issue:** UI-SPEC §Accessibility Tool UI requires the tool content wrapped in `<main aria-label="ScanReady tool">`. This was most naturally placed while restructuring the return block for the top-bar.
- **Fix:** Applied `<main aria-label="ScanReady tool">` during Task 2 instead of Task 3 (same commit batch).
- **Files modified:** `scanready/src/app/app/page.tsx`

## Known Stubs

None. This plan is identity + routing only (D-05 — backend frozen). The placeholder `src/app/page.tsx` ("Landing coming soon" with a link to `/app`) is intentional — it is documented as temporary and Plan 02 replaces it with the full landing.

## Threat Surface Scan

No new security-relevant surface introduced. Confirmed:
- No `NEXT_PUBLIC_` env vars introduced (T-04-01 — API key stays server-only).
- No `dangerouslySetInnerHTML` in layout.tsx or placeholder page.tsx (T-04-02).
- No new npm packages (T-04-SC — Lora loads via `next/font/google`, zero registry vetting required).
- Backend routes (`/api/parse`, `/api/cover-letter`) are unchanged per D-05.

## Self-Check: PASSED

Files verified present:
- scanready/src/app/app/page.tsx: FOUND
- scanready/src/app/page.tsx: FOUND
- scanready/src/app/layout.tsx: FOUND
- scanready/src/app/globals.css: FOUND
- scanready/src/components/LebenslaufEditor.tsx: FOUND
- scanready/src/components/NormGapPanel.tsx: FOUND
- scanready/src/components/SkillChips.tsx: FOUND

Commits verified present:
- b82adcb (brand foundation): FOUND
- 00a5d5e (route split): FOUND
- 1820d8e (tool retrofit): FOUND

TypeScript: `npx tsc --noEmit` — PASS
