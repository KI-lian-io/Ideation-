-- ScanReady Bewerbungsphase-Pass: expires_at column, pass_30d user_id
-- constraint, and a three-tier enforce_package_limit() (subscription /
-- live pass / free).
--
-- Run this once, in full, against the same Frankfurt project that already
-- has 0001_stage3_accounts.sql applied (see docs/stage3-accounts.md for the
-- apply + advisor runbook this migration follows).
--
-- Scope: this migration only affects signed-in account holders. The
-- anonymous humanizer/paket rails (Stripe-as-token, no user_id) are
-- untouched: a pass_30d row always carries a user_id, but the existing
-- 'humanizer' and 'paket' kinds keep user_id nullable exactly as in 0001.
--
-- Design source: .planning/phases/07-account-library-honest-pricing-design-reconciliation-phase-a/
-- (07-CONTEXT.md A1, 07-PATTERNS.md migration section).

-- ---------------------------------------------------------------------------
-- 1. humanizer_purchases.expires_at
-- ---------------------------------------------------------------------------
-- Nullable: only pass_30d rows ever set this. humanizer/paket rows leave it
-- null forever (they are single-use tokens, not time windows).

alter table public.humanizer_purchases
  add column if not exists expires_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. pass_30d rows require an owner
-- ---------------------------------------------------------------------------
-- A Pass is an account-required entitlement (07-CONTEXT.md A1: "/api/pass/
-- intent REQUIRES an authenticated user, unlike paket/humanizer"). This
-- check constraint makes that a schema-level guarantee, not just a route
-- convention: it is a no-op for every other kind (humanizer, paket), which
-- keep user_id nullable, and only binds when kind = 'pass_30d'.
--
-- Wrapped in a do-block guard (Postgres has no "add constraint if not
-- exists"), matching the idempotency style used throughout 0001 for
-- objects that lack native "if not exists" support.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'humanizer_purchases_pass_requires_user'
  ) then
    alter table public.humanizer_purchases
      add constraint humanizer_purchases_pass_requires_user
      check (kind <> 'pass_30d' or user_id is not null);
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. enforce_package_limit(): three tiers
-- ---------------------------------------------------------------------------
-- Re-creates the trigger function from 0001 with a new middle tier inserted
-- between the subscription check and the free-tier count: an active
-- Bewerbungsphase-Pass raises the storage cap from 1 to 25. The advisory
-- lock stays the FIRST statement, verbatim, because it is the race guard
-- for ALL three tiers, not just the free one (two concurrent inserts must
-- not both pass the count check regardless of which tier they are counted
-- against).
--
-- The two read-only downgrade helper functions defined in 0001 are
-- untouched: Pass expiry reuses that existing downgrade path unchanged
-- (the newest package stays editable, older ones flip to read_only), same
-- as a subscription lapsing.

create or replace function public.enforce_package_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  has_active_subscription boolean;
  has_live_pass boolean;
  existing_count integer;
begin
  -- Serialize inserts per user: under READ COMMITTED two concurrent inserts
  -- could both count 0 existing packages and both pass. The xact-scoped
  -- advisory lock makes the second insert wait until the first commits, so
  -- its count() sees the committed row. This guards every tier below.
  perform pg_advisory_xact_lock(hashtext('package_limit:' || new.user_id::text));

  select exists (
    select 1 from public.subscriptions
    where user_id = new.user_id
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  ) into has_active_subscription;

  if has_active_subscription then
    return new;
  end if;

  select exists (
    select 1 from public.humanizer_purchases
    where user_id = new.user_id
      and kind = 'pass_30d'
      and expires_at > now()
  ) into has_live_pass;

  select count(*) into existing_count
  from public.application_packages
  where user_id = new.user_id;

  if has_live_pass then
    if existing_count >= 25 then
      raise exception 'package_limit' using errcode = 'P0001';
    end if;
  else
    if existing_count >= 1 then
      raise exception 'package_limit' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- The trigger itself (trg_enforce_package_limit, defined in 0001) already
-- points at this function by name; create or replace above is sufficient,
-- no drop/recreate of the trigger is needed.

-- No new callable RPC is added by this migration, so no new grant
-- hardening is required. enforce_package_limit() keeps the same revoke-all
-- treatment already applied in 0001 (it is a trigger function, invoked only
-- via its trigger, never as a direct RPC).
