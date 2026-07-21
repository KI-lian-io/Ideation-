/**
 * Single source of truth for "are the paid one-shot features on".
 *
 * Gates the Humanizer+ refinement and the Bewerbungspaket PDF export purchase
 * flow. Same fail-open convention as src/lib/supabase/config.ts
 * (accountsEnabled) and src/lib/stripe.ts (isStripeConfigured): payments are an
 * opt-in layer that must stay completely inert until a founder provisions
 * Stripe keys.
 *
 * This lives in its own module rather than stripe.ts because stripe.ts
 * imports the server-only `stripe` package at module scope; importing that
 * from a 'use client' component would pull server code into the browser
 * bundle. This module reads only a NEXT_PUBLIC_ variable, so it is safe to
 * import from both server components and 'use client' code.
 */
export function paymentsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
