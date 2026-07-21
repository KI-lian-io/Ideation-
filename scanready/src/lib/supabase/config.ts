/**
 * Stage 3 accounts: single source of truth for "is the accounts layer on".
 *
 * Same fail-open convention as src/lib/abuse-guards.ts and src/lib/stripe.ts
 * (isStripeConfigured): accounts are an opt-in layer that must stay completely
 * inert until a founder provisions Supabase. Every account entry point (auth
 * callback route, AccountProvider, account.ts data helpers) calls this first;
 * when it is false, no Supabase client is constructed and no Supabase code
 * runs. This keeps the anonymous flow's zero-retention guarantee true by
 * construction, not by convention.
 *
 * Client-safe (NEXT_PUBLIC_ vars only) so it can be imported from both server
 * and 'use client' code without leaking server-only env into the browser
 * bundle in a way that changes behavior.
 */
export function accountsEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
