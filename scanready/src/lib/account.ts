import type { SupabaseClient } from "@supabase/supabase-js";
// Explicit .ts extensions: plain `node --test` (this project's test runner)
// resolves bare ESM relative imports strictly (no extension-guessing) even
// though Next's own bundler and `tsc --moduleResolution bundler` both accept
// the extensionless form. Same rationale as src/lib/abuse-guards.ts.
import { accountsEnabled } from "./supabase/config.ts";
import type { Lebenslauf } from "./schema.ts";
import type { AnswerEntry } from "./abuse-guards.ts";

/**
 * Typed data helpers for Stage 3 accounts (saved application packages).
 * Consumed by the follow-up UI integration task; this file only defines the
 * contract and the Supabase calls behind it.
 *
 * Every helper takes the caller's already-constructed Supabase client (the
 * browser one from src/lib/supabase/client.ts in practice) rather than
 * constructing its own, so callers control whether they're on the server or
 * client and so tests could inject a fake without touching module state.
 *
 * accountsEnabled() gate: every helper checks it first and returns a safe
 * no-op result (never throws, never touches Supabase) when accounts are off.
 * This mirrors the fail-open convention in abuse-guards.ts / stripe.ts: the
 * anonymous flow must be able to import this module and call nothing in it
 * without any behavior change.
 */

// The Postgres error code raised by the enforce_package_limit() trigger
// (supabase/migrations/0001_stage3_accounts.sql) via `raise exception
// 'package_limit' using errcode = 'P0001'`. P0001 is Postgres's generic
// "raise_exception" code; the message text itself ('package_limit') is what
// this project uses to distinguish it from any other P0001 in the future.
const PACKAGE_LIMIT_MESSAGE = "package_limit";

export type ApplicationPackageRow = {
  id: string;
  user_id: string;
  cv_id: string;
  title: string;
  job_posting: string | null;
  answers: AnswerEntry[];
  lebenslauf: Lebenslauf;
  anschreiben: string | null;
  read_only: boolean;
  created_at: string;
  updated_at: string;
};

export type SaveApplicationPackageInput = {
  cvTitle?: string;
  cvText: string;
  packageTitle?: string;
  jobPosting: string | null;
  answers: AnswerEntry[];
  lebenslauf: Lebenslauf;
  anschreiben: string | null;
};

export type SaveResult =
  | { ok: true; packageId: string }
  | { ok: false; reason: "limit" }
  | { ok: false; reason: "error"; message: string };

/**
 * Maps a Postgres error thrown by the enforce_package_limit() trigger to a
 * typed { ok: false, reason: 'limit' } result. Pure function (no I/O) so it
 * gets a direct unit test; see src/lib/__tests__/account.test.ts.
 *
 * Supabase surfaces trigger exceptions as a PostgrestError with `message`
 * set to the RAISE EXCEPTION text and `code` set to the SQLSTATE
 * (errcode). We match on message text since that's what the migration's
 * `raise exception 'package_limit'` actually sets; code alone (P0001) is
 * Postgres's generic raise code and not specific enough on its own.
 */
export function mapSaveError(error: { message?: string | null } | null | undefined): SaveResult {
  if (error?.message?.includes(PACKAGE_LIMIT_MESSAGE)) {
    return { ok: false, reason: "limit" };
  }
  return { ok: false, reason: "error", message: error?.message ?? "unknown_error" };
}

/**
 * Saves one application package for the signed-in user: upserts the CV text
 * as a `cvs` row, then inserts an `application_packages` row pointing at it.
 * The free/paid boundary (D4: 1 free package, 2+ needs an active
 * subscription) is enforced by the database trigger, not here -- this
 * function only translates the resulting success/limit/error into a typed
 * result the UI can branch on without parsing Postgres error text itself.
 */
export async function saveApplicationPackage(
  client: SupabaseClient,
  userId: string,
  input: SaveApplicationPackageInput
): Promise<SaveResult> {
  if (!accountsEnabled()) return { ok: false, reason: "error", message: "accounts_disabled" };

  const { data: cv, error: cvError } = await client
    .from("cvs")
    .insert({
      user_id: userId,
      title: input.cvTitle ?? "Lebenslauf",
      cv_text: input.cvText,
    })
    .select("id")
    .single();

  if (cvError || !cv) {
    return { ok: false, reason: "error", message: cvError?.message ?? "cv_insert_failed" };
  }

  const { data: pkg, error: pkgError } = await client
    .from("application_packages")
    .insert({
      user_id: userId,
      cv_id: cv.id,
      title: input.packageTitle ?? "Bewerbung",
      job_posting: input.jobPosting,
      answers: input.answers,
      lebenslauf: input.lebenslauf,
      anschreiben: input.anschreiben,
    })
    .select("id")
    .single();

  if (pkgError || !pkg) {
    // The cvs row above was already inserted, but the package insert was
    // rejected (e.g. by the enforce_package_limit trigger) -- without this
    // delete, that cvs row would be orphaned and leak the full CV text.
    // Best-effort only: a failure here must never change the SaveResult
    // returned to the caller, so its outcome is intentionally ignored.
    await client.from("cvs").delete().eq("id", cv.id);
    return mapSaveError(pkgError);
  }

  return { ok: true, packageId: pkg.id };
}

/** Lists the signed-in user's saved application packages, newest first. */
export async function listPackages(
  client: SupabaseClient,
  userId: string
): Promise<ApplicationPackageRow[]> {
  if (!accountsEnabled()) return [];

  const { data, error } = await client
    .from("application_packages")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listPackages error", error.message);
    return [];
  }
  return (data ?? []) as ApplicationPackageRow[];
}

/** Fetches a single saved application package by id (RLS scopes it to the owner). */
export async function getPackage(
  client: SupabaseClient,
  packageId: string
): Promise<ApplicationPackageRow | null> {
  if (!accountsEnabled()) return null;

  const { data, error } = await client
    .from("application_packages")
    .select("*")
    .eq("id", packageId)
    .maybeSingle();

  if (error) {
    console.error("getPackage error", error.message);
    return null;
  }
  return (data as ApplicationPackageRow | null) ?? null;
}

/** Deletes a saved application package (RLS scopes it to the owner; no-op on other users' rows). */
export async function deletePackage(
  client: SupabaseClient,
  packageId: string
): Promise<{ ok: boolean; message?: string }> {
  if (!accountsEnabled()) return { ok: false, message: "accounts_disabled" };

  const { error } = await client.from("application_packages").delete().eq("id", packageId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Deletes the signed-in user's entire account (GDPR Art. 17) by calling the
 * delete_own_account() RPC defined in the migration. That function is
 * security definer and deletes strictly `auth.users where id = auth.uid()`
 * -- there is no client-side path to delete any other user's account, and
 * no client-side code ever touches the service role key. Cascades (see
 * migration comments) remove profiles/cvs/application_packages/subscriptions;
 * humanizer_purchases rows survive with user_id set to null (receipt/
 * accounting history retained deliberately).
 */
export async function deleteAccount(
  client: SupabaseClient
): Promise<{ ok: boolean; message?: string }> {
  if (!accountsEnabled()) return { ok: false, message: "accounts_disabled" };

  const { error } = await client.rpc("delete_own_account");
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
