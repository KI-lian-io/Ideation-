import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { HUMANIZER_PRICE_CENTS } from "@/lib/humanizer";

export const runtime = "nodejs";

/**
 * POST /api/humanizer/intent → { clientSecret }
 * Creates the €2.99 PaymentIntent for one Humanizer+ refinement. Stateless:
 * no body, no user data. allow_redirects: 'never' keeps the whole payment
 * inside the embedded Payment Element (the letter lives only in client memory).
 */
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }
  try {
    const pi = await stripe.paymentIntents.create({
      amount: HUMANIZER_PRICE_CENTS,
      currency: "eur",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { feature: "humanizer" },
    });
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("humanizer intent error", err); // Stripe error only — never user content
    return NextResponse.json(
      { error: "Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
