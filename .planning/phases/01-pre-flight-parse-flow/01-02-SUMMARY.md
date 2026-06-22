---
phase: 01-pre-flight-parse-flow
plan: "02"
subsystem: parse-backend
tags: [schema, prompts, zod, grounding, german-norms, d-07, d-09, d-10]
status: complete

dependency_graph:
  requires: ["01-01"]
  provides: ["SkillCategorySchema", "SkillCategory", "PARSE_SYSTEM-D07-D09-D10"]
  affects: ["scanready/src/app/api/parse/route.ts", "scanready/src/components/SkillChips.tsx (plans 03-04)"]

tech_stack:
  added: []
  patterns:
    - "z.object({ category: z.string(), skills: z.array(z.string()) }) — Zod v4 safe nested schema"
    - "PARSE_SYSTEM multi-section grounding reaffirmation per field-touching instruction"

key_files:
  created: []
  modified:
    - scanready/src/lib/schema.ts
    - scanready/src/lib/prompts.ts

decisions:
  - "D-09 skill categories: IT-Kenntnisse / Fachkenntnisse / Sonstige Kenntnisse as the three category labels in both schema and prompt — derived from German HR sources in RESEARCH.md"
  - "D-07 note voice: one-line '[change] — [why it matters in the 8-second scan]' format replaces the flat 'list what differs' instruction"
  - "D-10 language levels: five German CV terms (Muttersprache through Grundkenntnisse) explicitly listed in the prompt; CEFR codes and 'native'/'fluent' prohibited"
  - "Grounding strategy: each new PARSE_SYSTEM section that touches output fields includes an explicit 'Do not invent' clause rather than relying solely on the top GROUNDING block"

metrics:
  duration: "~3 minutes"
  completed: "2026-06-22"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 01 Plan 02: Parse Backend Schema + Prompt Upgrade Summary

**One-liner:** Categorized Kenntnisse schema (SkillCategorySchema), German-vocabulary language levels, and concise change+why norm-gap notes added to the parse backend — grounding preserved throughout.

## What Was Built

### Task 1 — `scanready/src/lib/schema.ts` (D-09)

Added `SkillCategorySchema` as a Zod v4 safe `z.object` with two required fields:
- `category: z.string()` — holds labels like "IT-Kenntnisse", "Fachkenntnisse", "Sonstige Kenntnisse"
- `skills: z.array(z.string())` — list of skill entries from the source CV

Changed `LebenslaufSchema.skills` from `z.array(z.string())` (flat) to `z.array(SkillCategorySchema)` (categorized). Exported `SkillCategory` type (`z.infer<typeof SkillCategorySchema>`) alongside the existing `Lebenslauf` type.

Zod v4 / Anthropic structured-output safety confirmed: no `.min()`/`.max()`, no `discriminatedUnion`, no `.optional()` on new fields, root remains `z.object`. `tsc --noEmit` passes.

Commit: `52d0a4c`

### Task 2 — `scanready/src/lib/prompts.ts` (D-07, D-09, D-10)

Upgraded `PARSE_SYSTEM` with three additions inside the GERMAN NORMS block. All other exports (`COVER_LETTER_SYSTEM`, `buildParseUser`, `buildCoverLetterUser`, `PERSONALIZATION_QUESTIONS`) are unchanged.

**D-07 — norm-gap note voice:** Replaced the flat "list what differs" instruction with a concise one-line "[Change made] — [why this matters in the 8-second German recruiter scan]" template, with a concrete example and a grounding reaffirmation ("notes must describe actual changes made, not fabricate improvements that were not possible").

**D-09 — skill categories:** Added instruction to group skills into IT-Kenntnisse / Fachkenntnisse / Sonstige Kenntnisse, include only categories with entries from the source CV, and not invent skills or list soft skills as standalone entries.

**D-10 — language levels:** Added mapping guide (native → Muttersprache; B2 → Fließend; A1-A2 → Grundkenntnisse etc.), prohibiting CEFR codes and "native"/"fluent" free-form text; null when absent.

The top GROUNDING block is intact and unmodified. Each new section reaffirms grounding with explicit "Do not invent" / "only include from the source CV" language.

Commit: `f2b8cf8`

## Commits

| Hash | Task | Message |
|------|------|---------|
| `52d0a4c` | Task 1 | feat(01-02): add SkillCategorySchema and switch skills to categorized array (D-09) |
| `f2b8cf8` | Task 2 | feat(01-02): upgrade PARSE_SYSTEM with D-07 note voice, D-09 categories, D-10 language levels |

## Deviations from Plan

None — plan executed exactly as written. Both files changed exactly as specified in the PATTERNS.md insertion points. The PATTERNS.md D-09 entry referenced "Sprachkenntnisse" as a potential fourth category but the plan itself specified only IT-Kenntnisse / Fachkenntnisse / Sonstige Kenntnisse; those three were implemented as specified.

## Known Stubs

None. Both files are pure backend (schema + prompt). No UI-facing hardcoded values, no placeholder text.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at additional trust boundaries. Mitigations for T-01-05 (prompt grounding weakening) and T-01-06 (unsafe Zod keywords) confirmed applied per the threat register.

## Self-Check: PASSED

- [x] `scanready/src/lib/schema.ts` — file exists and modified
- [x] `scanready/src/lib/prompts.ts` — file exists and modified
- [x] Commit `52d0a4c` — exists (`git log --oneline` confirmed)
- [x] Commit `f2b8cf8` — exists (`git log --oneline` confirmed)
- [x] `tsc --noEmit` exits 0 (verified in both tasks)
- [x] All acceptance criteria grep checks passed
- [x] `STATE.md` and `ROADMAP.md` not modified (orchestrator owns those writes)
