# Phase 01: Pre-flight + Parse Flow — Research

**Researched:** 2026-06-22
**Domain:** Node/Next.js 16 pre-flight, Anthropic SDK structured output, WYSIWYG inline CV editor, German Lebenslauf conventions
**Confidence:** MEDIUM (stack is locked and verified; German CV norms from web sources; inline-edit patterns from community sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Render Lebenslauf as formatted preview + plain-text view toggle; plain-text is the copy source.
- D-02: Lebenslauf is fully editable — edit every field, add/remove/reorder entries (jobs, education, bullets, skills).
- D-03: WYSIWYG click-to-edit in the formatted preview — fields become editable on click; add/remove/reorder controls (↑↓, ×, "+ add") appear on hover/focus. Not a separate form.
- D-04: Copy source = current edited state, not the original parse.
- D-05: normGapNotes[] render in a collapsible "What changed & why" block below the Lebenslauf.
- D-06: photoAdvice gets its own "Photo (optional)" callout near the personal-data block — framed as optional per AGG.
- D-07: Norm-gap notes voice = concise + "why it matters" (one-line change + short reason). Implies a small PARSE_SYSTEM edit.
- D-08: Empty/null fields show as fillable blanks ("+ add phone").
- D-09: Skills = editable chips grouped into German categories. Requires schema change (skills: string[] → categorized) AND PARSE_SYSTEM change.
- D-10: Language levels = German-convention dropdown (Muttersprache / Verhandlungssicher / Fließend / Gute Kenntnisse / Grundkenntnisse).
- D-11: Dates: soft-format to DD.MM.YYYY on blur — free-text entry, best-effort normalization.
- D-12: Section order is fully reorderable. Default order: Persönliche Daten → Berufserfahrung → Bildung → Kenntnisse → Sprachen. User can drag whole sections AND reorder entries within sections.
- D-13: No signature/"Ort, Datum / Unterschrift" footer in v1.
- D-14: Zero-retention statement = inline reassurance line (lock icon) directly above CV textarea.
- D-15: Loading state = skeleton of the Lebenslauf layout (no fake progress bar).
- D-16: Start over = stateless button, nothing persisted.
- D-17: Non-CV / junk paste: detect 422 (refusal) or near-empty parse result; show friendly message; preserve pasted text.

### Claude's Discretion
- CV input: large textarea with placeholder; submit disabled while empty; basic empty-input guard in UI (real length guard is Phase 3).
- Readable error + retry on parse failure.
- Reasonable mobile stacking (full mobile polish is Phase 4).
- State machine via useReducer; resumeText must persist for the cover-letter step.

### Deferred Ideas (OUT OF SCOPE)
- File download (DOCX/PDF) — own near-term phase.
- Browser-saved drafts (localStorage) — near-term phase.
- User accounts + subscription monetization — strategic pivot, deferred.
- Cover-letter flow — Phase 2.
- Analytics/security guards — Phase 3.
- Design pass + deploy — Phase 4.
- Distribution — Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRE-01 | App runs on Node ≥ 20.9 — `engines` pinned in package.json + `.nvmrc` committed | Node 26 is already installed via Homebrew at `/opt/homebrew/bin/node`; PATH fix required. See Environment Availability section. |
| PRE-02 | Anthropic SDK call shapes (`messages.parse` + `output_config`, `messages.stream`) confirmed against `@anthropic-ai/sdk@0.105` before UI is built on them | Already confirmed in `.claude/CLAUDE.md` — confirm-only per instructions. |
| PRE-03 | `.env.local` setup documented + `.env.example` tracked (`ANTHROPIC_API_KEY`) | `.env.example` exists in repo; needs verification it is tracked in git. |
| INPUT-01 | User can paste résumé text and submit it for conversion | Textarea + fetch to existing `/api/parse` — no new deps needed. |
| INPUT-02 | User sees prominent zero-retention statement above CV field | D-14: inline line with lock icon above textarea. |
| INPUT-03 | User sees clear loading state while CV is parsed; readable error if parsing fails | D-15: skeleton layout during parse; error state with retry. |
| LL-01 | User sees CV restructured as German Lebenslauf — reverse-chronological, DIN sections, DD.MM.YYYY dates, personal-data block | D-01 through D-13 collectively implement this. |
| LL-02 | User sees bilingual "what changed and why" panel from `normGapNotes[]` | D-05 + D-07 — collapsible block; no API change needed. |
| LL-03 | User sees nuanced photo guidance from `photoAdvice` | D-06 — "Photo (optional)" callout near personal-data block. |
| LL-04 | User can copy Lebenslauf output to clipboard | D-04 — copy of current edited state; standard Clipboard API. |
</phase_requirements>

---

## Summary

Phase 1 has two halves: a mechanical pre-flight (Node upgrade, .env setup, SDK shape confirmation) and a substantial parse flow that builds a WYSIWYG inline CV editor on top of the existing `/api/parse` route. The parse flow requires both a backend schema/prompt change (D-09 skills → categorized; D-07 note style) and a rich client-side editor built with `useReducer` in a `'use client'` App Router page.

The Node upgrade is a PATH issue, not an install issue: Node 26 is already on the machine at `/opt/homebrew/bin/node`; the system PATH resolves `/usr/local/bin/node` (v18.14.0) first. The fix is to ensure `$PATH` exports `/opt/homebrew/bin` before `/usr/local/bin`, add `"engines": {"node": ">=20.9.0"}` to `package.json`, and commit `.nvmrc` with `20`.

For the WYSIWYG editor: the right pattern is swap-to-controlled-input on click (not `contentEditable`), with `useReducer` owning the full `Lebenslauf` state. Section reorder should use plain ↑↓ buttons (no drag library). The categorized skills schema change is safe with Zod v4 as long as no `.min()`/`.max()` validators are added to numbers.

The most novel open question (D-09 skill categories) has a clear answer from German HR sources: use `IT-Kenntnisse`, `Sprachkenntnisse`, and `Sonstige Kenntnisse` as the three required categories; `Fachkenntnisse` is a fourth for domain-specific skills. Languages already have their own top-level array so they stay separate.

**Primary recommendation:** Implement the schema and prompt changes first (schema.ts + prompts.ts), then build the editor as a single `'use client'` page with `useReducer`. Use ↑↓ buttons for reorder (no drag library). Use swap-to-input pattern for inline editing. Walking skeleton order: input → parse call → render personal block → expand to full editor.

---

## Project Constraints (from CLAUDE.md)

These directives from `.claude/CLAUDE.md` are non-negotiable and the planner must verify compliance:

| Directive | Constraint |
|-----------|------------|
| No new deps without cause | Every package addition must be justified. This phase adds zero new packages. |
| No `zustand` | Use `useReducer` in the page component. |
| No `react-hook-form` | Use controlled inputs with reducer state. |
| No `react-query` / `swr` | Use direct `fetch` in event handlers. |
| No `vercel/ai` SDK | Continue using `@anthropic-ai/sdk` directly. |
| Grounded-only generation | Must not regress when editing prompts/schema. |
| GDPR zero-retention | No server-side persistence; must not be introduced. |
| Zod v4 — standard primitives only | Avoid `.min()`/`.max()` on numbers; avoid recursive schemas. |
| Node ≥ 20.9 | PRE-01: fix before `npm install` or `dev`. |
| Read `node_modules/next/dist/docs/` before writing app code | Node modules are not installed yet; the official Next.js 16 blog + upgrade guide were read instead. See Next.js 16 Gotchas section. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CV text input + submit | Browser/Client | — | Client-side state; no SSR needed |
| Zero-retention reassurance UI | Browser/Client | — | Static display, client rendered |
| Loading skeleton | Browser/Client | — | Client-driven based on fetch state |
| `POST /api/parse` call | API/Backend | — | Already exists; stateless, server-side SDK call |
| Lebenslauf state (edit/add/remove/reorder) | Browser/Client | — | All mutations are in-memory; no server write |
| WYSIWYG inline editor | Browser/Client | — | Event-driven DOM interactions |
| normGapNotes display | Browser/Client | — | Pure client render from parse response |
| photoAdvice display | Browser/Client | — | Pure client render from parse response |
| Clipboard copy | Browser/Client | — | Clipboard API; client only |
| Schema + prompt changes | API/Backend | — | `schema.ts` and `prompts.ts` are consumed by `/api/parse` |
| Date soft-formatting (D-11) | Browser/Client | — | onBlur handler; pure client |
| `.nvmrc` + `engines` pinning | Build/Config | — | Pre-flight, not runtime |

**Key takeaway:** `page.tsx` owns the entire client experience. It is a single `'use client'` component with `useReducer`. The only server boundary is `POST /api/parse`.

---

## Standard Stack

### Core (All Already Installed — No New Deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.9 | App Router + API routes | Locked — already scaffolded |
| react / react-dom | 19.2.4 | Client component rendering | Locked |
| @anthropic-ai/sdk | ^0.105.0 | `messages.parse` structured output | Locked + verified |
| zod | ^4.4.3 | Schema definition + SDK integration | Locked + verified |
| tailwindcss | ^4 | Styling | Locked |

### No New Packages in This Phase

This phase installs zero new packages beyond what is already in `package.json`. The only package-management task is `npm install` (after the Node upgrade). No additions.

---

## Package Legitimacy Audit

All packages in this phase are the existing scaffolded dependencies. No new packages are introduced.

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|--------------|-------------|---------|-------------|
| next | npm | Published 2026-06-09 | 43M | github.com/vercel/next.js | SUS (too-new flag, legitimate project) | Approved — 43M/wk, official Vercel project. "too-new" flag triggered by recent release date, not a legitimacy issue. |
| react | npm | Published 2026-06-01 | 150M | github.com/facebook/react | SUS (too-new flag, legitimate project) | Approved — official Facebook/Meta project. |
| @anthropic-ai/sdk | npm | Published 2026-06-18 | 24M | github.com/anthropics/anthropic-sdk-typescript | SUS (too-new flag, legitimate project) | Approved — official Anthropic SDK. |
| zod | npm | Published 2026-05-04 | 206M | github.com/colinhacks/zod | OK | Approved. |

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious [SUS]:** All three SUS flags are triggered by `too-new` (recent publish dates for actively maintained popular packages), not by low download count or missing source repos. All three have official source repos and industry-leading download counts. Approved for use.

*[VERIFIED: npm registry for download counts and publish dates via package-legitimacy seam]*

---

## Architecture Patterns

### System Architecture Diagram

```
[User Browser]
     |
     | paste resumeText
     v
[page.tsx — 'use client']
     | useReducer(lebenslaufReducer, initialState)
     | state: { phase: 'input'|'loading'|'result'|'error', resumeText, lebenslauf, editingField }
     |
     | fetch POST /api/parse
     v
[Next.js API Route — /app/api/parse/route.ts]
     | anthropic.messages.parse()
     | zodOutputFormat(LebenslaufSchema)  ←── schema.ts (categorized skills)
     | PARSE_SYSTEM prompt                ←── prompts.ts (D-07 style, D-09 categories)
     v
[Anthropic API — claude-opus-4-8]
     | structured output: Lebenslauf JSON
     v
[/api/parse returns { lebenslauf } | { error }]
     |
     v
[page.tsx dispatch('PARSE_SUCCESS', lebenslauf)]
     |
     v
[LebenslaufEditor component]
     | Section → Entry → Field (click-to-edit swap pattern)
     | ↑↓ buttons for reorder, × for remove, "+ add" for insert
     | onBlur → date soft-format
     | Skills: categorized chip groups
     | Languages: German-level dropdown
     |
     v
[normGapNotes collapsible block]
[photoAdvice callout]
[Copy button → Clipboard API from plain-text serialization]
[Start Over → dispatch('RESET')]
```

### Recommended Project Structure

```
scanready/src/
├── app/
│   ├── page.tsx              # 'use client' — entire flow (useReducer, fetch, editor)
│   ├── layout.tsx            # existing — no changes needed
│   └── api/
│       └── parse/
│           └── route.ts      # existing — minor edit: no functional change
├── lib/
│   ├── schema.ts             # EDIT: skills → SkillCategorySchema[]
│   ├── prompts.ts            # EDIT: D-07 note style + D-09 category instruction
│   ├── anthropic.ts          # no change
│   └── lebenslauf-utils.ts   # NEW: date soft-format, plain-text serializer, empty-check
└── components/
    ├── LebenslaufEditor.tsx   # NEW: the WYSIWYG editor shell
    ├── EditableField.tsx      # NEW: display/input swap pattern
    ├── SkillChips.tsx         # NEW: categorized chip groups
    └── NormGapPanel.tsx       # NEW: collapsible normGapNotes + photoAdvice
```

---

## Focus Question Answers

### 1. German Skill Categories (D-09) — HIGHEST VALUE

**Confirmed conventional category labels** for the *Kenntnisse* section of a real German tabellarischer Lebenslauf:

| Category Label | German Name | Typical Contents |
|----------------|-------------|-----------------|
| IT skills | `IT-Kenntnisse` (modern) or `EDV-Kenntnisse` (still used) | MS Office, programming languages, databases, design tools, cloud/SaaS |
| Domain skills | `Fachkenntnisse` | Industry-specific knowledge (e.g. "GAAP-Kenntnisse", "ISO 9001") |
| Other qualifications | `Sonstige Kenntnisse` or `Weitere Kenntnisse` | Driver's license (Führerschein Klasse B), certifications, forklift, etc. |

**Languages are NOT in the Kenntnisse section** — they live in a separate `Sprachen` top-level section (already in the schema as `languages[]`). Do not merge them into skills.

**Soft skills** are generally NOT listed as standalone chips in the Kenntnisse section — they belong in a Profil/Über mich paragraph or woven into experience bullet points. If a source CV has "team player" as a skill, parse it into `Sonstige Kenntnisse` with a note, or discard per grounding rules if there is no concrete backing evidence. [ASSUMED — convention from web sources, not from a prescriptive DIN norm document]

**Recommended categorized schema shape** (replaces `skills: z.array(z.string())`):

```typescript
// In schema.ts — safe for Zod v4 + Anthropic structured output
// No .min()/.max() on numbers; no recursive refs; root is object
export const SkillCategorySchema = z.object({
  category: z.string(),   // e.g. "IT-Kenntnisse", "Fachkenntnisse", "Sonstige Kenntnisse"
  skills: z.array(z.string()),
});

// Replace skills: z.array(z.string()) with:
skills: z.array(SkillCategorySchema),
```

This is a flat, non-discriminated array-of-objects. It avoids `z.discriminatedUnion` (which would consume anyOf quota), avoids optional fields, and uses only standard primitives. Safe.

**PARSE_SYSTEM addition for D-09** (append to the GERMAN NORMS section):

```
- Skills section: group skills into German-conventional categories.
  Use "IT-Kenntnisse" for software, programming, and technical tools.
  Use "Fachkenntnisse" for domain/industry-specific knowledge.
  Use "Sonstige Kenntnisse" for certifications, driver's licenses, and other qualifications.
  Only include categories that have entries from the source CV. Do not invent skills.
  Do not list soft skills as standalone entries — omit or weave into experience bullets.
```

**Cross-check with `cv-germany-expat-concept.md`:** The concept doc confirms the Lebenslauf must have a *Kenntnisse* section; it does not prescribe subcategory names beyond acknowledging German norms. The category labels above are consistent with what major German CV advisory sites (Lebenslauf.de, jobvector.de, lebenslaufdesigns.de) recommend. [CITED: lebenslaufdesigns.de/lebenslauf-kenntnisse]

### 2. WYSIWYG Inline Editing — React 19 / Next 16, No New Deps

**Pattern: swap-to-controlled-input on click (NOT contentEditable)**

`contentEditable` has critical pitfalls that make it wrong for this use case:
- Does not fire `onChange`, only `onInput`
- Cursor position resets on every React re-render (React replaces content when it re-renders)
- `Ctrl+Z` undo breaks because React owns the DOM
- Conflicts with React's declarative model

**The right pattern** — display element swaps to a controlled `<input>` or `<textarea>` on click, swaps back on blur/Enter:

```typescript
// EditableField.tsx — Source: community pattern, no library needed
// [ASSUMED] — standard React pattern, not verified against official docs
'use client'
import { useState, useRef, useEffect } from 'react'

interface EditableFieldProps {
  value: string | null
  placeholder?: string          // e.g. "+ add phone"
  multiline?: boolean
  onSave: (newValue: string) => void
  onBlurFormat?: (raw: string) => string  // for D-11 date formatting
  className?: string
}

export function EditableField({ value, placeholder, multiline, onSave, onBlurFormat, className }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const commit = () => {
    const formatted = onBlurFormat ? onBlurFormat(draft) : draft
    setDraft(formatted)
    onSave(formatted)
    setEditing(false)
  }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !multiline) commit(); if (e.key === 'Escape') setEditing(false) },
      className: `${className} border-b border-blue-400 outline-none bg-transparent w-full`,
    }
    return multiline ? <textarea {...shared} rows={3} /> : <input {...shared} />
  }

  return (
    <span
      className={`${className} cursor-pointer hover:bg-blue-50 rounded px-0.5`}
      onClick={() => { setDraft(value ?? ''); setEditing(true) }}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </span>
  )
}
```

**Reducer shape for the full Lebenslauf editor:**

```typescript
// [ASSUMED] — pattern, not from official docs
type LebenslaufAction =
  | { type: 'PARSE_SUCCESS'; payload: Lebenslauf }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'UPDATE_PERSONAL'; field: keyof Lebenslauf['personal']; value: string }
  | { type: 'UPDATE_EXPERIENCE'; index: number; field: keyof Experience; value: string }
  | { type: 'ADD_EXPERIENCE' }
  | { type: 'REMOVE_EXPERIENCE'; index: number }
  | { type: 'REORDER_EXPERIENCE'; from: number; to: number }
  | { type: 'UPDATE_BULLET'; expIndex: number; bulletIndex: number; value: string }
  | { type: 'ADD_BULLET'; expIndex: number }
  | { type: 'REMOVE_BULLET'; expIndex: number; bulletIndex: number }
  | { type: 'UPDATE_EDUCATION'; index: number; field: keyof Education; value: string }
  | { type: 'ADD_EDUCATION' }
  | { type: 'REMOVE_EDUCATION'; index: number }
  | { type: 'REORDER_EDUCATION'; from: number; to: number }
  | { type: 'UPDATE_SKILL'; catIndex: number; skillIndex: number; value: string }
  | { type: 'ADD_SKILL'; catIndex: number }
  | { type: 'REMOVE_SKILL'; catIndex: number; skillIndex: number }
  | { type: 'ADD_SKILL_CATEGORY' }
  | { type: 'REMOVE_SKILL_CATEGORY'; catIndex: number }
  | { type: 'UPDATE_LANGUAGE'; index: number; field: 'language' | 'level'; value: string }
  | { type: 'ADD_LANGUAGE' }
  | { type: 'REMOVE_LANGUAGE'; index: number }
  | { type: 'REORDER_SECTION'; from: number; to: number }  // D-12: whole section reorder
```

**Reorder helper** (pure, no library):

```typescript
// [ASSUMED]
function reorder<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}
```

**Date soft-format on blur (D-11):**

```typescript
// lebenslauf-utils.ts — [ASSUMED]
export function softFormatDate(raw: string): string {
  if (!raw) return raw
  // Already formatted: DD.MM.YYYY or "heute" or month-year variants
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-')
    return `${d}.${m}.${y}`
  }
  // MM/DD/YYYY → DD.MM.YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [m, d, y] = raw.split('/')
    return `${d.padStart(2,'0')}.${m.padStart(2,'0')}.${y}`
  }
  // Return as-is for anything else (natural language dates, "heute", partial dates)
  return raw
}
```

Keep it simple — don't over-engineer. Per D-11: "do not over-engineer edge cases."

### 3. Section + Entry Reordering (D-12) — No Drag Library

**Recommendation: use ↑↓ buttons for both entry reorder and whole-section reorder.**

Native HTML5 drag-and-drop pitfalls:
- Requires `draggable` attribute, `dragover`, `dragstart`, `drop` event handlers — ~50 lines of stateful boilerplate
- Touch events (`touchstart`/`touchmove`/`touchend`) are entirely separate APIs and not handled by HTML5 drag at all — mobile reorder breaks silently
- Accessibility (keyboard navigation) requires additional ARIA and keyboard handlers on top

↑↓ buttons:
- ~5 lines per array: `dispatch({ type: 'REORDER_EXPERIENCE', from: i, to: i-1 })`
- Keyboard accessible by default (buttons are focusable)
- Touch-safe (buttons work on mobile)
- No new dependencies
- Consistent with D-12 scope ("tight scope")

**Verdict: ↑↓ buttons.** Implement drag-and-drop in a later design-polish phase if user testing shows it matters.

Section order (D-12): maintain a `sectionOrder: string[]` array in reducer state (e.g. `['personal', 'experience', 'education', 'skills', 'languages']`). Reorder dispatches `REORDER_SECTION`. Render sections by iterating `sectionOrder` and looking up the component.

### 4. Next.js 16 App-Code Gotchas

**Source: official Next.js 16 blog + upgrade guide, fetched 2026-06-22** [CITED: nextjs.org/blog/next-16, nextjs.org/docs/app/guides/upgrading/version-16]

**Directly relevant to ScanReady Phase 1:**

| Gotcha | Impact on page.tsx | What to do |
|--------|-------------------|------------|
| Node.js 20.9+ hard requirement | `npm install` fails on Node 18 | Upgrade Node first (PRE-01 is task 1). Node 26 already on machine via Homebrew. |
| `params` and `searchParams` are async | `page.tsx` doesn't use params, so no impact. Route handlers that receive params must `await params`. | `/api/parse/route.ts` uses `req.json()` not params — no change needed. |
| `cookies()`, `headers()`, `draftMode()` async | Not used in the client page or parse route. | N/A. |
| Turbopack is default bundler | `next dev` now uses Turbopack without `--turbopack`. | No code change; just awareness. |
| `middleware.ts` deprecated → `proxy.ts` | ScanReady has no middleware. | N/A. |
| Parallel routes require `default.js` | ScanReady has no parallel routes. | N/A. |
| `next lint` command removed | Use `eslint` directly. | Update `package.json` scripts if a lint script is needed. |
| `'use client'` directive behavior | **UNCHANGED from Next.js 15.** Place at top of file; all components in that file and its imports become client components. | `page.tsx` gets `'use client'` at line 1. |
| `useReducer` with controlled inputs | **UNCHANGED.** React 19 `useReducer` + `useState` work identically in client components. | No change. |
| Hydration with `'use client'` | A fully client-driven page with no server-only dynamic data has no hydration mismatch risk. The Lebenslauf editor starts empty and fills from a client-side fetch response — no SSR/client mismatch. | No special guards needed. |
| React Compiler (stable in Next 16) | Not enabled by default. Don't enable — it requires Babel and adds compile time. | Leave `reactCompiler` unset in `next.config.ts`. |
| `revalidateTag()` now requires second arg | ScanReady has no cache tags — stateless API. | N/A. |

**`node_modules/next/dist/docs/` note:** Node modules are not installed yet (Node 18 prevents `npm install`). The official Next.js 16 blog and upgrade guide were read directly from `nextjs.org` as the authoritative equivalent. After PRE-01 completes and `npm install` runs, the local docs will be available but the findings above are already complete.

**React 19 `useReducer` + controlled inputs — no surprises:**

```typescript
// [ASSUMED] — standard React 19 pattern
'use client'
import { useReducer } from 'react'

// This pattern is identical in React 18 and React 19.
// No 'use server' / Server Actions needed; all mutations are client-side.
export default function Page() {
  const [state, dispatch] = useReducer(lebenslaufReducer, initialState)
  // ...
}
```

`useReducer` is a pure client hook. No hydration concerns because the page starts in `input` phase (empty form) which is identical server and client.

### 5. Schema/Prompt Change Safety

**Grounding must not regress.** The PARSE_SYSTEM additions for D-07 and D-09 must reinforce the no-fabrication rule, not weaken it.

**Safe PARSE_SYSTEM edit pattern for D-07 (note style):** Replace or extend the `normGapNotes` instruction:

```
// BEFORE:
- normGapNotes: list what differs from a US/UK resume and WHY (so the user learns).

// AFTER:
- normGapNotes: for each structural or content change made, write ONE line in English:
  "[Change made] — [why this matters in the 8-second German recruiter scan]".
  Example: "Added personal-data block — recruiters look for name, address, phone in the top section."
  Be concise. Do not repeat content already visible in the Lebenslauf.
  GROUNDING: notes must describe actual changes made, not fabricate improvements that were not possible.
```

**Safe PARSE_SYSTEM edit pattern for D-09 (categories):** Add to the GERMAN NORMS section (see Section 1 above). The grounding constraint must be explicit:

```
  Only include categories that have entries from the source CV. Do not invent skills.
```

**Zod v4 schema change safety checklist:**
- [x] `SkillCategorySchema` uses only `z.string()` and `z.array(z.string())` — no numeric validators
- [x] No `.min()` / `.max()` on any field (would emit `minimum`/`maximum` in JSON Schema — Anthropic rejects)
- [x] No `z.discriminatedUnion` (would use anyOf quota unnecessarily)
- [x] `category` and `skills` are both required (not `.optional()`) — keeps optional-param count low
- [x] Root schema remains `z.object({...})` — required by Anthropic
- [x] `additionalProperties: false` is added automatically by `zodOutputFormat`
- [x] New field `skills: z.array(SkillCategorySchema)` adds roughly 3 parameters (array + object + two string fields) — well within limits

**`messages.parse()` validation:** After the schema change, `response.parsed_output` will be typed as `Lebenslauf` with `skills: SkillCategory[]`. If the model returns an empty array for skills, that is valid. If it returns null or wrong types, Zod will surface the mismatch — the route handler should already handle this via the `response.parsed_output` null check.

### 6. Junk-Paste / Empty-Result Detection (D-17)

**422 path (refusal):** Already handled — `/api/parse` returns `{ error: "Request was declined." }` with status 422. The UI must detect this status code and show the friendly message while preserving `resumeText`.

**Near-empty parse path:** The model may succeed but return a nearly empty Lebenslauf if the input is junk (a phone number, a Lorem Ipsum paste, etc.). A light heuristic:

```typescript
// lebenslauf-utils.ts — [ASSUMED]
export function isLebenslaufBasicallyEmpty(l: Lebenslauf): boolean {
  const hasName = Boolean(l.personal.fullName?.trim())
  const hasExperience = l.experience.length > 0
  const hasEducation = l.education.length > 0
  // A real CV must have at least a name AND (experience OR education)
  return !(hasName && (hasExperience || hasEducation))
}
```

Use in `page.tsx` after a successful 200 parse:

```typescript
if (isLebenslaufBasicallyEmpty(data.lebenslauf)) {
  dispatch({ type: 'PARSE_JUNK' })  // shows friendly message, preserves resumeText
  return
}
dispatch({ type: 'PARSE_SUCCESS', payload: data.lebenslauf })
```

This is intentionally minimal. Do not over-engineer (D-11 principle applies here too). A CV with a name and one entry is valid; only flag truly empty results.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill chips + tag input | Custom autocomplete | Plain `<input>` per chip with add/remove buttons | Zero-dep; sufficient for this use case |
| Rich text editing | `contentEditable` div with custom selection handling | Swap-to-`<input>` or `<textarea>` on click | contentEditable has cursor-reset and undo bugs in React; overkill for plain text |
| Drag-and-drop reorder | HTML5 drag events + touch events | ↑↓ buttons | Touch Safari has broken drag-and-drop; ↑↓ is accessible and touch-safe |
| Date parsing library | Import `date-fns` or `dayjs` | Simple regex in `softFormatDate` utility | D-11 explicitly says "do not over-engineer"; only 3 format patterns needed |
| Clipboard API wrapper | Custom hook | `navigator.clipboard.writeText()` | Already built into all target browsers (Chrome 111+, per Next 16 browser matrix) |
| State management | `zustand` / `jotai` | `useReducer` | CLAUDE.md forbids global state libs; single-page linear flow needs no cross-component global store |
| Form library | `react-hook-form` | Controlled inputs + reducer | CLAUDE.md forbids form libs; 3–5 text answers + textarea is not a form that needs a library |

---

## Common Pitfalls

### Pitfall 1: Node Version Mismatch Blocks `npm install`

**What goes wrong:** Running `npm install` with Node 18 fails immediately because Next 16 declares `engines: { node: ">=20.9.0" }`. Error: `npm warn EBADENGINE`.
**Why it happens:** `/usr/local/bin/node` (v18.14.0) is earlier in `$PATH` than `/opt/homebrew/bin/node` (v26).
**How to avoid:** Task 1 of PRE-01 must verify Node version. Fix: `export PATH="/opt/homebrew/bin:$PATH"` in the shell profile, then restart the terminal. Node 26 satisfies ≥20.9.0. After fixing PATH, run `npm install`.
**Warning signs:** `node --version` returns 18.x in the project terminal.

### Pitfall 2: Editing `schema.ts` Without Updating `prompts.ts` (and vice versa)

**What goes wrong:** The schema now expects `skills: SkillCategory[]` but PARSE_SYSTEM still says nothing about categories. Claude returns a flat array of strings → Zod validation fails → `response.parsed_output` is null → `/api/parse` returns `{ lebenslauf: null }` → UI crashes.
**Why it happens:** Schema and prompt are separate files with no compile-time link.
**How to avoid:** Always change `schema.ts` and `prompts.ts` in the same commit. The plan should make these two tasks sequential with a `npx tsc --noEmit` check between them.

### Pitfall 3: `contentEditable` Cursor Reset

**What goes wrong:** Using `contentEditable` instead of the swap-to-input pattern. On every React re-render (which happens on every reducer dispatch), React replaces the element's content, moving the caret to position 0 mid-word. The user loses their cursor on every keystroke.
**Why it happens:** React's reconciler replaces DOM text nodes when state changes; `contentEditable` expects the browser to own that text.
**How to avoid:** Use the `EditableField` swap pattern described in Section 2. Only swap to `<input>` on click; let React own the controlled input value normally.

### Pitfall 4: Hydration Mismatch from Dynamic Initial State

**What goes wrong:** If any reducer initial state is derived from `Date.now()`, `Math.random()`, or `window.*`, the server render (which happens even for `'use client'` components in some configurations) will produce HTML that doesn't match the client's first render.
**Why it happens:** SSR produces HTML before client JS runs.
**How to avoid:** The `initialState` for the reducer must be static and deterministic: `{ phase: 'input', resumeText: '', lebenslauf: null, error: null }`. No dynamic values in initial state.

### Pitfall 5: Zod `.min()`/`.max()` Validators on Numbers Cause 400 from Anthropic

**What goes wrong:** Adding `z.number().min(0)` or similar to the schema causes Anthropic's structured output API to reject the call with a 400 Bad Request.
**Why it happens:** `zodOutputFormat` serializes the Zod schema to JSON Schema. `z.number().min(0)` emits `"minimum": 0` which is not in Anthropic's supported subset.
**How to avoid:** Use bare `z.number()` and `z.string()`. Validate ranges post-parse in application code if needed. CLAUDE.md already documents this constraint.

### Pitfall 6: Section Reorder State Not Initialized

**What goes wrong:** `sectionOrder` is not in the initial reducer state, so sections always render in the schema-defined order and the ↑↓ section reorder buttons have no effect.
**Why it happens:** Easy to wire up UI buttons without connecting them to a `sectionOrder` reducer key.
**How to avoid:** `initialState.sectionOrder = ['personal', 'experience', 'education', 'skills', 'languages']` as part of the `PARSE_SUCCESS` reducer case.

### Pitfall 7: Empty `.env.example` / Missing Tracking

**What goes wrong:** `.env.example` exists but may not be tracked in git (`git status` not checked). If it is in `.gitignore`, contributors get no guidance.
**Why it happens:** `create-next-app` scaffolded `.env.example` but may not have committed it.
**How to avoid:** PRE-03 task must: (1) verify `.env.example` is tracked (`git ls-files .env.example`), (2) verify it contains `ANTHROPIC_API_KEY=`, (3) ensure `.env.local` is in `.gitignore`.

---

## Code Examples

### Categorized Skills Schema (D-09)

```typescript
// src/lib/schema.ts — replaces skills: z.array(z.string())
// Source: inferred from Anthropic Zod constraints + German CV conventions
// [ASSUMED]
export const SkillCategorySchema = z.object({
  category: z.string(),   // "IT-Kenntnisse" | "Fachkenntnisse" | "Sonstige Kenntnisse"
  skills: z.array(z.string()),
});

export const LebenslaufSchema = z.object({
  personal: z.object({
    fullName: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    nationality: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
  }),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      location: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      qualification: z.string(),
      institution: z.string(),
      location: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
  ),
  skills: z.array(SkillCategorySchema),  // ← changed
  languages: z.array(
    z.object({ language: z.string(), level: z.string().nullable() })
  ),
  normGapNotes: z.array(z.string()),
  photoAdvice: z.string(),
});

export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type Lebenslauf = z.infer<typeof LebenslaufSchema>;
```

### Language Level Dropdown (D-10)

```typescript
// [ASSUMED] — German CV vocabulary, not a library
const GERMAN_LANGUAGE_LEVELS = [
  'Muttersprache',
  'Verhandlungssicher',
  'Fließend',
  'Gute Kenntnisse',
  'Grundkenntnisse',
] as const

// In LanguageRow component:
<select
  value={lang.level ?? ''}
  onChange={e => dispatch({ type: 'UPDATE_LANGUAGE', index: i, field: 'level', value: e.target.value })}
  className="border-0 bg-transparent text-sm"
>
  <option value="">— Niveau wählen —</option>
  {GERMAN_LANGUAGE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
</select>
```

The PARSE_SYSTEM change for D-10 (add to GERMAN NORMS):

```
- Language levels: map the applicant's stated proficiency to German CV vocabulary.
  Use exactly one of: Muttersprache, Verhandlungssicher, Fließend, Gute Kenntnisse, Grundkenntnisse.
  Do not use CEFR codes (A1/B2/C1), "native", "fluent", or free-form text.
  Mapping guide: native → Muttersprache; business fluent / C1-C2 → Verhandlungssicher;
  fluent / conversational / B2 → Fließend; intermediate / B1 → Gute Kenntnisse;
  basic / A1-A2 → Grundkenntnisse. If level is completely absent, return null.
```

### Page State Machine Sketch

```typescript
// [ASSUMED] — walking skeleton pattern
type AppPhase = 'input' | 'loading' | 'result' | 'error' | 'junk'

type AppState = {
  phase: AppPhase
  resumeText: string          // persists through all phases for cover-letter step
  lebenslauf: Lebenslauf | null
  sectionOrder: string[]
  errorMessage: string | null
}

const initialState: AppState = {
  phase: 'input',
  resumeText: '',
  lebenslauf: null,
  sectionOrder: ['personal', 'experience', 'education', 'skills', 'languages'],
  errorMessage: null,
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` (NodeJS runtime) | Next.js 16 | ScanReady has no middleware — no action needed |
| `params` sync access | `await params` | Next.js 15/16 | `/api/parse` uses `req.json()` not params — no action needed |
| Turbopack opt-in (`--turbopack`) | Turbopack default | Next.js 16 | `next dev` and `next build` use Turbopack automatically |
| `experimental.turbopack` in config | Top-level `turbopack` | Next.js 16 | `next.config.ts` has no turbopack config — no action needed |
| EDV-Kenntnisse (older term) | IT-Kenntnisse (modern preferred) | ~2018–2020 | Use "IT-Kenntnisse" as the primary category label in schema + prompt |
| `skills: string[]` flat array | `skills: SkillCategory[]` categorized | This phase | Schema + prompt change required |

**Deprecated/outdated:**
- `serverRuntimeConfig` / `publicRuntimeConfig`: removed in Next.js 16 — not used in ScanReady.
- `next lint` command: removed — update `package.json` if a lint script references it.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Soft skills are not standalone chips in the Kenntnisse section — they belong in a Profil paragraph or experience bullets | German Skill Categories | Low risk — if wrong, the model will put them in "Sonstige Kenntnisse" which is still a reasonable fallback; the UI still works |
| A2 | `EditableField` swap-to-input pattern (display → input on click, commit on blur/Enter) is the right React 19 / no-lib approach | WYSIWYG Editing | Low risk — this is a well-established React pattern; the specific implementation will need testing but the approach is sound |
| A3 | ↑↓ buttons are sufficient for v1 reorder (entries and sections) | Section Reorder | Low risk — user testing may reveal drag-and-drop is strongly desired, but that is a Phase 4 design polish concern |
| A4 | `isLebenslaufBasicallyEmpty` heuristic (name + experience OR education) is the right minimal check for junk pastes | Junk Detection | Medium risk — a paste of just a LinkedIn profile headline might have a name but no experience. Could be tightened by also checking `experience[0].bullets.length > 0`, but "do not over-engineer" |
| A5 | The `sectionOrder` string[] in reducer state is sufficient for D-12 section reorder | Section Reorder | Low risk — the render loop simply maps `sectionOrder` to components by key |
| A6 | Node 26 via Homebrew (`/opt/homebrew/bin/node`) satisfies the `>=20.9.0` requirement | PRE-01 | Very low risk — Node 26 > 20.9.0 confirmed |
| A7 | `'use client'` at the top of `page.tsx` (the entire page is client-rendered) causes no hydration issues because initial state is static | Next.js Hydration | Very low risk — the page starts with an empty form; server and client render identically |

---

## Open Questions (RESOLVED)

All three were answered inline below and the recommendations are implemented by the Phase 1 plans (unconstrained `category: z.string()`, simple pulsing skeleton, minimal partial-date pass-through).

1. **D-09: Are exactly 3 skill categories always enough?**
   - What we know: German CVs conventionally use IT-Kenntnisse, Fachkenntnisse, and Sonstige Kenntnisse.
   - What's unclear: Some source CVs may have unusual skills that don't fit these three (e.g. creative skills, industry-specific certifications).
   - RESOLVED: Allow the model to create additional categories with free-form names — the schema uses `category: z.string()` which is unconstrained. The PARSE_SYSTEM instruction says "use [these three] for [these purposes]" but does not forbid other categories. The UI chips render any category name.

2. **D-15: Lebenslauf skeleton — how detailed?**
   - What we know: The skeleton must fill the result area during a ~10–60s parse.
   - What's unclear: Should it be a pixel-accurate skeleton (matching the real layout blocks) or a simpler pulsing gray card?
   - RESOLVED: A simple pulsing three-section skeleton (header block + two content blocks) is sufficient for v1. Pixel-accurate skeleton is Phase 4 polish.

3. **D-11: Date format for partial dates (year-only, month-year)?**
   - What we know: `softFormatDate` handles `YYYY-MM-DD` and `MM/DD/YYYY`.
   - What's unclear: Many CVs have "September 2020" or "2020" as a date.
   - RESOLVED: Pass through unchanged if not matching the 3 supported patterns. German convention also accepts `MM/YYYY` and `YYYY`. Keep the regex list minimal per D-11.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js ≥20.9 | Next.js 16 | Partially | 26.0.0 at `/opt/homebrew/bin`; 18.14.0 at `/usr/local/bin` | Fix PATH to prefer Homebrew |
| npm | `npm install` | Yes | Bundled with Node | — |
| `ANTHROPIC_API_KEY` | `/api/parse` | Not set (dev must set) | — | Copy `.env.example` → `.env.local` and add key |
| git | PRE-03 `.env.example` tracking | Yes | — | — |

**Missing dependencies with no fallback:**
- `ANTHROPIC_API_KEY` must be set in `.env.local` before testing the parse route. This is documentation (PRE-03), not a code task.

**Missing dependencies with fallback:**
- Node 18.14.0 in PATH: fix by prepending `/opt/homebrew/bin` to `$PATH` or running `export PATH="/opt/homebrew/bin:$PATH"` in the shell profile. Node 26 is already installed.

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` (per config.json).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user auth in this phase or in v1 scope |
| V3 Session Management | No | Stateless — no session |
| V4 Access Control | No | Single-user tool, no access tiers |
| V5 Input Validation | Yes | `resumeText` must be a string — already validated in `/api/parse` (returns 400 on missing/non-string). Length guard is Phase 3 (TRUST-03). UI empty-state guard prevents zero-length submits. |
| V6 Cryptography | No | No encryption needed; no data persisted |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via CV text | Tampering | PARSE_SYSTEM grounding rules + Zod schema validation constrain output shape; model cannot be instructed to return arbitrary JSON |
| Sensitive CV data logged to console | Information Disclosure | `console.error("parse error", err)` in route.ts must NOT log the `resumeText` — only log the error object. Verify in implementation. |
| `ANTHROPIC_API_KEY` in client bundle | Information Disclosure | Key lives in `process.env.ANTHROPIC_API_KEY` on the server-side route handler only. Verify that no import of `anthropic.ts` or the key appears in client-side components. |
| XSS via Lebenslauf field content | Tampering | React's JSX rendering escapes HTML by default. Do NOT use `dangerouslySetInnerHTML` anywhere in the editor. |

---

## Sources

### Primary (MEDIUM confidence)
- [CITED: nextjs.org/blog/next-16] — Next.js 16 release blog, October 2025. Breaking changes table, React 19.2 features, Node ≥20.9 requirement.
- [CITED: nextjs.org/docs/app/guides/upgrading/version-16] — Next.js 16 upgrade guide, last updated 2026-05-13. Async params, turbopack, middleware→proxy, parallel routes.
- [CITED: platform.claude.com/docs/en/build-with-claude/structured-outputs] — Anthropic structured outputs documentation. Unsupported JSON Schema features, anyOf limits, optional parameter budget.
- [CITED: lebenslaufdesigns.de/lebenslauf-kenntnisse] — German CV skills section conventions. IT-Kenntnisse, Sprachkenntnisse, Sonstige Kenntnisse category labels.

### Secondary (LOW confidence)
- [WebSearch: jobvector.de, jobteaser.com, lebenslauf.de] — German CV advisory sites confirming skill category conventions.
- [WebSearch: markoskon.com, medium.com/programming-essentials] — contentEditable vs. controlled input pitfalls in React.
- [WebSearch: github.com/vercel/ai/issues/14342] — Anthropic structured output rejection of unsupported JSON Schema keywords.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked in CLAUDE.md, verified by npm registry
- Next.js 16 breaking changes: MEDIUM — fetched from official nextjs.org docs
- German skill categories: LOW — from German HR advisory web sources, not a DIN norm document
- WYSIWYG inline editing pattern: LOW — community pattern, no official React docs source
- Zod v4 / Anthropic structured output constraints: LOW — fetched from Anthropic docs + GitHub issues
- Junk detection heuristic: LOW — designed heuristic, not validated against real data

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stable stack; German CV norms change slowly)
