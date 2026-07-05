# ScanReady Design System

**Warm Editorial Broadsheet** — a warm, print-grade take on a product that converts a foreign CV
into the German Lebenslauf a recruiter expects. The visual language blends **WIRED's editorial
authority**, **Starbucks' cream-and-green discipline**, and ScanReady's **navy ink and serif**.
Marketing reads calm and premium; the generated document reads like print, not form output.

> **One rule governs everything:** the generated document is the hero. Every choice — the reading
> serif, the warm paper, the single green accent, the one shadow — exists to make the applicant's
> Lebenslauf look like a document a German recruiter respects in the 8 seconds they spend on it.

---

## What ScanReady is

ScanReady rewrites an applicant's existing CV into a **German Lebenslauf** and a matching
**Anschreiben**, normalized to local norms — DIN dates, the expected section order, a formal tone —
with **every change annotated** by a norm-note. The audience is internationals applying in Germany.
Processing is **zero-retention**: nothing is stored, processing is stateless.

The product promise, in voice: *"Win the 8-second German recruiter scan."*

---

## Four type voices

The most identifying trait. Never mix the roles.

- **Display serif** (`--font-serif`, system Iowan Old Style / Palatino stack — no web-font load) —
  *marketing display voice.* Display headlines only: `hero-display` (72px) → `heading-2` (36px),
  plus the serif name on a document. Carries the editorial calm.
- **Reading serif** (`--font-serif-text`, Source Serif 4) — *the document voice.* The generated
  Lebenslauf and Anschreiben body, at 16px / 1.65. This is what makes the output read like print.
  Used **only** for generated document content — never UI.
- **Inter** (`--font-sans`) — *UI voice.* Everything functional: `heading-3` (28px) and smaller,
  subtitles, body, navigation, buttons, captions, form labels.
- **Geist Mono** (`--font-mono`) — *code voice.* Code, type/property signatures, and the uppercase
  micro-label (the eyebrow).

No italics anywhere — emphasis comes from weight (500/600), color, or the voice switch itself.

---

## CONTENT FUNDAMENTALS

How ScanReady writes.

- **Voice:** confident, plain, applicant-respectful. Short declarative sentences. Leads with the
  benefit, not the mechanism. Precise, never breathless.
- **Two languages, two registers:** **product UI and marketing are in English**; **generated
  document content is in German** (formal — "Sehr geehrte Damen und Herren", "Mit freundlichen
  Grüßen", "heute" not "Present"). Never machine-translate the German into stiff phrasing.
- **Person:** **"you"** addresses the applicant; **"we"** for the product team's choices, sparingly.
- **Casing:** **Sentence case** for all headlines, buttons, and nav ("Convert your CV", not
  "Convert Your CV"). The *only* uppercase is the **eyebrow** — a mono, taupe, 0.18em-tracked
  micro-label ("FOR INTERNATIONALS APPLYING IN GERMANY", "PRICING", a step label).
- **CTAs:** verb-first and concrete — "Convert to Lebenslauf", "Download PDF", "Regenerieren",
  "Start over". Avoid "Submit", "Click here".
- **Eyebrows:** 1–4 words, categorical, set the frame: `PRICING`, `STEP 1 · SOURCE`, `PRIVACY`.
- **Norm-notes:** the annotation that explains a normalization the system made ("Date reformatted
  to DIN standard; 'Present' → 'heute'"). Calm, factual, one change per note.
- **Numbers & units:** concrete ("Scans in seconds", "€0 to start", "DIN 5008"). German numerals
  use the de-DE format (thousands dot, "2.000"). No vague superlatives.
- **Emoji:** **none.** Meaning is carried by type, color, and thin-line icons.
- **Tone examples:**
  - Hero: *"Win the 8-second German recruiter scan."*
  - Sub: *"Paste your CV. ScanReady rewrites it into the German Lebenslauf and Anschreiben a recruiter expects."*
  - Signature: *"Zero-retention, by design."*
  - Empty state: *"Nothing here yet. Paste your CV to get started."*

---

## VISUAL FOUNDATIONS

- **Color vibe:** navy ink on warm paper, with one disciplined green. Never pure black, never pure
  white. The canvas (`--canvas` `#fbfaf7`) and paper surface (`--surface` `#f0eee9`) are warm
  off-whites; text is deep navy (`--ink` `#1b2430`) softening through a **warm** grey ramp
  (charcoal → slate → steel/body → stone → muted).
- **Accent discipline:** exactly one accent — **deep green** (`--accent` `#0a7d63`, press
  `--accent-deep`, fills `--accent-soft` / `--accent-tint`). Reserved for the emphasis CTA, input
  focus ring, active dots, the skill chip, the success badge, the document check, and the signature
  band's lock dot. One green moment carries weight; if green lands on a generic surface it hasn't
  earned the role. Secondary functional colors only, used sparingly: tag-blue, warn-amber,
  error-terracotta.
- **Type:** four voices (see above). Tight serif leading (1.05) and negative tracking easing from
  -1.5px at 72px to 0 by `heading-2`. UI body at 16px / 1.55; **document** body at 16px / 1.65.
- **Backgrounds:** flat warm paper. The one dark surface is the **navy signature band**
  (`--band-from`→`--band-to`). No repeating patterns, no noise/grain, no decorative blobs, no
  atmospheric gradient hero — depth comes from the band and the one shadowed document mockup.
- **Borders:** warm 1px **hairlines** (`--hairline`, translucent navy) do nearly all the
  separating — they tint the warm surface rather than sit grey on top. `--hairline-soft` for the
  quietest dividers; `--hairline-dark` on the band.
- **Elevation / shadow:** flat by default. Shadow is spent in two places — the **document mockup**
  (`--shadow-mockup`, the single hero element) and the **featured pricing tier**
  (`--shadow-brand-glow`, a faint green glow). Content cards never get a shadow.
- **Cards:** `--canvas` fill, `--radius-lg` (12px), `--space-xl` (24px) padding, 1px hairline,
  no shadow. `base` for UI; `feature` uses the paper `--surface` and drops the border; **`document`**
  switches the body to the reading serif (a card that holds generated document text).
- **Corner radii:** **6px** on *every* button (`--radius-button`) and input — the editorial
  square-ish corner. **12px** (`--radius-lg`) on *every* rectangular card, the band, and the
  mockup. Full-pill (`--radius-full`) only for chips, badges, pill tabs, and status dots.
- **Press / active states:** color **plus** a restrained `scale(0.97)` press — no hover glow, no
  bounce. Primary → `--charcoal` on press; accent → `--accent-deep`; secondary/ghost tint toward
  `--surface`. Active nav/tab gets an ink underline or a navy fill.
- **Inputs:** warm canvas, hairline, 6px corner. The **2px deep-green focus ring is the activation
  signal.** The Anschreiben / job-posting field is a `multiline` + `serif` input with an optional
  de-DE character counter ("128 / 2.000").
- **Transparency & blur:** minimal — translucency lives in the hairlines and the sticky nav. No
  frosted-glass panels as a default motif.
- **Animation:** restrained. 150–200ms ease (`--ease-standard`) for focus, press, and tab changes.
  Fades over slides; no bounces, no infinite decorative loops.
- **Layout:** marketing breathes (`--space-hero` 120px above the fold), 1280px max width, 32px
  gutters, text+mockup splits. The converter is a strict **two-pane** grid: source on the left,
  generated document on the right, a hairline between.

---

## ICONOGRAPHY

The source spec does **not** ship an icon set. ScanReady's surface is a developer-adjacent product
whose idiom is a **thin, single-weight line icon set**, so we standardize on
**[Lucide](https://lucide.dev)** (1.5–2px stroke, rounded joins, no fill) — *a substitution,
flagged for review.* See Caveats.

- **System:** Lucide, loaded from CDN (`https://unpkg.com/lucide@latest`) or inline SVG copied from
  `assets/icons/`. Stroke `1.75`, `currentColor`, sized 16/20/24px to match the type scale. Tinted
  `--steel` at rest, `--ink` when active, `--accent` only for the check / success role.
- **No emoji, ever.** No Unicode dingbats. Single-weight monoline only — icons read as part of the
  type system, not stickers.
- **Logo:** ScanReady has no supplied logo mark. `assets/logo/` carries a type-built wordmark
  lockup (Inter semibold + a **green** scan-line motif) as a stand-in — flagged for replacement.

---

## Index — what's in this folder

**Foundations**
- `styles.css` — root entry; `@import`s every token + font file (link this one file).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `fonts.css`.
- `guidelines/` — foundation specimen cards (Colors, Type incl. reading serif, Spacing, Brand).

**Components** (`components/`, namespace `ScanReadyDesignSystem_81c867`)
- `core/` — `Button`, `IconButton`, `Eyebrow`, `Badge`, `Tag` (incl. the `skill` chip)
- `forms/` — `Input` (text, `multiline`, `serif` document field, char counter)
- `surfaces/` — `Card` (base / feature / document), `NormNote`, `SignatureBand`,
  `DocumentMockup`, `PricingCard`
- `navigation/` — `Tabs`, `SidebarNav`

**Templates** (`templates/`)
- `marketing/` — the ScanReady landing (hero + document mockup, three-step features, signature
  band, pricing, footer)
- `converter/` — the core two-pane screen (paste source CV + job posting → generated DIN
  Lebenslauf / Anschreiben with norm-notes)

---

## Do / Don't (quick reference)

**Do** — display serif for marketing tiers, reading serif for the generated document, Inter for UI,
mono for the eyebrow; keep green to one accent moment; full-pill only chips/badges; 6px buttons,
12px cards; flat surfaces with warm hairlines; document body at 16px / 1.65; annotate every
normalization with a norm-note; keep German document copy in formal German.

**Don't** — set a display headline in Inter, document body in a sans, or an eyebrow in a non-mono
face; add accents beyond green / tag-blue / warn / error; use `#000` or `#fff`; pill a button or
square a chip; drop shadows on flat cards; reintroduce the atmospheric gradient hero; use emoji.

---

## Caveats

- **Fonts substituted.** No font binaries were supplied. **Inter**, **Source Serif 4**, and **Geist
  Mono** load from Google Fonts; the display serif is a system Iowan/Palatino stack. Replace with
  licensed binaries if you have them.
- **Icons substituted.** No icon set in the source — **Lucide** stands in. Swap if ScanReady has
  its own set.
- **Logo is a stand-in.** No brand mark supplied; the wordmark is type-built (green scan-line).
  Replace with the real asset.
- **No dark mode** beyond the navy signature band and the band gradient. Derive a dark canvas from
  `--canvas-dark` when needed.
