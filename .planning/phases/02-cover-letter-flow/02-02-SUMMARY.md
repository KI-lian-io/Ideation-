---
phase: 02-cover-letter-flow
plan: 02
subsystem: cover-letter-result-view
tags: [clipboard, download, editable-textarea, trust-callout, ux]
status: complete

dependency_graph:
  requires: [02-01]
  provides: [cover-letter-result-complete, trust-callout, copy-download-actions]
  affects: [scanready/src/app/page.tsx]

tech_stack:
  added: []
  patterns:
    - Blob + URL.createObjectURL for browser-native .txt download (no server round-trip)
    - navigator.clipboard.writeText with idle|copied|error local state (1500ms/3000ms)
    - Controlled textarea rows={18} for post-stream editable letter (NOT EditableField)
    - One-shot showEditHint local useState dismissed on first focus/change
    - ErrorView reused for cover_letter_error with onRetry prop

key_files:
  created: []
  modified:
    - scanready/src/app/page.tsx

decisions:
  - Tasks 1 and 2 committed atomically — adding setLetterText prop and rewiring cover_letter_error both required for typecheck; identical situation to Plan 01 Tasks 2+3
  - Trust callout uses zinc-100/zinc-800 neutral styling (per UI-SPEC: distinct from amber warning callout; neutral "Hinweis" block below letter)
  - cover_letter_error branch converted from inline JSX to ErrorView with onRetry={handleGenerateLetter} — lossless retry (jobPosting+answers persist in reducer through error phase)
  - dangerouslySetInnerHTML negative grep check skipped for automation (two pre-existing XSS-guard comments contain the string); actual JSX attribute confirmed absent by grep -v comment filter

metrics:
  duration_minutes: 2
  completed: 2026-06-22
  tasks_completed: 2
  files_modified: 1
---

# Phase 02 Plan 02: CoverLetterResultView — Editable Letter, Trust Callout, Copy/Download Summary

Post-stream cover-letter result experience completed: editable textarea, native-speaker-review trust callout, clipboard copy with Kopiert-tick pattern, browser-native .txt download, Regenerieren, and Start over — full dogfoodable end-to-end journey.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1+2 | Build CoverLetterResultView + wire cover_letter_result / cover_letter_error branches | 8cc901d | page.tsx |

## What Was Built

**Tasks 1+2 — Full result view + branch wiring (8cc901d)**

`CoverLetterResultView` replaced the Plan 01 stub (which used a read-only `<pre>`, had no download button, used English "Regenerate", and lacked the trust callout). Changes in `scanready/src/app/page.tsx` (1030 lines, up from 990):

**CoverLetterResultView component:**

- Section label eyebrow "Anschreiben" using `text-xs font-semibold uppercase tracking-widest text-zinc-400` (reuses ResultView pattern)
- One-shot "Klicken zum Bearbeiten" hint: local `const [showEditHint, setShowEditHint] = useState(true)`, dismissed on first `onChange` or `onFocus`
- Editable letter block: plain controlled `<textarea value={letterText} onChange={e => { setLetterText(e.target.value); ... }} rows={18} aria-label="Anschreiben">` — NOT `EditableField` (which hardcodes `rows={3}`). No `dangerouslySetInnerHTML` (XSS guard T-02-05)
- Native-speaker trust callout (D-09 / CL-05): distinct neutral block below the letter using `rounded-lg border border-zinc-200 bg-zinc-100 … dark:border-zinc-700 dark:bg-zinc-800` with "Hinweis" eyebrow and the UI-SPEC copywriting contract: "Bitte lassen Sie dieses Anschreiben von einem Muttersprachler prüfen, bevor Sie es absenden."
- Copy button: `navigator.clipboard.writeText(letterText)` with `idle|copied|error` state, 1500ms/3000ms timeouts, "Kopiert ✓" label on success, inline error copy on failure (CL-06)
- Download button: `new Blob([letterText], { type: 'text/plain;charset=utf-8' })` → `URL.createObjectURL` → transient `<a download="anschreiben.txt">` → `URL.revokeObjectObject` — browser-native, no server round-trip (D-07)
- Action row: `flex items-center gap-3 flex-wrap` — "Anschreiben kopieren" (primary) · ".txt herunterladen" (secondary) · "Regenerieren" (secondary) · "Start over" (secondary)
- All buttons have `aria-label` attributes per UI-SPEC accessibility table

**Phase branch wiring:**

- `cover_letter_result` branch now passes `setLetterText={setLetterText}` (was missing in Plan 01)
- `cover_letter_error` branch converted from inline JSX to `<ErrorView message={state.errorMessage ?? '...'} resumeText={state.jobPosting} onRetry={handleGenerateLetter} />` — enables lossless retry using `onRetry={handleGenerateLetter}` pattern; `resumeText={state.jobPosting}` passed to satisfy the ErrorView prop shape (disabled guard when empty)

## Deviations from Plan

### Combined commit for Tasks 1 and 2

**Found during:** Task 1 verify (typecheck)

**Issue:** `CoverLetterResultView` now requires `setLetterText` prop (new in Task 1). The existing call site in `Home()` does not pass it, causing a TypeScript error `TS2741: Property 'setLetterText' is missing`. Task 2 is supposed to add that prop. Running Task 1's `npx tsc --noEmit` verify before doing Task 2's wiring would fail. Separating them produces a non-typechecking intermediate commit.

**Fix:** Both tasks committed atomically as a single `feat(02-02)` commit. Identical pattern to Plan 01's Tasks 2+3 atomic commit (documented in 02-01-SUMMARY.md).

**Files modified:** scanready/src/app/page.tsx

**Commit:** 8cc901d

---

### dangerouslySetInnerHTML negative grep check skipped for automation

**Found during:** Task 1 verify

**Issue:** The plan's automated verify includes `! grep -q "dangerouslySetInnerHTML" src/app/page.tsx`. However, Plan 01 left two XSS-guard comments in page.tsx that contain the string `dangerouslySetInnerHTML` (lines 689 and 755 of the post-commit file). These comments are intentional security documentation ("no dangerouslySetInnerHTML — XSS guard T-02-01 / T-02-05"). The grep exits non-zero because the string matches comments.

**Verification performed:** `grep -n "dangerouslySetInnerHTML" ... | grep -v "//" | grep -v "\*"` returned empty — no actual JSX attribute usage, only comments. The acceptance criterion is fully met.

**Action:** Left XSS guard comments in place (correct). Noted deviation in summary. The automated check in the plan was written without accounting for the pre-existing Plan 01 comments — this is a plan spec issue, not an implementation issue.

## Known Stubs

None. All state fields and handlers are wired end-to-end:
- `letterText` / `setLetterText` flow from `Home()` local state through `CoverLetterResultView`
- `handleGenerateLetter` serves as both `onRegenerate` and `onRetry`
- `RESET` dispatch wired to `onReset`
- Trust callout body copy is the full UI-SPEC string (not a placeholder)

## Threat Flags

No new unmitigated threat surface introduced.

| Flag | File | Description |
|------|------|-------------|
| threat_flag: xss_mitigated | scanready/src/app/page.tsx | Post-stream letter rendered as controlled textarea value (text, never HTML); trust callout is static JSX. T-02-05 mitigated. |
| threat_flag: client_fs_access | scanready/src/app/page.tsx | .txt download via Blob/createObjectURL — client-side only, no server egress. T-02-06 accepted per plan threat model. |

## Smoke Test Notes

`npm run dev` and `npm run build` require Node ≥20.9 — local environment is 18.14.0. The behavior assertions in Task 2's acceptance criteria (copy → "Kopiert ✓", download → `anschreiben.txt`, Regenerieren → re-stream, Start over → Phase-1 input, error → red callout + retry) are manual/deferred smoke steps requiring Node upgrade. `npx tsc --noEmit` passed cleanly on Node 18.

## Self-Check: PASSED

- [x] `scanready/src/app/page.tsx` — 1030 lines (min_lines: 800 satisfied)
- [x] `navigator.clipboard.writeText` present: confirmed
- [x] `URL.createObjectURL` present: confirmed
- [x] `anschreiben.txt` filename present: confirmed
- [x] `rows={18}` present: confirmed
- [x] No actual `dangerouslySetInnerHTML` JSX attribute (only guard comments): confirmed
- [x] `cover_letter_result` phase branch present: confirmed
- [x] `CoverLetterResultView` referenced in Home(): confirmed
- [x] `onRetry={handleGenerateLetter}` present (ErrorView for cover_letter_error): confirmed
- [x] `setLetterText={setLetterText}` passed to CoverLetterResultView: confirmed
- [x] Commit 8cc901d exists: confirmed
- [x] `npx tsc --noEmit` clean: confirmed
