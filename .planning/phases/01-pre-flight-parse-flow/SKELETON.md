# Walking Skeleton — ScanReady

**Phase:** 1
**Generated:** 2026-06-22

## Capability Proven End-to-End

A user on the local dev server (Node 20.9+) can paste résumé text into a textarea on `page.tsx`, submit, see a loading skeleton, and watch a real German Lebenslauf shape (rendered from a live `POST /api/parse` → Claude structured-output round-trip) appear with at least their name and one Berufserfahrung entry — proving the whole paste → parse → render pipe works end-to-end before any editor, schema, or prompt work is layered on.

> No-database adaptation: this project is zero-retention by design (no DB, no accounts). The conventional "one real DB read/write" leg of a walking skeleton is replaced by **one real `/api/parse` round-trip** (paste CV text → existing structured-output route → Claude → render the returned `Lebenslauf` shape).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.2.9 (App Router, TS) — already scaffolded | Locked in `.claude/CLAUDE.md`; do not re-litigate. Read `node_modules/next/dist/docs/` before app code (breaking changes vs. training data). |
| Runtime | Node ≥ 20.9 (Homebrew Node 26 already installed at `/opt/homebrew/bin/node`) | Next 16 hard requirement (PRE-01). Local PATH currently resolves v18.14.0 first — fix PATH order, do not reinstall. |
| Data layer | None — stateless, zero-retention | GDPR trust moat. No DB, no persistence, no accounts (locked; v2 deferred). State lives in `useReducer` in `page.tsx`; nothing leaves the browser except the one `/api/parse` POST. |
| AI integration | `@anthropic-ai/sdk@0.105` `messages.parse` + `output_config` + `zodOutputFormat(LebenslaufSchema)`, model `claude-opus-4-8` | Already verified in `.claude/CLAUDE.md` (PRE-02 = confirm-only). Route `scanready/src/app/api/parse/route.ts` already exists and typechecks. |
| Client state | `useReducer` in a single `'use client'` `page.tsx` | Locked project-wide. No `zustand`, no `react-hook-form`, no `react-query`/`swr`, no `vercel/ai` (see "What NOT to Add"). Direct `fetch` for the one-shot call. |
| Data fetch | Direct `fetch('/api/parse')`, consumed as JSON | Stateless one-shot; streaming is the cover-letter route (Phase 2). |
| Deployment target | Local dev server (`npm run dev`) for Phase 1 | Vercel deploy is Phase 4 (OPS-02/03). The skeleton proves the stack on localhost. |
| Directory layout | `src/app/page.tsx` (flow), `src/app/api/parse/route.ts` (existing), `src/lib/*` (schema, prompts, anthropic, lebenslauf-utils), `src/components/*` (editor pieces) | Matches existing scaffold + RESEARCH.md recommended structure. `@/` alias → `src/`. |

## Stack Touched in Phase 1 (Skeleton = Plan 01)

- [x] Project runs — Node PATH fixed, `engines` pinned, `.nvmrc` committed, `npm install` succeeds, `npm run dev` boots (PRE-01)
- [x] SDK shapes confirmed against `@anthropic-ai/sdk@0.105` (PRE-02 — confirm-only, documented)
- [x] `.env.example` tracked + `.env.local` setup documented (PRE-03)
- [x] Routing — `page.tsx` calls the existing real `POST /api/parse` route
- [x] AI round-trip — one real `messages.parse` call returning a structured `Lebenslauf` (replaces the DB read/write leg)
- [x] UI — textarea + submit wired to the API; loading skeleton; read-only render of the returned name + first experience entry
- [x] Local full-stack run — `npm run dev` on http://localhost:3000 exercises paste → parse → render

## Out of Scope (Deferred to Later Slices in This Phase)

> Explicit so Plans 02–04 do not re-litigate the skeleton's minimalism. These are still Phase 1 — they layer on top of the skeleton.

- Backend schema change (`skills: string[]` → categorized) + `PARSE_SYSTEM` edits (D-07/D-09/D-10) → **Plan 02**
- WYSIWYG inline editing, add/remove/reorder entries + sections, fillable blanks, date soft-format, plain-text copy, start-over (D-01–D-04, D-08, D-11, D-12, D-16) → **Plan 03**
- Categorized skill chips, German language-level dropdown, collapsible norm-gap panel, photo callout (D-05/D-06/D-09-UI/D-10-UI) → **Plan 04**

## Out of Scope (Deferred to Later Phases — do not build here)

- Cover-letter flow (paste job posting → questions → streamed Anschreiben) → Phase 2
- PostHog analytics + input-length guards → Phase 3
- Design pass + Vercel deploy → Phase 4
- Distribution artifacts → Phase 5
- File download (DOCX/PDF), localStorage drafts, accounts/subscription → deferred (CONTEXT.md "Deferred Ideas")

## Subsequent Slice Plan

Each later plan adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Plan 02 (Wave 2):** Backend grounding-safe schema + prompt upgrade — categorized skills, German language levels, concise norm-gap note voice.
- **Plan 03 (Wave 3):** WYSIWYG editor core — edit any field, add/remove/reorder entries and whole sections, date soft-format on blur, copy edited state, start over.
- **Plan 04 (Wave 4):** Categorized skill chips + language-level dropdown + collapsible "what changed & why" panel + optional-photo callout.

Later phases (2–5) each add a further vertical slice (cover letter, analytics/guards, design+deploy, distribution) without renegotiating the no-DB, useReducer, direct-fetch, `@anthropic-ai/sdk` decisions recorded above.
