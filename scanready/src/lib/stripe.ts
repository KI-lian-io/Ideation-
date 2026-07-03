import Stripe from "stripe";

/**
 * Server-only Stripe client. Mirrors the anthropic.ts singleton pattern.
 * STRIPE_SECRET_KEY comes from .env.local / Vercel env.
 *
 * stripe@22's constructor throws synchronously on an empty/undefined apiKey
 * ("Neither apiKey nor config.authenticator provided"), which would crash this
 * module (and every route importing it) at boot when the key isn't configured.
 * The intent route already checks `!process.env.STRIPE_SECRET_KEY` and returns
 * a 503 before touching `stripe`, so a placeholder key here only matters if
 * that guard is ever bypassed — in which case Stripe's own API call fails with
 * an auth error, caught by the route's try/catch as a 502.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_unconfigured");
