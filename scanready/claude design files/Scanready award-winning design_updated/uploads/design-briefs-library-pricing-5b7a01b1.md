# Design-session shopping list: Library + Pricing (2026-07-06)

What to design in the claude.ai/design session, in implementation order. Source of truth for scope: [prd-account-library-pricing.md](prd-account-library-pricing.md). Everything must stay inside the settled "Warm Editorial Broadsheet" system + "Typesetting Theater" layer (use the ScanReady design-system bundle already loaded in the session; deep-green `#0a7d63` as the only accent, navy ink, 6px editorial buttons, Source Serif for document surfaces, Geist Mono taupe labels).

**Export format:** same as "ScanReady Elevated": one `.dc.html` page per numbered item (or combined where marked), assets as SVG. Copy in EN and DE where user-facing (i18n toggle exists). Hard rules: no em-dash character anywhere, no photos/thumbnails in cards (never persisted), reduced-motion-safe, WCAG-AA contrast, no fake urgency or countdowns.

---

## P0: needed for PRD Phase A implementation

### 1. Bewerbungen library (the gallery) on /konto
- Card = typographic mini doc-sheet (Typesetting Theater print-sheet look): serif title, company/role line, saved date, small badges LL / AS / Stellenanzeige. NO thumbnails, NO photos.
- Editable title inline (pencil-on-hover a la Resume.io), kebab menu with: Öffnen, Neue Bewerbung aus dieser, Umbenennen, Löschen.
- Desktop: card grid. Mobile: single-column card stack (same component reflowed, no table).
- States to cover: normal, read-only (locked look + one-line explanation + what unlocks it), 1-of-1 free slot used, hover/focus.
- Storage-transparency footer on the section: what a saved package contains + delete-all link.
- Empty state (first-run): status line "Noch keine gespeicherten Bewerbungen", one line on what saving unlocks (reuse, duplicate), one CTA into the flow. No decorative-only illustration.

### 2. Storage-gate chooser (the upsell moment)
Appears when the 2nd save on a free account is blocked. Replaces today's plain text hint.
- Two offers side by side: Bewerbungsphase-Pass 14,99 € (primary) and ScanReady Plus 5,99 €/mo (secondary, may be shown as "geplant" until it ships).
- Anchor line variant when the user already bought 2+ Pakete: "Zwei Pakete gekauft = 9,98 EUR. Der Pass kostet 14,99 EUR und deckt Ihre ganze Bewerbungsphase."
- Honest-framing microcopy: Pass = "Läuft automatisch aus. Keine Kündigung nötig." / Plus = "Monatlich kündbar, Kündigungsbutton inklusive, Erinnerung vor jeder Verlängerung."
- Must also work as a calm inline panel (not a blocking modal), dismissible, no timers.

### 3. Bewerbungsphase-Pass purchase + lifecycle states
- Purchase modal mirroring PaketModal (Stripe Payment Element area, price, Widerruf checkbox zone, legal footnote).
- Post-purchase state: "Pass aktiv bis TT.MM.JJJJ" chip in the tool top bar and on /konto.
- Expired state: gallery keeps read access; card explains newest-stays-editable; re-purchase CTA.

### 4. /preise v2 (ladder page)
- Four-step ladder: Humanizer+ 2,99 / Bewerbungspaket 4,99 / Pass 14,99 (30 Tage, endet automatisch) / Plus 5,99 monthly (geplant badge until live).
- New manifesto line for the free tier: "Kostenlos heißt vollständig. Wir begrenzen, wie viel wir für Sie speichern, nie wie gut Ihr Dokument ist."
- Keep the anti-Abofalle comparison block; add the non-renewal of the Pass as a feature callout.

### 5. Save moment refinement
- Title-as-editable-suggestion at save time: small field prefilled from the job posting, confirm/save inline, on both result views.
- Saved confirmation + link to library.

## P0.5: award-push assets (Typesetting Theater Phase 3, still open)
### 6. Founder asset set
- Wordmark: the lockup SVG from the "ScanReady Elevated" export is a strong start; finalize horizontal + square variants.
- OG/social image 1200x630 in the broadsheet style.
- 404 page as a "misprint" (typesetting joke, reduced-motion-safe).
- Favicon refresh to match the lockup.

## P1: design after Phase A ships
### 7. Meine Lebensläufe tab (CV entity reuse)
- CV cards (same doc-sheet language), "attach to existing CV" selector step in the save flow.
### 8. Status dropdown chip on package cards
- Entwurf / Beworben / Interview / Absage / Zusage as a quiet mono-label chip, no board view.
### 9. Plus subscription surfaces
- /konto subscription card (state: active, cancelled-but-running, expired), renewal-reminder email template (text-first, broadsheet header).

---

**Come-back-here protocol:** export each item as zip (like "Scanready award-winning design.zip") into `scanready/claude design files/`, then this session reconciles it into `src/` against ui.tsx primitives + globals.css tokens (same as the DesignSync reconciliation flow already done once).
