'use client'
import React, { useState } from 'react'
import { EditableField } from '@/components/EditableField'
import type { SkillCategory } from '@/lib/schema'
import type { LebenslaufAction } from '@/components/LebenslaufEditor'

/**
 * German CV language-level vocabulary (D-10).
 * These five values are the only accepted proficiency labels in a German Lebenslauf —
 * no CEFR codes, no "native", no "fluent", no free-form text.
 */
export const GERMAN_LANGUAGE_LEVELS = [
  'Muttersprache',
  'Verhandlungssicher',
  'Fließend',
  'Gute Kenntnisse',
  'Grundkenntnisse',
] as const

export type GermanLanguageLevel = (typeof GERMAN_LANGUAGE_LEVELS)[number]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SkillChipsProps {
  skills: SkillCategory[]
  dispatch: React.Dispatch<LebenslaufAction>
}

// ---------------------------------------------------------------------------
// CategoryChips — one category row with its chip chips
// ---------------------------------------------------------------------------

function CategoryChips({
  cat,
  catIndex,
  dispatch,
}: {
  cat: SkillCategory
  catIndex: number
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  // Inline "pending delete" confirm for category removal (D-09 / UI-SPEC destructive)
  // Local state only — NOT in the reducer.
  const [pendingDelete, setPendingDelete] = useState(false)

  function handleCategoryRemoveClick() {
    if (pendingDelete) {
      dispatch({ type: 'REMOVE_SKILL_CATEGORY', catIndex })
      setPendingDelete(false)
    } else {
      setPendingDelete(true)
    }
  }

  function handleCancelDelete() {
    setPendingDelete(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Category heading row */}
      <div className="flex items-center gap-2 mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex-1 mb-1">
          <EditableField
            value={cat.category}
            placeholder="+ Kategoriename"
            onSave={(v) =>
              dispatch({ type: 'UPDATE_SKILL_CATEGORY_NAME', catIndex, value: v })
            }
            className="text-xs font-semibold uppercase tracking-widest text-zinc-500"
          />
        </p>

        {/* Category remove — inline confirm, no modal, no reducer (UI-SPEC) */}
        {pendingDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Kategorie und alle Kenntnisse entfernen?</span>
            <button
              onClick={handleCategoryRemoveClick}
              aria-label="Kategorie entfernen bestätigen"
              className="text-red-600 hover:text-red-700 font-semibold px-1"
            >
              Ja
            </button>
            <button
              onClick={handleCancelDelete}
              aria-label="Abbrechen"
              className="text-zinc-400 hover:text-zinc-600 px-1"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={handleCategoryRemoveClick}
            aria-label="Kategorie entfernen"
            className="text-zinc-400 hover:text-zinc-700 text-xs px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>

      {/* Chips for this category */}
      <div className="flex flex-wrap gap-2">
        {cat.skills.map((skill, skillIndex) => (
          <div
            key={skillIndex}
            className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <EditableField
              value={skill}
              placeholder="+ Kenntnis"
              onSave={(v) =>
                dispatch({ type: 'UPDATE_SKILL', catIndex, skillIndex, value: v })
              }
              className="text-sm font-normal"
            />
            <button
              onClick={() => dispatch({ type: 'REMOVE_SKILL', catIndex, skillIndex })}
              aria-label="Kenntnis entfernen"
              className="text-zinc-400 hover:text-zinc-700 text-xs ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add chip within category */}
        <button
          onClick={() => dispatch({ type: 'ADD_SKILL', catIndex })}
          className="text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer"
        >
          + Kenntnis hinzufügen
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SkillChips — full Kenntnisse section
// ---------------------------------------------------------------------------

export function SkillChips({ skills, dispatch }: SkillChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      {skills.map((cat, catIndex) => (
        <CategoryChips
          key={catIndex}
          cat={cat}
          catIndex={catIndex}
          dispatch={dispatch}
        />
      ))}

      {/* Add a new category */}
      <button
        onClick={() => dispatch({ type: 'ADD_SKILL_CATEGORY' })}
        className="self-start text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer mt-2"
      >
        + Kategorie hinzufügen
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LanguageLevelSelect — German-convention level picker (D-10)
// Used in LebenslaufEditor's Sprachen section.
// ---------------------------------------------------------------------------

interface LanguageLevelSelectProps {
  value: string | null
  onChange: (level: string) => void
}

export function LanguageLevelSelect({ value, onChange }: LanguageLevelSelectProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sprachniveau"
      className="border-0 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
    >
      <option value="">— Niveau wählen —</option>
      {GERMAN_LANGUAGE_LEVELS.map((level) => (
        <option key={level} value={level}>
          {level}
        </option>
      ))}
    </select>
  )
}
