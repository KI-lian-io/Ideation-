---
phase: 02-cover-letter-flow
verified: 2026-06-22T12:00:00Z
status: human_needed
score: 5/5 must-haves verified
behavior_unverified: 2
overrides_applied: 0
re_verification: false
behavior_unverified_items:
  - truth: "Anschreiben text appears live as it streams — first chunk visible within seconds of submitting"
    test: "Run the app on Node >=20.9, navigate result -> 'Write Anschreiben', paste a job posting, click 'Anschreiben schreiben', observe the skeleton and first token arrival time"
    expected: "Skeleton visible immediately; first German text chunk appears within 2-3 seconds (adaptive thinking pre-token pause is expected)"
    why_human: "TextDecoder({stream:true}) and getReader loop are present and wired, but the first-chunk timing is a live runtime invariant — only observable against the running Anthropic stream. Node 18 prevents dev server start."
  - truth: "User can paste a target job posting and advance to the personalization step"
    test: "Navigate result view, click 'Write Anschreiben', paste text into job posting textarea, verify 'Anschreiben schreiben' button enables and click advances to streaming view"
    expected: "Button disabled when job posting empty; enables on any non-whitespace input; clicking starts streaming and renders CoverLetterStreamingView"
    why_human: "Disable guard (canSubmit = jobPosting.trim().length > 0) and phase transition (dispatch COVER_LETTER_STREAMING) are source-verified, but the browser interaction and phase render switch require a live app on Node >=20.9."
human_verification:
  - test: "Navigate the full live flow — paste CV, get Lebenslauf, click 'Write Anschreiben', paste job posting, optionally answer questions, click 'Anschreiben schreiben', observe streaming"
    expected: "Skeleton shows immediately; first German letter text arrives within seconds; ä/ö/ü render correctly (not U+FFFD); stream completes and transitions to CoverLetterResultView with editable textarea"
    why_human: "Live streaming timing and German umlaut rendering across chunk boundaries are runtime invariants only verifiable with dev server on Node >=20.9"
  - test: "In the result view, click 'Anschreiben kopieren'; verify the button label"
    expected: "Label changes to 'Kopiert ✓' for ~1500ms then reverts to 'Anschreiben kopieren'"
    why_human: "clipboard.writeText success and setTimeout behavior require a browser context"
  - test: "In CoverLetterResultView, click 'Anschreiben schreiben' without pasting a job posting first"
    expected: "Button is visibly disabled and unclickable"
    why_human: "CSS disabled state and browser interaction require a live app"
---

# Phase 02: Cover-Letter Flow Verification Report

**Phase Goal:** A user can complete the full product flow — paste a job posting, answer personalization questions, watch the Anschreiben stream live, and copy the finished letter
**Verified:** 2026-06-22T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can paste a target job posting and advance to the personalization step | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `CoverLetterInputView` job-posting `<textarea>` at line 629-637; `canSubmit = jobPosting.trim().length > 0` at line 611; `disabled={!canSubmit}` at line 668; phase wiring at lines 994-1003 in `Home()`; `COVER_LETTER_STREAMING` dispatch in `handleGenerateLetter` at line 845. Button interaction requires live app. |
| 2 | User sees and answers the 3-5 personalization questions drawn from PERSONALIZATION_QUESTIONS | ✓ VERIFIED | 5 questions in `PERSONALIZATION_QUESTIONS` array (prompts.ts lines 73-79); `initialState.answers` seeded via `PERSONALIZATION_QUESTIONS.map(q => ({ question: q, answer: '' }))` at page.tsx line 60; `answers.map` renders all 5 as labelled `<textarea>` at lines 643-654; `state.answers` passed as prop at line 997. |
| 3 | Anschreiben text appears live as it streams — first chunk visible within seconds of submitting | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `response.body.getReader()` at line 859; `TextDecoder('utf-8', { fatal: false })` with `{ stream: true }` at lines 861/865; functional `setLetterText((prev) => prev + chunk)` at line 866; tail flush at lines 869-870; `CoverLetterStreamingView` renders `<pre>{letterText}</pre>` when letterText non-empty, skeleton otherwise at lines 688-701. First-chunk timing is a live runtime invariant. |
| 4 | A "have a native German speaker review this" nudge appears on the finished letter | ✓ VERIFIED | `CoverLetterResultView` contains distinct neutral trust callout at lines 770-775: "Bitte lassen Sie dieses Anschreiben von einem Muttersprachler prüfen, bevor Sie es absenden." with "Hinweis" eyebrow, rendered below the `<textarea>` on `cover_letter_result` phase, not inside `letterText`. Correct per D-09/CL-05. |
| 5 | User can copy the completed Anschreiben to clipboard | ✓ VERIFIED | `handleCopy` at lines 722-730 calls `navigator.clipboard.writeText(letterText)`; `copyState` local state with `'idle'\|'copied'\|'error'`; 1500ms timeout on success (`setTimeout(() => setCopyState('idle'), 1500)` at line 728); 3000ms timeout on failure at line 730; button label toggles to `'Kopiert ✓'` at line 792; inline error copy at lines 778-781. Wired into `CoverLetterResultView` action row at line 787. |

**Score:** 5/5 truths source-verified (3 fully verified, 2 present + wired but behavior-unverified pending live app)

### Deferred Items

None — all phase-02 success criteria are addressed by this phase's implementation.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scanready/src/lib/anthropic.ts` | GENERATION_MODEL = 'claude-opus-4-8' | ✓ VERIFIED | Line 17 confirms. PARSE_MODEL = 'claude-haiku-4-5' — WARNING: violates documented constraint (see Anti-Patterns). |
| `scanready/src/lib/prompts.ts` | COVER_LETTER_SYSTEM with bracket review-note directive removed | ✓ VERIFIED | `grep -niE 'bracket|in \[brackets\]'` returns no matches. Final instruction reads "Write only the letter. No preamble." at line 55. GROUNDING block intact. |
| `scanready/src/app/page.tsx` | Extended reducer + handleGenerateLetter + CoverLetterInputView + CoverLetterStreamingView + CoverLetterResultView; min_lines: 800 | ✓ VERIFIED | 1030 lines (satisfies both plan-01 min 700 and plan-02 min 800). All four reducer phases, seven new actions, all three view components present. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `page.tsx (handleGenerateLetter)` | `/api/cover-letter` | `fetch('/api/cover-letter', { method: 'POST', ... body: JSON.stringify({ cvText, jobPosting, answers }) })` | ✓ WIRED | Lines 848-853. Signal wired via AbortController. |
| `page.tsx (handleGenerateLetter)` | `lebenslauf-utils.ts (toPlainText)` | `toPlainText(state.lebenslauf!, state.sectionOrder)` at line 841 | ✓ WIRED | Import at line 4; called at line 841 before fetch. D-02 grounding source confirmed. |
| `page.tsx (CoverLetterResultView copy button)` | `navigator.clipboard` | `navigator.clipboard.writeText(letterText)` | ✓ WIRED | Line 724. Local `copyState` drives label toggle. |
| `page.tsx (CoverLetterResultView download button)` | Browser Blob / URL.createObjectURL | `new Blob([letterText]) → URL.createObjectURL → <a download='anschreiben.txt'>` | ✓ WIRED | Lines 734-740. `URL.revokeObjectURL` at line 740. No server round-trip. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `CoverLetterStreamingView` | `letterText` | `handleGenerateLetter` streaming reader → `setLetterText((prev) => prev + chunk)` | Yes — live chunks from `/api/cover-letter` stream | ✓ FLOWING |
| `CoverLetterResultView` | `letterText` / `setLetterText` | Same local `useState` from `Home()`; `setLetterText` passed as prop at line 1012 | Yes — persists the streamed content through phase transition | ✓ FLOWING |
| `CoverLetterInputView` | `answers` | `initialState.answers` seeded from `PERSONALIZATION_QUESTIONS`; updated via `SET_ANSWER` reducer | Yes — user-driven input from reducer state | ✓ FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — dev server requires Node >=20.9; local runtime is Node 18.14.0. The two behavior-dependent truths (streaming timing, button click interaction) are routed to human verification per the environment constraint. TypeScript compile check (`npx tsc --noEmit`) is the authoritative source-level gate and passes cleanly (no output).

### Probe Execution

No probes declared in PLAN frontmatter or found in `scripts/` directory. SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CL-01 | 02-01-PLAN.md | User can paste a target job posting | ✓ SATISFIED | Job posting `<textarea>` at lines 629-637; `state.jobPosting` in reducer; wired at line 996-998 |
| CL-02 | 02-01-PLAN.md | User answers the 3-5 personalization questions from PERSONALIZATION_QUESTIONS | ✓ SATISFIED | All 5 PERSONALIZATION_QUESTIONS rendered; seeded in initialState; SET_ANSWER reducer case immutably updates by index |
| CL-03 | 02-01-PLAN.md | Anschreiben streams live via response.body.getReader() not EventSource | ✓ SATISFIED | `getReader()` at line 859; `TextDecoder('utf-8', {fatal:false})` with `{stream:true}` at line 865; no EventSource in file |
| CL-04 | 02-01-PLAN.md + 02-02-PLAN.md | Anschreiben grounded in CV facts + answers only | ✓ SATISFIED | `cvText = toPlainText(state.lebenslauf!, ...)` at line 841 (not raw resumeText); GROUNDING block intact in prompts.ts; trust callout in CoverLetterResultView reinforces grounding guarantee |
| CL-05 | 02-02-PLAN.md | Native German speaker review nudge on finished letter | ✓ SATISFIED | Distinct trust callout at lines 770-775 with "Hinweis" eyebrow and German copy. Separate from letterText. |
| CL-06 | 02-02-PLAN.md | User can copy Anschreiben to clipboard | ✓ SATISFIED | `navigator.clipboard.writeText(letterText)` with `idle|copied|error` state; 'Kopiert ✓' label; 1500ms/3000ms timeouts |

All 6 phase-02 requirements (CL-01 through CL-06) satisfied at source level. No orphaned requirements — REQUIREMENTS.md maps CL-01..CL-06 exclusively to Phase 2.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scanready/src/lib/anthropic.ts` | 18 | `PARSE_MODEL = "claude-haiku-4-5"` with comment `// cost lever: "claude-sonnet-4-6"` | WARNING | CLAUDE.md mandates Opus 4.8 as default; only sanctioned cost lever is Sonnet 4.6. Haiku is undocumented. Comment and code disagree. This does NOT block the phase-02 cover-letter goal (GENERATION_MODEL is correct and drives cover-letter quality), but it is a correctness regression flagged by code review CR-01 and should be resolved before shipping. |
| `scanready/src/app/page.tsx` | 49, 323-324 | `COVER_LETTER_REGENERATE` action defined in union and reducer but never dispatched (dead code) | INFO | Regenerieren button wires `onRegenerate={handleGenerateLetter}` which dispatches `COVER_LETTER_STREAMING` directly; `COVER_LETTER_REGENERATE` is unreachable. No behavior impact; code review WR-03. |

No `TBD`, `FIXME`, or `XXX` markers found. No `dangerouslySetInnerHTML` JSX attributes (only XSS-guard comments). No hardcoded empty stub data in rendered paths. `npx tsc --noEmit` passes cleanly.

### Human Verification Required

All items below require a running dev server on Node >=20.9. Install Node 20 via `nvm use 20` or `brew install node@20`, then `cd scanready && npm install && npm run dev`.

#### 1. Full Cover-Letter Flow — Streaming Correctness

**Test:** Paste a real CV, get a Lebenslauf, click "Write Anschreiben", paste a German job posting, answer at least one question, click "Anschreiben schreiben".
**Expected:** Skeleton appears immediately; first German text chunk renders within a few seconds (adaptive thinking pre-token pause is expected); German umlauts (ä, ö, ü, ß) render correctly throughout; stream completes and view transitions to CoverLetterResultView with editable textarea and trust callout below it.
**Why human:** First-chunk timing and umlaut correctness across chunk boundaries are runtime invariants. TextDecoder `{stream:true}` is present in source, but correct umlaut output can only be confirmed in a running browser.

#### 2. Job Posting Submit Disable Guard

**Test:** In the cover letter input form, leave the job posting field empty. Observe the "Anschreiben schreiben" button.
**Expected:** Button is visibly disabled and clicking does nothing. After typing at least one non-whitespace character, button becomes enabled.
**Why human:** CSS disabled state and browser click behavior require a live browser context.

#### 3. Clipboard Copy — "Kopiert ✓" State

**Test:** After letter generation completes, click "Anschreiben kopieren".
**Expected:** Button label changes to "Kopiert ✓" for approximately 1.5 seconds then reverts. Clipboard contains the full letter text. On clipboard permission denial, inline error "Kopieren fehlgeschlagen — bitte manuell auswählen." appears for 3 seconds.
**Why human:** navigator.clipboard and setTimeout behavior require a real browser context.

### Gaps Summary

No hard gaps. All 5 success criteria are source-verified or present-and-wired pending live behavioral confirmation. The phase goal is achievable based on the implementation.

**Notable non-blocking issue (CR-01 from code review):** `PARSE_MODEL` is set to `claude-haiku-4-5` — an undocumented model that contradicts both CLAUDE.md constraint files and creates a self-contradictory inline comment. This affects CV parsing quality (Phase 1 scope) but does not block the Phase 2 cover-letter goal, since `GENERATION_MODEL = "claude-opus-4-8"` is correct. This should be resolved before deploying — either restore `claude-opus-4-8` or update both CLAUDE.md files and the comment to document the approved Haiku decision with quality-confirmation evidence.

---

_Verified: 2026-06-22T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
