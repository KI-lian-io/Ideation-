import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { accountsEnabled } from "./config";

/**
 * Server-side Supabase client for Route Handlers and Server Components.
 * Next.js 16's `cookies()` is async (see node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/cookies.md), so this factory is async too.
 *
 * Per @supabase/ssr's current (non-deprecated) contract, cookie access must
 * be wired through `getAll`/`setAll` (not the old get/set/remove trio).
 * `setAll` can fail when called from a Server Component (cookies are
 * read-only there); Supabase's own guidance is to swallow that error because
 * session refresh is still handled by middleware/route handlers elsewhere in
 * the request lifecycle. This project has no middleware, so `setAll` only
 * ever actually writes from within the /auth/callback route handler, where
 * cookie mutation is allowed.
 *
 * A new client MUST be created per request (never module-scoped) per
 * @supabase/ssr's own docs, because it closes over this request's cookies.
 *
 * Callers MUST check accountsEnabled() before calling this.
 */
export async function getSupabaseServerClient() {
  if (!accountsEnabled()) {
    throw new Error(
      "Supabase env not set: guard call sites with accountsEnabled() first."
    );
  }
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render (cookies are read-only
            // there). Safe to ignore: this app has no middleware, and the
            // only write path that matters is /auth/callback, a Route
            // Handler, where cookies() is writable.
          }
        },
      },
    }
  );
}
