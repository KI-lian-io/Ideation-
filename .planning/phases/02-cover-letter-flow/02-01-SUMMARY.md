---
phase: 02-cover-letter-flow
plan: 01
subsystem: cover-letter-ui
tags: [reducer, streaming, ux, prompts]
status: complete

dependency_graph:
  requires: []
  provides: [cover-letter-flow-spine, streaming-reader, reducer-cover-letter-phases]
  affects: [scanready/src/app/page.tsx, scanready/src/lib/anthropic.ts, scanready/src/lib/prompts.ts]

tech_stack:
  added: []
  patterns:
    - useReducer state machine with 4 new cover-letter phases
    - AbortController + useRef for streaming cancellation
    - TextDecoder with stream:true for umlaut-safe chunk decoding
    - pre tag rendering for streamed letter (XSS guard, no dangerouslySetInnerHTML)

key_files:
  created: []
  modified:
    - scanready/src/lib/anthropic.ts
    - scanready/src/lib/prompts.ts
    - scanready/src/app/page.tsx

decisions:
  - Tasks 2 and 3 committed as one atomic commit — both modify page.tsx and separating them would leave a non-typechecking intermediate state (reducer types without views that reference them)
  - TextDecoder instantiated with explicit utf-8 encoding and fatal:false to prevent umlaut corruption on chunk boundaries
  - cover_letter_error phase renders inline without a separate view component — inline JSX sufficient given its simplicity

metrics:
  duration_minutes: 30
  completed: 2026-06-22
  tasks_completed: 3
  files_modified: 3
---

# Phase 02 Plan 01: Cover-Letter Vertical Slice Spine Summary

End-to-end Anschreiben sub-flow wired into the existing useReducer state machine — model restored, prompt cleaned, streaming reader + three new views delivered.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Restore GENERATION_MODEL + D-09 prompt edit | 5dee5d1 | anthropic.ts, prompts.ts |
| 2+3 | Extend reducer + wire streaming views | 459d0bb | page.tsx |

## What Was Built

**Task 1 — Model restore + prompt cleanup (5dee5d1)**

- `GENERATION_MODEL` restored to `claude-opus-4-8` (was incorrectly set to `claude-haiku-4-5` in a pre-execution working tree edit)
- `PARSE_MODEL` left at `claude-haiku-4-5` — outside this plan's scope, tracked as cost-lever for later confirmation
- D-09 applied: removed the bracket review-note directive from `COVER_LETTER_SYSTEM` (`- End with a short note (in [brackets])...`) and updated the final instruction from `Write only the letter (plus the bracketed review note). No preamble.` to `Write only the letter. No preamble.`

**Tasks 2+3 — Reducer extension + views (459d0bb)**

State machine extended in `page.tsx` (990 lines, up from 655):

New `AppPhase` values:
- `cover_letter_input` — job posting + answers form
- `cover_letter_streaming` — live token stream
- `cover_letter_result` — complete letter with copy/regenerate
- `cover_letter_error` — error with retry/edit actions

New `AppState` fields:
- `jobPosting: string`
- `answers: { question: string; answer: string }[]` — seeded from `PERSONALIZATION_QUESTIONS`

New `AppAction` types: `START_COVER_LETTER`, `SET_JOB_POSTING`, `SET_ANSWER`, `COVER_LETTER_STREAMING`, `COVER_LETTER_DONE`, `COVER_LETTER_ERROR`, `COVER_LETTER_REGENERATE`

`handleGenerateLetter`:
- Calls `toPlainText(state.lebenslauf!, state.sectionOrder)` for CV grounding (D-02 — not raw `resumeText`)
- `AbortController` pattern with `useRef` + `useEffect` cleanup
- `TextDecoder('utf-8', { fatal: false })` with `{ stream: true }` on each `decode()` call — mandatory for German umlaut safety across chunk boundaries
- Tail flush after loop to drain any buffered bytes

New view components:
- `CoverLetterInputView` — job posting textarea + all 5 PERSONALIZATION_QUESTIONS as labelled textareas, submit disabled until job posting non-empty, native-speaker nudge callout (D-09 moved from prompt to UI)
- `CoverLetterStreamingView` — skeleton until first chunk arrives, then `<pre>` text node (no `dangerouslySetInnerHTML` — T-02-01 XSS guard)
- `CoverLetterResultView` — copy button with copied/error state, regenerate, start over

`ResultView` extended with `onStartCoverLetter` prop and "Anschreiben schreiben" CTA block.

## Deviations from Plan

### Combined commit for Tasks 2 and 3

**Found during:** Task 2 planning

**Issue:** Tasks 2 and 3 both modify `page.tsx`. Committing Task 2 alone (reducer types + cases) without the views that reference the new state fields would create a non-typechecking intermediate commit — `CoverLetterInputView` and `CoverLetterStreamingView` reference `state.jobPosting`, `state.answers` etc. which only exist after Task 2's state extension.

**Fix:** Committed both as one atomic `feat(02-01)` commit. The PLAN listed them as separate commits but this is a deviation the plan anticipated by noting they're in the same file.

**Files modified:** scanready/src/app/page.tsx

**Commit:** 459d0bb

### No separate `CoverLetterErrorView` component

The `cover_letter_error` phase renders inline JSX in `Home()` rather than a dedicated view component. Three lines of error display + two buttons don't warrant extraction; `ErrorView` and `JunkView` exist because they reuse the retry flow with `resumeText` state, which the cover-letter error does not need.

## Known Stubs

None — all state fields are wired end-to-end. `letterText` is `useState` local state (not reducer) so it doesn't appear in reducer initial values.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: xss | scanready/src/app/page.tsx | Streamed letter text rendered as pre text node — no dangerouslySetInnerHTML (T-02-01 mitigated) |

No new unmitigated threat surface introduced.

## Smoke Test Notes

`npm run dev` and `npm run build` require Node ≥20.9 — local environment is 18.14.0. These are manual/deferred smoke steps. `npx tsc --noEmit` passed cleanly on Node 18. Full runtime smoke test should be performed after Node upgrade.

## Self-Check: PASSED

- [x] `scanready/src/lib/anthropic.ts` — GENERATION_MODEL = "claude-opus-4-8" confirmed
- [x] `scanready/src/lib/prompts.ts` — no "bracket" or "[brackets]" text in COVER_LETTER_SYSTEM confirmed
- [x] `scanready/src/app/page.tsx` — 990 lines (min_lines: 700 satisfied)
- [x] Commit 5dee5d1 exists: `git log --oneline | grep 5dee5d1`
- [x] Commit 459d0bb exists: `git log --oneline | grep 459d0bb`
- [x] `npx tsc --noEmit` clean (no output)
