'use client'
import { useState, useRef, useEffect } from 'react'

/**
 * Click-to-edit swap-to-input field.
 *
 * Display state: a <span> that shows the value or a muted placeholder when empty.
 * Active state: a controlled <input> or <textarea> (when multiline=true).
 *
 * Commit triggers: blur and Enter (single-line); blur only (multiline).
 * Cancel trigger: Escape — reverts to original value.
 * onBlurFormat: optional post-blur formatter (date fields pass softFormatDate).
 *
 * XSS guard: values are always rendered as text nodes or controlled-input values.
 * Raw HTML injection is prohibited per T-01-08 / threat model.
 */

interface EditableFieldProps {
  value: string | null
  placeholder?: string
  multiline?: boolean
  onSave: (newValue: string) => void
  onBlurFormat?: (raw: string) => string
  className?: string
}

export function EditableField({
  value,
  placeholder,
  multiline,
  onSave,
  onBlurFormat,
  className,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  // Auto-focus the input when entering edit mode
  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  // Sync draft when value changes externally (e.g. after a dispatch round-trip)
  useEffect(() => {
    if (!editing) setDraft(value ?? '')
  }, [value, editing])

  const commit = () => {
    const formatted = onBlurFormat ? onBlurFormat(draft) : draft
    setDraft(formatted)
    onSave(formatted)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value ?? '')
    setEditing(false)
  }

  // Date fields get mono font when onBlurFormat is provided
  const isMono = Boolean(onBlurFormat)
  const monoClass = isMono ? 'font-mono' : ''

  if (editing) {
    const sharedProps = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          cancel()
        }
      },
      // Bottom-border only signals edit mode (UI-SPEC active state)
      className: `border-b border-ink outline-none bg-transparent w-full ${monoClass} ${className ?? ''}`.trim(),
    }
    return multiline ? (
      <textarea {...sharedProps} rows={3} />
    ) : (
      <input {...sharedProps} />
    )
  }

  return (
    <span
      // hover:bg-blue-50 is the only other blue usage — reserved per UI-SPEC
      className={`cursor-pointer hover:bg-faint rounded px-1 ${monoClass} ${className ?? ''}`.trim()}
      onClick={() => {
        setDraft(value ?? '')
        setEditing(true)
      }}
    >
      {value ? (
        value
      ) : (
        // Fillable blank — muted italic prompt (D-08)
        <span className="text-muted italic">{placeholder}</span>
      )}
    </span>
  )
}
