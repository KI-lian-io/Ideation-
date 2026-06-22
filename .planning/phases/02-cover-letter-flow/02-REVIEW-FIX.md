---
phase: 02-cover-letter-flow
fixed_at: 2026-06-22T00:00:00Z
review_path: .planning/phases/02-cover-letter-flow/02-REVIEW.md
iteration: 2
findings_in_scope: 10
fixed: 3
skipped: 7
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-22T00:00:00Z
**Source review:** .planning/phases/02-cover-letter-flow/02-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 10
- Fixed: 3
- Skipped: 7

This is the second fix pass. Iteration 1 resolved the warnings (WR-01..WR-05). This
pass applies the open Info findings (IN-01, IN-02, IN-04) per the dispositions and
scope overrides; CR-01 stays user-deferred and IN-03 is by-design.

Authoritative verification: `cd scanready && npx tsc --noEmit` passes clean after all
three commits. (`npm run dev`/`build`/`test` were intentionally not run — local Node is
v18.14.0, which fails Next.js 16 for environmental reasons unrelated to the code.)

## Fixed Issues

### IN-01: `onBack` from cover-letter input re-dispatches `PARSE_SUCCESS` to navigate

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** 14053db
**Applied fix:** Added a `{ type: 'BACK_TO_RESULT' }` action to the `AppAction` union and a
dedicated reducer case `case 'BACK_TO_RESULT': return { ...state, phase: 'result' }`. Rewired
the cover-letter input view's `onBack` from `dispatch({ type: 'PARSE_SUCCESS', payload: state.lebenslauf! })`
to `dispatch({ type: 'BACK_TO_RESULT' })`. This removes the non-null assertion and stops
overloading a "parse completed" action as navigation. Confirmed the target phase literal
`'result'` matches the existing Phase-1 result phase used by `PARSE_SUCCESS`.

### IN-02: Non-null assertion on `state.lebenslauf` in `handleGenerateLetter`

**Files modified:** `scanready/src/app/page.tsx`
**Commit:** d8a8cfc
**Applied fix:** Added an explicit guard `if (!state.lebenslauf) return` at the top of
`handleGenerateLetter`, then changed `toPlainText(state.lebenslauf!, ...)` to
`toPlainText(state.lebenslauf, ...)` (TypeScript narrows the non-null type after the guard,
so the assertion is no longer needed). The other assertion site (`onBack`) was already
removed by IN-01.

### IN-04: `buildCoverLetterUser` emits Q/A lines for empty answers

**Files modified:** `scanready/src/lib/prompts.ts`
**Commit:** 945aa4c
**Applied fix:** Added `.filter((a) => a.answer.trim().length > 0)` before the `.map(...)`/`.join(...)`
in `buildCoverLetterUser`, so blank personalization answers (all five initialize to `''`) no
longer produce dangling `N. <question>\n   -> ` lines. The GROUNDING / anti-fabrication
directives and `COVER_LETTER_SYSTEM` were left untouched. Note: the question numbering now
reflects only answered questions (the `.map` index runs over the filtered list), which is the
intended behaviour for a clean prompt.

## Skipped Issues

### CR-01: `PARSE_MODEL` silently downgraded

**File:** `scanready/src/lib/anthropic.ts:18`
**Reason:** user-deferred — Disposition DEFERRED in REVIEW.md (user decision 2026-06-22):
leave `PARSE_MODEL`/`anthropic.ts` as-is for now; to be handled separately when parse quality
is confirmed. Explicitly marked "Do NOT auto-fix."
**Original issue:** `PARSE_MODEL` was changed to `claude-haiku-4-5`, which violates the documented
`claude-opus-4-8` default (sanctioned cost lever is `claude-sonnet-4-6` only); the inline comment
now disagrees with the value.

### WR-01: Raw server response surfaced as user-facing error

**File:** `scanready/src/app/page.tsx:854-857`
**Reason:** already-resolved (iteration 1) — Disposition RESOLVED. The controlled
'Generation failed — please try again.' message is already applied. Not re-touched.
**Original issue:** Non-OK cover-letter response text was dispatched verbatim into the error view.

### WR-02: Mid-stream / empty-stream done transition leaves blank "successful" letter

**File:** `scanready/src/app/page.tsx:862-871`
**Reason:** already-resolved (iteration 1) — Disposition RESOLVED. The empty-output guard
(`if (acc.trim().length === 0) ...`) and tail flush are already applied. Not re-touched.
**Original issue:** A cleanly-empty stream reached `COVER_LETTER_DONE` with empty text.

### WR-03: `COVER_LETTER_REGENERATE` dead code

**File:** `scanready/src/app/page.tsx:49,323-324,805-811,1013`
**Reason:** already-resolved (iteration 1) — Disposition RESOLVED. The dead action was removed;
regeneration runs through `COVER_LETTER_STREAMING`. Not re-touched.
**Original issue:** Unreachable reducer branch / action.

### WR-04: `handleSubmit` / `handleRetry` duplication

**File:** `scanready/src/app/page.tsx:878-916` and `918-953`
**Reason:** already-resolved (iteration 1) — Disposition RESOLVED. Both now call the shared
`runParse()` helper. Not re-touched.
**Original issue:** ~35 lines of duplicated fetch/parse/dispatch logic.

### WR-05: Stale `letterText` closure

**File:** `scanready/src/app/page.tsx:862-871`
**Reason:** already-resolved (iteration 1) — Disposition RESOLVED. A local `acc` accumulator
mirrors the streamed text. Not re-touched.
**Original issue:** No local mirror of accumulated streamed text for post-stream decisions.

### IN-03: Native-speaker nudge duplicated across two views

**File:** `scanready/src/app/page.tsx:658-663` and `770-775`
**Reason:** by-design (intentional language difference). The reviewer marked this OPTIONAL and
noted the input-view (English) vs result-view (German) wording difference is intentional. The
cover-letter input view is itself English-labelled ("Job posting", "A few quick questions"),
so the English nudge there is consistent with its surrounding copy — there is no stray English
string inside a German-only view to align. Extracting a shared component would fight the
intentional difference and introduce churn for a non-bug, so it is left as-is.
**Original issue:** The "have a native German speaker review" callout appears in two views with
similar but not identical wording.

---

_Fixed: 2026-06-22T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
