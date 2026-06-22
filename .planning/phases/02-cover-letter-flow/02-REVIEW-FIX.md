---
phase: 02-cover-letter-flow
fixed_at: 2026-06-22T00:00:00Z
review_path: .planning/phases/02-cover-letter-flow/02-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 5
skipped: 1
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-22T00:00:00Z
**Source review:** .planning/phases/02-cover-letter-flow/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01 + WR-01..WR-05)
- Fixed: 5
- Skipped: 1

All fixes were applied to `scanready/src/app/page.tsx` only. Each fix was committed
atomically and the cumulative `npx tsc --noEmit` typecheck passes clean (run on the
local Node 18 env, the authoritative check; `npm run dev`/`build`/`test` cannot run
locally per the phase constraints). The umlaut-safe `TextDecoder({ stream: true })`
decode + tail flush, the AbortController lifecycle, the unmount-cleanup effect, the
`<pre>` / `<textarea>` text rendering (no `dangerouslySetInnerHTML`), and all German
UI copy were preserved.

## Fixed Issues

### WR-04: `handleSubmit` and `handleRetry` are near-identical duplicated logic

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** 4b33aad
**Applied fix:** Extracted a single `runParse()` helper containing the shared
SUBMIT-dispatch + fetch + 422/empty-Lebenslauf/error handling. `handleSubmit` and
`handleRetry` now both just `await runParse()`. This also resolved the accidentally
divergent error strings — the helper uses the single message
`'Failed to parse CV. Please try again.'` for the non-OK fallback and
`'Network error — please check your connection and try again.'` for the catch path.

### WR-03: `COVER_LETTER_REGENERATE` action is dead code

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** 98d46c0
**Applied fix:** Removed `{ type: 'COVER_LETTER_REGENERATE' }` from the `AppAction`
union and deleted its reducer case. Regeneration is already driven by
`handleGenerateLetter` via `COVER_LETTER_STREAMING` (the "Regenerieren" button wires
`onRegenerate={handleGenerateLetter}`), so no rewiring was needed. Confirmed zero
remaining references to the identifier in the file.

### WR-01: Raw server response text surfaced directly as the user-facing error

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** 3379c7e
**Applied fix:** On a non-OK / missing-body cover-letter response, replaced the raw
`await res.text()` payload with a controlled, fixed message
`'Generation failed — please try again.'`, so an upstream proxy/5xx HTML page or
gateway text can no longer be rendered verbatim into `ErrorView`.

### WR-02: Mid-stream / empty-stream done transition shows a blank "successful" letter

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** 4b636eb (combined with WR-05)
**Applied fix:** After the stream loop and tail flush, the done transition is now
guarded on non-empty accumulated output: if `acc.trim().length === 0` the handler
dispatches `COVER_LETTER_ERROR` with `'No letter was generated — please try again.'`
instead of `COVER_LETTER_DONE`. This catches clean-but-empty streams (thinking-only
output, refusal, or a `max_tokens` cut with zero text deltas).
**Note:** This is a logic-level change — recommend human verification that the
empty/non-empty branch behaves as intended end-to-end (cannot run the app locally;
Node 18 blocks `npm run dev`/`build`/`test`).

### WR-05: Stale `letterText` closure makes the empty-stream / done logic fragile

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** 4b636eb (combined with WR-02)
**Applied fix:** Introduced a local `let acc = ''` accumulator inside
`handleGenerateLetter`. Each decoded chunk (and the flushed tail) now appends to both
`acc` and the functional `setLetterText` update. The post-stream done/empty decision
reads `acc` rather than the stale `letterText` React state. The umlaut-safe
`stream: true` decode + tail flush is unchanged.
**Note:** Implemented together with WR-02 per the fix guidance — same code region,
single atomic commit. Same human-verification recommendation applies.

## Skipped Issues

### CR-01: `PARSE_MODEL` silently downgraded to a model that violates the documented constraint

**File:** `scanready/src/lib/anthropic.ts:18`
**Reason:** user-deferred (leave PARSE_MODEL as-is). Marked `Disposition: DEFERRED`
in REVIEW.md and explicitly excluded by the run's scope overrides — `anthropic.ts`
was not touched.
**Original issue:** The diff changed `PARSE_MODEL` from `claude-opus-4-8` to
`claude-haiku-4-5`, which violates the documented constraint in both `CLAUDE.md`
files (only sanctioned cost lever is `claude-sonnet-4-6` once parse quality is
confirmed), and the inline comment now disagrees with the value. To be handled
separately when parse quality is confirmed.

---

_Fixed: 2026-06-22T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
