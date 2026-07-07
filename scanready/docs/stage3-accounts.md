# Stage 3 accounts: setup runbook

Status as of 2026-07-06 (live founder session):
- [x] Supabase EU project created (Frankfurt, ref `thgmhbzimnjcaoqyyiyp`)
- [x] Migration 0001 applied; Supabase security advisor clean (function-grant
      hardening applied live and mirrored into the migration file; the only
      remaining advisor line is the intentional `delete_own_account()`
      authenticated grant)
- [x] Google OAuth configured (External/testing mode, founder as test user)
      and verified end to end: sign-in works, `handle_new_user` trigger
      created the profiles row
- [x] Local `scanready/.env.local` carries the URL + publishable key
      (note: new-style `sb_publishable_...` key goes under our var name
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`; it is the drop-in anon-key successor)
- [x] Supabase MCP wired project-scoped via `.mcp.json` (interactive
      sessions can run SQL/advisors directly)
- [x] Accounts E2E (save 1 package, 2nd blocked by DB limit, reload + load)
      - Verified 2026-07-06: E2E PASSED against the live Frankfurt project
        (ref `thgmhbzimnjcaoqyyiyp`) through the real UI on the localhost
        dev server. Method: Google OAuth cannot run headless, so a
        disposable email user was created via the public signup API
        (the email provider is enabled alongside Google), confirmed via
        SQL, signed in via password grant, and the session was injected
        as the `@supabase/ssr` cookie; server-side session validation was
        confirmed. The test user was deleted afterwards via the app's own
        `delete_own_account()` RPC, returning the DB to baseline with only
        the founder account remaining.
      - Verified: saving one package created 1 `cvs` row + 1
        `application_packages` row; a second save was blocked by the
        `enforce_package_limit` trigger at the DB layer with the correct
        UI limit hint; after reload, the saved package listed in
        InputView and loaded back into the result phase intact via
        `LOAD_PACKAGE`.
      - Also verified via SQL probes: cross-user RLS (another user's JWT
        sees 0 rows), the read_only downgrade contract (owner UPDATE
        affects 0 rows, SELECT still works), `handle_new_user` firing for
        email signups too, and `delete_own_account()` cascading removal
        of `profiles`/`cvs`/`application_packages`.
- [ ] Vercel env vars (Preview first, Production only after legal review)
- [ ] Subscription: Stripe Price + webhook (section 7) and §312k legal
      review (section 8)
- [x] Migration 0002_pass applied (2026-07-07, phase 07 plan 07-02): applied
      via `mcp__supabase__apply_migration` to project `thgmhbzimnjcaoqyyiyp`
      (success:true). Live verification confirmed:
      `humanizer_purchases.expires_at` column exists, constraint
      `humanizer_purchases_pass_requires_user` exists,
      `enforce_package_limit()` definition contains `pass_30d` and `>= 25`,
      trigger `trg_enforce_package_limit` present. Security advisors showed
      zero new findings from this migration (only the two pre-existing
      WARNs: the intentional `delete_own_account` SECURITY DEFINER RPC, and
      the auth leaked-password-protection dashboard toggle, both known
      founder items).
- [x] Migration 0003_pass_requires_user_fix applied (2026-07-07, phase 07
      code-review fix CR-01): applied via `mcp__supabase__apply_migration` to
      project `thgmhbzimnjcaoqyyiyp` (success:true). Replaces the 0002
      `humanizer_purchases_pass_requires_user` CHECK constraint (which broke
      GDPR account deletion for any Pass purchaser, because the 0001 FK's
      `ON DELETE SET NULL` UPDATE violated the CHECK) with an INSERT-only
      trigger `trg_pass_requires_user`. Live verification confirmed: the old
      CHECK constraint is gone (pg_constraint count 0), the trigger and
      `enforce_pass_requires_user()` function are present, and the FK still
      uses `ON DELETE SET NULL` (`confdeltype = 'n'`). Behavioral probes
      (rolled back, zero residue): a null-owner `pass_30d` insert is still
      rejected by the trigger, and a deletion-style `UPDATE ... SET user_id =
      NULL` on an existing `pass_30d` row now succeeds. Security advisors:
      still only the same two pre-existing WARNs, zero new findings.

Follow-ups found during the 2026-07-06 E2E (not fixed by this doc edit):
- KNOWN ISSUE: `saveApplicationPackage` inserts the `cvs` row before the
  guarded package insert, so every limit-blocked save leaks one orphaned
  `cvs` row containing the full CV text. A fix is in progress in a
  separate session; recorded here as a known issue only.
- NOTE: the Supabase email/password provider is enabled on the project
  while the UI only offers Google sign-in. The founder may want to
  disable the email provider in the dashboard if Google-only sign-in is
  intended.

The rest of this file is the original checklist; done items above stay
documented below for rebuild-from-scratch scenarios. Nothing here affects
the anonymous tool flow at `/app`, which stays fully stateless regardless
of whether accounts are turned on.

Background: `docs/superpowers/specs/2026-07-03-monetization-humanizer-design.md`
(D4-D7). The build-only-on-conversion-evidence gate was consciously
overridden by the founder on 2026-07-06 (goal-directed session).

## 1. Create the Supabase project

1. Go to supabase.com, create a new project.
2. Region: pick an **EU region** (e.g. Frankfurt, `eu-central-1`). This is a
   hard requirement, not a preference: GDPR data-residency posture depends on
   it, and it cannot be changed after project creation.
3. Note the project's:
   - Project URL (`https://<ref>.supabase.co`)
   - `anon` public API key
   - `service_role` secret key (reserved for the webhook task, do not use it
     in any browser-reachable code)

## 2. Run the migration

1. Open the Supabase SQL editor for the new project.
2. Paste the full contents of `supabase/migrations/0001_stage3_accounts.sql`
   and run it once, top to bottom.
3. Confirm in the Table Editor that these tables now exist, each with RLS
   enabled (a small lock icon next to the table name):
   - `profiles`
   - `subscriptions`
   - `cvs`
   - `application_packages`
   - `humanizer_purchases`
4. Confirm these database functions exist (Database -> Functions):
   - `handle_new_user` (trigger target)
   - `enforce_package_limit` (trigger target, the free/paid guard)
   - `mark_packages_read_only`
   - `clear_packages_read_only`
   - `delete_own_account`

## 3. Enable Google as an OAuth provider

1. In the Supabase dashboard: Authentication -> Providers -> Google -> enable.
2. In Google Cloud Console, create an OAuth 2.0 Client ID (type: Web
   application) if one does not already exist for this project.
3. Add this Authorized redirect URI to the Google OAuth client:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the Google Client ID and Client Secret into the Supabase Google
   provider settings and save.
5. Note: this is a *different* redirect URI than the app's own
   `/auth/callback` route. Supabase's own callback (above) receives the
   Google redirect first, then Supabase redirects onward to the app's
   `redirectTo` (`<site>/auth/callback`), which is where
   `src/app/auth/callback/route.ts` exchanges the code for a session.

## 4. Set environment variables in Vercel

Add to the Vercel project (Production and Preview, or however this project
already splits its env vars):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

`SUPABASE_SERVICE_ROLE_KEY` is reserved for the follow-up Stripe-webhook
task (writes to `subscriptions` bypass RLS via the service role). Do not
set it yet unless that task is also landing; it must never be prefixed
`NEXT_PUBLIC_` and must never be sent to the browser.

Until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both
set, `accountsEnabled()` (`src/lib/supabase/config.ts`) returns false and:
- `AccountProvider` renders children untouched and exposes no-op sign-in/out
  stubs; no Supabase client is ever constructed.
- `/auth/callback` responds 404.
- Every helper in `src/lib/account.ts` returns a safe no-op result without
  calling Supabase.

Redeploy after setting the variables (env var changes require a new
deployment to take effect).

## 5. Cookies and legal text (heads-up, not this task's scope)

Once accounts are live, signed-in users receive Supabase's auth cookies
(access/refresh tokens) -- these are technically necessary cookies for the
authenticated session, not tracking cookies, and do not change the
"keine Cookies" claim for anonymous users (who never sign in and never
receive them). Updating `datenschutz` copy to describe this precisely, and
building the actual account UI (sign-in button, saved-packages list, delete
button wired to `deleteAccount()`), is a separate follow-up integration task
by design -- this task only ships the foundation.

## 6. Smoke test once live

1. Visit `/app`, click sign-in (once the follow-up UI task adds a button
   calling `useAccount().signInWithGoogle()`).
2. Complete the Google consent screen.
3. Confirm redirect lands back on `/app` with a signed-in user.
4. Check the Supabase Table Editor: a new `profiles` row should exist for
   the new `auth.users` row (proves the `handle_new_user` trigger fired).
5. Save one application package (once the UI task wires
   `saveApplicationPackage()`), then attempt a second: it should be rejected
   with `{ ok: false, reason: 'limit' }` while the account has no active
   subscription (proves the DB-level guard, not just UI, blocks it).

## 7. Subscription billing setup (Stripe)

The billing rails are code-complete and env-gated. To activate:

1. In the Stripe dashboard, create a recurring monthly Price for the
   "Konto & Speichern" subscription (spec D2: pick a number in the
   3,99-5,99 EUR range) and copy its price id (price_...).
2. Add a webhook endpoint pointing at `<site-url>/api/stripe/webhook`,
   subscribed to: `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret (whsec_...).
3. Set in Vercel:
   - `STRIPE_SUBSCRIPTION_PRICE_ID` (the price id from step 1)
   - `STRIPE_WEBHOOK_SECRET` (the signing secret from step 2)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase project settings -> API; the
     webhook writes `subscriptions` rows and flips package read-only state,
     which RLS would block for any lesser key)
4. Redeploy. Without any of these, `/api/subscription/*` answers a German
   503 and the webhook responds 503 without touching anything.

Flow once live: /konto (built by the accounts-UI task) -> POST
/api/subscription/checkout -> Stripe Checkout (redirect is fine here: no
client-memory content to lose, unlike the letter flows) -> webhook syncs
the `subscriptions` row -> the DB package-limit trigger starts honoring the
subscription automatically.

## 8. Kuendigungsbutton (§312k BGB) - FOUNDER legal review required

`/kuendigen` carries the statutory "Verträge hier kündigen" wording, is
linked from every footer, explains that the one-shot purchases have nothing
to cancel, and (while accounts are enabled) offers a one-click cancellation
for the signed-in subscriber with an on-screen confirmation of receipt
(timestamp + period end). Identification happens via the same Google
account used at purchase.

Whether this implementation satisfies §312k in full (e.g. the
identification step, the form of the confirmation) is a legal judgment:
have it reviewed together with the AGB before the subscription goes live.
The AGB (`/agb`) and Datenschutz (`/datenschutz`) render their
subscription/account sections only while `accountsEnabled()` is true, so
the live legal texts always match the deployed configuration.
