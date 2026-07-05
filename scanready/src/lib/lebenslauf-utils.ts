import type { Lebenslauf } from '@/lib/schema'

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
