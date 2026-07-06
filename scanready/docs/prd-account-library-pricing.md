# PRD: Account Content Library + Honest Pricing Ladder

**Date:** 2026-07-06
**Status:** Draft for founder review
**Owner:** Kilian
**Inputs:** Live competitor teardown (Kickresume, FlowCV, Enhancv, Rezi, Teal, Zety, cvapp.de, Lebenslauf.de), document-library UX research (NN/g, PatternFly, Smart Interface Design Patterns), DACH pricing/legal research (StepStone 2025 survey, §312k/§356/§309/PAngV, XING/LinkedIn price anchors), codebase constraints audit (Stage 3 stack as shipped).

---

## 1. Problem Statement

Signed-in users can save exactly one application package and see it as a bare list row; there is no way to organize, rename, duplicate, or browse past CVs, Anschreiben, or job postings. At the same time, monetization is per-application (4,99 € Bewerbungspaket), which punishes exactly the highest-intent users: German job seekers send a median of 20 applications per search (StepStone 2025; under-30 academics send ~40) over a ~5-month search, so per-application pricing reads as expensive precisely for the people who love the product most. We lose both retention value (nothing to come back to) and revenue (no fair offer for volume users).

## 2. Goals

1. **Library as the account's reason to exist:** a signed-in user who completes 2+ applications can find, reuse, and duplicate their past work in under 10 seconds from `/konto` or the tool.
2. **Fix the volume-pricing gap without betraying the anti-Abofalle brand:** a user applying to 10+ jobs has an offer where per-application cost lands around 1,50-2,00 € instead of 4,99 €.
3. **Introduce recurring revenue honestly:** a subscription exists, is cancel-anytime, §312k-compliant, sends pre-renewal reminders, and is structurally distinguishable from the trial-trap foil (cvapp.de: 2,95 € trial auto-renewing to 14,99 €/month; Zety: ~2 $ trial to ~24 $/4wks).
4. **Convert the storage limit into the upsell moment:** hitting the free 1-package cap presents the pass and subscription side by side, anchored against what the user already spent.
5. **Preserve every existing guardrail:** zero-retention anonymous flow, explicit save only, no photo persistence, full-quality free documents.

## 3. Non-Goals

- **Kanban/spreadsheet application tracker (Huntr/Teal style).** That is a different product with tracking as its core loop; ours is document quality. v1 ships at most a single status dropdown (P1).
- **Live-linked CV editing ("edit CV once, all packages update").** Packages stay point-in-time snapshots; a live link requires a schema redesign with regeneration semantics and is not what the save/load contract promises today.
- **Photo storage in any form.** Cards preview typographically (see 6.3); the never-persist-photos guarantee holds inside the account layer.
- **Autosave or draft persistence.** Every write remains an explicit user action (Datenschutz §7: "nur auf Ihre ausdrückliche Aktion, niemals automatisch").
- **A 5er-Paket credit bundle.** Researched as Option C; cut for v1 because a 5-SKU menu (2,99 / 4,99 / bundle / pass / sub) confuses more than it converts. The pass covers volume users.
- **Cheapening the free tier.** Free keeps the complete letter, copy, and .txt export, no watermark, no format crippling. The paywall placement stays "convenience and volume", never "usable output".

## 4. Positioning: what makes our paywall honest (say it out loud)

The competitor research sorts gates into three archetypes: format-crippling (Zety/cvapp.de: free download is unusable .txt), count-caps (Rezi: 3 PDF downloads ever; FlowCV: 1 resume free but genuinely usable), and trial-traps (Enhancv/Zety/cvapp.de: small fee auto-renews into 15-26 €/period; Verbraucherzentrale Hessen is actively warning about exactly this in CV services). ScanReady's free tier is a count-cap on STORAGE only: the document itself is always complete and usable. That is the honest line, and `/preise` should state it explicitly: "Kostenlos heißt vollständig. Wir begrenzen, wie viel wir für Sie speichern, nie wie gut Ihr Dokument ist."

Lebenslauf.de proves the market values non-renewal as a feature ("endet automatisch, eine Kündigung ist nicht erforderlich"). The EU Digital Fairness Act (proposal expected Q4 2026) is moving toward mandatory renewal reminders and opt-in renewal; shipping those voluntarily now is brand differentiation with a compliance tailwind.

## 5. Users

- **Aylin, intl. grad in Berlin, applying to 30 jobs in 3 months.** Highest volume, most price-sensitive per unit, needs duplicate-and-tailor daily. Target for the Pass.
- **Marcus, senior expat, 5 targeted applications.** Low volume, high stakes. One-time Bewerbungspaket stays right for him; the library still saves him re-pasting his CV.
- **Casual anonymous user.** Never signs in, keeps the stateless flow. Nothing in this PRD may degrade that path.

## 6. Requirements

### 6.1 P0: Bewerbungen library (the gallery)

The primary object is the **application package** (Lebenslauf + Anschreiben + job posting + answers), matching both the data model and the public `/preise` promise ("mehrere Bewerbungspakete speichern"). Not a freestanding CV gallery in v1 (see 6.4).

| # | Requirement | Acceptance criteria |
|---|-------------|---------------------|
| L1 | Card gallery view of saved packages at `/konto` (tab or section) and a compact version in the tool's input view (extends today's SavedApplications list) | Cards show: editable title, company/role line, saved date, doc badges (LL / AS / Stellenanzeige), read-only badge where applicable. Grid on desktop, single-column stack on mobile (reflow, not a separate component). No horizontal scrolling. |
| L2 | Rename: inline title edit on card | Uses existing `title` columns and existing RLS update policies via new `updatePackageTitle()` helper in `account.ts`. Client hides rename on `read_only` rows (RLS would silently no-op otherwise). |
| L3 | Auto-title as editable suggestion | On save, title is prefilled from `derivePackageTitle()` (as today) but shown as an editable field at the save moment, never silently locked in. |
| L4 | Duplicate-and-tailor: "Neue Bewerbung aus dieser" on each card | Loads the package's CV + Lebenslauf into the flow with an empty posting step (the existing "New Anschreiben, same Lebenslauf" path, made per-card). The duplicate is only SAVED if the user explicitly saves; the resulting insert goes through the DB limit trigger like any save. |
| L5 | Job posting history | Package detail view shows the stored `job_posting` full text. Gallery is client-side filterable by title/company text (small collections; no server search in v1). |
| L6 | Open/load from card | Existing LOAD_PACKAGE flow, one click, restores result phase. |
| L7 | Delete per card + account-wide (existing) with confirm | Per-item delete stays one click + confirm; storage transparency line on `/konto` says exactly what a saved package contains (CV text, documents, posting, answers). |
| L8 | Empty state per NN/g | Status line ("Noch keine gespeicherten Bewerbungen"), one line on what saving unlocks (reuse, duplicate), one CTA into the flow. No decorative-only empty state. No auto-seeded first item (would violate explicit-save). |

**Free-tier library rights (explicit, resolves the downgrade ambiguity):** a free account keeps FULL read, load, duplicate-into-flow, rename, export, and delete rights on its 1 saved package forever. `read_only` (set on downgrade when >1 packages exist) blocks editing/renaming of the locked rows only; viewing, loading into the flow, and deleting always work. The UI must label read-only cards and never show dead controls.

### 6.2 P0: Pricing ladder v2

Keep both existing one-time SKUs unchanged. Add one SKU now, one later:

| SKU | Price | Type | What it includes |
|-----|-------|------|------------------|
| Humanizer+ | 2,99 € | one-time (existing) | 1 refinement of the finished Anschreiben |
| Bewerbungspaket | 4,99 € | one-time (existing) | PDF export + 1 refinement for 1 application |
| **Bewerbungsphase-Pass** | **14,99 €** | **one-time, 30 days, non-renewing (NEW P0)** | Unlimited Bewerbungspakete (PDF + refinements) while active, library storage up to 25 packages. Ends automatically. Copy on the buy page: "Läuft automatisch aus. Keine Kündigung nötig." |
| ScanReady Plus (working name) | 5,99 €/month | subscription (P1, ships after Pass proves demand) | Everything in the Pass, ongoing; cancel anytime; §312k Kündigungsbutton (built); pre-renewal reminder email 5 days before each charge (beyond legal minimum, DFA-forward) |

Rationale: 4,99 € per application is not objectively expensive (human services run 80-800 €; LinkedIn Premium Career is 14,74 €/mo, XING Premium ~6-12 €/mo), but it scales against the median 20-application search. The Pass drops per-application cost to ~1,50 € at 10 applications while being structurally incapable of becoming an Abofalle: nothing renews, so §312k does not even apply to it (no Dauerschuldverhältnis). The subscription is the secondary, clearly-labeled option for people who want standing access, priced inside the XING band and below LinkedIn.

**Entitlement representation (resolves the rails gap):** Pass and subscription require a signed-in account. The Pass is recorded server-side as a purchase row (extend `humanizer_purchases.kind` with `pass_30d`, requires `user_id`, plus an `expires_at`); per-request entitlement in `/api/paket/*` and `/api/humanize` extends the existing `checkHumanizerEntitlement` pattern to accept a live pass window. It is NOT a sessionStorage token (30 days outlives a browser session) and NOT a subscriptions-table row (it is not a subscription). Anonymous per-application purchases keep the existing stateless Stripe-as-token rails untouched.

**Storage limit changes (DB layer, new migration):** `enforce_package_limit()` gains two tiers: free = 1 (unchanged), active pass = 25, active subscription = unlimited (current behavior). On pass expiry, the existing downgrade machinery applies (`mark_packages_read_only()` keeps the newest editable); everything stays viewable and loadable per 6.1.

### 6.3 P0: Paywall placement

1. **Per-application gate (existing, unchanged):** PDF export + refinement behind Bewerbungspaket / Humanizer+.
2. **Storage gate (new upsell moment):** the 2nd save on a free account hits the DB limit; the limit hint upgrades from a text line to a small honest chooser: Pass and (later) Plus side by side, with the user's own spend as anchor when they have purchased 2+ Pakete ("Zwei Pakete gekauft = 9,98 €. Der Pass kostet 14,99 € und deckt Ihre ganze Bewerbungsphase."). No countdown timers, no fake scarcity.
3. **Price disclosure early (existing principle):** ladder visible on `/preise` before any paywall moment; PAngV total-price display; if an intro discount is ever run, the 30-day-lowest-price rule applies.

### 6.4 P1 (fast follows)

- **CV reuse as a real entity ("Meine Lebensläufe" tab):** save flow offers "attach to existing CV" (fixes the current one-cvs-row-per-save duplication), new `listCvs()` helper, CV cards with rename. Requires a save-flow selector UI; packages keep snapshotting their Lebenslauf JSON.
- **Status dropdown per package:** Entwurf / Beworben / Interview / Absage / Zusage. One column, no board.
- **ScanReady Plus subscription** as specced in 6.2 (rails already built: Stripe Checkout, webhook, /kuendigen, downgrade helpers). Gate: ship after the Pass shows demand signal (see metrics).
- **Renewal reminder email** infrastructure for Plus (transactional email provider decision needed).

### 6.5 P2 (design for, do not build)

- Search across stored posting text server-side; export a package as a bundle (zip); pass gifting (AVGS-adjacent B2B2C via job coaches); multi-CV A/B stats.

## 7. UX notes

- Cards use typographic previews consistent with Typesetting Theater: mini doc-sheet with serif title, company/role, date, and badges. No thumbnails, no photos (never persisted). This is a brand advantage, not a compromise: the "print sheet" look IS the product.
- Mobile: single-column stack; swipe actions optional but every action must also exist as a visible button/kebab (NN/g swipe discoverability).
- Trust: `/konto` shows per-package storage contents and one-click deletion; Datenschutz §7 gets a companion sentence for rename/duplicate actions (each is an explicit action; no new legal basis needed, but copy must mention the new write paths).

## 8. Success Metrics

Leading (2-6 weeks post-launch, PostHog cookieless funnel, gated on the PostHog key):
- Save rate: >=30% of signed-in users who reach letter_done save the package.
- Storage-gate exposure to Pass view: >=60% of users who hit the 1-package limit open the chooser.
- Pass conversion: >=8% of storage-gate viewers buy the Pass within 7 days (stretch 15%).
- Duplicate usage: >=25% of users with 2+ packages use "Neue Bewerbung aus dieser".

Lagging (quarter):
- Returning signed-in users (7-day return) up 2x vs pre-library baseline.
- Revenue mix: Pass >= 40% of one-time revenue by month 2 (validates the volume offer); then green-light Plus.
- Zero §312k/renewal complaints; cancel flow completion < 2 minutes (measured via test drills, not analytics).

## 9. Open Questions (founder)

1. **Pass duration/price:** 30 days at 14,99 € (recommended: matches "Bewerbungsphase" framing, low commitment) vs 90 days at 24,99 € (matches the real ~5-month search better, higher upfront). Could ship 30d first and add 90d later. DECIDE.
2. **Plus price:** 4,99 / 5,99 (recommended) / 6,99 €/month. Also resolves the stale "3,99-5,99" note in the docs. DECIDE.
3. **Pass Widerruf mechanics (legal review):** the Pass is a fixed-term service, not one-shot digital content; the §356(5) checkbox pattern used for Paket likely maps to §356(4)/§357a proportional-value rules instead. Needs the same preview-deploy legal review as the subscription texts. LEGAL.
4. **Working name "Bewerbungsphase-Pass" and "ScanReady Plus"** pending the product naming decision (naming-shortlist.md). DECIDE.
5. **Pass storage cap 25:** arbitrary but generous (median search = 20 applications). Any reason to make it unlimited? ENGINEERING preference: keep a cap so the trigger stays simple. DECIDE.

## 10. Timeline / Phasing

- **Phase A (P0):** library gallery + rename + duplicate + empty state; Pass SKU (migration for trigger tiers + purchases.kind + entitlement check); storage-gate chooser; /preise + Datenschutz §7 + AGB copy updates. All env-gated consistent with the Stage 3 pattern.
- **Phase B (P1):** CV entity reuse + status dropdown; then Plus subscription once Pass demand signal is in (rails exist; main new work is the reminder email + copy).
- Dependencies: PostHog key (metrics), Stripe live keys + legal review (already founder gates), native-speaker review of all new German copy.

## 11. Rejected alternatives (for the record)

- Auto-seeding the first library item from the first generation (Basecamp-style): rejected, violates explicit-save/§7.
- 5er-Paket credit bundle: rejected for v1, menu clutter; the Pass answers the same need with time framing.
- Kanban tracker: rejected as v1 scope creep into a served category (Huntr/Teal).
- Subscription-first (no pass): rejected; contradicts the anti-Abofalle position that one-time-first credibility is built on, and Grammarly's subscription-only model demonstrably pushes low-frequency users to alternatives.
