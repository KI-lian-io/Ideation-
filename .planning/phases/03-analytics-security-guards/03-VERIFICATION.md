---
phase: 03-analytics-security-guards
verified: 2026-06-23T00:00:00Z
status: human_needed
score: 3/4 must-haves verified
behavior_unverified: 1
overrides_applied: 0
human_verification:
  - test: "Run npm run dev (Node 22 available). In InputView: paste text exceeding 30,000 chars. Verify the counter turns red, appends '— Text zu lang', and the Convert button greys out (disabled)."
    expected: "Counter text is red-500, button is visually disabled and unclickable."
    why_human: "classNames and boolean logic are source-verified; the rendered visual state (red color, greyed button) and the disabled attribute's effect on click require a live browser."
  - test: "With npm run dev running, advance to CoverLetterInputView. Paste >15,000 chars into the job posting field. Verify counter turns red, appends '— Text zu lang', and Anschreiben submit is disabled. Then paste >2,000 chars into one answer field; verify that counter turns red with '— Antwort zu lang' and submit remains disabled."
    expected: "Each field counter turns red at its limit; submit disabled for any over-limit field."
    why_human: "Same reason as above — CSS visual state and interactive disabling require a live browser eyeball."
behavior_unverified_items:
  - truth: "A client-side character counter + disabled submit prevents oversized input in normal use"
    test: "Run npm run dev and paste characters over the limit into each counter field (resume, job posting, each answer)"
    expected: "Counters render red, appended German over-limit text appears, and submit buttons are unclickable"
    why_human: "Source code proves the boolean logic is correct and wired to the disabled prop and className conditional, but the browser rendering of color changes and the HTML disabled attribute's interaction behavior cannot be confirmed by static analysis alone"
---

# Phase 3: Security Guards Verification Report

**Phase Goal:** Both API routes reject oversized input and nothing is persisted server-side — the tool is safe for real traffic
**Verified:** 2026-06-23
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Submitting a CV (resumeText/cvText), job posting, or answer over its per-field length threshold returns a 400 with a user-readable German message | ✓ VERIFIED | `/api/parse` route.ts line 20–25: `RESUME_LIMIT = 30_000`, returns `{ error: "Der Text ist zu lang (max. 30.000 Zeichen)." }` with status 400. `/api/cover-letter` route.ts lines 22–43: `CV_LIMIT = 30_000`, `POSTING_LIMIT = 15_000`, `ANSWER_LIMIT = 2_000` with German messages for each field. All 400s use `NextResponse.json({ error }, { status: 400 })`. Advisory WR-01 noted: the cover-letter client discards the German body and shows a fixed English fallback — but the phase criterion is met at the API level (the server returns the German message). Criterion 1 judges server behavior; client display asymmetry is a non-blocking observation. |
| 2 | Both API routes (/api/parse, /api/cover-letter) enforce per-field length limits before calling the model | ✓ VERIFIED | `/api/parse`: guard at lines 20–26, `anthropic.messages.parse()` at line 28 — guard is strictly before the model call. `/api/cover-letter`: guards at lines 25–44, `anthropic.messages.stream()` at line 46 — all three guards are before the stream. No code path reaches Anthropic with over-limit input. |
| 3 | A client-side character counter + disabled submit prevents oversized input in normal use | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Source confirms full implementation: `InputView` declares `RESUME_LIMIT = 30_000`, `resumeOverLimit = resumeText.length > RESUME_LIMIT`, `isSubmitDisabled = resumeText.trim().length === 0 \|\| resumeOverLimit` (page.tsx lines 368–370); counter `<p>` at lines 398–401 conditional on `resumeOverLimit`. `CoverLetterInputView` declares `POSTING_LIMIT = 15_000`, `ANSWER_LIMIT = 2_000`, `postingOverLimit`, `anyAnswerOverLimit`, `canSubmit = jobPosting.trim().length > 0 && !postingOverLimit && !anyAnswerOverLimit` (lines 619–623); counters at lines 649–651 and 669–671; button wired `disabled={!canSubmit}` at line 688. No localStorage/sessionStorage (grep: 0 matches). Logic is complete and wired. The rendered visual state (red counter, greyed/unclickable button) requires human confirmation in a live browser. |
| 4 | No user data is persisted server-side and guard rejections do not log rejected content | ✓ VERIFIED | Both routes: no `fs.`, `prisma.`, `db.`, `redis.`, `writeFile`, `appendFile`, or any DB/file-write call found (grep clean). Rejection logging: `grep -cE 'console\.(log\|error\|warn\|info)\(.*resumeText'` = 0 for parse route; `grep -cE 'console\.(log\|error\|warn\|info)\(.*(cvText\|jobPosting\|answer)'` = 0 for cover-letter route. Existing `console.error("parse error", err)` (parse route line 42) and `console.error("cover-letter stream error", err)` (cover-letter route line 69) log only the caught Error object. Zero-retention baseline confirmed in 02-SECURITY.md (AR-02-01, AR-02-03, T-02-03, T-02-07 all closed). |

**Score:** 3/4 truths verified (1 present, behavior-unverified)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scanready/src/app/api/parse/route.ts` | Server-side 30,000-char resumeText length guard returning 400 + German error JSON | ✓ VERIFIED | `RESUME_LIMIT = 30_000` at line 20; guard at lines 21–26; German messages confirmed; guard precedes `messages.parse()` at line 28 |
| `scanready/src/app/page.tsx` | InputView live char counter + over-limit disabled submit; CoverLetterInputView job-posting + per-answer counters + disabled submit | ✓ VERIFIED | `RESUME_LIMIT`, `resumeOverLimit`, `isSubmitDisabled` in InputView (lines 368–370, 398–405); `POSTING_LIMIT`, `ANSWER_LIMIT`, `postingOverLimit`, `anyAnswerOverLimit`, `canSubmit` in CoverLetterInputView (lines 619–623, 649–651, 669–671, 688) |
| `scanready/src/app/api/cover-letter/route.ts` | Server-side per-field length guards (cvText 30k, jobPosting 15k, answer 2k) returning 400 + German JSON error; `POSTING_LIMIT` symbol | ✓ VERIFIED | `NextResponse` imported line 1; `CV_LIMIT`, `POSTING_LIMIT`, `ANSWER_LIMIT` declared lines 22–24; three over-limit guards lines 25–44 with German messages; all precede `messages.stream()` at line 46 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|---|-----|--------|---------|
| `page.tsx` InputView (client counter) | `/api/parse` (server guard) | `RESUME_LIMIT = 30_000` — client caps input at the same threshold as the server backstop | ✓ WIRED | Client `RESUME_LIMIT` at page.tsx:368 matches server `RESUME_LIMIT` at parse/route.ts:20; both use strict `>` comparison; limits are numerically identical |
| `/api/parse` guard block | `anthropic.messages.parse()` | length check returns 400 before model is invoked | ✓ WIRED | Guard is lines 20–26; `messages.parse()` is line 28 — guard order confirmed by line numbers |
| `page.tsx` CoverLetterInputView (client counters) | `/api/cover-letter` (server guards) | `POSTING_LIMIT = 15_000`, `ANSWER_LIMIT = 2_000` — client caps at same thresholds as server | ✓ WIRED | Client constants at page.tsx:619–620 match server constants at cover-letter/route.ts:23–24 |
| `/api/cover-letter` guard block | `anthropic.messages.stream()` | three length checks return 400 before stream is created | ✓ WIRED | Guards are lines 25–44; `messages.stream()` is line 46 — guard order confirmed |
| `page.tsx` runParse error handler | `/api/parse` JSON `{ error }` body | `body.error` surfaced to user via `PARSE_ERROR` dispatch | ✓ WIRED | page.tsx lines 945–949: `const body = await res.json().catch(() => ({}))` then `payload: (body as { error?: string }).error ?? 'Failed...'` |

---

### Data-Flow Trace (Level 4)

Not applicable. Both API routes are stateless input-validation endpoints with no data persistence path to trace. Client counters derive from `resumeText.length`, `jobPosting.length`, and `a.answer.length` — all live React state, no external data source.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Parse route RESUME_LIMIT constant and German messages present | `grep -q "30_000" src/app/api/parse/route.ts && grep -q "Der Text ist zu lang" src/app/api/parse/route.ts && grep -q "Lebenslauf-Text ist erforderlich" src/app/api/parse/route.ts && echo PASS` | PASS | ✓ PASS |
| Parse route: guard lines before Anthropic call lines | Line 21 (guard) < Line 28 (model call) | Confirmed by line numbers | ✓ PASS |
| Parse route: no rejection logging | `grep -cE 'console\.(log\|error\|warn\|info)\(.*resumeText' src/app/api/parse/route.ts` = 0 | 0 | ✓ PASS |
| Cover-letter route: three constants + German messages | `grep -q "15_000" && grep -q "2_000" && grep -q "Das Stellenangebot ist zu lang"` | LIMITS_OK | ✓ PASS |
| Cover-letter route: NextResponse import + JSON 400 shape | Line 1 imports both NextRequest and NextResponse; all 4xx use `NextResponse.json(...)` | Confirmed (line 1, lines 16/26/32/39) | ✓ PASS |
| Cover-letter route: guards before stream | Lines 25–44 (guards) < Line 46 (stream creation) | Confirmed by line numbers | ✓ PASS |
| Cover-letter route: no rejection logging | `grep -cE 'console\.(log\|error\|warn\|info)\(.*(cvText\|jobPosting\|answer)'` = 0 | 0 | ✓ PASS |
| InputView: RESUME_LIMIT, resumeOverLimit, isSubmitDisabled, 30.000 counter | `grep -q "RESUME_LIMIT" && grep -q "resumeOverLimit" && grep -q "30.000"` in page.tsx | COUNTER_OK | ✓ PASS |
| CoverLetterInputView: POSTING_LIMIT, ANSWER_LIMIT, anyAnswerOverLimit, canSubmit, counters | `grep -q "POSTING_LIMIT" && grep -q "anyAnswerOverLimit" && grep -q "15.000" && grep -q "2.000"` | GATES_OK + COUNTERS_OK | ✓ PASS |
| No localStorage/sessionStorage in page.tsx | `grep -cE 'localStorage\|sessionStorage' src/app/page.tsx` = 0 | 0 | ✓ PASS |
| TypeScript clean compile | `npx tsc --noEmit` | Clean (no errors) | ✓ PASS |
| Counter UI visual state (red color, button disabled in browser) | Requires live browser | Not runnable headlessly | ? SKIP — routes to human verification |

---

### Probe Execution

No probes declared in PLAN files. No conventional `scripts/*/tests/probe-*.sh` files present. Skipped.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|------------|-------------|--------|---------|
| TRUST-01 | 03-01-PLAN.md, 03-02-PLAN.md | No user CV/output is persisted server-side — the flow stays stateless | ✓ SATISFIED | Both routes: no persistence APIs found (grep clean). No localStorage/sessionStorage in page.tsx. Zero-retention baseline from Phase 2 confirmed intact. Rejections do not log user content (negative grep on both routes). |
| TRUST-03 | 03-01-PLAN.md, 03-02-PLAN.md | Both API routes reject oversized input via a length guard (cost + abuse boundary) | ✓ SATISFIED | `/api/parse`: 30k guard before `messages.parse()`. `/api/cover-letter`: 30k/15k/2k guards before `messages.stream()`. All 400s return German JSON `{ error }`. |

---

### Anti-Patterns Found

Scanned all three files modified in this phase.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No `TBD`, `FIXME`, `XXX` markers found in modified files. No unresolved stubs, hardcoded empty returns, or placeholder implementations found. TypeScript clean.

**Advisory findings from 03-REVIEW.md (not phase-goal failures):**

- **WR-01 (advisory):** `/api/cover-letter` returns German `{ error }` JSON 400s, but the cover-letter client discards the body and shows a fixed English message. Phase criterion 1 is about the API returning a German message — met. The client-display asymmetry is a non-blocking inconsistency for a future phase.
- **WR-02 (advisory):** The answer-guard `typeof ans.answer === "string"` short-circuit lets non-string `answer` values bypass the 2,000-char check. Not reachable via the typed UI. Minor server-robustness gap.
- **IN-01/IN-02/IN-03 (info):** Limit constants duplicated across four locations; denominator display strings are hardcoded; no `aria-invalid` on over-limit fields. All informational — no phase-goal impact.

---

### Human Verification Required

#### 1. InputView counter visual state and disabled submit

**Test:** With `npm run dev` running (Node 22 is available), navigate to the CV input page. Paste text that exceeds 30,000 characters into the resume textarea (or programmatically set its value).
**Expected:** The character counter below the textarea turns red (`text-red-500`), the text `"— Text zu lang"` appears appended to the count, and the "Convert to Lebenslauf" button is visually greyed out and unclickable (HTML `disabled` attribute active).
**Why human:** The boolean logic (`resumeOverLimit`, `isSubmitDisabled`) and the className conditional (`resumeOverLimit ? 'text-red-500' : ...`) are source-verified and correctly wired to the button's `disabled={isSubmitDisabled}` prop. However, the rendered visual outcome — the color actually appearing red, the button actually being unclickable — requires a live browser observation. Classname application and CSS cascade cannot be confirmed by static analysis.

#### 2. CoverLetterInputView counter visual states and disabled submit

**Test:** From the app in `npm run dev`, complete the parse step and navigate to CoverLetterInputView. (a) Paste >15,000 characters into the job posting field. (b) Separately, paste >2,000 characters into one of the answer fields.
**Expected:** (a) Job posting counter turns red with `"— Text zu lang"`, submit button is disabled. (b) Answer counter turns red with `"— Antwort zu lang"`, submit button is disabled. On clearing each field below its limit, the counter returns to zinc-400 color and the submit button re-enables (once jobPosting is non-empty).
**Why human:** Same reason — `postingOverLimit`, `anyAnswerOverLimit`, `canSubmit` logic and wiring is source-verified, but the visual color transitions and button disabled state require a live browser.

---

### Gaps Summary

No gaps found. All four phase success criteria are either source-verified (3) or present-and-wired with only the browser-rendered visual state left for human confirmation (1). Both requirements TRUST-01 and TRUST-03 are satisfied.

The two human verification items are the routine "visual state requires eyeball" checks that the PLAN itself explicitly flagged as manual-only (03-01-PLAN.md and 03-02-PLAN.md both contain `human-only (Node >=20.9, manual)` acceptance criteria). These are not discovered gaps — they are the expected final step of the phase's own verification plan.

---

_Verified: 2026-06-23_
_Verifier: Claude (gsd-verifier)_
