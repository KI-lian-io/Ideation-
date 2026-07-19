---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
reviewed: 2026-07-19T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - scanready/supabase/migrations/0004_library_phase_b.sql
  - scanready/src/lib/cv-overlap.ts
  - scanready/src/lib/account.ts
  - scanready/src/lib/subscription.ts
  - scanready/src/lib/i18n.tsx
  - scanready/src/app/api/subscription/reactivate/route.ts
  - scanready/src/app/api/stripe/webhook/route.ts
  - scanready/src/app/app/page.tsx
  - scanready/src/app/konto/KontoClient.tsx
  - scanready/src/components/ui.tsx
  - scanready/src/lib/__tests__/cv-overlap.test.ts
  - scanready/src/lib/__tests__/account.test.ts
  - scanready/src/lib/__tests__/subscription.test.ts
  - scanready/package.json
findings:
  critical: 0
  warning: 5
  info: 2
  total: 7
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-07-19
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

The migration (0004), the RPC hardening, the reactivate route, and the webhook
sync all check out against the specific 0002/0003-style traps this phase was
asked to watch for: the `status` CHECK is null-tolerant, the `cv_id` FK is
recreated `on delete set null` with no CHECK that could reject the implicit
UPDATE it fires, `set_package_status` validates ownership via `auth.uid()`
server-side and is grant-hardened to `authenticated` only, and
`/api/subscription/reactivate` only touches the caller's own rows and only
reactivates subscriptions that are still `isActiveStatus` with
`cancel_at_period_end = true` (a fully-lapsed or canceled subscription cannot
be resurrected through it). The attach-path save flow in `account.ts` never
inserts a `cvs` row and never deletes the reused row on failure, matching the
threat register. `cv-overlap.ts` is a clean, well-tested, linear-time
heuristic with sane empty/tie handling.

The issues found are all in the newer UI wiring around this migration
(`page.tsx`, `KontoClient.tsx`, `account.ts`): a hardcoded placeholder value
that always renders "0 applications" in the attach dropdown, an
auto-suggest/undo pair that ignores the result of its own write (so a failed
status update still shows a false "success" banner, and a failed undo still
hides the notice), an "Undo" that reverts to `'entwurf'` instead of the actual
prior (unset) state, and a subscription-status check that was reimplemented
inline instead of reusing the single source of truth this same phase added a
sibling call-site for. No security or data-loss defects were found in the
files reviewed.

## Warnings

### WR-01: Attach-to-existing-CV dropdown always shows "0 applications"

**File:** `scanready/src/app/app/page.tsx:1582`
**Issue:** The `<select>` option label for each candidate CV in the
attach-or-new radio calls `t.cvsAttachMeta(date, 0)` with a hardcoded `0` for
the usage count, instead of the CV's real number of linked
`application_packages`. `cvsAttachMeta`'s whole purpose (see its i18n
docstring, and the near-identical `cvsUsage`/`cvsAttachMeta` calls in
`KontoClient.tsx`'s `CvSection`, which derive a real count from
`packages.filter((pkg) => pkg.cv_id === cv.id).length`) is to show the
applicant how many applications already reference that CV. Here it will
always render "As of {date} · used in 0 applications" (or the pluralized
German equivalent), which is simply false whenever the CV is already in use –
misleading exactly at the moment the user is deciding whether to attach to it
or create a new one.
**Fix:** Fetch (or receive as a prop) the same `packages` list `KontoClient`'s
`CvSection` already has, and derive the count the same way:
```tsx
// AppShell already fetches listPackages() into `cvs`'s sibling data via
// refreshPassStatus; thread that array (or a cvId -> count map) down to
// SaveApplicationButton and use it here instead of the literal 0:
{cv.title} · {t.cvsAttachMeta(new Date(cv.updated_at).toLocaleDateString('de-DE'), usageCountFor(cv.id))}
```

### WR-02: Status auto-suggest and its undo silently ignore RPC failure

**File:** `scanready/src/app/app/page.tsx:2306-2317`
**Issue:** `suggestBeworben()` sets `hasSuggestedStatus.current = true` and
then unconditionally calls `setStatusSuggestionVisible(true)` right after
`await setPackageStatus(...)`, without checking the returned
`{ ok, message }`. If the write fails (RLS hiccup, network blip, the RPC's
own `invalid_status` guard, etc.), the UI still shows "Set to Applied ✓ /
Undo" as if the database had actually been updated – there is no refetch
anywhere in this path to correct the optimistic assumption. Symmetrically,
`handleUndoStatusSuggestion()` calls `setStatusSuggestionVisible(false)`
*before* awaiting the undo RPC, so if that write fails the banner
disappears and the user is left believing the undo worked while the package
is still marked `'beworben'` in the database. Contrast this with the manual
status-change handlers in the same file and in `KontoClient.tsx`
(`handleStatusChange`), which call `refresh()`/`listPackages()` afterwards so
the UI is corrected by re-reading real state — this pair is the one place in
the phase that never re-syncs with the database after a write.
**Fix:** Check the RPC result before flipping UI state, and only claim success
when it actually was one:
```tsx
async function suggestBeworben() {
  if (!savedPackageId || hasSuggestedStatus.current) return
  hasSuggestedStatus.current = true
  const result = await setPackageStatus(getSupabaseBrowserClient(), savedPackageId, 'beworben')
  if (result.ok) setStatusSuggestionVisible(true)
  else hasSuggestedStatus.current = false // allow a retry on the next export/copy
}

async function handleUndoStatusSuggestion() {
  if (!savedPackageId) return
  const result = await setPackageStatus(getSupabaseBrowserClient(), savedPackageId, 'entwurf')
  if (result.ok) setStatusSuggestionVisible(false)
}
```

### WR-03: "Undo" reverts to `'entwurf'`, not to the actual prior (unset) status

**File:** `scanready/src/app/app/page.tsx:2313-2317`
**Issue:** `suggestBeworben` only ever fires on a package that was just
inserted by `saveApplicationPackage` (`handleSavePackage` resets
`hasSuggestedStatus.current = false` on every successful save, and
`application_packages` inserts never set `status`, so it starts `null` –
migration 0004's own comment: "Null is the neutral 'no status set yet'
state"). "Undo" should therefore restore that neutral, unset state, but the
code instead writes the concrete `'entwurf'` ("Draft") value. After a user
clicks Undo, `/konto` and the in-tool gallery will show an explicit "Entwurf"
status chip on the package rather than returning it to the ghost "Status
setzen" (unset) affordance it had before the auto-suggestion ever fired –
a different, still-set state, not a true revert.
**Fix:** Pass `null` instead of `'entwurf'` (the RPC and `setPackageStatus`'s
signature already accept it):
```tsx
await setPackageStatus(getSupabaseBrowserClient(), savedPackageId, null)
```

### WR-04: `KontoClient.tsx` reimplements `isActiveStatus` instead of importing it

**File:** `scanready/src/app/konto/KontoClient.tsx:684`
**Issue:** `const isActive = sub?.status === 'active' || sub?.status === 'trialing'`
duplicates the exact logic already exported as `isActiveStatus()` from
`src/lib/subscription.ts` — a module this very phase touched (adding
`cancel_at_period_end`) and whose own doc comment states it "Must match the
SQL guard in `supabase/migrations/0001_stage3_accounts.sql`
(`enforce_package_limit`)". `reactivate/route.ts` and `stripe/webhook/route.ts`
both correctly import and call `isActiveStatus`; `KontoClient.tsx` is the one
call site in this phase that reimplements it inline, which means a future
change to what counts as "paying" (e.g. adding `past_due` with a grace
period) would silently miss this file.
**Fix:**
```tsx
import { isActiveStatus } from '@/lib/subscription'
// ...
const isActive = sub ? isActiveStatus(sub.status) : false
```

### WR-05: `getPackage` skips the explicit `user_id` filter its sibling helpers use as defense-in-depth

**File:** `scanready/src/lib/account.ts:223-240` (compare `listPackages`, `223` vs `203-220`, and `KontoClient.tsx`'s `SubscriptionSection.refresh`, which explicitly notes *"a client-side backstop means a loosened policy fails closed instead of silently returning another user's row"*)
**Issue:** `listPackages`, `listCvs`, and `KontoClient`'s subscription read all
add an explicit `.eq("user_id", userId)` alongside RLS, by this project's own
stated convention. `getPackage` — used by the `?package=<id>` cross-page
bridge in `page.tsx` to load an arbitrary package id straight from the URL —
relies solely on RLS (`.eq("id", packageId).maybeSingle()`), which is the one
place in this phase where a caller-controlled id is looked up without that
same backstop. Not exploitable today (RLS `application_packages_select_own`
should already scope it), but it is the entry point most reachable by a
manipulated URL, and it breaks the "fail closed on a loosened policy"
guarantee the project documents everywhere else in this file.
**Fix:** Accept and pass the caller's `userId` the same way `listPackages` does:
```ts
export async function getPackage(
  client: SupabaseClient,
  packageId: string,
  userId: string
): Promise<ApplicationPackageRow | null> {
  ...
  const { data, error } = await client
    .from("application_packages")
    .select("*")
    .eq("id", packageId)
    .eq("user_id", userId)
    .maybeSingle();
```

## Info

### IN-01: `mapSaveError` treats an empty-string message as a real message, not "unknown"

**File:** `scanready/src/lib/account.ts:98-103`
**Issue:** `error?.message ?? "unknown_error"` only falls back when `message`
is `null`/`undefined`. A Postgres error object with `message: ''` (empty
string, which some drivers do surface for certain constraint violations)
would produce `{ ok: false, reason: "error", message: "" }` — an empty,
unhelpful string shown to the user instead of the "unknown_error" fallback
the function otherwise provides. The existing test suite only covers `null`
and `undefined`, not the empty-string case.
**Fix:** `message: error?.message || "unknown_error"` (or an explicit
`.trim()` check) so a blank message also falls back.

### IN-02: Duplicated `packageCompanyCity`/`statusOptions`/`statusLabelFor`/`LockGlyph`/`PackageCard` between `page.tsx` and `KontoClient.tsx`

**File:** `scanready/src/app/app/page.tsx:744-897` and `scanready/src/app/konto/KontoClient.tsx:166-193, 199-300, 631-649`
**Issue:** Both files independently define near-identical helpers and a
`PackageCard` component for the two package galleries. The code's own
comments flag this as a deliberate choice ("small pure derivation, no shared
import between the two files"), so this is not a defect, but it does mean any
future change to the status pipeline, badge logic, or company/city derivation
must be applied twice by hand — worth a note for whoever next touches either
gallery, since the two copies have already started to diverge slightly (e.g.
`page.tsx`'s `PackageCard` has the extra `onOpenSheet`/`BottomSheet` touch
path that `KontoClient.tsx`'s does not).
**Fix:** No action required for this phase; if a third gallery view is ever
added, consider lifting these into a shared module.

---

_Reviewed: 2026-07-19_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
