# Phase 2: Cover Letter Flow - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the **Anschreiben (cover letter) UI** onto the already-built streamed backend, completing the end-to-end product. In scope (CL-01…CL-06): a job-posting input, the 5 personalization questions, the live-streaming letter, the native-speaker-review nudge, and copy/download. The streaming endpoint (`/api/cover-letter`), `COVER_LETTER_SYSTEM`, `buildCoverLetterUser`, and `PERSONALIZATION_QUESTIONS` already exist — this phase is **UI/UX wiring plus one one-line prompt edit (D-09)**, not new backend.

Mode: **mvp** (per ROADMAP). Out of scope: PDF/.docx export (FMT-02/03, v2), PDF upload (FMT-01, v2), analytics/guards (Phase 3), design pass (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Flow entry & CV grounding source
- **D-01:** A **"Write Anschreiben" CTA on the Lebenslauf result** extends the **same single-page `useReducer` flow** — no separate page/route. The reducer's `AppPhase` union gains cover-letter phases (e.g. `cover_letter_input | cover_letter_streaming | cover_letter_result` — exact names planner's discretion). `resumeText` already persists from Phase 1.
- **D-02:** Ground the letter in the **edited Lebenslauf**, not the raw paste: `cvText = toPlainText(current edited Lebenslauf state)`. The user's corrections must flow into the cover letter. (`toPlainText` already exists from Plan 01-03.) `POST /api/cover-letter` with `{ cvText, jobPosting, answers }`.

### Personalization questions UX (CL-02)
- **D-03:** Present **all 5 `PERSONALIZATION_QUESTIONS` at once** as a single form of labelled textareas (NOT a one-at-a-time wizard).
- **D-04:** **Job posting is required** to generate (disable "Generate Anschreiben" until the job-posting field is non-empty). Question answers are **optional but encouraged** (more answers = more authentic letter); Q5 (gap/career change) is explicitly optional. No hard minimum on answers; a gentle "answer at least one for a stronger letter" hint is at the planner's discretion.

### Streaming render (CL-03)
- **D-05:** Stream tokens **live into a read-only styled letter block**. Consume the stream via `response.body.getReader()` (LOCKED by CL-03 — NOT EventSource). Show a **"Generating…" skeleton until the first token** (adaptive thinking can delay it; thinking blocks are already filtered server-side, so a pre-token pause is expected — reuse the Phase-1 `animate-pulse` skeleton idiom, not a stepped progress bar).
- **D-06:** On stream completion, the letter becomes **editable** (reuse `EditableField` / a `textarea`) so the user can tweak the voice. Provide **"Regenerate"** (re-run with the same inputs) and **"Start over"** (RESET). Do not allow editing *during* the stream (avoids cursor fighting the token append).

### Finished letter — output & trust (CL-05, CL-06)
- **D-07:** Finished-letter actions: **Copy to clipboard** (reuse Phase-1 "Kopiert ✓"/error pattern) **+ plain-text (.txt) download**. PDF/.docx are deferred to v2 (FMT-02/03).
- **D-08:** **German letter only** — no bilingual English-explanation panel for the cover letter. The Lebenslauf norm-gap panel already covers the "why" education; the letter speaks for itself.
- **D-09:** The **native-speaker-review nudge is a distinct trust callout** below the letter (not buried inline). **Drop the inline `[bracket]` review note from `COVER_LETTER_SYSTEM`** so it isn't duplicated — this one-line prompt edit is the **only backend change** in this phase. (Grounding/anti-fabrication directives in the prompt stay untouched.)

### Claude's Discretion
- Exact reducer phase names + action shapes for the cover-letter sub-flow.
- Whether to show a soft "answer at least one question" hint, and its wording.
- `.txt` filename convention (e.g. `anschreiben.txt`).
- Typewriter cadence / whether to render raw streamed text directly vs lightly buffered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & prior-phase decisions (LOCKED — follow exactly)
- `.planning/phases/01-pre-flight-parse-flow/01-UI-SPEC.md` — the approved UI contract the cover-letter UI MUST follow: zinc neutral + `blue-400` accent (edit state only), `font-normal`/`font-semibold` (no `font-medium`), 8pt spacing grid, `EditableField` conventions, copy-button pattern, no new dependencies.
- `.planning/phases/01-pre-flight-parse-flow/01-CONTEXT.md` — Phase-1 locked decisions carried forward (D-14 inline zero-retention line, D-15 pulsing skeleton not progress bar, D-16 stateless start-over, copy "Kopiert ✓").

### Existing backend to wire onto (already built)
- `scanready/src/app/api/cover-letter/route.ts` — the streamed endpoint (`messages.stream`, adaptive thinking, `GENERATION_MODEL`); consume client-side via `response.body.getReader()`.
- `scanready/src/lib/prompts.ts` — `COVER_LETTER_SYSTEM` (drop the trailing `[bracket]` review note per D-09), `buildCoverLetterUser({ cvText, jobPosting, answers })`, `PERSONALIZATION_QUESTIONS` (the 5 questions for D-03).
- `scanready/src/lib/lebenslauf-utils.ts` — `toPlainText` (the `cvText` grounding source per D-02).
- `scanready/src/app/page.tsx` — the `'use client'` `useReducer` state machine to extend with the cover-letter phases.
- `scanready/src/components/EditableField.tsx` — reused for the post-stream editable letter (D-06).

### Project guardrails
- `.planning/PROJECT.md` — core value, grounded-only generation, native-speaker nudge, no income claims, zero-retention.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EditableField` — post-stream editable letter (D-06).
- Copy-button pattern ("Kopiert ✓" 1500ms / "Kopieren fehlgeschlagen" 3000ms) — reuse for the letter copy (D-07).
- `toPlainText(lebenslauf, sectionOrder)` — produces the `cvText` grounding string (D-02).
- Zero-retention inline line + `animate-pulse` skeleton — reuse for the cover-letter input + the "Generating…" state (D-05).
- The `useReducer` state machine + `RESET` — extend for the cover-letter sub-flow + "Start over" (D-01/D-06).

### Established Patterns
- Single-page `'use client'` `useReducer` flow (no router navigation); UI-SPEC styling contract; grounded-only generation; `response.body.getReader()` streaming (CL-03).

### Integration Points
- "Write Anschreiben" CTA on the Lebenslauf `result` view → new cover-letter phases in the same reducer.
- `cvText = toPlainText(edited Lebenslauf)` → `POST /api/cover-letter` `{ cvText, jobPosting, answers }` → read the streamed body with `getReader()` → append into the read-only letter → on `done`, flip to editable.

</code_context>

<specifics>
## Specific Ideas

Layout sketches confirmed during discussion:

**Input step:**
```
[ job posting textarea ]  *required
1. proudest achievement…   [textarea]
2. why THIS company/role…  [textarea]
3. motivation right now…   [textarea]
4. working style…          [textarea]
5. gap/career change…      [textarea] (optional)
[ Generate Anschreiben ]   (disabled until job posting non-empty)
```

**Result step:**
```
[Generating…] → letter streams in (read-only) → [done]
── Anschreiben ──────────────
…letter…
─────────────────────────────
⚠ Have a native German speaker review this before sending.   (trust callout)
→ click to edit · [ Lebenslauf kopieren ] · [ .txt herunterladen ] · Regenerate · Start over
```

</specifics>

<deferred>
## Deferred Ideas

- **PDF download of the Anschreiben/Lebenslauf (FMT-02)** — v2.
- **`.docx` download (FMT-03)** — v2.
- **Bilingual "why these claims" explanation panel for the cover letter** — considered (D-08); rejected for v1 to keep scope tight; revisit if expat-trust testing shows a need.
- **One-at-a-time question wizard** — considered (D-03); rejected in favor of the single form.
- **PDF upload / client-side extraction (FMT-01)** — v2.

### Pre-execution to-do (not a phase decision, but a gate)
- **`GENERATION_MODEL` must be `claude-opus-4-8` for the cover letter** — it is the quality moat. `anthropic.ts` currently carries a temporary `claude-haiku-4-5` user edit; flip `GENERATION_MODEL` back to Opus before executing/dogfooding Phase 2.

</deferred>

---

*Phase: 2-Cover Letter Flow*
*Context gathered: 2026-06-22*
