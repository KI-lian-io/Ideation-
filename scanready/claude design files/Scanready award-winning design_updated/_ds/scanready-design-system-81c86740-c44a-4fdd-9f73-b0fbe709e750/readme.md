# ScanReady Design System

**Warm Editorial Broadsheet** — a warm, print-grade take on a product that converts a foreign CV
into the German Lebenslauf a recruiter expects. The visual language blends **WIRED's editorial
authority**, **Starbucks' cream-and-green discipline**, and ScanReady's **navy ink and serif** —
now with one signature motion: **the green scan light** that reads, converts, and typesets the
applicant's document before their eyes.

> **One rule governs everything:** the generated document is the hero. Every choice — the reading
> serif, the warm paper, the single green accent, the layered sheet shadow, the scan-sweep — exists
> to make the applicant's Lebenslauf look like a document a German recruiter respects in the
> 8 seconds they spend on it.

---

## What ScanReady is

ScanReady rewrites an applicant's existing CV into a **German Lebenslauf** and a matching
**Anschreiben**, normalized to local norms — DIN dates, the expected section order, a formal tone —
with **every change annotated** by a numbered norm-note. The audience is internationals applying
in Germany. Processing is **zero-retention**: nothing is stored, processing is stateless.

The product promise, in voice: *"Win the 8-second German recruiter scan."*

---

## Four type voices

The most identifying trait. Never mix the roles.

- **Display serif** (`--font-serif`, system Iowan Old Style / Palatino stack — no web-font load) —
  *marketing display voice.* Display headlines only: `hero-display` (72px) → `heading-2` (36px),
  the serif name on a document, the oversized stat numeral, and the folio ghost numeral.
- **Reading serif** (`--font-serif-text`, Source Serif 4) — *the document voice.* The generated
  Lebenslauf and Anschreiben body, at 16px / 1.65, and the editorial pull quote. This is what makes
  the output read like print. Used **only** for generated document content and quoted evidence —
  never UI.
- **Inter** (`--font-sans`) — *UI voice.* Everything functional: `heading-3` (28px) and smaller,
  subtitles, body, navigation, buttons, captions, form labels.
- **Geist Mono** (`--font-mono`) — *code voice.* Code, type/property signatures, the uppercase
  micro-label (the eyebrow) — and its Turn-2 descendants: the masthead tagline, the norm ticker,
  folio indices, stepper labels, annotation kickers, DIN dates on the sheet, and footer folios
  ("ScanReady · Seite 1").

No italics anywhere — emphasis comes from weight (500/600), color, or the voice switch itself.

---

## CONTENT FUNDAMENTALS

How ScanReady writes.

- **Voice:** confident, plain, applicant-respectful. Short declarative sentences. Leads with the
  benefit, not the mechanism. Precise, never breathless. Honest to a fault: "No testimonials yet —
  the tool is new. Judge the output yourself."
- **Two languages, two registers:** **product UI and marketing are in English**; **generated
  document content is in German** (formal — "Sehr geehrte Damen und Herren", "Mit freundlichen
  Grüßen", "heute" not "Present"). German norm vocabulary is used untranslated in English UI
  (Lebenslauf, Anschreiben, Gehaltsvorstellung) — that's the product teaching the norms.
- **Person:** **"you"** addresses the applicant; **"we"** for the product team's choices, sparingly.
- **Casing:** **Sentence case** for all headlines, buttons, and nav. The *only* uppercase is the
  mono micro-label family: eyebrow, masthead tagline, ticker, stepper, annotation kickers.
- **CTAs:** verb-first and concrete — "Convert your CV — it's free", "Write the Anschreiben",
  "Start now — it takes 5 minutes". A reassurance line in mono sits under the final CTA:
  "No account · No storage · 5 minutes".
- **Eyebrows:** 1–4 words, categorical: `PRICING`, `STEP 1 · SOURCE`, `PRIVACY`. Section eyebrows
  carry a dimmed folio index: `01 PATHWAYS`, `02 HOW IT WORKS`.
- **Norm-notes:** calm, factual, one change per note, in before→after shape where possible
  ("'Mar 2021 – Present' reformatted to '03/2021 – heute' — MM/JJJJ numerals, German 'heute'.").
  Each note is numbered and pinned to its spot on the document.
- **Ticker pairs:** the norm ticker speaks in mono conversions — `Mar 2021 – Present → 03/2021 –
  heute`, `Fluent → Verhandlungssicher` — separated by middots. Plain facts allowed (`DIN 5008`).
- **Conditional questions** get a pill explaining themselves: "Added — the posting asks".
- **Placeholders in generated documents** are honest bracketed tokens — `[Straße Hausnummer]`,
  `[PLZ] [Ort]` — never invented data. They render on an accent-tint highlight.
- **Numbers & units:** concrete ("61%", "8 sec", "DIN 5008"). German numerals use the de-DE format
  (thousands dot, "2.000"; char counters read "8.412 / 30.000"). No vague superlatives.
- **Emoji:** **none.** Meaning is carried by type, color, and thin-line icons.
- **Tone examples:**
  - Hero: *"Win the German recruiter's first scan."*
  - Sub: *"Your CV, re-typeset into the German Lebenslauf and an Anschreiben that sounds like you."*
  - Signature: *"Zero-retention, by design."*
  - Working: *"Reformatting dates to DIN 5008 — 'Present' becomes 'heute'…"*
  - Empty state: *"Nothing here yet. Paste your CV to get started."*

---

## VISUAL FOUNDATIONS

- **Color vibe:** navy ink on warm paper, with one disciplined green. Never pure black, never pure
  white. The canvas (`--canvas` `#fbfaf7`) and paper surface (`--surface` `#f0eee9`) are warm
  off-whites; text is deep navy (`--ink` `#1b2430`) softening through a **warm** grey ramp
  (charcoal → slate → steel/body → stone → muted).
- **Accent discipline:** exactly one accent — **deep green** (`--accent` `#0a7d63`, press
  `--accent-deep`, fills `--accent-soft` / `--accent-tint`). Reserved for the emphasis CTA, input
  focus ring, active dots, annotation pins, the DIN date chip, ticker arrows, the stat numeral,
  the scan-sweep, and the signature band's lock dot. Red-terracotta (`--brand-error`) additionally
  marks the *foreign format* in before→after theater (US date, "US format" tag) — error-as-diagnosis,
  used only on the "before" side.
- **Type:** four voices (see above). Tight serif leading (1.05) and negative tracking easing from
  -1.5px at 72px to 0 by `heading-2`. UI body at 16px / 1.55; **document** body at 16px / 1.65.
- **Banded rhythm (the scroll fix):** marketing pages are built from full-width bands that
  alternate `--canvas` → `--surface`, punctuated by exactly **one navy signature band**
  (`--band-from`→`--band-to`) mid-page and at most one `--accent-tint` stat band. Each band opens
  with a folio SectionHeader (`01`…`05`); the section number may repeat as a **ghost numeral** —
  display serif, ~280px, `--ink-ghost` — absolutely positioned in the band's corner. The footer
  closes the loop in navy with a folio ("ScanReady · Seite 1").
- **Masthead:** the marketing header is a broadsheet masthead — 2px ink bottom rule with an offset
  hairline (double rule), lockup left, centered mono tagline ("Bewerbung · Deutschland ·
  Erstausgabe 2026"), nav + accent CTA right. The converter app bar is quieter: single hairline,
  Stepper centered, EN/DE toggle + zero-retention lock right.
- **Backgrounds:** flat warm paper. No repeating patterns, no noise/grain, no decorative blobs, no
  atmospheric gradient hero — depth comes from the bands, the sheet shadows, and the scan light.
- **Borders:** warm 1px **hairlines** (`--hairline`, translucent navy) do nearly all the
  separating. `--hairline-soft` for the quietest dividers; `--hairline-dark` on the band. Numbered
  step columns separate with left hairlines, not boxes.
- **Elevation / shadow:** flat by default. The tiers: content cards **none**; the **document
  sheet** gets `--shadow-sheet` (`--shadow-sheet-hero` above the fold) — layered like paper on a
  desk; the marketing **mockup** keeps `--shadow-mockup`; the featured pricing tier keeps
  `--shadow-brand-glow`; modals (Humanizer+) get `--shadow-modal` over a `rgba(27,36,48,0.45)` scrim.
- **The annotation system:** normalizations are marked on the sheet with numbered
  **AnnotationPins** and explained in a 340px margin rail of pinned **NormNotes** (mono kicker +
  body). In marketing, margin notes connect to the sheet with 48px accent leader lines at 40%
  opacity. The document is never interrupted by UI — explanation lives in the margin, like an
  editor's markup.
- **Cards:** `--canvas` fill, `--radius-lg` (12px), `--space-xl` (24px) padding, 1px hairline,
  no shadow. `base` for UI; `feature` uses the paper `--surface` and drops the border; **`document`**
  switches the body to the reading serif. Grounding-rail cards (the user's own answers, quoted)
  are base cards with a mono kicker.
- **Corner radii:** **6px** on *every* button (`--radius-button`) and input. **12px**
  (`--radius-lg`) on *every* rectangular card, the band, the mockup, and document sheets.
  Full-pill (`--radius-full`) only for chips, badges, pills, pins, and status dots.
- **Press / active states:** color **plus** a restrained `scale(0.97)` press — no hover glow, no
  bounce. Primary → `--charcoal` on press; accent → `--accent-deep`; secondary/ghost tint toward
  `--surface`. Active nav/tab gets an ink underline or a navy fill.
- **Inputs:** warm canvas, hairline, 6px corner. The **2px deep-green focus ring is the activation
  signal.** The Anschreiben / job-posting field is a `multiline` + `serif` input with an optional
  de-DE character counter ("128 / 2.000").
- **Editorial furniture:** one **PullQuote** per page max (reading serif 34px, green opening
  quote, 64px hairline rules); **StatBlocks** in rows of three on the tint band (96px accent
  numerals); the founder's note gets a **drop cap** (display serif, ~60px, floated) or renders as
  a dated letter on a document sheet.
- **Highlight, not badge:** inside generated documents, emphasis is an `--accent-tint` wash behind
  the text (DIN date chip, placeholder tokens) — never a floating badge on the prose.
- **Transparency & blur:** minimal — translucency lives in the hairlines and the sticky nav. No
  frosted-glass panels.
- **Layout:** marketing breathes (`--space-hero` 120px above the fold), 1200–1280px max width,
  32px gutters. The converter is **document + margin**: the sheet at readable width, a sticky
  340px annotation/action rail beside it, hairline-separated. Mobile (390px) stacks the rail
  below the sheet and compacts the Stepper to numbers.

---

## MOTION — the scan is the brand

Motion is spent on one idea: **a green light reads your document and typesets it for Germany.**
Micro-interactions stay at 150–200ms `--ease-standard` fades; the signature set below uses
`--ease-scan` (`cubic-bezier(0.23, 1, 0.32, 1)`) and lives in `tokens/motion.css`. These are the
**only** infinite loops in the system; anything else that loops is off-brand.

- **Scan-sweep** (`ScanSweep`, `sr-scan`) — the green gradient band with a 2px leading rule
  sweeping down a sheet. Soft + `--dur-scan` (4.5s) at rest/hero; strong + `--dur-scan-parse`
  (2.2s) while parsing; `--dur-scan-stream` (3.4s) while the Anschreiben streams.
- **The convert cycle** (11s, `--dur-convert`) — the hero theater: an EN résumé (sans, terracotta
  dates, "US format" tag) holds ~3s → the sweep passes (`sr-scan-cycle`) → the German sheet
  typesets in behind it (`sr-en-out` / `sr-de-in`) → the DIN date pops (`sr-date-pop`) → margin
  notes stagger in (`sr-note-in`, 0.25s steps) → loop. One per page, in the hero.
- **Norm ticker** (`NormTicker`, `sr-marquee`) — 36s linear marquee (30s mobile), one per page,
  directly under the hero.
- **Streaming caret** (`sr-caret`) — a 9×19px accent block caret with a hard 1s step blink at the
  live edge of generating text.
- **Status pulse** (`sr-pulse`) — 1.4s opacity pulse on the 7px accent dot next to working copy
  ("Setzt… Absatz 2 von 4").
- **Accessibility:** the set is decorative and never the only signal — always pair with text
  status. `tokens/motion.css` freezes all of it under `prefers-reduced-motion`.

---

## ICONOGRAPHY

The source spec does **not** ship an icon set. ScanReady's surface is a developer-adjacent product
whose idiom is a **thin, single-weight line icon set**, so we standardize on
**[Lucide](https://lucide.dev)** (1.5–2px stroke, rounded joins, no fill) — *a substitution,
flagged for review.*

- **System:** Lucide, loaded from CDN (`https://unpkg.com/lucide@latest`) or inline SVG copied from
  `assets/icons/`. Stroke `1.75`, `currentColor`, sized 16/20/24px to match the type scale. Tinted
  `--steel` at rest, `--ink` when active, `--accent` only for the check / success role. The
  zero-retention **lock** glyph (12–14px, accent) recurs beside privacy copy — the one icon with a
  reserved meaning.
- **No emoji, ever.** No Unicode dingbats. Single-weight monoline only.
- **Logo:** ScanReady has no supplied logo mark. `assets/logo/` carries a type-built wordmark
  lockup (Inter semibold + a **green** scan-line motif) as a stand-in — flagged for replacement.

---

## Index — what's in this folder

**Foundations**
- `styles.css` — root entry; `@import`s every token + font file (link this one file).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`
  (incl. sheet/modal tiers), **`motion.css`** (signature keyframes + durations + reduced-motion).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand, **Motion**, **Layout**).

**Components** (`components/`, namespace `ScanReadyDesignSystem_81c867`)
- `core/` — `Button`, `IconButton`, `Eyebrow`, `Badge`, `Tag` (incl. the `skill` chip)
- `forms/` — `Input` (text, `multiline`, `serif` document field, char counter)
- `surfaces/` — `Card` (base / feature / document), `NormNote` (inline chip + pinned margin card),
  `AnnotationPin`, `SignatureBand`, `DocumentMockup`, `PricingCard`
- `motion/` — `ScanSweep`, `NormTicker`
- `editorial/` — `SectionHeader`, `PullQuote`, `StatBlock`
- `flow/` — `Stepper` (converter progress, compact mobile variant)
- `navigation/` — `Tabs`, `SidebarNav`

**Templates** (`templates/`)
- `marketing/` — the ScanReady landing (masthead, convert-cycle hero, norm ticker, banded
  folio sections, signature band, founder's note, footer)
- `converter/` — the core screen (document sheet + margin annotation rail, Stepper app bar)

---

## Do / Don't (quick reference)

**Do** — display serif for marketing tiers, reading serif for the generated document, Inter for UI,
mono for the micro-label family; keep green to disciplined accent moments (terracotta only on the
"before" side of conversions); alternate canvas/surface bands with ONE navy band; open bands with
folio SectionHeaders; shadow document sheets with `--shadow-sheet`; annotate every normalization
with a numbered pin + norm-note; spend motion only on the scan set; keep German document copy in
formal German; pair every animation with a text status.

**Don't** — set a display headline in Inter, document body in a sans, or an eyebrow in a non-mono
face; add accents beyond green / tag-blue / warn / error; use `#000` or `#fff`; pill a button or
square a chip; drop shadows on flat content cards; reintroduce the atmospheric gradient hero;
invent loops beyond scan / ticker / caret / pulse; put badges on document prose (use the tint
highlight); use emoji.

---

## Caveats

- **Fonts substituted.** No font binaries were supplied. **Inter**, **Source Serif 4**, and **Geist
  Mono** load from Google Fonts; the display serif is a system Iowan/Palatino stack. Replace with
  licensed binaries if you have them.
- **Icons substituted.** No icon set in the source — **Lucide** stands in.
- **Logo is a stand-in.** No brand mark supplied; the wordmark is type-built (green scan-line).
- **No dark mode** beyond the navy signature band and the band gradient.
- **Motion set added 2026-07** from the product's Turn-2 elevation (see the consuming project's
  `ScanReady Elevated.dc.html`): scan-sweep, convert cycle, ticker, caret, pulse, banded rhythm,
  annotation pins, editorial furniture. Templates predate it — refresh them from that file next.
