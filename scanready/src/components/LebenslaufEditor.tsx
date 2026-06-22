'use client'
import React from 'react'
import { EditableField } from '@/components/EditableField'
import { softFormatDate } from '@/lib/lebenslauf-utils'
import type { Lebenslauf } from '@/lib/schema'

/**
 * LebenslaufAction union — all edit/add/remove/reorder actions for the WYSIWYG
 * Lebenslauf editor. Imported by page.tsx and extended by Plan 04 for skill chips.
 *
 * XSS: all values flow through controlled inputs; no HTML injection.
 */
export type LebenslaufAction =
  // Personal data
  | { type: 'UPDATE_PERSONAL'; field: keyof Lebenslauf['personal']; value: string }
  // Experience
  | { type: 'UPDATE_EXPERIENCE'; index: number; field: keyof Lebenslauf['experience'][number]; value: string }
  | { type: 'ADD_EXPERIENCE' }
  | { type: 'REMOVE_EXPERIENCE'; index: number }
  | { type: 'REORDER_EXPERIENCE'; from: number; to: number }
  // Bullets
  | { type: 'UPDATE_BULLET'; expIndex: number; bulletIndex: number; value: string }
  | { type: 'ADD_BULLET'; expIndex: number }
  | { type: 'REMOVE_BULLET'; expIndex: number; bulletIndex: number }
  // Education
  | { type: 'UPDATE_EDUCATION'; index: number; field: keyof Lebenslauf['education'][number]; value: string }
  | { type: 'ADD_EDUCATION' }
  | { type: 'REMOVE_EDUCATION'; index: number }
  | { type: 'REORDER_EDUCATION'; from: number; to: number }
  // Languages
  | { type: 'UPDATE_LANGUAGE'; index: number; field: 'language' | 'level'; value: string }
  | { type: 'ADD_LANGUAGE' }
  | { type: 'REMOVE_LANGUAGE'; index: number }
  // Section order
  | { type: 'REORDER_SECTION'; from: number; to: number }

/**
 * Pure array reorder helper — no mutation, no external library.
 * Moves the item at index `from` to index `to`.
 */
export function reorder<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LebenslaufEditorProps {
  lebenslauf: Lebenslauf
  sectionOrder: string[]
  dispatch: React.Dispatch<LebenslaufAction>
}

// ---------------------------------------------------------------------------
// Section heading labels (German DIN)
// ---------------------------------------------------------------------------
const SECTION_LABELS: Record<string, string> = {
  personal: 'Persönliche Daten',
  experience: 'Berufserfahrung',
  education: 'Bildung',
  skills: 'Kenntnisse',
  languages: 'Sprachen',
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function PersonalSection({
  personal,
  dispatch,
}: {
  personal: Lebenslauf['personal']
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        <EditableField
          value={personal.fullName}
          placeholder="+ Vorname, Nachname"
          onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'fullName', value: v })}
          className="text-2xl font-semibold"
        />
      </div>
      <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <EditableField
          value={personal.address}
          placeholder="+ Adresse"
          onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'address', value: v })}
        />
        <EditableField
          value={personal.phone}
          placeholder="+ Telefonnummer"
          onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'phone', value: v })}
        />
        <EditableField
          value={personal.email}
          placeholder="+ E-Mail-Adresse"
          onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'email', value: v })}
        />
        <EditableField
          value={personal.nationality}
          placeholder="+ Nationalität"
          onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'nationality', value: v })}
        />
        <EditableField
          value={personal.dateOfBirth}
          placeholder="+ Geburtsdatum"
          onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'dateOfBirth', value: v })}
          onBlurFormat={softFormatDate}
        />
      </div>
    </div>
  )
}

function ExperienceSection({
  experience,
  dispatch,
}: {
  experience: Lebenslauf['experience']
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  return (
    <div className="flex flex-col gap-4">
      {experience.map((exp, i) => (
        <div key={i} className="group relative rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {/* On-hover controls: remove + reorder */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 flex items-center gap-1">
            <button
              onClick={() => i > 0 && dispatch({ type: 'REORDER_EXPERIENCE', from: i, to: i - 1 })}
              disabled={i === 0}
              aria-label="Eintrag nach oben"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 text-sm px-2 py-1 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => i < experience.length - 1 && dispatch({ type: 'REORDER_EXPERIENCE', from: i, to: i + 1 })}
              disabled={i === experience.length - 1}
              aria-label="Eintrag nach unten"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 text-sm px-2 py-1 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_EXPERIENCE', index: i })}
              aria-label="Eintrag entfernen"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-red-600 text-sm px-2 py-1"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Role */}
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              <EditableField
                value={exp.role}
                placeholder="+ Berufsbezeichnung"
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'role', value: v })}
                className="font-semibold"
              />
            </div>
            {/* Company + location */}
            <div className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <EditableField
                value={exp.company}
                placeholder="+ Unternehmen"
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'company', value: v })}
              />
              <EditableField
                value={exp.location}
                placeholder="+ Standort"
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'location', value: v })}
              />
            </div>
            {/* Dates */}
            <div className="flex gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <EditableField
                value={exp.start}
                placeholder="+ Datum"
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'start', value: v })}
                onBlurFormat={softFormatDate}
              />
              <span className="text-zinc-400">–</span>
              <EditableField
                value={exp.end}
                placeholder="+ Datum"
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'end', value: v })}
                onBlurFormat={softFormatDate}
              />
            </div>
            {/* Bullets */}
            <div className="flex flex-col gap-1 mt-1">
              {exp.bullets.map((bullet, bi) => (
                <div key={bi} className="group/bullet flex items-start gap-1">
                  <span className="text-zinc-400 mt-0.5 text-sm select-none">–</span>
                  <div className="flex-1">
                    <EditableField
                      value={bullet}
                      placeholder="+ Aufgabe hinzufügen"
                      multiline
                      onSave={(v) => dispatch({ type: 'UPDATE_BULLET', expIndex: i, bulletIndex: bi, value: v })}
                      className="text-sm"
                    />
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_BULLET', expIndex: i, bulletIndex: bi })}
                    aria-label="Eintrag entfernen"
                    className="opacity-0 group-hover/bullet:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-red-600 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => dispatch({ type: 'ADD_BULLET', expIndex: i })}
                className="self-start text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer mt-1"
              >
                + Aufgabe hinzufügen
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add experience entry */}
      <button
        onClick={() => dispatch({ type: 'ADD_EXPERIENCE' })}
        className="self-start text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer"
      >
        + Berufserfahrung hinzufügen
      </button>
    </div>
  )
}

function EducationSection({
  education,
  dispatch,
}: {
  education: Lebenslauf['education']
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  return (
    <div className="flex flex-col gap-4">
      {education.map((edu, i) => (
        <div key={i} className="group relative rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {/* On-hover controls */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 flex items-center gap-1">
            <button
              onClick={() => i > 0 && dispatch({ type: 'REORDER_EDUCATION', from: i, to: i - 1 })}
              disabled={i === 0}
              aria-label="Eintrag nach oben"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 text-sm px-2 py-1 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => i < education.length - 1 && dispatch({ type: 'REORDER_EDUCATION', from: i, to: i + 1 })}
              disabled={i === education.length - 1}
              aria-label="Eintrag nach unten"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 text-sm px-2 py-1 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_EDUCATION', index: i })}
              aria-label="Eintrag entfernen"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-red-600 text-sm px-2 py-1"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              <EditableField
                value={edu.qualification}
                placeholder="+ Abschluss"
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'qualification', value: v })}
                className="font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <EditableField
                value={edu.institution}
                placeholder="+ Bildungseinrichtung"
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'institution', value: v })}
              />
              <EditableField
                value={edu.location}
                placeholder="+ Standort"
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'location', value: v })}
              />
            </div>
            <div className="flex gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <EditableField
                value={edu.start}
                placeholder="+ Datum"
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'start', value: v })}
                onBlurFormat={softFormatDate}
              />
              <span className="text-zinc-400">–</span>
              <EditableField
                value={edu.end}
                placeholder="+ Datum"
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'end', value: v })}
                onBlurFormat={softFormatDate}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => dispatch({ type: 'ADD_EDUCATION' })}
        className="self-start text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer"
      >
        + Bildungsabschluss hinzufügen
      </button>
    </div>
  )
}

function SkillsSection({
  skills,
  dispatch,
}: {
  skills: Lebenslauf['skills']
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  // Plan 03: minimal plain-text render — skill chips and category editing arrive in Plan 04.
  // Rendered as editable plain text per section (Plan 04 will convert to chip UI).
  if (skills.length === 0) {
    return (
      <p className="text-sm text-zinc-400 italic">Keine Kenntnisse — Plan 04 fügt die Chip-Bearbeitung hinzu.</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {skills.map((cat, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {cat.category}
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {cat.skills.join(', ')}
          </p>
        </div>
      ))}
    </div>
  )
}

function LanguagesSection({
  languages,
  dispatch,
}: {
  languages: Lebenslauf['languages']
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  return (
    <div className="flex flex-col gap-2">
      {languages.map((lang, i) => (
        <div key={i} className="group flex items-center gap-2">
          <EditableField
            value={lang.language}
            placeholder="+ Sprache hinzufügen"
            onSave={(v) => dispatch({ type: 'UPDATE_LANGUAGE', index: i, field: 'language', value: v })}
            className="text-sm"
          />
          <span className="text-zinc-400 text-sm">—</span>
          <EditableField
            value={lang.level}
            placeholder="+ Niveau"
            onSave={(v) => dispatch({ type: 'UPDATE_LANGUAGE', index: i, field: 'level', value: v })}
            className="text-sm text-zinc-500"
          />
          <button
            onClick={() => dispatch({ type: 'REMOVE_LANGUAGE', index: i })}
            aria-label="Eintrag entfernen"
            className="opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-red-600 text-xs px-1"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => dispatch({ type: 'ADD_LANGUAGE' })}
        className="self-start text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer"
      >
        + Sprache hinzufügen
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LebenslaufEditor({
  lebenslauf,
  sectionOrder,
  dispatch,
}: LebenslaufEditorProps) {
  const renderSection = (key: string) => {
    switch (key) {
      case 'personal':
        return (
          <PersonalSection
            personal={lebenslauf.personal}
            dispatch={dispatch}
          />
        )
      case 'experience':
        return (
          <ExperienceSection
            experience={lebenslauf.experience}
            dispatch={dispatch}
          />
        )
      case 'education':
        return (
          <EducationSection
            education={lebenslauf.education}
            dispatch={dispatch}
          />
        )
      case 'skills':
        return (
          <SkillsSection
            skills={lebenslauf.skills}
            dispatch={dispatch}
          />
        )
      case 'languages':
        return (
          <LanguagesSection
            languages={lebenslauf.languages}
            dispatch={dispatch}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {sectionOrder.map((key, i) => {
        const label = SECTION_LABELS[key]
        if (!label) return null
        return (
          <section key={key}>
            {/* Section header with always-visible reorder buttons (D-12) */}
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 flex-1">
                {label}
              </p>
              {/* Section ↑/↓ are always visible — deliberate navigation action */}
              <button
                onClick={() => i > 0 && dispatch({ type: 'REORDER_SECTION', from: i, to: i - 1 })}
                disabled={i === 0}
                aria-label="Abschnitt nach oben"
                className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-20"
              >
                ↑
              </button>
              <button
                onClick={() => i < sectionOrder.length - 1 && dispatch({ type: 'REORDER_SECTION', from: i, to: i + 1 })}
                disabled={i === sectionOrder.length - 1}
                aria-label="Abschnitt nach unten"
                className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-20"
              >
                ↓
              </button>
            </div>

            {/* Section content */}
            {renderSection(key)}
          </section>
        )
      })}
    </div>
  )
}
