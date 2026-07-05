'use client'
import React, { useRef, useState } from 'react'
import { EditableField } from '@/components/EditableField'
import { SkillChips, LanguageLevelSelect } from '@/components/SkillChips'
import { softFormatDate } from '@/lib/lebenslauf-utils'
import type { WithUid, UidBullet, UidSkillCategory } from '@/lib/lebenslauf-utils'
import type { Lebenslauf } from '@/lib/schema'
import { EYEBROW } from '@/components/ui'
import { useLang } from '@/lib/i18n'

/**
 * Stable-id-augmented entry types. `_uid` is assigned once per entry (on parse
 * or ADD action) in page.tsx's reducer and used as the React list key here
 * instead of the array index – index keys break when a reorder or remove
 * shifts positions, because EditableField's internal edit-draft state stays
 * attached to the DOM node at that position rather than following the entry.
 *
 * Bullets and skills/skill-categories carry the same `_uid` (see
 * lebenslauf-utils.ts's WithUid/UidBullet/UidSkillCategory) since they suffer
 * the identical failure mode on REMOVE_BULLET / REMOVE_SKILL(_CATEGORY).
 */
type ExperienceEntry = WithUid<Omit<Lebenslauf['experience'][number], 'bullets'>> & { bullets: UidBullet[] }
type EducationEntry = WithUid<Lebenslauf['education'][number]>
type LanguageEntry = WithUid<Lebenslauf['languages'][number]>

/**
 * LebenslaufAction union – all edit/add/remove/reorder actions for the WYSIWYG
 * Lebenslauf editor. Imported by page.tsx and extended by Plan 04 for skill chips.
 *
 * XSS: all values flow through controlled inputs; no HTML injection.
 */
export type LebenslaufAction =
  // Personal data
  | { type: 'UPDATE_PERSONAL'; field: keyof Lebenslauf['personal']; value: string }
  // Kurzprofil (professional summary)
  | { type: 'UPDATE_PROFIL'; value: string }
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
  // Skills (categorized – D-09)
  | { type: 'UPDATE_SKILL'; catIndex: number; skillIndex: number; value: string }
  | { type: 'ADD_SKILL'; catIndex: number }
  | { type: 'REMOVE_SKILL'; catIndex: number; skillIndex: number }
  | { type: 'ADD_SKILL_CATEGORY' }
  | { type: 'REMOVE_SKILL_CATEGORY'; catIndex: number }
  | { type: 'UPDATE_SKILL_CATEGORY_NAME'; catIndex: number; value: string }
  // Languages
  | { type: 'UPDATE_LANGUAGE'; index: number; field: 'language' | 'level'; value: string }
  | { type: 'ADD_LANGUAGE' }
  | { type: 'REMOVE_LANGUAGE'; index: number }
  // Section order
  | { type: 'REORDER_SECTION'; from: number; to: number }
  // Photo (client-side-only, display-only – never sent to any API, see PersonalSection)
  | { type: 'SET_PHOTO'; url: string }
  | { type: 'REMOVE_PHOTO' }
  | { type: 'SET_PHOTO_TRANSFORM'; transform: PhotoTransform }

/**
 * Pure array reorder helper – no mutation, no external library.
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
  lebenslauf: Omit<Lebenslauf, 'experience' | 'education' | 'languages' | 'skills'> & {
    experience: ExperienceEntry[]
    education: EducationEntry[]
    languages: LanguageEntry[]
    skills: UidSkillCategory[]
  }
  sectionOrder: string[]
  dispatch: React.Dispatch<LebenslaufAction>
  /** Model-produced photo guidance (bilingual, verbatim per language). Rendered near
   * the personal-data block. Optional – when missing the callout is omitted. */
  photoAdvice?: { en: string; de: string } | null
  /** Client-side-only object URL for the uploaded photo (see page.tsx SET_PHOTO /
   * REMOVE_PHOTO). Display-only – never serialized by toPlainText or sent to any API. */
  photoUrl: string | null
  /** Display crop (pan/zoom) applied inside the photo frame – see PhotoTransform. */
  photoTransform: PhotoTransform
}

// ---------------------------------------------------------------------------
// Section heading labels (German DIN) – always German, regardless of UI language:
// these are the fixed document-section labels, not UI chrome (see src/lib/i18n.tsx).
// ---------------------------------------------------------------------------
const SECTION_LABELS: Record<string, string> = {
  personal: 'Persönliche Daten',
  profil: 'Kurzprofil',
  experience: 'Berufserfahrung',
  education: 'Bildung',
  skills: 'Kenntnisse',
  languages: 'Sprachen',
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 MB
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'

// ---------------------------------------------------------------------------
// Photo crop – CSS-transform pan/zoom inside the fixed 3:4 frame. Display-only,
// like the photo itself; the numbers become the canvas crop when PDF export ships.
// ---------------------------------------------------------------------------

/** x/y are translate percentages of the frame box; zoom is 1..PHOTO_MAX_ZOOM. */
export type PhotoTransform = { zoom: number; x: number; y: number }
export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = { zoom: 1, x: 0, y: 0 }
const PHOTO_MAX_ZOOM = 3

/**
 * Clamps zoom and pan. On-screen displacement is x% * zoom (translate composes
 * inside the scale), and the coverage headroom of a zoomed cover-fit image is
 * (zoom - 1) * 50% per side, so |x| <= 50 * (zoom - 1) / zoom keeps the frame
 * covered.
 * ponytail: at zoom 1 the source's own object-cover overflow (non-3:4 images)
 * is not pannable; read naturalWidth/Height for exact per-axis bounds if that
 * ever matters. Zooming slightly unlocks panning.
 */
function clampPhotoTransform(tr: PhotoTransform): PhotoTransform {
  const zoom = Math.min(Math.max(tr.zoom, 1), PHOTO_MAX_ZOOM)
  const limit = (50 * (zoom - 1)) / zoom
  return {
    zoom,
    x: Math.min(Math.max(tr.x, -limit), limit),
    y: Math.min(Math.max(tr.y, -limit), limit),
  }
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function PersonalSection({
  personal,
  dispatch,
  photoAdvice,
  photoUrl,
  photoTransform,
}: {
  personal: Lebenslauf['personal']
  dispatch: React.Dispatch<LebenslaufAction>
  photoAdvice?: { en: string; de: string } | null
  photoUrl: string | null
  photoTransform: PhotoTransform
}) {
  const { lang, t } = useLang()
  // Optional fields (Nationalität/Geburtsdatum) start collapsed unless already filled:
  // so a returning/edited CV with real values doesn't hide them, but a fresh parse
  // doesn't interrupt name→experience with two "+ add" rows (churn-risk fix).
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(personal.nationality || personal.dateOfBirth)
  )
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  // Live drag state – ref, not state: pointermove dispatches the clamped transform
  // to the reducer; nothing here needs a re-render of its own.
  const dragRef = useRef<{ startX: number; startY: number; base: PhotoTransform } | null>(null)

  function handlePhotoFile(file: File) {
    setPhotoError(null)
    if (!PHOTO_ACCEPT.split(',').includes(file.type)) {
      setPhotoError(t.photoBadType)
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t.photoTooLarge)
      return
    }
    const url = URL.createObjectURL(file)
    dispatch({ type: 'SET_PHOTO', url })
  }

  function setTransform(tr: PhotoTransform) {
    dispatch({ type: 'SET_PHOTO_TRANSFORM', transform: clampPhotoTransform(tr) })
  }

  const isCropped =
    photoTransform.zoom !== 1 || photoTransform.x !== 0 || photoTransform.y !== 0

  return (
    <div className="flex flex-col gap-2">
      {/* Fields left, photo frame right – the photo is display-only and never leaves
          the browser (client-side object URL only; see page.tsx SET_PHOTO/REMOVE_PHOTO
          and the toPlainText / cover-letter payload, neither of which reference it). */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-semibold text-ink">
            <EditableField
              value={personal.fullName}
              placeholder={t.placeholderFullName}
              onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'fullName', value: v })}
              className="text-2xl font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted mt-2">
            <EditableField
              value={personal.address}
              placeholder={t.placeholderAddress}
              onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'address', value: v })}
            />
            <EditableField
              value={personal.phone}
              placeholder={t.placeholderPhone}
              onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'phone', value: v })}
            />
            <EditableField
              value={personal.email}
              placeholder={t.placeholderEmail}
              onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'email', value: v })}
            />
            {showOptionalFields && (
              <>
                <EditableField
                  value={personal.nationality}
                  placeholder={t.placeholderNationality}
                  onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'nationality', value: v })}
                />
                <EditableField
                  value={personal.dateOfBirth}
                  placeholder={t.placeholderDateOfBirth}
                  onSave={(v) => dispatch({ type: 'UPDATE_PERSONAL', field: 'dateOfBirth', value: v })}
                  onBlurFormat={softFormatDate}
                />
              </>
            )}
          </div>

          {/* Single subtle disclosure instead of two standalone "+ add" rows sitting between
              name and experience – collapses the meta-affordance into one line (churn-risk fix). */}
          {!showOptionalFields && (
            <button
              type="button"
              onClick={() => setShowOptionalFields(true)}
              className="self-start text-sm text-muted hover:text-ink cursor-pointer mt-1"
            >
              {t.addOptionalFields}
            </button>
          )}
        </div>

        {/* Photo frame – 3:4 portrait. Client-side only: hidden file input + object URL. */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <input
            ref={photoInputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handlePhotoFile(f)
              e.target.value = '' // same file re-selectable
            }}
          />
          {photoUrl ? (
            <>
              {/* Crop frame: drag to reposition (pointer capture), arrow keys when
                  focused, zoom via the slider below. The img is pointer-inert; the
                  frame owns all interaction. touch-none stops page scroll mid-drag. */}
              <div
                role="img"
                aria-label={t.photoFrameAria}
                tabIndex={0}
                onPointerDown={(e) => {
                  try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* capture is best-effort */ }
                  dragRef.current = { startX: e.clientX, startY: e.clientY, base: photoTransform }
                }}
                onPointerMove={(e) => {
                  const drag = dragRef.current
                  if (!drag) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  // px → frame-%; on-screen displacement composes inside the scale,
                  // so divide the delta back out by zoom.
                  const dx = (((e.clientX - drag.startX) / rect.width) * 100) / drag.base.zoom
                  const dy = (((e.clientY - drag.startY) / rect.height) * 100) / drag.base.zoom
                  setTransform({ ...drag.base, x: drag.base.x + dx, y: drag.base.y + dy })
                }}
                onPointerUp={() => { dragRef.current = null }}
                onPointerCancel={() => { dragRef.current = null }}
                onKeyDown={(e) => {
                  const step = 2
                  let { x, y } = photoTransform
                  if (e.key === 'ArrowLeft') x -= step
                  else if (e.key === 'ArrowRight') x += step
                  else if (e.key === 'ArrowUp') y -= step
                  else if (e.key === 'ArrowDown') y += step
                  else return
                  e.preventDefault()
                  setTransform({ ...photoTransform, x, y })
                }}
                className="group relative w-32 sm:w-40 aspect-[3/4] rounded-sm border border-hair overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL, next/image cannot optimize it and shouldn't try (zero-retention: no network round-trip for a photo that never leaves the browser) */}
                <img
                  src={photoUrl}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover pointer-events-none"
                  style={{ transform: `scale(${photoTransform.zoom}) translate(${photoTransform.x}%, ${photoTransform.y}%)` }}
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'REMOVE_PHOTO' })}
                  onPointerDown={(e) => e.stopPropagation()} // never starts a drag
                  aria-label={t.photoRemoveAria}
                  className="absolute top-0.5 right-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-sm leading-none">×</span>
                </button>
              </div>
              <input
                type="range"
                min={1}
                max={PHOTO_MAX_ZOOM}
                step={0.05}
                value={photoTransform.zoom}
                onChange={(e) => setTransform({ ...photoTransform, zoom: Number(e.target.value) })}
                aria-label={t.photoZoomAria}
                className="w-32 sm:w-40 accent-accent"
              />
              <p className="text-xs text-muted text-center max-w-32 sm:max-w-40">{t.photoDragHint}</p>
              {isCropped && (
                <button
                  type="button"
                  onClick={() => setTransform(DEFAULT_PHOTO_TRANSFORM)}
                  className="text-xs text-muted hover:text-ink underline underline-offset-2"
                >
                  {t.photoReset}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-32 sm:w-40 aspect-[3/4] rounded-sm border border-dashed border-hair flex flex-col items-center justify-center gap-0.5 text-muted hover:text-ink hover:border-ink/30 transition-colors"
            >
              <span className="text-sm">{t.photoAddLabel}</span>
              <span className="text-xs italic">{t.photoOptionalSub}</span>
            </button>
          )}
          {!photoUrl && (
            <p className="text-xs text-muted text-center max-w-32 sm:max-w-40">{t.photoStaysLocal}</p>
          )}
        </div>
      </div>
      {photoError && <p className="text-sm text-red-600">{photoError}</p>}

      {/* Optional photo callout (D-06 / LL-03) – quieter single-line summary with the
          full advice behind a disclosure, placed at the END of the personal block so it
          reads as an edge note rather than interrupting name→experience flow. Rendered
          verbatim from model output (per active UI language). Framed as legally optional
          under the AGG; user's choice; never mandated. The tool does NOT accept, upload,
          or process photos server-side (zero-retention / T-01-11) – the frame above is
          entirely client-side. */}
      {photoAdvice && (
        <details className="mt-4 group">
          <summary className={`${EYEBROW} cursor-pointer select-none list-none`}>
            {t.photoDetailsSummary}
          </summary>
          {/* photoAdvice is model-produced text – rendered as a text node, never injected as HTML */}
          <p className="mt-1 text-sm text-muted">{photoAdvice[lang]}</p>
        </details>
      )}
    </div>
  )
}

/**
 * Kurzprofil – the German professional summary (2-4 lines under the personal
 * block). Parse fills it ONLY from a summary present in the source CV; the
 * placeholder lets the user add one manually when the source had none.
 */
function ProfilSection({
  profil,
  dispatch,
}: {
  profil: string | null
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  const { t } = useLang()
  return (
    <div className="text-sm text-ink leading-relaxed">
      <EditableField
        value={profil}
        placeholder={t.placeholderProfil}
        multiline
        onSave={(v) => dispatch({ type: 'UPDATE_PROFIL', value: v })}
        className="text-sm"
      />
    </div>
  )
}

function ExperienceSection({
  experience,
  dispatch,
}: {
  experience: ExperienceEntry[]
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4">
      {experience.map((exp, i) => (
        <div key={exp._uid} className="group relative rounded-lg border border-hair bg-card p-4">
          {/* Reveal on hover AND focus-within (never display:none) so keyboard users
              tabbing into the entry can still reach + use these controls. */}
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute right-2 top-2 flex items-center gap-1">
            <button
              onClick={() => i > 0 && dispatch({ type: 'REORDER_EXPERIENCE', from: i, to: i - 1 })}
              disabled={i === 0}
              aria-label={t.removeEntryUp}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-ink text-sm px-2 py-1 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => i < experience.length - 1 && dispatch({ type: 'REORDER_EXPERIENCE', from: i, to: i + 1 })}
              disabled={i === experience.length - 1}
              aria-label={t.removeEntryDown}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-ink text-sm px-2 py-1 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_EXPERIENCE', index: i })}
              aria-label={t.removeEntryAria}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-600 text-sm px-2 py-1"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Role */}
            <div className="font-semibold text-ink">
              <EditableField
                value={exp.role}
                placeholder={t.placeholderRole}
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'role', value: v })}
                className="font-semibold"
              />
            </div>
            {/* Company + location */}
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <EditableField
                value={exp.company}
                placeholder={t.placeholderCompany}
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'company', value: v })}
              />
              <EditableField
                value={exp.location}
                placeholder={t.placeholderLocation}
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'location', value: v })}
              />
            </div>
            {/* Dates */}
            <div className="flex gap-2 text-sm text-muted tabular-nums">
              <EditableField
                value={exp.start}
                placeholder={t.placeholderDate}
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'start', value: v })}
                onBlurFormat={softFormatDate}
              />
              <span className="text-muted">–</span>
              <EditableField
                value={exp.end}
                placeholder={t.placeholderDate}
                onSave={(v) => dispatch({ type: 'UPDATE_EXPERIENCE', index: i, field: 'end', value: v })}
                onBlurFormat={softFormatDate}
              />
            </div>
            {/* Bullets */}
            <div className="flex flex-col gap-1 mt-1">
              {exp.bullets.map((bullet, bi) => (
                <div key={bullet._uid} className="group/bullet flex items-start gap-1">
                  <span className="text-muted mt-0.5 text-sm select-none">–</span>
                  <div className="flex-1">
                    <EditableField
                      value={bullet.text}
                      placeholder={t.addBullet}
                      multiline
                      onSave={(v) => dispatch({ type: 'UPDATE_BULLET', expIndex: i, bulletIndex: bi, value: v })}
                      className="text-sm"
                    />
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_BULLET', expIndex: i, bulletIndex: bi })}
                    aria-label={t.removeEntryAria}
                    className="opacity-0 group-hover/bullet:opacity-100 focus-within:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-600 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => dispatch({ type: 'ADD_BULLET', expIndex: i })}
                className="self-start text-sm text-muted hover:text-ink cursor-pointer mt-1"
              >
                {t.addBullet}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add experience entry */}
      <button
        onClick={() => dispatch({ type: 'ADD_EXPERIENCE' })}
        className="self-start text-sm text-muted hover:text-ink cursor-pointer"
      >
        {t.addExperience}
      </button>
    </div>
  )
}

function EducationSection({
  education,
  dispatch,
}: {
  education: EducationEntry[]
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4">
      {education.map((edu, i) => (
        <div key={edu._uid} className="group relative rounded-lg border border-hair bg-card p-4">
          {/* Reveal on hover AND focus-within (never display:none) so keyboard users
              tabbing into the entry can still reach + use these controls. */}
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute right-2 top-2 flex items-center gap-1">
            <button
              onClick={() => i > 0 && dispatch({ type: 'REORDER_EDUCATION', from: i, to: i - 1 })}
              disabled={i === 0}
              aria-label={t.removeEntryUp}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-ink text-sm px-2 py-1 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => i < education.length - 1 && dispatch({ type: 'REORDER_EDUCATION', from: i, to: i + 1 })}
              disabled={i === education.length - 1}
              aria-label={t.removeEntryDown}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-ink text-sm px-2 py-1 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_EDUCATION', index: i })}
              aria-label={t.removeEntryAria}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-600 text-sm px-2 py-1"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold text-ink">
              <EditableField
                value={edu.qualification}
                placeholder={t.placeholderQualification}
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'qualification', value: v })}
                className="font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <EditableField
                value={edu.institution}
                placeholder={t.placeholderInstitution}
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'institution', value: v })}
              />
              <EditableField
                value={edu.location}
                placeholder={t.placeholderLocation}
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'location', value: v })}
              />
            </div>
            <div className="flex gap-2 text-sm text-muted tabular-nums">
              <EditableField
                value={edu.start}
                placeholder={t.placeholderDate}
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'start', value: v })}
                onBlurFormat={softFormatDate}
              />
              <span className="text-muted">–</span>
              <EditableField
                value={edu.end}
                placeholder={t.placeholderDate}
                onSave={(v) => dispatch({ type: 'UPDATE_EDUCATION', index: i, field: 'end', value: v })}
                onBlurFormat={softFormatDate}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => dispatch({ type: 'ADD_EDUCATION' })}
        className="self-start text-sm text-muted hover:text-ink cursor-pointer"
      >
        {t.addEducation}
      </button>
    </div>
  )
}

function SkillsSection({
  skills,
  dispatch,
}: {
  skills: UidSkillCategory[]
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  return (
    <SkillChips skills={skills} dispatch={dispatch} />
  )
}

function LanguagesSection({
  languages,
  dispatch,
}: {
  languages: LanguageEntry[]
  dispatch: React.Dispatch<LebenslaufAction>
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-2">
      {languages.map((lang, i) => (
        <div key={lang._uid} className="group flex items-center gap-2">
          {/* Language name – free-text editable */}
          <EditableField
            value={lang.language}
            placeholder={t.placeholderLanguageName}
            onSave={(v) => dispatch({ type: 'UPDATE_LANGUAGE', index: i, field: 'language', value: v })}
            className="text-sm"
          />
          <span className="text-muted text-sm">:</span>
          {/* Language level – German-convention dropdown (D-10) */}
          <LanguageLevelSelect
            value={lang.level}
            onChange={(level) =>
              dispatch({ type: 'UPDATE_LANGUAGE', index: i, field: 'level', value: level })
            }
          />
          <button
            onClick={() => dispatch({ type: 'REMOVE_LANGUAGE', index: i })}
            aria-label={t.removeEntryAria}
            className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-red-600 text-xs px-1"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => dispatch({ type: 'ADD_LANGUAGE' })}
        className="self-start text-sm text-muted hover:text-ink cursor-pointer"
      >
        {t.addLanguage}
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
  photoAdvice,
  photoUrl,
  photoTransform,
}: LebenslaufEditorProps) {
  const { t } = useLang()
  const renderSection = (key: string) => {
    switch (key) {
      case 'personal':
        return (
          <PersonalSection
            personal={lebenslauf.personal}
            dispatch={dispatch}
            photoAdvice={photoAdvice}
            photoUrl={photoUrl}
            photoTransform={photoTransform}
          />
        )
      case 'profil':
        return (
          <ProfilSection
            profil={lebenslauf.profil}
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
    <div className="doc-sheet px-8 py-10 sm:px-12 sm:py-14" lang="de">
      <div className="flex flex-col gap-6 font-serif-text">
        {sectionOrder.map((key, i) => {
          const label = SECTION_LABELS[key]
          if (!label) return null
          return (
            <section key={key} className="reveal-stagger" style={{ '--i': i } as React.CSSProperties}>
              {/* Section header with always-visible reorder buttons (D-12) */}
              <div className="flex items-center gap-2 mb-2">
                <p className={`${EYEBROW} flex-1`}>
                  {label}
                </p>
                {/* Section ↑/↓ are always visible – deliberate navigation action */}
                <button
                  onClick={() => i > 0 && dispatch({ type: 'REORDER_SECTION', from: i, to: i - 1 })}
                  disabled={i === 0}
                  aria-label={t.sectionUpAria}
                  className="text-xs text-muted hover:text-ink px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-20"
                >
                  ↑
                </button>
                <button
                  onClick={() => i < sectionOrder.length - 1 && dispatch({ type: 'REORDER_SECTION', from: i, to: i + 1 })}
                  disabled={i === sectionOrder.length - 1}
                  aria-label={t.sectionDownAria}
                  className="text-xs text-muted hover:text-ink px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-20"
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
    </div>
  )
}
