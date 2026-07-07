---
phase: 07-account-library-honest-pricing-design-reconciliation-phase-a
reviewed: 2026-07-07T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - scanready/src/app/api/humanize/route.ts
  - scanready/src/app/api/paket/verify/route.ts
  - scanready/src/app/api/pass/intent/route.ts
  - scanready/src/app/api/pass/verify/route.ts
  - scanready/src/app/app/page.tsx
  - scanready/src/app/de/page.tsx
  - scanready/src/app/globals.css
  - scanready/src/app/konto/KontoClient.tsx
  - scanready/src/app/layout.tsx
  - scanready/src/app/not-found.tsx
  - scanready/src/app/page.tsx
  - scanready/src/app/preise/page.tsx
  - scanready/src/components/PassModal.tsx
  - scanready/src/components/PassStatusChip.tsx
  - scanready/src/components/StorageGate.tsx
  - scanready/src/components/ui.tsx
  - scanready/src/lib/__tests__/account.test.ts
  - scanready/src/lib/__tests__/humanizer.test.ts
  - scanready/src/lib/account.ts
  - scanready/src/lib/analytics.ts
  - scanready/src/lib/humanizer.ts
  - scanready/src/lib/i18n.tsx
  - scanready/supabase/migrations/0002_pass.sql
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: fixed_critical_warning
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** fixed_critical_warning (CR-01, WR-01, WR-02, WR-03 fixed; IN-01 left open by design, see note at bottom)

## Summary

Reviewed the Bewerbungsphase-Pass feature (API routes, migration, account helpers, UI) plus the surrounding library/pricing surfaces (KontoClient, StorageGate, PassModal/PassStatusChip, ui.tsx primitives, i18n dictionary, app/page.tsx). The route-level security guardrails called out in the review brief hold up under inspection: `/api/pass/intent` correctly 401s without a session, `/api/pass/verify` checks PI ownership (`metadata.user_id === user.id`) and `metadata.feature === 'pass'` before ever writing a row, the anonymous Stripe-as-token paths in `/api/humanize` and `/api/paket/verify` are untouched by the new Pass fallback (gated behind `accountsEnabled() && user`), and every read helper in `account.ts` that returns purchase/package history scopes to `user_id` and additionally relies on RLS. No em-dash characters were found in any reviewed file. No photo data is read or rendered in any saved-package card. Rename controls are correctly hidden (not just disabled) for `read_only` rows in both galleries. No auto-save path exists outside explicit user clicks.

One cross-migration BLOCKER was found: the new `humanizer_purchases_pass_requires_user` check constraint in `0002_pass.sql` conflicts with the `ON DELETE SET NULL` foreign-key behavior established in `0001_stage3_accounts.sql`, which will make `delete_own_account()` fail for any user who has ever purchased a Bewerbungsphase-Pass. Three warnings and one info-level dead-code item round out the rest.

## Critical Issues

### CR-01: New check constraint breaks GDPR account deletion for any Pass purchaser

**Status:** fixed (commit `8ca5982`). 0002_pass.sql was left untouched (already applied live); a forward-fix migration `scanready/supabase/migrations/0003_pass_requires_user_fix.sql` drops the CHECK constraint and replaces it with an INSERT-only trigger (`enforce_pass_requires_user`) that enforces the same "pass rows always have a user_id" invariant without blocking the FK-driven UPDATE that account deletion relies on. This migration must still be applied to the live Supabase project.

**File:** `scanready/supabase/migrations/0002_pass.sql:38-49`
**Issue:**
`0001_stage3_accounts.sql` defines `humanizer_purchases.user_id` as `references auth.users (id) on delete set null` (line 265 of that migration), specifically so purchase receipts survive account deletion. `delete_own_account()` (also in 0001) is a one-liner: `delete from auth.users where id = auth.uid();` — it relies entirely on that FK's `ON DELETE SET NULL` action to null out the caller's `humanizer_purchases.user_id` rows as part of the same transaction.

`0002_pass.sql` now adds:
```sql
alter table public.humanizer_purchases
  add constraint humanizer_purchases_pass_requires_user
  check (kind <> 'pass_30d' or user_id is not null);
```
This constraint is checked on every UPDATE, including the implicit UPDATE Postgres performs to enact `ON DELETE SET NULL`. For any user who has ever purchased a Bewerbungsphase-Pass (kind = `'pass_30d'`), the referential-action UPDATE tries to set `user_id = NULL` on that row, which violates this new CHECK constraint (`kind <> 'pass_30d'` is false, and `user_id is not null` is about to become false). The UPDATE fails, the FK action fails, and the whole `DELETE FROM auth.users` transaction inside `delete_own_account()` aborts with a Postgres constraint-violation error.

Net effect: any signed-in user who bought a Pass can no longer delete their account (GDPR Art. 17), which the project's own guardrails call out as a documented capability (`account.ts`'s `deleteAccount()` doc comment: "Cascades ... humanizer_purchases rows survive with user_id set to null"). This is a functional regression introduced purely by this migration's interaction with the prior one — nothing in `0002_pass.sql`'s own tests or comments account for it.

**Fix:** Either relax the constraint so it does not apply to rows being nulled out by account deletion, or make account deletion remove `pass_30d` rows outright instead of relying on `SET NULL` for them, e.g.:
```sql
-- Option A: hard-delete pass_30d rows before the auth.users delete cascades
-- (they are account-bound entitlements, not anonymous receipts, so losing
-- them on account deletion is defensible — unlike humanizer/paket receipts).
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.humanizer_purchases
    where user_id = auth.uid() and kind = 'pass_30d';
  delete from auth.users where id = auth.uid();
end;
$$;
```
or, if pass receipts must also survive deletion like the other kinds, drop the `user_id is not null` requirement and instead enforce "pass rows are created with a user_id" purely at insert time (e.g. via `/api/pass/verify`'s application logic, which already guarantees this), without a standing CHECK constraint that fights the deletion cascade.

## Warnings

### WR-01: Pass expiry window (30 days) hardcoded in three places, one of them display-only

**Status:** fixed (commit `ef4ee35`). `PASS_WINDOW_DAYS` now lives in `scanready/src/lib/humanizer.ts` beside `PASS_PRICE_CENTS`/`PASS_STORAGE_CAP`; both `api/pass/verify/route.ts` and `PassModal.tsx` import it, and `humanizer.test.ts` asserts `PASS_WINDOW_DAYS === 30`.

**File:** `scanready/src/app/api/pass/verify/route.ts:11`, `scanready/src/components/PassModal.tsx:46`
**Issue:** `PASS_WINDOW_DAYS = 30` is independently declared in the server route that actually computes and persists `expires_at` (the authoritative value) and again in `PassModal.tsx`, which uses its own copy purely to render "Endet automatisch am TT.MM.JJJJ" in the purchase modal before payment. Unlike `PASS_PRICE_CENTS` and `PASS_STORAGE_CAP` — which live in `src/lib/humanizer.ts` specifically so the UI and the server can never drift, with a doc comment calling out the duplication risk — this constant has no single source of truth and no comment flagging the duplication. If the founder-open decision on the Pass window (PRD section 9) changes the 30-day figure and only one of the two locations is updated, the modal would advertise an incorrect expiry date to the buyer before they pay.
**Fix:** Move `PASS_WINDOW_DAYS` into `src/lib/humanizer.ts` alongside `PASS_PRICE_CENTS`/`PASS_STORAGE_CAP` and import it in both `api/pass/verify/route.ts` and `PassModal.tsx`.

### WR-02: SubscriptionSection query has no explicit user_id filter, unlike every sibling query

**Status:** fixed (commit `7dfc970`). `userId` is now threaded from `KontoClient` into `SubscriptionSection`, which adds `.eq('user_id', userId)` to the subscriptions query, matching the defense-in-depth convention used by every sibling read in this file.

**File:** `scanready/src/app/konto/KontoClient.tsx:411-419`
**Issue:** `SubscriptionSection` reads the signed-in user's subscription via:
```ts
client.from('subscriptions').select('stripe_subscription_id,status,current_period_end')
  .order('created_at', { ascending: false }).limit(1).maybeSingle()
```
with no `.eq('user_id', ...)` clause. Every other Stage 3 read in this same file and in `account.ts` (`listPackages`, `getActivePass`, `getLatestPass`, `listPaketPurchases`) explicitly filters by `user_id` as defense-in-depth even though RLS is expected to scope the read anyway. This query relies solely on RLS with no client-side backstop: if the `subscriptions` table's select-own RLS policy is ever accidentally loosened (e.g. during a future migration or an advisor-suggested policy tweak), this call would silently return the most-recently-created subscription row across all users instead of erroring, and the UI would show — and the cancel-link would target — someone else's subscription status.
**Fix:** Add `.eq('user_id', user.id)` (the `userId` is already available as a prop to `KontoClient`/could be threaded to `SubscriptionSection`) to match the defense-in-depth convention used everywhere else in this file.

### WR-03: Purchase-history list keyed by `created_at`, which is not guaranteed unique

**Status:** fixed (commit `c940ac7`). `listPaketPurchases` now selects and returns the row's `id`; `StorageGate.tsx` keys the ledger rows by `p.id` instead of `p.created_at`.

**File:** `scanready/src/components/StorageGate.tsx:226-231`
**Issue:**
```tsx
{purchases.map((p) => (
  <div key={p.created_at} className="flex justify-between gap-4 font-mono text-xs text-slate">
```
`p.created_at` (a Postgres `timestamptz` string) is used as the React list key. If two `paket` purchase rows for the same user ever share an identical `created_at` value (e.g. a retried insert with a coarser client clock, or two rows created in the same transaction batch), React would see a duplicate key and could misattribute DOM state between the two line items during reconciliation.
**Fix:** Use the row's primary key if `listPaketPurchases` is extended to select it, or key on `` `${p.created_at}-${p.amount_cents}` `` as a cheap uniqueness improvement without a schema change.

## Info

### IN-01: Dead i18n dictionary keys

**Status:** not fixed (deliberately left open). These keys belong to design copy decks that later library/gallery surfaces may still use; removing them now would risk re-translating them later. Not addressed in this fix pass.

**File:** `scanready/src/lib/i18n.tsx`
**Issue:** The following `Dict` keys are defined (with full EN + DE copy) but never referenced anywhere outside `i18n.tsx`: `uploadGenericError`, `savedApplicationsHeading`, `savedApplicationsUpdated`, `savedApplicationsReadOnlyBadge`, `savedApplicationsOpen`, `savedApplicationsEmpty`, `libraryStorageFree`, `kontoSavedHeading`, `kontoSavedHint`, `kontoDeleteCta`, `saveApplicationLimitHint`. These appear to be leftovers from an earlier iteration of the library/gallery UI (superseded by `libraryTitle`/`libraryEmptyStatus`/etc. and the `KontoClient.tsx` sections actually in use) and add translation-maintenance overhead (11 keys x 2 languages) for copy nobody sees.
**Fix:** Remove the unused keys from both the `Dict` type and the `en`/`de` objects, or confirm they are staged for a near-term UI addition and leave a comment saying so.

---

_Reviewed: 2026-07-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
