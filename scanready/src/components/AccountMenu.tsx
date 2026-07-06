'use client'

/**
 * Compact top-bar account widget for Stage 3 accounts. Mirrors LangToggle's
 * placement/sizing (mono, small, top bar) in src/app/app/page.tsx.
 *
 * Renders nothing when accounts are disabled (accountsEnabled() false) or
 * while the auth state is still loading, so mounting this unconditionally in
 * a top bar never changes layout for the anonymous flow.
 */
import { useAccount } from './AccountProvider'
import { accountsEnabled } from '@/lib/supabase/config'
import { useLang } from '@/lib/i18n'

const itemClass =
  'font-mono text-xs uppercase tracking-[0.18em] px-1.5 py-1 min-h-[44px] flex items-center text-muted hover:text-ink transition-colors cursor-pointer'

export function AccountMenu() {
  const { t } = useLang()
  const { user, loading, signInWithGoogle, signOut } = useAccount()

  if (!accountsEnabled() || loading) return null

  if (!user) {
    return (
      <button type="button" onClick={() => signInWithGoogle()} className={itemClass}>
        {t.accountSignIn}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="hidden sm:inline max-w-[12rem] truncate font-mono text-xs text-muted"
        title={user.email ?? undefined}
      >
        {user.email}
      </span>
      <a href="/konto" className={itemClass}>
        {t.accountLink}
      </a>
      <button type="button" onClick={() => signOut()} className={itemClass}>
        {t.accountSignOut}
      </button>
    </div>
  )
}
