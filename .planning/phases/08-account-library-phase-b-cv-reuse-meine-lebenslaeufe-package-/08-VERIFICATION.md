---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
verified: 2026-07-21T00:00:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 5/6
  gaps_closed:
    - "Package status ships via a new migration applied to the live Frankfurt project with the same MCP + advisor runbook (SC-03, second clause)"
  gaps_remaining: []
  regressions: []
---

# Phase 8: Account Library Phase B Verification Report

**Phase Goal:** The three Phase-B design surfaces (07-lebenslaeufe, 08-status, 09-plus) are reconciled into the live app behind the existing Stage 3 env gates: the save flow offers attach-to-existing-CV vs save-as-new, /konto gains a "Meine Lebenslaeufe" section with usage counts and rename/delete that never touches packages, every package card carries an editable status chip, and /konto shows the full Plus subscription lifecycle (cancelled-but-running and expired states plus a Kuendigung-zuruecknehmen route). Plus stays "Geplant" non-buyable; the renewal-reminder email stays a flagged founder gate. Everything inert until founder keys exist.

**Verified:** 2026-07-21
**Status:** passed
**Re-verification:** Yes, after gap closure (previous run 2026-07-19, status gaps_found, score 5/6)

## Goal Achievement

### Observable Truths (mapped to ROADMAP SC-01..SC-06)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC-01: Save flow CV reuse (attach-or-new radio, >80% overlap preselect, attach reuses cvs row id with no new insert, save-as-new inserts one, packages keep snapshotting) | VERIFIED | Regression check only (no code change since last run). `scanready/src/lib/account.ts` `saveApplicationPackage` ATTACH branch skips the `cvs` insert and uses `input.existingCvId`; SAVE-AS-NEW branch inserts a `cvs` row then the package. `scanready/src/lib/cv-overlap.ts` provides `cvOverlapRatio`/`bestCvMatch`/`CV_ATTACH_THRESHOLD` (0.8). Radio UI wired in `page.tsx`'s `SaveApplicationButton`. Confirmed unchanged: `git log 49a8785..HEAD` touches only `.planning/` and `scanready/docs/stage3-accounts.md`, no `src/` files |
| 2 | SC-02: "Meine Lebenslaeufe" on /konto with usage count, inline rename, delete that never touches packages | VERIFIED | Regression check only (no code change since last run). `KontoClient.tsx` `CvSection` derives `usageCount(cvId)` client-side from `listPackages`; delete only issues `.from('cvs').delete()`, never touches `application_packages`; package-safety now additionally guaranteed at the DB layer by migration 0004's `ON DELETE SET NULL` FK (closed this round, see truth 3) |
| 3 | SC-03: Nullable status column ships via a new migration applied to the live Frankfurt project with the same MCP + advisor runbook; chip renders on both galleries; dropdown never cycles; auto-suggest beworben with undo; editable on read_only rows via safe RPC path | VERIFIED (code half regression + infra half newly closed) | Code half unchanged since last run (`set_package_status` RPC caller in `account.ts`, `StatusChip` in both galleries, auto-suggest/undo in `page.tsx`, all previously verified and no `src/` diff since). Infra half: `scanready/docs/stage3-accounts.md` line 68 entry (commit `b444ab3`) records `mcp__supabase__apply_migration` against project `thgmhbzimnjcaoqyyiyp` returned `success: true` on 2026-07-20, and live verification confirmed the `status` column + `application_packages_status_check` CHECK exist, `set_package_status` exists with EXECUTE granted only to `authenticated` (zero anon/PUBLIC grants), the `cv_id` FK has `confdeltype = 'n'` (SET NULL) and `cv_id` is nullable, and `subscriptions.cancel_at_period_end` exists with default `false`. Rolled-back behavioral probes (zero residue) confirmed the status CHECK accepts `'beworben'` and rejects an invalid key, and a package row survives deletion of its `cvs` row with `cv_id` set to null. Security advisors show the two pre-existing WARNs plus one new EXPECTED, documented exception (`set_package_status` flagged by the same authenticated-security-definer lint as `delete_own_account`, safe by construction: authenticated-only grant + in-body `auth.uid()` ownership check + single-column update + input validation). 08-01-SUMMARY.md corroborates with matching commit hashes (`407b0fe`, `b5611b3`, `b444ab3`) and a self-check block confirming all four commits exist |
| 4 | SC-04: Plus lifecycle (cancelled-but-running + expired states, un-cancel route, /kuendigen and cancel flow untouched, Plus stays Geplant, reminder email not built) | VERIFIED | Regression check only (no code change since last run). `reactivate/route.ts` guard order matches `cancel/route.ts`; `KontoClient.tsx` derives `isCancelling`/`isExpired`; `preise/page.tsx` and `KontoClient.tsx` keep Plus non-buyable "Geplant"; reminder email still not built anywhere, flagged founder gate per `stage3-accounts.md` |
| 5 | SC-05: DE/EN copy lifted verbatim, no em-dash anywhere, new German copy flagged for native-speaker review | VERIFIED | Regression check: em-dash grep across all phase-touched files (unchanged set since last run) still returns zero matches; the new stage3-accounts.md 0004-applied entry was also grepped and contains no em-dash |
| 6 | SC-06: tsc/tests/build pass; new surfaces inert when env vars unset; anonymous/explicit-save-only/no-photos/grounded-only guardrails untouched | VERIFIED | Re-run at this verification: `npx tsc --noEmit` exit 0. `npm test` 142/142 passing. `accountsEnabled()` gating unchanged (no `src/` diff since last run) |

**Score:** 6/6 truths verified. The single prior gap (SC-03's live-migration clause) is closed with direct evidence from the project's canonical runbook (`stage3-accounts.md`) plus the plan's own SUMMARY and self-check block.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scanready/src/lib/cv-overlap.ts` | `cvOverlapRatio`, `bestCvMatch`, `CV_ATTACH_THRESHOLD` | VERIFIED | Unchanged since last run, regression-checked |
| `scanready/src/lib/account.ts` | attach path, `listCvs`, `updateCvTitle`, `setPackageStatus`, `getPackage` with userId filter | VERIFIED | Unchanged since last run, regression-checked |
| `scanready/src/app/app/page.tsx` | attach-or-new radio, `?cv=` bridge, StatusChip + auto-suggest | VERIFIED | Unchanged since last run, regression-checked |
| `scanready/src/app/konto/KontoClient.tsx` | CvSection, StatusChip wiring, cancelled/expired Plus states | VERIFIED | Unchanged since last run, regression-checked |
| `scanready/src/components/ui.tsx` | `StatusChip` primitive | VERIFIED | Unchanged since last run, regression-checked |
| `scanready/src/app/api/subscription/reactivate/route.ts` | un-cancel POST route | VERIFIED | Unchanged since last run, regression-checked |
| `scanready/supabase/migrations/0004_library_phase_b.sql` | status column+CHECK, `set_package_status` RPC+grant-hardening, `cv_id` nullable+ON DELETE SET NULL, `subscriptions.cancel_at_period_end` | VERIFIED (file + live apply) | File content correct (unchanged); live apply now confirmed via `stage3-accounts.md` line 68 entry (`success: true`, all four objects live-verified) |
| `scanready/docs/stage3-accounts.md` | 0004 apply + advisor runbook entry | VERIFIED | Entry updated (commit `b444ab3`) from PENDING/blocked to applied, advisor-clean, with full probe results |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| SaveApplicationButton radio | `saveApplicationPackage` | `existingCvId` param | WIRED | Regression-checked, no `src/` diff since last run |
| StatusChip (both galleries) | `set_package_status` RPC | `setPackageStatus()` | WIRED | Regression-checked, no `src/` diff since last run |
| CV delete (KontoClient) | migration 0004 FK | `ON DELETE SET NULL` | WIRED (now live) | UI code only deletes from `cvs`; the FK's live behavior is now confirmed by the stage3-accounts.md probe ("a package row survives deletion of its cvs row with cv_id set to null") -- this is the exact item the prior run flagged as file-level only |
| KontoClient un-cancel button | `/api/subscription/reactivate` | `fetch POST` + `refresh()` | WIRED | Regression-checked, no `src/` diff since last run |
| webhook upsert | `subscriptions.cancel_at_period_end` | `mapStripeSubscription(...).cancel_at_period_end` | WIRED (live) | Code writes the field; the live DB column is now confirmed present with default `false` per the stage3-accounts.md 0004 entry |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite passes | `npm test` (run once, this verification) | 142/142 pass | PASS |
| Typecheck passes | `npx tsc --noEmit` (run once, this verification) | exit 0 | PASS |
| No `src/` file changed since last verification | `git log 49a8785..HEAD --name-only` | only `.planning/*` and `scanready/docs/stage3-accounts.md` touched | PASS |
| Migration 0004 live apply | N/A (Supabase MCP not available to this verifier; treating `stage3-accounts.md` as the canonical runbook record per task constraints) | `mcp__supabase__apply_migration` returned `success: true`; column/RPC/FK/grant/probe results recorded in full | PASS (evidence-based, not independently re-run) |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|--------------|----------------|--------------|--------|----------|
| SC-01 | 08-02 | Save flow CV reuse | SATISFIED | See truth #1 |
| SC-02 | 08-03 | Meine Lebenslaeufe section | SATISFIED | See truth #2 |
| SC-03 | 08-01, 08-04 | Package status column + RPC + chip, live migration apply | SATISFIED | See truth #3 -- both code half and live-migration half now closed |
| SC-04 | 08-05 | Plus lifecycle | SATISFIED | See truth #4 |
| SC-05 | all plans | i18n copy, no em-dash | SATISFIED | See truth #5 |
| SC-06 | all plans | tsc/tests/build, env-gating, guardrails | SATISFIED | See truth #6 |

No orphaned requirements found -- all Phase 8 SCs map to at least one plan's `requirements` field.

### Anti-Patterns Found

None. No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any of the phase-touched files (regression-checked; no new files added since last run other than doc updates, which were also checked and contain none).

### Gap Closure Detail (this re-verification)

The prior run's single gap was: "migration 0004's live apply to the Frankfurt Supabase project has not happened" (project was paused on the free tier). This is now closed:

1. **Founder action**: the paused Frankfurt project (`thgmhbzimnjcaoqyyiyp`) was restored via the Supabase dashboard (2026-07-20/21).
2. **Async backup landing**: immediately after restore the database came up with platform schemas only (zero public tables, zero auth users); the orchestrator correctly waited rather than rebuilding, and the full pre-pause state (0001-0003 objects, founder auth user) returned on its own. This is recorded in both `stage3-accounts.md` and `08-01-SUMMARY.md`'s Checkpoint Resolution section, consistently.
3. **Migration applied**: `mcp__supabase__apply_migration` against 0004's contents returned `success: true`.
4. **Live verification**: status column + CHECK, `set_package_status` (authenticated-only grant), `cv_id` FK (`confdeltype='n'`, nullable), and `subscriptions.cancel_at_period_end` (default false) all confirmed present.
5. **Behavioral probes** (rolled back, zero residue): CHECK constraint accepts a valid status key and rejects an invalid one; a package survives its parent CV's deletion with `cv_id` nulled.
6. **Security advisors**: two known pre-existing WARNs plus one new EXPECTED WARN (`set_package_status`, same lint class as the already-accepted `delete_own_account` exception), documented as an accepted exception with the same justification pattern used in Phase 7.

This verifier has no direct Supabase MCP access and, per task constraints, treats `scanready/docs/stage3-accounts.md` as the project's canonical runbook record for the DB layer -- the same standing this file has held for every prior migration (0001-0003, 0002_pass, 0003_pass_requires_user_fix) in this project's verification history. The record is internally consistent with `08-01-SUMMARY.md` (matching commit hashes `407b0fe`, `b5611b3`, `b444ab3`, plus a self-check block that confirms each commit exists) and with `.planning/ROADMAP.md`'s Phase 8 completion line ("completed 2026-07-21").

No regressions: `git log 49a8785..HEAD` (the range since the prior verification's own commit) touches only `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/phases/08-.../08-01-SUMMARY.md`, and `scanready/docs/stage3-accounts.md` -- zero `scanready/src/` changes, so all five previously-VERIFIED truths carry forward on regression check alone, and the full test suite (142/142) and `tsc --noEmit` (exit 0) both re-confirm clean at this verification.

### Human Verification Required

None blocking. One optional founder follow-up remains, carried forward from the prior run as a nice-to-have, not a gap:

1. **Live E2E walkthrough of the new surfaces against the restored project.** Test: with the founder's own account (or a disposable test user), walk the attach-vs-new save flow, /konto CV rename/delete, status chip writes across both galleries, and the Plus reactivate route once end-to-end in the real UI against the now-live Frankfurt project, the way the 2026-07-06 Stage 3 E2E was done for 0001-0003. Expected: all writes succeed and match the code paths and DB-level probe results already confirmed here. Why human: this is a UI/UX confidence pass (does it *feel* right end-to-end through real browser interaction), not a correctness question -- the schema, RLS, grants, and constraint behavior have already been directly probed and verified at the DB layer in `stage3-accounts.md`. Optional founder follow-up before public launch, not a blocker to marking this phase passed.

### Gaps Summary

None. All 6 roadmap Success Criteria are verified. The prior run's one gap (SC-03's live-migration clause) is closed with direct, itemized evidence from the project's canonical Supabase runbook (`stage3-accounts.md`), cross-checked against `08-01-SUMMARY.md`'s matching commit hashes and self-check block, and against a regression check confirming zero `src/` changes since the prior verification (so nothing else could have silently broken in between). `npm test` (142/142) and `npx tsc --noEmit` (exit 0) were both re-run fresh at this verification and pass clean.

---

_Verified: 2026-07-21_
_Verifier: Claude (gsd-verifier)_
