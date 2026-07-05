---
name: scanready-design
description: Use this skill to generate well-branded interfaces and assets for ScanReady — the tool that converts a foreign CV into the German Lebenslauf / Anschreiben a recruiter expects. Use for production or throwaway prototypes/mocks. Contains the design guidelines, colors, type, fonts, assets, and starter templates.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and
create static HTML files for the user to view. If working on production code, you can copy
assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.

## What ScanReady is
ScanReady rewrites an applicant's existing CV into a **German Lebenslauf** (and a matching
**Anschreiben**), normalized to local norms — DIN dates, expected sections, formal tone — with
every change annotated. The product promise: *win the 8-second German recruiter scan.* The
audience is internationals applying in Germany. Processing is **zero-retention** by design.

## Map
- `readme.md` — the design guide: context, content fundamentals, visual foundations,
  iconography, and an index of everything here. **Start here.**
- `styles.css` — global entry; `@import`s every token + font file. Link this one file.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`,
  `fonts.css` (CSS custom properties on `:root`).
- `components/` — reusable React primitives (`core/`, `forms/`, `surfaces/`, `navigation/`).
  Each has `<Name>.jsx`, `<Name>.d.ts`. Namespace on `window`: `ScanReadyDesignSystem_81c867`.
- `templates/` — copyable starting points: `marketing/` (landing page) and `converter/`
  (the two-pane CV→Lebenslauf screen). Each entry is a `.dc.html`.
- `guidelines/` — foundation specimen cards (colors, type, spacing, radius, elevation, logo,
  icons).
- `assets/` — `logo/` (type-built stand-in wordmark, green scan-line) and `icons/` (Lucide monoline SVGs).

## The system: Warm Editorial Broadsheet
WIRED's editorial authority, warmed by Starbucks' cream-and-green discipline, on ScanReady's
navy and serif. The generated document reads like **print**, not form output.

## Non-negotiables
- **Four type voices, never mixed:** display serif (`--font-serif`, Iowan/Palatino) for marketing
  display tiers only (`hero-display`→`heading-2`); **reading serif** (`--font-serif-text`, Source
  Serif 4) for the generated Lebenslauf/Anschreiben document only; Inter (`--font-sans`) for
  `heading-3` down + all UI; Geist Mono (`--font-mono`) for code + the uppercase eyebrow label.
- **One accent:** deep green (`--accent` `#0a7d63`) for the emphasis CTA, focus ring, active dot,
  and the document check. Reserve taupe (`--eyebrow`) for the mono uppercase micro-label only.
- **6px corners** on every button (color + `scale(0.97)` press, no hover glow); **12px** on every
  card; full-pill reserved for chips/badges/status dots. Flat surfaces with warm hairlines;
  shadow only on the **document mockup** (the one shadowed element) and the featured pricing tier.
- The **navy signature band** is the one dark surface — one trust/closing statement, serif
  headline, accent lock dot.
- **Never** pure black/white, no emoji, no display headlines in Inter, no eyebrow in a non-mono
  face, sentence case everywhere except the eyebrow. German document copy stays in German.

## Caveats baked in
Fonts (Inter, Source Serif 4, Geist Mono) load from Google Fonts; display serif is a system
Iowan/Palatino stack. Icons are Lucide (substituted). Logo is a type-built stand-in. Replace with
real brand assets when available. See `readme.md` → Caveats.
