import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { accountsEnabled } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isActiveStatus } from "@/lib/subscription";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";

/**
 * POST /api/subscription/cancel -> { ok: true, endsAt }
 * §312k-backed cancellation: sets cancel_at_period_end on the signed-in
 * user's active subscription(s). The subscriptions table row is synced by the
 * webhook when Stripe emits customer.subscription.updated; this route only
 * talks to Stripe. Identification is the signed-in Supabase session (the same
 * Google account used at purchase), see /kuendigen.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  if (!accountsEnabled() || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Derzeit bestehen keine kündbaren Abonnements." },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte melden Sie sich an, um Ihr Abonnement zu kündigen." },
      { status: 401 }
    );
  }

  // RLS: the user session only sees their own rows (subscriptions_select_own).
  const { data: rows, error: dbError } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status, current_period_end");
  if (dbError) {
    return NextResponse.json(
      { error: "Abonnement konnte nicht geladen werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }

  const active = (rows ?? []).filter((r) => isActiveStatus(r.status));
  if (active.length === 0) {
    return NextResponse.json(
      { error: "Für dieses Konto besteht kein aktives Abonnement." },
      { status: 404 }
    );
  }

  try {
    let endsAt: string | null = null;
    for (const row of active) {
      await getStripe().subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      endsAt = row.current_period_end ?? endsAt;
    }
    return NextResponse.json({ ok: true, endsAt });
  } catch (err) {
    console.error("subscription cancel error", err); // Stripe error only, never user content
    return NextResponse.json(
      { error: "Die Kündigung konnte nicht übermittelt werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
