---
phase: "01-pre-flight-parse-flow"
plan: "03"
subsystem: "scanready/src"
status: complete
tags: ["wysiwyg-editor", "lebenslauf", "react", "tailwind", "tdd", "clipboard"]
dependency_graph:
  requires: ["01-01", "01-02"]
  provides: ["WYSIWYG Lebenslauf editor", "EditableField component", "LebenslaufEditor component", "softFormatDate", "toPlainText"]
  affects: ["01-04"]
tech_stack:
  added: []
  patterns:
    - "useReducer state machine extended with LebenslaufAction union"
    - "swap-to-controlled-input click-to-edit pattern (EditableField)"
    - "reorder<T> pure array helper for section/entry reordering"
    - "sectionOrder-driven section render loop"
    - "navigator.clipboard.writeText with transient 1500ms/3000ms feedback states"
    - "TDD with node:test (no extra deps)"
key_files:
  created:
    - "scanready/src/components/EditableField.tsx"
    - "scanready/src/components/LebenslaufEditor.tsx"
  modified:
    - "scanready/src/lib/lebenslauf-utils.ts"
    - "scanready/src/lib/__tests__/lebenslauf-utils.test.ts"
    - "scanready/src/app/page.tsx"
decisions:
  - "LebenslaufAction union exported from LebenslaufEditor.tsx, not page.tsx — keeps page lean and allows Plan 04 to import without touching page"
  - "reorder<T> helper exported from LebenslaufEditor.tsx — available to reducer in page.tsx via import"
  - "Skills/languages rendered as minimal plain text in Plan 03 — chip UI and language dropdown deferred to Plan 04 per spec"
  - "D-13 honored: no signature/Unterschrift block added anywhere in editor or toPlainText"
  - "font-medium/gap-1.5 from Plan 01 converged to font-semibold/gap-2 per UI-SPEC contract"
metrics:
  duration_seconds: 421
  completed_date: "2026-06-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
---

# Phase 01 Plan 03: WYSIWYG Lebenslauf Editor Summary

**One-liner:** Full inline CV editor — EditableField click-to-edit, LebenslaufEditor with section/entry reordering, pure-function helpers (softFormatDate, toPlainText), and clipboard copy wired to current edited state.

## What Was Built

Plan 03 delivers the WYSIWYG core of LL-01 and LL-04: the user can now click any field in the Lebenslauf result view to edit it inline, add/remove/reorder experience entries and their bullets, reorder whole sections via ↑/↓ buttons, and copy the current edited state as clean plain text to the clipboard.

### Task 1: Editor primitives (TDD)

**`scanready/src/lib/lebenslauf-utils.ts`** extended with:
- `toPlainText(l, sectionOrder): string` — serializes the current edited Lebenslauf to plain text for clipboard copy; emits sections in `sectionOrder` order with German headings; skips null/empty fields
- `SECTION_HEADINGS` lookup map (Persönliche Daten, Berufserfahrung, Bildung, Kenntnisse, Sprachen)
- `softFormatDate` was already present from Plan 01; no changes needed

**`scanready/src/lib/__tests__/lebenslauf-utils.test.ts`** extended with 6 new tests:
- 5 tests for `softFormatDate` covering ISO→DIN, US-slash→DIN, already-DIN passthrough, natural partial date passthrough, year-only passthrough
- 1 test for `toPlainText` verifying full name + experience role + company included and sectionOrder respected
- All 10 tests pass (4 existing + 6 new); TDD RED→GREEN cycle confirmed

**`scanready/src/components/EditableField.tsx`** (new):
- Swap-to-controlled-input pattern: display `<span>` → `<input>` or `<textarea>` on click
- Commits on blur and Enter (single-line); cancels on Escape
- `onBlurFormat` prop for date fields (`softFormatDate` passed from editor)
- `font-mono` class auto-applied when `onBlurFormat` is provided (date variant per UI-SPEC)
- Fillable blank: empty value renders `placeholder` in `text-zinc-400 italic` (D-08)
- Blue-400 bottom-border only on active `<input>` — reserved per UI-SPEC
- No `contentEditable`, no `dangerouslySetInnerHTML` (T-01-08 mitigated)

### Task 2: LebenslaufEditor + reducer + page wiring

**`scanready/src/components/LebenslaufEditor.tsx`** (new):
- `LebenslaufAction` union exported: UPDATE_PERSONAL; experience CRUD + reorder; bullets CRUD; education CRUD + reorder; languages CRUD; REORDER_SECTION
- `reorder<T>` pure helper exported (no drag library, no mutation)
- `LebenslaufEditor` component: renders sections by iterating `sectionOrder`; section ↑/↓ always visible (deliberate navigation); entry ↑/↓/× via `group-hover:opacity-100`; "+ add" affordances for entries and bullets; all fields use `EditableField`; date fields use `onBlurFormat={softFormatDate}`
- Skills section: minimal plain-text render in Plan 03; chip UI deferred to Plan 04
- Languages section: editable plain text (language + level); Plan 04 adds the German dropdown

**`scanready/src/app/page.tsx`** extended:
- `AppAction` union extended with `| LebenslaufAction`
- Reducer extended with all edit/add/remove/reorder cases — all pure immutable updates
- `ResultView` replaced: Plan 01 read-only stub → full `LebenslaufEditor` + copy button (toPlainText → clipboard) + start-over (RESET dispatch)
- Copy button shows "Kopiert ✓" 1500ms after success; "Kopieren fehlgeschlagen" 3000ms on error — local `useState`, not in reducer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - UI-SPEC convergence] Fixed font-medium and gap-1.5 violations from Plan 01**
- **Found during:** Task 2 (styling audit before commit)
- **Issue:** Plan 01 `page.tsx` used `font-medium` (5 occurrences) and `gap-1.5` (1 occurrence) — banned by UI-SPEC "two weights only: font-normal + font-semibold"
- **Fix:** Converged all `font-medium` → `font-semibold` in InputView/ErrorView/JunkView; `gap-1.5` → `gap-2` in zero-retention line
- **Files modified:** `scanready/src/app/page.tsx`
- **Commit:** 091fd66

## Verification

### Automated (pre-commit)
- `npx tsc --noEmit` exits 0 — both commits
- `npm test` (node --experimental-strip-types): 10 tests pass, 0 fail
- Negative greps confirmed: no `contentEditable` or `dangerouslySetInnerHTML` in `EditableField.tsx` or `LebenslaufEditor.tsx`
- Positive greps confirmed: `'use client'` at line 1 of both components; exports present; `LebenslaufEditor`, `REORDER_SECTION`, `REORDER_EXPERIENCE`, `navigator.clipboard.writeText`, `toPlainText`, `RESET` all present in `page.tsx`
- No `font-medium`, `font-bold`, `gap-1.5`, `space-y-1.5`, `px-1.5` in any new/modified component files

### Manual (human-check deferred to checkpoint — Plan 04 checkpoint)
Per plan: `npm run dev`, parse sample CV, exercise edit/add/remove/reorder/copy/start-over — deferred to the Plan 04 `checkpoint:human-verify` which covers the complete result flow including norm-gap panel and skill chips.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Skills section: plain-text render (no chip editing) | `LebenslaufEditor.tsx` lines 253–268 | Categorized skill chips + ADD_SKILL_CATEGORY/ADD_SKILL actions are explicitly deferred to Plan 04 per spec. Plan 03 renders skills read-only so the result screen is usable. |
| Languages: plain EditableField (no German level dropdown) | `LebenslaufEditor.tsx` lines 271–305 | German dropdown (Muttersprache/Verhandlungssicher/…) is a Plan 04 deliverable per UI-SPEC §SkillChips and §Copywriting Contract. |

Both stubs are intentional per the plan boundary; Plan 04 will wire them.

## Commits

| Hash | Message |
|------|---------|
| 01e9cfa | feat(01-03): editor primitives — softFormatDate, toPlainText, EditableField |
| 091fd66 | feat(01-03): LebenslaufEditor + full reducer + copy + start over |

## Self-Check: PASSED

Files exist:
- scanready/src/components/EditableField.tsx: FOUND
- scanready/src/components/LebenslaufEditor.tsx: FOUND
- scanready/src/lib/lebenslauf-utils.ts (toPlainText): FOUND

Commits exist:
- 01e9cfa: FOUND
- 091fd66: FOUND
