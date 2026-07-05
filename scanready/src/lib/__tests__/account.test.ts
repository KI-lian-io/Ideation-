/**
 * Behavior test for the pure Postgres-error -> typed-result mapper used by
 * saveApplicationPackage. The Supabase calls themselves are not unit-tested
 * (per the Stage 3 accounts build brief); this is the one non-trivial pure
 * mapper in src/lib/account.ts.
 * Run: node --experimental-strip-types --test src/lib/__tests__/account.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapSaveError } from '../account.ts'

test('mapSaveError: package_limit trigger message -> reason "limit"', () => {
  const result = mapSaveError({ message: 'package_limit' })
  assert.deepEqual(result, { ok: false, reason: 'limit' })
})

test('mapSaveError: package_limit message with extra Postgres context -> still "limit"', () => {
  // Real Postgres errors often wrap the RAISE EXCEPTION text with extra
  // context (e.g. "ERROR:  package_limit\nCONTEXT: ..."); substring match
  // must still catch it.
  const result = mapSaveError({ message: 'ERROR:  package_limit\nCONTEXT: PL/pgSQL function...' })
  assert.deepEqual(result, { ok: false, reason: 'limit' })
})

test('mapSaveError: unrelated Postgres error -> reason "error" with message preserved', () => {
  const result = mapSaveError({ message: 'duplicate key value violates unique constraint' })
  assert.deepEqual(result, {
    ok: false,
    reason: 'error',
    message: 'duplicate key value violates unique constraint',
  })
})

test('mapSaveError: null error -> reason "error" with unknown_error fallback', () => {
  const result = mapSaveError(null)
  assert.deepEqual(result, { ok: false, reason: 'error', message: 'unknown_error' })
})

test('mapSaveError: undefined error -> reason "error" with unknown_error fallback', () => {
  const result = mapSaveError(undefined)
  assert.deepEqual(result, { ok: false, reason: 'error', message: 'unknown_error' })
})

test('mapSaveError: error object with no message -> reason "error" with unknown_error fallback', () => {
  const result = mapSaveError({ message: null })
  assert.deepEqual(result, { ok: false, reason: 'error', message: 'unknown_error' })
})
