---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
plan: 08
subsystem: ui
tags: [nextjs, tailwind-v4, i18n-de-only, stripe-pricing, intl-formatting]

# Dependency graph
requires:
  - phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
    provides: "PASS_PRICE_CENTS (1499) constant in src/lib/humanizer.ts (07-02)"
provides:
  - "Rebuilt /preise: four-card honest-pricing ladder (Humanizer+ 2,99, Bewerbungspaket 4,99, featured non-renewing Bewerbungsphase-Pass 14,99 with per-application math, ScanReady Plus 5,99/Monat 'Geplant' non-buyable)"
  - "Free-tier manifesto pull quote reusing the existing .pull-quote/.pull-quote-mark CSS"
  - "Competitor-name-free anti-Abofalle before/after comparison (terracotta 'Andere CV-Dienste' vs accent 'ScanReady')"
  - "formatEuroCents() page-local de-DE Intl currency formatter pattern for deriving displayed prices from cents constants"
affects: [distribution, konto-dashboard, pass-purchase-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prices displayed on marketing/pricing surfaces are formatted from the same cents constants Stripe checkout reads (HUMANIZER_PRICE_CENTS/PAKET_PRICE_CENTS/PASS_PRICE_CENTS), via a small Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'}) helper, not hand-typed literals"
    - "Non-buyable / not-yet-shipped tiers (ScanReady Plus) get a plain mailto: CTA instead of a disabled button or a fake checkout trigger - honest and still functionally useful (reaches the founder's inbox), no client JS needed"

key-files:
  created: []
  modified:
    - scanready/src/app/preise/page.tsx

key-decisions:
  - "ScanReady Plus's 5,99 EUR/Monat price stays a hardcoded literal (not a code constant): there is no PLUS_PRICE_CENTS in src/lib because Plus is an unbuilt, undecided-price Stage P1 tier (docs/prd-account-library-pricing.md still lists 4,99/5,99/6,99 as open). The plan's acceptance criteria only requires the three live tiers (Humanizer+/Paket/Pass) to be constant-derived; Plus is correctly excluded until it has a real price and Stripe Price ID."
  - "'Benachrichtigen lassen' renders as a Btn as='a' mailto: link to LEGAL.email with a prefilled subject, not a disabled button. This is more honest than a dead button (it is a genuine notify-me channel, even though manual) and needs no client handler, matching the plan's 'plain link/Btn, no client handler' instruction."
  - "Tasks 1 and 2 were implemented as a single Write of the fully rebuilt page rather than two incremental edits, because the plan's own objective calls this a 'Full rebuild' and the ladder, manifesto, and anti-Abofalle sections are interleaved in one page layout (manifesto sits between the hero and the ladder in the design deck's banded rhythm, not appended after). Committed as one feat commit; see Deviations."

patterns-established:
  - "CheckIcon(muted?) - a single shared checkmark component with an optional muted variant (text-muted instead of text-accent) so a not-yet-buyable card's feature list never borrows the paid accent color"
  - "CrossIcon - terracotta (text-brand-error) cross, confined to the generic 'Andere CV-Dienste' before-column only, never used for ScanReady's own copy (per the design deck's before/after rule)"

requirements-completed: [SC-07]

# Metrics
duration: 25min
completed: 2026-07-07
status: complete
---

# Phase 07 Plan 08: A5 Preise v2 Summary

**Rebuilt /preise into a four-card honest-pricing ladder (Humanizer+/Bewerbungspaket/featured non-renewing Bewerbungsphase-Pass/non-buyable ScanReady Plus) with a free-tier manifesto pull quote and a competitor-name-free anti-Abofalle comparison, every live price formatted from the code's cents constants.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-07T12:05:00Z (approx.)
- **Completed:** 2026-07-07T12:30:00Z (approx.)
- **Tasks:** 2 (both auto)
- **Files modified:** 1

## Accomplishments

- `/preise` now shows the four-card ladder from design surface 04: Humanizer+ (2,99 €), Bewerbungspaket (4,99 €), a featured Bewerbungsphase-Pass (14,99 €, "einmalig · 30 Tage", accent border + glow, "Empfohlen" badge, "Endet automatisch. Keine Kündigung nötig." bullet, and the mono per-application math line "Bei 10 Bewerbungen: 1,50 € pro Bewerbung"), and a muted ScanReady Plus card (5,99 €/Monat, "Geplant" chip, grey checks, non-buyable mailto CTA).
- Every one of the three live prices (Humanizer+, Bewerbungspaket, Pass) is rendered via `formatEuroCents()`, a page-local `Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'})` wrapper around `HUMANIZER_PRICE_CENTS` / `PAKET_PRICE_CENTS` / `PASS_PRICE_CENTS` imported from `src/lib/humanizer.ts` — the page cannot silently drift from what Stripe actually charges.
- Added the free-tier manifesto band: a `.pull-quote`/`.pull-quote-mark` broadsheet quote ("Kostenlos heißt vollständig. Wir begrenzen, wie viel wir für Sie speichern, nie wie gut Ihr Dokument ist.") lifted verbatim from the design deck, next to a four-item free-tier checklist.
- Added the anti-Abofalle before/after comparison on the closing dark band: a terracotta "Andere CV-Dienste" column (generic, no competitor brand names) versus an accent "ScanReady" column, copy lifted verbatim from the deck.
- Kept the page a plain server component (no `'use client'`), the existing `metadata` export, `lang="de"` wrapper, masthead, `FolioEyebrow`, and `CheckIcon` helper shapes exactly as instructed; extended `CheckIcon` with an optional `muted` variant and added a `CrossIcon` for the comparison's before-column.

## Task Commits

Both tasks landed in a single commit because they target the same rebuilt page and the design's banded layout interleaves the ladder and manifesto sections (see Decisions/Deviations):

1. **Task 1 + Task 2: Rebuild the four-card ladder, manifesto pull quote, and anti-Abofalle comparison** - `c5df8cb` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified

- `scanready/src/app/preise/page.tsx` - full rebuild: hero copy updated to the deck's H1/subhead, new free-tier manifesto band, four-card ladder (Humanizer+/Bewerbungspaket/Pass-featured/Plus-geplant) with prices formatted from `src/lib/humanizer.ts` constants, anti-Abofalle before/after comparison replacing the old prose-only "Warum einmalig" section

## Decisions Made

- Plus's 5,99 €/Monat stays a literal (no `PLUS_PRICE_CENTS` constant exists yet; Plus is unbuilt/undecided-price per the PRD) — correctly out of scope for the "format from constants" requirement, which only names the three live tiers.
- "Benachrichtigen lassen" is a `mailto:${LEGAL.email}` link with a prefilled subject rather than a disabled button, per the plan's "plain link/Btn, no client handler" instruction — genuinely useful (reaches the founder) rather than a dead-end UI element, and still impossible to mistake for a checkout trigger.
- Combined Task 1 and Task 2 into one commit: the plan's own objective calls this a "Full rebuild," and the design deck's banded layout puts the free-tier manifesto between the hero and the ladder (not after the ladder), so building the ladder first and inserting the manifesto second would have meant writing, then immediately restructuring, the same JSX. Writing the final page shape once and committing it as a single `feat` was more honest about what actually happened than two commits with an artificial mid-point.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing critical functionality, or blocking issues encountered.

**Commit-granularity note (not a Rule 1-4 deviation):** Tasks 1 and 2 were both implemented in the same file edit and committed together (`c5df8cb`) instead of as two separate commits. This is a process deviation from the "commit each task individually" default, not a scope or correctness deviation — both tasks' acceptance criteria are fully met (verified via grep + `tsc` + `build` below) and no work from either task was omitted. Flagging explicitly per the self-check discipline this workflow expects.

## Issues Encountered

None.

## Verification

- `grep -cE "PASS_PRICE_CENTS|PAKET_PRICE_CENTS|HUMANIZER_PRICE_CENTS" scanready/src/app/preise/page.tsx` → 6 (well above the required ≥3)
- `grep -c "Geplant" scanready/src/app/preise/page.tsx` → 2
- `grep -c "use client" scanready/src/app/preise/page.tsx` → 0 (still a server component)
- `grep -c "pro Bewerbung" scanready/src/app/preise/page.tsx` → 1 (the per-application math line)
- `grep -c "Kostenlos hei" scanready/src/app/preise/page.tsx` → 1 (manifesto pull quote present)
- `grep -c "Andere CV-Dienste" scanready/src/app/preise/page.tsx` → 2 (heading + comparison column)
- `grep -ciE "cvapp|zety|enhancv|kickresume|rezi|teal|lebenslauf\.de" scanready/src/app/preise/page.tsx` → 0 (no competitor names)
- `grep -rnP "\x{2014}" scanready/src/app/preise/page.tsx` → no matches (no em-dash characters)
- `cd scanready && npx tsc --noEmit` → exits 0
- `cd scanready && npm run build` → exits 0, `/preise` listed as a static (`○`) route
- `cd scanready && npm test` → 121/121 pass

## User Setup Required

None - no external service configuration required. The Plus tier's "Benachrichtigen lassen" CTA points at `LEGAL.email`, which is still the `FOUNDER_TODO` placeholder pending the founder-gate work tracked in `scanready/docs/humanizer-golive.md`; no new gate introduced by this plan.

## Next Phase Readiness

- `/preise` now correctly states the full four-tier ladder including the Pass (07-02's data layer) and the not-yet-buyable Plus tier, so it is safe to link to from distribution content without contradicting what actually ships.
- The Pass and Paket CTAs on this page point at `/app` (matching the existing Humanizer+/Paket CTA convention) since the in-tool purchase surfaces (storage gate, Pass modal) are separate not-yet-executed plans in this phase; no blocker for those plans building on this page's copy or pricing pattern.
- `formatEuroCents()` is currently page-local; if a second surface (e.g. `/konto`) needs the same cents-to-EUR formatting, it should be lifted into a shared lib function rather than duplicated — flagged for whoever builds that surface next, not a blocker now.
- No blockers.

---
*Phase: 07-account-library-honest-pricing-design-reconciliation-phase-a*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: scanready/src/app/preise/page.tsx
- FOUND: .planning/phases/07-account-library-honest-pricing-design-reconciliation-phase-a/07-08-SUMMARY.md
- FOUND commit: c5df8cb
