/**
 * Behavior tests for the pure CV-overlap heuristic used to preselect the
 * attach-or-new radio in the save flow (see 08-02-PLAN.md Task 1).
 * Run: node --experimental-strip-types --test src/lib/__tests__/cv-overlap.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvOverlapRatio, bestCvMatch, CV_ATTACH_THRESHOLD } from '../cv-overlap.ts'

test('cvOverlapRatio: identical non-empty text -> 1', () => {
  const text = 'Berufserfahrung Produktmanagerin Logistik seit 2020'
  assert.equal(cvOverlapRatio(text, text), 1)
})

test('cvOverlapRatio: fully disjoint token sets -> 0', () => {
  const a = 'apfel birne kirsche'
  const b = 'auto zug fahrrad'
  assert.equal(cvOverlapRatio(a, b), 0)
})

test('cvOverlapRatio: subset of tokens scores high (intersection over smaller set)', () => {
  const full = 'Berufserfahrung Produktmanagerin Logistik seit 2020 Muenchen'
  const shorterEdit = 'Berufserfahrung Produktmanagerin Logistik seit 2020'
  const ratio = cvOverlapRatio(full, shorterEdit)
  assert.ok(ratio >= CV_ATTACH_THRESHOLD, `expected ratio >= ${CV_ATTACH_THRESHOLD}, got ${ratio}`)
})

test('cvOverlapRatio: empty first argument -> 0', () => {
  assert.equal(cvOverlapRatio('', 'some cv text here'), 0)
})

test('cvOverlapRatio: empty second argument -> 0', () => {
  assert.equal(cvOverlapRatio('some cv text here', ''), 0)
})

test('cvOverlapRatio: both empty -> 0', () => {
  assert.equal(cvOverlapRatio('', ''), 0)
})

test('CV_ATTACH_THRESHOLD equals 0.8', () => {
  assert.equal(CV_ATTACH_THRESHOLD, 0.8)
})

test('bestCvMatch: returns the highest-ratio entry when it meets the threshold', () => {
  const currentText = 'Berufserfahrung Produktmanagerin Logistik seit 2020 Muenchen'
  const cvs = [
    { id: 'cv-low', cv_text: 'auto zug fahrrad ganz anderer text komplett verschieden' },
    { id: 'cv-high', cv_text: 'Berufserfahrung Produktmanagerin Logistik seit 2020' },
  ]
  const match = bestCvMatch(currentText, cvs)
  assert.ok(match)
  assert.equal(match?.id, 'cv-high')
  assert.ok((match?.ratio ?? 0) >= CV_ATTACH_THRESHOLD)
})

test('bestCvMatch: returns null when no entry meets the threshold', () => {
  const currentText = 'Berufserfahrung Produktmanagerin Logistik seit 2020 Muenchen'
  const cvs = [{ id: 'cv-1', cv_text: 'auto zug fahrrad ganz anderer text komplett verschieden' }]
  assert.equal(bestCvMatch(currentText, cvs), null)
})

test('bestCvMatch: empty cvs list -> null', () => {
  assert.equal(bestCvMatch('any text', []), null)
})
