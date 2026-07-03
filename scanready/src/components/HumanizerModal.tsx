'use client'

/**
 * Humanizer+ purchase + refinement modal. Loaded via next/dynamic from the page
 * so Stripe.js (which sets fraud-prevention cookies) is only fetched when the
 * user opens the modal — anonymous browsing stays cookie-free.
 *
 * Steps: direction → payment (Widerruf checkbox + Payment Element) → refining (stream).
 * No redirect: allow_redirects: 'never' on the PI + redirect: 'if_required' here.
 */
import { useState, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { HUMANIZER_DIRECTIONS, type HumanizerDirection } from '@/lib/prompts'
import { btnClass, EYEBROW } from '@/components/ui'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const DIRECTION_LABELS: Record<HumanizerDirection, { title: string; blurb: string }> = {
  formeller: { title: 'Formeller', blurb: 'Konzern & Mittelstand — klassisch, konservativ, korrekt.' },
  moderner: { title: 'Moderner', blurb: 'Startup & Scale-up — direkt, energisch, ohne Zeremonie.' },
  praegnanter: { title: 'Prägnanter', blurb: 'Kürzen & verdichten — jede Zeile verdient ihren Platz.' },
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
      ? 'Eine bezahlte Verfeinerung ist noch offen. Sie können es erneut versuchen, ohne erneut zu zahlen.'
      : null
  )
  const paymentIntentIdRef = useRef<string | null>(pendingAttempt?.paymentIntentId ?? null)
  const [failCount, setFailCount] = useState(0)

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
      setError('Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen.')
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
        throw new Error(data.error ?? 'Verfeinerung fehlgeschlagen.')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let refined = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        refined += decoder.decode(value, { stream: true })
      }
      if (!refined.trim()) throw new Error('Leere Antwort.')
      sessionStorage.removeItem(PAID_ATTEMPT_KEY)
      onDone(refined)
    } catch (e) {
      setFailCount((n) => n + 1)
      setError(e instanceof Error ? e.message : 'Verfeinerung fehlgeschlagen.')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label="Humanizer+ Feinschliff">
      <div className="w-full max-w-lg rounded-xl border border-hair bg-paper p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className={EYEBROW}>Humanizer+</p>
            <h2 className="font-serif text-2xl font-semibold text-ink">Feinschliff — 2,99&nbsp;€</h2>
          </div>
          <button onClick={onClose} aria-label="Schließen" className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {step === 'direction' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Ihr Anschreiben ist fertig. Der Feinschliff passt Ton und Register an die Kultur des
              Unternehmens an — Ihre Fakten und Ihre Stimme bleiben unverändert.
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
            <PaymentForm onPaid={runRefinement} error={error} setError={setError} />
          </Elements>
        )}

        {step === 'refining' && (
          <p className="text-sm text-muted animate-pulse">Feinschliff wird erstellt …</p>
        )}

        {step === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-600">{error}</p>
            {paymentIntentIdRef.current && (
              <p className="text-sm text-muted">
                Zahlungsreferenz: <code className="font-mono">{paymentIntentIdRef.current}</code>
                {failCount >= 3 && (
                  <>
                    {' '}— Mehrfach fehlgeschlagen? Wir erstatten den Kaufpreis, E-Mail mit dieser Referenz an
                    die im{' '}
                    <a className="underline" href="/impressum" target="_blank">Impressum</a> genannte Adresse.
                  </>
                )}
              </p>
            )}
            {failCount < 3 && paymentIntentIdRef.current && (
              <button className={btnClass('primary')} onClick={() => runRefinement(paymentIntentIdRef.current!)}>
                Erneut versuchen (bereits bezahlt)
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted">
          Einmalzahlung, kein Abo. Es gelten die{' '}
          <a className="underline" href="/agb" target="_blank">AGB &amp; Widerrufsbelehrung</a>.{' '}
          <a className="underline" href="/datenschutz" target="_blank">Datenschutz</a> ·{' '}
          <a className="underline" href="/impressum" target="_blank">Impressum</a>
        </p>
      </div>
    </div>
  )
}

function PaymentForm({
  onPaid,
  error,
  setError,
}: {
  onPaid: (paymentIntentId: string) => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const stripeJs = useStripe()
  const elements = useElements()
  const [widerrufOk, setWiderrufOk] = useState(false)
  const [paying, setPaying] = useState(false)

  async function pay() {
    if (!stripeJs || !elements) return
    setPaying(true)
    setError(null)
    const result = await stripeJs.confirmPayment({ elements, redirect: 'if_required' })
    setPaying(false)
    if (result.error) {
      setError(result.error.message ?? 'Zahlung fehlgeschlagen.')
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={pay}
        disabled={!widerrufOk || paying || !stripeJs || !elements}
        className={btnClass('primary')}
      >
        {paying ? 'Wird verarbeitet …' : 'Zahlungspflichtig bestellen (2,99 €)'}
      </button>
    </div>
  )
}
