-- Fix CR-01 (07-REVIEW.md): the humanizer_purchases_pass_requires_user CHECK
-- constraint added by 0002_pass.sql breaks GDPR account deletion for any
-- Pass purchaser. Forward-fix only -- 0002_pass.sql is NOT edited because it
-- has already been applied to the live Frankfurt project; this project's
-- migration convention is to fix forward with a new numbered file, never to
-- rewrite an already-applied one.
--
-- Run this once against the same project that already has 0001 and 0002
-- applied.

-- ---------------------------------------------------------------------------
-- Why the old CHECK constraint is wrong
-- ---------------------------------------------------------------------------
-- 0001_stage3_accounts.sql defines humanizer_purchases.user_id as
-- "references auth.users (id) on delete set null" specifically so that
-- delete_own_account() (a one-liner: "delete from auth.users where id =
-- auth.uid()") can rely on that FK's ON DELETE SET NULL action to null out
-- the caller's humanizer_purchases rows in the same transaction as the
-- account delete.
--
-- A CHECK constraint is validated on every UPDATE, including the implicit
-- UPDATE Postgres performs to enact ON DELETE SET NULL. For any pass_30d row,
-- that implicit UPDATE tries to set user_id = NULL, which the old constraint
-- rejects (kind = 'pass_30d' and user_id is about to become null), aborting
-- the whole account-deletion transaction.
--
-- ---------------------------------------------------------------------------
-- Why the replacement is INSERT-only
-- ---------------------------------------------------------------------------
-- The invariant we actually want is "a pass_30d row is always CREATED with a
-- user_id" -- /api/pass/verify already guarantees this (it requires a signed-
-- in user before it ever writes a row), and there is no legitimate path that
-- turns an existing pass_30d row's user_id into null EXCEPT the FK-driven
-- account-deletion UPDATE, which must be allowed to succeed.
--
-- A BEFORE INSERT trigger enforces exactly that: it only ever inspects NEW on
-- insert, so it has no opinion at all about the later UPDATE that nulls
-- user_id out during deletion. An orphaned pass_30d row with user_id = null
-- is harmless data left in place, not a live entitlement: every entitlement
-- check in this codebase (getActivePass, getLatestPass, enforce_package_limit)
-- filters on "user_id = auth.uid()" / "user_id = new.user_id", so a null
-- user_id row can never match any caller and is functionally inert -- the
-- same "receipt survives, entitlement does not" behavior the other purchase
-- kinds (humanizer, paket) already rely on.
--
-- SECURITY INVOKER (the default, no explicit clause needed) is fine here:
-- the function only reads NEW, the row already being written by the current
-- statement -- there is nothing that needs elevated privilege to inspect.

alter table public.humanizer_purchases
  drop constraint if exists humanizer_purchases_pass_requires_user;

create or replace function public.enforce_pass_requires_user()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.kind = 'pass_30d' and new.user_id is null then
    raise exception 'pass_requires_user' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pass_requires_user on public.humanizer_purchases;
create trigger trg_pass_requires_user
  before insert on public.humanizer_purchases
  for each row execute function public.enforce_pass_requires_user();
