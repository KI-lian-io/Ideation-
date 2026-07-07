/**
 * Behavior tests for the pure PaymentIntent gate logic: checkHumanizerPi
 * (standalone Humanizer+), checkPaketPi (Bewerbungspaket PDF unlock) and
 * checkHumanizerEntitlement (either kind granting one refinement).
 * Run: node --experimental-strip-types --test src/lib/__tests__/humanizer.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  checkHumanizerPi,
  checkPaketPi,
  checkHumanizerEntitlement,
  PASS_PRICE_CENTS,
  type PaymentIntentLike,
} from '../humanizer.ts'

function pi(overrides: Partial<PaymentIntentLike> = {}): PaymentIntentLike {
  return {
    id: 'pi_test',
    status: 'succeeded',
    metadata: { feature: 'humanizer' },
    ...overrides,
  }
}

test('succeeded + humanizer + unconsumed → ok', () => {
  assert.deepEqual(checkHumanizerPi(pi()), { ok: true })
})

test('unpaid PI → not_paid', () => {
  assert.deepEqual(checkHumanizerPi(pi({ status: 'requires_payment_method' })), {
    ok: false,
    reason: 'not_paid',
  })
})

test('already consumed → consumed', () => {
  assert.deepEqual(
    checkHumanizerPi(pi({ metadata: { feature: 'humanizer', consumed: 'true' } })),
    { ok: false, reason: 'consumed' }
  )
})

test('PI for a different feature → wrong_feature', () => {
  assert.deepEqual(checkHumanizerPi(pi({ metadata: { feature: 'other' } })), {
    ok: false,
    reason: 'wrong_feature',
  })
})

test('missing feature metadata → wrong_feature', () => {
  assert.deepEqual(checkHumanizerPi(pi({ metadata: {} })), {
    ok: false,
    reason: 'wrong_feature',
  })
})

// ---------------------------------------------------------------------------
// checkPaketPi: the PDF-export unlock is a standing per-application entitlement
// ---------------------------------------------------------------------------

function paketPi(overrides: Partial<PaymentIntentLike> = {}): PaymentIntentLike {
  return {
    id: 'pi_paket',
    status: 'succeeded',
    metadata: { feature: 'paket' },
    ...overrides,
  }
}

test('paket: succeeded → ok', () => {
  assert.deepEqual(checkPaketPi(paketPi()), { ok: true })
})

test('paket: unpaid → not_paid', () => {
  assert.deepEqual(checkPaketPi(paketPi({ status: 'requires_payment_method' })), {
    ok: false,
    reason: 'not_paid',
  })
})

test('paket: humanizer PI → wrong_feature', () => {
  assert.deepEqual(checkPaketPi(pi()), { ok: false, reason: 'wrong_feature' })
})

test('paket: PDF unlock survives a spent included refinement', () => {
  // The whole point of the split: humanizer_used consumes the refinement,
  // never the export unlock.
  assert.deepEqual(
    checkPaketPi(paketPi({ metadata: { feature: 'paket', humanizer_used: 'true' } })),
    { ok: true }
  )
})

// ---------------------------------------------------------------------------
// checkHumanizerEntitlement: one refinement from either PI kind
// ---------------------------------------------------------------------------

test('entitlement: unconsumed humanizer PI → ok, kind humanizer', () => {
  assert.deepEqual(checkHumanizerEntitlement(pi()), { ok: true, kind: 'humanizer' })
})

test('entitlement: consumed humanizer PI → consumed', () => {
  assert.deepEqual(
    checkHumanizerEntitlement(pi({ metadata: { feature: 'humanizer', consumed: 'true' } })),
    { ok: false, reason: 'consumed' }
  )
})

test('entitlement: fresh paket PI → ok, kind paket', () => {
  assert.deepEqual(checkHumanizerEntitlement(paketPi()), { ok: true, kind: 'paket' })
})

test('entitlement: paket with humanizer_used → consumed (refinement spent)', () => {
  assert.deepEqual(
    checkHumanizerEntitlement(paketPi({ metadata: { feature: 'paket', humanizer_used: 'true' } })),
    { ok: false, reason: 'consumed' }
  )
})

test('entitlement: unpaid paket PI → not_paid', () => {
  assert.deepEqual(
    checkHumanizerEntitlement(paketPi({ status: 'processing' })),
    { ok: false, reason: 'not_paid' }
  )
})

test('entitlement: unknown feature → wrong_feature', () => {
  assert.deepEqual(checkHumanizerEntitlement(pi({ metadata: { feature: 'other' } })), {
    ok: false,
    reason: 'wrong_feature',
  })
})

// ---------------------------------------------------------------------------
// PASS_PRICE_CENTS: the Bewerbungsphase-Pass price constant
// ---------------------------------------------------------------------------

test('PASS_PRICE_CENTS is 14,99 EUR in cents', () => {
  assert.equal(PASS_PRICE_CENTS, 1499)
})
