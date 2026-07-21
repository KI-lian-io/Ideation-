/**
 * Behavior tests for the print/PDF export helper defaultOrtDatum (lebenslauf-utils.ts).
 * Uses Node.js built-in test runner (node:test), no extra dependencies.
 * Run: node --experimental-strip-types src/lib/__tests__/print-sheet.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { defaultOrtDatum } from '../lebenslauf-utils.ts'

// A fixed reference date so assertions never depend on "today".
const FIXED_DATE = new Date(2026, 6, 5) // 05.07.2026 (month is 0-indexed)

test('defaultOrtDatum: derives city from text after the last comma in the address', () => {
  assert.strictEqual(
    defaultOrtDatum('Musterstraße 1, 20095 Hamburg', FIXED_DATE),
    '20095 Hamburg, 05.07.2026'
  )
})

test('defaultOrtDatum: uses only the text after the LAST comma (multi-comma address)', () => {
  assert.strictEqual(
    defaultOrtDatum('Musterstraße 1, 20095, Hamburg', FIXED_DATE),
    'Hamburg, 05.07.2026'
  )
})

test('defaultOrtDatum: trims whitespace around the city segment', () => {
  assert.strictEqual(defaultOrtDatum('Musterstraße 1,   Berlin  ', FIXED_DATE), 'Berlin, 05.07.2026')
})

test('defaultOrtDatum: falls back to date-only when address has no comma', () => {
  assert.strictEqual(defaultOrtDatum('Hamburg', FIXED_DATE), '05.07.2026')
})

test('defaultOrtDatum: falls back to date-only when address is empty string', () => {
  assert.strictEqual(defaultOrtDatum('', FIXED_DATE), '05.07.2026')
})

test('defaultOrtDatum: falls back to date-only when address is null', () => {
  assert.strictEqual(defaultOrtDatum(null, FIXED_DATE), '05.07.2026')
})

test('defaultOrtDatum: falls back to date-only when address is undefined', () => {
  assert.strictEqual(defaultOrtDatum(undefined, FIXED_DATE), '05.07.2026')
})

test('defaultOrtDatum: falls back to date-only when the segment after the last comma is blank', () => {
  assert.strictEqual(defaultOrtDatum('Musterstraße 1,   ', FIXED_DATE), '05.07.2026')
})

test('defaultOrtDatum: zero-pads single-digit day and month', () => {
  const early = new Date(2026, 0, 3) // 03.01.2026
  assert.strictEqual(defaultOrtDatum('Musterstraße 1, München', early), 'München, 03.01.2026')
})

test('defaultOrtDatum: is a pure function of its inputs (injected Date, no side effects)', () => {
  const a = defaultOrtDatum('Musterstraße 1, Köln', FIXED_DATE)
  const b = defaultOrtDatum('Musterstraße 1, Köln', FIXED_DATE)
  assert.strictEqual(a, b)
})
