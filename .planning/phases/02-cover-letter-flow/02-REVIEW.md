---
phase: 02-cover-letter-flow
reviewed: 2026-06-22T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scanready/src/app/page.tsx
  - scanready/src/lib/anthropic.ts
  - scanready/src/lib/prompts.ts
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the cover-letter flow wiring: the page state machine + streaming reader (`page.tsx`), the model config (`anthropic.ts`), and the prompt builders (`prompts.ts`). The streaming reader, AbortController lifecycle, TextDecoder usage, clipboard/Blob handlers, and reducer transitions are mostly sound and match the documented design intent (stateless, no `dangerouslySetInnerHTML`, local `letterText` state, `stream:true` decode).

The most serious issue is a model-config regression: `PARSE_MODEL` was changed to a model (`claude-haiku-4-5`) that contradicts the documented constraint in both `CLAUDE.md` files (which mandate `claude-opus-4-8` with `claude-sonnet-4-6` as the only sanctioned cost lever) — and the inline comment still advertises the wrong lever, so the file now disagrees with itself. Because CV-parse quality directly feeds the grounded German output (the product's core value), a silent downgrade to the cheapest model is a correctness/quality regression that should not ship unverified.

Several robustness gaps in the streaming reader and error handling round out the findings.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `PARSE_MODEL` silently downgraded to a model that violates the documented constraint

**Disposition:** DEFERRED — user decision (2026-06-22): leave `PARSE_MODEL` as-is for now; to be handled separately when parse quality is confirmed. **Do NOT auto-fix.**

**File:** `scanready/src/lib/anthropic.ts:18`
**Issue:** The diff changes `PARSE_MODEL` from `claude-opus-4-8` to `claude-haiku-4-5`. Both project `CLAUDE.md` files explicitly state the constraint: `PARSE_MODEL = claude-opus-4-8` by default, and the **only** sanctioned cost lever is switching to `claude-sonnet-4-6` "once parse quality is confirmed." Haiku is never mentioned as an option. Two concrete problems:

1. The value violates a documented, non-negotiable constraint. There is no artifact in this phase confirming Haiku parse quality, and the CV-parse step feeds the grounded German Lebenslauf — the product's stated core value ("the quality and grounding of the German documents must hold"). A silent two-tier downgrade (Opus → Haiku, skipping the sanctioned Sonnet step) risks degraded parsing/grounding without verification.
2. The inline comment is now self-contradictory: `// cost lever: "claude-sonnet-4-6"` sits next to a value that is neither Opus nor Sonnet. The code and its own documentation disagree, which will mislead the next maintainer.

This also appears unrelated to the cover-letter flow that is the subject of this phase, suggesting an unintended/scope-creep edit.

**Fix:**
```ts
// Restore the documented default, or — if a cost lever is genuinely intended —
// use the sanctioned model and confirm quality first.
export const PARSE_MODEL = "claude-opus-4-8"; // cost lever: "claude-sonnet-4-6"
```
If Haiku is a deliberate, approved decision, update both `CLAUDE.md` constraint sections AND the inline comment in the same change so code and docs agree, and record the quality-confirmation evidence.

## Warnings

### WR-01: Raw server response text is surfaced directly as the user-facing error message

**Disposition:** RESOLVED — fixed in 02-REVIEW-FIX.md (iteration 1). Do NOT re-apply.

**File:** `scanready/src/app/page.tsx:854-857`
**Issue:** On a non-OK cover-letter response, the code does `const msg = await res.text()` and dispatches it straight into `COVER_LETTER_ERROR`, which renders verbatim in `ErrorView`. The `/api/cover-letter` route returns plain-text error bodies (e.g. `"cvText, jobPosting and answers are required"`), but any upstream proxy/5xx error (HTML error pages, stack-trace-ish text, gateway messages) would also be rendered raw to the end user. This is inconsistent with the `/api/parse` handler, which returns a controlled `{ error }` JSON shape, and it can leak unhelpful or confusing internals into the UI.
**Fix:** Map to a controlled message and only use server text when it is a known-safe contract:
```ts
if (!res.ok || !res.body) {
  dispatch({ type: 'COVER_LETTER_ERROR', payload: 'Generation failed — please try again.' })
  return
}
```
Or have the route return JSON `{ error }` like `/api/parse` and parse it defensively.

### WR-02: Mid-stream errors leave the UI stuck on the streaming view with no error state

**Disposition:** RESOLVED — fixed in 02-REVIEW-FIX.md (iteration 1). Do NOT re-apply.

**File:** `scanready/src/app/page.tsx:862-871` (client) / `scanready/src/app/api/cover-letter/route.ts:43-47` (server)
**Issue:** If the Anthropic stream throws *after* the response headers/body have started (the route calls `controller.error(err)`), the client `reader.read()` rejects with a non-Abort error. That lands in the outer `catch`, which only handles `AbortError` specially and otherwise dispatches `COVER_LETTER_ERROR` — which is correct. However, any text already streamed into `letterText` is **not** cleared, and on the *next* successful generation the reader appends to a fresh `setLetterText('')`, so that path is fine. The real gap: a stream that ends *cleanly but empty* (e.g. model emits only thinking blocks, or `max_tokens`/refusal with zero text deltas) reaches `done` with `letterText === ''`, then dispatches `COVER_LETTER_DONE` and renders `CoverLetterResultView` with an empty editable textarea and no error. The user sees a blank "successful" letter.
**Fix:** Guard the done transition on non-empty output:
```ts
if (tail) setLetterText((prev) => prev + tail)
// Use a local accumulator instead of relying on async state:
if (accumulated.trim().length === 0) {
  dispatch({ type: 'COVER_LETTER_ERROR', payload: 'No letter was generated — please try again.' })
  return
}
dispatch({ type: 'COVER_LETTER_DONE' })
```
(Accumulate into a local `let acc = ''` alongside `setLetterText`, since the `letterText` state is stale inside this closure.)

### WR-03: `COVER_LETTER_REGENERATE` action is dead code; regenerate path never dispatches it

**Disposition:** RESOLVED — fixed in 02-REVIEW-FIX.md (iteration 1). Do NOT re-apply.

**File:** `scanready/src/app/page.tsx:49,323-324,805-811,1013`
**Issue:** The reducer defines `COVER_LETTER_REGENERATE` (identical body to `COVER_LETTER_STREAMING`), and the action is in the `AppAction` union, but the only "Regenerieren" button wires `onRegenerate={handleGenerateLetter}`, which dispatches `COVER_LETTER_STREAMING` — never `COVER_LETTER_REGENERATE`. The action is unreachable. Dead reducer branches invite confusion about intended behavior and rot over time.
**Fix:** Remove the `COVER_LETTER_REGENERATE` action from the union and the reducer case, since `handleGenerateLetter` already drives both initial generation and regeneration via `COVER_LETTER_STREAMING`.

### WR-04: `handleSubmit` and `handleRetry` are near-identical duplicated logic

**Disposition:** RESOLVED — fixed in 02-REVIEW-FIX.md (iteration 1). Do NOT re-apply.

**File:** `scanready/src/app/page.tsx:878-916` and `918-953`
**Issue:** The two handlers are byte-for-byte identical except for two error fallback strings (`'Failed to parse CV. Please try again.'` vs `'Failed to parse CV.'` and the network-error copy). This is ~35 lines of duplicated fetch/parse/dispatch logic. Divergence risk: a future fix to one (e.g. the 422 handling or empty-Lebenslauf guard) will silently miss the other. The error-copy difference is itself almost certainly unintentional.
**Fix:** Extract a single `runParse()` helper and have both `handleSubmit` and `handleRetry` call it; both already `dispatch({ type: 'SUBMIT' })` first, so the bodies are interchangeable.

### WR-05: Stale `letterText` closure makes the empty-stream / done logic fragile

**Disposition:** RESOLVED — fixed in 02-REVIEW-FIX.md (iteration 1). Do NOT re-apply.

**File:** `scanready/src/app/page.tsx:862-871`
**Issue:** Inside `handleGenerateLetter`, all reads of the streamed content go through `setLetterText((prev) => prev + chunk)` (correct, functional update). But there is no local mirror of the accumulated text, so the function body itself cannot inspect what was streamed (needed for WR-02's empty-output guard, and for any "did we actually get a letter?" decision). Relying on the `letterText` React state here would read the stale initial value. This is a latent foot-gun for the next person who adds post-stream logic.
**Fix:** Keep a local accumulator: `let acc = ''` then `acc += chunk; setLetterText(acc)` (or `setLetterText(prev => prev + chunk)` plus `acc += chunk`), and base the done/empty decision on `acc`.

## Info

### IN-01: `onBack` from cover-letter input re-dispatches `PARSE_SUCCESS` to navigate

**File:** `scanready/src/app/page.tsx:1001`
**Issue:** "Back to Lebenslauf" navigates by dispatching `PARSE_SUCCESS` with the existing `lebenslauf` (`payload: state.lebenslauf!`). This works, but overloads a "parse completed" action as a navigation action, and uses a non-null assertion on `state.lebenslauf`. A dedicated `BACK_TO_RESULT` action (or reusing a generic `SET_PHASE`) would be clearer and avoid the assertion.
**Fix:** Add `case 'BACK_TO_RESULT': return { ...state, phase: 'result' }` and dispatch that instead.

### IN-02: Non-null assertions on `state.lebenslauf` rely on phase invariants the compiler can't see

**File:** `scanready/src/app/page.tsx:841,1001`
**Issue:** `toPlainText(state.lebenslauf!, ...)` in `handleGenerateLetter` and `payload: state.lebenslauf!` in `onBack` both assert non-null. These hold today because those code paths are only reachable from `cover_letter_input`, which is only reachable after `PARSE_SUCCESS`. But that invariant is implicit; a future refactor of the phase graph could make `lebenslauf` null here and crash at runtime (`toPlainText(null)`).
**Fix:** Add an explicit guard at the top of `handleGenerateLetter` (`if (!state.lebenslauf) return`) instead of asserting.

### IN-03: Native-speaker nudge text is duplicated across two views

**File:** `scanready/src/app/page.tsx:658-663` and `770-775`
**Issue:** The "have a native German speaker review" callout appears twice (once in `CoverLetterInputView`, once in `CoverLetterResultView`) with similar but not identical wording (English vs German). Not a bug — and the guardrail intent (keep the nudge visible) is satisfied — but the copy lives in two places and can drift.
**Fix:** Extract a small `NativeSpeakerNudge` component if you want a single source of truth; otherwise leave as-is given the intentional language difference.

### IN-04: `buildCoverLetterUser` emits answer questions/text with no guard against empty answers

**File:** `scanready/src/lib/prompts.ts:66-69`
**Issue:** Optional personalization answers (the page initializes all five to `''`) are still rendered into the prompt as `N. <question>\n   -> ` with an empty arrow target. This produces dangling empty Q/A lines in the user prompt. Harmless to grounding (the model can ignore blanks), but it adds noise and could subtly encourage the model to fill the gap with invented content — worth filtering for a flow whose whole premise is anti-fabrication.
**Fix:** Filter blanks before joining:
```ts
const qa = input.answers
  .filter((a) => a.answer.trim().length > 0)
  .map((a, i) => `${i + 1}. ${a.question}\n   -> ${a.answer}`)
  .join("\n");
```

---

_Reviewed: 2026-06-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
