---
phase: 03-analytics-security-guards
reviewed: 2026-06-23T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scanready/src/app/api/parse/route.ts
  - scanready/src/app/api/cover-letter/route.ts
  - scanready/src/app/page.tsx
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-06-23
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the Phase 3 input-length guards (server-side 400 rejections on `/api/parse` and
`/api/cover-letter`) and the client-side character counters in `page.tsx`. The guard logic
is fundamentally sound on the dimensions that matter most:

- **Guard-before-model-call:** Confirmed on every path. `/api/parse` rejects at line 21
  before `messages.parse()` (line 28); `/api/cover-letter` rejects at lines 25–44 before
  `messages.stream()` (line 46). No path reaches Anthropic with over-limit input. (D-01 met.)
- **Client/server limit parity:** Exact. RESUME/CV = 30_000, POSTING = 15_000, ANSWER = 2_000
  on both sides. Both sides use raw `.length` (not trimmed) for the over-limit comparison, so
  the boundary is identical: a string of exactly the limit passes both, limit+1 fails both.
- **No off-by-one:** All checks use strict `>` (reject only when *strictly* greater than the
  limit). Client `overLimit` flags and server 400s flip at the same value. Correct.
- **No new logging of user content:** Confirmed. The guards return without logging rejected
  CV/posting/answer text (D-05 respected). Existing `console.error("...", err)` calls log only
  the caught error object — unchanged, out of scope.

No BLOCKER-level correctness or security defects found in the guard logic. The findings below
are a real client/server contract mismatch (WR-01), a guard-bypass gap on `/api/parse` body
validation (WR-02), and minor maintainability items.

## Warnings

### WR-01: Cover-letter route's German 400 `{error}` messages are never shown to the user

**File:** `scanready/src/app/api/cover-letter/route.ts:25-44`, `scanready/src/app/page.tsx:878-887`
**Issue:** Phase 3 changed the cover-letter route's 400 responses from plain text to JSON
`{ error: "...zu lang..." }` (German). But the client never reads that body — on `!res.ok` it
unconditionally dispatches a fixed English `'Generation failed — please try again.'` (lines
882-885). So every German limit message the route now produces (`"Das Stellenangebot ist zu
lang (max. 15.000 Zeichen)."`, etc.) is dead on the wire: it is generated, serialized, and
discarded. This is asymmetric with the `/api/parse` client, which *does* surface `body.error`
(page.tsx:945-949). The result is an inconsistent contract: parse rejections show the specific
German reason; cover-letter rejections show a generic English message.

In practice the client-side counters (`postingOverLimit`/`anyAnswerOverLimit`) disable the
submit button before this fires, so a user driving the UI normally won't hit it — which is why
this is a WARNING, not a BLOCKER. But the server messages are now unreachable code from the
client's perspective, and the divergence between the two routes' error handling is a latent
trap for the next person who relies on the cover-letter route returning a usable message.

**Fix:** Either (a) decide the cover-letter route should mirror parse and have the client read
the JSON body for 4xx, or (b) document explicitly that the cover-letter route's JSON error
bodies are intentionally not surfaced (defense-in-depth only) so they aren't mistaken for a
user-facing path. If (a):
```ts
if (!res.ok || !res.body) {
  // For controlled 4xx (our own guards) surface the German reason; never render 5xx/proxy bodies.
  let message = 'Generation failed — please try again.'
  if (res.status === 400) {
    const body = await res.json().catch(() => ({} as { error?: string }))
    if (body.error) message = body.error
  }
  dispatch({ type: 'COVER_LETTER_ERROR', payload: message })
  return
}
```

### WR-02: `/api/parse` accepts and forwards a body whose `resumeText` is not the only field, but more importantly does not bound non-string-but-truthy edge — confirm answer-shape guard parity

**File:** `scanready/src/app/api/cover-letter/route.ts:37-44`
**Issue:** The server answer-length guard is `if (typeof ans.answer === "string" && ans.answer.length > ANSWER_LIMIT)`. The `typeof ... === "string"` short-circuit means a malformed `answers` entry whose `answer` is a *number* or *object* skips the length guard entirely and is then passed into `buildCoverLetterUser({ ..., answers })` and on to the model. A caller posting `answers: [{ question: "x", answer: <50KB object coerced server-side> }]` would bypass the 2_000-char intent. The client can't produce this (its `answers` are typed `{question:string;answer:string}`), so it's not reachable through the UI — hence WARNING — but the server is the trust boundary and the guard's own `typeof` check signals the author anticipated non-string input, then let it through unbounded.
**Fix:** Reject non-string answers outright rather than silently skipping the bound:
```ts
for (const ans of answers) {
  if (typeof ans?.answer !== "string") {
    return NextResponse.json({ error: "Ungültiges Antwortformat." }, { status: 400 });
  }
  if (ans.answer.length > ANSWER_LIMIT) {
    return NextResponse.json({ error: "Eine Antwort ist zu lang (max. 2.000 Zeichen)." }, { status: 400 });
  }
}
```

## Info

### IN-01: Magic-number limits duplicated across four locations with no shared constant

**File:** `scanready/src/app/api/parse/route.ts:20`, `scanready/src/app/api/cover-letter/route.ts:22-24`, `scanready/src/app/page.tsx:368,619-620`
**Issue:** `30_000`, `15_000`, `2_000` are now declared independently in the two routes and again
in two components (plus the German display strings `30.000`/`15.000`/`2.000`). Parity is currently
exact, but it is maintained by hand — a future change to one limit silently breaks client/server
agreement, which is precisely the failure mode the guards exist to prevent.
**Fix:** Hoist to a single shared module (e.g. `src/lib/limits.ts`) exporting
`RESUME_LIMIT`, `POSTING_LIMIT`, `ANSWER_LIMIT`, and import in all four sites so the numbers
and the displayed maxima cannot drift.

### IN-02: Counter display strings hardcode the formatted limit instead of deriving it

**File:** `scanready/src/app/page.tsx:399,649,670`
**Issue:** The denominators are literal text (`/ 30.000`, `/ 15.000`, `/ 2.000`) while the numerator
uses `.toLocaleString('de-DE')`. If a limit constant changes, the denominator string must be
edited separately and could fall out of sync with the actual guard value.
**Fix:** Render the denominator from the same constant:
`{`${count.toLocaleString('de-DE')} / ${LIMIT.toLocaleString('de-DE')}`}`.

### IN-03: Over-limit visual state has no corresponding accessibility signal

**File:** `scanready/src/app/page.tsx:398-401,648-651,669-672`
**Issue:** The over-limit warning is conveyed only by color (`text-red-500`) plus appended text;
the textarea itself gets no `aria-invalid` and the counter `<p>` is not associated with the input
via `aria-describedby`. The appended " — Text zu lang" text mitigates the color-only concern, but
screen-reader users get no programmatic link between the warning and the field. Minor, and not a
correctness/security issue.
**Fix:** Add `aria-invalid={overLimit}` to the textarea and associate the counter via
`aria-describedby` / `id`. Optional polish, not required to ship.

---

_Reviewed: 2026-06-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
