import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { subscriptionConfigured, subscriptionPriceId } from "@/lib/subscription";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";

/**
 * POST /api/subscription/checkout -> { url }
 * Creates a Stripe Checkout Session (mode: subscription) for the signed-in
 * account holder. Requires the full Stage 3 env (Stripe + price id +
 * Supabase); answers a German 503 otherwise, same fail-open convention as
 * every other paid route.
 *
 * Checkout's redirect flow is fine HERE, unlike the Humanizer/Paket flows
 * (spec D8 rejected redirects for those because the letter lives only in
 * client memory): at subscription time there is no unsaved client-memory
 * content to strand, the user is on /konto.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  if (!subscriptionConfigured()) {
    return NextResponse.json(
      { error: "Das Abonnement ist derzeit nicht verfügbar." },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte melden Sie sich an, um ein Abonnement abzuschließen." },
      { status: 401 }
    );
  }

  const origin = req.nextUrl.origin;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: subscriptionPriceId()!, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      success_url: `${origin}/konto?sub=success`,
      cancel_url: `${origin}/konto?sub=cancelled`,
      // supabase_user_id travels on the subscription itself so every
      // customer.subscription.* webhook event can resolve the owner without
      // a session lookup.
      subscription_data: { metadata: { supabase_user_id: user.id } },
      allow_promotion_codes: false,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("subscription checkout error", err); // Stripe error only, never user content
    return NextResponse.json(
      { error: "Das Abonnement konnte nicht gestartet werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
