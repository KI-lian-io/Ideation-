# Phase 8: Account Library Phase B (CV reuse + status + Plus lifecycle) - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 9 (1 migration, 5 modified lib/route files, 3 modified UI files, plus test-list update)
**Analogs found:** 9 / 9 (all in-repo, Phase A/Stage 3 already established the conventions this phase extends)

All target files in this phase are MODIFICATIONS of existing files, not new files, since Phase A already built the account library scaffolding (SheetCard, KebabMenu, MonoBadge, PassStatusChip, StorageGate, SavedPackagesSection, etc). The closest analog for every change is therefore the *sibling code already in the same file* (the previous migration, the previous route, the previous section) rather than a different subsystem.

## File Classification

| File to modify | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scanready/supabase/migrations/0004_library_phase_b.sql` (new file) | migration | batch/DDL | `scanready/supabase/migrations/0002_pass.sql` + `0003_pass_requires_user_fix.sql` | exact (same author, same idempotency/grant-hardening conventions) |
| `scanready/src/app/api/subscription/reactivate/route.ts` (new file) | route | request-response | `scanready/src/app/api/subscription/cancel/route.ts` | exact (near mirror-image route) |
| `scanready/src/app/api/stripe/webhook/route.ts` | route/webhook | event-driven | itself, `customer.subscription.*` case block | exact (extend existing case) |
| `scanready/src/lib/subscription.ts` | service (pure mapper) | transform | itself, `mapStripeSubscription` / `SubscriptionRow` / `StripeSubscriptionLike` | exact |
| `scanready/src/lib/account.ts` | service | CRUD | itself, `saveApplicationPackage` / `listPackages` / `updatePackageTitle` | exact |
| `scanready/src/app/app/page.tsx` (`SaveApplicationButton`, export/copy handlers) | component | request-response + event-driven | itself, `SaveApplicationButton`, `handleCopy`/`handleDownload` in the cover-letter result view | exact |
| `scanready/src/app/konto/KontoClient.tsx` (`SavedPackagesSection`, `PackageCard`, `SubscriptionSection`) | component | CRUD | itself | exact |
| `scanready/src/components/ui.tsx` (new `StatusChip`/dropdown primitive) | component (primitive) | event-driven | itself, `KebabMenu` (floating-menu a11y) + `MonoBadge` (badge look) | exact |
| `scanready/src/lib/i18n.tsx` | config (i18n dict) | transform | itself, `library.*`/`pass.*` key blocks | exact |
| `scanready/package.json` `test` script | config | batch | itself (explicit file list) | exact |

## Pattern Assignments

### `scanready/supabase/migrations/0004_library_phase_b.sql` (migration, batch)

**Analog:** `scanready/supabase/migrations/0002_pass.sql` (style) + `0003_pass_requires_user_fix.sql` (forward-fix / trigger-not-CHECK lesson) + `0001_stage3_accounts.sql` (objects being altered)

**Header/comment-block pattern** (0002 lines 1-16): state scope, which project it runs against, and the design source. Copy this shape verbatim, citing `08-CONTEXT.md` as the design source.

**Idempotent guard pattern for a constraint that doesn't support `IF NOT EXISTS`** (0002 lines 38-49):
```sql
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
```
Use the identical shape for the new `application_packages.status` CHECK constraint (`'entwurf' | 'beworben' | 'interview' | 'absage' | 'zusage' | null`), and for dropping/re-creating the `cv_id` FK as `on delete set null` (drop constraint if exists, then `alter column cv_id drop not null` + `add constraint ... foreign key (cv_id) references public.cvs (id) on delete set null`).

**CRITICAL lesson from 0003 (CHECK vs trigger on implicit UPDATE)** (0003 lines 11-49): a plain CHECK constraint on `application_packages.status` is fine here (status is a simple nullable enum with no FK-cascade interaction), but do NOT add a NOT NULL or any constraint that could reject the implicit `cv_id = NULL` UPDATE fired by the new `on delete set null` FK action, and do not add anything that blocks `delete_own_account()`'s cascades. Keep `status` nullable in the CHECK (`status is null or status in (...)`) exactly as 0003 explains why `pass_30d` needed an insert-only trigger instead of a CHECK.

**SECURITY DEFINER RPC + grant-hardening pattern** (0001 lines 294-333, mirrored for the new `set_package_status`):
```sql
create or replace function public.set_package_status(package_id uuid, new_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if new_status is not null and new_status not in ('entwurf','beworben','interview','absage','zusage') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;
  update public.application_packages
  set status = new_status, updated_at = now()
  where id = package_id and user_id = auth.uid();
end;
$$;

revoke all on function public.set_package_status(uuid, text) from public, anon;
grant execute on function public.set_package_status(uuid, text) to authenticated;
```
This is the exact shape of `delete_own_account()` (ownership check via `auth.uid()`, not a caller-supplied user id) plus the grant-hardening block at 0001 lines 304-333 ("Postgres grants EXECUTE on new functions to PUBLIC by default... revoke all... grant execute... to authenticated"). Note the CONTEXT.md-specified deliberate exception: this RPC updates ONLY the status column and bypasses the `read_only = false` qualifier in `application_packages_update_own_and_editable` (0001 line 153-154) on purpose (status is metadata, not document content) — state that rationale in a comment directly above the function, mirroring the comment style at 0001 lines 148-152.

**`subscriptions.cancel_at_period_end` column** (new, alongside 0001's `subscriptions` table at lines 70-78): plain `alter table public.subscriptions add column if not exists cancel_at_period_end boolean not null default false;` — no RLS change needed (table already has `subscriptions_select_own`, no client insert/update policy, written only by the webhook via service role, same as `status`/`current_period_end`).

**Runbook append:** `scanready/docs/stage3-accounts.md` needs the 0004 entry — follow the same "apply via mcp**supabase**apply_migration then get_advisors" runbook already recorded there for 0002/0003.

---

### `scanready/src/app/api/subscription/reactivate/route.ts` (new route, request-response)

**Analog:** `scanready/src/app/api/subscription/cancel/route.ts` (full file, 77 lines) — mirror near-verbatim.

**Full guard + auth + row-sync shape to copy** (cancel/route.ts lines 1-77):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { accountsEnabled } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isActiveStatus } from "@/lib/subscription";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  if (!accountsEnabled() || !isStripeConfigured()) {
    return NextResponse.json({ error: "..." }, { status: 503 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "..." }, { status: 401 });

  const { data: rows, error: dbError } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status, current_period_end, cancel_at_period_end");
  if (dbError) return NextResponse.json({ error: "..." }, { status: 502 });

  // Reactivate only rows that are active AND currently flagged to cancel.
  const cancelling = (rows ?? []).filter((r) => isActiveStatus(r.status) && r.cancel_at_period_end);
  if (cancelling.length === 0) {
    return NextResponse.json({ error: "Für dieses Konto besteht keine gekündigte Buchung." }, { status: 404 });
  }

  try {
    for (const row of cancelling) {
      await getStripe().subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      // Sync the row here too (defense-in-depth) even though the webhook will
      // also sync it on Stripe's customer.subscription.updated event — same
      // dual-write acceptance already implicit in cancel/route.ts (Stripe is
      // the source of truth; the webhook is the durable sync path).
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscription reactivate error", err);
    return NextResponse.json({ error: "..." }, { status: 502 });
  }
}
```
Reuse the exact same `enforceSameOrigin`/`enforceRateLimit`/`accountsEnabled`/`isStripeConfigured`/`getSupabaseServerClient` import set and ordering. German error copy must be lifted from the 09-plus.dc.html deck per CONTEXT.md, not invented ad hoc.

---

### `scanready/src/app/api/stripe/webhook/route.ts` (webhook, event-driven)

**Analog:** itself — extend the existing `customer.subscription.created/updated/deleted` case (lines 62-102).

**Current upsert to extend** (lines 82-91):
```typescript
const { error: upsertError } = await admin.from("subscriptions").upsert(
  {
    user_id: userId,
    stripe_subscription_id: row.stripe_subscription_id,
    status: row.status,
    current_period_end: row.current_period_end,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "stripe_subscription_id" }
);
```
Add `cancel_at_period_end: row.cancel_at_period_end,` to this object once `mapStripeSubscription` returns it (see subscription.ts pattern below). No other change to the handler's control flow (the `isActiveStatus` branch calling `clear_packages_read_only`/`mark_packages_read_only` at lines 94-100 is unaffected — reactivating a cancellation does not change `status`, only `cancel_at_period_end`, so those RPCs are untouched by this phase).

---

### `scanready/src/lib/subscription.ts` (pure mapper, transform)

**Analog:** itself, `StripeSubscriptionLike` / `SubscriptionRow` / `mapStripeSubscription` (lines 42-73).

**Exact current shapes to extend:**
```typescript
export type StripeSubscriptionLike = {
  id: string;
  status: string;
  customer: string | { id: string };
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> };
  metadata?: Partial<Record<string, string>>;
  cancel_at_period_end?: boolean;  // NEW
};

export type SubscriptionRow = {
  stripe_subscription_id: string;
  status: string;
  current_period_end: string | null;
  user_id: string | null;
  customer_id: string | null;
  cancel_at_period_end: boolean;  // NEW
};

export function mapStripeSubscription(sub: StripeSubscriptionLike): SubscriptionRow {
  const periodEndEpoch =
    sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  return {
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end:
      typeof periodEndEpoch === "number" ? new Date(periodEndEpoch * 1000).toISOString() : null,
    user_id: sub.metadata?.supabase_user_id ?? null,
    customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,  // NEW, default false mirrors DB default
  };
}
```
Keep the file's existing pure-function/no-I/O discipline (comment at lines 1-11 explains why: pure logic here, Stripe/Supabase I/O stays in routes) and its `.ts`-extension import convention (line 16-17, required by the plain `node --test` runner).

---

### `scanready/src/lib/account.ts` (service, CRUD)

**Analog:** itself. New/changed exports:

**`saveApplicationPackage` orphan-fix ordering to preserve** (lines 89-135) — the cvs-insert-then-package-insert-then-best-effort-delete-on-failure order is the 895e03d fix; do not reorder it when adding the attach-existing-CV path. Add an `existingCvId?: string` field to `SaveApplicationPackageInput` (line 48-56); when present, SKIP the `cvs` insert entirely and use `existingCvId` directly as `cv_id` on the `application_packages` insert — this preserves the "no new cvs insert" requirement from CONTEXT.md decision 07/18 while keeping the orphan-cleanup path (lines 124-132) exactly as-is for the save-as-new branch:
```typescript
export type SaveApplicationPackageInput = {
  cvTitle?: string;
  cvText: string;
  existingCvId?: string; // NEW: attach path, skips the cvs insert below
  packageTitle?: string;
  jobPosting: string | null;
  answers: AnswerEntry[];
  lebenslauf: Lebenslauf;
  anschreiben: string | null;
};
```

**New `listCvs()` helper** — same shape/gate/error-handling pattern as `listPackages` (lines 137-155):
```typescript
export async function listCvs(
  client: SupabaseClient,
  userId: string
): Promise<CvRow[]> {
  if (!accountsEnabled()) return [];
  const { data, error } = await client
    .from("cvs")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("listCvs error", error.message);
    return [];
  }
  return (data ?? []) as CvRow[];
}
```
Add a matching `CvRow` type mirroring `ApplicationPackageRow` (lines 34-46: `id, user_id, title, cv_text, created_at, updated_at`).

**Per-CV usage count**: group `listPackages()` results client-side by `cv_id` (no new SQL needed; the existing `application_packages.cv_id` column already carries this) — this is the CONTEXT.md-specified "usage-count query (group packages by cv_id)", doable in the calling component rather than a new server helper, matching how `packageCompanyCity` in `KontoClient.tsx` (lines 158-162) derives display data client-side from already-fetched rows rather than a dedicated query.

**Status RPC caller** — new helper mirroring `deleteAccount`'s RPC-call shape (lines 334-342):
```typescript
export async function setPackageStatus(
  client: SupabaseClient,
  packageId: string,
  status: string | null
): Promise<{ ok: boolean; message?: string }> {
  if (!accountsEnabled()) return { ok: false, message: "accounts_disabled" };
  const { error } = await client.rpc("set_package_status", {
    package_id: packageId,
    new_status: status,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
```
Note: `ApplicationPackageRow` (lines 34-46) needs a new `status: string | null` field added, and `cv_id` becomes `string | null` (schema change from migration 0004) — both card-render call sites (KontoClient PackageCard, app/page.tsx's SavedApplications) must be checked for non-null assumptions on `cv_id`.

**`updatePackageTitle`'s read_only comment convention** (lines 220-226) is the model for documenting the deliberate status-RPC exception: "RLS already blocks X; caller must ALSO hide Y client-side" — write the equivalent comment on `setPackageStatus` explaining status is the ONE exception that must NOT be hidden on read_only rows, referencing the migration's own comment.

---

### `scanready/src/app/app/page.tsx` — `SaveApplicationButton` (component, request-response) + export/copy handlers (event-driven)

**Analog:** itself, `SaveApplicationButton` (lines 1318-1487).

**Attach-or-new radio insertion point**: add the radio between the title `<input>` block (lines 1428-1436) and the suggestion-hint line (lines 1437-1440), gated on `listCvs(client, userId).length > 0` (fetched once on mount alongside the existing `suggestedTitle` computation at line 1336, same "one-shot effect on mount" convention used throughout this codebase — see `KontoClient.tsx`'s `refresh()` effects). Preselect "attach" when the >80% overlap heuristic (CONTEXT.md, planner's discretion for the metric) matches an existing CV; otherwise default to "save as new" (today's only behavior). Wire the choice into `handleClick`'s call to `onSave` by extending its signature to accept an optional `existingCvId` alongside `title`, matching how `onSave`/`handleSavePackage` already thread `packageTitle` through (see `handleSavePackage` at page.tsx lines ~2238-2260 calling `saveApplicationPackage`).

**`handleClick` result-branch pattern to preserve** (lines 1347-1362): the `state` union (`'idle' | 'saving' | 'saved' | 'signed_out' | 'limit' | 'error'`) and its exhaustive branch handling is the template for any new UI states this phase needs; do not add ad hoc state outside this union.

**Auto-suggest hook point (status 'beworben' on first export/copy)**: the two candidate handlers are `handleCopy`/`handleDownload` in the cover-letter result view (lines 1773-1794) and the Lebenslauf print handler near line ~2053 (`handlePrintLebenslauf`/`handlePrintLetter`, referenced in the `printJob` effect at lines 2200-2214). Follow the exact shape of `handleCopy` (lines 1773-1783, including the `track('copy_download', ...)` call at line 1776) and add a call to the new `setPackageStatus(client, savedPackageId, 'beworben')` immediately after a successful copy/download/export, ONLY when a `savedPackageId` exists (i.e. package is saved) and only once (guard with a local `hasSuggestedStatus` ref/state, since `handleCopy`/`handleDownload` can each fire repeatedly). CONTEXT.md requires this to be undoable via an inline "Rückgängig" link, never a modal — model that inline affordance on the existing inline-dismiss pattern in `SaveApplicationButton`'s `state === 'limit'` branch (lines 1472-1476) which renders a component conditionally beneath the card rather than opening anything.

---

### `scanready/src/app/konto/KontoClient.tsx` (component, CRUD)

**Analog:** itself, `SavedPackagesSection` / `PackageCard` (lines 168-383) and `SubscriptionSection` (lines 405-484).

**New "Meine Lebensläufe" section**: model directly on `SavedPackagesSection`'s structure (lines 255-383: `useState<T[] | null>`, `refresh()` effect run-once-per-mount at lines 267-272, `EmptyState` when empty, grid of cards when not). CV cards reuse `SheetCard`, `MonoBadge`, `KebabMenu`, `InlineRenameField` exactly as `PackageCard` does (lines 203-252) — per-CV usage count badge computed from `listPackages()` grouped by `cv_id`, rename via `updatePackageTitle`-equivalent for `cvs.title` (new `updateCvTitle` helper following the exact same shape, lines 227-240), delete via existing `cvs_delete_own` RLS (no RPC needed, plain `.from('cvs').delete().eq('id', ...)` mirroring `deletePackage` lines 178-187).

**Status chip insertion point in `PackageCard`'s badge row** (lines 237-250): insert the new status chip/dropdown alongside the existing `MonoBadge` row, following the exact conditional-render style already used there (`pkg.read_only ? <MonoBadge variant="readonly"> : anyReadOnly ? <MonoBadge variant="editable"> : null`) — add a `<StatusChip status={pkg.status} onChange={...} />` component (new, in `ui.tsx`) as an additional badge-row child, NOT gated on `read_only` (CONTEXT.md: status stays editable even on read-only rows, a deliberate stated exception — comment this inline the same way the `read_only` gating comment at lines 164-167 explains the "hide, don't disable" rule and its exception).

**`SubscriptionSection` new states** (cancelled-but-running / expired): extend the `isActive` branch (lines 456-468) with a nested check on `sub.cancel_at_period_end`. Model the two new render branches on the existing `isActive`/else split (lines 456-481) — same `<p>`/`<a>`/`<button>` structure, German copy lifted verbatim from `09-plus.dc.html` per CONTEXT.md. The un-cancel action (`POST /api/subscription/reactivate`) follows the exact fetch-then-branch shape of `handleSubscribe` (lines 433-449).

**Filter-by-status**: extend the existing client-side `filtered` `useMemo` (lines 308-316) which already does substring matching on `pkg.title`/company-city — add `pkg.status` (the i18n-mapped label text, not the raw key) to the same `.includes(needle)` check, per CONTEXT.md ("filter by status label text is acceptable").

---

### `scanready/src/components/ui.tsx` — new `StatusChip` primitive (component, event-driven)

**Analog:** `KebabMenu` (lines 296-359+, floating-menu a11y: focus trap, outside-click close, Escape) for the dropdown mechanics, and `MonoBadge` (lines 143-177) for the chip's visual variants.

**`focusTrap` helper to reuse as-is** (lines 309-338) — do not duplicate this logic; either export it or add a second component (`StatusDropdown`) that calls the exact same trap function `KebabMenu` already uses. `KebabMenu`'s outside-click effect (lines 351-358) is the model for the new dropdown's open/close lifecycle:
```typescript
useEffect(() => {
  if (!open) return
  function onPointerDown(e: MouseEvent) {
    if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
  }
  document.addEventListener('mousedown', onPointerDown)
  return () => document.removeEventListener('mousedown', onPointerDown)
}, [open])
```

**`MonoBadge` variant pattern to extend** (lines 141-177: `'present' | 'ghost' | 'editable' | 'readonly'`) — add status-specific variants or a new small `StatusChip` component that renders one of five labels (from i18n, never hardcoded) in a badge-shaped `<button>` that opens the dropdown, matching `MonoBadge`'s exact Tailwind class shapes (rounded-full pill for a set state, dashed ghost `border-dashed` for the null "Status setzen" affordance, mirroring the ghost/`fehlt` convention already used for missing documents at KontoClient.tsx lines 239-244). NEVER cycles on click (CONTEXT.md) — clicking opens the `KebabMenu`-style dropdown, not the next state in sequence, exactly the way `KebabMenu`'s trigger opens a menu rather than doing anything itself (lines 340-348 shows the trigger only toggles `open`).

---

### `scanready/src/lib/i18n.tsx` (config, transform)

**Analog:** itself, `library.*` (lines 303-319) and `pass.*` (lines 193-215) key blocks — both are flat dotted-prefix groups added incrementally to the same `Dict` type, each key typed as `string` or a parameterized function (`(date: string) => string` etc, per the file's header comment at lines 20-23: "Parameterized strings are functions so callers can't forget an argument").

**Pattern to copy exactly**: add new key groups (`cvs.*`, `status.*`, `plusLifecycle.*` or similar dotted prefixes per surface) to the `Dict` type FIRST, then fill both the `en` and `de` objects — the file's own `satisfies Dict` convention (referenced in the header comment, not shown in this excerpt but implied by "keeps them in lockstep") means TypeScript will error if either language object is missing a key, which is the safety net CONTEXT.md relies on for "DE/EN copy lifted VERBATIM... in lockstep". Copy German text VERBATIM from the three `.dc.html` decks (07/08/09), never invent ad hoc strings, per CONTEXT.md cross-cutting guardrails.

---

### `scanready/package.json` `test` script (config, batch)

**Analog:** itself, line 13 — the explicit space-separated file list run by `node --experimental-strip-types --test`. Any new test file (e.g. a pure-function test for the overlap heuristic, or `subscription.test.ts` additions for `cancel_at_period_end`, or a `set_package_status`/`listCvs` pure-helper test) MUST be appended to this exact string or it silently never runs — CONTEXT.md explicitly flags this ("package.json's explicit test file list may need extending - check before assuming"). Existing entries end in `account.test.ts` and `subscription.test.ts`; both files likely already exist and get extended in place (new pure functions added to `account.ts`/`subscription.ts` get new `describe`/`it` blocks in the SAME test file, not a new file, unless the phase adds a genuinely new module like a standalone overlap-heuristic helper).

## Shared Patterns

### Env-gated inert / fail-open
**Source:** `scanready/src/lib/account.ts` lines 94, 142, 162, 182, 232, 252, 286, 311, 337 (every exported helper starts with `if (!accountsEnabled()) return <safe no-op>`)
**Apply to:** every new/modified helper in `account.ts` and `subscription.ts`, and every new route (`/api/subscription/reactivate` must open with the same `accountsEnabled() || !isStripeConfigured()` 503 guard as `cancel/route.ts` lines 24-29).

### Same-origin + rate-limit guard on mutating routes
**Source:** `scanready/src/app/api/subscription/cancel/route.ts` lines 19-22 (`enforceSameOrigin` then `enforceRateLimit`)
**Apply to:** `/api/subscription/reactivate/route.ts` (new).

### SECURITY DEFINER + explicit grant-hardening for any new RPC
**Source:** `scanready/supabase/migrations/0001_stage3_accounts.sql` lines 294-333 (`delete_own_account` comment + revoke/grant block) and 0002's function re-creation pattern.
**Apply to:** the new `set_package_status(package_id uuid, new_status text)` RPC in migration 0004 — MUST revoke from `public, anon` and grant only to `authenticated`, checking `user_id = auth.uid()` inside the function body itself (never trust a client-supplied user id).

### Idempotent migration guards (do-block for constraints, `if not exists` for columns/tables)
**Source:** `scanready/supabase/migrations/0002_pass.sql` lines 38-49 (do-block) and line 23-24 (`add column if not exists`)
**Apply to:** all of migration 0004's new objects (status column, cancel_at_period_end column, CHECK constraint, FK re-creation).

### Forward-fix only, never edit an applied migration
**Source:** `scanready/supabase/migrations/0003_pass_requires_user_fix.sql` lines 1-7 (explicit statement of this convention)
**Apply to:** migration 0004 itself is a new forward-fix file; if a bug is found in it AFTER it's applied live, a 0005 file fixes forward, 0004 is never edited.

### RLS "hide the control, don't rely on disabling it" for read-only rows
**Source:** `scanready/src/app/konto/KontoClient.tsx` lines 164-167 (comment) + line 199 (`...(pkg.read_only ? [] : [{ label: t.libraryMenuRename, ... }])`)
**Apply to:** every gallery card in this phase EXCEPT the new status chip, which is the CONTEXT.md-documented deliberate exception (status chip stays visible/editable on read_only rows because it is metadata, enforced instead by the RPC's ownership-only check). Document this exception inline wherever the status chip is rendered.

### Explicit-save-only / no autosave
**Source:** `scanready/src/app/app/page.tsx` `handleSavePackage` comment (lines ~2232-2235: "Explicit user action only (no auto-save – zero-retention guardrail)")
**Apply to:** the attach-or-new radio and any status auto-suggest — the auto-suggest is a nudge that STILL requires an explicit RPC call the user can undo, not a silent background write; it fires from a real user action (copy/export click), matching this project's existing definition of "explicit" (a click, not a timer or blur).

### `.ts` extension imports for files exercised by `node --test`
**Source:** `scanready/src/lib/account.ts` lines 1-8, `scanready/src/lib/subscription.ts` lines 12-17 (comment explaining why)
**Apply to:** any new pure-logic file added to `src/lib/` in this phase (e.g. if the overlap heuristic gets its own module) — must use explicit `.ts` relative imports if it will be required by `node --experimental-strip-types --test`.

## No Analog Found

None. Every file in this phase's change list already has a directly-editable existing analog because Phase A (07) built the full scaffolding this phase extends.

## Metadata

**Analog search scope:** `scanready/supabase/migrations/`, `scanready/src/lib/`, `scanready/src/app/api/subscription/`, `scanready/src/app/api/stripe/`, `scanready/src/app/konto/`, `scanready/src/app/app/`, `scanready/src/components/`, `scanready/package.json`
**Files scanned:** 12 read directly (0001/0002/0003 migrations, account.ts, subscription.ts, cancel/route.ts, stripe/webhook/route.ts, KontoClient.tsx, PassStatusChip.tsx, ui.tsx excerpt, i18n.tsx excerpt, app/page.tsx excerpts, package.json)
**Pattern extraction date:** 2026-07-19
