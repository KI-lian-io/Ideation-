import type { Lebenslauf } from '@/lib/schema'

/**
 * Returns true if the parsed Lebenslauf is effectively empty — a sign that
 * the pasted text was not a real CV (junk paste / D-17 guard).
 *
 * A result is "basically empty" if:
 *   - There is no non-empty name, OR
 *   - There is a name but zero experience AND zero education entries.
 *
 * Intentionally minimal — this is a near-empty guard, not a quality score.
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
