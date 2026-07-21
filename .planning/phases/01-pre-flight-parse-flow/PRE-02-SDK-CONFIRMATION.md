# PRE-02: SDK Shape Confirmation

**Date:** 2026-06-22
**Confirmed by:** Plan 01-01 execution
**SDK version installed:** `@anthropic-ai/sdk@0.105.0` (resolved by `npm install` from `package-lock.json`)
**Source of truth:** `.claude/CLAUDE.md` §SDK Helpers

---

## Confirmed: `messages.parse` (used by `/api/parse/route.ts`)

The following call shape is confirmed correct for `@anthropic-ai/sdk@0.105.0`:

```typescript
const response = await anthropic.messages.parse({
  model: PARSE_MODEL,
  max_tokens: 8000,
  output_config: { format: zodOutputFormat(LebenslaufSchema) },
  system: PARSE_SYSTEM,
  messages: [{ role: "user", content: buildParseUser(resumeText) }],
});
```

- **Import path:** `@anthropic-ai/sdk/helpers/zod` — correct and unchanged in 0.105.
- **Parameter name:** `output_config` (not the deprecated `output_format`) — the existing route uses `output_config: { format: zodOutputFormat(...) }` — correct.
- **Response field:** `response.parsed_output` returns the typed, Zod-validated object or `null` on failure.
- **Refusal guard:** `response.stop_reason === 'refusal'` is the correct check before accessing `parsed_output` — correctly implemented in the route (returns 422).
- **Zod v4 compatibility:** `@anthropic-ai/sdk@0.105.0` declares `zod` as `"^3.25.0 || ^4.0.0"` optional peer dep. The installed `zod@^4.4.3` satisfies this range.

---

## Confirmed: `messages.stream` + adaptive thinking (used by `/api/cover-letter/route.ts`)

```typescript
const stream = anthropic.messages.stream({
  model: GENERATION_MODEL,
  max_tokens: 4000,
  thinking: { type: "adaptive" },
  system: COVER_LETTER_SYSTEM,
  messages: [{ role: "user", content: buildCoverLetterUser({ cvText, jobPosting, answers }) }],
});
```

- **Adaptive thinking syntax:** `thinking: { type: 'adaptive' }` — correct for `claude-opus-4-8`. Using `budget_tokens` causes a 400 error on this model — correctly omitted.
- **Async iterator pattern:** `for await (const event of stream)` — correct way to consume the stream in a route handler.
- **Delta filter:** `event.type === 'content_block_delta' && event.delta.type === 'text_delta'` — correctly selects only text content. Thinking blocks emit `thinking_delta` and are correctly excluded by this filter.
- **Response construction:** `ReadableStream` with `controller.enqueue(encoder.encode(event.delta.text))` — correct for streaming plain text.

---

## No Regressions Required

The existing route files (`parse/route.ts` and `cover-letter/route.ts`) use these shapes correctly as-is. No changes to the API call patterns are needed in this plan. The only work in Plan 01-01 is the environment setup and the client-side `page.tsx` + `lebenslauf-utils.ts`.

---

## Zod v4 Safety Rules (Active Constraint)

Per `.claude/CLAUDE.md` §Zod v4 Safety:
- Use only `z.string()`, `z.array()`, `z.object()`, `.nullable()` — no `.min()`/`.max()` on any type.
- No `z.discriminatedUnion`, no recursive schemas.
- Root schema must remain `z.object({...})` — required by Anthropic structured output.
- The existing `LebenslaufSchema` follows these rules.
