"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountsEnabled } from "./config";

/**
 * Browser Supabase client, constructed lazily and memoized. Cookie handling
 * is left to @supabase/ssr's built-in document.cookie fallback (we do not
 * pass a custom `cookies` object): that is the supported zero-config path
 * for browser clients per the library's own types/docs.
 *
 * Callers MUST check accountsEnabled() before calling this (AccountProvider
 * does). Calling it with env unset throws, by design: this file must never
 * be the thing that silently no-ops, because a thrown error during
 * development is far easier to catch than a client that pretends to work.
 *
 * Return type is annotated explicitly as SupabaseClient (rather than left as
 * `ReturnType<typeof createBrowserClient>`): createBrowserClient is
 * overloaded (a current getAll/setAll signature plus a deprecated
 * get/set/remove one), and TS's inferred ReturnType over that overload set
 * loses precision, silently widening callback parameters like
 * `onAuthStateChange`'s (event, session) to `any`. The explicit annotation
 * pins it to the real client type.
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!accountsEnabled()) {
    throw new Error(
      "Supabase env not set: guard call sites with accountsEnabled() first."
    );
  }
  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
