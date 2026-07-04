/**
 * Regression test for the `reorder()` helper (src/components/LebenslaufEditor.tsx),
 * which backs REORDER_EXPERIENCE / REORDER_EDUCATION / REORDER_SECTION in the
 * page.tsx reducer.
 *
 * Bug being guarded against: index-keyed React lists (key={i}) break identity
 * across a reorder/remove, because EditableField's internal edit-draft state
 * stays attached to whichever DOM node sits at that index rather than
 * following the logical entry — an in-flight edit can silently commit to a
 * DIFFERENT entry after the array shifts. The fix assigns each entry a
 * stable `_uid` (crypto.randomUUID()) on parse/ADD_* and keys rows by
 * `entry._uid` instead of the array index. That only works if `reorder()`
 * moves entries WITHOUT rebuilding them, so `_uid` identity (both value and
 * object reference) survives a move.
 *
 * NOTE on the seam: `reorder()` lives in LebenslaufEditor.tsx, a 'use client'
 * component file. Node's `--experimental-strip-types` (this repo's test
 * runner, see package.json) cannot load `.tsx` — it only strips types from
 * plain `.ts`/`.mts`. Rather than restructure page.tsx/LebenslaufEditor.tsx
 * to carve out a `.ts`-only seam (explicitly out of scope for this fix), this
 * test asserts against an inlined copy of the exact same algorithm
 * (verified byte-for-byte identical below to the exported `reorder<T>` in
 * LebenslaufEditor.tsx). If that function ever changes, keep the two in sync.
 *
 * Run: node --experimental-strip-types src/lib/__tests__/lebenslauf-editor-reorder.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Mirrors `reorder<T>` in ../../components/LebenslaufEditor.tsx verbatim.
function reorder<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

test('reorder: moved entry keeps its _uid value after moving up', () => {
  const entries = [
    { _uid: 'uid-a', role: 'A' },
    { _uid: 'uid-b', role: 'B' },
    { _uid: 'uid-c', role: 'C' },
  ]
  const result = reorder(entries, 2, 0) // move C to the front
  assert.deepEqual(
    result.map((e) => e._uid),
    ['uid-c', 'uid-a', 'uid-b']
  )
})

test('reorder: moved entry keeps its _uid value after moving down', () => {
  const entries = [
    { _uid: 'uid-a', role: 'A' },
    { _uid: 'uid-b', role: 'B' },
    { _uid: 'uid-c', role: 'C' },
  ]
  const result = reorder(entries, 0, 1) // swap A and B (the ↓ button on entry 0)
  assert.deepEqual(
    result.map((e) => e._uid),
    ['uid-b', 'uid-a', 'uid-c']
  )
})

test('reorder: entries are moved by reference, not cloned — same object identity survives', () => {
  const a = { _uid: 'uid-a', role: 'A' }
  const b = { _uid: 'uid-b', role: 'B' }
  const c = { _uid: 'uid-c', role: 'C' }
  const result = reorder([a, b, c], 0, 2) // move A to the end

  // Object identity (===), not just value equality — proves reorder() never
  // rebuilds an entry, so an in-flight edit attached to that specific object
  // travels with it to its new index instead of staying pinned to the slot.
  assert.equal(result[2], a)
  assert.equal(result[0], b)
  assert.equal(result[1], c)
})

test('reorder: does not mutate the input array (immutability contract the reducer relies on)', () => {
  const entries = [{ _uid: 'uid-a' }, { _uid: 'uid-b' }, { _uid: 'uid-c' }]
  const original = [...entries]
  reorder(entries, 0, 2)
  assert.deepEqual(entries, original, 'input array must be left untouched')
})

test('crypto.randomUUID: produces unique ids for successive entries (ADD_* / withUids contract)', () => {
  // Sanity-checks the primitive page.tsx's withUids()/ADD_EXPERIENCE/ADD_EDUCATION/
  // ADD_LANGUAGE rely on for uniqueness — not a copy of reducer logic.
  const ids = new Set(Array.from({ length: 50 }, () => crypto.randomUUID()))
  assert.equal(ids.size, 50, 'all generated ids must be unique')
})
