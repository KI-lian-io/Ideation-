/**
 * Behavior test for the pure Postgres-error -> typed-result mapper used by
 * saveApplicationPackage, plus a regression test for the orphaned-cvs-row
 * cleanup in its pkgError branch (a blocked/limit save must not leak the
 * already-inserted cvs row).
 * Run: node --experimental-strip-types --test src/lib/__tests__/account.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  mapSaveError,
  saveApplicationPackage,
  checkPassEntitlement,
  updatePackageTitle,
  listCvs,
  updateCvTitle,
  setPackageStatus,
} from '../account.ts'

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

test('saveApplicationPackage: blocked (limit) save cleans up the orphaned cvs row', async () => {
  // accountsEnabled() reads these two env vars on every call (no module-level
  // caching), so setting them right before the call is enough -- no import
  // order or stale-cache concern.
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  const deleteCalls: Array<{ column: string; value: unknown }> = []

  const fakeClient = {
    from(table: string) {
      if (table === 'cvs') {
        return {
          insert() {
            return this
          },
          select() {
            return this
          },
          single() {
            return Promise.resolve({ data: { id: 'cv-123' }, error: null })
          },
          delete() {
            return this
          },
          eq(column: string, value: unknown) {
            deleteCalls.push({ column, value })
            return Promise.resolve({ data: null, error: null })
          },
        }
      }
      if (table === 'application_packages') {
        return {
          insert() {
            return this
          },
          select() {
            return this
          },
          single() {
            return Promise.resolve({ data: null, error: { message: 'package_limit' } })
          },
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  } as unknown as SupabaseClient

  try {
    const result = await saveApplicationPackage(fakeClient, 'user-1', {
      cvText: 'some cv text',
      jobPosting: null,
      answers: [],
      lebenslauf: {} as never,
      anschreiben: null,
    })

    assert.deepEqual(result, { ok: false, reason: 'limit' })
    assert.equal(deleteCalls.length, 1)
    assert.deepEqual(deleteCalls[0], { column: 'id', value: 'cv-123' })
  } finally {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
})

// ---------------------------------------------------------------------------
// saveApplicationPackage: attach path (existingCvId set)
// ---------------------------------------------------------------------------

test('saveApplicationPackage: existingCvId set -> never calls cvs.insert, uses it as cv_id', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  let cvsInsertCalled = false
  let insertedPackage: Record<string, unknown> | null = null

  const fakeClient = {
    from(table: string) {
      if (table === 'cvs') {
        return {
          insert() {
            cvsInsertCalled = true
            return this
          },
          delete() {
            return this
          },
          eq() {
            return Promise.resolve({ data: null, error: null })
          },
        }
      }
      if (table === 'application_packages') {
        return {
          insert(payload: Record<string, unknown>) {
            insertedPackage = payload
            return this
          },
          select() {
            return this
          },
          single() {
            return Promise.resolve({ data: { id: 'pkg-attach-1' }, error: null })
          },
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  } as unknown as SupabaseClient

  try {
    const result = await saveApplicationPackage(fakeClient, 'user-1', {
      cvText: 'ignored on the attach path',
      existingCvId: 'cv-existing-1',
      jobPosting: null,
      answers: [],
      lebenslauf: {} as never,
      anschreiben: null,
    })

    assert.deepEqual(result, { ok: true, packageId: 'pkg-attach-1' })
    assert.equal(cvsInsertCalled, false)
    assert.equal((insertedPackage as { cv_id?: string } | null)?.cv_id, 'cv-existing-1')
  } finally {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
})

test('saveApplicationPackage: attach path limit error does NOT delete the existing cvs row', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  let cvsDeleteCalled = false

  const fakeClient = {
    from(table: string) {
      if (table === 'cvs') {
        return {
          delete() {
            cvsDeleteCalled = true
            return this
          },
          eq() {
            return Promise.resolve({ data: null, error: null })
          },
        }
      }
      if (table === 'application_packages') {
        return {
          insert() {
            return this
          },
          select() {
            return this
          },
          single() {
            return Promise.resolve({ data: null, error: { message: 'package_limit' } })
          },
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  } as unknown as SupabaseClient

  try {
    const result = await saveApplicationPackage(fakeClient, 'user-1', {
      cvText: 'ignored on the attach path',
      existingCvId: 'cv-existing-1',
      jobPosting: null,
      answers: [],
      lebenslauf: {} as never,
      anschreiben: null,
    })

    assert.deepEqual(result, { ok: false, reason: 'limit' })
    assert.equal(cvsDeleteCalled, false)
  } finally {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
})

// ---------------------------------------------------------------------------
// listCvs / updateCvTitle: accountsEnabled()-gated no-ops
// ---------------------------------------------------------------------------

test('listCvs: accounts disabled -> [], never calls Supabase', async () => {
  let called = false
  const fakeClient = {
    from() {
      called = true
      throw new Error('should not be called when accounts are disabled')
    },
  } as unknown as SupabaseClient

  const result = await listCvs(fakeClient, 'user-1')

  assert.deepEqual(result, [])
  assert.equal(called, false)
})

test('updateCvTitle: accounts disabled -> safe no-op, never calls Supabase', async () => {
  let called = false
  const fakeClient = {
    from() {
      called = true
      throw new Error('should not be called when accounts are disabled')
    },
  } as unknown as SupabaseClient

  const result = await updateCvTitle(fakeClient, 'cv-1', 'New Title')

  assert.deepEqual(result, { ok: false, message: 'accounts_disabled' })
  assert.equal(called, false)
})

// ---------------------------------------------------------------------------
// setPackageStatus: accountsEnabled()-gated RPC caller
// ---------------------------------------------------------------------------

test('setPackageStatus: accounts disabled -> safe no-op, never calls Supabase', async () => {
  let called = false
  const fakeClient = {
    rpc() {
      called = true
      throw new Error('should not be called when accounts are disabled')
    },
  } as unknown as SupabaseClient

  const result = await setPackageStatus(fakeClient, 'pkg-1', 'beworben')

  assert.deepEqual(result, { ok: false, message: 'accounts_disabled' })
  assert.equal(called, false)
})

test('setPackageStatus: accounts enabled -> calls rpc("set_package_status", ...) with the right shape', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  const rpcCalls: Array<{ fn: string; args: unknown }> = []
  const fakeClient = {
    rpc(fn: string, args: unknown) {
      rpcCalls.push({ fn, args })
      return Promise.resolve({ data: null, error: null })
    },
  } as unknown as SupabaseClient

  try {
    const result = await setPackageStatus(fakeClient, 'pkg-1', 'beworben')

    assert.deepEqual(result, { ok: true })
    assert.equal(rpcCalls.length, 1)
    assert.deepEqual(rpcCalls[0], {
      fn: 'set_package_status',
      args: { package_id: 'pkg-1', new_status: 'beworben' },
    })
  } finally {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
})

test('setPackageStatus: rpc error -> { ok: false, message }', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  const fakeClient = {
    rpc() {
      return Promise.resolve({ data: null, error: { message: 'invalid_status' } })
    },
  } as unknown as SupabaseClient

  try {
    const result = await setPackageStatus(fakeClient, 'pkg-1', 'not-a-real-status')
    assert.deepEqual(result, { ok: false, message: 'invalid_status' })
  } finally {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
})

// ---------------------------------------------------------------------------
// checkPassEntitlement: pure live-pass window check
// ---------------------------------------------------------------------------

test('checkPassEntitlement: null row -> false', () => {
  assert.equal(checkPassEntitlement(null), false)
})

test('checkPassEntitlement: null expires_at -> false', () => {
  assert.equal(checkPassEntitlement({ expires_at: null }), false)
})

test('checkPassEntitlement: past expires_at -> false', () => {
  const past = new Date(Date.now() - 60_000).toISOString()
  assert.equal(checkPassEntitlement({ expires_at: past }), false)
})

test('checkPassEntitlement: future expires_at -> true', () => {
  const future = new Date(Date.now() + 60_000).toISOString()
  assert.equal(checkPassEntitlement({ expires_at: future }), true)
})

// ---------------------------------------------------------------------------
// updatePackageTitle: accountsEnabled()-gated no-op
// ---------------------------------------------------------------------------

test('updatePackageTitle: accounts disabled -> safe no-op, never calls Supabase', async () => {
  // No NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY set here, so
  // accountsEnabled() is false.
  let called = false
  const fakeClient = {
    from() {
      called = true
      throw new Error('should not be called when accounts are disabled')
    },
  } as unknown as SupabaseClient

  const result = await updatePackageTitle(fakeClient, 'pkg-1', 'New Title')

  assert.deepEqual(result, { ok: false, message: 'accounts_disabled' })
  assert.equal(called, false)
})
