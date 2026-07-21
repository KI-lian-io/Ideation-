import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PASS_PRICE_CENTS, PASS_WINDOW_DAYS } from "@/lib/humanizer";
import { enforceRateLimit, enforceSameOrigin, readJsonObject } from "@/lib/abuse-guards";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { accountsEnabled } from "@/lib/supabase/config";
import { adminConfigured, getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * POST /api/pass/verify
 *   { paymentIntentId: string } -> { ok: true } | { error, reason? }
 *
 * Server-side verification + fulfillment for the Bewerbungsphase-Pass. Unlike
 * /api/paket/verify (read-only: Stripe stays the sole token store), a Pass is
 * an account-bound 30-day window, so a successful verify here WRITES the
 * pass_30d row via the service-role client (RLS has no insert policy for
 * regular clients on humanizer_purchases).
 *
 * The PI must have succeeded AND carry metadata.user_id matching the
 * caller's own session before any row is written: without that check, a PI
 * minted for one account could be replayed by anyone who learns its id to
 * credit their own account (T-07-03-02, cross-user forgery). The insert is
 * idempotent -- on conflict (stripe_payment_intent_id) do nothing, using the
 * unique constraint from 0001_stage3_accounts.sql -- so a retried verify call
 * (network hiccup, disconnect) never doubles the entitlement window.
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
  if (!accountsEnabled() || !adminConfigured()) {
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
      { error: "Bitte melden Sie sich an, um den Pass zu bestätigen." },
      { status: 401 }
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

  if (pi.metadata.feature !== "pass" || pi.metadata.user_id !== user.id) {
    // Wrong feature tag, or a PI minted for a different account: never
    // credit the caller with someone else's payment (T-07-03-02).
    return NextResponse.json(
      { error: "Ungültige Zahlungsreferenz.", reason: "wrong_feature" },
      { status: 402 }
    );
  }
  if (pi.status !== "succeeded") {
    return NextResponse.json(
      { error: "Die Zahlung ist noch nicht abgeschlossen.", reason: "not_paid" },
      { status: 402 }
    );
  }

  const expiresAt = new Date(
    Date.now() + PASS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: insertError } = await getSupabaseAdminClient()
    .from("humanizer_purchases")
    .upsert(
      {
        user_id: user.id,
        stripe_payment_intent_id: pi.id,
        kind: "pass_30d",
        amount_cents: PASS_PRICE_CENTS,
        expires_at: expiresAt,
      },
      // on conflict (stripe_payment_intent_id) do nothing: the unique
      // constraint from 0001 makes a replayed verify call a safe no-op
      // instead of a duplicate pass_30d row (T-07-03-03).
      { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }
    );

  if (insertError) {
    console.error("pass verify insert error", insertError.message);
    return NextResponse.json(
      { error: "Der Pass konnte nicht aktiviert werden. Bitte erneut versuchen." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
