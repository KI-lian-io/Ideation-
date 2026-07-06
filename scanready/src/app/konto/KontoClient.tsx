'use client'

/**
 * Stage 3 accounts dashboard. Client component wrapped in LangProvider (by
 * the server page.tsx wrapper) so i18n works the same way as /app.
 *
 * Sections: saved packages (list + delete), subscription (status or subscribe
 * CTA), danger zone (delete account). Everything here renders an honest
 * "not available yet" line when accountsEnabled() is false, same convention
 * as every other Stage 3 entry point.
 */
import { useEffect, useState } from 'react'
import { useAccount } from '@/components/AccountProvider'
import { useLang } from '@/lib/i18n'
import { accountsEnabled } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { listPackages, deletePackage, deleteAccount, type ApplicationPackageRow } from '@/lib/account'
import { btnClass, EYEBROW } from '@/components/ui'

type SubscriptionRow = {
  stripe_subscription_id: string
  status: string
  current_period_end: string | null
}

export function KontoClient() {
  const { t } = useLang()
  const { user, loading, signInWithGoogle, signOut } = useAccount()

  if (!accountsEnabled()) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-sm text-ink">
        <p>{t.kontoDisabledNotice}</p>
        <p lang="de" className="mt-1 text-muted">Konten sind derzeit noch nicht verfügbar.</p>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-sm text-muted">
        {t.kontoLoading}
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-4 text-sm text-ink">
        <h1 className="font-serif text-3xl font-semibold">{t.kontoLink}</h1>
        <p className="text-muted">{t.kontoSignInIntro}</p>
        <button
          onClick={() => signInWithGoogle()}
          className={`${btnClass('primary')} self-start`}
        >
          {t.accountSignIn}
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-10 text-sm text-ink">
      <div>
        <h1 className="font-serif text-3xl font-semibold mb-2">{t.kontoLink}</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      <SavedPackagesSection userId={user.id} />
      <SubscriptionSection />
      <DangerZoneSection onSignOut={signOut} />
    </main>
  )
}

function SavedPackagesSection({ userId }: { userId: string }) {
  const { t } = useLang()
  const [packages, setPackages] = useState<ApplicationPackageRow[] | null>(null)

  async function refresh() {
    const rows = await listPackages(getSupabaseBrowserClient(), userId)
    setPackages(rows)
  }

  useEffect(() => {
    refresh()
    // Deliberately runs once per mount: userId is stable for the lifetime of
    // this page (a sign-out unmounts the whole client component tree above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(pkg: ApplicationPackageRow) {
    if (!window.confirm(t.kontoDeleteConfirm)) return
    await deletePackage(getSupabaseBrowserClient(), pkg.id)
    await refresh()
  }

  return (
    <section className="flex flex-col gap-3">
      <p className={EYEBROW}>{t.kontoSavedHeading}</p>
      <p className="text-muted">{t.kontoSavedHint}</p>
      {packages === null ? (
        <p className="text-muted">{t.kontoLoading}</p>
      ) : packages.length === 0 ? (
        <p className="text-muted">{t.savedApplicationsEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex items-center justify-between gap-3 rounded-md border border-hair bg-paper px-4 py-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-semibold text-ink truncate">{pkg.title}</span>
                <span className="text-xs text-muted">
                  {t.savedApplicationsUpdated(new Date(pkg.updated_at).toLocaleDateString('de-DE'))}
                  {pkg.read_only && (
                    <span className="ml-2 font-mono uppercase tracking-[0.1em] text-eyebrow">
                      {t.savedApplicationsReadOnlyBadge}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => handleDelete(pkg)}
                className={`${btnClass('secondary')} shrink-0`}
              >
                {t.kontoDeleteCta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SubscriptionSection() {
  const { t } = useLang()
  const [sub, setSub] = useState<SubscriptionRow | null | undefined>(undefined)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    client
      .from('subscriptions')
      .select('stripe_subscription_id,status,current_period_end')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSub((data as SubscriptionRow | null) ?? null))
  }, [])

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'

  async function handleSubscribe() {
    setSubscribing(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/subscription/checkout', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && (data as { url?: string }).url) {
        window.location.assign((data as { url: string }).url)
        return
      }
      setCheckoutError((data as { error?: string }).error ?? t.kontoSubscribeError)
    } catch {
      setCheckoutError(t.kontoSubscribeError)
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <p className={EYEBROW}>{t.kontoSubscriptionHeading}</p>
      {sub === undefined ? (
        <p className="text-muted">{t.kontoLoading}</p>
      ) : isActive ? (
        <>
          <p>
            {t.kontoSubscriptionActive(
              sub?.current_period_end
                ? new Date(sub.current_period_end).toLocaleDateString('de-DE')
                : '–'
            )}
          </p>
          <a href="/kuendigen" className="underline text-sm w-fit" lang="de">
            {t.kontoCancelLink}
          </a>
        </>
      ) : (
        <>
          <p className="text-muted">{t.kontoSubscriptionNone}</p>
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className={`${btnClass('primary')} self-start`}
          >
            {t.kontoSubscribeCta}
          </button>
          {checkoutError && <p className="text-red-600">{checkoutError}</p>}
        </>
      )}
    </section>
  )
}

function DangerZoneSection({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { t } = useLang()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDeleteAccount() {
    if (!window.confirm(t.kontoDeleteAccountConfirm)) return
    setWorking(true)
    setError(null)
    const result = await deleteAccount(getSupabaseBrowserClient())
    if (!result.ok) {
      setError(t.kontoDeleteAccountError)
      setWorking(false)
      return
    }
    await onSignOut()
    window.location.assign('/')
  }

  return (
    <section className="flex flex-col gap-3 border-t border-hair pt-6">
      <p className={EYEBROW}>{t.kontoDangerHeading}</p>
      <button
        onClick={handleDeleteAccount}
        disabled={working}
        className={`${btnClass('secondary')} self-start border-red-600 text-red-600 hover:border-red-700 hover:text-red-700`}
      >
        {working ? t.kontoDeleteAccountWorking : t.kontoDeleteAccountCta}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </section>
  )
}
