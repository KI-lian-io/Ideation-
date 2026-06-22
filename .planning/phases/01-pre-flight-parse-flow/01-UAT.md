---
status: testing
phase: 01-pre-flight-parse-flow
source: [01-VERIFICATION.md]
started: "2026-06-22"
updated: "2026-06-22"
---

## Current Test

number: 1
name: End-to-end parse round-trip
expected: |
  With ANTHROPIC_API_KEY set in scanready/.env.local and the dev server running on
  Node 20.9+ (`export PATH=/opt/homebrew/bin:$PATH && npm run dev`), paste a real
  US/UK CV into the textarea, submit, see the loading skeleton, then see the rendered
  German Lebenslauf (name + Berufserfahrung at minimum).
awaiting: user response

## Tests

### 1. End-to-end parse round-trip
expected: Paste CV → loading skeleton → rendered Lebenslauf (name + at least one Berufserfahrung entry). Zero-retention line shows above the textarea before submit. (INPUT-01/02/03, LL-01)
result: [pending]

### 2. WYSIWYG editor interaction
expected: Click any field to edit; add/remove/reorder entries and bullets; reorder sections; empty fields show fillable-blank placeholders; a date soft-formats to DD.MM.YYYY on blur; "Start over" resets to a blank input. (LL-01, D-01..D-04, D-08, D-11, D-12, D-16)
result: [pending]

### 3. Copy output
expected: "Lebenslauf kopieren" copies the current edited state as plain text — German section headings (Persönliche Daten / Berufserfahrung / Bildung / Kenntnisse / Sprachen), categorized skill labels, and German language levels all appear; transient "Kopiert ✓" feedback. (LL-04, D-04)
result: [pending]

### 4. Norm-gap panel + photo callout
expected: Below the Lebenslauf, a collapsible "Was hat sich geändert & warum? (N Hinweise)" panel renders the model's norm-gap notes in the concise "[change] — [why it matters]" voice (D-07). A clearly-labelled "Foto (optional)" callout renders photoAdvice verbatim, framed as optional under the AGG and never mandated. (LL-02, LL-03, D-05, D-06)
result: [pending]

### 5. Categorized skill chips + German language dropdown
expected: Kenntnisse renders as editable chips grouped under German category headings (IT-/Fach-/Sonstige Kenntnisse); add/remove chips and categories, edit names. Sprachen offers the German-convention level dropdown (Muttersprache / Verhandlungssicher / Fließend / Gute Kenntnisse / Grundkenntnisse) — not free text or CEFR codes. (D-09 UI, D-10 UI)
result: [pending]

### 6. Junk + error paths
expected: A near-empty / non-CV paste routes to the amber "That did not look like a CV" callout and preserves the pasted text; a server/API error shows a readable error with a retry that preserves pasted text. (INPUT-03, D-17)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
