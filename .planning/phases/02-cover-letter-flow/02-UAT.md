---
status: testing
phase: 02-cover-letter-flow
source: [02-VERIFICATION.md]
started: 2026-06-22T20:17:39Z
updated: 2026-06-22T20:17:39Z
---

## Current Test

number: 1
name: Full live cover-letter flow — stream + umlauts
expected: |
  Skeleton shows immediately; first German letter text arrives within ~2-3s
  (adaptive-thinking pre-token pause is expected); ä/ö/ü render correctly (not
  U+FFFD); stream completes and transitions to the editable result view.
awaiting: user response

## Tests

### 1. Full live flow — paste CV → Lebenslauf → "Anschreiben schreiben" → paste job posting → (optionally answer questions) → "Anschreiben generieren" → observe streaming
prereq: Run `npm run dev` on Node >=20.9 (local Node 18.14 cannot start Next 16).
expected: Skeleton visible immediately; first German text chunk within ~2-3s; umlauts ä/ö/ü intact (no U+FFFD); on completion the letter becomes an editable <textarea> with the "Hinweis" native-speaker callout below it.
result: [pending]

### 2. Copy to clipboard
expected: In the result view, clicking "Anschreiben kopieren" changes the label to "Kopiert ✓" for ~1500ms, then reverts. (.txt download produces anschreiben.txt; Regenerieren re-streams; Start over returns to the paste step.)
result: [pending]

### 3. Generate button disabled-gate
expected: In the cover-letter input view, "Anschreiben generieren" is visibly disabled/unclickable while the job-posting field is empty, and enables on any non-whitespace input.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
