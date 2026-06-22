# Phase 01: Pre-flight + Parse Flow — Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 10 new/modified files
**Analogs found:** 7 / 10 (3 files are net-new with no codebase analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scanready/src/lib/schema.ts` | model | transform | self (existing, edit only) | exact |
| `scanready/src/lib/prompts.ts` | utility | transform | self (existing, edit only) | exact |
| `scanready/src/app/page.tsx` | component (page) | event-driven | `scanready/src/app/page.tsx` boilerplate (structure only) | partial — provides JSX shell; logic is net-new |
| `scanready/src/lib/lebenslauf-utils.ts` | utility | transform | `scanready/src/lib/prompts.ts` (utility module shape) | role-match |
| `scanready/src/components/LebenslaufEditor.tsx` | component | event-driven | `scanready/src/app/page.tsx` (JSX + Tailwind patterns) | partial |
| `scanready/src/components/EditableField.tsx` | component | event-driven | no analog — net-new pattern | none |
| `scanready/src/components/SkillChips.tsx` | component | event-driven | no analog — net-new pattern | none |
| `scanready/src/components/NormGapPanel.tsx` | component | event-driven | no analog — net-new pattern | none |
| `scanready/package.json` | config | — | self (existing, edit only) | exact |
| `scanready/.nvmrc` | config | — | none (new file, trivial) | none |

---

## Pattern Assignments

### `scanready/src/lib/schema.ts` (model, transform — EDIT)

**Analog:** itself — this is a targeted edit, not a rewrite.

**Current shape** (lines 1–48, full file):
```typescript
import { z } from "zod";

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
  skills: z.array(z.string()),   // ← THIS LINE CHANGES (D-09)
  languages: z.array(
    z.object({ language: z.string(), level: z.string().nullable() })
  ),
  normGapNotes: z.array(z.string()),
  photoAdvice: z.string(),
});

export type Lebenslauf = z.infer<typeof LebenslaufSchema>;
```

**Required change — D-09 (insert before `LebenslaufSchema`, replace `skills` line):**
```typescript
// Add before LebenslaufSchema:
export const SkillCategorySchema = z.object({
  category: z.string(),   // "IT-Kenntnisse" | "Fachkenntnisse" | "Sonstige Kenntnisse"
  skills: z.array(z.string()),
});

// Replace:  skills: z.array(z.string()),
// With:     skills: z.array(SkillCategorySchema),

// Add after LebenslaufSchema:
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
```

**Zod v4 safety rules (from CLAUDE.md — mandatory):**
- Use only `z.string()`, `z.array()`, `z.object()`, `.nullable()` — no `.min()`/`.max()` on any type.
- No `z.discriminatedUnion`, no recursive schemas, no `.optional()` unless already used.
- Root must remain `z.object({...})` — required by Anthropic structured output.

---

### `scanready/src/lib/prompts.ts` (utility, transform — EDIT)

**Analog:** itself — targeted additions to `PARSE_SYSTEM` only.

**Current `PARSE_SYSTEM`** (lines 5–22, full constant):
```typescript
export const PARSE_SYSTEM = `You convert a US/UK-style resume into a proper German "tabellarischer Lebenslauf".

GROUNDING — non-negotiable:
- Use ONLY facts present in the provided resume. Never invent employers, job titles,
  dates, degrees, skills, or contact details. If a field is unknown, return null or [].
- Do not translate the person's real data into something it isn't. You may translate
  language and reformat structure; you may NOT fabricate content.

GERMAN NORMS to apply (and explain in normGapNotes):
- Reverse-chronological, tabular structure; concise; 1-2 pages.
- Personal data section (address, phone with +49 if derivable, email, optionally
  nationality / date of birth ONLY if present in the source).
- Explain employment gaps if the dates reveal one.
- normGapNotes: list what differs from a US/UK resume and WHY (so the user learns).
- photoAdvice: explain that a photo is legally optional under the AGG but expected by
  most German recruiters; let the user decide. Do not fabricate a photo.

Output strictly matches the provided JSON schema.`;
```

**Required changes:**

D-07 — replace the `normGapNotes` line with:
```
- normGapNotes: for each structural or content change made, write ONE line in English:
  "[Change made] — [why this matters in the 8-second German recruiter scan]".
  Example: "Added personal-data block — recruiters look for name, address, phone in the top section."
  Be concise. Do not repeat content already visible in the Lebenslauf.
  GROUNDING: notes must describe actual changes made, not fabricate improvements that were not possible.
```

D-09 — append to the GERMAN NORMS block:
```
- Skills section: group skills into German-conventional categories.
  Use "IT-Kenntnisse" for software, programming, and technical tools.
  Use "Fachkenntnisse" for domain/industry-specific knowledge.
  Use "Sonstige Kenntnisse" for certifications, driver's licenses, and other qualifications.
  Only include categories that have entries from the source CV. Do not invent skills.
  Do not list soft skills as standalone entries — omit or weave into experience bullets.
```

D-10 — append to the GERMAN NORMS block:
```
- Language levels: map the applicant's stated proficiency to German CV vocabulary.
  Use exactly one of: Muttersprache, Verhandlungssicher, Fließend, Gute Kenntnisse, Grundkenntnisse.
  Do not use CEFR codes (A1/B2/C1), "native", "fluent", or free-form text.
  Mapping guide: native → Muttersprache; business fluent / C1-C2 → Verhandlungssicher;
  fluent / conversational / B2 → Fließend; intermediate / B1 → Gute Kenntnisse;
  basic / A1-A2 → Grundkenntnisse. If level is completely absent, return null.
```

**Grounding rule:** Every PARSE_SYSTEM addition must not weaken the GROUNDING block at the top. The words "Do not invent" / "Only include ... from the source CV" must appear explicitly in each addition that touches skills or notes.

---

### `scanready/src/app/page.tsx` (component/page, event-driven — FULL REWRITE)

**Analog:** The current `page.tsx` provides only the JSX/Tailwind shell conventions. The actual logic pattern comes from `scanready/src/app/api/parse/route.ts` (fetch call target) and the RESEARCH.md code examples (reducer shape).

**`'use client'` directive** — must be line 1 (from current page.tsx structure observation):
```typescript
'use client'
import { useReducer } from 'react'
```

**Imports pattern** — copy structure from `src/app/api/parse/route.ts` (lines 1–5) for path alias style:
```typescript
import { LebenslaufEditor } from '@/components/LebenslaufEditor'
import { NormGapPanel } from '@/components/NormGapPanel'
import type { Lebenslauf, SkillCategory } from '@/lib/schema'
import { isLebenslaufBasicallyEmpty } from '@/lib/lebenslauf-utils'
```

**State machine shape** (from RESEARCH.md §Page State Machine Sketch):
```typescript
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

**Fetch call pattern** — copy error-handling shape from `route.ts` (lines 29–36):
```typescript
// In the submit handler — no react-query, no SWR, direct fetch (CLAUDE.md rule)
const res = await fetch('/api/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resumeText: state.resumeText }),
})
if (res.status === 422) {
  dispatch({ type: 'PARSE_JUNK' })   // refusal — junk paste
  return
}
if (!res.ok) {
  dispatch({ type: 'PARSE_ERROR', payload: 'Failed to parse CV.' })
  return
}
const data = await res.json()
if (isLebenslaufBasicallyEmpty(data.lebenslauf)) {
  dispatch({ type: 'PARSE_JUNK' })
  return
}
dispatch({ type: 'PARSE_SUCCESS', payload: data.lebenslauf })
```

**Tailwind class conventions** — copy from current `page.tsx` (lines 5–6):
```typescript
// Outer container: flex column, fill height, neutral background
className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black"
// Inner panel: max-width, white card, vertical padding
className="flex flex-1 w-full max-w-3xl flex-col ... bg-white dark:bg-black"
```

**Zero-retention statement (D-14):** Place as an inline line with lock icon directly above the textarea — not a bordered box, not a modal. Pattern: `<p className="text-sm text-zinc-500 flex items-center gap-1.5 mb-2"><LockIcon /> Your CV is never stored.</p>`

**Skeleton loading (D-15):** Render a pulsing skeleton `div` in the `loading` phase — three stacked gray blocks with `animate-pulse` Tailwind class.

---

### `scanready/src/lib/lebenslauf-utils.ts` (utility, transform — NEW)

**Analog:** `scanready/src/lib/prompts.ts` — same module shape (named exports, pure functions, no side effects).

**Module shape to copy** (from `prompts.ts` lines 1–3, 43–45):
```typescript
// No default export — named exports only (copy from prompts.ts convention)
// No imports needed beyond types
import type { Lebenslauf } from '@/lib/schema'
```

**`softFormatDate` function** (D-11, from RESEARCH.md §Date soft-format):
```typescript
export function softFormatDate(raw: string): string {
  if (!raw) return raw
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw            // already DD.MM.YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-')
    return `${d}.${m}.${y}`
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [m, d, y] = raw.split('/')
    return `${d.padStart(2,'0')}.${m.padStart(2,'0')}.${y}`
  }
  return raw  // pass through: "heute", "September 2020", "2020", etc.
}
```

**`isLebenslaufBasicallyEmpty` function** (D-17, from RESEARCH.md §Junk Detection):
```typescript
export function isLebenslaufBasicallyEmpty(l: Lebenslauf): boolean {
  const hasName = Boolean(l.personal.fullName?.trim())
  const hasExperience = l.experience.length > 0
  const hasEducation = l.education.length > 0
  return !(hasName && (hasExperience || hasEducation))
}
```

**Plain-text serializer** (D-04 — copy source is the current edited state):
```typescript
// lebenslauf-utils.ts — serialize to plain text for clipboard copy
export function toPlainText(l: Lebenslauf): string {
  // Build DIN-style plain text block; sections separated by blank lines
  // See RESEARCH.md for section order; match sectionOrder from reducer state
}
```

---

### `scanready/src/components/LebenslaufEditor.tsx` (component, event-driven — NEW)

**Analog:** `scanready/src/app/page.tsx` — provides JSX + Tailwind v4 conventions. No component directory exists yet.

**File header pattern** (copy from `page.tsx` line 1 — client components need the directive):
```typescript
'use client'
```

**Props shape** — receives reducer state and dispatch:
```typescript
interface LebenslaufEditorProps {
  lebenslauf: Lebenslauf
  sectionOrder: string[]
  dispatch: React.Dispatch<LebenslaufAction>
}
```

**Section render loop** (D-12 — sectionOrder drives render):
```typescript
// Iterate sectionOrder; look up section component by key
// ↑↓ buttons dispatch REORDER_SECTION
{sectionOrder.map((key, i) => (
  <section key={key}>
    {i > 0 && <button onClick={() => dispatch({ type: 'REORDER_SECTION', from: i, to: i-1 })}>↑</button>}
    {i < sectionOrder.length - 1 && <button onClick={() => dispatch({ type: 'REORDER_SECTION', from: i, to: i+1 })}>↓</button>}
    {renderSection(key)}
  </section>
))}
```

**Reorder helper** (pure, no library — from RESEARCH.md §Reorder helper):
```typescript
function reorder<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}
```

**Add/remove/reorder entry pattern** (hover/focus controls per D-03):
```typescript
// Show controls on group hover — Tailwind group-hover pattern:
<div className="group relative">
  <button className="opacity-0 group-hover:opacity-100 absolute right-0 top-0" 
          onClick={() => dispatch({ type: 'REMOVE_EXPERIENCE', index: i })}>×</button>
  {/* entry content */}
</div>
```

---

### `scanready/src/components/EditableField.tsx` (component, event-driven — NEW)

**Analog:** None in codebase. Pattern comes from RESEARCH.md §WYSIWYG Inline Editing.

**Full pattern to copy** (from RESEARCH.md lines, swap-to-input on click):
```typescript
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
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) commit()
        if (e.key === 'Escape') setEditing(false)
      },
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

**Date field usage:** Pass `onBlurFormat={softFormatDate}` for date fields (D-11). Import `softFormatDate` from `@/lib/lebenslauf-utils`.

**Do NOT use `contentEditable`** — cursor resets on every React re-render (pitfall documented in RESEARCH.md §Pitfall 3).

---

### `scanready/src/components/SkillChips.tsx` (component, event-driven — NEW)

**Analog:** None in codebase. Derives from `EditableField` pattern + RESEARCH.md chip pattern.

**Key patterns:**
- Render `skills: SkillCategory[]` as grouped chip sections
- Each category label is itself an `EditableField` (category name editable)
- Each chip is a `<span>` with an inline remove button (×) and an `EditableField` for the text
- An "+ add skill" button at the end of each category dispatches `ADD_SKILL`
- An "+ add category" button dispatches `ADD_SKILL_CATEGORY`
- German language level dropdown (D-10) lives in the languages section, not here

**Language level constant** (from RESEARCH.md §Language Level Dropdown):
```typescript
// Place in SkillChips.tsx or a shared constants file
export const GERMAN_LANGUAGE_LEVELS = [
  'Muttersprache',
  'Verhandlungssicher',
  'Fließend',
  'Gute Kenntnisse',
  'Grundkenntnisse',
] as const
```

---

### `scanready/src/components/NormGapPanel.tsx` (component, event-driven — NEW)

**Analog:** None in codebase. Pattern is a simple collapsible disclosure component.

**Key patterns:**
- Uses React `useState` for open/closed state — local state, not in the reducer
- Renders `normGapNotes[]` as a list (D-05)
- Renders `photoAdvice` in a labeled callout — separate from notes (D-06)
- Collapsible: `<details>`/`<summary>` HTML element or `useState` toggle

**Collapsible pattern** (no library — use native HTML `<details>`):
```typescript
<details className="mt-6">
  <summary className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900">
    Was hat sich geändert &amp; warum? ({normGapNotes.length})
  </summary>
  <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
    {normGapNotes.map((note, i) => <li key={i}>{note}</li>)}
  </ul>
</details>
```

---

### `scanready/package.json` (config — EDIT)

**Analog:** itself.

**Current `scripts` block** (lines 5–10 — `"lint": "eslint"` already correct for Next 16):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**Required addition — `engines` field** (PRE-01, insert after `"private": true`):
```json
"engines": {
  "node": ">=20.9.0"
}
```

No other changes to `package.json` in this phase — zero new packages.

---

### `scanready/.nvmrc` (config — NEW)

**No analog** — trivial new file.

**Content:**
```
20
```

Single line. `nvm use 20` or `nvm install 20` will satisfy `>=20.9.0`.

---

## Shared Patterns

### `'use client'` Directive

**Source:** Required for all interactive components in Next.js 16 App Router.
**Apply to:** `page.tsx`, `LebenslaufEditor.tsx`, `EditableField.tsx`, `SkillChips.tsx`, `NormGapPanel.tsx`

```typescript
'use client'
// Must be the very first line — no comments, no imports above it
```

### Path Alias Imports

**Source:** `scanready/src/app/api/parse/route.ts` (lines 3–5)
**Apply to:** All new files importing from `src/lib/` or `src/components/`

```typescript
import { anthropic, PARSE_MODEL } from "@/lib/anthropic";
import { LebenslaufSchema } from "@/lib/schema";
import { PARSE_SYSTEM, buildParseUser } from "@/lib/prompts";
// Pattern: @/ always resolves to src/ — never use relative ../../ paths
```

### Error Handling (API Routes)

**Source:** `scanready/src/app/api/parse/route.ts` (lines 14–37)
**Apply to:** Any future API route additions; referenced by `page.tsx` fetch handler

```typescript
// try/catch wraps entire handler
// 400 = bad request (missing/wrong-typed input)
// 422 = model refusal (stop_reason === 'refusal')
// 500 = unexpected error
// console.error logs the error object ONLY — never log resumeText (security)
try {
  // ...
} catch (err) {
  console.error("parse error", err);
  return NextResponse.json({ error: "Failed to parse CV." }, { status: 500 });
}
```

### Route Config

**Source:** `scanready/src/app/api/parse/route.ts` (lines 7–8) and `cover-letter/route.ts` (lines 3–4)
**Apply to:** Any new API route files

```typescript
export const runtime = "nodejs";
export const maxDuration = 60;  // 120 for streaming routes; 60 for structured-output
```

### Grounding Rule (Prompts)

**Source:** `scanready/src/lib/prompts.ts` (lines 7–11) — the GROUNDING block
**Apply to:** Any additions or edits to `PARSE_SYSTEM` or `COVER_LETTER_SYSTEM`

```
GROUNDING — non-negotiable:
- Use ONLY facts present in the provided resume. Never invent employers, job titles,
  dates, degrees, skills, or contact details. If a field is unknown, return null or [].
- Do not translate the person's real data into something it isn't.
```
Every new PARSE_SYSTEM paragraph that touches output fields must end with "Do not invent [x]" or "Only include [x] from the source CV."

### Tailwind v4 Class Conventions

**Source:** `scanready/src/app/page.tsx` (lines 5–6)
**Apply to:** All new components

```typescript
// Neutral zinc scale for backgrounds/text
// Responsive: sm: prefix for breakpoints
// Dark mode: dark: prefix
// Transitions: transition-colors on interactive elements
// Spacing: gap-*, space-y-* over manual margin
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `scanready/src/components/EditableField.tsx` | component | event-driven | No interactive components exist in codebase yet; pattern sourced from RESEARCH.md |
| `scanready/src/components/SkillChips.tsx` | component | event-driven | No chip/tag UI exists; derives from EditableField pattern |
| `scanready/src/components/NormGapPanel.tsx` | component | event-driven | No collapsible UI exists; use native `<details>` |
| `scanready/.nvmrc` | config | — | Trivial new file; content is `20` |

For these files the planner should use the RESEARCH.md code examples as the primary reference since no codebase analog exists.

---

## Metadata

**Analog search scope:** `scanready/src/` (all subdirectories)
**Files scanned:** 6 source files (all existing source files in `scanready/src/`)
**Pattern extraction date:** 2026-06-22
