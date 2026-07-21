# Implementation plan: Library + Pricing design reconciliation

**Date:** 2026-07-07
**Design source:** `scanready/claude design files/Scanready award-winning design_updated/` (9 numbered `.dc.html` surfaces + `assets/` + `ds-update/`)
**Specs it implements:** [prd-account-library-pricing.md](prd-account-library-pricing.md), [design-briefs-library-pricing.md](design-briefs-library-pricing.md)
**Analysis basis:** three read-only agent passes over the surfaces vs current code (2026-07-07).

This is the reconciliation map for a fresh implementation session. The `.dc.html` files are static mockups with exhaustive DE/EN copy decks and design-note annotations. The `ds-update/` folder is a drop-in for the SEPARATE `scanready-design-system` Claude project (see its `APPLY.md`), NOT React for this repo; for this app it is the reference spec for primitives to add to `src/components/ui.tsx`.

Surface to route/component map (what each `.dc.html` becomes):

| File | Becomes | Scope |
|---|---|---|
| 01-library | `/konto` `SavedPackagesSection` + `/app` `SavedApplications`, rebuilt as a card gallery | Phase A |
| 02-storage-gate | new `StorageGate` component; replaces the plain `state==='limit'` hint | Phase A |
| 03-pass | new `PassModal` (mirrors `PaketModal`) + active/expired lifecycle chips | Phase A |
| 04-preise | full rebuild of `src/app/preise/page.tsx` | Phase A |
| 05-save-moment | rebuild of `SaveApplicationButton` into a save card | Phase A |
| 06-founder-assets | `public/` asset swap + `layout.tsx` metadata + new `not-found.tsx` | Phase A (P0.5) |
| 07-lebenslaeufe | "Meine Lebensläufe" tab + CV-reuse (needs schema work) | **Phase B (P1)** |
| 08-status | per-package status dropdown chip (needs new column) | **Phase B (P1)** |
| 09-plus | `/konto` subscription card states + un-cancel + reminder email | **Phase B (P1)**, gated on Pass demand |

---

## Phase A0: Foundation (do first, unblocks everything)

**Tokens (globals.css):** add `--shadow-sheet`, `--shadow-sheet-hero`, `--shadow-modal` (from `ds-update/tokens/shadows.css`) as Tailwind v4 `@theme` utilities. Current app has no sheet-shadow tier; the doc-sheet card look depends on it.

**New primitives in `src/components/ui.tsx`** (none exist today; current exports: `btnClass`, `Btn`, `CARD`, `EYEBROW`, `SKILL_CHIP`, `NORM_NOTE`):
- `SheetCard` - doc-sheet card shell (sheet shadow, hairline, 12px radius). Used identically in 01 and 07.
- `KebabMenu` - icon trigger + floating menu, hairline before the destructive (red) item. No dropdown primitive exists anywhere yet. Needs focus trap + Escape + outside-click close (match the modal a11y already done for HumanizerModal).
- `InlineRenameField` - serif input, 2px accent focus ring, Enter saves / Esc cancels.
- `MonoBadge` + ghost/`fehlt` dashed variant (LL / AS / STELLENANZEIGE chips) and pill badges (`BEARBEITBAR` accent-tint, `NUR LESEN` slate + lock).
- `EmptyState` - dashed border, mono status line (doubles as aria-live), body, one CTA. No shared empty-state exists.
- `BottomSheet` - mobile replacement for the kebab (44px targets). Only needed for the mobile library view.
- `SavedConfirmationPanel` - accent-tint panel: checkmark + timestamp + editable title + "open in library" link.

**Founder assets (P0.5, independent, ship anytime):** copy the six SVGs from the export `assets/` into `public/`: `favicon.svg`, `og-scanready.svg` (replaces the off-brand `public/og-image.svg`), `scanready-lockup.svg` + `-dark.svg`, `scanready-mark.svg`, `scanready-stacked.svg`. Wire in `src/app/layout.tsx`: add `icons` to `metadata` and an explicit `openGraph.images` array (currently none). Build new `src/app/not-found.tsx` from 06's "misprint correction notice" spec (full DE/EN copy in-file, reduced-motion-safe, no animation). Regenerate `favicon.ico`. All flagged in the design as stand-in marks pending a final brand pick (see naming-shortlist.md).

## Phase A1: Pass data + API layer (unblocks 02/03)

New migration `supabase/migrations/0002_pass.sql`:
- `humanizer_purchases`: add `expires_at timestamptz` (nullable); Pass rows use `kind='pass_30d'` and REQUIRE `user_id` (anonymous humanizer/paket rows keep `user_id` null). No RLS change (select-own already covers it).
- `enforce_package_limit()`: add a third tier. Today it is two-tier (active subscription = unlimited, else limit 1). New order: active subscription = unlimited; else active pass (a `pass_30d` row with `expires_at > now()`) = limit 25; else limit 1. Keep the advisory-lock race guard. This is the ONLY place the limit is enforced (DB trigger), so the tier logic goes here, not in app code.
- Pass expiry reuses the existing downgrade path: when a pass lapses, `mark_packages_read_only()` already keeps the newest editable and flips the rest. No new function needed.

New price constant: `PASS_PRICE_CENTS = 1499` alongside `HUMANIZER_PRICE_CENTS`/`PAKET_PRICE_CENTS` in `src/lib/humanizer.ts`.

New/extended API:
- `/api/pass/intent` (new) - mints a Stripe PaymentIntent with `metadata.feature='pass'`, REQUIRES an authenticated user (unlike paket/humanizer which are anonymous-compatible). On payment success, write the `pass_30d` row with `expires_at = now() + 30 days`. Do NOT let pass logic leak into the anonymous `/api/paket/intent` stateless-token path (PRD 6.2 guardrail).
- Entitlement: extend `checkHumanizerEntitlement` / paket entitlement so a live pass window (`pass_30d`, `expires_at > now()`) grants PDF export + unlimited refinements without a per-request PaymentIntent. This is a new code path.
- Verify the Pass purchase server-side like paket (`/api/pass/verify` or fold into paket/verify).

## Phase A2: Library gallery (01) + save moment (05)

Biggest net-new UI. Rebuild `SavedPackagesSection` (KontoClient.tsx, currently a bare `<ul>`: title + updated_at + read-only text + one delete button) and the `/app` `SavedApplications` list into the card gallery:
- Card anatomy: mono date + kebab row, serif title, company middot city, hairline, mono badge row (LL/AS/STELLENANZEIGE, dashed `fehlt` for a missing doc, never red). No photos, ever (never read `AppState.photoUrl`).
- Kebab actions: Öffnen / Neue Bewerbung aus dieser / Umbenennen / Löschen.
- States: normal, hover+menu, inline-rename (accent ring + "Enter speichern · Esc abbrechen"), keyboard focus, free-tier 1/1 (a real explainer panel, not a fake locked card), read-only-after-downgrade (newest keeps sheet shadow + `BEARBEITBAR` pill; older go flat + `NUR LESEN`, **and Umbenennen is REMOVED, not disabled** - RLS would silently no-op; current KontoClient shows delete unconditionally regardless of `read_only`, a real gap to fix), empty state, mobile stack (bottom sheet replaces kebab).
- Storage-transparency footer: exactly what a package stores ("Ihren CV-Text, den Lebenslauf, das Anschreiben, die Stellenanzeige und Ihre Antworten. Keine Fotos.").
- New helper `updatePackageTitle(client, id, title)` in `account.ts` (RLS `application_packages` update-while-editable already permits it; gate client-side on `read_only` so no dead control shows).

Save moment (05): rebuild `SaveApplicationButton` (today: a button + one-line success `<p>`) into a save card on BOTH result views (Lebenslauf and Anschreiben):
- Title field pre-filled AND pre-selected from `derivePackageTitle(jobPosting)` (already exists in lebenslauf-utils.ts) with provenance line "Vorschlag aus der Stellenanzeige" and a contents-reminder line. Editable inline, never silently locked in.
- Saved-confirmation panel replaces the card in place: green-tint, checkmark, "Gespeichert" + timestamp, editable title with pencil, "In Meine Bewerbungen öffnen" link.
- Explicit-save-only: commit on the Speichern click only, never on blur/navigation.

## Phase A3: Storage-gate chooser (02)

New `StorageGate` component. Replaces the single-sentence `state==='limit'` hint in SaveApplicationButton (app/page.tsx ~1056). It is an INLINE dismissible panel (never a blocking modal):
- Eyebrow "Speicherplatz" -> serif H2 -> body "1 von 1 Bewerbung gespeichert" -> two-card grid: Pass (featured, accent border, "Empfohlen", 14,99 EUR "einmalig · 30 Tage") + Plus (secondary, "Geplant" chip, 5,99 EUR/Monat, CTA "Benachrichtigen lassen") -> honest footer ("Oder: gespeicherte Bewerbung löschen. Kostenlos, jederzeit" / "Später").
- Anchor variant (only after 2+ paket purchases): a mono ledger of real purchase dates/amounts summing to "Zwei Pakete gekauft = 9,98 EUR" contrasted with the Pass. Needs purchase-history awareness (query `humanizer_purchases` for the signed-in user).
- In the save rail: renders stacked (340px), never blocking the letter actions. On `/konto`: collapses to one line that expands the panel. Dismissed state persists (sessionStorage, like the existing paid-attempt persistence).
- No countdowns, no fake scarcity (guardrail, enforced in the design annotations).

## Phase A4: Pass modal + lifecycle (03)

New `PassModal`, mirrors `PaketModal` (same Stripe Payment Element zone, footer legal row). Two deliberate differences:
- Benefits grid includes "Endet automatisch am TT.MM.JJJJ" as a stated FEATURE, not a warning.
- **Widerruf copy is DIFFERENT from Paket's** and must NOT reuse Paket's checkbox verbatim. The Pass is a fixed-term service, so it uses the proportional value-substitute formula (§356(4)/§357a BGB): "Ich verlange, dass der Pass sofort beginnt. Widerrufe ich innerhalb von 14 Tagen, zahle ich anteiligen Wertersatz für die bereits genutzte Laufzeit." Paket hardcodes the §356(5) digital-content declaration. **This wording is flagged pending legal review (PRD Q3).**
- Active chip in top bar + on `/konto`: "Pass aktiv bis TT.MM.JJJJ", storage meter "6 / 25", footer "Endet automatisch. Keine Kündigung nötig." + "Beleg" link.
- Expired state: neutral pill "Abgelaufen am TT.MM.JJJJ" (never red), read-only downgrade explainer (view/load/duplicate/delete always work), CTA "Pass erneut kaufen · 14,99 EUR", footer "Es wurde nichts abgebucht. Der Pass verlängert sich nie."

## Phase A5: Preise v2 (04)

Full rebuild of `src/app/preise/page.tsx` (currently 3 cards + a text teaser). New:
- H1 "Bezahlen Sie die Bewerbungsphase. Nicht jede Bewerbung."
- Four-card ladder: Humanizer+ 2,99 / Bewerbungspaket 4,99 / **Bewerbungsphase-Pass 14,99 einmalig · 30 Tage (featured, glow, "Empfohlen", per-application math "Bei 10 Bewerbungen: 1,50 EUR pro Bewerbung")** / ScanReady Plus 5,99/Monat ("Geplant" chip, grey checks, CTA "Benachrichtigen lassen").
- Free-tier manifesto pull-quote band: "Kostenlos heißt vollständig. Wir begrenzen, wie viel wir für Sie speichern, nie wie gut Ihr Dokument ist."
- Anti-Abofalle before/after comparison ("Andere CV-Dienste" terracotta vs "ScanReady" accent). No competitor names in UI.
- Prices verified to match code constants (2,99/4,99). Plus 5,99 is not yet a fixed Stripe Price; keep Plus non-buyable ("Geplant") in all surfaces.

## Phase B (P1, after Phase A ships; do NOT pull into A)

- **07 CV reuse / Meine Lebensläufe:** requires schema work. Today `saveApplicationPackage` ALWAYS inserts a new `cvs` row (no reuse), though the `cv_id` FK is already many-to-one capable. Needs: a save-flow "an bestehenden Lebenslauf anhängen vs als neuen speichern" radio (>80% overlap heuristic preselects attach), a `listCvs()` helper, a usage-count query (group packages by cv_id), CV rename/delete with "Bewerbungen behalten ihre Kopie" semantics. The 05 save-card redesign must NOT silently pull in the 07 attach-radio without this.
- **08 status chip:** new nullable `status` column on `application_packages` (Entwurf/Beworben/Interview/Absage/Zusage). Chip in the card badge row, click opens dropdown (does not cycle), auto-suggests Beworben on first export/copy (undoable), stays editable even on read-only packages (metadata). Gallery filter reuses the existing filter field.
- **09 Plus subscription surfaces:** the Active state + cancel action already exist in the rails (`/api/subscription/checkout`, `/api/subscription/cancel` with `cancel_at_period_end`, `subscription.ts`). Net-new: the "cancelled-but-running" and "expired" UI states on `/konto`, a "Kündigung zurücknehmen" (un-cancel) route (none exists), and the renewal-reminder email (transactional email provider decision needed, PRD 6.4). Gated: Plus stays "Geplant"/non-buyable until the Pass shows demand.

---

## Cross-cutting guardrails (every phase)

- **Em-dash ban** site-wide. The design copy decks use middot and en-dash, no em-dashes; keep it that way in `prompts.ts` output rules and all new UI copy.
- **i18n:** every surface ships a DE/EN copy deck with dotted keys (`library.*`, `save.*`, `gate.*`, `status.*`, `cvs.*`). Map into the existing `src/lib/i18n.tsx` `t.*` dictionary, do not invent ad hoc.
- **No photos in library cards** (never persisted; never read `photoUrl`).
- **Explicit-save-only** (Datenschutz §7 legal basis); no autosave/blur-save/periodic sync.
- **Read-only rows hide edit controls, not disable them** (RLS silently no-ops otherwise).
- **Pass requires an account**; keep the anonymous paket/humanizer stateless-token rails untouched.
- **Env-gated** consistent with the Stage 3 pattern (`accountsEnabled()`, `subscriptionConfigured()`); everything inert until founder provisions keys.
- **Legal to review before ship:** the new Pass Widerruf variant, AGB/Datenschutz clauses for the Pass SKU + Plus cancel/reactivate states, storage-tier language in Datenschutz §7. `legal-data.ts` FOUNDER_TODO placeholders (operatorName/street/city/email) still block any real checkout.
- **Founder decisions still open (PRD section 9):** Pass duration/price (30d/14,99 recommended), Plus price (5,99 recommended), Pass Widerruf mechanics (legal), names, Pass storage cap (25).

## Suggested build order

A0 foundation (tokens + primitives + assets) -> A1 Pass data/API -> A2 library+save (the core value) -> A3 storage-gate -> A4 Pass modal -> A5 preise. Then stop, ship Phase A behind env gates, gather Pass demand signal, then B.
