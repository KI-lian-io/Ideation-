import { NextRequest, NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /auth/callback?code=...
 * Google OAuth (via Supabase Auth) redirects here with a `code` param after
 * the user consents. We exchange it for a session (sets the Supabase auth
 * cookies on the response) and send the user back into the tool.
 *
 * Guard: accounts are an opt-in layer that must be completely inert without
 * env vars (see src/lib/supabase/config.ts). If Supabase isn't configured,
 * this route must not exist in any observable sense, so it 404s rather than
 * revealing an auth surface or throwing a 500.
 */
export async function GET(req: NextRequest) {
  if (!accountsEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
    console.error("auth callback exchange error", error.message);
  }

  return NextResponse.redirect(`${origin}/app?auth_error=1`);
}
