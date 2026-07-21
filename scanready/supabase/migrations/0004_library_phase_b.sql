-- ScanReady Phase 8 (Account Library Phase B): package status column + RPC,
-- cv_id made nullable with an ON DELETE SET NULL FK, and
-- subscriptions.cancel_at_period_end.
--
-- Run this once, in full, against the same Frankfurt project that already
-- has 0001_stage3_accounts.sql, 0002_pass.sql, and
-- 0003_pass_requires_user_fix.sql applied (see docs/stage3-accounts.md for
-- the apply + advisor runbook this migration follows).
--
-- Scope: this migration only affects signed-in account holders. The
-- anonymous tool flow at /app never touches these tables and stays fully
-- stateless (CLAUDE.md non-negotiable guardrail).
--
-- Design source: .planning/phases/08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-/08-CONTEXT.md
-- (surface 07 CV reuse, surface 08 package status chip, surface 09 Plus
-- lifecycle) and 08-PATTERNS.md (migration section).

-- ---------------------------------------------------------------------------
-- 1. application_packages.status
-- ---------------------------------------------------------------------------
-- Nullable enum-shaped column: stores a lowercase key, display labels come
-- from i18n. Null is the neutral "no status set yet" state, matching the
-- surface 08 deck's "Status setzen" affordance for unset packages.
--
-- The CHECK constraint MUST allow null (0003 lesson, see below): 0003 already
-- taught us that a CHECK constraint that rejects a column becoming null can
-- abort delete_own_account() and other FK-driven cascades if that constraint
-- is ever tightened later. This CHECK is written null-tolerant from the
-- start so no future migration has to forward-fix it the way 0003 had to fix
-- 0002's mistake.

alter table public.application_packages
  add column if not exists status text;

-- Idempotent guard: Postgres has no "add constraint if not exists", so this
-- mirrors the do-block pattern in 0002 (lines 38-49) for a constraint check.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'application_packages_status_check'
  ) then
    alter table public.application_packages
      add constraint application_packages_status_check
      check (status is null or status in ('entwurf', 'beworben', 'interview', 'absage', 'zusage'));
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. set_package_status(package_id uuid, new_status text)
-- ---------------------------------------------------------------------------
-- The existing application_packages_update_own_and_editable policy (0001
-- lines 148-154) is `using (auth.uid() = user_id and read_only = false)`, so
-- a plain client UPDATE silently no-ops on a read_only package. Status is
-- package METADATA, not document content, so surface 08 requires it to stay
-- editable even after a package goes read_only (subscription downgrade). This
-- is a DELIBERATE, narrow exception to the read_only write lock, in the same
-- style as the comment at 0001 lines 148-152: the exception is safe only
-- because this function updates ONLY the status column, checks ownership via
-- auth.uid() (never a client-supplied user id), and validates new_status
-- against the five known keys (or null) before writing, so it can never be
-- used to weaken the read_only lock on lebenslauf/anschreiben/job_posting
-- content.

create or replace function public.set_package_status(package_id uuid, new_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if new_status is not null and new_status not in ('entwurf', 'beworben', 'interview', 'absage', 'zusage') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  update public.application_packages
  set status = new_status, updated_at = now()
  where id = package_id and user_id = auth.uid();
end;
$$;

-- Grant-hardening block, mirroring the delete_own_account treatment at 0001
-- lines 304-333: Postgres grants EXECUTE on new functions to PUBLIC by
-- default, which would let an anonymous or cross-user caller reach this RPC
-- over /rest/v1/rpc/set_package_status. Revoking from public/anon and
-- granting only to authenticated, combined with the auth.uid() ownership
-- check inside the function body, is what keeps this safe to expose at all.
revoke all on function public.set_package_status(uuid, text) from public, anon;
grant execute on function public.set_package_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. application_packages.cv_id: nullable + FK re-created as ON DELETE SET NULL
-- ---------------------------------------------------------------------------
-- Today cv_id is `not null references public.cvs (id) on delete cascade`
-- (0001 line 129), so deleting a CV cascade-deletes every application package
-- built from it. Surface 07 ("Bewerbungen behalten ihre Kopie") requires the
-- opposite: deleting a CV must null out cv_id and leave the package intact,
-- because packages already render from their own snapshotted lebenslauf
-- JSONB, never a live link to the cvs row.
--
-- CRITICAL, citing the 0002/0003 lesson explicitly: ON DELETE SET NULL fires
-- an implicit `cv_id = null` UPDATE on every application_packages row that
-- referenced the deleted cvs row, and delete_own_account() (0001 line 294)
-- cascades deletion through BOTH cvs and application_packages in the same
-- transaction. Because there is no CHECK constraint on cv_id, and the status
-- CHECK above is null-tolerant, this implicit UPDATE cannot be rejected by
-- anything in this migration, so delete_own_account() keeps working exactly
-- as before. This is the same class of bug 0003 fixed forward for
-- humanizer_purchases.pass_30d: a constraint that looks fine for normal
-- writes can silently abort an FK-cascade-driven UPDATE unless it is checked
-- against that case up front.

do $$
begin
  alter table public.application_packages
    drop constraint if exists application_packages_cv_id_fkey;

  alter table public.application_packages
    alter column cv_id drop not null;

  if not exists (
    select 1 from pg_constraint
    where conname = 'application_packages_cv_id_fkey'
  ) then
    alter table public.application_packages
      add constraint application_packages_cv_id_fkey
      foreign key (cv_id) references public.cvs (id) on delete set null;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 4. subscriptions.cancel_at_period_end
-- ---------------------------------------------------------------------------
-- Surface 09 (Plus lifecycle) needs to distinguish "active and will renew"
-- from "active but cancelled, running out the paid period" so /konto can
-- show the correct state and offer an un-cancel action. No RLS change is
-- needed: subscriptions has only subscriptions_select_own for regular
-- clients (0001 lines 82-87) and is written solely by the Stripe webhook
-- handler using the service role, the same trust model as status and
-- current_period_end.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;
