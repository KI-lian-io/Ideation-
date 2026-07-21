import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkPaketPi, type PiCheck } from "@/lib/humanizer";
import { checkPassEntitlement, getActivePass } from "@/lib/account";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { accountsEnabled } from "@/lib/supabase/config";
import { enforceRateLimit, enforceSameOrigin, readJsonObject } from "@/lib/abuse-guards";

export const runtime = "nodejs";

type PiCheckReason = Extract<PiCheck, { ok: false }>["reason"];

/**
 * POST /api/paket/verify
 *   { paymentIntentId?: string } → { ok: true } | { error, reason? }
 *
 * Server-side unlock check the client calls before enabling PDF exports: the
 * PDF itself is generated fully client-side (window.print(), see AppShell's
 * printJob seam), so this endpoint is the payment-verification seam, not a
 * fulfillment step. Deliberately read-only on the PI: the Paket export unlock
 * is a standing per-application entitlement, never marked consumed (only the
 * included Humanizer+ refinement is single-use, handled in /api/humanize).
 *
 * Two ways to unlock: (a) the original anonymous PI-first path (a paid Paket
 * PaymentIntent, unchanged below), or (b) a signed-in account holder with a
 * live Bewerbungsphase-Pass window (07-CONTEXT.md A1) - checked only as a
 * fallback when (a) does not already unlock, and only for a signed-in
 * caller, so anonymous behavior is unaffected. paymentIntentId is therefore
 * optional: a Pass holder with no Paket purchase can omit it entirely.
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
  const paymentIntentIdRaw = reqBody?.paymentIntentId;
  const paymentIntentIdValid =
    paymentIntentIdRaw === undefined || typeof paymentIntentIdRaw === "string";
  if (!paymentIntentIdValid) {
    return NextResponse.json(
      { error: "paymentIntentId ist erforderlich." },
      { status: 400 }
    );
  }
  const paymentIntentId = typeof paymentIntentIdRaw === "string" ? paymentIntentIdRaw : undefined;

  // Path (a): PI-first path, byte-for-byte the original anonymous flow. Only
  // entered when a paymentIntentId was actually sent.
  let unlocked = false;
  let checkReason: PiCheckReason = "not_paid";

  if (paymentIntentId) {
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
    if (check.ok) {
      unlocked = true;
    } else {
      checkReason = check.reason;
    }
  }

  // Path (b): signed-in Pass fallback. Only runs when path (a) did not
  // already unlock. Anonymous callers have no session, so they never reach
  // this branch, and the checkPaketPi path above stays their only path.
  if (!unlocked && accountsEnabled()) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const pass = await getActivePass(supabase, user.id);
      if (checkPassEntitlement(pass)) {
        unlocked = true;
      }
    }
  }

  if (!unlocked) {
    const messages: Record<PiCheckReason, string> = {
      not_paid: "Die Zahlung ist noch nicht abgeschlossen.",
      wrong_feature: "Ungültige Zahlungsreferenz.",
      consumed: "Diese Zahlung wurde bereits eingelöst.", // unreachable for paket; kept for the shared PiCheck shape
    };
    return NextResponse.json(
      { error: messages[checkReason], reason: checkReason },
      { status: 402 }
    );
  }

  return NextResponse.json({ ok: true });
}
