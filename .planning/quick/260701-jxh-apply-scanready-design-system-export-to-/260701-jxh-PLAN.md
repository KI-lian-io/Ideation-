---
phase: quick
plan: 260701-jxh
type: execute
wave: 1
depends_on: []
files_modified:
  - scanready/src/app/globals.css
  - scanready/src/components/ui.tsx
  - scanready/src/components/SkillChips.tsx
  - scanready/src/app/app/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "globals.css @theme tokens carry the exported ScanReady palette (band, brand-error/warn/tag, ink-soft, grey ramp) — no more stale 'AreaButler' naming"
    - "ui.tsx exports reusable SKILL_CHIP and NORM_NOTE class consts alongside btnClass/CARD/EYEBROW, in the same const-string style"
    - "the two hand-rolled call sites (skill chip in SkillChips.tsx, Hinweis note in app/page.tsx) consume the new consts instead of inline duplicated classes"
    - "npx tsc --noEmit passes in scanready/ with zero errors"
  artifacts:
    - path: "scanready/src/app/globals.css"
      provides: "reconciled @theme tokens matching the exported design system"
      contains: "ScanReady"
    - path: "scanready/src/components/ui.tsx"
      provides: "SKILL_CHIP + NORM_NOTE reusable primitives"
      contains: "SKILL_CHIP"
  key_links:
    - from: "scanready/src/components/SkillChips.tsx"
      to: "scanready/src/components/ui.tsx"
      via: "imports SKILL_CHIP const for the skill pill"
      pattern: "SKILL_CHIP"
    - from: "scanready/src/app/app/page.tsx"
      to: "scanready/src/components/ui.tsx"
      via: "imports NORM_NOTE const for the Hinweis callout"
      pattern: "NORM_NOTE"
---

<objective>
Reconcile the app's live design tokens and UI primitives with the independently-generated "ScanReady Design System" export at the repo root, so the app's `globals.css` + `ui.tsx` are the source of truth AND consistent with the exported canonical system.

This is a small reconciliation, not a redesign. The exported tokens, the shipped `globals.css`, and (mostly) `DESIGN.md` already agree on the core palette — the accent green `#0a7d63`, warm paper `#f0eee9`, near-white card `#fbfaf7`, navy ink `#1b2430`, 6px buttons, 12px cards. The drift is narrow: (a) stale "AreaButler" naming still in the app's CSS/primitive comments, (b) a handful of exported `@theme` tokens the app hand-rolls inline (brand-error terracotta, signature band, warm grey ramp, ink-soft), and (c) two reusable primitives the export ships (skill chip, norm-note) that the app duplicates inline instead of extracting.

Purpose: keep the shipped app and the exported system in lockstep, and eliminate hand-rolled duplication of design-system patterns.
Output: reconciled `globals.css` @theme block; new `SKILL_CHIP`/`NORM_NOTE` consts in `ui.tsx`; two call sites wired to them; clean typecheck.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# The exported canonical system (already read during planning; re-read only as needed)
@ScanReady Design System/SKILL.md
@ScanReady Design System/tokens/colors.css
@ScanReady Design System/tokens/radius.css

# The app's own canonical spec — authoritative on conflict (per CLAUDE.md)
@scanready/DESIGN.md

# The files this plan edits
@scanready/src/app/globals.css
@scanready/src/components/ui.tsx
@scanready/src/components/SkillChips.tsx
</context>

<reconciliation_findings>
Diff performed during planning. Key facts the executor must not re-litigate:

## Palette — shipped app and export AGREE; DESIGN.md frontmatter is the lone outlier
| Token role | app globals.css @theme | export colors.css | DESIGN.md YAML |
|---|---|---|---|
| accent (CTA/focus) | `#0a7d63` | `#0a7d63` | `#0a7d63` — all agree |
| accent hover/press | `#0b6e58` | `#0b6e58` | `#0c9379` — DESIGN.md differs |
| accent chip fill | `#d2e9e1` | `#d2e9e1` | `#cfe9e0` — DESIGN.md differs |
| accent note tint | `#eef6f2` | `#eef6f2` | `#eef7f3` — DESIGN.md differs |

DECISION (planner discretion, documented): the shipped `globals.css` values match the export exactly and are already live on Vercel. Treat the **shipped + export** ramp (`#0b6e58` / `#d2e9e1` / `#eef6f2`) as authoritative. Do NOT churn the live accent hover/chip/tint hexes to DESIGN.md's frontmatter values — that would change production color for no benefit and the export (the thing we are reconciling against) agrees with what ships. Instead, note the discrepancy in the SUMMARY so a human can align DESIGN.md's frontmatter later if desired. This is the one place export and DESIGN.md disagree; everywhere else they match.

## Naming drift (fix)
`globals.css` header comment and `ui.tsx` docblock still say "AreaButler design system" / "AreaButler UI primitives". The settled system is **ScanReady — Warm Editorial Broadsheet**. Rename in comments only (no token/class renames).

## Missing @theme tokens the app uses inline (add)
The app hand-rolls raw values the export names as tokens. Add these to the `@theme` block so they're consumable as Tailwind utilities and match the export's `tokens/colors.css`:
- `--color-brand-error: #c0503c;` (export `--brand-error`; app currently uses raw `text-red-600` for destructive/error text)
- `--color-brand-warn: #b9791a;` (export `--brand-warn`)
- `--color-brand-tag: #3772cf;` (export `--brand-tag`)
- `--color-ink-soft: #2a3340;` (export `--ink-soft`; norm-note / annotation body)
- `--color-slate: #4a5160;` and `--color-stone: #8a857c;` (export warm grey ramp; the app only has `--color-muted: #6f6960`, which is the export's `--steel`/`--body`, so keep `muted` as-is and ADD slate+stone)
- Signature band: `--color-band-from: #1b2430;` and `--color-band-to: #234038;` (export `--band-from`/`--band-to`)

Do NOT remove or rename any existing `@theme` token — the app's Tailwind classes (`bg-paper`, `bg-card`, `text-ink`, `text-muted`, `border-hair`, `text-eyebrow`, `bg-accent`, `text-accent`, `bg-accent-soft`, `text-accent-deep`, `bg-accent-tint`) all depend on the current names. This is additive.

## Missing reusable primitives the app duplicates inline (extract)
The export ships `Tag variant="skill"` and `NormNote` as components. The app does NOT need the export's inline-`style` JSX components ported — the app's primitive idiom is **exported const class-strings** (`btnClass`, `CARD`, `EYEBROW`). Match that idiom:
- `SKILL_CHIP` const — the skill pill. SkillChips.tsx (line ~112) hand-rolls: `flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent`. Extract the visual shell (`rounded-full bg-accent-soft px-3 py-1 text-sm text-accent`) as the const; keep `flex items-center gap-1` at the call site since it's layout for the inline delete button, not chip styling.
- `NORM_NOTE` const — the accent-tint annotation wash. The export's NormNote uses `--accent-tint` bg + hairline + `--ink-soft` text. The app's "Hinweis" callout (app/page.tsx line ~795) currently uses `rounded-lg border border-hair bg-paper px-4 py-3`. Provide `NORM_NOTE` as `rounded-md border border-hair bg-accent-tint px-4 py-3 text-ink-soft` (aligns to the export: accent-tint wash, ink-soft body, 8px `rounded-md`). Wire the Hinweis callout to it.
</reconciliation_findings>

<tasks>

<task type="auto">
  <name>Task 1: Reconcile globals.css @theme tokens and fix stale AreaButler naming</name>
  <files>scanready/src/app/globals.css</files>
  <action>
Open scanready/src/app/globals.css. Make two edits, both scoped to the `@theme` block and its header comment — do not touch the `body`, `::selection`, `.reveal-ready`, or `@media` rules.

1. Rename the stale system name in the top block comment. The current comment names the wrong (superseded) system. Replace the "AreaButler design system" reference with the settled name: ScanReady — Warm Editorial Broadsheet. Keep the rest of the comment's intent (warm paper, navy ink, taupe label, one accent).

2. Additively extend the `@theme` block with the exported tokens the app currently hand-rolls, matching the hex values in "ScanReady Design System/tokens/colors.css" exactly. Add (do NOT rename or remove any existing token):
   - `--color-brand-error: #c0503c;` (error terracotta)
   - `--color-brand-warn: #b9791a;` (warn amber)
   - `--color-brand-tag: #3772cf;` (tag blue)
   - `--color-ink-soft: #2a3340;` (annotation / norm-note body)
   - `--color-slate: #4a5160;` (secondary text)
   - `--color-stone: #8a857c;` (captions)
   - `--color-band-from: #1b2430;` and `--color-band-to: #234038;` (signature dark band)

   Leave the existing accent ramp untouched: `--color-accent: #0a7d63`, `--color-accent-deep: #0b6e58`, `--color-accent-soft: #d2e9e1`, `--color-accent-tint: #eef6f2` already match the export exactly. Do not change them to DESIGN.md's frontmatter values (see reconciliation_findings — shipped + export agree; DESIGN.md is the outlier).

Group the new tokens under a short comment (e.g. functional colors, text ramp additions, signature band) so the file stays readable.
  </action>
  <verify>
    <automated>cd scanready && npx tsc --noEmit && grep -c "brand-error\|ink-soft\|band-from" src/app/globals.css</automated>
  </verify>
  <done>globals.css @theme block contains --color-brand-error/warn/tag, --color-ink-soft, --color-slate, --color-stone, --color-band-from, --color-band-to at the exact export hexes; the stale "AreaButler" system name is gone from the header comment; all pre-existing tokens are unchanged; tsc passes.</done>
</task>

<task type="auto">
  <name>Task 2: Extract SKILL_CHIP + NORM_NOTE primitives into ui.tsx and wire the two hand-rolled call sites</name>
  <files>scanready/src/components/ui.tsx, scanready/src/components/SkillChips.tsx, scanready/src/app/app/page.tsx</files>
  <action>
Three coordinated edits. Keep the app's existing primitive idiom: exported `const` class-strings, not ported inline-style JSX components.

1. scanready/src/components/ui.tsx — fix the stale docblock name and add two consts.
   - Rename the "AreaButler UI primitives" reference in the top docblock to "ScanReady UI primitives" (ScanReady — Warm Editorial Broadsheet). Comment-only.
   - Below the existing `EYEBROW` export, add two new exported consts in the same style as `CARD`/`EYEBROW` (a one-line class string is the right shape here — a full component for a static pill/note would be a shallow module, matching the existing `// ponytail` reasoning already in the file):
     - `SKILL_CHIP` — the accent skill pill visual shell: `rounded-full bg-accent-soft px-3 py-1 text-sm text-accent`. Add a brief comment: the full-pill skill chip (accent-soft fill, accent text) — the one place pills survive.
     - `NORM_NOTE` — the accent-tint annotation wash: `rounded-md border border-hair bg-accent-tint px-4 py-3 text-ink-soft`. Add a brief comment: the norm-note / annotation callout (accent-tint wash, ink-soft body, 8px corner). Note that `bg-accent-tint` and `text-ink-soft` both resolve to @theme tokens (accent-tint already exists; ink-soft is added in Task 1).

2. scanready/src/components/SkillChips.tsx — consume SKILL_CHIP.
   - Extend the existing import `import { EYEBROW } from '@/components/ui'` to also import `SKILL_CHIP`.
   - At the skill-pill div (currently `className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent"`), replace the visual classes with the const while keeping the layout classes for the inline delete button: `className={\`flex items-center gap-1 ${SKILL_CHIP}\`}`. The rendered class set must be identical to before (layout `flex items-center gap-1` + the SKILL_CHIP shell).

3. scanready/src/app/app/page.tsx — consume NORM_NOTE for the Hinweis callout.
   - Extend the existing import `import { btnClass, CARD, EYEBROW } from '@/components/ui'` to also import `NORM_NOTE`.
   - At the native-speaker "Hinweis" callout (currently the div with `className="rounded-lg border border-hair bg-paper px-4 py-3"` wrapping the `EYEBROW` "Hinweis" label and the muted reminder text), swap its className to `NORM_NOTE`. This intentionally shifts the callout from the plain paper box to the accent-tint norm-note wash, aligning it with the exported NormNote component's role (it IS a norm/annotation note). Keep the inner `<p className={\`${EYEBROW} mb-1\`}>Hinweis</p>` and the reminder `<p>` unchanged.

Do NOT touch any other markup, business logic, reducer, API calls, or the parse/cover-letter flow. Only these className/import lines change.
  </action>
  <verify>
    <automated>cd scanready && npx tsc --noEmit && grep -q "SKILL_CHIP" src/components/ui.tsx && grep -q "NORM_NOTE" src/components/ui.tsx && grep -q "SKILL_CHIP" src/components/SkillChips.tsx && grep -q "NORM_NOTE" src/app/app/page.tsx && echo WIRED_OK</automated>
  </verify>
  <done>ui.tsx exports SKILL_CHIP and NORM_NOTE consts (class strings, same idiom as CARD/EYEBROW) and no longer references "AreaButler"; SkillChips.tsx imports and uses SKILL_CHIP on the skill pill (rendered classes unchanged from before); app/page.tsx imports and uses NORM_NOTE on the Hinweis callout; no business logic touched; tsc passes and prints WIRED_OK.</done>
</task>

</tasks>

<verification>
Run from scanready/:

1. `npx tsc --noEmit` — zero errors (the primary gate for both tasks).
2. `grep -n "ScanReady" src/app/globals.css src/components/ui.tsx` — confirms the system name was corrected (no "AreaButler" remaining: `grep -c AreaButler src/app/globals.css src/components/ui.tsx` should be 0 in both).
3. `grep -n "SKILL_CHIP\|NORM_NOTE" src/components/ui.tsx` — both consts exported.
4. Visual smoke check (only if a dev server is reasonably startable — Node ≥20.9 required; local node is v22 per MEMORY.md so this should run): `npm run dev`, then load `http://localhost:3000/` (landing — eyebrows, cards, CTAs render unchanged) and `http://localhost:3000/app` (tool — skill chips still render as green accent-soft pills; after generating an Anschreiben, the "Hinweis" callout now renders on the accent-tint wash rather than plain paper). Confirm no visual regression on the landing and that the tool's chips/notes match the exported system. If the dev server cannot start in this environment, note that in the SUMMARY and rely on the tsc gate + grep checks.
</verification>

<success_criteria>
- `npx tsc --noEmit` passes in scanready/ with zero errors.
- globals.css @theme block carries the exported brand-error/warn/tag, ink-soft, slate, stone, and band tokens at the exact hexes from the export's tokens/colors.css; the accent ramp is unchanged; the stale "AreaButler" name is gone.
- ui.tsx exports SKILL_CHIP and NORM_NOTE as reusable class-string consts; docblock names ScanReady, not AreaButler.
- The two previously hand-rolled call sites (skill pill in SkillChips.tsx, Hinweis callout in app/page.tsx) consume the new consts.
- No changes to parsing, API routes, reducer/state, or any non-styling logic.
- SUMMARY notes the one export-vs-DESIGN.md discrepancy (accent hover/chip/tint hexes) left unresolved for a human to align DESIGN.md frontmatter if desired.
</success_criteria>

<output>
Create `.planning/quick/260701-jxh-apply-scanready-design-system-export-to-/260701-jxh-SUMMARY.md` when done.
</output>