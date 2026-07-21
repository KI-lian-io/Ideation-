import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PAKET_PRICE_CENTS } from "@/lib/humanizer";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";

/**
 * POST /api/paket/intent → { clientSecret }
 * Creates the €4.99 PaymentIntent for one Bewerbungspaket (print-PDF export of
 * both documents + one included Humanizer+ refinement, "pro Bewerbung" - spec
 * D3). Stateless: no body, no user data. Mirrors /api/humanizer/intent exactly,
 * just a different amount + feature tag. allow_redirects: 'never' keeps the
 * whole payment inside the embedded Payment Element.
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
  try {
    const pi = await getStripe().paymentIntents.create({
      amount: PAKET_PRICE_CENTS,
      currency: "eur",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { feature: "paket" },
    });
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("paket intent error", err); // Stripe error only, never user content
    return NextResponse.json(
      { error: "Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
