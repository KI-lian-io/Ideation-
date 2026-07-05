import type { Lebenslauf, SkillCategory } from '@/lib/schema'

// ---------------------------------------------------------------------------
// Stable identity keys for editable list entries (bullets + skills/categories)
// ---------------------------------------------------------------------------

/**
 * Client-side-only stable id wrapper. Mirrors the `_uid` pattern used for
 * experience/education/language entries in page.tsx: React list keys must
 * track logical identity, not array position, or a remove/reorder dispatch
 * shifts indices while an in-flight edit stays attached to the wrong entry
 * (see page.tsx's WithUid doc comment for the full bug writeup).
 *
 * `_uid` never reaches an API payload or copy/download output: the
 * stripBulletUids/stripSkillUids helpers below are the only place that read
 * these wrapped shapes and they always emit plain strings.
 */
export type WithUid<T> = T & { _uid: string }

/** A bullet, wrapped with a stable id. `text` holds the actual bullet string. */
export type UidBullet = WithUid<{ text: string }>

/** A skill entry within a category, wrapped with a stable id. */
export type UidSkill = WithUid<{ text: string }>

/** A skill category, wrapped with a stable id, whose skills are themselves uid-wrapped. */
export type UidSkillCategory = WithUid<Omit<SkillCategory, 'skills'>> & { skills: UidSkill[] }

/** Wraps a plain bullets array with stable ids (parse / ADD_EXPERIENCE / ADD_BULLET). */
export function withBulletUids(bullets: string[]): UidBullet[] {
  return bullets.map((text) => ({ _uid: crypto.randomUUID(), text }))
}

/** Wraps a plain skills array with stable ids (parse / ADD_SKILL). */
export function withSkillUids(skills: string[]): UidSkill[] {
  return skills.map((text) => ({ _uid: crypto.randomUUID(), text }))
}

/** Wraps a plain skill-categories array (and each category's skills) with stable ids. */
export function withSkillCategoryUids(categories: SkillCategory[]): UidSkillCategory[] {
  return categories.map((cat) => ({
    ...cat,
    _uid: crypto.randomUUID(),
    skills: withSkillUids(cat.skills),
  }))
}

/** Unwraps a uid-wrapped bullets array back to plain strings – never emits `_uid`. */
export function stripBulletUids(bullets: UidBullet[]): string[] {
  return bullets.map((b) => b.text)
}

/** Unwraps a uid-wrapped skills array back to plain strings – never emits `_uid`. */
export function stripSkillUids(skills: UidSkill[]): string[] {
  return skills.map((s) => s.text)
}

/** Unwraps uid-wrapped skill categories back to the plain schema shape – never emits `_uid`. */
export function stripSkillCategoryUids(categories: UidSkillCategory[]): SkillCategory[] {
  return categories.map((cat) => ({
    category: cat.category,
    skills: stripSkillUids(cat.skills),
  }))
}

/**
 * Shape of the editor's in-memory Lebenslauf: experience/education/languages
 * carry `_uid` (assigned in page.tsx's withUids), experience bullets and
 * skills/skill-categories carry `_uid` via the helpers above. This is the
 * type toPlainText's callers hold; stripUids below is the single boundary
 * that converts it back to the plain, API/serialization-safe `Lebenslauf`.
 */
export type LebenslaufEditorState = Omit<Lebenslauf, 'experience' | 'education' | 'languages' | 'skills'> & {
  experience: (WithUid<Omit<Lebenslauf['experience'][number], 'bullets'>> & { bullets: UidBullet[] })[]
  education: WithUid<Lebenslauf['education'][number]>[]
  languages: WithUid<Lebenslauf['languages'][number]>[]
  skills: UidSkillCategory[]
}

/**
 * Strips every `_uid` from the editor state, returning the plain `Lebenslauf`
 * shape the schema/API/serialization expect. This is the single boundary
 * function: call it before toPlainText or any API payload, never spread a
 * uid-wrapped entry directly (that would leak `_uid` into copy/download output
 * or a request body).
 */
export function stripUids(l: LebenslaufEditorState): Lebenslauf {
  return {
    ...l,
    experience: l.experience.map(({ _uid, bullets, ...rest }) => ({
      ...rest,
      bullets: stripBulletUids(bullets),
    })),
    education: l.education.map(({ _uid, ...rest }) => rest),
    languages: l.languages.map(({ _uid, ...rest }) => rest),
    skills: stripSkillCategoryUids(l.skills),
  }
}

// ---------------------------------------------------------------------------
// Section heading map: German DIN section names for toPlainText serialization
// ---------------------------------------------------------------------------
const SECTION_HEADINGS: Record<string, string> = {
  personal: 'Persönliche Daten',
  experience: 'Berufserfahrung',
  education: 'Bildung',
  skills: 'Kenntnisse',
  languages: 'Sprachen',
}

/**
 * Returns true if the parsed Lebenslauf is effectively empty: a sign that
 * the pasted text was not a real CV (junk paste / D-17 guard).
 *
 * A result is "basically empty" if:
 *   - There is no non-empty name, OR
 *   - There is a name but zero experience AND zero education entries.
 *
 * Intentionally minimal: this is a near-empty guard, not a quality score.
 */
export function isLebenslaufBasicallyEmpty(l: Lebenslauf): boolean {
  const hasName = Boolean(l.personal.fullName?.trim())
  const hasExperience = l.experience.length > 0
  const hasEducation = l.education.length > 0
  return !(hasName && (hasExperience || hasEducation))
}

/**
 * Soft-formats a raw date string into German DD.MM.YYYY format when possible.
 * Passes through partial dates ("September 2020", "2020", "heute") unchanged.
 *
 * Used in EditableField onBlurFormat for date fields (D-11).
 */
export function softFormatDate(raw: string): string {
  if (!raw) return raw
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw // already DD.MM.YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-')
    return `${d}.${m}.${y}`
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [m, d, y] = raw.split('/')
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`
  }
  return raw // pass through: "heute", "September 2020", "2020", etc.
}

/**
 * Serializes the CURRENT edited Lebenslauf to a clean plain-text block for
 * clipboard copy (D-04). Emits sections in `sectionOrder`; skips null/empty
 * fields cleanly. No HTML, no fabrication: copies only what the user has edited.
 */
export function toPlainText(l: Lebenslauf, sectionOrder: string[]): string {
  const parts: string[] = []

  for (const key of sectionOrder) {
    const heading = SECTION_HEADINGS[key]
    if (!heading) continue

    switch (key) {
      case 'personal': {
        const p = l.personal
        const lines: string[] = []
        if (p.fullName?.trim()) lines.push(p.fullName.trim())
        if (p.address?.trim()) lines.push(p.address.trim())
        if (p.phone?.trim()) lines.push(p.phone.trim())
        if (p.email?.trim()) lines.push(p.email.trim())
        if (p.nationality?.trim()) lines.push(`Nationalität: ${p.nationality.trim()}`)
        if (p.dateOfBirth?.trim()) lines.push(`Geburtsdatum: ${p.dateOfBirth.trim()}`)
        if (lines.length > 0) {
          parts.push(`${heading}\n${lines.join('\n')}`)
        }
        break
      }
      case 'experience': {
        if (l.experience.length === 0) break
        const entries: string[] = []
        for (const exp of l.experience) {
          const lines: string[] = []
          const dateRange =
            exp.start || exp.end
              ? [exp.start, exp.end].filter(Boolean).join(' – ')
              : null
          const header = [exp.role, exp.company, exp.location, dateRange]
            .filter(Boolean)
            .join(' | ')
          if (header) lines.push(header)
          for (const bullet of exp.bullets) {
            if (bullet?.trim()) lines.push(`  - ${bullet.trim()}`)
          }
          if (lines.length > 0) entries.push(lines.join('\n'))
        }
        if (entries.length > 0) {
          parts.push(`${heading}\n${entries.join('\n')}`)
        }
        break
      }
      case 'education': {
        if (l.education.length === 0) break
        const entries: string[] = []
        for (const edu of l.education) {
          const dateRange =
            edu.start || edu.end
              ? [edu.start, edu.end].filter(Boolean).join(' – ')
              : null
          const header = [edu.qualification, edu.institution, edu.location, dateRange]
            .filter(Boolean)
            .join(' | ')
          if (header) entries.push(header)
        }
        if (entries.length > 0) {
          parts.push(`${heading}\n${entries.join('\n')}`)
        }
        break
      }
      case 'skills': {
        if (l.skills.length === 0) break
        const lines: string[] = []
        for (const cat of l.skills) {
          if (cat.skills.length > 0) {
            lines.push(`${cat.category}: ${cat.skills.join(', ')}`)
          }
        }
        if (lines.length > 0) {
          parts.push(`${heading}\n${lines.join('\n')}`)
        }
        break
      }
      case 'languages': {
        if (l.languages.length === 0) break
        const lines: string[] = []
        for (const lang of l.languages) {
          if (lang.language?.trim()) {
            const entry = lang.level?.trim()
              ? `${lang.language.trim()} – ${lang.level.trim()}`
              : lang.language.trim()
            lines.push(entry)
          }
        }
        if (lines.length > 0) {
          parts.push(`${heading}\n${lines.join('\n')}`)
        }
        break
      }
    }
  }

  return parts.join('\n\n')
}
