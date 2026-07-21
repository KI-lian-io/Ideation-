/**
 * Behavior tests for questionsForPosting (conditional Gehalt/Eintrittstermin questions).
 * Run: node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { questionsForPosting, PERSONALIZATION_QUESTIONS, SALARY_QUESTION, START_DATE_QUESTION } from '../prompts.ts'
import { HUMANIZER_DIRECTIONS, buildHumanizerUser, HUMANIZER_SYSTEM, COVER_LETTER_SYSTEM } from '../prompts.ts'
import { recommendDirection, DIRECTION_SAMPLES } from '../prompts.ts'

test('plain posting returns only the base questions', () => {
  const qs = questionsForPosting('Wir suchen eine:n Frontend-Entwickler:in in Berlin.')
  assert.deepEqual(qs, PERSONALIZATION_QUESTIONS)
})

test('posting asking for Gehaltsvorstellung appends the salary question', () => {
  const qs = questionsForPosting('Bitte senden Sie uns Ihre Bewerbung mit Gehaltsvorstellung.')
  assert.equal(qs.length, PERSONALIZATION_QUESTIONS.length + 1)
  assert.deepEqual(qs[qs.length - 1], SALARY_QUESTION)
})

test('posting asking for salary expectation in English appends the salary question', () => {
  const qs = questionsForPosting('Please include your salary expectation in the cover letter.')
  assert.ok(qs.some((q) => q.id === SALARY_QUESTION.id))
})

test('posting asking for Eintrittstermin appends the start-date question', () => {
  const qs = questionsForPosting('Bitte nennen Sie Ihren frühestmöglichen Eintrittstermin.')
  assert.ok(qs.some((q) => q.id === START_DATE_QUESTION.id))
})

test('posting asking for both appends both, salary first', () => {
  const qs = questionsForPosting('Mit Gehaltsvorstellung und frühestmöglichem Eintrittstermin.')
  assert.deepEqual(qs.slice(-2), [SALARY_QUESTION, START_DATE_QUESTION])
})

test('matching is case-insensitive', () => {
  const qs = questionsForPosting('GEHALTSVORSTELLUNG erwünscht')
  assert.ok(qs.some((q) => q.id === SALARY_QUESTION.id))
})

test('every question has a unique id and non-empty en/de text', () => {
  const ids = new Set(PERSONALIZATION_QUESTIONS.map((q) => q.id))
  assert.equal(ids.size, PERSONALIZATION_QUESTIONS.length)
  for (const q of PERSONALIZATION_QUESTIONS) {
    assert.ok(q.en.length > 0)
    assert.ok(q.de.length > 0)
  }
})

test('humanizer has exactly the three directions', () => {
  assert.deepEqual(Object.keys(HUMANIZER_DIRECTIONS).sort(), ['formeller', 'moderner', 'praegnanter'])
})

test('buildHumanizerUser embeds the letter and the chosen direction text', () => {
  const out = buildHumanizerUser('Sehr geehrte Damen und Herren, ...', 'formeller')
  assert.ok(out.includes('Sehr geehrte Damen und Herren'))
  assert.ok(out.includes(HUMANIZER_DIRECTIONS.formeller))
})

test('humanizer system prompt forbids adding facts and contains no detection-evasion framing', () => {
  assert.ok(/never add facts|Never add facts/i.test(HUMANIZER_SYSTEM))
  assert.ok(!/detect/i.test(HUMANIZER_SYSTEM))
})

test('cover-letter and humanizer prompts carry the untrusted-input rules + sentinel', () => {
  for (const p of [COVER_LETTER_SYSTEM, HUMANIZER_SYSTEM]) {
    assert.ok(p.includes('UNTRUSTED INPUT'))
    assert.ok(p.includes('UNGÜLTIGE EINGABE'))
    assert.ok(!/detect/i.test(p))
  }
})

test('hardening rules bias against false refusals', () => {
  for (const p of [COVER_LETTER_SYSTEM, HUMANIZER_SYSTEM]) {
    assert.ok(p.includes('when in doubt, do the task'))
  }
})

test('recommendDirection: an over-long letter recommends praegnanter even with a startup posting', () => {
  const longLetter = 'x'.repeat(3201)
  const startupPosting = 'Wir sind ein Startup und suchen dich, sei Teil unseres Teams.'
  assert.equal(recommendDirection(startupPosting, longLetter), 'praegnanter')
})

test('recommendDirection: du-form/startup posting recommends moderner', () => {
  const posting = 'Unser Scale-up sucht dich! Schreib uns, wenn du Lust hast.'
  assert.equal(recommendDirection(posting, 'short letter'), 'moderner')
})

test('recommendDirection: Konzern/bank posting recommends formeller', () => {
  const posting = 'Die Deutsche Bank AG sucht eine:n Sachbearbeiter:in im Konzern.'
  assert.equal(recommendDirection(posting, 'short letter'), 'formeller')
})

test('recommendDirection: mixed signals (startup AND bank) fall back to formeller', () => {
  const posting = 'Unser Startup, eine Tochtergesellschaft der Bank, sucht dich.'
  assert.equal(recommendDirection(posting, 'short letter'), 'formeller')
})

test('recommendDirection: empty posting recommends formeller', () => {
  assert.equal(recommendDirection('', 'short letter'), 'formeller')
})

test('DIRECTION_SAMPLES has exactly one sample sentence per direction', () => {
  assert.deepEqual(Object.keys(DIRECTION_SAMPLES).sort(), ['formeller', 'moderner', 'praegnanter'])
  for (const v of Object.values(DIRECTION_SAMPLES)) {
    assert.equal(typeof v, 'string')
    assert.ok(v.length > 0)
  }
})
