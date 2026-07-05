# Stage 3 accounts: setup runbook

Status: code-complete on the branch, inert until the env vars below are set.
This is a founder-actions checklist, not engineering work. Nothing here
affects the anonymous tool flow at `/app`, which stays fully stateless
regardless of whether accounts are turned on.

Background: `docs/superpowers/specs/2026-07-03-monetization-humanizer-design.md`
(D4-D7). Only build/turn on Stage 3 once Humanizer+ (Stage 1) shows
conversion, per that spec.

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
