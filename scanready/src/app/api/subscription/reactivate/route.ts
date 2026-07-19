import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { accountsEnabled } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isActiveStatus } from "@/lib/subscription";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";

/**
 * POST /api/subscription/reactivate -> { ok: true }
 * Un-cancel: flips Stripe's cancel_at_period_end back to false on the
 * signed-in user's own active-but-cancelling subscription(s). Near-mirror of
 * /api/subscription/cancel/route.ts (same guard order, same auth, same
 * dual-write acceptance: this route only talks to Stripe, the subscriptions
 * table row is synced by the webhook on the resulting
 * customer.subscription.updated event, since the table has no client write
 * policy). Identification is the signed-in Supabase session, same as cancel.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  if (!accountsEnabled() || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Derzeit bestehen keine reaktivierbaren Abonnements." },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte melden Sie sich an, um Ihr Abonnement zu reaktivieren." },
      { status: 401 }
    );
  }

  // RLS: the user session only sees their own rows (subscriptions_select_own).
  const { data: rows, error: dbError } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status, current_period_end, cancel_at_period_end");
  if (dbError) {
    return NextResponse.json(
      { error: "Abonnement konnte nicht geladen werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }

  // Reactivate only rows that are active AND currently flagged to cancel: a
  // non-cancelling or already-inactive subscription cannot be "un-cancelled".
  const cancelling = (rows ?? []).filter(
    (r) => isActiveStatus(r.status) && r.cancel_at_period_end
  );
  if (cancelling.length === 0) {
    return NextResponse.json(
      { error: "Für dieses Konto besteht keine gekündigte Buchung." },
      { status: 404 }
    );
  }

  try {
    for (const row of cancelling) {
      await getStripe().subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      // Deliberately no client-side subscriptions row write here: the table
      // has no client write policy (defense in depth), so Stripe is the
      // source of truth and the webhook's customer.subscription.updated
      // handler is the durable sync path, same model as cancel/route.ts.
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscription reactivate error", err); // Stripe error only, never user content
    return NextResponse.json(
      { error: "Die Reaktivierung konnte nicht übermittelt werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
