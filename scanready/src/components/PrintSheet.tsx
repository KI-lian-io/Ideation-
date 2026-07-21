import type { Lebenslauf } from '@/lib/schema'

/**
 * Print-only, render-only document layouts for the browser's native
 * print-to-PDF flow (window.print()). These components have NO interactivity,
 * NO editing, NO paper grain / UI chrome - they exist purely to be rendered
 * inside the `#print-root` region (see globals.css `@media print`) and typeset
 * cleanly on A4 paper.
 *
 * Data contract: both components take already-`stripUids()`-ed plain data
 * (see src/lib/lebenslauf-utils.ts). Neither component reads from or writes
 * to the Zod schema - the `ortDatum` string in particular is a plain,
 * user-editable UI string that is never part of LebenslaufSchema and never
 * sent to any API (zero-retention untouched).
 */

// ---------------------------------------------------------------------------
// Section heading map – same German DIN labels used in LebenslaufEditor.tsx
// (SECTION_LABELS) and lebenslauf-utils.ts (SECTION_HEADINGS). Documents are
// always German regardless of UI language, so this is not localized.
// ---------------------------------------------------------------------------
const PRINT_SECTION_LABELS: Record<string, string> = {
  personal: 'Persönliche Daten',
  profil: 'Kurzprofil',
  experience: 'Berufserfahrung',
  education: 'Bildung',
  skills: 'Kenntnisse',
  languages: 'Sprachen',
}

function PrintPersonalSection({ personal, photoUrl }: { personal: Lebenslauf['personal']; photoUrl: string | null }) {
  const lines = [personal.address, personal.phone, personal.email].filter((v): v is string => Boolean(v?.trim()))
  return (
    <div className="print-personal-row">
      <div className="print-personal-fields">
        <p className="print-name">{personal.fullName}</p>
        {lines.map((line) => (
          <p key={line} className="print-line">{line}</p>
        ))}
        {personal.nationality?.trim() && <p className="print-line">Nationalität: {personal.nationality.trim()}</p>}
        {personal.dateOfBirth?.trim() && <p className="print-line">Geburtsdatum: {personal.dateOfBirth.trim()}</p>}
      </div>
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: URL only, printed via the browser's own print pipeline
        <img src={photoUrl} alt="" className="print-photo" />
      )}
    </div>
  )
}

function PrintExperienceSection({ experience }: { experience: Lebenslauf['experience'] }) {
  if (experience.length === 0) return null
  return (
    <div className="print-entries">
      {experience.map((exp, i) => {
        const dateRange = exp.start || exp.end ? [exp.start, exp.end].filter(Boolean).join(' – ') : null
        return (
          <div key={`${exp.role}-${exp.company}-${i}`} className="print-entry">
            <p className="print-entry-title">{exp.role}</p>
            <p className="print-entry-meta">
              {[exp.company, exp.location, dateRange].filter(Boolean).join(' · ')}
            </p>
            {exp.bullets.length > 0 && (
              <ul className="print-bullets">
                {exp.bullets.filter((b) => b?.trim()).map((bullet, bi) => (
                  <li key={bi}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PrintEducationSection({ education }: { education: Lebenslauf['education'] }) {
  if (education.length === 0) return null
  return (
    <div className="print-entries">
      {education.map((edu, i) => {
        const dateRange = edu.start || edu.end ? [edu.start, edu.end].filter(Boolean).join(' – ') : null
        return (
          <div key={`${edu.qualification}-${edu.institution}-${i}`} className="print-entry">
            <p className="print-entry-title">{edu.qualification}</p>
            <p className="print-entry-meta">
              {[edu.institution, edu.location, dateRange].filter(Boolean).join(' · ')}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function PrintSkillsSection({ skills }: { skills: Lebenslauf['skills'] }) {
  if (skills.length === 0) return null
  return (
    <div className="print-entries">
      {skills.map((cat, i) => (
        cat.skills.length > 0 && (
          <p key={`${cat.category}-${i}`} className="print-line">
            <span className="print-entry-title">{cat.category}: </span>
            {cat.skills.join(', ')}
          </p>
        )
      ))}
    </div>
  )
}

function PrintLanguagesSection({ languages }: { languages: Lebenslauf['languages'] }) {
  if (languages.length === 0) return null
  return (
    <div className="print-entries">
      {languages.map((lang, i) => (
        lang.language?.trim() && (
          <p key={`${lang.language}-${i}`} className="print-line">
            {lang.language}
            {lang.level?.trim() ? ` – ${lang.level}` : ''}
          </p>
        )
      ))}
    </div>
  )
}

/**
 * Print layout for the Lebenslauf: A4, DIN-5008-respecting margins (applied
 * via `@page` in globals.css), name as heading, personal-data block with the
 * photo top-right (prints because it's a local object URL - the img is
 * embedded as normal DOM content, no network fetch needed), sections in
 * `sectionOrder`, and the DIN Ort/Datum + Unterschrift closing convention.
 */
export function PrintLebenslauf({
  lebenslauf,
  sectionOrder,
  photoUrl,
  ortDatum,
}: {
  lebenslauf: Lebenslauf
  sectionOrder: string[]
  photoUrl: string | null
  ortDatum: string
}) {
  const renderSection = (key: string) => {
    switch (key) {
      case 'personal':
        return <PrintPersonalSection personal={lebenslauf.personal} photoUrl={photoUrl} />
      case 'profil':
        return lebenslauf.profil?.trim() ? <p className="print-line">{lebenslauf.profil}</p> : null
      case 'experience':
        return <PrintExperienceSection experience={lebenslauf.experience} />
      case 'education':
        return <PrintEducationSection education={lebenslauf.education} />
      case 'skills':
        return <PrintSkillsSection skills={lebenslauf.skills} />
      case 'languages':
        return <PrintLanguagesSection languages={lebenslauf.languages} />
      default:
        return null
    }
  }

  return (
    <div className="print-sheet" lang="de">
      {sectionOrder.map((key) => {
        const label = PRINT_SECTION_LABELS[key]
        if (!label) return null
        const content = renderSection(key)
        if (!content) return null
        return (
          <section key={key} className="print-section">
            <p className="print-section-heading">{label}</p>
            {content}
          </section>
        )
      })}

      {/* DIN closing convention: Ort, Datum line + signature gap above a thin rule. */}
      <div className="print-signature-block">
        <p className="print-line">{ortDatum}</p>
        <div className="print-signature-gap" />
        <div className="print-signature-rule" />
        <p className="print-signature-caption">Unterschrift</p>
      </div>
    </div>
  )
}

/**
 * Print layout for the Anschreiben: the letter text as-is, DIN-5008-friendly
 * (A4 margins from `@page`, white-space preserved so the model's own DIN
 * letterhead/paragraph structure survives verbatim).
 */
export function PrintAnschreiben({ letterText }: { letterText: string }) {
  return (
    <div className="print-sheet" lang="de">
      <p className="print-letter-body">{letterText}</p>
    </div>
  )
}
