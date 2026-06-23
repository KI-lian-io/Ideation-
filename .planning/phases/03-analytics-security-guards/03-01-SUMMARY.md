---
phase: 03-analytics-security-guards
plan: "01"
subsystem: security-guards
tags: [security, input-validation, german-ux, statelessness]
status: complete

dependency_graph:
  requires: []
  provides:
    - resumeText length guard on /api/parse (30,000-char server-side 400 before Anthropic call)
    - German missing-input and over-limit error messages on /api/parse
    - InputView live char counter with red-500 over-limit state
    - InputView disabled submit when resumeText exceeds 30,000 chars
  affects:
    - scanready/src/app/api/parse/route.ts
    - scanready/src/app/page.tsx

tech_stack:
  added: []
  patterns:
    - Server-side per-field length constant (RESUME_LIMIT = 30_000) placed before Anthropic call
    - Client-side mirror of limit constant (RESUME_LIMIT = 30_000) inside InputView
    - resumeOverLimit boolean driving disabled-submit OR-extension and counter color
    - German counter format via toLocaleString('de-DE')

key_files:
  modified:
    - scanready/src/app/api/parse/route.ts
    - scanready/src/app/page.tsx
  created: []

decisions:
  - "RESUME_LIMIT = 30_000 declared as a named constant in both files (server + client) for readability and easy future tuning — not inlined as a magic number"
  - "Counter displays in German locale (toLocaleString('de-DE')) producing '30.000' (period as thousands separator) to match German number conventions"
  - "isSubmitDisabled OR-extended (not replaced) to preserve the existing empty-string base condition"

metrics:
  duration: "89s"
  completed: "2026-06-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 0
---

# Phase 03 Plan 01: Input-Length Security Guard (parse route + InputView) Summary

Server-side 30,000-char resumeText guard on `/api/parse` returning 400 + German error JSON before any Anthropic call, with a mirrored client-side live character counter and disabled submit in `InputView`.

## What Was Built

### Task 1 — /api/parse server-side guard (`b04381a`)

Added to `scanready/src/app/api/parse/route.ts`:

- Aligned the existing English missing-input message to German: `"Lebenslauf-Text ist erforderlich."`
- Declared `const RESUME_LIMIT = 30_000` immediately after the presence check
- Added a length guard: if `resumeText.length > RESUME_LIMIT`, returns `NextResponse.json({ error: "Der Text ist zu lang (max. 30.000 Zeichen)." }, { status: 400 })`
- Guard sits before the `anthropic.messages.parse()` call — no model invocation, no cost on oversized input
- No `resumeText` content logged anywhere (D-05 verified by negative grep)

### Task 2 — InputView client counter + disabled submit (`bb3548b`)

Added to `scanready/src/app/page.tsx` inside `InputView`:

- Declared `const RESUME_LIMIT = 30_000` and `const resumeOverLimit = resumeText.length > RESUME_LIMIT`
- Extended `isSubmitDisabled` to `resumeText.trim().length === 0 || resumeOverLimit` (base condition preserved)
- Added counter `<p>` element below the textarea: renders `{count / 30.000}`, appends `" — Text zu lang"` when over limit
- Counter color: `text-zinc-400 dark:text-zinc-500` normally; `text-red-500` when over limit
- No `localStorage`/`sessionStorage` introduced (statelessness preserved)

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (Task 1) | PASS |
| `grep -q "30_000" route.ts && grep -q "Der Text ist zu lang..." && grep -q "Lebenslauf-Text..."` | GUARD_OK |
| `grep -cE 'console\.(log\|error\|warn\|info)\(.*resumeText'` = 0 | NO_REJECTION_LOG_OK |
| `npx tsc --noEmit` (Task 2) | PASS |
| `grep -q "RESUME_LIMIT" && grep -q "resumeOverLimit" && grep -q "30.000" page.tsx` | COUNTER_OK |
| `grep -cE 'localStorage\|sessionStorage' page.tsx` = 0 | STATELESS_OK |
| Manual: `npm run dev` counter red + button disabled at >30k chars | DEFERRED-MANUAL (Node >=20.9 required; local env is Node 22 — runnable, but deferred to human UAT in gsd-verify-work) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no placeholder values, hardcoded empty arrays/objects, or unresolved TODOs introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The plan closes threat T-03-01 (DoS/cost abuse) and T-03-02 (retention leak via rejection logging) as mitigated.

## Self-Check: PASSED
