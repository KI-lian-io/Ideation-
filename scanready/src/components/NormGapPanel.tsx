'use client'
import React from 'react'

/**
 * NormGapPanel — collapsible "what changed & why" notes from the parse response.
 *
 * Renders normGapNotes[] inside a native <details>/<summary> collapsible (D-05 / LL-02).
 * Panel open/closed state is managed by the browser's native <details> element —
 * no local useState, not stored in the reducer.
 *
 * Placed BELOW LebenslaufEditor in page.tsx so the CV stays the hero (D-05).
 *
 * XSS guard: normGapNotes are model-produced strings rendered as text nodes only.
 * dangerouslySetInnerHTML is PROHIBITED per T-01-10.
 */

interface NormGapPanelProps {
  normGapNotes: string[]
}

export function NormGapPanel({ normGapNotes }: NormGapPanelProps) {
  if (normGapNotes.length === 0) return null

  return (
    <div className="mt-8 border-t border-zinc-100 pt-6">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-zinc-600 hover:text-zinc-900 list-none flex items-center justify-between">
          <span>Was hat sich geändert &amp; warum? ({normGapNotes.length} Hinweise)</span>
          {/* Visual expand/collapse indicator — inline SVG, no icon library */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 flex-shrink-0 text-zinc-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </summary>

        {/* Notes list — each note as a text node (no HTML injection) */}
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          {normGapNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
