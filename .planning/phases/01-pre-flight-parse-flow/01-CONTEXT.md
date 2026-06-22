# Phase 1: Pre-flight + Parse Flow - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Two halves:

1. **Pre-flight (mechanical — no user discussion needed):** App runs on Node ≥ 20.9 (`engines` pinned in `package.json` + `.nvmrc` committed), `.env.example` tracked with `ANTHROPIC_API_KEY`, and the Anthropic SDK call shapes (`messages.parse` + `output_config`, `messages.stream`) confirmed against `@anthropic-ai/sdk@0.105` before building UI on them. (SDK shapes already verified in `.claude/CLAUDE.md` — confirm, don't re-investigate.)

2. **Parse flow (the discussed work):** A user pastes résumé text, sees a loading state, and receives a German Lebenslauf rendered from the existing `/api/parse` output. The Lebenslauf is a **fully editable WYSIWYG mini-editor**, with a bilingual "what changed & why" panel, optional photo guidance, clean plain-text copy, and a loud zero-retention promise.

**Scope note (IMPORTANT for planner):** Discussion expanded this phase well beyond a minimal "render + copy" parse view. It now includes a full inline CV editor (edit/add/remove/reorder entries AND sections), categorized skills, and language-level normalization — which require **backend schema + prompt changes**, not just UI. The phase is `mvp` mode but is now large; the planner should expect multiple plans/waves and may flag the size to the user. The original roadmap success criteria (LL-01..LL-04, INPUT-01..03, PRE-01..03) all still hold — these decisions are *how* to implement them, plus editor capability the user explicitly added.

**Not in this phase:** cover-letter flow (Phase 2), analytics/security guards (Phase 3), design pass + deploy (Phase 4), distribution (Phase 5), and file download / drafts / accounts (deferred — see below).
</domain>

<decisions>
## Implementation Decisions

### Lebenslauf Display
- **D-01:** Render the Lebenslauf as a **formatted preview** that looks like a real German *tabellarischer Lebenslauf* (judge the 8-second-scan quality) **plus a plain-text view** toggle. The plain-text view is also the copy source.
- **D-02:** The Lebenslauf is **fully editable**: edit every field, AND add / remove / reorder entries (jobs, education, bullets, skills). Effectively a mini CV editor.
- **D-03:** **Editing model is WYSIWYG click-to-edit in the formatted preview** — fields become editable on click; add/remove/reorder controls (↑↓, ×, "+ add") appear on hover/focus. Not a separate edit form or side-by-side view.
- **D-04:** Copy source = the current **edited** state (not the original parse).

### Norm-Gap & Photo Guidance
- **D-05:** `normGapNotes[]` render in a **collapsible "What changed & why" block below** the Lebenslauf (CV stays the hero; notes one tap away).
- **D-06:** `photoAdvice` gets its **own clearly-labeled "Photo (optional)" callout** near the personal-data block — contextually placed, framed as optional-per-AGG, never mandated.
- **D-07:** Norm-gap notes voice = **concise + "why it matters"**: one-line change + short reason (e.g. "Added personal-data block — recruiters look for this in the 8-second scan"). → implies a small tweak to `PARSE_SYSTEM` in `prompts.ts` to shape note style.

### Editing Details
- **D-08:** Empty/null fields show as **fillable blanks** ("+ add phone", "+ add address") that guide the user to complete a norm-correct Lebenslauf.
- **D-09:** **Skills = editable chips grouped into German categories** (e.g. IT-/EDV-Kenntnisse, Fachkenntnisse). → requires a **schema change** (`skills: string[]` → categorized structure) AND a `PARSE_SYSTEM` change to assign categories. Researcher to confirm conventional German skill-category labels.
- **D-10:** **Language levels = a German-convention dropdown**: Muttersprache / Verhandlungssicher / Fließend / Gute Kenntnisse / Grundkenntnisse. Fixes a common expat norm gap ("native/fluent/B2"). Parse should map free-text levels onto these terms where possible.
- **D-11:** **Dates: soft-format to `DD.MM.YYYY` on blur** — free-text entry, best-effort normalization when a field loses focus. Keep normalization rules simple; do not over-engineer edge cases.
- **D-12:** **Section order is fully reorderable** (user can drag whole sections, in addition to reordering entries within a section). Default order follows German convention: Persönliche Daten → Berufserfahrung → Bildung → Kenntnisse → Sprachen.
- **D-13:** **No signature / "Ort, Datum / Unterschrift" footer in v1** (skipped).

### Input & Trust
- **D-14:** **Zero-retention statement = an inline reassurance line** (lock/shield icon) directly above the CV textarea — calm and visible, not a heavy bordered box. Core trust element; must appear before submit.
- **D-15:** **Loading state = a skeleton of the Lebenslauf layout** filling the result area during the parse (can run ~10–60s on Opus). Not a fake stepped-progress bar.
- **D-16:** **Start over = a stateless "Start over / paste a new CV" button** that clears state and returns to input. Nothing persisted — consistent with zero-retention. (Drafts deferred — see below.)

### Edge Cases
- **D-17:** **Non-CV / junk paste:** detect a refusal (`422`) or a near-empty parse result and show a friendly "that didn't look like a CV — try again" message, **preserving the user's pasted text** so they can fix/expand it. Needs a light "is this basically empty?" check on the result.

### Claude's Discretion (builder defaults — not separately decided)
- CV input: a large textarea with a helpful placeholder; submit disabled while empty; basic empty-input guard at the UI level (the real input-length guard is Phase 3 / TRUST-03).
- Readable error + retry on parse failure (`/api/parse` already returns 400 / 422 / 500).
- The page ends at the Lebenslauf for Phase 1 — the cover-letter CTA/step is Phase 2.
- Reasonable mobile stacking of the editor (full mobile design polish is Phase 4 / UI-02).
- State machine via `useReducer` (already decided project-wide); `resumeText` must persist for the later cover-letter step.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 1: Pre-flight + Parse Flow" — goal, requirements list, success criteria
- `.planning/REQUIREMENTS.md` — PRE-01/02/03, INPUT-01/02/03, LL-01/02/03/04 (the requirements this phase satisfies); also the Out-of-Scope table (zero-retention, no accounts, no Europass)
- `.planning/PROJECT.md` — core value, constraints (Node ≥20.9, models = `claude-opus-4-8`), and the zero-retention / no-fabrication / photo-guidance guardrails

### Tech stack & SDK (already verified — confirm only)
- `.claude/CLAUDE.md` — locked stack, `@anthropic-ai/sdk@0.105` shape verification (`messages.parse` + `output_config` + `parsed_output`; `stop_reason === 'refusal'`), Zod v4 notes, "What NOT to add" table
- `scanready/AGENTS.md` — **Next.js 16 has breaking changes vs. training data; read `node_modules/next/dist/docs/` before writing app code**
- `BUILD_PLAN.md` — execution plan, scope guardrails, distribution sequence (context)

### Existing backend code (the parse flow builds on these)
- `scanready/src/lib/schema.ts` — `LebenslaufSchema` (the output shape the UI renders; **D-09 changes `skills`**)
- `scanready/src/lib/prompts.ts` — `PARSE_SYSTEM`, `buildParseUser`, `PERSONALIZATION_QUESTIONS` (**D-07 + D-09 imply edits to `PARSE_SYSTEM`**)
- `scanready/src/app/api/parse/route.ts` — `POST /api/parse { resumeText } → { lebenslauf } | { error }`; `maxDuration = 60`, `runtime = nodejs`; returns 400/422/500
- `scanready/src/lib/anthropic.ts` — Anthropic client + `PARSE_MODEL` / `GENERATION_MODEL` config
- `scanready/src/app/page.tsx` — currently create-next-app boilerplate; this is where the flow gets built

### Concept (background)
- `cv-germany-expat-concept.md` — validated norm-gap value prop, German Lebenslauf conventions (DIN dates, photo norm, language-level wording)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`LebenslaufSchema` (schema.ts):** defines `personal{}`, `experience[]`, `education[]`, `skills[]`, `languages[]`, `normGapNotes[]`, `photoAdvice`. The entire editor renders/edits this shape. **`skills` must change** from `string[]` to a categorized structure (D-09).
- **`/api/parse` route:** already grounded, stateless, returns typed output. UI calls it directly via `fetch` (no react-query — per "What NOT to add"). Handles refusal as 422.
- **Nullable fields:** `address`, `phone`, `email`, `nationality`, `dateOfBirth`, `experience.location/start/end`, etc. are nullable — drives the fillable-blanks decision (D-08).

### Established Patterns / Constraints
- Next.js 16 (App Router, TS) + Tailwind v4 + Zod v4. **Read `node_modules/next/dist/docs/` before writing app code** (breaking changes vs. training data).
- `useReducer` for the multi-step flow (decided project-wide); `resumeText` must persist through steps.
- Grounding (no fabrication) is enforced in `prompts.ts` + the Zod schema — **must not regress** when editing prompts/schema for D-07/D-09.
- Direct `fetch` for the stateless one-shot API call; consume parse as JSON (streaming is the cover-letter route, Phase 2).

### Integration Points
- New parse-flow UI in `src/app/page.tsx` ↔ existing `POST /api/parse`.
- Schema/prompt edits (`schema.ts`, `prompts.ts`) ↔ both `/api/parse` output and the editor's expected shape — keep them in sync.

### Pre-flight blockers (carry from STATE.md)
- Local Node is **18.14.0**; Next 16 needs **≥ 20.9** — must upgrade before `npm install` / `dev`. PRE-01 is task 1.
- `.env.example` referenced but **not tracked** — create + commit; document `scanready/.env.local` with `ANTHROPIC_API_KEY`.
- No `engines` field and no `.nvmrc` in `package.json` today — both required by PRE-01.
</code_context>

<specifics>
## Specific Ideas

- The bilingual notes should read like a knowledgeable friend explaining the German norm, but tight ("change + why it matters in the 8-second scan").
- Language levels should use the actual German CV vocabulary (Muttersprache / Verhandlungssicher / Fließend / Gute Kenntnisse / Grundkenntnisse), because "fluent/native/B2" reads as off to a German recruiter — this *is* one of the norm gaps the tool exists to fix.
- The editor should feel like a real tool the owner can lean on while applying for jobs now (dogfooding) — hence full edit/add/remove/reorder and fillable blanks.
</specifics>

<deferred>
## Deferred Ideas

These came up during discussion and are explicitly NOT in Phase 1. Don't lose them.

1. **File download (DOCX, then PDF) — its own near-term phase.** The Word-using German audience will want a downloadable file, not just clipboard text. DOCX first (restylable), PDF after. Deferred because (a) it's currently v2 in `REQUIREMENTS.md` (FMT-02/FMT-03), and (b) getting a native-looking German Lebenslauf into a `.docx` deserves focused attention. **Action: add as a new phase to ROADMAP.md (via `/gsd-phase`) before/after Phase 2.**

2. **Browser-saved drafts (localStorage, no server) — near-term phase.** "Let me come back to my CV / keep a few drafts." Can be delivered entirely client-side (localStorage) so the **zero-retention promise stays intact** — no server, no DB, no accounts. Natural follow-on to the editor.

3. **User accounts + subscription monetization — STRATEGIC, revisit after validation.** The user floated "save the CV server-side; 1 free CV, pay a subscription to unlock more." This **conflicts with two locked positions**: (a) zero-retention / no server-side persistence (the GDPR trust *moat*, stated to the user on the input screen), and (b) the agreed monetization model is a *finish-line one-shot paywall* (€19–29/application), not a subscription. This is a product/strategy pivot (auth + DB + payments + new GDPR data-processing duties), not a Phase 1 detail. **Do not implement without an explicit strategy decision.** Browser-only drafts (#2) deliver most of the felt value without the pivot.
</deferred>

---

*Phase: 1-pre-flight-parse-flow*
*Context gathered: 2026-06-22*
