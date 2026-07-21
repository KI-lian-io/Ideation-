import type { Metadata } from 'next'
import { LangProvider } from '@/lib/i18n'
import { KontoClient } from './KontoClient'

export const metadata: Metadata = { title: 'Konto: ScanReady' }

/**
 * Server wrapper for /konto (Stage 3 accounts dashboard). Wrapped in
 * LangProvider like /app so i18n works; the interactive body is a client
 * component (KontoClient) since it needs useAccount()/browser Supabase calls.
 */
export default function KontoPage() {
  return (
    <LangProvider>
      <KontoClient />
    </LangProvider>
  )
}
