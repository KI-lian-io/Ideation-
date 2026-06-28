---
version: alpha
name: ScanReady — Warm Editorial Broadsheet
description: A trust-forward design system for ScanReady (turns an expat's foreign CV into a norm-correct German Lebenslauf + authentic Anschreiben). Anchored on WIRED's editorial-broadsheet authority — print seriousness that makes a German recruiter take the output seriously in an 8-second scan — warmed by Starbucks' cream-canvas-and-green discipline and ScanReady's own navy/serif/taupe identity. Four type voices: a system serif for display headlines, a reading serif for the generated document output (the Lebenslauf/Anschreiben render like real print), Inter for UI prose, Geist Mono for taupe micro-labels. One restrained green accent, used in four calibrated tiers. Crisp editorial geometry (6px buttons, not full pills), flat surfaces with warm hairlines, one dark-navy feature band for rhythm.

colors:
  primary: "#1b2430"
  on-primary: "#ffffff"
  ink: "#1b2430"
  ink-soft: "#2a3340"
  body: "#6f6960"
  muted: "#8a857c"
  eyebrow: "#9a8b72"
  canvas: "#f0eee9"
  card: "#fbfaf7"
  band-dark: "#1b2430"
  on-dark: "#ffffff"
  on-dark-soft: "rgba(255,255,255,0.72)"
  hairline: "rgba(27,36,48,0.12)"
  hairline-soft: "rgba(27,36,48,0.08)"
  accent-600: "#0a7d63"
  accent-500: "#0c9379"
  accent-100: "#cfe9e0"
  accent-50: "#eef7f3"
  error: "#c0503c"
  warn: "#b9791a"

typography:
  display-hero:
    fontFamily: serif
    fontSize: 60px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -1px
  display-lg:
    fontFamily: serif
    fontSize: 44px
    fontWeight: 500
    lineHeight: 1.10
    letterSpacing: -0.5px
  display-md:
    fontFamily: serif
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
  heading-3:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.30
  heading-4:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.40
  doc-lg:
    fontFamily: serif-text
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.60
  doc-md:
    fontFamily: serif-text
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
  subtitle:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
  eyebrow:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: 0.18em
    textTransform: uppercase
  button-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.30
  code-md:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55

fonts:
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, Charter, Georgia, serif"
  serif-text: "'Source Serif 4', 'Iowan Old Style', Georgia, 'Times New Roman', serif"
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
  mono: "'Geist Mono', 'SF Mono', ui-monospace, Menlo, Consolas, monospace"

rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section-sm: 48px
  section: 64px
  section-lg: 96px
  hero: 120px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-primary-pressed:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.on-primary}"
  button-accent:
    backgroundColor: "{colors.accent-600}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-accent-pressed:
    backgroundColor: "{colors.accent-500}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-on-dark:
    backgroundColor: "{colors.on-dark}"
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  eyebrow-label:
    backgroundColor: "transparent"
    textColor: "{colors.eyebrow}"
    typography: "{typography.eyebrow}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.hairline}"
  card-document:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.doc-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    border: "1px solid {colors.hairline}"
  inset:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"
  text-input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.hairline}"
  text-input-focused:
    border: "2px solid {colors.accent-500}"
  skill-chip:
    backgroundColor: "{colors.accent-100}"
    textColor: "{colors.accent-600}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xxs} {spacing.sm}"
  norm-note:
    backgroundColor: "{colors.accent-50}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline-soft}"
  hairline-divider:
    borderColor: "{colors.hairline}"
  feature-band-dark:
    backgroundColor: "{colors.band-dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.none}"
    padding: "{spacing.section} {spacing.xl}"
  footer:
    backgroundColor: "{colors.band-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "{spacing.section} {spacing.xl}"
  hero-mockup:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
    shadow: "rgba(27,36,48,0.10) 0px 1px 1px, rgba(27,36,48,0.08) 0px 12px 32px -8px"
---

## Overview

ScanReady produces documents a German recruiter must take seriously in eight seconds. So the system borrows its backbone from **WIRED** — a print-broadsheet that refuses to dress as a SaaS site: editorial serif headlines, hairline rules, square-ish geometry, no decorative chrome, one restrained accent. That seriousness is the credibility signal.

But WIRED is cold (pure black on white). ScanReady's users are stressed people, not readers of a tech magazine — so the canvas is warmed to **Starbucks' cream discipline** (a warm paper, never clinical white; text never pure black), the ink is **ScanReady navy** rather than black, and the lone accent is a **deep, credible green** used in four calibrated tiers (Starbucks' four-green idea collapsed onto one hue).

The signature move: the **generated document renders in a reading serif**. The user's Lebenslauf and Anschreiben don't look like form output — they look like print. UI chrome (forms, nav, buttons, labels) stays in Inter; only the *document the user is producing* gets the serif body. That single decision is the whole thesis — "your application looks like it belongs on paper."

**Key Characteristics:**
- WIRED editorial backbone: serif display, hairline rules, flat surfaces, no gradients, one accent
- Warm paper canvas (`{colors.canvas}`), never white; navy ink (`{colors.ink}`), never pure black
- Four type voices: display serif (headlines) · reading serif (the document output) · Inter (UI) · Geist Mono taupe (labels)
- One green accent in four tiers: `accent-600` CTA / `accent-500` hover / `accent-100` chip fill / `accent-50` note tint
- Crisp editorial geometry: `{rounded.sm}` 6px buttons (off the full pill, toward WIRED square), `{rounded.lg}` 12px cards
- Flat + warm hairlines; one whisper shadow reserved for the hero mockup
- One dark-navy feature band + navy footer for color-block rhythm (Starbucks banding, ScanReady palette)
- `scale(0.97)` press feedback on every pressable

## Colors

### Brand & Accent
- **Navy Ink** (`{colors.primary}` / `{colors.ink}` `#1b2430`): Wordmark, headlines, primary CTA fill, dark bands, footer. The warm alternative to WIRED's pure black.
- **Accent 600** (`#0a7d63`): The single accent — primary green CTA, active indicators, focus ring, document-confirmation checkmarks. Deep enough to read credible on cream (per Starbucks green-on-cream), not the bright AI-mint.
- **Accent 500** (`#0c9379`): Hover/pressed variant.
- **Accent 100** (`#cfe9e0`): Skill-chip fill, light confirmation surfaces.
- **Accent 50** (`#eef7f3`): Norm-note tint, valid-field background.
- **Eyebrow Taupe** (`{colors.eyebrow}` `#9a8b72`): Reserved for the mono uppercase micro-label only. Never body, never a button.

### Surface
- **Canvas** (`{colors.canvas}` `#f0eee9`): Warm paper — the page. Load-bearing warmth; never white.
- **Card** (`{colors.card}` `#fbfaf7`): Near-white card and input surface, separated from canvas by a hairline.
- **Band Dark** (`{colors.band-dark}` `#1b2430`): Navy feature band + footer (the espresso bookend in Starbucks' rhythm, in ScanReady navy).
- **Hairline** / **Hairline Soft**: translucent navy rules — the only elevation cue on flat surfaces.

### Text
- **Ink** `#1b2430` — headlines, primary text, CTA labels.
- **Ink Soft** `#2a3340` — document body emphasis, note text.
- **Body** `#6f6960` — secondary UI text (warm grey).
- **Muted** `#8a857c` — captions, disabled.
- **On Dark** / **On Dark Soft** — text on the navy band/footer.

### Semantic
- **Error** `#c0503c` (warm red), **Warn** `#b9791a` — functional only; the accent green never doubles as success-noise.
- Inline links: ink with underline (keeps green = action). Green is reserved for interactive accent, per WIRED's "one link colour, used sparingly" discipline.

## Typography

### Voices (four roles — the identity)
- **Display serif** (`{fonts.serif}`, system Iowan/Palatino): hero + section headlines, weight 400–600. Elegant by typeface, not by heavy weight (WIRED principle).
- **Reading serif** (`{fonts.serif-text}`, Source Serif 4 / Georgia): the **generated document** — Lebenslauf preview and Anschreiben output. The "your application looks like print" surface. Optional web font; Georgia is an acceptable system fallback.
- **Inter** (`{fonts.sans}`): all UI prose — nav, forms, buttons, helper text, captions.
- **Geist Mono** (`{fonts.mono}`): the taupe uppercase eyebrow label and any code/monospace.

### Hierarchy

| Token | Family | Size | Weight | LH | Tracking | Use |
|---|---|---|---|---|---|---|
| `display-hero` | serif | 60 | 500 | 1.05 | -1px | Marketing hero |
| `display-lg` | serif | 44 | 500 | 1.10 | -0.5px | Section opener |
| `display-md` | serif | 32 | 600 | 1.15 | 0 | Tool page title |
| `heading-3` | Inter | 22 | 600 | 1.30 | 0 | Card titles |
| `heading-4` | Inter | 18 | 600 | 1.40 | 0 | Sub-headers |
| `doc-lg` | serif-text | 18 | 400 | 1.60 | 0 | Anschreiben lead lines |
| `doc-md` | serif-text | 16 | 400 | 1.65 | 0 | Document body (Lebenslauf/Anschreiben) |
| `subtitle` | Inter | 18 | 400 | 1.55 | 0 | Hero subtitle |
| `body-md` | Inter | 16 | 400 | 1.55 | 0 | UI body |
| `body-sm` | Inter | 14 | 400 | 1.50 | 0 | Secondary UI, form labels |
| `eyebrow` | Geist Mono | 12 | 500 | 1.40 | 0.18em | Uppercase micro-labels |
| `button-md` | Inter | 14 | 600 | 1.30 | 0 | Button labels |

### Principles
- Serif for the *document and the headlines*; Inter for *the interface*; mono for *labels*. The voice tells you what kind of thing you're reading.
- Document body at 1.6–1.65 line-height — print-grade reading comfort for the long-form output.
- Display weight stays ≤600; elegance comes from the serif, not bold (WIRED).
- The eyebrow is the one constant tell: mono, uppercase, 0.18em, taupe.

## Layout

Base 4px. Marketing bands `{spacing.section-lg}` (96); tool surfaces `{spacing.xxl}` (32); hairline dividers between steps and between the document and its annotations. Tool flow is a centered card (`max-width ~768px`) on the warm canvas; the Lebenslauf step uses a **two-column document + bilingual annotation** layout at desktop (print-proof feel, WIRED story-grid logic), collapsing to stacked on mobile.

## Elevation & Depth

Flat by default; warm hairlines carry hierarchy (WIRED). One reserved exception: the hero product mockup gets a whisper two-layer shadow (`hero-mockup`, Starbucks layered-low-alpha philosophy in navy). No gradients anywhere. Color-block banding (paper → card → one navy feature band → navy footer) provides perceived depth instead of shadow.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Feature band, footer, full-bleed surfaces |
| `{rounded.sm}` | 6px | **Buttons, inputs** — editorial-crisp, off the full pill |
| `{rounded.md}` | 8px | Inset boxes, note tints |
| `{rounded.lg}` | 12px | Cards, the tool panel, hero mockup |
| `{rounded.full}` | 9999px | Skill chips / tags and circular icons only |

Buttons sit at 6px — a deliberate move *toward* WIRED's square geometry and away from the previous full-pill, kept a hair soft for warmth. Pills survive only on chips and circular icons.

## Components

> Default and pressed/active states only (no-hover policy).

### Buttons
- **`button-primary`** — navy `{rounded.sm}` rectangle, the dominant CTA. Pressed → `ink-soft`; `active:scale(0.97)`.
- **`button-accent`** — green (`accent-600`) for the single brand-emphasis CTA (hero / nav "start"). Pressed → `accent-500`.
- **`button-secondary`** — transparent, hairline border, ink text.
- **`button-on-dark`** — white rectangle on the navy band.

### Surfaces
- **`card`** — `{colors.card}` on canvas, `{rounded.lg}`, hairline border. Title in `heading-3` (Inter).
- **`card-document`** — the same shell, but content set in `doc-md` reading serif: the Lebenslauf/Anschreiben render. This is the signature surface.
- **`inset`** / **`norm-note`** — `inset` is a paper-tinted nested box; `norm-note` is the `accent-50` tinted bilingual "what changed & why" note.

### Inputs
- **`text-input`** — `{rounded.sm}`, hairline border, focus → 2px `accent-500` (the activation signal).

### Labels & Accents
- **`eyebrow-label`** — mono uppercase taupe. The constant.
- **`skill-chip`** — `accent-100` fill, `accent-600` text, full pill — the one place pills remain.

### Signature
- **`feature-band-dark`** / **`footer`** — navy bands, white/soft-white text; the color-block bookend.
- **`hero-mockup`** — the one shadowed element, framing a document preview.
- **`hairline-divider`** — the only line; between steps, story rows, and document/annotation columns.

## Do's and Don'ts

### Do
- Set the *generated document* in the reading serif; keep the *interface* in Inter; keep *labels* in mono. Three jobs, three voices.
- Use warm paper canvas + navy ink. Never pure white, never pure black.
- Keep the green to its four tiers and to accent moments only.
- Buttons at `{rounded.sm}` 6px; cards at `{rounded.lg}` 12px; pills only on chips.
- Carry hierarchy with hairlines and one navy band — not shadows.

### Don't
- Don't set headlines in Inter, the document in sans, or the eyebrow in anything but mono.
- Don't reintroduce the bright AI-mint or any gradient.
- Don't use the accent green as a success/validation color — that's the warm-red/`error` and neutral system's job.
- Don't full-pill the buttons again — the 6px editorial corner is the WIRED lean.
- Don't drop a heavy shadow on flat cards.

## Provenance & Conflict Resolution

Anchored on **WIRED** (editorial authority), warmed by **Starbucks** (cream + tiered-green + press), carrying ScanReady's existing **navy / serif / taupe / Inter / Geist Mono**. Resolutions where sources disagreed:

| Dimension | WIRED | Starbucks | ScanReady (this system) |
|---|---|---|---|
| Canvas | white `#fff` | cream `#f2f0eb` | warm paper `#f0eee9` (lean Starbucks) |
| Ink | pure black | `rgba(0,0,0,.87)` | navy `#1b2430` (ScanReady) |
| Accent | none (link-blue only) | four-tier green | one green, four tiers (`#0a7d63` family) |
| Button corner | 0px square | 50px pill | **6px** (lean WIRED, softened) |
| Card corner | 0px | 12px | 12px (Starbucks) |
| Body type | serif (BreveText) | sans (SoDoSans) | **split**: reading-serif for the document, Inter for UI |
| Press | — | scale(0.95) | scale(0.97) |
| Elevation | hairline only | layered whisper | hairline default; one whisper shadow on hero |

## Design-Sync Notes

This file is the canonical spec. To push a component library to claude.ai/design via the `/design-sync` workflow, build preview HTML per component (button-primary, button-accent, card-document, eyebrow-label, skill-chip, feature-band-dark, text-input, hero-mockup) using these tokens, each carrying a `<!-- @dsCard group="…" -->` marker, then sync incrementally. Groups: Type · Color · Buttons · Surfaces · Inputs · Signature.

## Known Gaps
- No dark-mode palette beyond the navy band/footer; derive a dark canvas from `band-dark` when needed.
- `serif-text` (Source Serif 4) is an optional web font; Georgia is the system fallback if we hold the line on no-new-web-fonts.
- Transition timings: 150–200ms ease-out for focus/press (carry from current build).
- Two-column document+annotation layout is specified but not yet built — net-new work.
