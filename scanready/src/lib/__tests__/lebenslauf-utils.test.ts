/**
 * Behavior tests for isLebenslaufBasicallyEmpty (TDD RED phase)
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 * Run: node --experimental-strip-types --experimental-vm-modules src/lib/__tests__/lebenslauf-utils.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// We import using relative path to avoid needing path alias resolution
// The function under test is imported after it exists
import { isLebenslaufBasicallyEmpty } from '../lebenslauf-utils.ts'

// Minimal shape matching the Lebenslauf type for testing purposes
function makeLebenslauf(overrides: {
  fullName?: string
  experience?: { role: string; company: string; location: null; start: null; end: null; bullets: string[] }[]
  education?: { qualification: string; institution: string; location: null; start: null; end: null }[]
}) {
  return {
    personal: {
      fullName: overrides.fullName ?? '',
      address: null,
      phone: null,
      email: null,
      nationality: null,
      dateOfBirth: null,
    },
    experience: overrides.experience ?? [],
    education: overrides.education ?? [],
    skills: [],
    languages: [],
    normGapNotes: [],
    photoAdvice: '',
  }
}

// Test 1: empty name → true (regardless of experience/education)
test('returns true when fullName is empty', () => {
  const l = makeLebenslauf({
    fullName: '',
    experience: [{ role: 'Engineer', company: 'Acme', location: null, start: null, end: null, bullets: [] }],
  })
  assert.strictEqual(isLebenslaufBasicallyEmpty(l), true)
})

// Test 2: name present but no experience and no education → true
test('returns true when name present but no experience and no education', () => {
  const l = makeLebenslauf({ fullName: 'Jane Doe', experience: [], education: [] })
  assert.strictEqual(isLebenslaufBasicallyEmpty(l), true)
})

// Test 3: name + at least one experience → false
test('returns false when name and at least one experience entry', () => {
  const l = makeLebenslauf({
    fullName: 'Jane Doe',
    experience: [{ role: 'Engineer', company: 'Acme', location: null, start: null, end: null, bullets: [] }],
  })
  assert.strictEqual(isLebenslaufBasicallyEmpty(l), false)
})

// Test 4: name + at least one education → false
test('returns false when name and at least one education entry', () => {
  const l = makeLebenslauf({
    fullName: 'Jane Doe',
    education: [{ qualification: 'B.Sc.', institution: 'TU Berlin', location: null, start: null, end: null }],
  })
  assert.strictEqual(isLebenslaufBasicallyEmpty(l), false)
})
