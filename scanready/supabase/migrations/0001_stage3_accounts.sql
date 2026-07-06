-- ScanReady Stage 3 accounts: schema + RLS + free/paid guard.
--
-- Run this once, in full, in the Supabase SQL editor of a fresh EU-region
-- project (see docs/stage3-accounts.md for the full setup runbook).
--
-- Scope: this migration only affects signed-in account holders. The
-- anonymous tool flow at /app never touches these tables and stays
-- fully stateless (CLAUDE.md non-negotiable guardrail).
--
-- Design source: docs/superpowers/specs/2026-07-03-monetization-humanizer-design.md
-- (D4 free/paid boundary, D5 retention scope, D7 stack). Data model: CV +
-- application packages (1 CV -> many application packages), not "multiple
-- resumes".

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
-- Mirrors auth.users 1:1. Holds the Stripe customer id once the account
-- links a subscription (Stage 3 billing, built alongside this or later).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Deliberately no insert/delete policy for regular clients: profiles are
-- created by the trigger below (security definer, bypasses RLS) and removed
-- only via delete_own_account() (also security definer). No public access.

-- Auto-insert a profile row whenever a new auth.users row appears (e.g. right
-- after Google OAuth completes). security definer: this function must be
-- able to write to public.profiles even though the invoking session (Supabase
-- Auth's internal service role during signup) has no profiles RLS policy of
-- its own yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. subscriptions
-- ---------------------------------------------------------------------------
-- One row per Stripe subscription. status/current_period_end mirror Stripe's
-- webhook payload (webhook handler is a follow-up task; this table is ready
-- for it). A user may accumulate historical rows (cancel + resubscribe);
-- the free/paid guard below always checks for an active/trialing one.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy for regular clients: subscriptions are
-- written only by the (future) Stripe webhook handler using the service
-- role key, which bypasses RLS entirely. Regular users never write here.

-- ---------------------------------------------------------------------------
-- 3. cvs
-- ---------------------------------------------------------------------------
-- The account-holder's saved source CV text. One CV can back many
-- application_packages (see FK below).

create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Lebenslauf',
  cv_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cvs enable row level security;

create policy "cvs_select_own" on public.cvs
  for select using (auth.uid() = user_id);

create policy "cvs_insert_own" on public.cvs
  for insert with check (auth.uid() = user_id);

create policy "cvs_update_own" on public.cvs
  for update using (auth.uid() = user_id);

create policy "cvs_delete_own" on public.cvs
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. application_packages
-- ---------------------------------------------------------------------------
-- One saved application: the parsed Lebenslauf, the job posting + answers
-- that produced the Anschreiben, and the Anschreiben text itself.
-- read_only is flipped by mark_packages_read_only() on subscription
-- downgrade (D4: free account keeps exactly 1 editable package).

create table if not exists public.application_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cv_id uuid not null references public.cvs (id) on delete cascade,
  title text not null default 'Bewerbung',
  job_posting text,
  answers jsonb not null default '[]'::jsonb,
  lebenslauf jsonb not null,
  anschreiben text,
  read_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.application_packages enable row level security;

create policy "application_packages_select_own" on public.application_packages
  for select using (auth.uid() = user_id);

create policy "application_packages_insert_own" on public.application_packages
  for insert with check (auth.uid() = user_id);

-- Editing a read_only package is blocked by the update policy itself (not
-- just the UI): the using() clause is checked against the row as it exists
-- BEFORE the update, so a row already flagged read_only cannot be updated by
-- its owner, only by a security-definer function (e.g. a future "restore on
-- resubscribe" path, or clear_packages_read_only() below).
create policy "application_packages_update_own_and_editable" on public.application_packages
  for update using (auth.uid() = user_id and read_only = false);

create policy "application_packages_delete_own" on public.application_packages
  for delete using (auth.uid() = user_id);

-- ---- Free/paid boundary: DB-level guard, not count-then-insert -----------
--
-- Rationale (two-tab race): if the boundary were enforced in application code
-- as "count existing packages, then insert if under the limit", two
-- concurrent requests (e.g. two browser tabs, or a retried request after a
-- timeout) can both pass the count check before either insert commits,
-- letting a free user save 2 packages. A BEFORE INSERT trigger runs inside
-- the same transaction as the insert it is guarding, so the count it sees is
-- always consistent with Postgres's normal transactional isolation -- this
-- closes the race at the only layer that can actually close it.

create or replace function public.enforce_package_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  has_active_subscription boolean;
  existing_count integer;
begin
  -- Serialize inserts per user: under READ COMMITTED two concurrent inserts
  -- could both count 0 existing packages and both pass. The xact-scoped
  -- advisory lock makes the second insert wait until the first commits, so
  -- its count() sees the committed row.
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

  select count(*) into existing_count
  from public.application_packages
  where user_id = new.user_id;

  if existing_count >= 1 then
    raise exception 'package_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_package_limit on public.application_packages;
create trigger trg_enforce_package_limit
  before insert on public.application_packages
  for each row execute function public.enforce_package_limit();

-- ---- Downgrade / resubscribe helpers --------------------------------------

-- Called by the (future) Stripe webhook handler when a subscription ends.
-- Keeps exactly the most-recently-updated package editable; the rest become
-- read-only (viewable, not editable, not usable as a regeneration base),
-- matching D4/the spec's downgrade behavior. security definer: the webhook
-- runs with the service role, but this keeps the row-selection logic in one
-- place instead of duplicated in application code.
create or replace function public.mark_packages_read_only(user_uuid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.application_packages
  set read_only = true, updated_at = now()
  where user_id = user_uuid
    and id <> (
      select id from public.application_packages
      where user_id = user_uuid
      order by updated_at desc
      limit 1
    );
end;
$$;

-- Inverse: called on resubscribe to restore full edit access to all of the
-- user's packages.
create or replace function public.clear_packages_read_only(user_uuid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.application_packages
  set read_only = false, updated_at = now()
  where user_id = user_uuid;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. humanizer_purchases
-- ---------------------------------------------------------------------------
-- Receipt records for Humanizer+ one-shot purchases. user_id is nullable
-- because the anonymous flow (Stage 1, already shipped) has no account at
-- all -- Stripe itself is the single-use token store for anonymous buyers
-- (see /api/humanizer/intent + /api/humanize). This table only starts
-- filling in once an account-holder buys Humanizer+ while signed in, and is
-- otherwise a forward-compatible landing spot, not a change to Stage 1.

create table if not exists public.humanizer_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_payment_intent_id text not null unique,
  kind text not null default 'humanizer',
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

alter table public.humanizer_purchases enable row level security;

create policy "humanizer_purchases_select_own" on public.humanizer_purchases
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy for regular clients: written server-side
-- only (service role, from the /api/humanize route after a verified charge).

-- ---------------------------------------------------------------------------
-- 6. Account deletion (GDPR Art. 17)
-- ---------------------------------------------------------------------------
-- Client-side code cannot call the Auth admin API (that requires the service
-- role key, which must never reach the browser). The standard Supabase
-- pattern for a user-initiated "delete my account" button is exactly this:
-- an RPC function, security definer, that deletes the caller's own
-- auth.users row using auth.uid() (never a client-supplied id). Deleting
-- auth.users cascades to public.profiles (on delete cascade) and from there
-- to cvs / application_packages / subscriptions (all "references auth.users
-- ... on delete cascade" or "references public.cvs ... on delete cascade").
-- humanizer_purchases uses "on delete set null" so receipt/accounting
-- history survives account deletion, deliberately.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Deliberately revoke default PUBLIC execute and grant only to the roles
-- that represent an authenticated end user, so an anonymous/unauthenticated
-- caller cannot invoke this at all (auth.uid() would be null and the delete
-- would be a no-op anyway, but least-privilege is cheap here).
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Function grant hardening
-- ---------------------------------------------------------------------------
-- Postgres grants EXECUTE on new functions to PUBLIC by default, which
-- exposes every function in an API schema via /rest/v1/rpc/*. For SECURITY
-- DEFINER functions that take an arbitrary user_uuid this is a real
-- cross-user mutation vector (any caller could flip another user's
-- read_only flags), flagged by Supabase's security advisor (lint 0028/0029).
--
-- mark/clear_packages_read_only: webhook-only (service role).
revoke all on function public.mark_packages_read_only(uuid) from public, anon, authenticated;
revoke all on function public.clear_packages_read_only(uuid) from public, anon, authenticated;
grant execute on function public.mark_packages_read_only(uuid) to service_role;
grant execute on function public.clear_packages_read_only(uuid) to service_role;

-- Trigger functions fire via their triggers (as table owner) and need no
-- direct execute grants at all; revoking removes the useless RPC exposure.
revoke all on function public.enforce_package_limit() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Remaining, intentional advisor exception: delete_own_account() stays
-- executable by `authenticated` (it deletes strictly auth.uid(), see above).
