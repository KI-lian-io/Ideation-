---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
plan: 05
subsystem: payments
tags: [stripe, supabase, subscriptions, i18n, nextjs]

# Dependency graph
requires:
  - phase: 08-04
    provides: StatusChip pattern and the standing i18n Dict/en/de lockstep convention this plan extends with plus.* keys
  - phase: 07-stage3-accounts
    provides: subscriptions table, subscriptions_select_own RLS, /api/subscription/cancel + /api/subscription/checkout, the webhook's customer.subscription.* upsert, isActiveStatus/mapStripeSubscription in subscription.ts
provides:
  - cancel_at_period_end on StripeSubscriptionLike / SubscriptionRow / mapStripeSubscription (undefined -> false), flowed into the webhook upsert
  - POST /api/subscription/reactivate - un-cancel route mirroring cancel/route.ts's guard order and dual-write model
  - /konto SubscriptionSection cancelled-but-running and expired states with a working "Kuendigung zuruecknehmen" action
  - plus.* i18n key group (8 keys) in Dict/en/de, DE lifted from the 09-plus design deck
  - founder-gate note in stage3-accounts.md flagging the renewal-reminder email as deliberately not built
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Un-cancel route is a near-literal mirror of cancel/route.ts: same enforceSameOrigin -> enforceRateLimit -> accountsEnabled/isStripeConfigured 503 -> auth 401 guard chain, same RLS-scoped subscriptions select, same 'Stripe is the source of truth, the webhook is the durable sync path' comment convention -- no client-side subscriptions row write in either route"
    - "SubscriptionSection's isCancelling/isExpired branches sit alongside the existing isActive/none split rather than replacing it, keeping the untouched branches literally unchanged in the diff"
    - "Expired state is styled identically to the active/cancelled states (border-hair badge, text-muted body) rather than any red/error treatment, matching the plan's 'neutral, never red' requirement since an ended subscription is an expected outcome, not a failure"

key-files:
  created:
    - scanready/src/app/api/subscription/reactivate/route.ts
  modified:
    - scanready/src/lib/subscription.ts
    - scanready/src/lib/__tests__/subscription.test.ts
    - scanready/src/app/api/stripe/webhook/route.ts
    - scanready/src/app/konto/KontoClient.tsx
    - scanready/src/lib/i18n.tsx
    - scanready/docs/stage3-accounts.md

key-decisions:
  - "SubscriptionSection's Supabase read was refactored into a refresh() function (rather than staying inline in the mount effect) so handleReactivate can re-fetch the row after a successful un-cancel, following the same refresh()-after-mutation shape already used by SavedPackagesSection/CvSection in the same file"
  - "plusPassAlternative's EUR price is written as the literal '14,99 €' string (comma decimal, euro sign) in BOTH the EN and DE dictionary entries, matching the codebase's existing convention (passPayCta, humanizerCta, etc. do the same in English strings) rather than introducing a new Intl-formatted price for a single link"
  - "The reactivate route's 404 error copy ('Fuer dieses Konto besteht keine gekuendigte Buchung.') is a direct adaptation of cancel/route.ts's 404 copy rather than the 09 deck's copy deck, since the deck's 1c table covers only plus.cancel.button/plus.cancelled.body/plus.email.* and has no un-cancel-specific error string to lift verbatim"

requirements-completed: [SC-04, SC-05, SC-06]

# Metrics
duration: 20min
completed: 2026-07-19
status: complete
---

# Phase 8 Plan 5: Plus subscription lifecycle (cancelled-but-running + expired + un-cancel) Summary

**cancel_at_period_end now flows Stripe -> mapStripeSubscription -> the webhook upsert, a new /api/subscription/reactivate route mirrors cancel/route.ts's guard chain to flip it back to false, and /konto renders the cancelled-but-running (paid-until date + "Kuendigung zuruecknehmen") and neutral expired (Pass cross-sell, never red) states from real rows.**

## Performance

- **Duration:** ~20 min (4785b23 to 00ab13f)
- **Started:** 2026-07-19
- **Completed:** 2026-07-19T20:03:50Z
- **Tasks:** 3
- **Files modified:** 6 (1 new)

## Accomplishments

- `subscription.ts`: `cancel_at_period_end?: boolean` added to `StripeSubscriptionLike`, `cancel_at_period_end: boolean` added to `SubscriptionRow`, and `mapStripeSubscription` returns `sub.cancel_at_period_end ?? false` (default mirrors migration 0004's DB column default). File's pure-no-I/O discipline and `.ts`-extension import convention untouched.
- `subscription.test.ts`: three new tests covering true/false/absent mapping of `cancel_at_period_end`; full suite is 142/142 green.
- `webhook/route.ts`: the `customer.subscription.*` upsert now writes `cancel_at_period_end: row.cancel_at_period_end`; the `isActiveStatus` branch calling `clear_packages_read_only`/`mark_packages_read_only` is untouched (reactivating flips only `cancel_at_period_end`, never `status`).
- New `scanready/src/app/api/subscription/reactivate/route.ts`: POST route, `runtime = "nodejs"`, guard order identical to `cancel/route.ts` (`enforceSameOrigin` -> `enforceRateLimit(req, "intent")` -> `accountsEnabled()/isStripeConfigured()` 503 -> `getSupabaseServerClient().auth.getUser()` 401). Selects the caller's own subscriptions rows (RLS-scoped), filters to `isActiveStatus(status) && cancel_at_period_end` (404 with German copy otherwise), and calls `getStripe().subscriptions.update(id, { cancel_at_period_end: false })` per matching row. No client-side subscriptions row write - the webhook is the durable sync path, same dual-write acceptance as cancel.
- `KontoClient.tsx` `SubscriptionSection`: local `SubscriptionRow` type and the `.select(...)` string both carry `cancel_at_period_end`; the read was refactored into a `refresh()` function so the new `handleReactivate` (mirrors `handleSubscribe`'s fetch-then-branch) can re-fetch after a successful un-cancel. Two new render branches added alongside the untouched `isActive`/none split: `isCancelling` (paid-until date via `plusCancelledBody`, the `plusCancelledDowngrade` explainer, a `plusUncancelCta` button, error text on failure) and `isExpired` (a NEUTRAL styled state - same border-hair badge treatment as the cancelled state, no red - with `plusExpiredBody`/`plusExpiredBadge` and a `plusPassAlternative` link to `/preise`). Plus itself stays non-buyable everywhere; no new Plus purchase path was added.
- `i18n.tsx`: `plusCancelledBadge`, `plusCancelledBody`, `plusCancelledDowngrade`, `plusUncancelCta`, `plusUncancelError`, `plusExpiredBadge`, `plusExpiredBody`, `plusPassAlternative` added to `Dict`/`en`/`de` in lockstep. DE strings for `plusCancelledBadge`, `plusCancelledBody`, and `plusCancelledDowngrade` are lifted verbatim from `09-plus.dc.html`'s 1a card mockup and 1c copy-deck table (real umlauts, real €); `plusExpiredBadge`/`plusExpiredBody`/`plusPassAlternative` follow the mockup's copy with the plan's specified wording (no hardcoded package count). `plusUncancelCta`/`plusUncancelError` are newly authored in the same tone (the deck has no un-cancel button state).
- `stage3-accounts.md`: new `## 9. Plus subscription lifecycle (08-05)` section documenting what shipped and flagging the renewal-reminder email (09-plus deck item 1b) as a deliberate founder gate (transactional email provider decision, PRD 6.4), plus flagging all new German copy and the reactivate route's error strings for native-speaker + legal review.

## Task Commits

Each task was committed atomically:

1. **Task 1: cancel_at_period_end in subscription.ts + test + webhook sync** - `4785b23` (feat)
2. **Task 2: /api/subscription/reactivate route (un-cancel)** - `0dcdff2` (feat)
3. **Task 3: /konto cancelled-but-running + expired states + un-cancel wiring + plus.\* copy + reminder-email founder gate** - `00ab13f` (feat)

**Plan metadata:** committed alongside this summary.

## Files Created/Modified

- `scanready/src/lib/subscription.ts` - `cancel_at_period_end` on the two types and the mapper
- `scanready/src/lib/__tests__/subscription.test.ts` - true/false/absent mapping tests
- `scanready/src/app/api/stripe/webhook/route.ts` - upsert writes `cancel_at_period_end`
- `scanready/src/app/api/subscription/reactivate/route.ts` (new) - un-cancel POST route
- `scanready/src/app/konto/KontoClient.tsx` - `SubscriptionSection`'s two new states + `handleReactivate`
- `scanready/src/lib/i18n.tsx` - `plus.*` key group in `Dict`/`en`/`de`
- `scanready/docs/stage3-accounts.md` - founder-gate note (renewal-reminder email not built)

## Decisions Made

See `key-decisions` in frontmatter above (refresh()-after-mutation refactor, literal EUR price string in both languages, adapted 404 copy for the reactivate route).

## Deviations from Plan

None - plan executed exactly as written. The plan's own action text already specified the exact DE/EN wording for every `plus.*` key except `plusUncancelCta`/`plusUncancelError`, which it explicitly asked to author faithfully; no Rule 1-4 auto-fixes were needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration 0004's `cancel_at_period_end` column (needed for this plan's TypeScript to match the live schema) is already committed in the migration file; its live apply remains blocked on the paused Supabase project per 08-01's standing founder gate, and this plan's changes do not touch the live DB.

## Next Phase Readiness

- The Plus subscription lifecycle (active / cancelled-but-running / expired, un-cancel) is complete and self-contained on `/konto`; no further phase depends on this plan's output per the roadmap (`affects: []`).
- Full test suite (142/142), `tsc --noEmit`, and `next build` all green.
- **Founder gates still open**, tracked in `scanready/docs/stage3-accounts.md` §9 and the standing `humanizer-golive.md`/`stage3-accounts.md` gates: (1) the renewal-reminder email (transactional provider decision, PRD 6.4) is deliberately not built this phase; (2) all new German copy (`plusCancelledBadge`, `plusCancelledBody`, `plusCancelledDowngrade`, `plusUncancelCta`, `plusUncancelError`, `plusExpiredBadge`, `plusExpiredBody`, `plusPassAlternative`) plus the reactivate route's German error strings need native-speaker + legal review before the subscription goes live; (3) migration 0004's live apply (including this plan's `cancel_at_period_end` column) is still blocked on the paused Supabase project.
- No em-dash in any touched file.

---
*Phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-*
*Completed: 2026-07-19*

## Self-Check: PASSED

All seven modified/created files (`scanready/src/lib/subscription.ts`, `scanready/src/lib/__tests__/subscription.test.ts`, `scanready/src/app/api/stripe/webhook/route.ts`, `scanready/src/app/api/subscription/reactivate/route.ts`, `scanready/src/app/konto/KontoClient.tsx`, `scanready/src/lib/i18n.tsx`, `scanready/docs/stage3-accounts.md`) and all three task commit hashes (4785b23, 0dcdff2, 00ab13f) verified present.
