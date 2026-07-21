'use client'

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * ScanReady UI primitives: single source of truth for the design-system class strings
 * and the shared interactive shells (account library, save moment, storage gate).
 *
 * btnClass:   the button class string (the single source). Use directly on a plain
 *              <button> when you don't need polymorphism (most of the tool).
 * Btn:        polymorphic button/link built on btnClass. Discriminated `as` union keeps
 *              href/onClick from crossing. Use for the landing <a> CTAs.
 * CARD:       class const for the card surface (few sites, all bespoke padding).
 * EYEBROW:    class const for the mono taupe label. A const, not a component: a one-line
 *              label as a component would be a shallow module. // ponytail
 * SKILL_CHIP: class const for the skill pill visual shell (accent-soft fill, accent
 *              text). Same one-line-const reasoning as EYEBROW.
 * NORM_NOTE:  class const for the norm-note / annotation callout (accent-tint wash,
 *              ink-soft body). Same one-line-const reasoning as EYEBROW.
 *
 * SheetCard, KebabMenu, InlineRenameField, MonoBadge, EmptyState, BottomSheet and
 * SavedConfirmationPanel are the A0 foundation primitives for the account library,
 * save moment and storage gate surfaces (07-account-library-honest-pricing-design-
 * reconciliation-phase-a). Same const-vs-component doctrine: SheetCard is a plain
 * class string (no interactivity), MonoBadge/EmptyState/SavedConfirmationPanel are
 * function components only because they branch on props or need an aria-live region,
 * and KebabMenu/InlineRenameField/BottomSheet are function components because they
 * own focus/keyboard state. That last group is why this file now carries `'use
 * client'`: importing it into a Server Component (e.g. src/app/preise/page.tsx) still
 * works, Next.js just treats the composed pieces as a client boundary.
 *
 * StatusChip (design surface 08, phase 08-04) is the same doctrine applied to a
 * per-package status badge + dropdown: a function component because it owns its
 * own open/keyboard state, reusing KebabMenu's focusTrap and open/outside-click/
 * Escape lifecycle rather than duplicating it. It never cycles on click -- the
 * trigger only opens the menu, same as KebabMenu's own trigger.
 *
 * None of these primitives hardcode copy: every label is a prop, sourced by the
 * caller from src/lib/i18n.tsx. That keeps this file free of i18n keys.
 */

type Variant = 'primary' | 'accent' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

// Editorial-crisp 6px corners (WIRED-lean, softened off square). Green accent + focus ring. Navy primary.
const BASE =
  'inline-block rounded-md text-sm font-semibold transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90',
  accent: 'bg-accent text-white hover:bg-accent-deep',
  secondary: 'border border-hair text-muted hover:border-ink/30 hover:text-ink',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-8 py-3',
}

export function btnClass(variant: Variant = 'primary', size: Size = 'md'): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`
}

type BtnBase = { variant?: Variant; size?: Size; className?: string; children: ReactNode }
type BtnAsButton = BtnBase & { as?: 'button' } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children'
>
type BtnAsLink = BtnBase & { as: 'a' } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'className' | 'children'
>
export type BtnProps = BtnAsButton | BtnAsLink

export function Btn(props: BtnProps) {
  const { variant = 'primary', size = 'md', className = '', children } = props
  const cls = `${btnClass(variant, size)} ${className}`.trim()
  if (props.as === 'a') {
    const { variant: _v, size: _s, className: _c, children: _ch, as: _a, ...rest } = props
    return (
      <a className={cls} {...rest}>
        {children}
      </a>
    )
  }
  const { variant: _v, size: _s, className: _c, children: _ch, as: _a, ...rest } = props
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

export const CARD = 'rounded-xl border border-hair bg-card'
export const EYEBROW = 'font-mono text-xs uppercase tracking-[0.18em] text-eyebrow'

// The full-pill skill chip (accent-soft fill, accent text): the one place pills survive.
export const SKILL_CHIP = 'rounded-full bg-accent-soft px-3 py-1 text-sm text-accent'

// The norm-note / annotation callout (accent-tint wash, ink-soft body, 8px corner).
export const NORM_NOTE = 'rounded-md border border-hair bg-accent-tint px-4 py-3 text-ink-soft'

// The doc-sheet card shell used by library cards: sheet shadow, hairline border,
// 12px corner, card surface. A const (no interactivity), same reasoning as CARD.
export const SheetCard = 'rounded-xl border border-hair bg-card shadow-sheet'

// ---------------------------------------------------------------------------
// Small inline glyphs, private to this file. Kept out of the exported surface
// on purpose: callers pass labels, not icons, into the primitives below.
// ---------------------------------------------------------------------------

function KebabGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// MonoBadge: LL / AS / STELLENANZEIGE present-variant, dashed ghost "fehlt"
// variant (never red, absence is not an error), and two pill variants for
// the read-only/editable state of a saved package (BEARBEITBAR, NUR LESEN).
// ---------------------------------------------------------------------------

export type MonoBadgeVariant = 'present' | 'ghost' | 'editable' | 'readonly'

export function MonoBadge({
  variant = 'present',
  children,
}: {
  variant?: MonoBadgeVariant
  children: ReactNode
}) {
  if (variant === 'ghost') {
    return (
      <span className="inline-flex items-center rounded border border-dashed border-hair px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
        {children}
      </span>
    )
  }
  if (variant === 'editable') {
    return (
      <span className="inline-flex items-center rounded-full bg-accent-tint px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-accent-deep">
        {children}
      </span>
    )
  }
  if (variant === 'readonly') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-hair bg-card px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate">
        <LockGlyph />
        {children}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded bg-faint px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// EmptyState: dashed shelf for the account library's first-run state. The mono
// status line is also the aria-live announcement, per the design's own note
// ("the mono status line doubles as the aria-live announcement").
// ---------------------------------------------------------------------------

export function EmptyState({
  status,
  body,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: {
  status: string
  body: string
  ctaLabel: string
  ctaHref?: string
  onCtaClick?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-hair px-8 py-14 text-center">
      <p role="status" aria-live="polite" className={EYEBROW}>
        {status}
      </p>
      <p className="max-w-md text-sm text-muted">{body}</p>
      {ctaHref ? (
        <Btn as="a" href={ctaHref} variant="accent">
          {ctaLabel}
        </Btn>
      ) : (
        <Btn variant="accent" onClick={onCtaClick}>
          {ctaLabel}
        </Btn>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SavedConfirmationPanel: accent-tint panel replacing the save card in place
// once a package has been saved.
// ---------------------------------------------------------------------------

export function SavedConfirmationPanel({
  timestamp,
  titleSlot,
  libraryHref,
  libraryLabel,
}: {
  timestamp: string
  titleSlot: ReactNode
  libraryHref: string
  libraryLabel: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hair bg-accent-tint px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white" aria-hidden="true">
          <CheckGlyph />
        </span>
        <span className={EYEBROW}>{timestamp}</span>
      </div>
      {titleSlot}
      <Btn as="a" href={libraryHref} variant="secondary" className="self-start">
        {libraryLabel}
      </Btn>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InlineRenameField: serif input for renaming a saved package card in place.
// Enter commits, Escape cancels. Value stays controlled by the caller.
// ---------------------------------------------------------------------------

export function InlineRenameField({
  value,
  onChange,
  onSave,
  onCancel,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  onSave: (value: string) => void
  onCancel: () => void
  ariaLabel: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSave(value)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      className="w-full rounded-md border border-accent bg-card px-2.5 py-1.5 font-serif-text text-base text-ink shadow-[0_0_0_2px_rgba(10,125,99,0.18)] outline-none"
    />
  )
}

// ---------------------------------------------------------------------------
// KebabMenu + BottomSheet share one item shape: a shared action list rendered
// either as a floating menu (desktop) or a bottom sheet (touch). Both copy the
// Escape/outside-click/Tab focus-trap approach from PaketModal.tsx, scoped to
// their own container ref instead of a dialog ref.
// ---------------------------------------------------------------------------

export type KebabMenuItem = {
  label: string
  onSelect: () => void
  /** Marks the item as destructive: separated by a hairline, terracotta text. */
  destructive?: boolean
}

function focusTrap(containerRef: React.RefObject<HTMLElement | null>, onEscape: () => void) {
  return function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onEscape()
      return
    }
    if (e.key !== 'Tab') return
    const container = containerRef.current
    if (!container) return
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null)
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
  }
}

export function KebabMenu({ items, ariaLabel }: { items: KebabMenuItem[]; ariaLabel: string }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Outside-click closes the menu.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Escape closes + Tab is trapped inside the open menu, same pattern as
  // PaketModal.tsx's dialog trap, scoped to this menu's own container.
  useEffect(() => {
    if (!open) return
    const onKeyDown = focusTrap(containerRef, close)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Focus the first menu item on open, mirroring PaketModal's focus-management effect.
  useEffect(() => {
    if (!open) return
    const first = containerRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    first?.focus()
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-faint focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <KebabGlyph />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-hair bg-card p-1.5 shadow-modal">
          {items.map((item, i) => (
            <div key={item.label}>
              {item.destructive && i > 0 && <div className="mx-1 my-1.5 h-px bg-hair" aria-hidden="true" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close()
                  item.onSelect()
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${item.destructive ? 'text-brand-error' : 'text-ink hover:bg-faint'}`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatusChip: the five-state application-status chip + dropdown (design
// surface 08). Reuses focusTrap and the exact open/outside-click/Escape
// lifecycle from KebabMenu above -- the only new mechanics are the trigger's
// two visual states (a set-status pill vs. the null "set status" ghost) and
// the menu rendering a check on the current value instead of a plain action
// list. Never cycles on click: the trigger only toggles `open`, exactly like
// KebabMenu's own trigger opens a menu rather than doing anything itself.
// Copy-free like every primitive in this file -- labels are props, sourced
// by the caller from src/lib/i18n.tsx; only the five dot colors are
// hardcoded here, keyed by the domain status value (not copy).
// ---------------------------------------------------------------------------

export type StatusChipOption = { value: string; label: string }

const STATUS_DOT_CLASS: Record<string, string> = {
  entwurf: 'bg-stone',
  beworben: 'bg-ink',
  interview: 'bg-brand-tag',
  absage: 'bg-brand-error',
  zusage: 'bg-accent',
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={open ? 'rotate-180' : ''}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function StatusChip({
  status,
  options,
  setLabel,
  ariaLabel,
  onSelect,
}: {
  /** The current status value (a domain key, e.g. 'entwurf'), or null when unset. */
  status: string | null
  /** The five states in pipeline order; value is the domain key, label is the
   * caller-supplied i18n string. */
  options: StatusChipOption[]
  /** The null-status affordance label ("Status setzen" / "Set status"). */
  setLabel: string
  ariaLabel: string
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Outside-click closes the menu -- identical to KebabMenu's own effect.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Escape closes + Tab is trapped inside the open menu, reusing the same
  // focusTrap helper KebabMenu already uses (no duplicated trap logic).
  useEffect(() => {
    if (!open) return
    const onKeyDown = focusTrap(containerRef, close)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Focus the current selection (or the first option) on open, mirroring
  // KebabMenu's own focus-on-open effect.
  useEffect(() => {
    if (!open) return
    const current = containerRef.current?.querySelector<HTMLElement>(
      '[role="menuitemradio"][aria-checked="true"]'
    )
    const first = containerRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]')
    ;(current ?? first)?.focus()
  }, [open])

  const current = options.find((o) => o.value === status) ?? null

  const triggerClass = current
    ? current.value === 'zusage'
      ? 'inline-flex items-center gap-1.5 rounded-full border border-hair bg-accent-tint px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep'
      : 'inline-flex items-center gap-1.5 rounded-full border border-hair bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted'
    : 'inline-flex items-center gap-1.5 rounded-full border border-dashed border-hair px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted'

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        {current && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[current.value] ?? 'bg-stone'}`}
            aria-hidden="true"
          />
        )}
        {current ? current.label : setLabel}
        {current && <ChevronGlyph open={open} />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-hair bg-card p-1.5 shadow-modal">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === status}
              onClick={() => {
                close()
                onSelect(option.value)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink hover:bg-faint"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[option.value] ?? 'bg-stone'}`}
                aria-hidden="true"
              />
              {option.label}
              {option.value === status && (
                <span className="ml-auto text-accent-deep" aria-hidden="true">
                  <CheckGlyph />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// BottomSheet: the mobile replacement for KebabMenu. Rendered by the caller
// when a kebab trigger is tapped on touch; the caller owns the open/closed
// state (this component has none, it is either mounted or not).
export function BottomSheet({
  items,
  onClose,
  title,
}: {
  items: KebabMenuItem[]
  onClose: () => void
  title?: string
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sheetRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = focusTrap(sheetRef, onClose)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/40"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={sheetRef} className="w-full rounded-t-xl border border-hair bg-card p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-modal">
        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-hair" aria-hidden="true" />
        {title && <p className="px-3 pb-2 pt-1 font-serif text-base font-semibold text-ink">{title}</p>}
        {items.map((item, i) => (
          <div key={item.label}>
            {item.destructive && i > 0 && <div className="mx-2 my-1.5 h-px bg-hair" aria-hidden="true" />}
            <button
              type="button"
              onClick={() => {
                onClose()
                item.onSelect()
              }}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 text-left text-base ${item.destructive ? 'text-brand-error' : 'text-ink hover:bg-faint'}`}
            >
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
