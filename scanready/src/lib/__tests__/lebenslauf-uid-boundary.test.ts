/**
 * Regression tests for the bullets / skills / skill-categories `_uid` fix
 * (issue #10 – same bug class as lebenslauf-editor-reorder.test.ts, but for
 * the two spots that were still index-keyed: experience bullets and
 * skills/skill-categories in the Kenntnisse section).
 *
 * Bug being guarded against: index-keyed React lists (key={i}) break identity
 * across a remove, because EditableField's internal edit-draft state stays
 * attached to whichever DOM node sits at that index rather than following the
 * logical entry – removing bullet 0 while editing bullet 1 can silently
 * commit the in-flight edit to the WRONG remaining bullet. The fix wraps
 * bullets/skills as `{ _uid, text }` and skill categories as `{ _uid,
 * category, skills }`, so React keys track identity instead of position.
 *
 * This file tests the pure helpers in lebenslauf-utils.ts directly (withBulletUids,
 * withSkillUids, withSkillCategoryUids, stripBulletUids, stripSkillUids,
 * stripSkillCategoryUids, stripUids) rather than page.tsx's reducer, which lives
 * in a 'use client' page file that Node's --experimental-strip-types (this
 * repo's test runner) cannot load. The reducer's UPDATE_BULLET/ADD_BULLET/
 * REMOVE_BULLET and skill equivalents are thin wrappers around array
 * position + the same identity rule these helpers establish.
 *
 * Run: node --experimental-strip-types --test src/lib/__tests__/lebenslauf-uid-boundary.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  withBulletUids,
  withSkillUids,
  withSkillCategoryUids,
  stripBulletUids,
  stripSkillUids,
  stripSkillCategoryUids,
  stripUids,
  toPlainText,
} from '../lebenslauf-utils.ts'
import type { LebenslaufEditorState } from '../lebenslauf-utils.ts'

// ---------------------------------------------------------------------------
// withBulletUids / withSkillUids / withSkillCategoryUids: wrapping assigns uids
// ---------------------------------------------------------------------------

test('withBulletUids: assigns a unique _uid to every bullet and preserves text + order', () => {
  const bullets = withBulletUids(['Led the migration', 'Owned the rollout', 'Mentored two juniors'])
  assert.equal(bullets.length, 3)
  assert.deepEqual(bullets.map((b) => b.text), ['Led the migration', 'Owned the rollout', 'Mentored two juniors'])
  const uids = new Set(bullets.map((b) => b._uid))
  assert.equal(uids.size, 3, 'every bullet must get a distinct _uid')
  for (const b of bullets) assert.equal(typeof b._uid, 'string')
})

test('withSkillUids: assigns a unique _uid to every skill and preserves text + order', () => {
  const skills = withSkillUids(['TypeScript', 'React', 'Node.js'])
  assert.equal(skills.length, 3)
  assert.deepEqual(skills.map((s) => s.text), ['TypeScript', 'React', 'Node.js'])
  const uids = new Set(skills.map((s) => s._uid))
  assert.equal(uids.size, 3, 'every skill must get a distinct _uid')
})

test('withSkillCategoryUids: assigns a unique _uid to every category AND to every skill within it', () => {
  const categories = withSkillCategoryUids([
    { category: 'IT-Kenntnisse', skills: ['TypeScript', 'React'] },
    { category: 'Sprachen-Tools', skills: ['Git'] },
  ])
  assert.equal(categories.length, 2)
  assert.deepEqual(categories.map((c) => c.category), ['IT-Kenntnisse', 'Sprachen-Tools'])

  const catUids = new Set(categories.map((c) => c._uid))
  assert.equal(catUids.size, 2, 'every category must get a distinct _uid')

  const allSkillUids = categories.flatMap((c) => c.skills.map((s) => s._uid))
  assert.equal(new Set(allSkillUids).size, 3, 'every skill across all categories must get a distinct _uid')
  assert.deepEqual(categories[0].skills.map((s) => s.text), ['TypeScript', 'React'])
  assert.deepEqual(categories[1].skills.map((s) => s.text), ['Git'])
})

// ---------------------------------------------------------------------------
// Remove preserves uid+text pairing (identity, no cross-write)
// ---------------------------------------------------------------------------

test('removing bullet 0 preserves the uid+text pairing of the remaining bullets (no cross-write)', () => {
  const bullets = withBulletUids(['first', 'second', 'third'])
  const [, second, third] = bullets

  // Mirrors the reducer's REMOVE_BULLET: filter by array position (bulletIndex), which
  // is all the dispatch action carries – the fix is that the surviving objects (and
  // their _uid) are never rebuilt, so React's key={bullet._uid} stays attached to the
  // correct entry instead of shifting up to inherit bullet 0's stale DOM/edit state.
  const afterRemove = bullets.filter((_, bi) => bi !== 0)

  assert.equal(afterRemove.length, 2)
  assert.equal(afterRemove[0]._uid, second._uid, 'former index-1 bullet keeps its own uid')
  assert.equal(afterRemove[0].text, 'second')
  assert.equal(afterRemove[1]._uid, third._uid, 'former index-2 bullet keeps its own uid')
  assert.equal(afterRemove[1].text, 'third')
  // Object identity, not just value equality: proves the remaining entries are the
  // SAME objects, so an in-flight edit attached to one of them travels correctly.
  assert.equal(afterRemove[0], second)
  assert.equal(afterRemove[1], third)
})

test('removing skill 0 within a category preserves the uid+text pairing of the remaining skills', () => {
  const skills = withSkillUids(['TypeScript', 'React', 'Node.js'])
  const [, react, node] = skills

  const afterRemove = skills.filter((_, si) => si !== 0)

  assert.equal(afterRemove.length, 2)
  assert.equal(afterRemove[0]._uid, react._uid)
  assert.equal(afterRemove[0].text, 'React')
  assert.equal(afterRemove[1]._uid, node._uid)
  assert.equal(afterRemove[1].text, 'Node.js')
  assert.equal(afterRemove[0], react)
  assert.equal(afterRemove[1], node)
})

test('removing skill category 0 preserves the uid+category pairing of the remaining categories', () => {
  const categories = withSkillCategoryUids([
    { category: 'IT-Kenntnisse', skills: ['TypeScript'] },
    { category: 'Fachkenntnisse', skills: ['SAP'] },
    { category: 'Sonstige Kenntnisse', skills: ['Führerschein'] },
  ])
  const [, fach, sonstige] = categories

  const afterRemove = categories.filter((_, ci) => ci !== 0)

  assert.equal(afterRemove.length, 2)
  assert.equal(afterRemove[0]._uid, fach._uid)
  assert.equal(afterRemove[0].category, 'Fachkenntnisse')
  assert.equal(afterRemove[1]._uid, sonstige._uid)
  assert.equal(afterRemove[1].category, 'Sonstige Kenntnisse')
  assert.equal(afterRemove[0], fach)
  assert.equal(afterRemove[1], sonstige)
})

// ---------------------------------------------------------------------------
// Serialization boundary: stripUids emits NO _uid, and toPlainText output is
// unchanged from before the fix for a representative Lebenslauf.
// ---------------------------------------------------------------------------

function makeEditorState(): LebenslaufEditorState {
  return {
    personal: {
      fullName: 'Max Mustermann',
      address: 'Musterstraße 1, 10115 Berlin',
      phone: '+49 30 1234567',
      email: 'max@example.com',
      nationality: null,
      dateOfBirth: null,
    },
    experience: [
      {
        _uid: 'exp-uid-1',
        role: 'Software Engineer',
        company: 'Tech GmbH',
        location: 'Berlin',
        start: '03/2020',
        end: 'heute',
        bullets: withBulletUids(['Led the migration to TypeScript', 'Owned the CI/CD rollout']),
      },
    ],
    education: [
      {
        _uid: 'edu-uid-1',
        qualification: 'B.Sc. Informatik',
        institution: 'TU Berlin',
        location: 'Berlin',
        start: '2016',
        end: '2019',
      },
    ],
    skills: withSkillCategoryUids([
      { category: 'IT-Kenntnisse', skills: ['TypeScript', 'React'] },
      { category: 'Sonstige Kenntnisse', skills: ['Führerschein Klasse B'] },
    ]),
    languages: [
      { _uid: 'lang-uid-1', language: 'Deutsch', level: 'Verhandlungssicher' },
      { _uid: 'lang-uid-2', language: 'Englisch', level: 'Fließend' },
    ],
    normGapNotes: [],
    photoAdvice: { en: '', de: '' },
  }
}

test('stripUids: output contains no _uid key anywhere in the tree', () => {
  const stripped = stripUids(makeEditorState())
  const json = JSON.stringify(stripped)
  assert.ok(!json.includes('_uid'), 'stripped Lebenslauf must not contain _uid anywhere')
})

test('stripUids: experience bullets become plain strings, in order', () => {
  const stripped = stripUids(makeEditorState())
  assert.deepEqual(stripped.experience[0].bullets, [
    'Led the migration to TypeScript',
    'Owned the CI/CD rollout',
  ])
})

test('stripUids: skill categories/skills become the plain schema shape, in order', () => {
  const stripped = stripUids(makeEditorState())
  assert.deepEqual(stripped.skills, [
    { category: 'IT-Kenntnisse', skills: ['TypeScript', 'React'] },
    { category: 'Sonstige Kenntnisse', skills: ['Führerschein Klasse B'] },
  ])
})

test('stripBulletUids / stripSkillUids / stripSkillCategoryUids: never emit _uid in isolation', () => {
  const bullets = withBulletUids(['a', 'b'])
  assert.deepEqual(stripBulletUids(bullets), ['a', 'b'])

  const skills = withSkillUids(['x', 'y'])
  assert.deepEqual(stripSkillUids(skills), ['x', 'y'])

  const categories = withSkillCategoryUids([{ category: 'C', skills: ['x'] }])
  assert.deepEqual(stripSkillCategoryUids(categories), [{ category: 'C', skills: ['x'] }])
})

test('toPlainText(stripUids(state)) produces the same output as toPlainText on the equivalent plain Lebenslauf', () => {
  const editorState = makeEditorState()
  const sectionOrder = ['personal', 'experience', 'education', 'skills', 'languages']

  const viaStripUids = toPlainText(stripUids(editorState), sectionOrder)

  // Hand-built plain Lebenslauf with identical field values but no _uid anywhere –
  // this is what toPlainText saw before the bullets/skills _uid wrapping existed.
  const plainEquivalent = {
    personal: editorState.personal,
    experience: [
      {
        role: 'Software Engineer',
        company: 'Tech GmbH',
        location: 'Berlin',
        start: '03/2020',
        end: 'heute',
        bullets: ['Led the migration to TypeScript', 'Owned the CI/CD rollout'],
      },
    ],
    education: [
      {
        qualification: 'B.Sc. Informatik',
        institution: 'TU Berlin',
        location: 'Berlin',
        start: '2016',
        end: '2019',
      },
    ],
    skills: [
      { category: 'IT-Kenntnisse', skills: ['TypeScript', 'React'] },
      { category: 'Sonstige Kenntnisse', skills: ['Führerschein Klasse B'] },
    ],
    languages: [
      { language: 'Deutsch', level: 'Verhandlungssicher' },
      { language: 'Englisch', level: 'Fließend' },
    ],
    normGapNotes: [],
    photoAdvice: { en: '', de: '' },
  }
  const viaPlain = toPlainText(plainEquivalent, sectionOrder)

  assert.equal(viaStripUids, viaPlain)
  assert.ok(viaStripUids.includes('Led the migration to TypeScript'))
  assert.ok(viaStripUids.includes('IT-Kenntnisse: TypeScript, React'))
  assert.ok(!viaStripUids.includes('_uid'))
})
