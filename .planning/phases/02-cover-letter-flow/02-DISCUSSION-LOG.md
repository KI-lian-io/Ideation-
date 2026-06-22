# Phase 2: Cover Letter Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 2-Cover Letter Flow
**Areas discussed:** Flow entry & CV source, Questions UX, Streaming render, Finished letter: output & trust

---

## Flow entry & CV source

| Option | Description | Selected |
|--------|-------------|----------|
| CTA + edited Lebenslauf | "Write Anschreiben" CTA extends the same single-page reducer flow; ground in `toPlainText(edited Lebenslauf)` so corrections carry through | ✓ |
| CTA + raw résumé | Same entry, but ground in raw `resumeText` (richer detail, ignores edits) | |
| Separate standalone step | Distinct cover-letter entry, no parse required first | |

**User's choice:** CTA + edited Lebenslauf
**Notes:** Reducer gains cover-letter phases; `cvText = toPlainText(editedLebenslauf)`.

---

## Questions UX

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 at once, form | All 5 PERSONALIZATION_QUESTIONS as one form of textareas; job posting required; answers optional/encouraged | ✓ |
| One-at-a-time wizard | Step through questions individually | |
| Job posting + collapsed Qs | Job posting required, questions in an optional expandable section | |

**User's choice:** All 5 at once, form
**Notes:** Job posting required to generate; Q5 (gap/career change) explicitly optional.

---

## Streaming render

| Option | Description | Selected |
|--------|-------------|----------|
| Typewriter → editable | Stream into read-only styled letter (skeleton until first token); editable after; Regenerate + Start over | ✓ |
| Typewriter → read-only | Stream read-only; copy only, no inline edit | |
| Stream into a textarea | Tokens append into an editable textarea throughout | |

**User's choice:** Typewriter → editable
**Notes:** Consume via `response.body.getReader()` (CL-03 locked); no editing during stream.

---

## Finished letter: output & trust

| Option | Description | Selected |
|--------|-------------|----------|
| Copy + .txt, German-only | Copy + plain-text download; PDF/.docx deferred; native-speaker nudge as a callout (drop inline bracket) | ✓ |
| Copy only, German-only | Copy is enough for MVP; no download | |
| Add bilingual 'why' note | Also render an English explanation of the letter's choices | |

**User's choice:** Copy + .txt, German-only
**Notes:** Drop the inline `[bracket]` review note from `COVER_LETTER_SYSTEM` (one-line prompt edit — only backend change); render the nudge as a distinct callout.

## Claude's Discretion

- Exact reducer phase names + action shapes for the cover-letter sub-flow.
- Whether/how to show a soft "answer at least one question" hint.
- `.txt` filename convention.
- Typewriter cadence (raw vs lightly buffered token render).

## Deferred Ideas

- PDF download (FMT-02), `.docx` download (FMT-03) — v2.
- Bilingual "why these claims" explanation panel for the cover letter — v1 rejected, revisit post-testing.
- One-at-a-time question wizard — rejected in favor of the single form.
- PDF upload / client-side extraction (FMT-01) — v2.
- Pre-execution gate: flip `GENERATION_MODEL` back to `claude-opus-4-8` (currently a temporary Haiku edit) before executing Phase 2.
