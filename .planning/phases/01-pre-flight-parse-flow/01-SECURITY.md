---
phase: 01-pre-flight-parse-flow
slug: 01-pre-flight-parse-flow
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-22
---

# Phase 01 — Security Audit

> Audit performed post-implementation. All mitigations verified in code — documentation and intent NOT accepted as evidence.
> Implementation files: READ-ONLY. No patches applied here.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| browser → `/api/parse` | Untrusted pasted CV text crosses into the server route and into the model prompt | CV text (PII-adjacent) |
| `/api/parse` → Anthropic API | Server-held `ANTHROPIC_API_KEY` must never cross back to the client bundle | API key (secret) |
| parse response → React render | Model-produced text (Lebenslauf fields, normGapNotes, photoAdvice) is rendered into the page | Model output (untrusted strings) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status | Evidence |
|-----------|----------|-----------|-------------|------------|--------|----------|
| T-01-01 | Tampering | Prompt injection via pasted CV → /api/parse | mitigate | `PARSE_SYSTEM` grounding block + `zodOutputFormat(LebenslaufSchema)` | CLOSED | `prompts.ts:7-10` GROUNDING block; `route.ts:24` `output_config: { format: zodOutputFormat(LebenslaufSchema) }` |
| T-01-02 | Info Disclosure | `ANTHROPIC_API_KEY` leaking into client bundle | mitigate | `page.tsx` and `components/*` must NOT import `@/lib/anthropic` or reference `ANTHROPIC_API_KEY` | CLOSED | Negative grep: zero matches in `page.tsx` or `src/components/`; key only in `lib/anthropic.ts` (server-only) |
| T-01-03 | Info Disclosure | CV text persisted/logged server-side | accept (already-mitigated) | `/api/parse` stateless; `console.error` logs only the error object | CLOSED | `route.ts:35` `console.error("parse error", err)` — `resumeText` is NOT in the log call; no DB/fs/localStorage writes anywhere in route |
| T-01-04 | Tampering | XSS via rendering parsed CV content | mitigate (HIGH) | React/JSX escapes; no `dangerouslySetInnerHTML` | CLOSED | Negative grep across all `src/`: zero actual `dangerouslySetInnerHTML` usage (NormGapPanel.tsx:14 is a prohibition comment only); all fields rendered as text nodes or controlled-input values |
| T-01-05 | Tampering | Prompt edits weakening no-fabrication grounding | mitigate (HIGH) | `prompts.ts` top GROUNDING block intact; D-07/D-09/D-10 additions reaffirm "do not invent" | CLOSED | `prompts.ts:7-10` "GROUNDING — non-negotiable: Use ONLY facts … Never invent"; `prompts.ts:22` "notes must describe actual changes made, not fabricate"; `prompts.ts:27` "Do not invent skills"; `prompts.ts:32` CEFR/native/fluent prohibited |
| T-01-06 | Tampering | Schema emits unsupported JSON-Schema keywords → 400/null parsed_output | mitigate | Zod-v4 safe shape only (no `.min`/`.max`, no `discriminatedUnion`) | CLOSED | Negative grep on `schema.ts`: zero `.min(`/`.max(` or `discriminatedUnion` matches; only `z.string`, `z.array`, `z.object`, `.nullable()` used |
| T-01-07 | Tampering | Prompt injection steering categorization | accept (already-mitigated) | `zodOutputFormat(LebenslaufSchema)` constrains output shape regardless of injected instructions | CLOSED | Same evidence as T-01-01: `route.ts:24` enforces structured output shape at the API level |
| T-01-08 | Tampering | XSS via EditableField/LebenslaufEditor field content | mitigate (HIGH) | Controlled inputs + text nodes; no `dangerouslySetInnerHTML`/`contentEditable` | CLOSED | Negative grep: zero `dangerouslySetInnerHTML` or `contentEditable` in `EditableField.tsx` or `LebenslaufEditor.tsx`; all values via controlled `<input>`/`<textarea>` or `<span>{value}</span>` text nodes (`EditableField.tsx:101-107`) |
| T-01-09 | Info Disclosure | Edited CV state persisted (breaks zero-retention) | accept (by design) | Edits live in `useReducer` memory; RESET clears; no server/DB/localStorage write this phase | CLOSED | Accepted by design — verified: `page.tsx` uses `useReducer` only; no `localStorage.setItem`/`sessionStorage`/DB calls anywhere in `src/`; RESET returns `initialState` (`page.tsx:59`) |
| T-01-10 | Tampering | XSS via normGapNotes/photoAdvice/skill text | mitigate (HIGH) | All render as text nodes; no `dangerouslySetInnerHTML` | CLOSED | `NormGapPanel.tsx:48` `<li key={i}>{note}</li>` — text node; `LebenslaufEditor.tsx:141` `<p ...>{photoAdvice}</p>` — text node; negative grep confirmed no injection anywhere in `src/` |
| T-01-11 | Repudiation/Info Disclosure | Photo callout implying upload/processing | mitigate | Copy frames photo as optional; tool never accepts/uploads/processes a photo | CLOSED | `prompts.ts:35` "explain that a photo is legally optional under the AGG"; `LebenslaufEditor.tsx:133-134` "Framed as legally optional under the AGG; user's choice; never mandated. The tool does NOT accept, upload, or process photos"; negative grep: zero `type="file"`, `FileReader`, `upload`, `formData` in `src/` |
| T-01-SC | Tampering | Dependency supply chain | accept | Zero new packages this phase; only existing audited scaffold deps resolved via `npm install` | CLOSED | Accepted — no new entries in `package.json` `dependencies`/`devDependencies` for Plans 02-04; `npm install` resolved pre-audited scaffold |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-03 | T-01-03 | Parse route is stateless. `console.error` logs only the error object, not `resumeText`. Confirmed in `route.ts:35`. No DB, fs, or cache writes exist in the route. | Kilian Hartmann | 2026-06-22 |
| AR-01-07 | T-01-07 | `zodOutputFormat(LebenslaufSchema)` at the API boundary constrains all outputs to the declared schema shape regardless of prompt injection content. Covered by T-01-01 mitigation. | Kilian Hartmann | 2026-06-22 |
| AR-01-09 | T-01-09 | Edited state is intentionally held in-memory only (`useReducer`). RESET returns to `initialState`. No persistence mechanism exists in this phase. This is the zero-retention design. | Kilian Hartmann | 2026-06-22 |
| AR-01-SC | T-01-SC | No new packages introduced in Plans 01-04. `npm install` resolved only the pre-existing, developer-audited scaffold dependencies (`@anthropic-ai/sdk`, `next`, `react`, `zod`, `tailwindcss`). | Kilian Hartmann | 2026-06-22 |

---

## Unregistered Flags from SUMMARY.md `## Threat Flags`

| Plan | Reported Flag | Assessment |
|------|---------------|------------|
| 01-01 | "No new threat surface introduced beyond the plan's threat model. Negative greps on `dangerouslySetInnerHTML` and `ANTHROPIC_API_KEY` confirmed clean." | Informational — maps to T-01-02 and T-01-04 (CLOSED) |
| 01-02 | "None. No new network endpoints, auth paths, file access patterns, or schema changes at additional trust boundaries. Mitigations for T-01-05 and T-01-06 confirmed applied." | Informational — maps to T-01-05 and T-01-06 (CLOSED) |
| 01-03 | No new flags noted (negative greps confirmed clean in SUMMARY). | N/A |
| 01-04 | No new flags noted (negative greps confirmed clean in SUMMARY). | N/A |

No unregistered flags require a new threat entry.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | ASVS Level | Run By |
|------------|---------------|--------|------|------------|--------|
| 2026-06-22 | 12 | 12 | 0 | L1 | gsd-security-auditor (claude-sonnet-4-6) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-22
