'use client'

/**
 * Bewerbungsphase-Pass lifecycle indicator: read-only, no Stripe dependency.
 *
 * Deliberately its OWN file, not co-located inside PassModal.tsx even though
 * the plan groups them together: PassModal.tsx statically imports
 * @stripe/stripe-js and calls loadStripe() at module scope, exactly like
 * PaketModal.tsx and HumanizerModal.tsx - those modules are only ever reached
 * via next/dynamic(..., { ssr: false }) so Stripe.js (and the fraud-prevention
 * cookies it sets) loads only once a purchase modal actually opens, never for
 * anonymous browsing. PassStatusChip, by contrast, must render on every page
 * view of /app's top bar and every /konto visit for any signed-in user with a
 * Pass history - if its implementation lived inside PassModal.tsx, a plain
 * `import { PassStatusChip } from '@/components/PassModal'` at either call
 * site would force-evaluate that whole module (including the top-level
 * loadStripe() call) on every page load, silently setting Stripe cookies for
 * users who never open a purchase modal. Keeping this component in its own
 * Stripe-free file preserves that guardrail; PassModal.tsx re-exports it
 * purely for discoverability (see the bottom of that file), but callers
 * should import it from here.
 *
 * Renders nothing when the signed-in user has never purchased a Pass
 * (pass === null). `compact` selects the top-bar pill (active only - once a
 * Pass expires, the tool's persistent top-bar surface goes back to nothing,
 * per the design deck's own note that the chip is the tool's only persistent
 * Pass surface); the full variant (default, used on /konto) renders the "Ihr
 * Zugang" card for both the active state (chip + storage meter) and the
 * neutral, never-red expired state with a real re-purchase CTA.
 */
import { useLang } from '@/lib/i18n'
import { checkPassEntitlement } from '@/lib/account'
import { PASS_PRICE_CENTS, PASS_STORAGE_CAP } from '@/lib/humanizer'
import { btnClass, CARD, EYEBROW } from '@/components/ui'

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function PassStatusChip({
  pass,
  packageCount,
  compact = false,
  onRepurchase,
}: {
  pass: { expires_at: string } | null
  packageCount: number
  compact?: boolean
  onRepurchase?: () => void
}) {
  const { t } = useLang()
  if (!pass) return null

  const isActive = checkPassEntitlement(pass)
  const dateFormatted = formatDate(new Date(pass.expires_at))

  if (isActive) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 font-sans text-xs font-medium text-accent-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {t.passChipActive(dateFormatted)}
        </span>
      )
    }

    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(pass.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    )
    const fillPercent = Math.min(100, Math.round((packageCount / PASS_STORAGE_CAP) * 100))

    return (
      <div className={`${CARD} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <p className={EYEBROW}>{t.passAccessHeading}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 font-sans text-xs font-medium text-accent-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {t.passActiveBadge}
          </span>
        </div>
        <p className="mt-2 font-serif text-xl font-semibold text-ink">{t.passEyebrow}</p>
        <p className="mt-1 text-sm text-muted">{t.passActiveUntilDays(dateFormatted, daysLeft)}</p>
        <div className="mt-4">
          <div className="flex justify-between font-sans text-xs text-slate">
            <span>{t.passStorageLabel}</span>
            <span className="font-mono">
              {packageCount} / {PASS_STORAGE_CAP}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-faint">
            <div className="h-full rounded-full bg-accent" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>
        <p className="mt-4 border-t border-hair pt-3 text-xs text-accent-deep">{t.passEndsAutomaticallyFooter}</p>
      </div>
    )
  }

  // Expired: no persistent top-bar surface (compact) - only the full /konto card.
  if (compact) return null

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <p className={EYEBROW}>{t.passAccessHeading}</p>
        <span className="rounded-full border border-hair bg-faint px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-slate">
          {t.passExpiredBadge(dateFormatted)}
        </span>
      </div>
      <p className="mt-2 font-serif text-xl font-semibold text-ink">{t.passEyebrow}</p>
      <p className="mt-2 text-sm text-muted">{t.passExpiredBody(packageCount)}</p>
      <button type="button" onClick={onRepurchase} className={`${btnClass('accent', 'sm')} mt-4`}>
        {t.passRepurchaseCta(formatEuroCents(PASS_PRICE_CENTS))}
      </button>
      <p className="mt-3 text-[11px] text-stone">{t.passExpiredFooter}</p>
    </div>
  )
}
