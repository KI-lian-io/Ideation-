# Phase 1: Pre-flight + Parse Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 1-pre-flight-parse-flow
**Areas discussed:** Lebenslauf display, Norm-gap & photo panel, Copy / output format, Input & waiting experience, Editing model, Empty/missing fields, German norm elements, Start over / drafts, Norm-gap notes voice, Skills & languages editing, Section order, Non-CV / junk paste

---

## Lebenslauf display — presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Formatted CV preview | Laid out like a real tabellarischer Lebenslauf | |
| Clean structured sections | Tidy blocks, not document-styled | |
| Both: preview + plain | Formatted preview + plain-text toggle (copy source) | ✓ |

**User's choice:** Both: preview + plain.

## Lebenslauf display — editability

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only in v1 | No editing; fix after copying | |
| Editable plain-text | Edit the plain-text view | |
| Fully editable fields | Every section/field individually editable | ✓ |

**User's choice:** Fully editable fields.

## Lebenslauf display — edit depth

| Option | Description | Selected |
|--------|-------------|----------|
| Edit text only | Existing fields editable, structure fixed | |
| Edit + add/remove | Edit all fields + add/remove/reorder entries | ✓ |
| Edit text + add/remove bullets only | Bullet-level structural edits only | |

**User's choice:** Edit + add/remove (full mini CV editor).

## Norm-gap & photo panel — notes placement

| Option | Description | Selected |
|--------|-------------|----------|
| Side panel | Persistent panel beside the CV | |
| Inline annotations | Notes attached to each section (needs schema mapping) | |
| Collapsible block below | "What changed & why" collapsed below the CV | ✓ |

**User's choice:** Collapsible block below.

## Norm-gap & photo panel — photo guidance

| Option | Description | Selected |
|--------|-------------|----------|
| Inside the same block | photoAdvice as one note in the collapsible | |
| Its own labeled callout | "Photo (optional)" callout by the personal-data block | ✓ |
| Top of the notes block | First item in the collapsible | |

**User's choice:** Its own labeled callout.

## Copy / output format

| Option | Description | Selected |
|--------|-------------|----------|
| Clean plain text | Headings + line breaks, no markup | ✓ (copy) |
| Rich formatted paste | Plain + HTML clipboard | |
| Markdown | Markdown markup | |

**User's choice:** Clean plain text — **plus** a request for downloadable PDF/DOCX.
**Notes:** Download is currently v2 (FMT-02/03) and conflicts with Phase 1 scope. Resolved: copy stays clean plain text in Phase 1; **DOCX/PDF download deferred to its own near-term phase** (see CONTEXT deferred ideas).

## Input & waiting experience — loading

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton of the Lebenslauf | Greyed layout fills while loading | ✓ |
| Spinner + reassuring message | Spinner with rotating reassurance | |
| Stepped progress | Fake staged progress | |

**User's choice:** Skeleton of the Lebenslauf.

## Input & waiting experience — zero-retention statement

| Option | Description | Selected |
|--------|-------------|----------|
| Inline reassurance line | Friendly one-liner + icon above the textarea | ✓ |
| Bordered trust callout | Distinct bordered privacy box | |
| Line + "how it works" link | Inline line + expandable explainer | |

**User's choice:** Inline reassurance line.

## Editing model

| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-edit preview | WYSIWYG; controls on hover/focus | ✓ |
| View / Edit toggle | Toggle between form and preview | |
| Edit form, live preview | Side-by-side form + preview | |

**User's choice:** Click-to-edit preview.

## Empty / missing fields

| Option | Description | Selected |
|--------|-------------|----------|
| Fillable blanks | "+ add phone" placeholders invite completion | ✓ |
| Hide empties | Omit null fields | |
| Hide, with a hint | Hide + one note listing what's expected | |

**User's choice:** Fillable blanks.

## German norm elements — signature footer

| Option | Description | Selected |
|--------|-------------|----------|
| Render Ort/Datum + line | Conventional signature footer | |
| Render, with a norm note | Footer + explanatory note | |
| Skip for v1 | No signature footer | ✓ |

**User's choice:** Skip for v1.

## German norm elements — date format

| Option | Description | Selected |
|--------|-------------|----------|
| Trust the model, free-text edits | No validation | |
| Soft-format on blur | Normalize to DD.MM.YYYY on blur | ✓ |
| Validate + hint | Format hint + flag wrong dates | |

**User's choice:** Soft-format on blur (best-effort, keep rules simple).

## Start over / drafts

| Option | Description | Selected |
|--------|-------------|----------|
| Start-over button | Stateless clear + return to input | ✓ (for Phase 1) |
| One parse per visit | Reload to start fresh | |
| Edit-in-place only | No reset | |

**User's choice:** Free-text — wanted to **save the CV / support multiple drafts with a subscription (1 free, pay for more)**.
**Notes:** Flagged a core conflict: saving CVs server-side breaks the zero-retention moat; accounts + subscription is a v2/strategic pivot vs. the agreed one-shot paywall. Resolved: **Phase 1 = stateless Start-over button.** Browser-only drafts (localStorage, no server) deferred to a near-term phase; server-side accounts + subscription logged as a strategic item to revisit post-validation.

## Norm-gap notes voice

| Option | Description | Selected |
|--------|-------------|----------|
| Warm coaching | Friend-explaining-the-norm tone | |
| Terse professional | Short factual deltas | |
| Concise + "why it matters" | One-line change + short why | ✓ |

**User's choice:** Concise + "why it matters" (→ PARSE_SYSTEM tweak).

## Skills & languages — skills

| Option | Description | Selected |
|--------|-------------|----------|
| Editable chips/tags | Chips with × + "+ add" | |
| Editable comma list | One comma-separated line | |
| Chips + categories | Chips grouped into German categories (needs schema change) | ✓ |

**User's choice:** Chips + categories (→ schema + PARSE_SYSTEM change).

## Skills & languages — language levels

| Option | Description | Selected |
|--------|-------------|----------|
| German-convention dropdown | Muttersprache → Grundkenntnisse | ✓ |
| Free-text level | Editable text | |
| CEFR + label | A1–C2 + German label | |

**User's choice:** German-convention dropdown.

## Section order

| Option | Description | Selected |
|--------|-------------|----------|
| Lock to German norm | Fixed section order | |
| Reorderable sections | Drag whole sections | ✓ |
| Locked + rename labels | Order locked, labels renamable | |

**User's choice:** Reorderable sections (default order = German convention).

## Non-CV / junk paste

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly retry message | "Didn't look like a CV — try again" | |
| Show whatever came back | Render blanks and all | |
| Friendly retry + keep their text | Same message, preserve pasted text | ✓ |

**User's choice:** Friendly retry + keep their text.

## Claude's Discretion

- CV textarea affordance (placeholder, submit-disabled-while-empty, basic empty-input guard).
- Readable error + retry on parse failure (400/422/500 already handled by `/api/parse`).
- Page ends at the Lebenslauf for Phase 1 (cover-letter CTA is Phase 2).
- Reasonable mobile stacking (full mobile polish is Phase 4 / UI-02).
- `useReducer` step machine; `resumeText` persists for the later cover-letter step.
- Pre-flight mechanics (Node 20.9 pin, `.nvmrc`, `engines`, `.env.example`, SDK shape confirmation) — not discussed; handled by the planner/executor.

## Deferred Ideas

1. **DOCX/PDF download** — its own near-term phase (currently v2 FMT-02/03). Add to ROADMAP via `/gsd-phase`.
2. **Browser-saved drafts (localStorage, no server)** — near-term phase; preserves zero-retention.
3. **User accounts + subscription monetization** — strategic; conflicts with zero-retention moat + one-shot-paywall model. Revisit only after validation, as an explicit strategy decision.
