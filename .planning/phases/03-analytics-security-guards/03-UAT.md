---
status: testing
phase: 03-analytics-security-guards
source: [03-VERIFICATION.md]
started: 2026-06-23T08:18:57Z
updated: 2026-06-23T08:18:57Z
---

## Current Test

number: 1
name: Client char-counter visual state (InputView)
expected: |
  Counter turns red (text-red-500) with "— Text zu lang" and the Convert button is disabled.
awaiting: user response

## Tests

> NOTE: The server-side guards (criteria 1, 2, 4) are already **live-verified** — curl against the
> production build returned HTTP 400 + the correct German message for oversized resumeText (30k),
> cvText (30k), jobPosting (15k), and any answer (2k), plus missing-input. Only the client counter
> **visual** state (below) remains to eyeball. Prereq: `npm run dev` (Node 22 is available).

### 1. InputView counter (CV field)
expected: Paste >30,000 chars into the CV field → the counter turns red, shows "— Text zu lang", and the Convert-to-Lebenslauf button is visibly disabled.
result: [pending]

### 2. CoverLetterInputView counters (job posting + answers)
expected: Paste >15,000 chars into the job posting → its counter turns red with "— Text zu lang"; paste >2,000 into an answer → that counter turns red with "— Antwort zu lang"; the Anschreiben submit button is disabled while any field is over its limit.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
