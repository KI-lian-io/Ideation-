import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PASS_PRICE_CENTS } from "@/lib/humanizer";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { accountsEnabled } from "@/lib/supabase/config";

export const runtime = "nodejs";

/**
 * POST /api/pass/intent -> { clientSecret }
 * Creates the 14,99 EUR PaymentIntent for the 30-day Bewerbungsphase-Pass
 * (PRD 6.2). Mirrors /api/paket/intent's guard order and PI shape exactly,
 * with one deliberate deviation: a Pass is an account-bound entitlement, not
 * a stateless per-application token, so this route REQUIRES a signed-in
 * session before minting anything (401 otherwise) and tags the PI with
 * `user_id` so /api/pass/verify knows which account to credit after a
 * successful charge. This logic must never leak into /api/paket/intent or
 * /api/humanizer/intent, which stay anonymous and stateless.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }
  if (!accountsEnabled()) {
    return NextResponse.json(
      { error: "Der Pass ist derzeit nicht verfügbar." },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte melden Sie sich an, um den Pass zu kaufen." },
      { status: 401 }
    );
  }

  try {
    const pi = await getStripe().paymentIntents.create({
      amount: PASS_PRICE_CENTS,
      currency: "eur",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { feature: "pass", user_id: user.id },
    });
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("pass intent error", err); // Stripe error only, never user content
    return NextResponse.json(
      { error: "Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
