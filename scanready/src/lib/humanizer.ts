/**
 * Humanizer+ / Bewerbungspaket payment gate. Stripe is the single-use token
 * store: a PaymentIntent is usable iff it succeeded, was created for the
 * relevant feature, and hasn't been marked consumed. Pure logic here
 * (testable); Stripe I/O stays in the routes.
 */

export const HUMANIZER_PRICE_CENTS = 299;

/**
 * Bewerbungspaket: one-shot €4.99 per application. Unlocks print-PDF export
 * of both documents AND includes one Humanizer+ refinement (no separate
 * €2.99 charge) - spec D3. Stateless: Stripe is the token store, same pattern
 * as the standalone Humanizer+ PI, just with two metadata flags instead of one
 * (`humanizer_used` gates the included refinement; the PDF unlock itself never
 * "consumes" - see checkPaketPi).
 */
export const PAKET_PRICE_CENTS = 499;

/**
 * Bewerbungsphase-Pass: a 30-day non-renewing entitlement (per PRD 6.2) for
 * 14,99 EUR. Unlike HUMANIZER_PRICE_CENTS / PAKET_PRICE_CENTS this is not a
 * single-use PaymentIntent token: a live Pass grants PDF export and
 * refinements for its whole window, checked against the humanizer_purchases
 * row's expires_at column (see checkPassEntitlement in account.ts), not a PI
 * status. The 14,99 EUR price and the 30-day window are the founder's
 * default per PRD section 9 and remain open founder decisions pending
 * confirmation before go-live.
 */
export const PASS_PRICE_CENTS = 1499;

/**
 * Storage cap while a Pass is live: up to 25 saved application packages
 * instead of the free tier's 1. This constant MUST match the `25` hardcoded
 * in the three-tier enforce_package_limit() trigger (migration
 * 0002_pass.sql) - it exists here only so the /konto storage meter can
 * render "N / 25" without querying the trigger definition. The cap of 25 is
 * the founder's default per PRD section 9 and remains an open founder
 * decision pending confirmation before go-live.
 */
export const PASS_STORAGE_CAP = 25;

export type PaymentIntentLike = {
  id: string;
  status: string;
  metadata: Partial<Record<string, string>>;
};

export type PiCheck =
  | { ok: true }
  | { ok: false; reason: 'not_paid' | 'consumed' | 'wrong_feature' };

export function checkHumanizerPi(pi: PaymentIntentLike): PiCheck {
  if (pi.metadata.feature !== 'humanizer') return { ok: false, reason: 'wrong_feature' };
  if (pi.status !== 'succeeded') return { ok: false, reason: 'not_paid' };
  if (pi.metadata.consumed === 'true') return { ok: false, reason: 'consumed' };
  return { ok: true };
}

/**
 * Paket PDF-export unlock check. Deliberately does NOT look at
 * `humanizer_used`: the export unlock is a standing entitlement for the whole
 * application (spec: "pro Bewerbung"), not a single-use token, so it stays
 * valid even after the included refinement has been spent.
 */
export function checkPaketPi(pi: PaymentIntentLike): PiCheck {
  if (pi.metadata.feature !== 'paket') return { ok: false, reason: 'wrong_feature' };
  if (pi.status !== 'succeeded') return { ok: false, reason: 'not_paid' };
  return { ok: true };
}

/** Which kind of PI granted a Humanizer+ refinement - the consume step marks
 * a different metadata flag depending on which one it was (see /api/humanize). */
export type EntitlementCheck =
  | { ok: true; kind: 'humanizer' }
  | { ok: true; kind: 'paket' }
  | { ok: false; reason: 'not_paid' | 'consumed' | 'wrong_feature' };

/**
 * Combined Humanizer+ entitlement check used by /api/humanize: a PI grants one
 * refinement if it is either (a) a standalone humanizer PI that hasn't been
 * consumed, or (b) a paket PI whose included refinement hasn't been used yet.
 * Note this is intentionally distinct from checkPaketPi: a paket PI with
 * humanizer_used === 'true' fails HERE (no more free refinements) but still
 * passes checkPaketPi (the PDF export stays unlocked regardless).
 */
export function checkHumanizerEntitlement(pi: PaymentIntentLike): EntitlementCheck {
  if (pi.metadata.feature === 'humanizer') {
    const check = checkHumanizerPi(pi);
    return check.ok ? { ok: true, kind: 'humanizer' } : check;
  }
  if (pi.metadata.feature === 'paket') {
    if (pi.status !== 'succeeded') return { ok: false, reason: 'not_paid' };
    if (pi.metadata.humanizer_used === 'true') return { ok: false, reason: 'consumed' };
    return { ok: true, kind: 'paket' };
  }
  return { ok: false, reason: 'wrong_feature' };
}
