/**
 * Behavior tests for checkHumanizerPi: pure PaymentIntent gate logic.
 * Run: node --experimental-strip-types --test src/lib/__tests__/humanizer.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { checkHumanizerPi, type PaymentIntentLike } from '../humanizer.ts'

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
