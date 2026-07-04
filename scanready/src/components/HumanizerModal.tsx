'use client'

/**
 * Humanizer+ purchase + refinement modal. Loaded via next/dynamic from the page
 * so Stripe.js (which sets fraud-prevention cookies) is only fetched when the
 * user opens the modal — anonymous browsing stays cookie-free.
 *
 * Steps: direction → payment (Widerruf checkbox + Payment Element) → refining (stream).
 * No redirect: allow_redirects: 'never' on the PI + redirect: 'if_required' here.
 */
import { useState, useRef, useEffect, useId } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { HUMANIZER_DIRECTIONS, type HumanizerDirection } from '@/lib/prompts'
import { INVALID_INPUT_SENTINEL } from '@/lib/sentinel'
import { btnClass, EYEBROW } from '@/components/ui'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const DIRECTION_LABELS: Record<HumanizerDirection, { title: string; blurb: string }> = {
  formeller: { title: 'Formeller', blurb: 'Corporate & Mittelstand — classic, conservative, correct.' },
  moderner: { title: 'Moderner', blurb: 'Startup & scale-up — direct, energetic, no ceremony.' },
  praegnanter: { title: 'Prägnanter', blurb: 'Tighten & condense — every line earns its place.' },
}

type Step = 'direction' | 'payment' | 'refining' | 'error'

/** sessionStorage key for a paid-but-unconsumed refinement attempt.
 * Stores ONLY the PaymentIntent id + chosen direction — never letter content —
 * so reopening the modal after a failed stream resumes instead of re-charging. */
const PAID_ATTEMPT_KEY = 'humanizer_paid_attempt'

type PaidAttempt = { paymentIntentId: string; direction: HumanizerDirection }

function readPaidAttempt(): PaidAttempt | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PAID_ATTEMPT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.paymentIntentId === 'string' && typeof parsed.direction === 'string') {
      return parsed as PaidAttempt
    }
    return null
  } catch {
    return null
  }
}

export default function HumanizerModal({
  letterText,
  onClose,
  onDone,
}: {
  letterText: string
  onClose: () => void
  onDone: (refined: string) => void
}) {
  const pendingAttempt = useRef(readPaidAttempt()).current
  const [step, setStep] = useState<Step>(pendingAttempt ? 'error' : 'direction')
  const [direction, setDirection] = useState<HumanizerDirection | null>(pendingAttempt?.direction ?? null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    pendingAttempt
      ? 'A paid refinement is still open. You can retry without paying again.'
      : null
  )
  const paymentIntentIdRef = useRef<string | null>(pendingAttempt?.paymentIntentId ?? null)
  const [failCount, setFailCount] = useState(0)
  const [paying, setPaying] = useState(false)
  const headingId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus management: the modal is conditionally mounted (no portal), so mount/unmount
  // doubles as open/close. Capture the previously-focused element on mount, move focus
  // into the dialog, and restore focus to the trigger on unmount.
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

  // Escape-to-close + Tab focus trap. Skipped while `paying` is true so a mid-flight
  // confirmPayment() can't be dismissed and mistaken for a cancel.
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

  async function pickDirection(d: HumanizerDirection) {
    setDirection(d)
    setError(null)
    try {
      const res = await fetch('/api/humanizer/intent', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? 'intent failed')
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch {
      setError('Payment could not be initialized. Please try again later.')
    }
  }

  async function runRefinement(piId: string) {
    paymentIntentIdRef.current = piId
    // Persist the paid-but-unconsumed attempt (PI id + direction only, never letter
    // content) so a modal remount after a stream failure resumes instead of
    // re-charging via the direction picker.
    if (direction) {
      sessionStorage.setItem(PAID_ATTEMPT_KEY, JSON.stringify({ paymentIntentId: piId, direction }))
    }
    setStep('refining')
    setError(null)
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterText, direction, paymentIntentId: piId }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Refinement failed. Your payment stays valid — please try again.')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let refined = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        refined += decoder.decode(value, { stream: true })
      }
      if (refined.trimStart().startsWith(INVALID_INPUT_SENTINEL)) {
        throw new Error(
          'The text was not recognized as an Anschreiben. Your payment stays valid — please try again.'
        )
      }
      if (!refined.trim()) throw new Error('Empty response. Your payment stays valid — please try again.')
      sessionStorage.removeItem(PAID_ATTEMPT_KEY)
      onDone(refined)
    } catch (e) {
      setFailCount((n) => n + 1)
      setError(e instanceof Error ? e.message : 'Refinement failed. Your payment stays valid — please try again.')
      setStep('error')
    }
  }

  return (
    // Background is not `inert`: the modal is rendered inline in the page tree (no
    // portal), and marking every sibling inert from here would require reaching outside
    // this component. Minimum acceptable a11y bar instead: a full Tab focus trap (below)
    // plus `aria-modal="true"`, which instructs screen readers to ignore the background
    // even though it isn't structurally inert.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-lg rounded-xl border border-hair bg-paper p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto focus:outline-none">
        <div className="flex items-start justify-between">
          <div>
            <p className={EYEBROW}>Humanizer+</p>
            <h2 id={headingId} className="font-serif text-2xl font-semibold text-ink">Feinschliff — 2,99&nbsp;€</h2>
          </div>
          <button onClick={onClose} aria-label="Schließen" className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {step === 'direction' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Your Anschreiben is ready. The Feinschliff tunes tone and register to the
              company&rsquo;s culture — your facts and voice stay unchanged.
            </p>
            {(Object.keys(DIRECTION_LABELS) as HumanizerDirection[]).map((d) => (
              <button
                key={d}
                onClick={() => pickDirection(d)}
                className="rounded-xl border border-hair bg-card p-4 text-left transition-colors hover:border-accent"
              >
                <p className="font-semibold text-ink">{DIRECTION_LABELS[d].title}</p>
                <p className="text-sm text-muted">{DIRECTION_LABELS[d].blurb}</p>
              </button>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onPaid={runRefinement} error={error} setError={setError} paying={paying} setPaying={setPaying} />
          </Elements>
        )}

        {step === 'refining' && (
          <p className="text-sm text-muted animate-pulse">Processing …</p>
        )}

        {step === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-600">{error}</p>
            {paymentIntentIdRef.current && (
              <p className="text-sm text-muted">
                Zahlungsreferenz: <code className="font-mono">{paymentIntentIdRef.current}</code>
                {failCount >= 3 && (
                  <>
                    {' '}— Failed multiple times? We&rsquo;ll refund the purchase — email this reference to
                    the address listed in the{' '}
                    <a className="underline" href="/impressum" target="_blank">Impressum</a>.
                  </>
                )}
              </p>
            )}
            {failCount < 3 && paymentIntentIdRef.current && (
              <button className={btnClass('primary')} onClick={() => runRefinement(paymentIntentIdRef.current!)}>
                Try again (already paid)
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted">
          One-time payment, no subscription. {' '}
          <a className="underline" href="/agb" target="_blank">Terms &amp; withdrawal policy</a>{' '}
          / <a className="underline" href="/datenschutz" target="_blank">Privacy</a>{' '}
          / <a className="underline" href="/impressum" target="_blank">Imprint</a> apply.
        </p>
      </div>
    </div>
  )
}

function PaymentForm({
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
      setError(result.error.message ?? 'Payment failed. You were not charged — please try again.')
      return
    }
    if (result.paymentIntent?.status === 'succeeded') {
      onPaid(result.paymentIntent.id)
    } else {
      setError('Zahlung nicht abgeschlossen. Bitte erneut versuchen.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
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
        right ends once delivery begins — German consumer law, § 356(5) BGB.)
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={pay}
        disabled={!widerrufOk || paying || !stripeJs || !elements}
        className={btnClass('primary')}
      >
        {paying ? 'Processing …' : 'Zahlungspflichtig bestellen (2,99 €)'}
      </button>
    </div>
  )
}
