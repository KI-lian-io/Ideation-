import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { adminConfigured, getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isActiveStatus, mapStripeSubscription, type StripeSubscriptionLike } from "@/lib/subscription";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 * Syncs Stripe subscription state into Supabase. Deliberately NO same-origin
 * or rate-limit guards: Stripe posts cross-origin, and the HMAC signature
 * check (constructEvent with STRIPE_WEBHOOK_SECRET) IS the authentication.
 *
 * Handled events:
 *  - checkout.session.completed: links the Stripe customer to the profile
 *  - customer.subscription.created/updated/deleted: upserts the subscriptions
 *    row (keyed on stripe_subscription_id, so replays are idempotent) and
 *    flips the packages read_only state to match the free/paid boundary
 *    (spec D4: downgrade keeps the most recent package editable).
 *
 * Error contract: 400 only for a bad/missing signature; 503 when env is
 * missing; 500 on handler errors so Stripe retries (safe: every write is an
 * idempotent upsert or an idempotent RPC); 200 for handled AND unhandled
 * event types (unhandled types are simply acknowledged).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !isStripeConfigured() || !adminConfigured()) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  // Raw body required: constructEvent verifies the HMAC over the exact bytes.
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (userId && customerId) {
          await admin
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const row = mapStripeSubscription(
          event.data.object as unknown as StripeSubscriptionLike
        );
        // Owner resolution: metadata first (set at checkout via
        // subscription_data.metadata), profiles lookup by customer as the
        // fallback for events that predate the metadata write.
        let userId = row.user_id;
        if (!userId && row.customer_id) {
          const { data } = await admin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", row.customer_id)
            .maybeSingle();
          userId = data?.id ?? null;
        }
        if (!userId) break; // nobody to attach to; ack so Stripe stops retrying

        const { error: upsertError } = await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_subscription_id: row.stripe_subscription_id,
            status: row.status,
            current_period_end: row.current_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        if (upsertError) throw upsertError;

        if (isActiveStatus(row.status)) {
          const { error } = await admin.rpc("clear_packages_read_only", { user_uuid: userId });
          if (error) throw error;
        } else {
          const { error } = await admin.rpc("mark_packages_read_only", { user_uuid: userId });
          if (error) throw error;
        }
        break;
      }
      default:
        break; // unhandled event types are acknowledged, not errors
    }
  } catch (err) {
    console.error("stripe webhook handler error", err); // event ids only, never user content
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
