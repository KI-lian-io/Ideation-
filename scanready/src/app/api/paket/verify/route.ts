import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkPaketPi } from "@/lib/humanizer";
import { enforceRateLimit, enforceSameOrigin, readJsonObject } from "@/lib/abuse-guards";

export const runtime = "nodejs";

/**
 * POST /api/paket/verify
 *   { paymentIntentId: string } → { ok: true } | { error, reason? }
 *
 * Server-side unlock check the client calls before enabling PDF exports: the
 * PDF itself is generated fully client-side (window.print(), see AppShell's
 * printJob seam), so this endpoint is the payment-verification seam, not a
 * fulfillment step. Deliberately read-only on the PI: the Paket export unlock
 * is a standing per-application entitlement, never marked consumed (only the
 * included Humanizer+ refinement is single-use, handled in /api/humanize).
 *
 * The machine-readable `reason` on 402 lets the client distinguish "this
 * stored PI is genuinely invalid, drop it" (wrong_feature / not_paid) from
 * transient verification failures (502) where the unlock should be retried,
 * not forgotten.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "intent");
  if (rateBlock) return rateBlock;

  const reqBody = await readJsonObject(req);
  const paymentIntentId = reqBody?.paymentIntentId;
  if (typeof paymentIntentId !== "string" || !paymentIntentId) {
    return NextResponse.json(
      { error: "paymentIntentId ist erforderlich." },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }

  let pi;
  try {
    pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json(
      { error: "Zahlung konnte nicht überprüft werden. Bitte erneut versuchen." },
      { status: 502 }
    );
  }

  const check = checkPaketPi(pi);
  if (!check.ok) {
    const messages: Record<string, string> = {
      not_paid: "Die Zahlung ist noch nicht abgeschlossen.",
      wrong_feature: "Ungültige Zahlungsreferenz.",
      consumed: "Diese Zahlung wurde bereits eingelöst.", // unreachable for paket; kept for the shared PiCheck shape
    };
    return NextResponse.json(
      { error: messages[check.reason], reason: check.reason },
      { status: 402 }
    );
  }

  return NextResponse.json({ ok: true });
}
