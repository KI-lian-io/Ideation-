---
phase: 01-pre-flight-parse-flow
plan: 01
subsystem: scanready/frontend
tags: [node-upgrade, walking-skeleton, useReducer, tdd, zero-retention, paste-parse-render]
dependency_graph:
  requires: []
  provides: [scanready-boots-node20, paste-parse-render-slice, lebenslauf-utils, zero-retention-ui]
  affects: [01-02-PLAN, 01-03-PLAN, 01-04-PLAN]
tech_stack:
  added:
    - "node:test built-in test runner (Node 26, zero new packages)"
  patterns:
    - "useReducer state machine with AppPhase union type"
    - "Direct fetch to /api/parse — no react-query/SWR"
    - "isLebenslaufBasicallyEmpty junk guard (D-17)"
    - "animate-pulse skeleton skeleton (D-15)"
    - "Inline lock SVG zero-retention line (D-14)"
key_files:
  created:
    - scanready/.env.example
    - scanready/.nvmrc
    - scanready/src/lib/lebenslauf-utils.ts
    - scanready/src/lib/__tests__/lebenslauf-utils.test.ts
    - .planning/phases/01-pre-flight-parse-flow/PRE-02-SDK-CONFIRMATION.md
  modified:
    - scanready/package.json (engines field + test script + allowImportingTsExtensions)
    - scanready/.gitignore (!.env.example negation)
    - scanready/tsconfig.json (allowImportingTsExtensions: true)
    - scanready/src/app/page.tsx (full rewrite — 65 lines boilerplate -> 330 lines state machine)
decisions:
  - "Used Node 26 (already at /opt/homebrew/bin) rather than installing Node 20 — satisfies >=20.9.0 requirement without extra installs"
  - "Used Node 26 built-in node:test runner for TDD tests — zero new packages, avoids vitest/jest install constraint"
  - "Added allowImportingTsExtensions: true to tsconfig to allow .ts imports in test file (required by node --experimental-strip-types)"
  - "Added test script to package.json: node --experimental-strip-types src/lib/__tests__/lebenslauf-utils.test.ts"
  - "handleRetry extracted as async function (cleaner than queueMicrotask hack) — duplicate of handleSubmit logic, intentional for readability"
  - "softFormatDate included in lebenslauf-utils.ts proactively (needed by Plan 03 EditableField) — Plan 03 can import without changes"
metrics:
  duration: "8 minutes"
  completed: "2026-06-22"
  tasks_completed: 2
  files_changed: 9
status: complete
---

# Phase 01 Plan 01: Walking Skeleton Summary

One-liner: Node 20.9+ pinned with engines + .nvmrc, npm installed, SDK shapes confirmed, and a 'use client' useReducer state machine delivers the paste -> POST /api/parse -> skeleton -> render-name+first-experience slice with zero-retention line, junk guard, and error handling.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pre-flight: Node, engines, .nvmrc, .env.example, SDK confirmation | b9b4bef | package.json, .gitignore, .env.example, .nvmrc, PRE-02-SDK-CONFIRMATION.md |
| 2 (RED) | TDD: failing tests for isLebenslaufBasicallyEmpty | ddc3acb | src/lib/__tests__/lebenslauf-utils.test.ts |
| 2 (GREEN) | Walking skeleton: lebenslauf-utils + page.tsx rewrite | fca1a11 | src/lib/lebenslauf-utils.ts, src/app/page.tsx, package.json, tsconfig.json |

## What Was Built

### Task 1: Pre-flight (PRE-01, PRE-02, PRE-03)

- `scanready/package.json` — added `engines: { node: ">=20.9.0" }` and `test` script
- `scanready/.nvmrc` — contains `20`
- `scanready/.gitignore` — added `!.env.example` negation so the template is tracked
- `scanready/.env.example` — `ANTHROPIC_API_KEY=` (tracked in git)
- `npm install` run on Node 26 — resolves `@anthropic-ai/sdk@0.105.0` (confirmed)
- `.planning/phases/01-pre-flight-parse-flow/PRE-02-SDK-CONFIRMATION.md` — confirms `messages.parse`/`output_config`/`parsed_output`/`stop_reason==='refusal'` shapes and `messages.stream`/`thinking:{type:'adaptive'}` patterns

### Task 2: TDD + Walking Skeleton (INPUT-01, INPUT-02, INPUT-03)

**RED phase (commit ddc3acb):** Four failing tests for `isLebenslaufBasicallyEmpty` using Node 26's built-in `node:test` runner. Tests confirmed failing before implementation.

**GREEN phase (commit fca1a11):**

`scanready/src/lib/lebenslauf-utils.ts`:
- `isLebenslaufBasicallyEmpty(l: Lebenslauf): boolean` — returns true if no name OR (name + no experience + no education); all 4 behavior tests pass
- `softFormatDate(raw: string): string` — proactively added for Plan 03 date-field use (D-11)

`scanready/src/app/page.tsx` (full rewrite, 330 lines):
- `'use client'` directive is line 1
- `AppPhase` union: `'input' | 'loading' | 'result' | 'error' | 'junk'`
- `AppState` with `resumeText` persisting through all phases
- `sectionOrder` seeded to `['personal','experience','education','skills','languages']`
- `initialState` is static — no `Date.now`, `Math.random`, or `window`
- `reducer` handles: `SET_RESUME_TEXT`, `SUBMIT`, `PARSE_SUCCESS`, `PARSE_ERROR`, `PARSE_JUNK`, `RESET`
- Direct `fetch('/api/parse', ...)` — no react-query/SWR
- 422 -> `PARSE_JUNK`; other `!res.ok` -> `PARSE_ERROR` with readable message; `isLebenslaufBasicallyEmpty` -> `PARSE_JUNK`
- `InputView`: large textarea, submit disabled while empty, inline lock SVG zero-retention line above textarea
- `LoadingView`: `animate-pulse` skeleton (3 block groups) — NOT a progress bar
- `ResultView`: renders `personal.fullName` and first `experience` entry's `role` + `company`; "Start over" RESET button
- `ErrorView`: readable error + retry affordance
- `JunkView`: amber callout, textarea preserving pasted text, retry affordance

Security (T-01-02, T-01-04): No `dangerouslySetInnerHTML`, no `ANTHROPIC_API_KEY` client-side — verified by negative greps.

## TDD Gate Compliance

- RED gate commit: `ddc3acb` (test(01-01): add failing tests) — 4 tests failing before implementation
- GREEN gate commit: `fca1a11` (feat(01-01): walking skeleton) — all 4 tests pass

## Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| node --version >= 20.9.0 (Node 26 at /opt/homebrew/bin) | PASS |
| package.json engines.node >=20.9.0 | PASS |
| .nvmrc contains 20 | PASS |
| git ls-files .env.example lists it (tracked despite .env* glob) | PASS |
| .env.local remains git-ignored | PASS |
| node_modules exists (npm install succeeded) | PASS |
| PRE-02-SDK-CONFIRMATION.md records confirmed shapes | PASS |
| No new entries in dependencies/devDependencies | PASS |
| npx tsc --noEmit exits 0 | PASS |
| page.tsx line 1 is 'use client' | PASS |
| page.tsx POSTs to /api/parse via direct fetch | PASS |
| lebenslauf-utils.ts exports isLebenslaufBasicallyEmpty | PASS |
| All 4 behavior tests pass | PASS |
| Zero-retention lock-icon line above textarea | PASS |
| Submit disabled while textarea empty | PASS |
| loading phase uses animate-pulse skeleton | PASS |
| 422 or empty result -> junk phase, resumeText preserved | PASS |
| !res.ok -> error phase with readable message | PASS |
| result phase shows fullName + first experience role/company | PASS |
| No dangerouslySetInnerHTML | PASS |
| No ANTHROPIC_API_KEY in page.tsx | PASS |
| initialState has no Date.now/Math.random/window | PASS |

## Deviations from Plan

### Auto-fixed / Proactive additions

**1. [Rule 2 - Missing critical functionality] allowImportingTsExtensions added to tsconfig**
- **Found during:** Task 2 RED phase
- **Issue:** Node 26's `--experimental-strip-types` requires explicit `.ts` extension in import paths, but TypeScript's default config (`moduleResolution: bundler`) forbids `.ts` extensions in imports without `allowImportingTsExtensions: true`
- **Fix:** Added `"allowImportingTsExtensions": true` to `tsconfig.json` compilerOptions — compatible with `noEmit: true` already set
- **Files modified:** `scanready/tsconfig.json`
- **Impact:** Zero functional impact; this flag is permitted and intended for exactly this pattern

**2. [Rule 2 - Missing critical functionality] npm test script added to package.json**
- **Found during:** Task 2 GREEN phase
- **Issue:** Plan described TDD tests but provided no way to run them via npm
- **Fix:** Added `"test": "node --experimental-strip-types src/lib/__tests__/lebenslauf-utils.test.ts"` to scripts — no new packages, zero-package constraint respected
- **Files modified:** `scanready/package.json`

**3. [Rule 2 - Missing critical functionality] softFormatDate proactively added to lebenslauf-utils.ts**
- **Found during:** Task 2 GREEN phase, reading PATTERNS.md
- **Reason:** Plan 03 (EditableField + WYSIWYG editor) imports `softFormatDate` from `@/lib/lebenslauf-utils` per PATTERNS.md §lebenslauf-utils.ts. Seeding it now avoids a missing import in Plan 03.
- **Fix:** Added `softFormatDate` as a named export alongside `isLebenslaufBasicallyEmpty`
- **Files modified:** `scanready/src/lib/lebenslauf-utils.ts`
- **Impact:** Pure additive; does not affect Plan 01-01's surface

## Known Stubs

The result phase (`ResultView`) renders a minimal skeleton:
- `lebenslauf.personal.fullName` — full name only
- First `experience` entry's `role` + `company` only
- No education, skills, languages, normGapNotes rendered

These are intentional stubs per the plan spec ("the skeleton render; the full WYSIWYG editor is Plan 03"). They do not prevent the plan's goal (proving the paste->parse->render pipe). Plans 02/03 wire the full editor.

## Threat Flags

No new threat surface introduced beyond the plan's threat model. Negative greps on `dangerouslySetInnerHTML` and `ANTHROPIC_API_KEY` confirmed clean.

## Self-Check: PASSED
