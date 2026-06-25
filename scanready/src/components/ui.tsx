import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * AreaButler UI primitives — single source of truth for the design-system class strings.
 * Pure (no hooks) → valid in both Server and Client Components.
 *
 * btnClass — the button class string (the single source). Use directly on a plain
 *            <button> when you don't need polymorphism (most of the tool).
 * Btn   — polymorphic button/link built on btnClass. Discriminated `as` union keeps
 *         href/onClick from crossing. Use for the landing <a> CTAs.
 * CARD    — class const for the card surface (few sites, all bespoke padding).
 * EYEBROW — class const for the mono taupe label. A const, not a component: a one-line
 *           label as a component would be a shallow module. // ponytail
 */

type Variant = 'primary' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

const BASE =
  'inline-block rounded-lg text-sm font-semibold transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90',
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

export const CARD = 'rounded-[14px] border border-hair bg-card'
export const EYEBROW = 'font-mono text-xs uppercase tracking-[0.18em] text-eyebrow'
