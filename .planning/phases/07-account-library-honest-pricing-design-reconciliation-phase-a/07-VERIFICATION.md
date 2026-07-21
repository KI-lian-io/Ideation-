---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
verified: 2026-07-07T15:10:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed:
    - "SC-01: /app SavedApplications gallery now uses the EmptyState primitive (status/body/ctaLabel) instead of a bare <p>, and now renders the storage-transparency footer, matching /konto's SavedPackagesSection"
  gaps_remaining: []
  regressions: []
---

# Phase 07: Account Library + Honest Pricing (design Phase A) Verification Report

**Phase Goal:** The six Phase-A design surfaces (01-library, 02-storage-gate, 03-pass, 04-preise, 05-save-moment, 06-founder-assets) are reconciled into the live app behind the existing Stage 3 env gates: saved applications render as a card gallery with rename/duplicate/delete, the save moment becomes an editable-title save card, the free storage limit shows an honest Pass/Plus chooser, the Bewerbungsphase-Pass (14,99 EUR, 30 days, non-renewing, account-required) is purchasable on new rails with DB-tier storage limits, /preise shows the 4-card ladder, and founder assets + 404 ship. Everything stays inert until founder keys exist.

**Verified:** 2026-07-07T15:10:00Z
**Status:** passed
**Re-verification:** Yes, after gap closure (commit 46782a5)

## Goal Achievement

### Observable Truths (mapped to ROADMAP SC-01..SC-08)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-01 | Saved packages render as the card gallery on both /konto and /app with mono date + kebab, serif title, company line, LL/AS/STELLENANZEIGE badges (dashed "fehlt"), inline rename, "Neue Bewerbung aus dieser", delete-with-confirm, NN/g empty state, storage-transparency footer; read-only rows HIDE edit controls; no photos anywhere | VERIFIED | Re-checked against current source after commit `46782a5`. `scanready/src/app/app/page.tsx` (SavedApplications, lines 955-995): the `packages.length === 0` branch now renders `<EmptyState status={t.libraryEmptyStatus} body={t.libraryEmptyBody} ctaLabel={t.libraryEmptyCta} onCtaClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />` (matches the `EmptyState` primitive's `{status, body, ctaLabel, ctaHref?, onCtaClick?}` contract in `src/components/ui.tsx` line 185); a storage-transparency footer (`LockGlyph` + `{t.libraryFooterContents}` + `<a href="/datenschutz">{t.humanizerPrivacyLink}</a>`) now renders at lines 987-995, unconditionally below the gallery section (i.e. it also shows in the empty-state case, a superset of `/konto`'s behavior, not a deficiency). `scanready/src/app/konto/KontoClient.tsx` (SavedPackagesSection, lines 320-383) unchanged and still correct: `EmptyState` with `status/body/ctaLabel/ctaHref="/app"` at line 332, and the same `LockGlyph`+`libraryFooterContents`+datenschutz-link footer at lines 370-378 (rendered inside the non-empty branch only). Both surfaces now satisfy "NN/g empty state" (dashed shelf, aria-live status line, body copy, CTA) and "storage-transparency footer" from SC-01's wording. Card anatomy, kebab actions, inline rename, read-only-hides-rename, and no-photo guardrail were already verified on both surfaces in the initial run and are unchanged by this commit (confirmed via `git show 46782a5 --stat`: only `src/app/app/page.tsx` touched, 41 insertions/1 deletion, scoped to the `SavedApplications` empty-state/footer block) |
| SC-02 | SaveApplicationButton is a save card on BOTH result views: title pre-filled AND pre-selected from derivePackageTitle with provenance line, saved-confirmation panel (checkmark + timestamp + editable title + library link); explicit-save-only | VERIFIED (carried forward) | Unchanged by commit 46782a5. Previously verified: `src/app/app/page.tsx` lines 1200 and 1889 mount `SaveApplicationButton` on both result views; `derivePackageTitle(jobPosting)` feeds the title default; `onFocus={(e) => e.target.select()}` pre-selects; `SavedConfirmationPanel` renders on `state === 'saved'`; `onSave` only called from `handleClick` |
| SC-03 | Migration 0002_pass.sql adds humanizer_purchases.expires_at + kind='pass_30d' (requires user_id) and re-creates enforce_package_limit() with three tiers; PASS_PRICE_CENTS = 1499 exists beside the other price constants | VERIFIED (carried forward) | Unchanged by commit 46782a5. Previously verified against `supabase/migrations/0002_pass.sql`, `0003_pass_requires_user_fix.sql`, and `src/lib/humanizer.ts` |
| SC-04 | /api/pass/intent mints a Pass PaymentIntent ONLY for authenticated users; a live pass window grants PDF export + refinements via the extended entitlement check; anonymous humanizer/paket stateless rails are byte-for-byte untouched | VERIFIED (carried forward) | Unchanged by commit 46782a5. Previously verified against `src/app/api/pass/intent/route.ts`, `src/app/api/pass/verify/route.ts`, `checkPassEntitlement`/`getActivePass` fallback wiring |
| SC-05 | StorageGate replaces the state==='limit' text hint as an inline dismissible panel (Pass featured + Plus "Geplant", honest delete-instead footer, purchase-history anchor variant at 2+ paket purchases, dismissal persisted in sessionStorage, no countdowns or fake scarcity) | VERIFIED (carried forward) | Unchanged by commit 46782a5. Previously verified against `src/components/StorageGate.tsx` and its wiring into `app/page.tsx`'s `state === 'limit'` branch |
| SC-06 | PassModal mirrors PaketModal's payment UX with the DISTINCT proportional §356(4)/§357a Widerruf (not Paket's §356(5)); active chip + storage meter and a neutral expired state exist; new copy flagged for legal review | VERIFIED (carried forward) | Unchanged by commit 46782a5. Previously verified against `src/components/PassModal.tsx` and `PassStatusChip.tsx` |
| SC-07 | /preise shows the 4-card ladder (2,99 / 4,99 / 14,99 featured with per-application math / Plus 5,99 "Geplant" non-buyable), the free-tier manifesto pull quote, and the anti-Abofalle before/after comparison; prices match the code constants | VERIFIED (carried forward) | Unchanged by commit 46782a5. Previously verified against `src/app/preise/page.tsx` |
| SC-08 | Six founder SVGs in public/, favicon + openGraph.images wired in layout.tsx, not-found.tsx built from surface 06; tsc/tests/build all pass; no em-dash in new copy; new surfaces inert when env vars unset | VERIFIED | Re-confirmed at HEAD after the fix commit: `npx tsc --noEmit` exit 0; `npm test` 122/122 pass (re-run live for this verification, all green, no regressions from `46782a5`); founder SVGs, `layout.tsx` metadata, and `not-found.tsx` unchanged by this commit |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scanready/src/components/ui.tsx` | SheetCard, KebabMenu, InlineRenameField, MonoBadge, EmptyState, BottomSheet, SavedConfirmationPanel | VERIFIED | All seven exports found via grep; `EmptyState` contract (`status/body/ctaLabel/ctaHref?/onCtaClick?`) confirmed at line 185, consumed correctly by both callers |
| `scanready/src/app/globals.css` | shadow-sheet/shadow-sheet-hero/shadow-modal tokens | VERIFIED | All three `--shadow-*` tokens present in `@theme` |
| `scanready/src/app/not-found.tsx` | Surface-06 misprint-correction 404 | VERIFIED | 98 lines, server component, zero animation classes |
| `scanready/src/app/layout.tsx` | icons + openGraph.images metadata | VERIFIED | Both present, reference new assets |
| `scanready/supabase/migrations/0002_pass.sql` | expires_at, three-tier limit, pass_30d constraint | VERIFIED | All elements present; CR-01 flaw fixed forward in 0003 |
| `scanready/src/lib/humanizer.ts` | PASS_PRICE_CENTS = 1499 | VERIFIED | Plus PASS_STORAGE_CAP=25, PASS_WINDOW_DAYS=30 (WR-01 fix) |
| `scanready/src/lib/account.ts` | checkPassEntitlement, updatePackageTitle, getActivePass, listPaketPurchases | VERIFIED | All four exist (async functions) |
| `scanready/src/app/api/pass/intent/route.ts` | Auth-gated Pass PaymentIntent minting | VERIFIED | 401 without session; feature=pass + user_id metadata |
| `scanready/src/app/api/pass/verify/route.ts` | Server-side verification + idempotent write | VERIFIED | Ownership check + service-role upsert with onConflict |
| `scanready/src/app/app/page.tsx` | SaveApplicationButton save card + gallery + StorageGate + PassModal + EmptyState + storage footer | VERIFIED | Gap closed in commit `46782a5`: EmptyState (body+CTA) and storage-transparency footer now both present |
| `scanready/src/app/konto/KontoClient.tsx` | Card gallery, PassSection, SubscriptionSection fix | VERIFIED | Includes WR-02 fix (`.eq('user_id', userId)`); EmptyState + footer confirmed present and unchanged |
| `scanready/src/components/StorageGate.tsx` | Inline dismissible chooser | VERIFIED | |
| `scanready/src/components/PassModal.tsx` + `PassStatusChip.tsx` | Purchase modal + lifecycle chip | VERIFIED | Split into two files for Stripe-cookie isolation |
| `scanready/src/app/preise/page.tsx` | Four-card ladder + manifesto + anti-Abofalle | VERIFIED | |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `layout.tsx` | `public/favicon.svg`, `og-scanready.svg` | metadata | WIRED | Confirmed via grep |
| `account.ts` | `0002_pass.sql` | `getActivePass` queries `pass_30d` + `expires_at > now()` | WIRED | Confirmed in account.ts source |
| `humanize/route.ts`, `paket/verify/route.ts` | `account.ts` | `checkPassEntitlement`/`getActivePass` fallback | WIRED | Confirmed additive branch, PI-first path unmodified |
| `pass/verify/route.ts` | `0002_pass.sql` | inserts `pass_30d` row with `expires_at` = now+30d | WIRED | Confirmed via PASS_WINDOW_DAYS-derived expiresAt |
| `app/page.tsx` | `lebenslauf-utils.ts` | `derivePackageTitle(jobPosting)` title pre-fill | WIRED | Confirmed |
| `app/page.tsx` | `ui.tsx` | `SavedConfirmationPanel` on save success; `EmptyState` on empty gallery | WIRED | Both confirmed; `EmptyState` wiring closed the SC-01 gap |
| `KontoClient.tsx` | `account.ts` | rename via `updatePackageTitle`; list/delete via `listPackages`/`deletePackage` | WIRED | Confirmed |
| `app/page.tsx` | `app/page.tsx` (self) | "Neue Bewerbung aus dieser" reuses `LOAD_PACKAGE` with empty posting | WIRED | `handleDuplicatePackage` confirmed, no auto-save |
| `StorageGate.tsx` | `account.ts` | anchor variant via `listPaketPurchases` | WIRED | Confirmed, gated on `purchases.length >= 2` |
| `app/page.tsx` | `StorageGate.tsx` | rendered in `state==='limit'` branch | WIRED | Confirmed, `onChoosePass` opens PassModal |
| `PassModal.tsx` | `/api/pass/intent`, `/api/pass/verify` | fetch + Stripe Elements + fulfillment write | WIRED | Confirmed |
| `preise/page.tsx` | `humanizer.ts` | imports and formats all three live-tier price constants | WIRED | Confirmed, 6 references |
| `app/page.tsx` gallery | `/datenschutz` | storage-transparency footer link | WIRED | Confirmed present in both surfaces (previously missing on `/app`, now closed) |

### Requirements Coverage

No formal REQUIREMENTS.md IDs are mapped to this phase (spec lives in `scanready/docs/design-impl-plan-library-pricing.md` + `scanready/docs/prd-account-library-pricing.md`, per ROADMAP). The 8 ROADMAP Success Criteria (SC-01..SC-08) were used as the requirement set and are all VERIFIED after the fix.

### Anti-Patterns Found

None remaining. The two Warning-level anti-patterns from the prior run (bare `<p>` empty state, missing storage-transparency footer in `/app`) are both resolved in commit `46782a5`; re-grepped `scanready/src/app/app/page.tsx` for stray `<p>{t.libraryEmptyStatus}</p>` patterns and found none - the only reference to `libraryEmptyStatus` is now inside the `EmptyState` call.

No debt markers (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) found in `scanready/src/app/app/page.tsx` at HEAD. No em-dash characters introduced by commit `46782a5` (diff re-checked). No photo field (`photoUrl`) read or rendered inside either gallery's `PackageCard` component.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck | `cd scanready && npx tsc --noEmit` | exit 0 | PASS |
| Full test suite (re-run for this verification) | `cd scanready && npm test` | 122/122 pass | PASS |
| Production build | `cd scanready && npm run build` | exit 0 (per orchestrator run at HEAD after `46782a5`) | PASS |
| EmptyState wiring on `/app` | `grep -n "EmptyState" src/app/app/page.tsx` | one call site, with `status`/`body`/`ctaLabel`/`onCtaClick` all supplied | PASS |
| Storage-transparency footer on `/app` | `grep -n "libraryFooterContents" src/app/app/page.tsx` | present at line 990, rendered unconditionally below the gallery | PASS |
| Storage-transparency footer on `/konto` | `grep -n "libraryFooterContents" src/app/konto/KontoClient.tsx` | present at line 373, rendered in the non-empty branch | PASS |

### Code Review Cross-Check (07-REVIEW.md)

All four fix-required findings from the code review remain verified fixed in current source (unchanged by commit 46782a5):
- **CR-01** (GDPR deletion regression): `0003_pass_requires_user_fix.sql` INSERT-only trigger confirmed present.
- **WR-01** (PASS_WINDOW_DAYS duplication): single source in `humanizer.ts` confirmed.
- **WR-02** (SubscriptionSection missing user_id filter): `.eq('user_id', userId)` confirmed.
- **WR-03** (purchase-history keyed by created_at): `listPaketPurchases` keyed by `id` confirmed.
- **IN-01** (dead i18n keys) left open by design per the review's own note; not a phase-goal blocker. Note: this re-verification confirms `libraryEmptyBody` and `libraryEmptyCta` are no longer dead on `/app` - the fix commit put both keys into active use, further shrinking IN-01's scope.

### Human Verification Required

None. All must-haves in this phase resolve to automated evidence (grep/tsc/test/build).

### Gaps Summary

No gaps remain. The single gap from the initial verification (SC-01: `/app` SavedApplications gallery missing the `EmptyState` primitive and the storage-transparency footer) was closed in commit `46782a5`, confirmed against current source: `scanready/src/app/app/page.tsx` now renders `EmptyState` with `status`/`body`/`ctaLabel`/`onCtaClick` for the empty-gallery case, and renders the `LockGlyph` + `libraryFooterContents` + datenschutz-link footer unconditionally below the gallery. `scanready/src/app/konto/KontoClient.tsx` is unchanged and remains correct. One minor, non-blocking asymmetry is noted for awareness only: `/app`'s footer renders even when the gallery is empty, while `/konto`'s footer only renders in the non-empty branch. This is a superset, not a deficiency, and does not contradict SC-01's wording (which only requires the footer exist on both surfaces) - no action required.

The founder-gated items (Stripe keys, PostHog key, legal-data FOUNDER_TODOs, native-speaker review of the new Pass Widerruf wording) remain intentionally out of scope for this phase and are not counted as gaps.

---

_Verified: 2026-07-07T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
