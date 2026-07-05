'use client'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { accountsEnabled } from '@/lib/supabase/config'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Stage 3 accounts context. Exposes { user, loading, signInWithGoogle, signOut }
 * to any consumer without the consumer ever branching on accountsEnabled()
 * itself: when the env vars are unset, this provider renders children
 * untouched and hands out no-op stubs (loading: false, user: null, sign-in/out
 * that resolve to nothing). No Supabase client is constructed in that case,
 * so the anonymous, zero-retention flow is unaffected byte-for-byte.
 *
 * Mounted once in the root layout (src/app/layout.tsx), around {children}.
 */

type AccountContextValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const DISABLED_VALUE: AccountContextValue = {
  user: null,
  loading: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- accounts off: no-op by design
  signInWithGoogle: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- accounts off: no-op by design
  signOut: async () => {},
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const enabled = accountsEnabled()

  if (!enabled) {
    // No Supabase client is ever constructed on this path. Rendered as its
    // own branch (rather than an early return before hooks) would violate
    // the rules of hooks if `enabled` could change at runtime; it cannot
    // (env vars are fixed at build/deploy time), so a stable top-level
    // conditional is safe here and keeps the "inert until configured" guard
    // trivially auditable.
    return (
      <AccountContext.Provider value={DISABLED_VALUE}>{children}</AccountContext.Provider>
    )
  }

  return <EnabledAccountProvider>{children}</EnabledAccountProvider>
}

function EnabledAccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signOut }),
    [user, loading, signInWithGoogle, signOut]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider')
  return ctx
}
