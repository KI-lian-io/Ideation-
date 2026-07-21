/**
 * Stage 3 subscription billing: pure helpers + env config, shared by the
 * checkout, cancel and webhook routes. Pure logic here (testable); Stripe and
 * Supabase I/O stay in the routes, same split as src/lib/humanizer.ts.
 *
 * Env: STRIPE_SUBSCRIPTION_PRICE_ID names the recurring Stripe Price for the
 * accounts subscription (spec D2: ~3,99-5,99 EUR/month, founder sets the
 * actual number when creating the Price in the Stripe dashboard). Fail-open
 * convention: without it (or without Stripe/Supabase env) the subscription
 * routes answer 503 and nothing else changes.
 */
// Relative imports with explicit .ts extensions deliberately: this file is
// exercised by node's test runner (npm test), which resolves neither the @/
// path alias nor extensionless relative ESM imports (same convention as
// account.ts).
import { isStripeConfigured } from "./stripe.ts";
import { accountsEnabled } from "./supabase/config.ts";

export function subscriptionPriceId(): string | null {
  return process.env.STRIPE_SUBSCRIPTION_PRICE_ID || null;
}

/** Gate for user-facing subscription routes (checkout / cancel). */
export function subscriptionConfigured(): boolean {
  return Boolean(isStripeConfigured() && subscriptionPriceId() && accountsEnabled());
}

/** Subscription states that count as "paying" for the free/paid package
 * boundary. Must match the SQL guard in
 * supabase/migrations/0001_stage3_accounts.sql (enforce_package_limit). */
export function isActiveStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Minimal shape of a Stripe subscription event payload, covering both API
 * generations: pre-Basil (current_period_end on the subscription) and
 * post-Basil (current_period_end moved onto each subscription item). The
 * webhook maps whatever Stripe sends into one row shape for the
 * `subscriptions` table.
 */
export type StripeSubscriptionLike = {
  id: string;
  status: string;
  customer: string | { id: string };
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> };
  metadata?: Partial<Record<string, string>>;
  /** Stripe's own un-cancel flag: true while a cancellation is scheduled for
   * period end but the subscription is still active. */
  cancel_at_period_end?: boolean;
};

export type SubscriptionRow = {
  stripe_subscription_id: string;
  status: string;
  /** ISO timestamp or null when Stripe sent no period end. */
  current_period_end: string | null;
  /** From subscription_data.metadata.supabase_user_id set at checkout; null
   * when absent (webhook then falls back to a profiles lookup by customer). */
  user_id: string | null;
  customer_id: string | null;
  /** Mirrors migration 0004's subscriptions.cancel_at_period_end column
   * (not null, default false). Undefined on the Stripe payload maps to
   * false, same default as the DB column. */
  cancel_at_period_end: boolean;
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
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
  };
}
