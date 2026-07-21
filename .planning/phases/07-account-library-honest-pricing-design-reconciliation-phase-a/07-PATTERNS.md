# Phase 7: Account Library + Honest Pricing (Phase A) - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 20 (new + modified)
**Analogs found:** 20 / 20

**Correction to CONTEXT.md paths:** the account data helper is `scanready/src/lib/account.ts` (NOT `scanready/src/lib/supabase/account.ts` - that directory only has `admin.ts`, `client.ts`, `config.ts`, `server.ts`). The `accountsEnabled()` gate lives in `scanready/src/lib/supabase/config.ts`. Use these corrected paths in plans.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/globals.css` (+shadow tokens) | config | transform | same file, existing `@theme` block | exact |
| `src/components/ui.tsx` (+SheetCard/KebabMenu/InlineRenameField/MonoBadge/EmptyState/BottomSheet/SavedConfirmationPanel) | component (primitives) | request-response | same file, existing `btnClass`/`CARD`/`EYEBROW` exports | exact |
| `src/lib/humanizer.ts` (+PASS_PRICE_CENTS, checkHumanizerEntitlement extension) | utility | request-response | same file, existing `checkPaketPi`/`checkHumanizerEntitlement` | exact |
| `supabase/migrations/0002_pass.sql` | migration | CRUD | `supabase/migrations/0001_stage3_accounts.sql` | exact |
| `src/app/api/pass/intent/route.ts` | route | request-response | `src/app/api/paket/intent/route.ts` | exact |
| `src/app/api/pass/verify/route.ts` (or folded into paket/verify) | route | request-response | `src/app/api/paket/verify/route.ts` | exact |
| `src/components/PassModal.tsx` | component | request-response | `src/components/PaketModal.tsx` | exact |
| `src/lib/account.ts` (+updatePackageTitle, pass-aware limit awareness) | utility | CRUD | same file, existing `saveApplicationPackage`/`deletePackage` | exact |
| `src/app/konto/KontoClient.tsx` (SavedPackagesSection rebuild) | component | CRUD | same file, current bare-`<ul>` section | exact |
| `src/app/app/page.tsx` (`SavedApplications`, `SaveApplicationButton`, `LOAD_PACKAGE`) | component | CRUD | same file, current sections (lines ~700-1067) | exact |
| `src/components/StorageGate.tsx` (new) | component | request-response | `src/app/app/page.tsx` `SaveApplicationButton` `state==='limit'` block (lines 1056-1063) | role-match (upgrading an inline hint to a full component) |
| `src/lib/i18n.tsx` (+library.*/save.*/gate.*/pass.* keys) | config/i18n | transform | same file, existing `Dict` type + `en`/`de` objects | exact |
| `src/app/preise/page.tsx` (rebuild) | component | request-response | same file, current 3-card structure | exact |
| `src/app/layout.tsx` (+icons/openGraph.images) | config | request-response | same file, existing `metadata` object | exact |
| `src/app/not-found.tsx` (new) | component | request-response | `src/app/preise/page.tsx` masthead/nav pattern + `src/lib/i18n.tsx` for copy | role-match |
| `public/*.svg` asset swap | config | file-I/O | n/a (asset copy, no code analog) | no analog needed |
| `src/lib/supabase/config.ts` (possible `subscriptionConfigured()`-style pass check) | utility | request-response | same file, `accountsEnabled()` | exact |
| `src/components/AccountProvider.tsx` (if pass status surfaced) | provider | event-driven | same file, existing `user`/`signInWithGoogle` context | exact |
| Tests: `src/lib/__tests__/humanizer.test.ts` extension for Pass entitlement | test | transform | same file, existing `checkPaketPi`/`checkHumanizerEntitlement` tests | exact |
| Tests: `src/lib/__tests__/account.test.ts` extension for `updatePackageTitle`/pass tier | test | transform | same file, existing `mapSaveError` pure-function tests | exact |

## Pattern Assignments

### `supabase/migrations/0002_pass.sql` (migration, CRUD)

**Analog:** `scanready/supabase/migrations/0001_stage3_accounts.sql`

**Table + RLS pattern** (lines 263-278, `humanizer_purchases`):
```sql
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
```
0002 adds `expires_at timestamptz` (nullable) to this exact table via `alter table ... add column if not exists expires_at timestamptz;` and inserts Pass rows with `kind='pass_30d'`, `user_id` NOT NULL (enforce with a `check` or just always supply it from the authenticated route).

**Three-tier trigger pattern to extend** (lines 170-211, `enforce_package_limit`):
```sql
create or replace function public.enforce_package_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  has_active_subscription boolean;
  existing_count integer;
begin
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
```
`0002` must `create or replace` this same function, inserting a middle tier between the subscription check and the `>= 1` check: a `select exists(select 1 from humanizer_purchases where user_id = new.user_id and kind = 'pass_30d' and expires_at > now())` -> if true, use `existing_count >= 25` instead of `>= 1`. KEEP the advisory lock line verbatim (it is the race guard for ALL tiers, not just free). Do NOT touch `mark_packages_read_only()` / `clear_packages_read_only()` (lines 221-251) - Pass expiry reuses them unchanged, per CONTEXT.md.

**Grant-hardening pattern to replicate for any new function** (lines 311-332): any new `security definer` function taking a `user_uuid`/similar argument must get an explicit `revoke all ... from public, anon, authenticated;` + a narrow `grant execute ... to service_role;` (or `authenticated` only if it operates strictly on `auth.uid()`), exactly like `mark_packages_read_only`/`delete_own_account` do. Supabase's security advisor flagged the cross-user RPC vector once already (see CLAUDE.md 2026-07-06 note) - repeat the fix proactively.

---

### `src/app/api/pass/intent/route.ts` (route, request-response)

**Analog:** `scanready/src/app/api/paket/intent/route.ts` (full file, 44 lines)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PAKET_PRICE_CENTS } from "@/lib/humanizer";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }
  try {
    const pi = await getStripe().paymentIntents.create({
      amount: PAKET_PRICE_CENTS,
      currency: "eur",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { feature: "paket" },
    });
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("paket intent error", err);
    return NextResponse.json(
      { error: "Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
```

**Deliberate deviation for `/api/pass/intent`:** unlike this analog, Pass REQUIRES an authenticated user (CONTEXT.md A1). Add an auth check using the server Supabase client (`getSupabaseServerClient()` pattern from `src/app/auth/callback/route.ts` / `src/app/api/subscription/checkout/route.ts` - read that route for the exact server-side session-read idiom before writing this route) BEFORE the Stripe call, returning 401 if no session. Use `metadata: { feature: 'pass', user_id: <uid> }` so the pass write-after-success step (webhook or a `/api/pass/verify` call) knows which user to credit. Never let this logic touch `/api/paket/intent` (keep the stateless anonymous rail untouched, per guardrail).

---

### Entitlement extension: `src/lib/humanizer.ts` (utility, request-response)

**Analog:** same file, existing `checkPaketPi` / `checkHumanizerEntitlement` (lines 43-75, quoted above in project context read). Add:

```typescript
export const PASS_PRICE_CENTS = 1499;
```

beside `HUMANIZER_PRICE_CENTS` (line 8) and `PAKET_PRICE_CENTS` (line 18), each with the same style of doc comment explaining amount + semantics. For the "live pass window" entitlement check (grants PDF export + refinements without a per-request PI), do NOT try to force it through `PaymentIntentLike`/`checkHumanizerEntitlement` - those types model a single Stripe PI. Instead add a **separate, new function** (e.g. `checkPassEntitlement(row: { expires_at: string | null } | null): boolean`) that takes a `humanizer_purchases` row (or null) and returns whether `expires_at` is null-safe and in the future - this is a DB-row check, not a Stripe-metadata check, so it belongs in `account.ts` or a new pure helper, tested the same way as `mapSaveError` in `account.ts` (pure function, no I/O, direct unit test).

---

### `src/components/PassModal.tsx` (component, request-response)

**Analog:** `scanready/src/components/PaketModal.tsx` (full file, 245 lines, read in full above)

**Structure to mirror exactly:** the `'use client'` header comment block explaining lazy `next/dynamic` load (fraud-cookie deferral), the `Step = 'intro' | 'payment'` state machine, the focus-management `useEffect` (lines 49-60), the Escape+Tab focus-trap `useEffect` (lines 68-102), the `startPayment()` fetch-then-`Elements` pattern (lines 104-115, 151-164), and the footer legal-links row (lines 166-171).

**Widerruf checkbox - the one deliberate divergence** (PaketModal lines 213-233):
```typescript
<label className="flex items-start gap-2 text-xs text-muted">
  <input
    type="checkbox"
    checked={widerrufOk}
    onChange={(e) => setWiderrufOk(e.target.checked)}
    className="mt-0.5 accent-[var(--color-accent,#0a7d63)]"
  />
  <span>
    Ich verlange ausdrücklich, dass mit der Ausführung vor Ablauf der Widerrufsfrist
    begonnen wird, und bestätige meine Kenntnis, dass mein Widerrufsrecht mit Beginn der
    Ausführung erlischt (§ 356 Abs. 5 BGB).
  </span>
</label>
<p className="text-xs text-muted -mt-2 pl-6">
  (I expressly request immediate delivery and acknowledge that my 14-day withdrawal
  right ends once delivery begins, German consumer law, § 356(5) BGB.)
</p>
```
`PassModal` must replace this text (never reuse verbatim, per CONTEXT.md A4) with the §356(4)/§357a proportional value-substitute wording from CONTEXT.md: "Ich verlange, dass der Pass sofort beginnt. Widerrufe ich innerhalb von 14 Tagen, zahle ich anteiligen Wertersatz für die bereits genutzte Laufzeit." Keep the same checkbox-gates-submit-button pattern (`disabled={!widerrufOk || paying || !stripeJs || !elements}`, line 237). Flag the new legal text with a code comment referencing PRD §9, same convention as the analog's `§ 356 Abs. 5 BGB` inline citation.

**track() calls to mirror** (lines 62-65, 154-157): `track('paket_opened')` on mount, `track('paket_paid')` on success -> use `track('pass_opened')` / `track('pass_paid')`.

---

### `src/app/konto/KontoClient.tsx` - `SavedPackagesSection` rebuild (component, CRUD)

**Analog:** same file, current section (lines 76-136, read in full above)

**Current gap to fix explicitly** (CONTEXT.md A2): the delete button at line 124-129 renders unconditionally regardless of `pkg.read_only` - the rebuild must keep delete always-available (contract) but HIDE rename/edit controls when `read_only` is true (not disable them), per the RLS silently-no-ops guardrail.

**Fetch/refresh pattern to keep** (lines 76-96):
```typescript
function SavedPackagesSection({ userId }: { userId: string }) {
  const { t } = useLang()
  const [packages, setPackages] = useState<ApplicationPackageRow[] | null>(null)

  async function refresh() {
    const rows = await listPackages(getSupabaseBrowserClient(), userId)
    setPackages(rows)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(pkg: ApplicationPackageRow) {
    if (!window.confirm(t.kontoDeleteConfirm)) return
    await deletePackage(getSupabaseBrowserClient(), pkg.id)
    await refresh()
  }
  ...
```
The card-gallery rebuild keeps this `refresh()`-after-mutation idiom (call `refresh()` after delete, rename, duplicate-save) rather than local optimistic state mutation, matching existing conventions throughout the file (`SubscriptionSection`, `DangerZoneSection` do the same fetch-then-setState pattern).

**Read-only badge pattern to extend into `MonoBadge`** (lines 117-121):
```typescript
{pkg.read_only && (
  <span className="ml-2 font-mono uppercase tracking-[0.1em] text-eyebrow">
    {t.savedApplicationsReadOnlyBadge}
  </span>
)}
```

---

### `src/app/app/page.tsx` - `SavedApplications` + `SaveApplicationButton` + `LOAD_PACKAGE` (component, CRUD)

**Analog:** same file, current sections

**`SavedApplications` gate + fetch pattern** (lines 711-730):
```typescript
function SavedApplications({ onOpen }: { onOpen: (pkg: ApplicationPackageRow) => void }) {
  const { t } = useLang()
  const { user } = useAccount()
  const [packages, setPackages] = useState<ApplicationPackageRow[] | null>(null)

  useEffect(() => {
    if (!accountsEnabled() || !user) {
      setPackages(null)
      return
    }
    let cancelled = false
    listPackages(getSupabaseBrowserClient(), user.id).then((rows) => {
      if (!cancelled) setPackages(rows)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!accountsEnabled() || !user || packages === null) return null
  ...
```
Reuse this exact "return null on disabled/signed-out/loading" convention for the rebuilt gallery card list; do not introduce a different empty/skeleton state than `EmptyState` (new primitive) for the truly-empty case.

**`SaveApplicationButton` state machine to extend into a save card** (lines 1009-1067, read in full above): the `'idle' | 'saving' | 'saved' | 'signed_out' | 'limit' | 'error'` union and the `handleClick` -> `onSave()` -> branch-on-result pattern is exactly what the CONTEXT.md A2 "save moment" rebuild (title field, saved-confirmation panel) must extend, not replace. The `state === 'limit'` block (lines 1056-1063) is precisely what `StorageGate` (A3) replaces:
```typescript
{state === 'limit' && (
  <p className="text-sm text-muted">
    {t.saveApplicationLimitHint}{' '}
    <a href="/konto" target="_blank" rel="noopener noreferrer" className="underline">
      {t.kontoLink}
    </a>
  </p>
)}
```
`StorageGate` becomes the new `state === 'limit'` branch's rendered content (same trigger condition, richer markup: eyebrow, H2, two-card grid, footer). Keep the `aria-live="polite"` sr-only announcement pattern (line 1044-1046) for the new saved-confirmation panel.

**Explicit-save-only guardrail is already encoded**: `onSave` is only invoked from `handleClick` (button click), never from a `useEffect`/blur handler anywhere in this component - preserve that shape.

**`derivePackageTitle` usage to reuse for pre-fill** (line 1773):
```typescript
packageTitle: derivePackageTitle(state.jobPosting),
```
Already imported at line 14 from `lebenslauf-utils.ts`; the save-card rebuild (A2) pre-fills AND pre-selects the title input from this exact call.

---

### `src/components/ui.tsx` - new primitives (component, request-response)

**Analog:** same file (full file read above, 81 lines)

**Const-export convention to follow for `MonoBadge` variants** (lines 73-80):
```typescript
export const CARD = 'rounded-xl border border-hair bg-card'
export const EYEBROW = 'font-mono text-xs uppercase tracking-[0.18em] text-eyebrow'
export const SKILL_CHIP = 'rounded-full bg-accent-soft px-3 py-1 text-sm text-accent'
export const NORM_NOTE = 'rounded-md border border-hair bg-accent-tint px-4 py-3 text-ink-soft'
```
Simple visual-shell primitives with no interactivity stay plain string consts (`SheetCard` if it's just a class string, `MonoBadge` variants) per the file's own doc comment: "A const, not a component: a one-line label as a component would be a shallow module." Only give a primitive a real function component when it needs internal state or event handlers (`KebabMenu`, `InlineRenameField`, `BottomSheet`) - model those on the `Btn` polymorphic-component pattern (lines 43-71) for prop typing style (discriminated unions, explicit prop stripping before spread).

**Focus-trap logic to lift into `KebabMenu`:** do NOT reinvent it - copy the Escape+Tab trap `useEffect` from `PaketModal.tsx` lines 68-102 (quoted above) almost verbatim, scoped to the menu's own ref instead of a dialog ref. This is the "match the modal a11y already done for HumanizerModal" instruction in CONTEXT.md.

**Button variant reuse:** `SavedConfirmationPanel`'s "In Meine Bewerbungen öffnen" link and `EmptyState`'s CTA should use `btnClass('secondary')` / `Btn` rather than inventing new button markup, consistent with every other component in the codebase (`KontoClient.tsx`, `app/page.tsx` all import `btnClass` from this file).

---

### `src/lib/i18n.tsx` - dictionary keys (config/i18n, transform)

**Analog:** same file, `Dict` type + `en`/`de` objects (structure shown in lines 25-80 above; full dictionary is ~854 lines)

**Pattern for plain vs. parameterized keys:**
```typescript
type Dict = {
  ...
  savedApplicationsUpdated: (date: string) => string
  ...
}
// en:
savedApplicationsUpdated: (date) => `Updated ${date}`,
// de:
savedApplicationsUpdated: (date) => `Aktualisiert ${date}`,
```
Every new key from the `.dc.html` copy decks (dotted groups `library.*`, `save.*`, `gate.*`, `pass.*` per CONTEXT.md) needs: (1) an entry in the `Dict` type, (2) a matching entry in BOTH the `en` and `de` object literals (the file's own comment says "`satisfies` on both language objects keeps them in lockstep" - grep for `satisfies Dict` near the `en`/`de` declarations before adding, so new keys trigger a type error if only added to one language). Copy is lifted VERBATIM from the `.dc.html` decks (dotted key names in the export map directly to flattened camelCase Dict keys, e.g. `library.emptyState.cta` -> `libraryEmptyStateCta`, following the existing flat-key convention - no nested objects in `Dict`).

**Provider/consumer pattern** (lines 817, 850-852):
```typescript
export function LangProvider({ children }: { children: React.ReactNode }) { ... }
export function useLang(): LangContextValue {
  const ctx = useContext(...)
  if (!ctx) throw new Error('useLang must be used within a LangProvider')
  ...
```
All new components (`PassModal`, `StorageGate`, gallery cards) call `const { t } = useLang()` exactly like `PaketModal`/`KontoClient`/`app/page.tsx` do - no new context, no prop-drilling of strings.

---

### `src/app/preise/page.tsx` (rebuild) (component, request-response)

**Analog:** same file, current structure (masthead/nav read above, full file 268 lines)

**Server-component + metadata pattern to keep** (lines 1-10):
```typescript
import type { Metadata } from "next";
import { Btn, CARD, EYEBROW } from "@/components/ui";

export const metadata: Metadata = {
  title: "Preise: ScanReady",
  description: "...",
  alternates: { canonical: "/preise" },
};
```
The rebuild stays a plain server component (no `'use client'`) with static pricing content - no interactivity needed except the "Geplant" CTA which can be a plain `<a>`/`Btn`, not a client handler, matching the current file's approach (`FolioEyebrow`, `CheckIcon` are simple presentational helper functions, not client state).

**`lang="de"` root wrapper convention** (line 46): `<div lang="de">` wraps the whole page, matching `/de` and `/kuendigen` - keep for the rebuild since Preise is German-only content per existing convention.

**Price-matches-code-constants guardrail:** the rebuild MUST read `HUMANIZER_PRICE_CENTS` (299), `PAKET_PRICE_CENTS` (499) from `src/lib/humanizer.ts`, and the new `PASS_PRICE_CENTS` (1499), rather than hardcoding "2,99 €" as a string, to satisfy CONTEXT.md's "Prices must match code constants" guardrail structurally (import + format, not just eyeball-match).

---

### `src/app/layout.tsx` (metadata extension) (config, request-response)

**Analog:** same file (full file read above, 55 lines)

**Metadata object to extend** (lines 13-30):
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(...),
  title: "ScanReady: Win the German Recruiter's First Scan",
  description: "...",
  openGraph: {
    title: "...",
    description: "...",
    type: "website",
  },
};
```
Add `icons: { icon: '/favicon.svg', ... }` and `openGraph.images: [{ url: '/og-scanready.svg', ... }]` as new keys inside this same object - do not create a second `metadata` export or a `generateMetadata` function; the file is a plain server component with a static `Metadata` const, keep that shape.

---

### `src/app/not-found.tsx` (new) (component, request-response)

**No direct analog** (first `not-found.tsx` in the app). Nearest structural pattern: `src/app/preise/page.tsx` masthead/nav block (lines 44-60, the sticky `<nav>` with the ScanReady wordmark link) for the page chrome, plus `src/lib/i18n.tsx`'s `useLang()` if the 404 needs the EN/DE toggle (CONTEXT.md says "full DE/EN copy in the .dc.html" - since this is a top-level route outside `/app`, it likely does NOT wrap in `LangProvider`; render both language copies as static text or pick based on `Accept-Language`/no toggle, consistent with how `/de` vs `/` are two separate static pages rather than one toggled page - follow that split-static-page precedent, not the `useLang()` toggle precedent, unless the executor wires a `LangProvider` explicitly). Must have zero animation (`reduced-motion-safe, no animation` per CONTEXT.md) - do not import any of the Typesetting Theater `scan-sweep`/motion classes used in `LoadingView`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `public/*.svg` (favicon, og-scanready, lockup ×2, mark, stacked) | config | file-I/O | Pure asset copy from the design export's `assets/` folder into `public/`; no code pattern to extract, just a `cp` + reference update in `layout.tsx`. |
| `src/components/BottomSheet.tsx` (if split out) | component | event-driven | No existing mobile bottom-sheet pattern anywhere in the codebase; build from the `ds-update/` spec + the `KebabMenu` focus-trap pattern (nearest available a11y analog), not from an existing component. |

## Metadata

**Analog search scope:** `scanready/src/components/`, `scanready/src/app/`, `scanready/src/lib/`, `scanready/supabase/migrations/`
**Files scanned:** ~14 read in full or targeted ranges (PaketModal.tsx, HumanizerModal.tsx referenced but not re-read since PaketModal already covers the same a11y pattern verbatim, paket/intent/route.ts, humanizer.ts, ui.tsx, 0001_stage3_accounts.sql, account.ts, KontoClient.tsx, config.ts, layout.tsx, i18n.tsx (targeted), app/page.tsx (targeted), preise/page.tsx (targeted))
**Pattern extraction date:** 2026-07-07
