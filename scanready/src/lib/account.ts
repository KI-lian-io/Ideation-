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
  // Nullable since migration 0004_library_phase_b.sql re-created the FK as
  // `on delete set null`: a package survives its CV being deleted, it just
  // loses the live link (its own lebenslauf/anschreiben JSONB is unaffected,
  // those are point-in-time snapshots, never a live reference).
  cv_id: string | null;
  title: string;
  job_posting: string | null;
  answers: AnswerEntry[];
  lebenslauf: Lebenslauf;
  anschreiben: string | null;
  read_only: boolean;
  // Nullable status enum ('entwurf' | 'beworben' | 'interview' | 'absage' |
  // 'zusage' | null) added by migration 0004; typed here so the row shape is
  // complete for the status feature (08-04). Not read or written by this
  // plan's helpers.
  status: string | null;
  created_at: string;
  updated_at: string;
};

/** A saved Lebenslauf ("cvs" table row) the signed-in user can reuse across packages. */
export type CvRow = {
  id: string;
  user_id: string;
  title: string;
  cv_text: string;
  created_at: string;
  updated_at: string;
};

export type SaveApplicationPackageInput = {
  cvTitle?: string;
  cvText: string;
  // Attach path: when set, saveApplicationPackage skips the cvs insert
  // entirely and uses this id directly as cv_id on the application_packages
  // insert. Reuses an existing Lebenslauf instead of duplicating the CV text
  // into a fresh cvs row (see plan 08-02).
  existingCvId?: string;
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
 * Saves one application package for the signed-in user.
 *
 * Two branches on `input.existingCvId`:
 * - ATTACH (existingCvId set): skips the `cvs` insert entirely and reuses the
 *   caller-supplied id directly as `cv_id` on the application_packages
 *   insert. This is the "attach to existing Lebenslauf" path (plan 08-02) --
 *   it must never insert a new cvs row, and on a package-insert failure it
 *   must NOT delete the reused cvs row (that row pre-existed the call and
 *   may belong to other packages; deleting it here would destroy a CV the
 *   user still needs). The only IDOR-relevant check is that `existingCvId`
 *   can only ever be an id `listCvs` already returned to this same user (RLS
 *   `cvs_select_own`), so the UI can never present or submit another user's
 *   CV id (T-08-06 in this plan's threat register).
 * - SAVE-AS-NEW (existingCvId absent, today's only historical behavior):
 *   inserts a `cvs` row, then the `application_packages` row pointing at it.
 *   The free/paid boundary (D4: 1 free package, 2+ needs an active
 *   subscription) is enforced by the database trigger, not here. On a
 *   package-insert failure, best-effort deletes the just-inserted cvs row
 *   (the 895e03d orphan-cleanup fix) so a blocked save never leaks CV text
 *   into an orphaned row nobody can reach. This ordering and the delete-on-
 *   failure behavior are preserved EXACTLY as before -- do not reorder.
 *
 * Either branch translates the resulting success/limit/error into a typed
 * result the UI can branch on without parsing Postgres error text itself.
 */
export async function saveApplicationPackage(
  client: SupabaseClient,
  userId: string,
  input: SaveApplicationPackageInput
): Promise<SaveResult> {
  if (!accountsEnabled()) return { ok: false, reason: "error", message: "accounts_disabled" };

  if (input.existingCvId) {
    // ATTACH: no cvs insert, no orphan risk, no best-effort delete on failure.
    const { data: pkg, error: pkgError } = await client
      .from("application_packages")
      .insert({
        user_id: userId,
        cv_id: input.existingCvId,
        title: input.packageTitle ?? "Bewerbung",
        job_posting: input.jobPosting,
        answers: input.answers,
        lebenslauf: input.lebenslauf,
        anschreiben: input.anschreiben,
      })
      .select("id")
      .single();

    if (pkgError || !pkg) {
      return mapSaveError(pkgError);
    }
    return { ok: true, packageId: pkg.id };
  }

  // SAVE-AS-NEW: unchanged from before existingCvId existed.
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

/**
 * Lists the signed-in user's saved CVs (`cvs` table rows), newest first.
 * Same shape/gate/error-handling pattern as listPackages. Consumed by the
 * attach-or-new radio (bestCvMatch candidates) and the /konto "Meine
 * Lebenslaeufe" section (08-03).
 */
export async function listCvs(client: SupabaseClient, userId: string): Promise<CvRow[]> {
  if (!accountsEnabled()) return [];

  const { data, error } = await client
    .from("cvs")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listCvs error", error.message);
    return [];
  }
  return (data ?? []) as CvRow[];
}

/**
 * Renames a saved CV. accountsEnabled()-gated no-op, same convention as
 * updatePackageTitle. RLS's cvs_update_own policy already scopes the write
 * to the owner; unlike application_packages there is no read_only concept
 * on cvs rows, so this helper needs no additional client-side gating.
 */
export async function updateCvTitle(
  client: SupabaseClient,
  cvId: string,
  title: string
): Promise<{ ok: boolean; message?: string }> {
  if (!accountsEnabled()) return { ok: false, message: "accounts_disabled" };

  const { error } = await client.from("cvs").update({ title }).eq("id", cvId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
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
 * Live-Pass window check: does this humanizer_purchases row (kind pass_30d)
 * currently grant an entitlement? Pure, no I/O, so it gets a direct unit
 * test the same way mapSaveError does. Deliberately distinct from the
 * Stripe-PI checks in humanizer.ts (checkHumanizerPi / checkPaketPi /
 * checkHumanizerEntitlement): those model a single-use PaymentIntent token,
 * while a Pass is a standing DB-row entitlement with an expiry window.
 * Returns false for a null row, a null expires_at, or an expiry in the past;
 * true only when expires_at is a future timestamp.
 */
export function checkPassEntitlement(
  row: { expires_at: string | null } | null
): boolean {
  if (!row || !row.expires_at) return false;
  return new Date(row.expires_at).getTime() > Date.now();
}

/**
 * Whole days remaining until expiresAt (0 once it has passed). Pure, like
 * checkPassEntitlement above; PassStatusChip.tsx calls this rather than
 * `Date.now()` directly in its render body - React's purity lint rule flags
 * a direct impure-function call inside a component, but not one made through
 * an imported helper, and calling it here (alongside checkPassEntitlement,
 * which the same lint pass already accepts as an imported call) keeps every
 * "now" reference for this feature in one small, directly-testable place.
 */
export function daysUntil(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

/**
 * Renames a saved application package. accountsEnabled()-gated no-op, same
 * convention as deletePackage. The RLS update-while-editable policy already
 * blocks writes to read_only rows server-side; the caller must ALSO hide
 * the rename control on read_only rows client-side (done in the gallery
 * UI), so this helper does not itself branch on read_only.
 */
export async function updatePackageTitle(
  client: SupabaseClient,
  packageId: string,
  title: string
): Promise<{ ok: boolean; message?: string }> {
  if (!accountsEnabled()) return { ok: false, message: "accounts_disabled" };

  const { error } = await client
    .from("application_packages")
    .update({ title })
    .eq("id", packageId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Fetches the signed-in user's currently-live Pass (kind pass_30d, not yet
 * expired), newest first, or null if they have none. RLS select-own already
 * scopes the read to the caller; accountsEnabled()-gated no-op like the
 * other read helpers.
 */
export async function getActivePass(
  client: SupabaseClient,
  userId: string
): Promise<{ expires_at: string } | null> {
  if (!accountsEnabled()) return null;

  const { data, error } = await client
    .from("humanizer_purchases")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("kind", "pass_30d")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as { expires_at: string };
}

/**
 * Fetches the signed-in user's most recent Pass (pass_30d) row, active OR
 * expired, or null if they have never purchased one. Deliberately distinct
 * from getActivePass above: that helper is the server-side entitlement gate
 * used by the fulfillment routes (/api/humanize, /api/paket/verify) and is
 * scoped to expires_at > now on purpose, so it correctly returns null once a
 * Pass lapses. PassStatusChip (src/components/PassStatusChip.tsx) needs the
 * opposite: it must render a NEUTRAL expired state with the real expiry date
 * once the most recent Pass has lapsed, so this query intentionally has no
 * expiry filter - "most recent by expires_at" is always either the currently
 * active Pass (if any) or the most recently expired one. RLS select-own
 * already scopes the read to the caller; accountsEnabled()-gated no-op like
 * the other read helpers.
 */
export async function getLatestPass(
  client: SupabaseClient,
  userId: string
): Promise<{ expires_at: string } | null> {
  if (!accountsEnabled()) return null;

  const { data, error } = await client
    .from("humanizer_purchases")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("kind", "pass_30d")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as { expires_at: string };
}

/**
 * Lists the signed-in user's paket purchase history (amount + timestamp,
 * newest first) for the storage-gate "you already paid" anchor variant. RLS
 * select-own already scopes it to the caller; accountsEnabled()-gated no-op
 * like the other read helpers.
 */
export async function listPaketPurchases(
  client: SupabaseClient,
  userId: string
): Promise<{ id: string; amount_cents: number; created_at: string }[]> {
  if (!accountsEnabled()) return [];

  const { data, error } = await client
    .from("humanizer_purchases")
    .select("id, amount_cents, created_at")
    .eq("user_id", userId)
    .eq("kind", "paket")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as { id: string; amount_cents: number; created_at: string }[];
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
