'use client'

/**
 * The interactive half of the §312k Kündigungsbutton page (client component;
 * the page itself stays a server component so it can branch on env).
 *
 * Identification: the same Google account that was used to subscribe. §312k
 * requires cancellation without undue hurdles; sign-in with the existing
 * purchase identity is the identification step, not an extra barrier (there
 * is no other credential in this product). After a successful cancellation
 * the confirmation (with timestamp and end date) is displayed immediately,
 * which is the §312k confirmation of receipt.
 *
 * German-only deliberately: this is a German-law consumer flow, like the
 * legal pages.
 */
import { useState } from 'react'
import { useAccount } from '@/components/AccountProvider'
import { btnClass } from '@/components/ui'

type CancelState =
  | { phase: 'idle' }
  | { phase: 'working' }
  | { phase: 'done'; at: Date; endsAt: string | null }
  | { phase: 'error'; message: string }

export function KuendigenForm() {
  const { user, loading, signInWithGoogle } = useAccount()
  const [state, setState] = useState<CancelState>({ phase: 'idle' })

  async function cancelNow() {
    setState({ phase: 'working' })
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState({
          phase: 'error',
          message:
            (data as { error?: string }).error ??
            'Die Kündigung konnte nicht übermittelt werden. Bitte später erneut versuchen.',
        })
        return
      }
      setState({
        phase: 'done',
        at: new Date(),
        endsAt: (data as { endsAt?: string | null }).endsAt ?? null,
      })
    } catch {
      setState({
        phase: 'error',
        message: 'Netzwerkfehler. Bitte später erneut versuchen.',
      })
    }
  }

  if (loading) {
    return <p className="text-muted">Wird geladen …</p>
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-3">
        <p>
          Zur Identifikation melden Sie sich bitte mit dem Google-Konto an, mit dem Sie
          das Abonnement abgeschlossen haben. Danach können Sie hier mit einem Klick
          kündigen.
        </p>
        <button onClick={() => signInWithGoogle()} className={`${btnClass('secondary')} self-start`}>
          Mit Google anmelden
        </button>
      </div>
    )
  }

  if (state.phase === 'done') {
    return (
      <div className="flex flex-col gap-2" role="status">
        <p className="font-semibold">Ihre Kündigung ist eingegangen.</p>
        <p>
          Eingang: {state.at.toLocaleString('de-DE')}. Das Abonnement endet zum Ablauf
          des bereits bezahlten Zeitraums
          {state.endsAt ? ` (${new Date(state.endsAt).toLocaleDateString('de-DE')})` : ''}.
          Gespeicherte Bewerbungspakete bleiben lesbar; bearbeitbar bleibt Ihr zuletzt
          genutztes Paket.
        </p>
        <p>
          Bitte sichern Sie diese Bestätigung (z. B. als Screenshot). Sie erhalten keine
          weitere Abbuchung.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p>
        Angemeldet als <span className="font-semibold">{user.email}</span>. Mit dem
        folgenden Button kündigen Sie Ihr Abonnement zum Ende des bereits bezahlten
        Zeitraums.
      </p>
      {state.phase === 'error' && <p className="text-red-600">{state.message}</p>}
      <button
        onClick={cancelNow}
        disabled={state.phase === 'working'}
        className={`${btnClass('primary')} self-start`}
      >
        {state.phase === 'working' ? 'Wird übermittelt …' : 'Jetzt kündigen'}
      </button>
    </div>
  )
}
