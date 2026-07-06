import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only code (the Stripe webhook and
 * any other route that must write rows RLS would block, e.g. `subscriptions`
 * and `profiles.stripe_customer_id`).
 *
 * SERVER-ONLY: this module must never be imported from a client component.
 * SUPABASE_SERVICE_ROLE_KEY is deliberately NOT prefixed NEXT_PUBLIC_, so the
 * bundler cannot inline it into browser code; importing this file client-side
 * would still be a bug (adminConfigured() would just always be false there),
 * hence the loud comment.
 *
 * Same lazy + guard convention as src/lib/stripe.ts (isStripeConfigured) and
 * src/lib/supabase/{client,server}.ts: construct nothing at import time so
 * `next build` succeeds with zero Supabase env set, throw only on the
 * programming-error path where a caller skipped the adminConfigured() check.
 */
let adminClient: SupabaseClient | null = null;

export function adminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminConfigured()) {
    throw new Error(
      "Supabase admin env not set: guard call sites with adminConfigured() first."
    );
  }
  adminClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Service-role usage is stateless server-to-server: no session to
        // persist or refresh, and definitely nothing to write to storage.
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  return adminClient;
}
