/**
 * Behavior tests for lebenslauf-utils.ts
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 * Run: node --experimental-strip-types src/lib/__tests__/lebenslauf-utils.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { isLebenslaufBasicallyEmpty, softFormatDate, toPlainText } from '../lebenslauf-utils.ts'

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

// ---------------------------------------------------------------------------
// softFormatDate (D-11) — Behavior Tests
// ---------------------------------------------------------------------------

// Test 1: ISO YYYY-MM-DD → DD.MM.YYYY
test('softFormatDate: converts ISO date to DIN format', () => {
  assert.strictEqual(softFormatDate('2020-09-15'), '15.09.2020')
})

// Test 2: US slash M/D/YYYY → zero-padded DD.MM.YYYY
test('softFormatDate: converts US slash date to DIN format with zero-padding', () => {
  assert.strictEqual(softFormatDate('9/15/2020'), '15.09.2020')
})

// Test 3: Already DD.MM.YYYY → unchanged
test('softFormatDate: leaves already-DIN date unchanged', () => {
  assert.strictEqual(softFormatDate('15.09.2020'), '15.09.2020')
})

// Test 4a: Natural partial date passes through unchanged
test('softFormatDate: passes through natural partial date like "September 2020"', () => {
  assert.strictEqual(softFormatDate('September 2020'), 'September 2020')
})

// Test 4b: Year-only passes through unchanged
test('softFormatDate: passes through year-only partial date like "2020"', () => {
  assert.strictEqual(softFormatDate('2020'), '2020')
})

// ---------------------------------------------------------------------------
// toPlainText (D-04) — Behavior Tests
// ---------------------------------------------------------------------------

// Test 5: toPlainText includes the full name and an experience entry's role + company,
//         sections emitted in the given sectionOrder (personal before experience)
test('toPlainText: includes full name and experience role and company in sectionOrder', () => {
  const l = {
    personal: {
      fullName: 'Max Mustermann',
      address: null,
      phone: null,
      email: null,
      nationality: null,
      dateOfBirth: null,
    },
    experience: [
      {
        role: 'Software Engineer',
        company: 'Tech GmbH',
        location: null,
        start: null,
        end: null,
        bullets: [],
      },
    ],
    education: [],
    skills: [],
    languages: [],
    normGapNotes: [],
    photoAdvice: '',
  }
  const sectionOrder = ['personal', 'experience', 'education', 'skills', 'languages']
  const text = toPlainText(l, sectionOrder)
  assert.ok(text.includes('Max Mustermann'), 'should include full name')
  assert.ok(text.includes('Software Engineer'), 'should include experience role')
  assert.ok(text.includes('Tech GmbH'), 'should include experience company')
  // personal section should appear before experience section in output
  assert.ok(text.indexOf('Max Mustermann') < text.indexOf('Software Engineer'), 'personal before experience')
})
