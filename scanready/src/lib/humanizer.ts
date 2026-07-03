/**
 * Humanizer+ payment gate. Stripe is the single-use token store: a PaymentIntent
 * is usable iff it succeeded, was created for this feature, and hasn't been
 * marked consumed. Pure logic here (testable); Stripe I/O stays in the routes.
 */

export const HUMANIZER_PRICE_CENTS = 299;

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
