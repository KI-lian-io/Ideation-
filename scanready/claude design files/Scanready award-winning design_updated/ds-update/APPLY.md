# Applying this update to the ScanReady Design System project

This folder is a drop-in update for the **ScanReady Design System** project
(`scanready-design-system`, id `81c86740-c44a-4fdd-9f73-b0fbe709e750`), distilled from the
Turn-2 product elevation in `ScanReady Elevated.dc.html` (sections 2a–2e) in the consuming project.
It was staged here because the design-system project is read-only from that conversation.

## What's in it

- `readme.md` — **replaces** the root guide. Adds: MOTION section (scan-sweep, convert cycle,
  ticker, caret, pulse), banded rhythm + masthead + annotation system + editorial furniture in
  VISUAL FOUNDATIONS, ticker/placeholder/conditional-question copy rules in CONTENT FUNDAMENTALS,
  updated index and Do/Don't.
- `styles.css` — **replaces** (adds the motion.css import).
- `tokens/motion.css` — **new**: signature keyframes (`sr-scan`, `sr-scan-cycle`, `sr-en-out`,
  `sr-de-in`, `sr-note-in`, `sr-date-pop`, `sr-marquee`, `sr-caret`, `sr-pulse`), durations,
  `--ease-scan`, scan colors, `--ink-ghost`, reduced-motion guard.
- `tokens/shadows.css` — **replaces**: adds `--shadow-sheet`, `--shadow-sheet-hero`, `--shadow-modal`.
- `components/motion/` — **new**: `ScanSweep`, `NormTicker` (+ d.ts, prompt.md, card).
- `components/editorial/` — **new**: `SectionHeader`, `PullQuote`, `StatBlock` (+ card).
- `components/flow/` — **new**: `Stepper` (+ card).
- `components/surfaces/` — **updates** `NormNote` (back-compatible; adds pinned margin-card form
  via `n` / `kicker`), **adds** `AnnotationPin`, **replaces** `surfaces.card.html`, adds
  `NormNote.prompt.md`.
- `guidelines/` — **new** specimen cards: `motion-scan.html`, `motion-ticker.html`,
  `layout-bands.html`.

## How to apply

Open the design-system project and either:

1. Ask Claude there: *"Apply the update staged in ds-update/ of [link to this project]"* (it can
   read this project cross-project), or
2. Copy the files in manually at the same paths (folder root = design-system project root).

The compiler regenerates `_ds_bundle.js` / `_ds_manifest.json` automatically — don't copy those.
Everything not listed above is unchanged.

## Follow-up worth doing there

- Refresh `templates/marketing/` and `templates/converter/` from the Turn-2 screens
  (`ScanReady Elevated.dc.html`, ids 2a–2e) — they predate the motion set, the banded rhythm,
  and the document+margin converter layout.
