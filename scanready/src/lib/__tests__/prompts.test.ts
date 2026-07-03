/**
 * Behavior tests for questionsForPosting (conditional Gehalt/Eintrittstermin questions).
 * Run: node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { questionsForPosting, PERSONALIZATION_QUESTIONS, SALARY_QUESTION, START_DATE_QUESTION } from '../prompts.ts'

test('plain posting returns only the base questions', () => {
  const qs = questionsForPosting('Wir suchen eine:n Frontend-Entwickler:in in Berlin.')
  assert.deepEqual(qs, PERSONALIZATION_QUESTIONS)
})

test('posting asking for Gehaltsvorstellung appends the salary question', () => {
  const qs = questionsForPosting('Bitte senden Sie uns Ihre Bewerbung mit Gehaltsvorstellung.')
  assert.equal(qs.length, PERSONALIZATION_QUESTIONS.length + 1)
  assert.equal(qs[qs.length - 1], SALARY_QUESTION)
})

test('posting asking for salary expectation in English appends the salary question', () => {
  const qs = questionsForPosting('Please include your salary expectation in the cover letter.')
  assert.ok(qs.includes(SALARY_QUESTION))
})

test('posting asking for Eintrittstermin appends the start-date question', () => {
  const qs = questionsForPosting('Bitte nennen Sie Ihren frühestmöglichen Eintrittstermin.')
  assert.ok(qs.includes(START_DATE_QUESTION))
})

test('posting asking for both appends both, salary first', () => {
  const qs = questionsForPosting('Mit Gehaltsvorstellung und frühestmöglichem Eintrittstermin.')
  assert.deepEqual(qs.slice(-2), [SALARY_QUESTION, START_DATE_QUESTION])
})

test('matching is case-insensitive', () => {
  const qs = questionsForPosting('GEHALTSVORSTELLUNG erwünscht')
  assert.ok(qs.includes(SALARY_QUESTION))
})
