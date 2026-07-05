'use client'
import React from 'react'
import { useLang } from '@/lib/i18n'

/**
 * NormGapPanel – collapsible "what changed & why" notes from the parse response.
 *
 * Renders normGapNotes[] inside a native <details>/<summary> collapsible (D-05 / LL-02).
 * Panel open/closed state is managed by the browser's native <details> element,
 * no local useState, not stored in the reducer.
 *
 * Rendered as its own full-width card-like strip ABOVE the LebenslaufEditor document
 * (result-view layout change) rather than as a side column or a bottom border-t block.
 *
 * Each note is bilingual ({en, de}); this component renders note[lang] per the active
 * UI language from useLang(), so the panel always matches the surrounding chrome.
 *
 * XSS guard: normGapNotes are model-produced strings rendered as text nodes only.
 * dangerouslySetInnerHTML is PROHIBITED per T-01-10.
 */

interface NormGapPanelProps {
  normGapNotes: { en: string; de: string }[]
}

export function NormGapPanel({ normGapNotes }: NormGapPanelProps) {
  const { lang, t } = useLang()
  if (normGapNotes.length === 0) return null

  return (
    <div className="rounded-lg border border-hair bg-card px-5 py-4">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-muted hover:text-ink list-none flex items-center justify-between">
          <span>{t.normGapSummary(normGapNotes.length)}</span>
          {/* Visual expand/collapse indicator – inline SVG, no icon library */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 flex-shrink-0 text-muted"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </summary>

        {/* Notes list – each note as a text node (no HTML injection) */}
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {normGapNotes.map((note, i) => (
            <li key={i} className="reveal-stagger" style={{ '--i': i } as React.CSSProperties}>
              {note[lang]}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
