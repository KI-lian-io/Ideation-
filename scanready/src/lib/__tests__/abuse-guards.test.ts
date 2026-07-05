/**
 * Behavior tests for abuse-guards: hashed client id + sentinel-verdict streaming gate.
 * Run: node --experimental-strip-types --test src/lib/__tests__/abuse-guards.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import { clientIdFrom, readJsonObject, isValidAnswers } from '../abuse-guards.ts'
import { sentinelVerdict, INVALID_INPUT_SENTINEL } from '../sentinel.ts'

function postRequest(body: string): NextRequest {
  return new NextRequest('http://localhost/api/x', { method: 'POST', body })
}

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
  assert.equal(sentinelVerdict('\n ' + INVALID_INPUT_SENTINEL + ' - details', true), 'sentinel')
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

test('readJsonObject: malformed JSON body → null (not a throw)', async () => {
  assert.equal(await readJsonObject(postRequest('{')), null)
})

test('readJsonObject: valid JSON `null` body → null', async () => {
  assert.equal(await readJsonObject(postRequest('null')), null)
})

test('readJsonObject: JSON array body → null (not a plain object)', async () => {
  assert.equal(await readJsonObject(postRequest('[1,2,3]')), null)
})

test('readJsonObject: JSON primitive body (string/number) → null', async () => {
  assert.equal(await readJsonObject(postRequest('"hello"')), null)
  assert.equal(await readJsonObject(postRequest('42')), null)
})

test('readJsonObject: empty body → null', async () => {
  assert.equal(await readJsonObject(postRequest('')), null)
})

test('readJsonObject: valid plain object → the parsed object', async () => {
  const body = JSON.stringify({ resumeText: 'hello', n: 1 })
  assert.deepEqual(await readJsonObject(postRequest(body)), { resumeText: 'hello', n: 1 })
})

test('isValidAnswers: valid array of {question, answer} pairs → true', () => {
  assert.equal(
    isValidAnswers([{ question: 'Q1', answer: 'A1' }, { question: 'Q2', answer: 'A2' }]),
    true
  )
})

test('isValidAnswers: empty array → true (no answers is valid)', () => {
  assert.equal(isValidAnswers([]), true)
})

test('isValidAnswers: not an array → false', () => {
  assert.equal(isValidAnswers(null), false)
  assert.equal(isValidAnswers(undefined), false)
  assert.equal(isValidAnswers('answers'), false)
  assert.equal(isValidAnswers({ question: 'Q', answer: 'A' }), false)
})

test('isValidAnswers: non-object element (e.g. null) → false, does not throw', () => {
  assert.equal(isValidAnswers([null]), false)
  assert.equal(isValidAnswers([{ question: 'Q', answer: 'A' }, null]), false)
  assert.equal(isValidAnswers(['just a string']), false)
})

test('isValidAnswers: element missing question or answer field → false', () => {
  assert.equal(isValidAnswers([{ answer: 'A' }]), false)
  assert.equal(isValidAnswers([{ question: 'Q' }]), false)
  assert.equal(isValidAnswers([{ question: 'Q', answer: 42 }]), false)
})

test('isValidAnswers: over the max count → false (aggregate-size bypass)', () => {
  const many = Array.from({ length: 11 }, (_, i) => ({ question: `Q${i}`, answer: `A${i}` }))
  assert.equal(isValidAnswers(many), false)
  assert.equal(isValidAnswers(many.slice(0, 10)), true)
})

test('isValidAnswers: custom maxCount is respected', () => {
  const three = [{ question: 'Q', answer: 'A' }, { question: 'Q', answer: 'A' }, { question: 'Q', answer: 'A' }]
  assert.equal(isValidAnswers(three, 2), false)
  assert.equal(isValidAnswers(three, 3), true)
})
