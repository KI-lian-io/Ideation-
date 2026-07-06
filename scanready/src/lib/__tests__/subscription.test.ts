/**
 * Behavior tests for the pure subscription helpers: mapStripeSubscription
 * (both Stripe API generations for current_period_end) and isActiveStatus.
 * Run: node --experimental-strip-types --test src/lib/__tests__/subscription.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  isActiveStatus,
  mapStripeSubscription,
  type StripeSubscriptionLike,
} from '../subscription.ts'

function sub(overrides: Partial<StripeSubscriptionLike> = {}): StripeSubscriptionLike {
  return {
    id: 'sub_test',
    status: 'active',
    customer: 'cus_test',
    metadata: { supabase_user_id: 'user-uuid' },
    ...overrides,
  }
}

test('active and trialing count as paying; everything else does not', () => {
  assert.equal(isActiveStatus('active'), true)
  assert.equal(isActiveStatus('trialing'), true)
  assert.equal(isActiveStatus('canceled'), false)
  assert.equal(isActiveStatus('past_due'), false)
  assert.equal(isActiveStatus('incomplete'), false)
  assert.equal(isActiveStatus(''), false)
})

test('maps pre-Basil shape (current_period_end on the subscription)', () => {
  const row = mapStripeSubscription(sub({ current_period_end: 1751500800 }))
  assert.equal(row.stripe_subscription_id, 'sub_test')
  assert.equal(row.status, 'active')
  assert.equal(row.current_period_end, new Date(1751500800 * 1000).toISOString())
  assert.equal(row.user_id, 'user-uuid')
  assert.equal(row.customer_id, 'cus_test')
})

test('maps post-Basil shape (current_period_end on the subscription item)', () => {
  const row = mapStripeSubscription(
    sub({ items: { data: [{ current_period_end: 1751500800 }] } })
  )
  assert.equal(row.current_period_end, new Date(1751500800 * 1000).toISOString())
})

test('subscription-level period end wins when both shapes are present', () => {
  const row = mapStripeSubscription(
    sub({ current_period_end: 1751500800, items: { data: [{ current_period_end: 1 }] } })
  )
  assert.equal(row.current_period_end, new Date(1751500800 * 1000).toISOString())
})

test('no period end anywhere -> null, never a bogus date', () => {
  assert.equal(mapStripeSubscription(sub()).current_period_end, null)
  assert.equal(
    mapStripeSubscription(sub({ items: { data: [] } })).current_period_end,
    null
  )
})

test('expanded customer object -> its id; missing metadata -> null user_id', () => {
  const row = mapStripeSubscription(
    sub({ customer: { id: 'cus_expanded' }, metadata: {} })
  )
  assert.equal(row.customer_id, 'cus_expanded')
  assert.equal(row.user_id, null)
})
