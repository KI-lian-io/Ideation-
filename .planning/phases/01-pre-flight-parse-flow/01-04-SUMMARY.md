---
phase: "01-pre-flight-parse-flow"
plan: "04"
subsystem: "scanready/src"
status: complete
tags: ["skill-chips", "language-levels", "norm-gap-panel", "photo-callout", "german-norms", "react", "tailwind"]
dependency_graph:
  requires: ["01-02", "01-03"]
  provides:
    - "SkillChips component (categorized editable chips + GERMAN_LANGUAGE_LEVELS + level dropdown)"
    - "NormGapPanel component (collapsible normGapNotes block)"
    - "optional-photo callout (rendered verbatim from photoAdvice)"
    - "skill-category reducer actions (UPDATE_SKILL, ADD_SKILL, REMOVE_SKILL, ADD_SKILL_CATEGORY, REMOVE_SKILL_CATEGORY, UPDATE_SKILL_CATEGORY_NAME)"
  affects: []
tech_stack:
  added: []
  patterns:
    - "categorized chip groups with editable category labels (EditableField reused)"
    - "German language-level <select> with empty default + five fixed German levels (D-10)"
    - "native <details>/<summary> collapsible (no useState, not in reducer) for norm-gap notes"
    - "model-produced text (normGapNotes[], photoAdvice) rendered as escaped text nodes only — no dangerouslySetInnerHTML"
    - "photo callout neutral bg-zinc-100 (red/amber reserved for error/junk per UI-SPEC)"
key_files:
  created:
    - "scanready/src/components/SkillChips.tsx"
    - "scanready/src/components/NormGapPanel.tsx"
  modified:
    - "scanready/src/components/LebenslaufEditor.tsx"
    - "scanready/src/app/page.tsx"
decisions:
  - "Built to the approved 01-UI-SPEC.md: two weights (font-normal/font-semibold), 8pt spacing (gap-2/space-y-2/px-2), blue-400 reserved for EditableField edit state only"
  - "photoAdvice rendered verbatim from the parse response — never hardcoded, never mandated; framed as optional under the AGG (D-06 / LL-03)"
  - "NormGapPanel returns null when normGapNotes is empty; placed below LebenslaufEditor so the CV stays the hero (D-05 / LL-02)"
  - "GERMAN_LANGUAGE_LEVELS = ['Muttersprache','Verhandlungssicher','Fließend','Gute Kenntnisse','Grundkenntnisse'] with an empty '— Niveau wählen —' default (D-10)"
  - "Task 1 committed by the wave-4 executor (088e75b); the executor was interrupted mid-Task-2, so Task 2 (NormGapPanel + photo callout + page wiring) was completed and committed (db2b903) by orchestrator close-out after verifying it against the plan + UI-SPEC"
  - "scanready/src/lib/anthropic.ts is NOT part of this plan — a separate user-initiated model-lever edit (PARSE/GENERATION model) left uncommitted in the working tree"
metrics:
  completed_date: "2026-06-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 01 Plan 04: German-Norm Panels Summary

**One-liner:** The visible payoff of the phase — categorized editable skill chips (D-09), a German-convention language-level dropdown (D-10), the collapsible bilingual "what changed & why" panel from `normGapNotes[]` (D-05 / LL-02), and the never-mandated optional-photo callout from `photoAdvice` (D-06 / LL-03), all built on the Plan-03 editor shell and the Plan-02 categorized schema.

## What was delivered

**Task 1 (committed `088e75b`):** `SkillChips.tsx` — skills rendered as editable chips grouped under German category headings; add/remove chips, add/remove categories, edit category names; the language-level `<select>` exporting `GERMAN_LANGUAGE_LEVELS`. Wired through new skill-category reducer cases in `page.tsx` (`UPDATE_SKILL`, `ADD_SKILL`, `REMOVE_SKILL`, `ADD_SKILL_CATEGORY`, `REMOVE_SKILL_CATEGORY`, `UPDATE_SKILL_CATEGORY_NAME`); `LebenslaufEditor` Kenntnisse section uses `SkillChips`, Sprachen uses the dropdown.

**Task 2 (committed `db2b903`, orchestrator close-out):** `NormGapPanel.tsx` — native `<details>` collapsible rendering `normGapNotes[]` as text nodes, summary "Was hat sich geändert & warum? ({n} Hinweise)", returns null when empty. Optional-photo callout added to `PersonalSection` in `LebenslaufEditor.tsx`, rendering `photoAdvice` verbatim in a neutral `bg-zinc-100` box labelled "Foto (optional)". `page.tsx` mounts the panel below the editor and passes `photoAdvice` into the editor.

## Requirements covered

- **LL-02** — bilingual norm-gap panel rendered from `normGapNotes[]` (pure client render, no API change)
- **LL-03** — nuanced, never-mandated photo guidance from `photoAdvice`
- **D-09 (UI)** — categorized editable skill chips
- **D-10 (UI)** — German-convention language-level dropdown
- **D-05 / D-06** — collapsible "why it matters" notes + optional-photo callout

## Verification

- `npx tsc --noEmit` exits 0 (full project, on Node 26).
- `npm test` — 10/10 unit tests pass.
- No `dangerouslySetInnerHTML` / `contentEditable`; no client-side `ANTHROPIC_API_KEY` reference; styling conforms to the approved UI-SPEC.
- Human verification (live parse → scroll to Kenntnisse/Sprachen, exercise chips + dropdown, confirm norm-gap panel + photo callout, check copy output) is deferred to phase UAT — requires a live `/api/parse` round-trip with a configured `ANTHROPIC_API_KEY`.

## Notes

- The wave-4 executor was interrupted after committing Task 1. Task 2 was already complete on disk; it was verified against the plan + UI-SPEC and committed by the orchestrator rather than re-run, to avoid duplicating finished work.
- `anthropic.ts` carries an unrelated, user-initiated model change (both `GENERATION_MODEL` and `PARSE_MODEL` set to `claude-haiku-4-5`) and was deliberately excluded from this plan's commits.
