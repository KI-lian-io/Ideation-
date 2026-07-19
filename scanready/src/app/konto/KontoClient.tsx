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
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAccount } from '@/components/AccountProvider'
import { useLang } from '@/lib/i18n'
import { accountsEnabled } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  listPackages,
  deletePackage,
  deleteAccount,
  updatePackageTitle,
  getLatestPass,
  listCvs,
  updateCvTitle,
  type ApplicationPackageRow,
  type CvRow,
} from '@/lib/account'
import { PassStatusChip } from '@/components/PassStatusChip'
import {
  btnClass,
  EYEBROW,
  SheetCard,
  MonoBadge,
  EmptyState,
  KebabMenu,
  InlineRenameField,
  type KebabMenuItem,
} from '@/components/ui'

// Dynamic: keeps Stripe.js (and its cookies) out of /konto until the
// re-purchase CTA in PassStatusChip's expired state actually opens it - same
// reason /app defers PaketModal/PassModal via next/dynamic.
const PassModal = dynamic(() => import('@/components/PassModal'), { ssr: false })

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

      <PassSection userId={user.id} />
      <SavedPackagesSection userId={user.id} />
      <CvSection userId={user.id} />
      <SubscriptionSection userId={user.id} />
      <DangerZoneSection onSignOut={signOut} />
    </main>
  )
}

/**
 * Bewerbungsphase-Pass section (07-07): PassStatusChip's full "Ihr Zugang"
 * card, active or the neutral expired state with a real re-purchase CTA.
 * Renders nothing when the signed-in user has never purchased a Pass -
 * StorageGate (in /app's save rail) is the cross-sell entry point for that
 * case, not this dashboard.
 */
function PassSection({ userId }: { userId: string }) {
  const [pass, setPass] = useState<{ expires_at: string } | null>(null)
  const [packageCount, setPackageCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  async function refresh() {
    const client = getSupabaseBrowserClient()
    const [passRow, packages] = await Promise.all([
      getLatestPass(client, userId),
      listPackages(client, userId),
    ])
    setPass(passRow)
    setPackageCount(packages.length)
  }

  useEffect(() => {
    // One-shot Supabase read on mount, same accepted pattern as
    // SavedPackagesSection's own refresh effect just below - no external
    // subscription exists here to attach to instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    // Deliberately runs once per mount: userId is stable for the lifetime of
    // this page, same convention as SavedPackagesSection's own refresh effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!pass) return null

  return (
    <section className="flex flex-col gap-4">
      <PassStatusChip pass={pass} packageCount={packageCount} onRepurchase={() => setModalOpen(true)} />
      {modalOpen && (
        <PassModal
          onClose={() => setModalOpen(false)}
          onPurchased={() => {
            setModalOpen(false)
            refresh()
          }}
        />
      )}
    </section>
  )
}

/**
 * Derives the "company · city" line from the package's own saved Lebenslauf
 * (most recent experience entry, index 0). Grounded in data the user already
 * saved - never a separate stored field, never invented. Returns null when
 * the Lebenslauf has no experience entries, so the caller skips the line
 * entirely rather than rendering an empty one.
 */
function packageCompanyCity(pkg: ApplicationPackageRow): string | null {
  const latest = pkg.lebenslauf.experience[0]
  if (!latest) return null
  return latest.location ? `${latest.company} · ${latest.location}` : latest.company
}

/** One saved-package card: mono date + kebab, serif title (or inline rename),
 * company · city, hairline, mono document-type badge row. Read-only rows
 * render flat (no shadow) and HIDE the Umbenennen action entirely (delete
 * always stays available) per the RLS-silently-no-ops guardrail. */
function PackageCard({
  pkg,
  anyReadOnly,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  pkg: ApplicationPackageRow
  anyReadOnly: boolean
  isRenaming: boolean
  renameValue: string
  onRenameChange: (value: string) => void
  onRenameStart: (pkg: ApplicationPackageRow) => void
  onRenameCommit: (pkg: ApplicationPackageRow, value: string) => void
  onRenameCancel: () => void
  onOpen: (pkg: ApplicationPackageRow) => void
  onDuplicate: (pkg: ApplicationPackageRow) => void
  onDelete: (pkg: ApplicationPackageRow) => void
}) {
  const { t } = useLang()
  const companyCity = packageCompanyCity(pkg)

  const items: KebabMenuItem[] = [
    { label: t.libraryMenuOpen, onSelect: () => onOpen(pkg) },
    { label: t.libraryMenuDuplicate, onSelect: () => onDuplicate(pkg) },
    ...(pkg.read_only ? [] : [{ label: t.libraryMenuRename, onSelect: () => onRenameStart(pkg) }]),
    { label: t.libraryMenuDelete, onSelect: () => onDelete(pkg), destructive: true },
  ]

  return (
    <div
      className={
        pkg.read_only
          ? 'flex flex-col gap-2.5 rounded-xl border border-hair bg-paper px-5 py-4'
          : `${SheetCard} flex flex-col gap-2.5 px-5 py-4`
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
          {new Date(pkg.updated_at).toLocaleDateString('de-DE')}
        </span>
        <KebabMenu items={items} ariaLabel={t.libraryMenuAriaLabel(pkg.title)} />
      </div>

      {isRenaming ? (
        <InlineRenameField
          value={renameValue}
          onChange={onRenameChange}
          onSave={(value) => onRenameCommit(pkg, value)}
          onCancel={onRenameCancel}
          ariaLabel={t.saveTitleAriaLabel}
        />
      ) : (
        <span className={`font-serif-text text-lg font-semibold leading-tight ${pkg.read_only ? 'text-slate' : 'text-ink'}`}>
          {pkg.title}
        </span>
      )}
      {isRenaming && <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-stone">{t.libraryRenameHelper}</p>}

      {companyCity && <span className="text-sm text-muted">{companyCity}</span>}

      <div className="h-px bg-hair" />

      <div className="flex flex-wrap items-center gap-1.5">
        <MonoBadge>LL</MonoBadge>
        {pkg.anschreiben ? <MonoBadge>AS</MonoBadge> : <MonoBadge variant="ghost">AS fehlt</MonoBadge>}
        {pkg.job_posting ? (
          <MonoBadge>STELLENANZEIGE</MonoBadge>
        ) : (
          <MonoBadge variant="ghost">STELLENANZEIGE fehlt</MonoBadge>
        )}
        {pkg.read_only ? (
          <MonoBadge variant="readonly">{t.libraryReadonlyBadge}</MonoBadge>
        ) : anyReadOnly ? (
          <MonoBadge variant="editable">{t.libraryEditableBadge}</MonoBadge>
        ) : null}
      </div>
    </div>
  )
}

function SavedPackagesSection({ userId }: { userId: string }) {
  const { t } = useLang()
  const [packages, setPackages] = useState<ApplicationPackageRow[] | null>(null)
  const [filter, setFilter] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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

  function handleRenameStart(pkg: ApplicationPackageRow) {
    setRenamingId(pkg.id)
    setRenameValue(pkg.title)
  }

  function handleRenameCancel() {
    setRenamingId(null)
    setRenameValue('')
  }

  async function handleRenameCommit(pkg: ApplicationPackageRow, value: string) {
    const trimmed = value.trim()
    setRenamingId(null)
    if (!trimmed || trimmed === pkg.title) return
    await updatePackageTitle(getSupabaseBrowserClient(), pkg.id, trimmed)
    await refresh()
  }

  // /konto has no tool reducer state to load into - open/duplicate hand off to
  // /app via a plain query-string bridge that AppShell reads once on mount.
  function handleOpen(pkg: ApplicationPackageRow) {
    window.location.assign(`/app?package=${pkg.id}&action=open`)
  }

  function handleDuplicate(pkg: ApplicationPackageRow) {
    window.location.assign(`/app?package=${pkg.id}&action=duplicate`)
  }

  const filtered = useMemo(() => {
    if (!packages) return null
    const needle = filter.trim().toLowerCase()
    if (!needle) return packages
    return packages.filter((pkg) => {
      const companyCity = packageCompanyCity(pkg) ?? ''
      return pkg.title.toLowerCase().includes(needle) || companyCity.toLowerCase().includes(needle)
    })
  }, [packages, filter])

  const anyReadOnly = packages?.some((pkg) => pkg.read_only) ?? false

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className={EYEBROW}>{t.libraryTitle}</p>
        <a href="/app" className={btnClass('secondary', 'sm')}>
          {t.libraryNewCta}
        </a>
      </div>

      {packages === null ? (
        <p className="text-muted">{t.kontoLoading}</p>
      ) : packages.length === 0 ? (
        <EmptyState
          status={t.libraryEmptyStatus}
          body={t.libraryEmptyBody}
          ctaLabel={t.libraryEmptyCta}
          ctaHref="/app"
        />
      ) : (
        <>
          {anyReadOnly && <p className="text-sm text-muted">{t.libraryReadonlyBanner}</p>}

          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t.libraryFilterPlaceholder}
            aria-label={t.libraryFilterPlaceholder}
            className="w-full max-w-xs rounded-md border border-hair bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none sm:w-72"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(filtered ?? []).map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                anyReadOnly={anyReadOnly}
                isRenaming={renamingId === pkg.id}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameStart={handleRenameStart}
                onRenameCommit={handleRenameCommit}
                onRenameCancel={handleRenameCancel}
                onOpen={handleOpen}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <div className="flex items-start gap-2 border-t border-hair pt-4 text-sm text-muted">
            <LockGlyph />
            <span>
              {t.libraryFooterContents}{' '}
              <a href="/datenschutz" className="underline" lang="de">
                {t.humanizerPrivacyLink}
              </a>
            </span>
          </div>
        </>
      )}
    </section>
  )
}

/**
 * "Meine Lebenslaeufe" section (design surface 07, 1a): lists the signed-in
 * user's saved CVs (`cvs` table rows) below SavedPackagesSection. Modeled
 * directly on SavedPackagesSection -- run-once refresh effect, EmptyState
 * when empty, SheetCard + MonoBadge + KebabMenu + InlineRenameField per card.
 * The per-CV usage count is derived client-side from the already-fetched
 * `listPackages()` rows grouped by cv_id (same "derive from rows already in
 * scope" convention as packageCompanyCity above), not a new query.
 *
 * Deleting a CV never touches application_packages: migration 0004 re-created
 * that FK as `on delete set null`, so every package that referenced this CV
 * keeps its own already-saved lebenslauf/anschreiben snapshot and simply
 * loses the live cv_id link (T-08-11 in 08-03's threat register).
 */
function CvSection({ userId }: { userId: string }) {
  const { t } = useLang()
  const [cvs, setCvs] = useState<CvRow[] | null>(null)
  const [packages, setPackages] = useState<ApplicationPackageRow[]>([])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  async function refresh() {
    const client = getSupabaseBrowserClient()
    const [cvRows, packageRows] = await Promise.all([
      listCvs(client, userId),
      listPackages(client, userId),
    ])
    setCvs(cvRows)
    setPackages(packageRows)
  }

  useEffect(() => {
    // One-shot Supabase read on mount, same accepted pattern as the sibling
    // sections' own refresh effects above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    // Deliberately runs once per mount: userId is stable for the lifetime of
    // this page, same convention as SavedPackagesSection's own refresh effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function usageCount(cvId: string): number {
    return packages.filter((pkg) => pkg.cv_id === cvId).length
  }

  function handleRenameStart(cv: CvRow) {
    setRenamingId(cv.id)
    setRenameValue(cv.title)
  }

  function handleRenameCancel() {
    setRenamingId(null)
    setRenameValue('')
  }

  async function handleRenameCommit(cv: CvRow, value: string) {
    const trimmed = value.trim()
    setRenamingId(null)
    if (!trimmed || trimmed === cv.title) return
    await updateCvTitle(getSupabaseBrowserClient(), cv.id, trimmed)
    await refresh()
  }

  async function handleDelete(cv: CvRow) {
    if (!window.confirm(`${t.cvsMenuDelete}? ${t.cvsDeleteNote}`)) return
    // Deletes only the cvs row itself (RLS cvs_delete_own scopes it to the
    // owner). Never issues an application_packages write -- see the section
    // doc-comment above for why that is safe by design.
    await getSupabaseBrowserClient().from('cvs').delete().eq('id', cv.id)
    await refresh()
  }

  // Same cross-page bridge convention as SavedPackagesSection's handleOpen/
  // handleDuplicate: /konto has no tool reducer of its own, so reuse hands
  // off to /app via the ?cv= query-string bridge AppShell reads once on
  // mount (08-03 Task 1). "Neue Bewerbung mit diesem CV" and "Ansehen" both
  // land on the same bridge -- viewing a CV IS loading it into the tool.
  function handleReuse(cv: CvRow) {
    window.location.assign(`/app?cv=${cv.id}`)
  }

  return (
    <section className="flex flex-col gap-4">
      <p className={EYEBROW}>{t.cvsHeading}</p>

      {cvs === null ? (
        <p className="text-muted">{t.kontoLoading}</p>
      ) : cvs.length === 0 ? (
        <EmptyState
          status={t.cvsEmptyStatus}
          body={t.cvsEmptyBody}
          ctaLabel={t.cvsEmptyCta}
          ctaHref="/app"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cvs.map((cv) => (
            <CvCard
              key={cv.id}
              cv={cv}
              usageCount={usageCount(cv.id)}
              isRenaming={renamingId === cv.id}
              renameValue={renameValue}
              onRenameChange={setRenameValue}
              onRenameStart={handleRenameStart}
              onRenameCommit={handleRenameCommit}
              onRenameCancel={handleRenameCancel}
              onReuse={handleReuse}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/** One CV card: mono Stand date + kebab, serif title (or inline rename), a
 * hairline, and a usage-count line. Kebab lists the reuse action first (the
 * 07 mockup's primary action), then Ansehen, Umbenennen, and a destructive
 * Loeschen whose confirm dialog carries the "Bewerbungen behalten ihre
 * Kopie" note. */
function CvCard({
  cv,
  usageCount,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onReuse,
  onDelete,
}: {
  cv: CvRow
  usageCount: number
  isRenaming: boolean
  renameValue: string
  onRenameChange: (value: string) => void
  onRenameStart: (cv: CvRow) => void
  onRenameCommit: (cv: CvRow, value: string) => void
  onRenameCancel: () => void
  onReuse: (cv: CvRow) => void
  onDelete: (cv: CvRow) => void
}) {
  const { t } = useLang()

  const items: KebabMenuItem[] = [
    { label: t.cvsMenuNewApplication, onSelect: () => onReuse(cv) },
    { label: t.cvsMenuView, onSelect: () => onReuse(cv) },
    { label: t.libraryMenuRename, onSelect: () => onRenameStart(cv) },
    { label: t.cvsMenuDelete, onSelect: () => onDelete(cv), destructive: true },
  ]

  return (
    <div className={`${SheetCard} flex flex-col gap-2.5 px-5 py-4`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
          {t.cvsStandLabel(new Date(cv.updated_at).toLocaleDateString('de-DE'))}
        </span>
        <KebabMenu items={items} ariaLabel={t.libraryMenuAriaLabel(cv.title)} />
      </div>

      {isRenaming ? (
        <InlineRenameField
          value={renameValue}
          onChange={onRenameChange}
          onSave={(value) => onRenameCommit(cv, value)}
          onCancel={onRenameCancel}
          ariaLabel={t.saveTitleAriaLabel}
        />
      ) : (
        <span className="font-serif-text text-lg font-semibold leading-tight text-ink">{cv.title}</span>
      )}
      {isRenaming && (
        <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-stone">{t.libraryRenameHelper}</p>
      )}

      <div className="h-px bg-hair" />

      <div className="flex items-center justify-between gap-2">
        <MonoBadge>LL</MonoBadge>
        <span className="text-sm text-muted">{t.cvsUsage(usageCount)}</span>
      </div>
    </div>
  )
}

function LockGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-accent"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function SubscriptionSection({ userId }: { userId: string }) {
  const { t } = useLang()
  const [sub, setSub] = useState<SubscriptionRow | null | undefined>(undefined)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    client
      .from('subscriptions')
      .select('stripe_subscription_id,status,current_period_end')
      // Explicit user_id filter as defense-in-depth, matching every sibling
      // Stage 3 read in this file (listPackages, getActivePass/getLatestPass,
      // listPaketPurchases): RLS is expected to scope this already, but a
      // client-side backstop means a loosened policy fails closed instead of
      // silently returning another user's subscription row.
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSub((data as SubscriptionRow | null) ?? null))
    // Deliberately runs once per mount: userId is stable for the lifetime of
    // this page, same convention as the sibling sections' own refresh effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
