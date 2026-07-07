'use client'

/**
 * Bewerbungsphase-Pass purchase modal: a 30-day, non-renewing, account-bound
 * entitlement (PRD 6.2) for a fixed 14,99 €. Loaded via next/dynamic from the
 * page (same reason as PaketModal/HumanizerModal): Stripe.js is only fetched
 * once this modal actually opens, so anonymous browsing stays cookie-free.
 *
 * Mirrors PaketModal's payment UX exactly: the intro -> payment Step machine,
 * focus management + Escape/Tab focus trap, the startPayment()
 * fetch-then-Elements pattern, and the footer legal-links row. Two deliberate
 * divergences from Paket:
 *   1. The benefits grid frames "Endet automatisch am TT.MM.JJJJ" as a
 *      FEATURE, not a warning - the Pass is honest about its own expiry.
 *   2. The Widerruf consent uses the DISTINCT proportional-value-substitute
 *      formula for a fixed-term SERVICE (§356(4)/§357a BGB), never Paket's
 *      §356(5) digital-content declaration. Wording pending native-speaker +
 *      legal review (PRD section 9, Q3).
 *
 * Unlike Paket (stateless, Stripe-as-token), the Pass is an account-bound DB
 * row: after Stripe confirms the charge, this modal calls /api/pass/verify to
 * durably write the pass_30d row before telling the parent the purchase
 * succeeded. A failed verify after a successful charge never re-charges the
 * card - the retry path re-calls ONLY /api/pass/verify with the same
 * PaymentIntent id, the same "already paid, try again" idiom as
 * HumanizerModal's humanizerRetryPaid.
 *
 * Also re-exports PassStatusChip (the read-only lifecycle indicator rendered
 * in app/page.tsx's top bar and on /konto) purely for discoverability - its
 * actual implementation lives in the Stripe-free src/components/PassStatusChip.tsx
 * so importing it never pulls in this module's loadStripe() call. See that
 * file's doc comment for why the split matters.
 */
import { useState, useRef, useEffect, useId } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { btnClass, EYEBROW } from '@/components/ui'
import { useLang } from '@/lib/i18n'
import { track } from '@/lib/analytics'
import { PASS_PRICE_CENTS } from '@/lib/humanizer'

export { PassStatusChip } from '@/components/PassStatusChip'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const PASS_WINDOW_DAYS = 30

type Step = 'intro' | 'payment'

// Same duplicated per-file helper as StorageGate.tsx's formatEuroCents /
// formatPurchaseDate - not worth a shared module for a handful of call sites.
function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PassModal({
  onClose,
  onPurchased,
}: {
  onClose: () => void
  /** Called once /api/pass/verify has durably written the pass_30d row (not
   * merely once Stripe confirms the charge) - the parent should refetch the
   * signed-in user's Pass status. */
  onPurchased: () => void
}) {
  const { t } = useLang()
  const [step, setStep] = useState<Step>('intro')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const headingId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  const priceFormatted = formatEuroCents(PASS_PRICE_CENTS)
  const endsAtFormatted = formatDate(new Date(Date.now() + PASS_WINDOW_DAYS * 24 * 60 * 60 * 1000))

  // Focus management: conditionally mounted (no portal), mount/unmount doubles
  // as open/close. Same pattern as PaketModal/HumanizerModal.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = dialog?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    ;(focusable ?? dialog)?.focus()
    return () => {
      previouslyFocused?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    track('pass_opened')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape-to-close + Tab focus trap, skipped while a payment is in flight.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (paying) return
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !dialog.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [paying, onClose])

  async function startPayment() {
    setError(null)
    try {
      const res = await fetch('/api/pass/intent', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? 'intent failed')
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch {
      setError(t.humanizerIntentInitError)
    }
  }

  return (
    // Same a11y approach as PaketModal/HumanizerModal: no portal, so background
    // inert-ing is out of reach; full Tab focus trap + aria-modal instead.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 modal-overlay-enter" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-lg rounded-xl border border-hair bg-paper p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto focus:outline-none modal-dialog-enter">
        <div className="flex items-start justify-between">
          <div>
            <p className={EYEBROW}>{t.passEyebrow}</p>
            <h2 id={headingId} className="font-serif text-2xl font-semibold text-ink">{t.passModalTitle}</h2>
          </div>
          <button onClick={onClose} aria-label={t.humanizerCloseAria} className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {step === 'intro' && (
          <div className="flex flex-col gap-4">
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-ink">{priceFormatted}</span>
              <span className="text-xs text-muted">{t.passModalPriceUnit}</span>
            </p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-ink sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden="true">✓</span>
                {t.passFeatureUnlimitedPaket}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden="true">✓</span>
                {t.passFeaturePdfExport}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden="true">✓</span>
                {t.passFeatureStorage}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden="true">✓</span>
                {t.passFeatureEndsAutomatically(endsAtFormatted)}
              </li>
            </ul>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className={btnClass('primary')} onClick={startPayment}>
              {t.passContinueCta}
            </button>
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PassPaymentForm
              onPaid={() => {
                track('pass_paid')
                onPurchased()
              }}
              error={error}
              setError={setError}
              paying={paying}
              setPaying={setPaying}
            />
          </Elements>
        )}

        <p className="text-xs text-muted">
          {t.passFooterLegal} {' '}
          <a className="underline" href="/agb" target="_blank">{t.humanizerTermsLink}</a>{' '}
          / <a className="underline" href="/datenschutz" target="_blank">{t.humanizerPrivacyLink}</a>{' '}
          / <a className="underline" href="/impressum" target="_blank">{t.humanizerImprintLink}</a>
        </p>
      </div>
    </div>
  )
}

function PassPaymentForm({
  onPaid,
  error,
  setError,
  paying,
  setPaying,
}: {
  onPaid: () => void
  error: string | null
  setError: (e: string | null) => void
  paying: boolean
  setPaying: (p: boolean) => void
}) {
  const { t } = useLang()
  const stripeJs = useStripe()
  const elements = useElements()
  const [widerrufOk, setWiderrufOk] = useState(false)
  // Set once Stripe has confirmed the charge but /api/pass/verify failed to
  // durably write the pass_30d row: the card is already charged, so a retry
  // re-calls ONLY verify() with the same PaymentIntent id, never
  // confirmPayment again.
  const [pendingVerifyPi, setPendingVerifyPi] = useState<string | null>(null)

  async function verify(paymentIntentId: string) {
    try {
      const res = await fetch('/api/pass/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      })
      if (res.ok) {
        setPendingVerifyPi(null)
        onPaid()
        return
      }
      setPendingVerifyPi(paymentIntentId)
      setError(t.passVerifyError)
    } catch {
      setPendingVerifyPi(paymentIntentId)
      setError(t.passVerifyError)
    }
  }

  async function pay() {
    setError(null)
    if (pendingVerifyPi) {
      // Payment already succeeded - only the fulfillment write is retried.
      setPaying(true)
      await verify(pendingVerifyPi)
      setPaying(false)
      return
    }
    if (!stripeJs || !elements) return
    setPaying(true)
    const result = await stripeJs.confirmPayment({ elements, redirect: 'if_required' })
    if (result.error) {
      setPaying(false)
      setError(result.error.message ?? t.humanizerPaymentFailedGeneric)
      return
    }
    if (result.paymentIntent?.status === 'succeeded') {
      await verify(result.paymentIntent.id)
      setPaying(false)
    } else {
      setPaying(false)
      setError(t.humanizerPaymentNotCompleted)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {/* Distinct proportional-value Widerruf consent for a fixed-term SERVICE
          (§356(4)/§357a BGB) - the Pass is NOT digital content, so it must NOT
          reuse Paket's §356(5) declaration. Wording pending native-speaker +
          legal review (PRD section 9, Q3). */}
      <label className="flex items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={widerrufOk}
          onChange={(e) => setWiderrufOk(e.target.checked)}
          className="mt-0.5 accent-[var(--color-accent,#0a7d63)]"
        />
        <span>{t.passWiderrufText}</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={pay}
        disabled={!widerrufOk || paying || !stripeJs || !elements}
        className={btnClass('primary')}
      >
        {paying ? t.humanizerPaying : pendingVerifyPi ? t.humanizerRetryPaid : t.passPayCta}
      </button>
    </div>
  )
}
