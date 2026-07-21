'use client'

/**
 * Bewerbungspaket purchase modal: one-shot 4,99 € per application, unlocking the
 * print-PDF export of both documents plus one included Humanizer+ refinement
 * (spec D3). Loaded via next/dynamic from the page so Stripe.js (which sets
 * fraud-prevention cookies) is only fetched when the user opens the modal,
 * anonymous browsing stays cookie-free.
 *
 * Steps: intro (contents) -> payment (Widerruf checkbox + Payment Element).
 * On success the PaymentIntent id goes to the parent via onUnlocked; the parent
 * owns persistence (sessionStorage) and the unlocked UI state. Stateless
 * otherwise: Stripe is the token store, same pattern as HumanizerModal.
 *
 * Localization: chrome follows the active UI language via useLang(). The
 * Widerruf checkbox text and the "Zahlungspflichtig bestellen" button wording
 * stay German deliberately (§356(5) / §312j BGB legal declarations).
 */
import { useState, useRef, useEffect, useId } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { btnClass, EYEBROW } from '@/components/ui'
import { useLang } from '@/lib/i18n'
import { track } from '@/lib/analytics'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

type Step = 'intro' | 'payment'

export default function PaketModal({
  onClose,
  onUnlocked,
}: {
  onClose: () => void
  /** Called with the succeeded PaymentIntent id. The parent persists it
   * (sessionStorage) and flips the export buttons to unlocked. */
  onUnlocked: (paymentIntentId: string) => void
}) {
  const { t } = useLang()
  const [step, setStep] = useState<Step>('intro')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const headingId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus management: conditionally mounted (no portal), mount/unmount doubles
  // as open/close. Same pattern as HumanizerModal.
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
    track('paket_opened')
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
      const res = await fetch('/api/paket/intent', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? 'intent failed')
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch {
      setError(t.humanizerIntentInitError)
    }
  }

  return (
    // Same a11y approach as HumanizerModal: no portal, so background inert-ing is
    // out of reach; full Tab focus trap + aria-modal instead.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 modal-overlay-enter" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-lg rounded-xl border border-hair bg-paper p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto focus:outline-none modal-dialog-enter">
        <div className="flex items-start justify-between">
          <div>
            <p className={EYEBROW}>{t.paketEyebrow}</p>
            <h2 id={headingId} className="font-serif text-2xl font-semibold text-ink">{t.paketTitle}</h2>
          </div>
          <button onClick={onClose} aria-label={t.humanizerCloseAria} className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {step === 'intro' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">{t.paketIntro}</p>
            <ul className="flex flex-col gap-2 text-sm text-ink">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden="true">✓</span>
                {t.paketContentPdf}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5" aria-hidden="true">✓</span>
                {t.paketContentHumanizer}
              </li>
            </ul>
            <p className="text-xs text-muted">{t.paketPerApplicationNote}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className={btnClass('primary')} onClick={startPayment}>
              {t.paketContinueCta}
            </button>
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaketPaymentForm
              onPaid={(piId) => {
                track('paket_paid')
                onUnlocked(piId)
              }}
              error={error}
              setError={setError}
              paying={paying}
              setPaying={setPaying}
            />
          </Elements>
        )}

        <p className="text-xs text-muted">
          {t.humanizerFooterLegal} {' '}
          <a className="underline" href="/agb" target="_blank">{t.humanizerTermsLink}</a>{' '}
          / <a className="underline" href="/datenschutz" target="_blank">{t.humanizerPrivacyLink}</a>{' '}
          / <a className="underline" href="/impressum" target="_blank">{t.humanizerImprintLink}</a>
        </p>
      </div>
    </div>
  )
}

function PaketPaymentForm({
  onPaid,
  error,
  setError,
  paying,
  setPaying,
}: {
  onPaid: (paymentIntentId: string) => void
  error: string | null
  setError: (e: string | null) => void
  paying: boolean
  setPaying: (p: boolean) => void
}) {
  const { t } = useLang()
  const stripeJs = useStripe()
  const elements = useElements()
  const [widerrufOk, setWiderrufOk] = useState(false)

  async function pay() {
    if (!stripeJs || !elements) return
    setPaying(true)
    setError(null)
    const result = await stripeJs.confirmPayment({ elements, redirect: 'if_required' })
    setPaying(false)
    if (result.error) {
      setError(result.error.message ?? t.humanizerPaymentFailedGeneric)
      return
    }
    if (result.paymentIntent?.status === 'succeeded') {
      onPaid(result.paymentIntent.id)
    } else {
      setError(t.humanizerPaymentNotCompleted)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {/* Fixed §356(5) BGB legal declaration, German regardless of UI language
          (same rule as HumanizerModal). The English line beneath is a gloss. */}
      <label className="flex items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={widerrufOk}
          onChange={(e) => setWiderrufOk(e.target.checked)}
          className="mt-0.5 accent-[var(--color-accent,#0a7d63)]"
        />
        <span>
          Ich verlange ausdrücklich, dass mit der Ausführung vor Ablauf der Widerrufsfrist
          begonnen wird, und bestätige meine Kenntnis, dass mein Widerrufsrecht mit Beginn der
          Ausführung erlischt (§ 356 Abs. 5 BGB).
        </span>
      </label>
      <p className="text-xs text-muted -mt-2 pl-6">
        (I expressly request immediate delivery and acknowledge that my 14-day withdrawal
        right ends once delivery begins, German consumer law, § 356(5) BGB.)
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={pay}
        disabled={!widerrufOk || paying || !stripeJs || !elements}
        className={btnClass('primary')}
      >
        {paying ? t.humanizerPaying : t.paketPayCta}
      </button>
    </div>
  )
}
