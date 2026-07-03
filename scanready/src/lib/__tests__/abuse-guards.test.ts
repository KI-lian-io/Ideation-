/**
 * Behavior tests for abuse-guards: hashed client id + sentinel-verdict streaming gate.
 * Run: node --experimental-strip-types --test src/lib/__tests__/abuse-guards.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clientIdFrom, sentinelVerdict, INVALID_INPUT_SENTINEL } from '../abuse-guards.ts'

test('clientIdFrom hashes first forwarded hop, no raw IP in output', () => {
  const h = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })
  const id = clientIdFrom(h)
  assert.equal(id.length, 16)
  assert.ok(!id.includes('203'))
  // same input → same id; different ip → different id
  assert.equal(clientIdFrom(h), id)
  assert.notEqual(clientIdFrom(new Headers({ 'x-forwarded-for': '203.0.113.8' })), id)
})

test('clientIdFrom falls back to x-real-ip then "unknown"', () => {
  assert.equal(clientIdFrom(new Headers({ 'x-real-ip': '198.51.100.2' })).length, 16)
  assert.equal(clientIdFrom(new Headers()), clientIdFrom(new Headers()))
})

test('sentinelVerdict: exact sentinel → sentinel', () => {
  assert.equal(sentinelVerdict(INVALID_INPUT_SENTINEL, false), 'sentinel')
})

test('sentinelVerdict: sentinel with leading whitespace and trailing text → sentinel', () => {
  assert.equal(sentinelVerdict('\n ' + INVALID_INPUT_SENTINEL + ' — details', true), 'sentinel')
})

test('sentinelVerdict: partial prefix while streaming → pending', () => {
  assert.equal(sentinelVerdict('UNGÜLT', false), 'pending')
  assert.equal(sentinelVerdict('', false), 'pending')
})

test('sentinelVerdict: partial prefix at stream end → clean (never emitted full sentinel)', () => {
  assert.equal(sentinelVerdict('UNGÜLT', true), 'clean')
})

test('sentinelVerdict: normal letter opening → clean immediately', () => {
  assert.equal(sentinelVerdict('Sehr geehrte Damen und Herren,', false), 'clean')
})
