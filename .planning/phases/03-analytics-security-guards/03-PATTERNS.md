# Phase 3: Security Guards — Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 3
**Analogs found:** 3 / 3 (all self-analog — each file's own existing patterns are the closest match)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scanready/src/app/api/parse/route.ts` | middleware/route | request-response | Self — own presence-check 400 block (lines 17-19) | exact |
| `scanready/src/app/api/cover-letter/route.ts` | middleware/route | streaming | Self — own presence-check 400 block (lines 15-18) | exact |
| `scanready/src/app/page.tsx` | component | event-driven | Self — `InputView` disabled gate (line 368) + `CoverLetterInputView` canSubmit gate (line 613) | exact |

---

## Pattern Assignments

### `scanready/src/app/api/parse/route.ts` (route, request-response)

**Change:** Add `resumeText` length guard after the existing presence check; align the existing English error message to German to match D-03.

**Existing presence-check block** (lines 17–19) — the pattern to extend:
```typescript
if (!resumeText || typeof resumeText !== "string") {
  return NextResponse.json({ error: "resumeText is required" }, { status: 400 });
}
```

**Target pattern after modification** (insert immediately after line 19, before the `anthropic.messages.parse()` call on line 21):
```typescript
// Existing presence check (align message to German per D-03):
if (!resumeText || typeof resumeText !== "string") {
  return NextResponse.json({ error: "Lebenslauf-Text ist erforderlich." }, { status: 400 });
}
// New length guard (D-01: 30,000 char limit):
const RESUME_LIMIT = 30_000;
if (resumeText.length > RESUME_LIMIT) {
  return NextResponse.json(
    { error: "Der Text ist zu lang (max. 30.000 Zeichen)." },
    { status: 400 }
  );
}
```

**Response shape:** `NextResponse.json({ error }, { status: 400 })` — already used in this file at line 18. Keep consistently.

**Statelessness / no-rejection-logging (D-05):** The rejected `resumeText` content must NOT appear in the `console.error` call (line 35). The existing error log `console.error("parse error", err)` is fine — it logs the caught error object, not user input. The new guard returns early before reaching that block; no additional logging is needed or permitted.

---

### `scanready/src/app/api/cover-letter/route.ts` (route, streaming)

**Change:** Add `cvText`, `jobPosting`, and per-`answer` length guards; align the 400 response shape to `{ error }` JSON (currently plain text).

**Existing presence-check block** (lines 15–18) — the pattern to extend and align:
```typescript
if (!cvText || !jobPosting || !Array.isArray(answers)) {
  return new Response("cvText, jobPosting and answers are required", {
    status: 400,
  });
}
```

**Target pattern after modification** — replace lines 15–18 entirely:
```typescript
if (!cvText || typeof cvText !== "string" || !jobPosting || typeof jobPosting !== "string" || !Array.isArray(answers)) {
  return NextResponse.json(
    { error: "cvText, jobPosting und answers sind erforderlich." },
    { status: 400 }
  );
}
// Length guards (D-01):
const CV_LIMIT = 30_000;
const POSTING_LIMIT = 15_000;
const ANSWER_LIMIT = 2_000;
if (cvText.length > CV_LIMIT) {
  return NextResponse.json(
    { error: "Der Lebenslauf-Text ist zu lang (max. 30.000 Zeichen)." },
    { status: 400 }
  );
}
if (jobPosting.length > POSTING_LIMIT) {
  return NextResponse.json(
    { error: "Das Stellenangebot ist zu lang (max. 15.000 Zeichen)." },
    { status: 400 }
  );
}
for (const ans of answers) {
  if (typeof ans.answer === "string" && ans.answer.length > ANSWER_LIMIT) {
    return NextResponse.json(
      { error: "Eine Antwort ist zu lang (max. 2.000 Zeichen)." },
      { status: 400 }
    );
  }
}
```

**Import change required:** Add `NextResponse` to the import on line 1 (currently only `NextRequest` is imported):
```typescript
import { NextRequest, NextResponse } from "next/server";
```

**Response shape alignment (D-03):** The existing plain-text `new Response(...)` 400 is replaced by `NextResponse.json({ error }, { status: 400 })` to match `/api/parse` and to support the client-side `body as { error?: string }` pattern already used in `runParse()` (page.tsx line 928).

**Statelessness / no-rejection-logging (D-05):** The existing stream error logger on line 44 (`console.error("cover-letter stream error", err)`) logs only the caught error object, not user input — leave it unchanged. The new guard returns early before the stream starts; no logging of the rejected content.

---

### `scanready/src/app/page.tsx` (component, event-driven)

**Change:** Add char counter + disabled-submit-past-limit to `InputView` (resumeText) and `CoverLetterInputView` (jobPosting + each answer textarea).

#### InputView (lines 359–406)

**Existing disabled-submit gate** (line 368):
```typescript
const isSubmitDisabled = resumeText.trim().length === 0
```

**Existing textarea** (lines 388–395):
```tsx
<textarea
  value={resumeText}
  onChange={(e) => onTextChange(e.target.value)}
  placeholder="Paste your resume here — name, contact info, work history, education, skills…"
  rows={18}
  className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
  aria-label="Resume text"
/>
```

**Existing disabled-button pattern** (lines 397–403):
```tsx
<button
  onClick={onSubmit}
  disabled={isSubmitDisabled}
  className="self-end rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
>
  Convert to Lebenslauf
</button>
```

**Target modification — update `isSubmitDisabled` (line 368) and add counter below the textarea:**
```typescript
// Replace line 368:
const RESUME_LIMIT = 30_000
const resumeOverLimit = resumeText.length > RESUME_LIMIT
const isSubmitDisabled = resumeText.trim().length === 0 || resumeOverLimit
```

Add a char-counter element directly after the closing `</textarea>` tag (after line 395):
```tsx
<p className={`text-xs text-right ${resumeOverLimit ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
  {resumeText.length.toLocaleString('de-DE')} / 30.000
  {resumeOverLimit && ' — Text zu lang'}
</p>
```

#### CoverLetterInputView (lines 598–684)

**Existing canSubmit gate** (line 613):
```typescript
const canSubmit = jobPosting.trim().length > 0
```

**Existing jobPosting textarea** (lines 631–638):
```tsx
<textarea
  value={jobPosting}
  onChange={(e) => onJobPostingChange(e.target.value)}
  placeholder="Paste the full job posting here…"
  rows={8}
  className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
  aria-label="Job posting"
/>
```

**Existing per-answer textarea** (lines 648–654):
```tsx
<textarea
  value={a.answer}
  onChange={(e) => onAnswerChange(i, e.target.value)}
  rows={2}
  className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-colors focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
  aria-label={`Answer to question ${i + 1}`}
/>
```

**Existing submit button with disabled pattern** (lines 669–673):
```tsx
<button
  onClick={onSubmit}
  disabled={!canSubmit}
  className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
>
```

**Target modification — update `canSubmit` (line 613) and add counters:**
```typescript
// Replace line 613:
const POSTING_LIMIT = 15_000
const ANSWER_LIMIT = 2_000
const postingOverLimit = jobPosting.length > POSTING_LIMIT
const anyAnswerOverLimit = answers.some((a) => a.answer.length > ANSWER_LIMIT)
const canSubmit = jobPosting.trim().length > 0 && !postingOverLimit && !anyAnswerOverLimit
```

Add counter after the jobPosting `</textarea>` (after line 638):
```tsx
<p className={`text-xs text-right ${postingOverLimit ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
  {jobPosting.length.toLocaleString('de-DE')} / 15.000
  {postingOverLimit && ' — Text zu lang'}
</p>
```

For each answer in the `.map()` block, add after the answer `</textarea>` (after line 654):
```tsx
<p className={`text-xs text-right ${a.answer.length > ANSWER_LIMIT ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
  {a.answer.length.toLocaleString('de-DE')} / 2.000
  {a.answer.length > ANSWER_LIMIT && ' — Antwort zu lang'}
</p>
```

---

## Shared Patterns

### 400 JSON response shape
**Source:** `scanready/src/app/api/parse/route.ts` line 18
**Apply to:** Both API route files
```typescript
return NextResponse.json({ error: "…German message…" }, { status: 400 });
```

### Disabled-submit gate
**Source:** `scanready/src/app/page.tsx` line 368 (InputView) and line 613 (CoverLetterInputView)
**Apply to:** Both view components — extend the existing boolean, never replace the base condition
```typescript
const isSubmitDisabled = <existing_empty_check> || <new_over_limit_check>
```

### Char counter helper-text styling
**Source:** `scanready/src/app/page.tsx` — helper text convention is `text-xs text-zinc-400 dark:text-zinc-500` (see norm-gap panel and error text at lines 489, 540); error color is `text-red-500` / `dark:text-red-400` (line 489)
**Apply to:** All three char-counter `<p>` elements — normal state zinc-400, over-limit red-500

### No rejection logging (D-05)
**Source:** `scanready/src/app/api/parse/route.ts` line 35 — `console.error("parse error", err)` logs error object only
**Apply to:** Both route files — new guard blocks return early; log only caught Error objects, never the user-submitted string values

---

## No Analog Found

None — all three files are self-analogous. No new files are created in this phase.

---

## Metadata

**Analog search scope:** `scanready/src/app/api/`, `scanready/src/app/page.tsx`
**Files scanned:** 3
**Pattern extraction date:** 2026-06-23
