---
phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-
verified: 2026-07-19T00:00:00Z
status: gaps_found
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Package status ships via a new migration applied to the live Frankfurt project with the same MCP + advisor runbook (SC-03, second clause)"
    status: failed
    reason: "Migration 0004_library_phase_b.sql is written, committed, and code-reviewed (0 blockers), and all dependent TypeScript/UI code targets its schema, but the migration has NOT been applied to the live Frankfurt Supabase project (ref thgmhbzimnjcaoqyyiyp). The project is PAUSED (free-tier auto-pause), which blocks the mcp__supabase__apply_migration + get_advisors runbook step that 08-01-PLAN.md marks as [BLOCKING]. This is an infrastructure/founder-action gap, not a code defect: the migration file itself follows the 0001-0003 idempotent + grant-hardening conventions correctly (verified by direct read), and 08-01 has no SUMMARY.md because the plan's live-apply task never completed."
    artifacts:
      - path: "scanready/supabase/migrations/0004_library_phase_b.sql"
        issue: "File is correct and complete but not applied to the live project. Locally-run tests and tsc cannot detect this because they don't touch the live DB."
      - path: "scanready/docs/stage3-accounts.md"
        issue: "Runbook entry (line 68) documents this exact block: 'Migration 0004_library_phase_b PENDING ... BLOCKED 2026-07-17: the Frankfurt project is PAUSED ... FOUNDER ACTION: restore the project in the Supabase dashboard, then the apply + advisor + probe runbook below can run via MCP.'"
    missing:
      - "Founder must restore the paused Supabase project (dashboard > project > Restore)"
      - "Then run mcp__supabase__apply_migration with the 0004 file contents against thgmhbzimnjcaoqyyiyp"
      - "Then run mcp__supabase__get_advisors (type security) confirming zero NEW findings"
      - "Then run the live-verification probes listed in stage3-accounts.md (status column + CHECK exist; set_package_status exists and is granted only to authenticated; cv_id FK has confdeltype = 'n' and cv_id is nullable; subscriptions.cancel_at_period_end exists)"
human_verification:
  - test: "After migration 0004 is applied live, do the full accounts E2E pass again (attach-vs-new save, /konto Meine Lebenslaeufe rename/delete, status chip write/read, Plus reactivate) against the real Frankfurt project, the way the 2026-07-06 Stage 3 E2E was done for 0001-0003."
    expected: "All writes succeed against the live schema; RLS/grant behavior matches the advisor-clean expectation stated in the runbook."
    why_human: "Requires a live, restored Supabase project and either Google OAuth or a disposable test user; cannot be exercised by static code inspection or the local test suite."
---

# Phase 8: Account Library Phase B Verification Report

**Phase Goal:** The three Phase-B design surfaces (07-lebenslaeufe, 08-status, 09-plus) are reconciled into the live app behind the existing Stage 3 env gates: the save flow offers attach-to-existing-CV vs save-as-new, /konto gains a "Meine Lebenslaeufe" section with usage counts and rename/delete that never touches packages, every package card carries an editable status chip, and /konto shows the full Plus subscription lifecycle (cancelled-but-running and expired states plus a Kuendigung-zuruecknehmen route). Plus stays "Geplant" non-buyable; the renewal-reminder email stays a flagged founder gate. Everything inert until founder keys exist.

**Verified:** 2026-07-19
**Status:** gaps_found
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths (mapped to ROADMAP SC-01..SC-06)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC-01: Save flow CV reuse (attach-or-new radio, >80% overlap preselect, attach reuses cvs row id with no new insert, save-as-new inserts one, packages keep snapshotting) | VERIFIED | `scanready/src/lib/account.ts:131-200` `saveApplicationPackage` has two branches on `input.existingCvId`: ATTACH skips the `cvs` insert entirely (line 138-157, no `.from("cvs").insert` call in that branch) and inserts the package with `cv_id: input.existingCvId`; SAVE-AS-NEW (line 160-199) is unchanged, inserts a `cvs` row then the package, with the 895e03d orphan-cleanup delete-on-failure preserved (line 195). `scanready/src/lib/cv-overlap.ts` provides `cvOverlapRatio`/`bestCvMatch`/`CV_ATTACH_THRESHOLD` (0.8), 10 passing tests. Radio UI wired in `page.tsx`'s `SaveApplicationButton` (08-02-SUMMARY.md task 3, commit f76eb2d) |
| 2 | SC-02: "Meine Lebenslaeufe" on /konto with usage count, inline rename, delete that never touches packages | VERIFIED | `scanready/src/app/konto/KontoClient.tsx:458-` `CvSection` fetches `listCvs`+`listPackages` and derives `usageCount(cvId)` via `packages.filter(pkg => pkg.cv_id === cvId).length` (client-side, no live join); rename via `updateCvTitle`; delete (line 512) is `getSupabaseBrowserClient().from('cvs').delete().eq('id', cv.id)` -- only touches the `cvs` table, never `application_packages`. Safety comes from migration 0004's `ON DELETE SET NULL` FK, not from application code (matches the plan's stated design). `EmptyState` renders when the user has no CVs (line 532); whole `KontoClient` (including `CvSection`) is gated behind `accountsEnabled()` at line 61 |
| 3 | SC-03 (code half): Nullable status column, chip on both galleries, dropdown never cycles, auto-suggest beworben with undo, editable on read_only rows via safe RPC path | VERIFIED (code only, see gap below for the migration-apply half) | `set_package_status` RPC in `0004_library_phase_b.sql`: revokes public/anon, grants only authenticated, checks `user_id = auth.uid()` server-side, updates only `status`. `scanready/src/lib/account.ts:374-387` `setPackageStatus` calls it via `.rpc(...)`; grep confirms no plain `.update({ status` write anywhere in `src/`. `StatusChip` in `ui.tsx` reused in both `page.tsx:886` and `KontoClient.tsx:290`; `statusOptions`/`statusLabelFor` present in both galleries and both galleries' filters match status label text (`page.tsx:976`, `KontoClient.tsx:367`). Auto-suggest `suggestBeworben()`/`handleUndoStatusSuggestion()` at `page.tsx:2353-2382` check the RPC result before flipping UI state (WR-02 fix confirmed in code) and undo reverts to `null`, not `'entwurf'` (WR-03 fix confirmed in code) |
| 3b | SC-03 (infra half): "ships via a new migration applied to the live Frankfurt project with the same MCP + advisor runbook" | FAILED | See Gaps section. Migration file exists and is correct; live apply is blocked on a paused Supabase project, a founder-action item, not a code gap |
| 4 | SC-04: Plus lifecycle (cancelled-but-running + expired states, un-cancel route, /kuendigen and cancel flow untouched, Plus stays Geplant, reminder email not built) | VERIFIED | `scanready/src/app/api/subscription/reactivate/route.ts` guard order matches `cancel/route.ts`: `enforceSameOrigin` -> `enforceRateLimit` -> `accountsEnabled()/isStripeConfigured()` 503 -> auth 401 -> RLS-scoped select -> filter `isActiveStatus(r.status) && r.cancel_at_period_end` (line 57-58) -> 404 if none -> Stripe update only, no client-side subscriptions row write. `KontoClient.tsx:686-687` derives `isCancelling`/`isExpired` from `isActive && cancel_at_period_end` and `!isActive`; expired state styled identically to active/cancelled (no red, per plan requirement). `preise/page.tsx:285-290` and `KontoClient.tsx` both keep Plus as a non-buyable "Geplant" card. `stage3-accounts.md` section 9 documents the renewal-reminder email as a deliberate, flagged founder gate (transactional provider decision, PRD 6.4) -- it is not built anywhere in the touched files |
| 5 | SC-05: DE/EN copy lifted verbatim from the three design decks, no em-dash anywhere, new German copy flagged for native-speaker review | VERIFIED | Grep for em-dash ("—") across all 10 files this phase touched (cv-overlap.ts, account.ts, subscription.ts, i18n.tsx, reactivate/route.ts, stripe/webhook/route.ts, app/page.tsx, KontoClient.tsx, ui.tsx, migration 0004, stage3-accounts.md) returns zero matches. Each SUMMARY.md explicitly documents which German strings are lifted verbatim vs. newly authored, and each flags native-speaker review per the standing `humanizer-golive.md` gate |
| 6 | SC-06: tsc/tests/build pass; new surfaces inert when env vars unset; anonymous/explicit-save-only/no-photos/grounded-only guardrails untouched | VERIFIED | `npx tsc --noEmit` exit 0 (re-run at verification time). `npm test` 142/142 passing (re-run at verification time). `accountsEnabled()` gates `saveApplicationPackage`, `listCvs`, `updateCvTitle`, `setPackageStatus`, the reactivate route, and the entire `KontoClient` render tree (early-return "not available yet" notice at line 61-66 when disabled). No changes found to the anonymous `/app` stateless flow's core parse/generate paths outside the opt-in save/status/CV-reuse additions |

**Score:** 5/6 truths verified (SC-01, SC-02, SC-03-code-half, SC-04, SC-05, SC-06 -- counted as 5 of the 6 numbered roadmap criteria; SC-03's live-migration clause is the one FAILED item)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scanready/src/lib/cv-overlap.ts` | `cvOverlapRatio`, `bestCvMatch`, `CV_ATTACH_THRESHOLD` | VERIFIED | Present, exported, 10 passing tests, pure/no-I/O |
| `scanready/src/lib/account.ts` | `existingCvId` attach path, `listCvs`, `updateCvTitle`, `setPackageStatus`, `getPackage` with userId filter | VERIFIED | All present and wired; `getPackage` confirmed to include `.eq("user_id", userId)` (WR-05 fix) |
| `scanready/src/app/app/page.tsx` | attach-or-new radio, `?cv=` bridge, StatusChip + auto-suggest | VERIFIED | All present; `cvsAttachMeta` called with real usage-derived count (WR-01 fix confirmed at line 1600), not the hardcoded `0` the review originally flagged |
| `scanready/src/app/konto/KontoClient.tsx` | CvSection, StatusChip wiring, cancelled/expired Plus states | VERIFIED | All present; `isActiveStatus` imported from `subscription.ts` (WR-04 fix confirmed) rather than reimplemented |
| `scanready/src/components/ui.tsx` | `StatusChip` primitive | VERIFIED | Exported, reused in both galleries |
| `scanready/src/app/api/subscription/reactivate/route.ts` | un-cancel POST route | VERIFIED | Exists, guard order and scoping match `cancel/route.ts` |
| `scanready/supabase/migrations/0004_library_phase_b.sql` | status column+CHECK, `set_package_status` RPC+grant-hardening, `cv_id` nullable+ON DELETE SET NULL, `subscriptions.cancel_at_period_end` | VERIFIED (file) / FAILED (live apply) | File content correct per direct read; NOT yet applied to the live Frankfurt project |
| `scanready/docs/stage3-accounts.md` | 0004 apply + advisor runbook entry | VERIFIED | Entry present (line 68), documents the exact PAUSED-project block and founder action needed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| SaveApplicationButton radio | `saveApplicationPackage` | `existingCvId` param | WIRED | Confirmed threaded `onSave -> handleSavePackage -> saveApplicationPackage` per 08-02-SUMMARY.md and direct read of `account.ts` |
| StatusChip (both galleries) | `set_package_status` RPC | `setPackageStatus()` | WIRED | `account.ts:381` calls `.rpc("set_package_status", ...)`; grep confirms this is the only status-write path in `src/` |
| CV delete (KontoClient) | migration 0004 FK | `ON DELETE SET NULL` | WIRED (file-level) | UI code only deletes from `cvs`; correctness depends on the FK actually being live, which is the open gap |
| KontoClient un-cancel button | `/api/subscription/reactivate` | `fetch POST` + `refresh()` | WIRED | `handleReactivate` confirmed in `KontoClient.tsx`, mirrors `handleSubscribe`'s fetch-then-branch pattern |
| webhook upsert | `subscriptions.cancel_at_period_end` | `mapStripeSubscription(...).cancel_at_period_end` | WIRED (code) / PENDING (live column) | Code writes the field; the live DB column only exists once 0004 is applied |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite passes | `npm test` (run once) | 142/142 pass | PASS |
| Typecheck passes | `npx tsc --noEmit` | exit 0 | PASS |
| No plain status UPDATE bypassing the RPC | `grep -rn "\.update({ status" src/` | no matches | PASS |
| No em-dash in touched files | `grep -n "—" <each touched file>` | no matches in any of 10 files | PASS |
| Live migration apply | N/A (requires restored Supabase project) | not run | SKIP -- infra blocked, see gap |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|--------------|----------------|--------------|--------|----------|
| SC-01 | 08-02 | Save flow CV reuse | SATISFIED | See truth #1 |
| SC-02 | 08-03 | Meine Lebenslaeufe section | SATISFIED | See truth #2 |
| SC-03 | 08-01, 08-04 | Package status column + RPC + chip | PARTIALLY SATISFIED | Code-half SATISFIED; live-migration-apply half BLOCKED (founder action) |
| SC-04 | 08-05 | Plus lifecycle | SATISFIED | See truth #4 |
| SC-05 | all plans | i18n copy, no em-dash | SATISFIED | See truth #5 |
| SC-06 | all plans | tsc/tests/build, env-gating, guardrails | SATISFIED | See truth #6 |

No orphaned requirements found -- all Phase 8 SCs map to at least one plan's `requirements` field.

### Anti-Patterns Found

None. No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any of the 10 files this phase touched (grep returned zero matches, excluding the legitimate "founder gate"/"PENDING" runbook language, which references formal follow-up work by name and is not a debt marker).

### Code Review Cross-Check (08-REVIEW.md)

08-REVIEW.md reported 0 blockers, 5 warnings, 2 info findings. All 5 warnings (WR-01 through WR-05) were independently re-verified against the current source in this pass (not merely trusted from the review or SUMMARY claims):
- WR-01 (hardcoded 0 usage count in attach dropdown) -- fix confirmed at `page.tsx:1600` (`t.cvsAttachMeta(...)` now called with a derived count, not a literal `0`)
- WR-02 (auto-suggest/undo ignore RPC failure) -- fix confirmed at `page.tsx:2353-2382` (`result.ok` checked before flipping UI state)
- WR-03 (undo reverts to `'entwurf'` instead of `null`) -- fix confirmed at `page.tsx:2374` (`setPackageStatus(..., null)`)
- WR-04 (KontoClient reimplements `isActiveStatus`) -- fix confirmed at `KontoClient.tsx:30,685` (imported and used, not reimplemented)
- WR-05 (`getPackage` missing `user_id` backstop) -- fix confirmed at `account.ts:230-242` (`.eq("user_id", userId)` present)

The 2 info-tier findings (IN-01 empty-string error message, IN-02 duplicated helpers between galleries) were left open by design per the review and are correctly non-blocking.

### Human Verification Required

1. **Live E2E after migration 0004 is applied.** Test: once the founder restores the paused Frankfurt Supabase project and the migration is applied + advisor-clean, re-run the attach-vs-new save flow, /konto CV rename/delete, status chip writes, and the Plus reactivate route against the live project (same method as the 2026-07-06 Stage 3 E2E). Expected: all writes succeed against the live schema, matching the code paths verified here. Why human: requires a live, restored Supabase project and either Google OAuth or a disposable test user session; cannot be exercised by static code inspection or the local test suite that runs against no DB at all.

### Gaps Summary

One gap, and it is infrastructure/founder-gated rather than a code defect: **migration 0004's live apply to the Frankfurt Supabase project (`thgmhbzimnjcaoqyyiyp`) has not happened.** The project auto-paused on the free tier; DNS no longer resolves for the project and the runbook's `mcp__supabase__apply_migration` + `get_advisors` steps cannot run until the founder restores it in the Supabase dashboard (one click). This is exactly and only the item flagged in `scanready/docs/stage3-accounts.md` line 68 and in ROADMAP.md's own Phase 8 progress note ("08-01's live schema push remains blocked on the paused Supabase project"). All four dependent plans (08-02 through 08-05) correctly built their TypeScript/UI code against the migration's intended schema shape and their SUMMARY.md files each explicitly acknowledge this same standing block rather than claiming it resolved. No plan overstated completion; 08-01 itself has no SUMMARY.md, which is the honest signal that its live-apply task did not finish.

Per the roadmap's Success Criteria, SC-03 explicitly requires the status column to ship "via a new migration applied to the live Frankfurt project" -- so this phase cannot be marked fully passed while that clause is open. Everything else (5 of 6 SCs, all code-level wiring, all guardrails, all anti-pattern/em-dash checks, the full local test suite, and the review's 5 warnings) checks out clean.

**Recommended next action:** founder restores the Supabase project, then either re-run this verification (which will re-check the live-apply artifacts) or have a human execute the runbook in `stage3-accounts.md` directly and update the entry from PENDING to applied + advisor-clean.

---

_Verified: 2026-07-19_
_Verifier: Claude (gsd-verifier)_
