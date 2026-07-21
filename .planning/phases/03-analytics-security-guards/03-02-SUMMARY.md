---
phase: 03-analytics-security-guards
plan: "02"
subsystem: security-guards
tags: [security, input-validation, german-ux, statelessness, streaming-route]
status: complete

dependency_graph:
  requires:
    - 03-01 (InputView RESUME_LIMIT/resumeOverLimit pattern — mirrored here for CoverLetterInputView)
  provides:
    - Server-side per-field length guards on /api/cover-letter (cvText 30k, jobPosting 15k, each answer 2k)
    - JSON 400 shape alignment on /api/cover-letter (was plain text, now NextResponse.json)
    - CoverLetterInputView live jobPosting counter (de-DE locale, count / 15.000)
    - CoverLetterInputView per-answer counters (de-DE locale, count / 2.000)
    - Disabled submit when jobPosting or any answer exceeds its limit
  affects:
    - scanready/src/app/api/cover-letter/route.ts
    - scanready/src/app/page.tsx

tech_stack:
  added: []
  patterns:
    - Server-side per-field length constants (CV_LIMIT, POSTING_LIMIT, ANSWER_LIMIT) placed before Anthropic stream call
    - NextResponse.json({ error }, { status: 400 }) shape aligned across both API routes
    - Client-side mirror constants (POSTING_LIMIT, ANSWER_LIMIT) inside CoverLetterInputView
    - postingOverLimit / anyAnswerOverLimit booleans driving disabled-submit AND-extension and counter color
    - German counter format via toLocaleString('de-DE') — mirrors 03-01 InputView pattern
    - answers.some() iteration for per-answer over-limit detection

key_files:
  modified:
    - scanready/src/app/api/cover-letter/route.ts
    - scanready/src/app/page.tsx
  created: []

decisions:
  - "CV_LIMIT = 30_000 / POSTING_LIMIT = 15_000 / ANSWER_LIMIT = 2_000 declared as named constants (not magic numbers) in both server and client files — easy to tune, matches 03-01 pattern"
  - "NextResponse.json 400 shape adopted on cover-letter route to align with /api/parse (D-03) and support the existing client error-message parsing pattern"
  - "canSubmit is AND-extended (not replaced) to preserve the base non-empty check: jobPosting.trim().length > 0 && !postingOverLimit && !anyAnswerOverLimit"
  - "per-answer iteration uses answers.some() on the client and a for-of loop on the server — both short-circuit on the first over-limit answer"
  - "German message wording: 'Text zu lang' (posting) / 'Antwort zu lang' (answer) consistent with 03-01 'Text zu lang' convention"

metrics:
  duration: "105s"
  completed: "2026-06-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 0
---

# Phase 03 Plan 02: Cover-Letter Security Guards Summary

Server-side per-field length guards on `/api/cover-letter` (JSON 400 before stream starts) plus client-side CoverLetterInputView live counters and disabled submit for the job posting and each answer field.

## What Was Built

### Task 1 — /api/cover-letter server-side guards (`2d4106c`)

Added to `scanready/src/app/api/cover-letter/route.ts`:

- Added `NextResponse` to the import (line 1 now imports both `NextRequest` and `NextResponse`)
- Replaced the old plain-text `new Response("cvText, jobPosting and answers are required", { status: 400 })` with `NextResponse.json({ error: "cvText, jobPosting und answers sind erforderlich." }, { status: 400 })` — JSON shape, German message, type-narrowing for cvText and jobPosting (`typeof ... !== "string"`)
- Declared `CV_LIMIT = 30_000`, `POSTING_LIMIT = 15_000`, `ANSWER_LIMIT = 2_000` immediately after the presence check
- Added `cvText.length > CV_LIMIT` guard returning `{ error: "Der Lebenslauf-Text ist zu lang (max. 30.000 Zeichen)." }`
- Added `jobPosting.length > POSTING_LIMIT` guard returning `{ error: "Das Stellenangebot ist zu lang (max. 15.000 Zeichen)." }`
- Added `for (const ans of answers)` loop: if `ans.answer.length > ANSWER_LIMIT` returns `{ error: "Eine Antwort ist zu lang (max. 2.000 Zeichen)." }`
- All guards sit before `anthropic.messages.stream(` — zero model cost / streaming cost on rejected input
- No rejected content logged (D-05): existing `console.error("cover-letter stream error", err)` unchanged, logs only caught Error objects

### Task 2 — CoverLetterInputView client counters + disabled submit (`f679564`)

Added to `scanready/src/app/page.tsx` inside `CoverLetterInputView`:

- Declared `POSTING_LIMIT = 15_000` and `ANSWER_LIMIT = 2_000`
- Computed `postingOverLimit = jobPosting.length > POSTING_LIMIT` and `anyAnswerOverLimit = answers.some((a) => a.answer.length > ANSWER_LIMIT)`
- Extended `canSubmit` to `jobPosting.trim().length > 0 && !postingOverLimit && !anyAnswerOverLimit` (base condition preserved)
- Added jobPosting counter `<p>` below the textarea: `{jobPosting.length.toLocaleString('de-DE')} / 15.000`, appends `' — Text zu lang'` when over limit; `text-zinc-400 dark:text-zinc-500` normally, `text-red-500` when over limit
- Added per-answer counter `<p>` inside the `answers.map(...)` block, after each answer's textarea: `{a.answer.length.toLocaleString('de-DE')} / 2.000`, appends `' — Antwort zu lang'` when `a.answer.length > ANSWER_LIMIT`; same styling convention
- Submit button `disabled={!canSubmit}` was already wired — no change needed
- No `localStorage`/`sessionStorage` introduced (statelessness preserved)

03-01's InputView `RESUME_LIMIT`/`resumeOverLimit`/counter changes confirmed intact (verified by grep).

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (Task 1) | PASS |
| `grep -q "NextResponse" && grep -q "30_000"` | IMPORT_AND_CV_OK |
| `grep -q "15_000" && grep -q "2_000" && grep -q "Das Stellenangebot..."` | LIMITS_OK |
| `grep -cE 'console\.(log\|error\|warn\|info)\(.*(cvText\|jobPosting\|answer)'` = 0 | NO_REJECTION_LOG_OK |
| `npx tsc --noEmit` (Task 2) | PASS |
| `grep -q "POSTING_LIMIT" && grep -q "ANSWER_LIMIT" && grep -q "anyAnswerOverLimit"` | GATES_OK |
| `grep -q "15.000" && grep -q "2.000" && grep -q "postingOverLimit"` | COUNTERS_OK |
| `grep -cE 'localStorage\|sessionStorage'` = 0 | STATELESS_OK |
| 03-01 InputView counters intact (`RESUME_LIMIT`, `resumeOverLimit`, `30.000`) | PLAN_01_INTACT |
| Manual: counter red + button disabled at >15k / >2k chars | DEFERRED-MANUAL (requires Node >=20.9 and `npm run dev`; human UAT in gsd-verify-work) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no placeholder values, hardcoded empty arrays/objects, or unresolved TODOs introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan closes threat T-03-04 (DoS/cost abuse on `/api/cover-letter`) and T-03-05 (retention leak via rejection logging) as mitigated. T-03-06 (client persistence) is accepted — statelessness verified by negative localStorage/sessionStorage grep.

## Self-Check: PASSED
