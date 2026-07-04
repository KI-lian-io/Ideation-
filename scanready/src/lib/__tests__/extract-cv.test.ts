/**
 * Behavior tests for extract-cv.ts — the pure guard only.
 * Extraction itself needs a browser File / real PDF; covered by manual browser verification.
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 * Run: node --experimental-strip-types --test src/lib/__tests__/extract-cv.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateCvFile, MAX_FILE_BYTES, EXTRACT_ERROR_MESSAGES } from '../extract-cv.ts'

test('rejects oversized files', () => {
  assert.equal(validateCvFile({ name: 'cv.pdf', size: MAX_FILE_BYTES + 1, type: 'application/pdf' }), 'too_large')
})

test('accepts pdf by mime and by extension fallback', () => {
  assert.equal(validateCvFile({ name: 'cv.pdf', size: 1000, type: 'application/pdf' }), null)
  assert.equal(validateCvFile({ name: 'CV.PDF', size: 1000, type: '' }), null)
})

test('accepts txt by mime and extension', () => {
  assert.equal(validateCvFile({ name: 'cv.txt', size: 1000, type: 'text/plain' }), null)
  assert.equal(validateCvFile({ name: 'cv.txt', size: 1000, type: '' }), null)
})

test('rejects docx/images/others', () => {
  assert.equal(validateCvFile({ name: 'cv.docx', size: 1000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'unsupported_type')
  assert.equal(validateCvFile({ name: 'scan.jpg', size: 1000, type: 'image/jpeg' }), 'unsupported_type')
})

test('every error reason has a German message', () => {
  for (const reason of ['too_large', 'unsupported_type', 'empty_extraction'] as const) {
    assert.ok(EXTRACT_ERROR_MESSAGES[reason].length > 10)
  }
})
