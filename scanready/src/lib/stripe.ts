import Stripe from "stripe";

/**
 * Server-only Stripe client, constructed lazily on first use.
 * stripe@22 throws synchronously on a missing/empty apiKey, so a module-scope
 * singleton would crash at import time when STRIPE_SECRET_KEY is unset. The
 * accessor throws a clear error instead — routes check isStripeConfigured()
 * first and return a German 503, so this throw is a programming-error backstop,
 * never a user-facing path.
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_SECRET_KEY is not set — guard with isStripeConfigured() first.");
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}
