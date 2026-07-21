'use client'

import { useEffect, useState } from 'react'
import { useAccount } from '@/components/AccountProvider'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { accountsEnabled } from '@/lib/supabase/config'
import { listPaketPurchases } from '@/lib/account'
import { PASS_PRICE_CENTS } from '@/lib/humanizer'
import { btnClass, CARD, EYEBROW } from '@/components/ui'
import { useLang } from '@/lib/i18n'

/**
 * A3 storage-gate chooser (design surface 02). An INLINE dismissible panel,
 * never a blocking modal: appears in the state==='limit' branch of the save
 * rail once a free account hits the 1-package storage limit. Presents the
 * Pass (featured, purchasable) beside Plus ("Geplant", not yet buyable), an
 * honest delete-instead footer, and - only once the signed-in user already
 * has 2+ paket purchases - their own spend as an anchor ledger instead of the
 * plain chooser. Deliberately free of timers or artificial pressure copy:
 * the only "urgency" cue is the honest "expires on its own" note on the
 * Pass itself.
 *
 * Dismissal persists in sessionStorage (same idiom as the paid-attempt /
 * paket-unlock persistence in src/app/app/page.tsx) so the panel stays
 * collapsed for the rest of the session and never re-expands on its own.
 */

const DISMISS_KEY = 'storage_gate_dismissed'

// Every displayed price is formatted from the same cents constant Stripe
// checkout reads (src/lib/humanizer.ts), so this panel cannot silently drift
// from what is actually charged. Duplicated from src/app/preise/page.tsx's
// own formatEuroCents - a five-line pure helper, not worth a shared module
// for two call sites (same reasoning as packageCompanyCity in 07-05).
function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

function formatPurchaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function StorageGate({ onChoosePass }: { onChoosePass: () => void }) {
  const { t } = useLang()
  const { user } = useAccount()
  const [dismissed, setDismissed] = useState(false)
  const [purchases, setPurchases] = useState<
    { id: string; amount_cents: number; created_at: string }[]
  >([])

  // Read the dismissal flag once on mount. sessionStorage may be unavailable
  // (private mode, etc.); a read failure just leaves the panel shown, same
  // fail-open convention as the rest of this codebase's storage reads.
  useEffect(() => {
    try {
      // Same hydration-safe post-mount read pattern as i18n.tsx's LangProvider.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true)
    } catch {
      // ignore
    }
  }, [])

  // The anchor variant needs the signed-in user's own paket purchase history
  // (RLS select-own via listPaketPurchases). accountsEnabled()-gated no-op
  // when accounts are off; skipped entirely when there is no signed-in user.
  useEffect(() => {
    if (!accountsEnabled() || !user) return
    let cancelled = false
    const client = getSupabaseBrowserClient()
    listPaketPurchases(client, user.id).then((rows) => {
      if (!cancelled) setPurchases(rows)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore write failures - the panel still collapses for this render
    }
  }

  if (dismissed) return null

  const showAnchor = purchases.length >= 2
  const passPriceFormatted = formatEuroCents(PASS_PRICE_CENTS)

  return (
    <div className={`${CARD} relative p-5`}>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.gateDismissAria}
        className="absolute right-3 top-3 text-muted hover:text-ink text-lg leading-none"
      >
        ×
      </button>

      <p className={EYEBROW}>{t.gateEyebrow}</p>

      {showAnchor ? (
        <AnchorVariant
          purchases={purchases}
          passPriceFormatted={passPriceFormatted}
          onChoosePass={onChoosePass}
          onDismiss={dismiss}
        />
      ) : (
        <DefaultVariant onChoosePass={onChoosePass} onDismiss={dismiss} passPriceFormatted={passPriceFormatted} />
      )}
    </div>
  )
}

function DefaultVariant({
  onChoosePass,
  onDismiss,
  passPriceFormatted,
}: {
  onChoosePass: () => void
  onDismiss: () => void
  passPriceFormatted: string
}) {
  const { t } = useLang()
  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-ink mt-2">{t.gateTitle}</h2>
      <p className="text-sm text-muted mt-1.5">
        {t.gateStorageStatus} {t.gateSubtitle}
      </p>

      {/* Stacked always (not a responsive 2-col grid): this panel only ever renders
          inside the narrow save rail (~340px), never at the wide standalone width
          shown in the design deck's 1a anatomy view - see the deck's 1c "in
          context" view, which stacks the same two cards vertically. */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Pass offer - featured, the one accent-bordered card in the panel */}
        <div className="rounded-xl border-2 border-accent p-4 shadow-[0_0_0_1px_rgba(10,125,99,0.12)]">
          <div className="flex items-center justify-between gap-2">
            <p className={EYEBROW}>{t.gatePassName}</p>
            <span className="font-sans text-[10.5px] font-semibold uppercase tracking-wide bg-accent text-white rounded-full px-2 py-0.5">
              {t.gateRecommendedBadge}
            </span>
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-semibold text-ink">{passPriceFormatted}</span>
            <span className="text-xs text-muted">{t.gatePassPriceUnit}</span>
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-ink">
            <li>{t.gatePassFeature1}</li>
            <li>{t.gatePassFeature2}</li>
          </ul>
          <button type="button" onClick={onChoosePass} className={`${btnClass('accent', 'sm')} mt-3 w-full text-center`}>
            {t.gatePassCta}
          </button>
          <p className="mt-2 rounded-md bg-accent-tint px-2.5 py-1.5 text-[11px] leading-snug text-accent-deep">
            {t.gatePassHonest}
          </p>
        </div>

        {/* Plus offer - secondary, "Geplant", not yet buyable */}
        <div className="rounded-xl border border-hair p-4">
          <div className="flex items-center justify-between gap-2">
            <p className={EYEBROW}>{t.gatePlusName}</p>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-slate bg-faint border border-hair rounded-full px-2 py-0.5">
              {t.gatePlannedBadge}
            </span>
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-semibold text-ink">{t.gatePlusPrice}</span>
            <span className="text-xs text-muted">{t.gatePlusPriceUnit}</span>
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-ink">
            <li>{t.gatePlusFeature1}</li>
            <li>{t.gatePlusFeature2}</li>
          </ul>
          <button type="button" disabled className={`${btnClass('secondary', 'sm')} mt-3 w-full text-center`}>
            {t.gatePlusCta}
          </button>
          <p className="mt-2 rounded-md bg-faint px-2.5 py-1.5 text-[11px] leading-snug text-muted">
            {t.gatePlusHonest}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-hair pt-3">
        <p className="text-xs text-muted">{t.gateAlternative}</p>
        <button type="button" onClick={onDismiss} className="text-xs text-stone hover:text-ink flex-shrink-0">
          {t.gateLaterCta}
        </button>
      </div>
    </>
  )
}

function AnchorVariant({
  purchases,
  passPriceFormatted,
  onChoosePass,
  onDismiss,
}: {
  purchases: { id: string; amount_cents: number; created_at: string }[]
  passPriceFormatted: string
  onChoosePass: () => void
  onDismiss: () => void
}) {
  const { t } = useLang()
  const sumCents = purchases.reduce((sum, p) => sum + p.amount_cents, 0)
  const sumFormatted = formatEuroCents(sumCents)

  return (
    <>
      <h2 className="font-serif text-xl font-semibold text-ink mt-2">{t.gateAnchorTitle}</h2>

      <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-hair bg-faint px-4 py-3 max-w-sm">
        {purchases.map((p) => (
          <div key={p.id} className="flex justify-between gap-4 font-mono text-xs text-slate">
            <span>{t.gateAnchorLineItem(formatPurchaseDate(p.created_at))}</span>
            <span>{formatEuroCents(p.amount_cents)}</span>
          </div>
        ))}
        <div className="h-px bg-hair my-0.5" />
        <div className="flex justify-between gap-4 font-mono text-xs font-medium text-ink">
          <span>{t.gateAnchorSumLabel(purchases.length)}</span>
          <span>{sumFormatted}</span>
        </div>
        <div className="flex justify-between gap-4 font-mono text-xs font-medium text-accent-deep">
          <span>{t.gateAnchorPassLabel}</span>
          <span>{passPriceFormatted}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        {t.gateAnchor(purchases.length, sumFormatted, passPriceFormatted)}
      </p>

      <div className="mt-3.5 flex items-center gap-3">
        <button type="button" onClick={onChoosePass} className={btnClass('accent', 'sm')}>
          {t.gateAnchorPassCta(passPriceFormatted)}
        </button>
        <button type="button" onClick={onDismiss} className={btnClass('secondary', 'sm')}>
          {t.gateLaterCta}
        </button>
        <span className="ml-auto flex-shrink-0 text-[11px] text-stone">{t.gateAnchorEndsAutomatically}</span>
      </div>
    </>
  )
}
