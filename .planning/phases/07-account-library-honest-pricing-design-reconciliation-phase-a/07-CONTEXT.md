# Phase 7: Account Library + Honest Pricing (design Phase A) - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning
**Source:** PRD Express Path (scanready/docs/design-impl-plan-library-pricing.md + scanready/docs/prd-account-library-pricing.md, via /goal directive)

<domain>
## Phase Boundary

Reconcile the six Phase-A surfaces of the claude.ai/design export ("Scanready award-winning design_updated": 01-library, 02-storage-gate, 03-pass, 04-preise, 05-save-moment, 06-founder-assets) into the live Next.js app, behind the existing Stage 3 env gates (`accountsEnabled()`, Stripe env checks). Adds one new SKU (Bewerbungsphase-Pass, 14,99 EUR one-time, 30 days, non-renewing, account-required) with its DB migration, intent route, and entitlement extension. Surfaces 07/08/09 are Phase B and are OUT of this phase.

</domain>

<decisions>
## Implementation Decisions

### Build order (locked)
- A0 foundation (tokens + ui.tsx primitives + founder assets/404) -> A1 Pass data/API -> A2 library gallery + save moment -> A3 storage gate -> A4 Pass modal -> A5 preise v2. A0 unblocks everything; A1 unblocks A3/A4.

### A0 Foundation
- globals.css: add `--shadow-sheet`, `--shadow-sheet-hero`, `--shadow-modal` from `ds-update/tokens/shadows.css` as Tailwind v4 `@theme` values.
- New primitives in `src/components/ui.tsx` (current exports: btnClass, Btn, CARD, EYEBROW, SKILL_CHIP, NORM_NOTE): `SheetCard`, `KebabMenu` (focus trap + Escape + outside-click, hairline before destructive item, matching HumanizerModal a11y), `InlineRenameField` (serif input, 2px accent ring, Enter saves / Esc cancels), `MonoBadge` + ghost dashed "fehlt" variant + pill badges (BEARBEITBAR accent-tint, NUR LESEN slate + lock), `EmptyState` (dashed border, mono status line doubling as aria-live, body, one CTA), `BottomSheet` (mobile kebab replacement, 44px targets), `SavedConfirmationPanel` (accent-tint: checkmark + timestamp + editable title + library link).
- The export's `ds-update/` folder targets the SEPARATE design-system project (its APPLY.md); it is the reference spec for these primitives, NOT React to copy in.
- Copy the six SVGs from the export `assets/` into `public/`: favicon.svg, og-scanready.svg (replaces off-brand public/og-image.svg), scanready-lockup.svg, scanready-lockup-dark.svg, scanready-mark.svg, scanready-stacked.svg. Wire `icons` + explicit `openGraph.images` in `src/app/layout.tsx` metadata. Build `src/app/not-found.tsx` from surface 06's "misprint correction notice" spec (full DE/EN copy in the .dc.html, reduced-motion-safe, no animation). Regenerate favicon.ico. All marks are stand-ins pending the naming decision (naming-shortlist.md).

### A1 Pass data + API
- New migration `scanready/supabase/migrations/0002_pass.sql` (the migrations dir lives INSIDE scanready/): `humanizer_purchases.expires_at timestamptz` (nullable); Pass rows use `kind='pass_30d'` and REQUIRE `user_id` (anonymous humanizer/paket rows keep user_id null); no RLS change (select-own covers it). Re-create `enforce_package_limit()` with three tiers: active subscription = unlimited; else live pass (`pass_30d` row, `expires_at > now()`) = limit 25; else limit 1. KEEP the per-user advisory-lock race guard. The DB trigger stays the ONLY place the limit is enforced.
- Pass expiry reuses the existing downgrade path (`mark_packages_read_only()` keeps the newest editable); no new function.
- `PASS_PRICE_CENTS = 1499` beside HUMANIZER_PRICE_CENTS/PAKET_PRICE_CENTS in `src/lib/humanizer.ts`.
- New `/api/pass/intent`: mints a Stripe PaymentIntent with `metadata.feature='pass'`; REQUIRES an authenticated user (unlike paket/humanizer). On payment success, write the `pass_30d` row with `expires_at = now() + 30 days`. Pass logic must NOT leak into the anonymous `/api/paket/intent` stateless-token path.
- Entitlement: extend `checkHumanizerEntitlement` / paket entitlement so a live pass window grants PDF export + refinements without a per-request PaymentIntent. Verify Pass purchases server-side like paket (`/api/pass/verify` or folded into paket/verify).

### A2 Library gallery (01) + save moment (05)
- Rebuild `SavedPackagesSection` (KontoClient.tsx) and `/app` `SavedApplications` into the card gallery. Card anatomy: mono date + kebab row, serif title, company middot city, hairline, mono badge row (LL/AS/STELLENANZEIGE, dashed "fehlt" for a missing doc, never red). No photos ever (never read AppState.photoUrl).
- Kebab actions: Öffnen / Neue Bewerbung aus dieser / Umbenennen / Löschen.
- States: normal, hover+menu, inline-rename (accent ring + "Enter speichern · Esc abbrechen"), keyboard focus, free-tier 1/1 (real explainer panel, not a fake locked card), read-only-after-downgrade (newest keeps sheet shadow + BEARBEITBAR pill; older go flat + NUR LESEN, and Umbenennen is REMOVED, not disabled). Fix the existing gap: KontoClient currently shows delete unconditionally regardless of read_only display state (delete stays allowed by contract; rename/edit controls must hide on read_only).
- Storage-transparency footer, exact copy: "Ihren CV-Text, den Lebenslauf, das Anschreiben, die Stellenanzeige und Ihre Antworten. Keine Fotos."
- New helper `updatePackageTitle(client, id, title)` in `src/lib/account.ts` (NOTE: the account helpers live at `scanready/src/lib/account.ts`, NOT under `src/lib/supabase/`); gate client-side on read_only.
- Duplicate-and-tailor = existing "New Anschreiben, same Lebenslauf" path made per-card via LOAD_PACKAGE-style flow with an empty posting step; the duplicate is only saved on explicit save and goes through the DB limit trigger.
- Gallery is client-side filterable by title/company text (no server search).
- Save moment: rebuild `SaveApplicationButton` into a save card on BOTH result views (Lebenslauf and Anschreiben): title pre-filled AND pre-selected from `derivePackageTitle(jobPosting)` (exists in lebenslauf-utils.ts), provenance line "Vorschlag aus der Stellenanzeige", contents-reminder line. Saved-confirmation panel replaces the card in place (green-tint, checkmark, "Gespeichert" + timestamp, editable title with pencil, "In Meine Bewerbungen öffnen" link). Commit on Speichern click only; never on blur/navigation.

### A3 Storage gate (02)
- New `StorageGate` component replaces the single-sentence `state==='limit'` hint in SaveApplicationButton (app/page.tsx ~1056). INLINE dismissible panel, never a blocking modal: eyebrow "Speicherplatz" -> serif H2 -> "1 von 1 Bewerbung gespeichert" -> two-card grid (Pass featured with accent border + "Empfohlen" + 14,99 EUR "einmalig · 30 Tage"; Plus secondary with "Geplant" chip, 5,99 EUR/Monat, CTA "Benachrichtigen lassen") -> honest footer (delete-instead option, "Später").
- Anchor variant ONLY after 2+ paket purchases: mono ledger of real purchase dates/amounts ("Zwei Pakete gekauft = 9,98 EUR") contrasted with the Pass; needs a purchase-history query on `humanizer_purchases` for the signed-in user.
- Save rail: renders stacked (340px), never blocking letter actions. On /konto: collapses to one line that expands. Dismissed state persists in sessionStorage (like paid-attempt persistence). No countdowns, no fake scarcity.

### A4 Pass modal (03)
- New `PassModal` mirrors `PaketModal` (same Stripe Payment Element zone, footer legal row) with two deliberate differences: benefits grid includes "Endet automatisch am TT.MM.JJJJ" as a FEATURE; Widerruf consent is the DISTINCT proportional value-substitute wording (§356(4)/§357a BGB): "Ich verlange, dass der Pass sofort beginnt. Widerrufe ich innerhalb von 14 Tagen, zahle ich anteiligen Wertersatz für die bereits genutzte Laufzeit." It must NOT reuse Paket's §356(5) digital-content checkbox verbatim. Wording flagged pending legal review (PRD Q3) - flag, do not block.
- Active chip in top bar + /konto: "Pass aktiv bis TT.MM.JJJJ", storage meter "6 / 25", footer "Endet automatisch. Keine Kündigung nötig." + "Beleg" link. Expired: neutral pill "Abgelaufen am TT.MM.JJJJ" (never red), read-only downgrade explainer (view/load/duplicate/delete always work), CTA "Pass erneut kaufen · 14,99 EUR", footer "Es wurde nichts abgebucht. Der Pass verlängert sich nie."

### A5 Preise v2 (04)
- Full rebuild of `src/app/preise/page.tsx`: H1 "Bezahlen Sie die Bewerbungsphase. Nicht jede Bewerbung." Four-card ladder: Humanizer+ 2,99 / Bewerbungspaket 4,99 / Bewerbungsphase-Pass 14,99 einmalig · 30 Tage (featured, glow, "Empfohlen", per-application math "Bei 10 Bewerbungen: 1,50 EUR pro Bewerbung") / ScanReady Plus 5,99/Monat ("Geplant" chip, grey checks, CTA "Benachrichtigen lassen", non-buyable).
- Free-tier manifesto pull-quote band: "Kostenlos heißt vollständig. Wir begrenzen, wie viel wir für Sie speichern, nie wie gut Ihr Dokument ist."
- Anti-Abofalle before/after comparison ("Andere CV-Dienste" terracotta vs "ScanReady" accent). No competitor names in UI. Prices must match code constants.

### Cross-cutting guardrails (every plan must honor)
- NO em-dash anywhere (site-wide ban; use middot, en-dash, or rewording; design copy decks already comply).
- i18n: every surface's DE/EN copy maps into the existing `src/lib/i18n.tsx` `t.*` dictionary using the export's dotted key groups (`library.*`, `save.*`, `gate.*`); use the .dc.html copy decks VERBATIM; no ad hoc strings.
- No photos in library cards; explicit-save-only (Datenschutz §7); read-only rows HIDE edit controls (RLS would silently no-op); Pass requires an account while anonymous paket/humanizer rails stay stateless and untouched; everything env-gated inert until founder provisions keys (Stage 3 `accountsEnabled()` pattern); grounded-only generation and zero-retention anonymous flow unchanged.
- New German copy + the Pass Widerruf variant + any new AGB/Datenschutz clauses (storage-tier language in §7, Pass SKU) are FLAGGED for native-speaker + legal review; do not block the build on them.
- DO NOT touch `src/lib/legal-data.ts` FOUNDER_TODOs. DO NOT resolve PRD §9 founder decisions; use the recommended defaults (Pass 30d/14,99; Plus 5,99 "Geplant"; storage cap 25) and flag them.
- Workflow: branch `claude/ecom-low-barrier-tools-zpyb10`; `gh auth switch --user KI-lian-io` before any push; node v22 locally; run `npx tsc --noEmit` + the vitest suite + `next build` in scanready/; verify UI via preview tools.

### Claude's Discretion
- Exact component file layout for new components (colocate with existing modals/components under `src/components/` following current conventions).
- Test placement and granularity (follow the existing vitest patterns, e.g. lebenslauf-uid-boundary.test.ts style pure-helper tests).
- Whether Pass verify is a new `/api/pass/verify` route or folded into the existing paket verify route (impl plan allows either).
- Minor responsive/spacing judgment calls within the Warm Editorial Broadsheet system where the .dc.html surfaces do not specify.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary spec (the reconciliation map - read first)
- `scanready/docs/design-impl-plan-library-pricing.md` - surface->component map, per-phase deltas (A0..A5), new primitives, build order, cross-cutting guardrails
- `scanready/docs/prd-account-library-pricing.md` - pricing ladder (§6.2), paywall placement (§6.3), free-tier library rights (§6.1), open founder decisions (§9)

### Design surfaces (exhaustive DE/EN copy decks - use copy VERBATIM; 07/08/09 are Phase B, do NOT build)
- `scanready/claude design files/Scanready award-winning design_updated/01-library.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/02-storage-gate.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/03-pass.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/04-preise.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/05-save-moment.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/06-founder-assets.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/assets/` - the six founder SVGs
- `scanready/claude design files/Scanready award-winning design_updated/ds-update/` - primitive reference spec (tokens/shadows.css etc.); targets the separate design-system project, NOT React to copy in

### Design system + project guardrails
- `scanready/DESIGN.md` - Warm Editorial Broadsheet canonical spec
- `CLAUDE.md` (repo root) - decision trail, non-negotiable guardrails, deploy gotchas
- `scanready/docs/art-direction-typesetting-theater.md` - award-push layer the new surfaces extend

### Existing code the phase extends (closest analogs)
- `scanready/src/components/ui.tsx` - primitive home (btnClass, Btn, CARD, EYEBROW, SKILL_CHIP, NORM_NOTE)
- `scanready/src/app/globals.css` - Tailwind v4 @theme tokens
- `scanready/src/components/PaketModal.tsx` + `scanready/src/components/HumanizerModal.tsx` - modal/payment UX + a11y patterns PassModal mirrors
- `scanready/src/app/konto/KontoClient.tsx` - SavedPackagesSection to rebuild
- `scanready/src/app/app/page.tsx` - SavedApplications list, SaveApplicationButton (~1056: state==='limit' hint), LOAD_PACKAGE flow
- `scanready/src/lib/account.ts` - saveApplicationPackage, load/delete helpers; add updatePackageTitle() (NOT under src/lib/supabase/, which only holds admin/client/config/server)
- `scanready/src/lib/humanizer.ts` - price constants, checkHumanizerEntitlement
- `scanready/src/app/api/paket/intent/route.ts` + `scanready/src/app/api/paket/verify/route.ts` + `scanready/src/app/api/humanizer/intent/route.ts` - Stripe-as-token rails /api/pass/intent parallels
- `scanready/supabase/migrations/0001_stage3_accounts.sql` - enforce_package_limit(), advisory lock, mark_packages_read_only(), RLS to extend in 0002
- `scanready/src/lib/i18n.tsx` - the t.* dictionary new copy maps into
- `scanready/src/app/preise/page.tsx` - page to rebuild
- `scanready/src/app/layout.tsx` - metadata to extend (icons, openGraph.images)
- `scanready/docs/stage3-accounts.md` + `scanready/docs/humanizer-golive.md` - env-gate patterns + founder-gate checklists to update if touched

</canonical_refs>

<specifics>
## Specific Ideas

- Each .dc.html surface embeds design-note annotations and a full DE/EN copy deck with dotted keys; the executor lifts copy verbatim from there into i18n.tsx (documents/DIN labels stay German-only per existing convention).
- The storage gate's "own spend as anchor" ledger only renders when the signed-in user has 2+ paket purchase rows; sums like "Zwei Pakete gekauft = 9,98 EUR" use real purchase dates/amounts.
- Migration 0002 is schema work on the LIVE Frankfurt Supabase project (thgmhbzimnjcaoqyyiyp); Supabase MCP is wired (.mcp.json) for interactive apply + security advisors. If MCP/auth is unavailable in-session, the apply step is flagged as a founder gate instead of silently skipped.
- Existing sessionStorage persistence patterns (paid attempt, paket unlock) are the model for StorageGate dismissal persistence.
- prompts.ts TYPOGRAPHY_RULES em-dash ban already exists; new UI copy must comply too.

</specifics>

<deferred>
## Deferred Ideas

- Phase B (do NOT build): 07-lebenslaeufe CV-reuse tab (needs schema work: attach-to-existing-CV radio, listCvs(), usage counts), 08-status per-package status chip (new column), 09-plus subscription surfaces (un-cancel route, renewal reminder email, cancelled-but-running/expired states).
- PRD §6.5 P2: server-side posting search, zip export, pass gifting, multi-CV stats.
- PRD §9 founder decisions stay open: Pass duration/price (30d/14,99 default), Plus price (5,99 default), Pass Widerruf mechanics (legal), product names, Pass storage cap (25 default).
- Founder gates unchanged: legal-data.ts FOUNDER_TODOs, Stripe keys, PostHog key, Vercel production promotion, native-speaker review.

</deferred>

---

*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Context gathered: 2026-07-07 via PRD Express Path*
