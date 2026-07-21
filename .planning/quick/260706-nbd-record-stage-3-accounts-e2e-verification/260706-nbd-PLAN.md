---
phase: quick
plan: 260706-nbd
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
  - scanready/docs/stage3-accounts.md
autonomous: true
requirements: [DOC-STAGE3-E2E]
must_haves:
  truths:
    - "scanready/docs/stage3-accounts.md marks the accounts E2E checklist item as done with the 2026-07-06 verification method and results"
    - "CLAUDE.md Stage 3 activation status reflects that accounts E2E passed (no longer listed as remaining)"
    - "Both files record the orphaned-cvs-row issue as a found (not fixed here) note and the email-provider-enabled note"
    - "No em-dash character appears in any added text"
  artifacts:
    - path: "CLAUDE.md"
      provides: "Updated Stage 3 activation status lines"
      contains: "accounts E2E"
    - path: "scanready/docs/stage3-accounts.md"
      provides: "Accounts E2E checklist item marked done with verification detail"
      contains: "[x] Accounts E2E"
  key_links: []
---

<objective>
Record the Stage 3 accounts end-to-end verification that passed today (2026-07-06) into the two canonical status documents so the next session sees an accurate picture: the accounts E2E is no longer a pending gate, the verification method and results are documented, and the two side notes (orphaned cvs row leak, email provider enabled) are captured.

Purpose: Keep .planning + session-handoff docs truthful so the next session does not re-run work already proven and knows about the two follow-ups.
Output: Surgical edits to CLAUDE.md and scanready/docs/stage3-accounts.md. Documentation only, no code.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@scanready/docs/stage3-accounts.md

# Verification facts to record (source: live E2E run 2026-07-06 from this session)
# - Full accounts E2E PASSED against live Frankfurt Supabase project (ref thgmhbzimnjcaoqyyiyp), through the real UI on localhost dev server.
# - Method: Google OAuth cannot run headless, so a disposable email user was created via the public signup API
#   (email provider is enabled on the project alongside Google), confirmed via SQL, signed in via password grant,
#   and the session was injected as the @supabase/ssr cookie. App validated the session server-side. Test user was
#   deleted afterwards via the app's own delete_own_account() RPC; DB back to exact baseline (only founder account remains).
# - Verified: save 1 package (1 cvs + 1 application_packages row); second save blocked by the enforce_package_limit
#   trigger at the DB layer with the correct UI limit hint; after reload the saved package listed in InputView and
#   loaded back into the result phase intact via LOAD_PACKAGE.
# - Also verified via SQL probes: cross-user RLS (another user's JWT sees 0 rows); read_only downgrade contract
#   (owner UPDATE affects 0 rows, SELECT still works); handle_new_user trigger fires for email signups too;
#   delete_own_account() cascades remove profiles/cvs/packages.
# - Known issue found (do NOT fix here, a parallel session owns it): saveApplicationPackage inserts the cvs row
#   before the guarded package insert, so every limit-blocked save leaks one orphaned cvs row (full CV text).
# - Note: Supabase email/password provider is enabled while the UI only offers Google; founder may want to disable
#   the email provider in the dashboard if Google-only is intended.
# - Remaining Stage 3 gates unchanged: Vercel env vars (Preview first), Stripe subscription Price decision +
#   STRIPE_WEBHOOK_SECRET + SUPABASE_SERVICE_ROLE_KEY, legal review on a preview deploy.
</context>

<constraints>
- Documentation-only. Do NOT edit any code, and do NOT touch scanready/src/lib/account.ts or its tests (a parallel session owns those files).
- HARD project convention: never use the em-dash character in written output. Use a spaced en-dash, a comma, or reword.
- Keep edits surgical: update the existing Stage 3 activation status lines rather than restructuring the documents.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Mark the accounts E2E done in the Stage 3 runbook</name>
  <files>scanready/docs/stage3-accounts.md</files>
  <action>
In the "Status as of 2026-07-06 (live founder session)" checklist near the top of the file, change the unchecked line `- [ ] Accounts E2E (save 1 package, 2nd blocked by DB limit, reload + load)` to a checked `[x]` item and expand it with a short indented sub-note recording the 2026-07-06 verification. The sub-note must capture: (a) E2E PASSED against the live Frankfurt project (ref thgmhbzimnjcaoqyyiyp) through the real UI on the localhost dev server; (b) the method (Google OAuth cannot run headless, so a disposable email user was created via the public signup API, since the email provider is enabled alongside Google, confirmed via SQL, signed in via password grant, session injected as the @supabase/ssr cookie, server-side session validation confirmed, then the test user deleted via the app's own delete_own_account() RPC so the DB returned to baseline with only the founder account); (c) what was verified: save one package created 1 cvs + 1 application_packages row, a second save was blocked by the enforce_package_limit trigger at the DB layer with the correct UI limit hint, and after reload the saved package listed in InputView and loaded back into the result phase intact via LOAD_PACKAGE; (d) SQL probes also confirmed cross-user RLS (another user's JWT sees 0 rows), the read_only downgrade contract (owner UPDATE affects 0 rows while SELECT still works), handle_new_user firing for email signups, and delete_own_account() cascading removal of profiles/cvs/packages.
Then add TWO short follow-up notes near this checklist (e.g. as a small "Follow-ups found during E2E" note block): (1) a KNOWN ISSUE that saveApplicationPackage inserts the cvs row before the guarded package insert, so every limit-blocked save leaks one orphaned cvs row containing the full CV text (state that a fix is in progress in a separate session, so it is recorded here as a known issue only, not a to-do for this doc edit); (2) a note that the Supabase email/password provider is enabled while the UI only offers Google, and the founder may want to disable the email provider in the dashboard if Google-only sign-in is intended.
Leave the remaining unchecked gates (Vercel env vars, subscription Stripe Price + webhook, §312k/legal review) exactly as they are. Do NOT restructure the rest of the file or touch sections 1 to 8. Do NOT use the em-dash character anywhere in the added text.
  </action>
  <verify>
    <automated>grep -q '\[x\] Accounts E2E' scanready/docs/stage3-accounts.md && grep -q 'delete_own_account' scanready/docs/stage3-accounts.md && grep -q 'orphaned cvs' scanready/docs/stage3-accounts.md && ! grep -q '—' scanready/docs/stage3-accounts.md && echo OK</automated>
  </verify>
  <done>The accounts E2E checklist item shows `[x]` with the 2026-07-06 method + results sub-note; the orphaned-cvs-row known issue and the email-provider-enabled note are both recorded; remaining gates untouched; no em-dash present in the file.</done>
</task>

<task type="auto">
  <name>Task 2: Update the Stage 3 activation status in CLAUDE.md</name>
  <files>CLAUDE.md</files>
  <action>
In the root CLAUDE.md, update the two places that state the Stage 3 activation status so they reflect that the accounts E2E now passed.

(1) In the "NOT done (founder gates)" section, item 3 ("Stage 3 activation - PARTIALLY DONE (2026-07-06, live founder session)"): change the "Remaining:" list so "accounts E2E (save -> limit -> load)" is no longer listed as remaining. Instead, add a checked/done clause recording that the accounts E2E PASSED on 2026-07-06 against the live Frankfurt project (ref thgmhbzimnjcaoqyyiyp) through the real UI (method: disposable email-signup user, since the email provider is enabled alongside Google, since OAuth cannot run headless; session injected server-side; test user removed via delete_own_account() so the DB is back to baseline), verifying save one package, second save blocked by the enforce_package_limit DB trigger, reload + LOAD_PACKAGE round-trip, plus SQL-probed cross-user RLS, the read_only downgrade contract, and delete cascade. Keep the genuinely remaining gates in this item: Vercel env vars (Preview first, Production last), the Stripe subscription Price decision (3,99 to 5,99 EUR) + STRIPE_WEBHOOK_SECRET + SUPABASE_SERVICE_ROLE_KEY, and the §312k/AGB/Datenschutz legal review on a preview deploy. Also add a brief parenthetical noting two follow-ups surfaced by the E2E: an orphaned-cvs-row leak on limit-blocked saves (fix in a separate session), and that the Supabase email provider is enabled while the UI is Google-only (founder may disable it).

(2) In the "Suggested first message for the new session" block, update the clause about Stage 3 so it no longer says the accounts E2E is remaining: state that Stage 3 activation is further along (Supabase live, migration advisor-clean, Google OAuth tested, AND accounts E2E now passed on 2026-07-06), and that the remaining gates are the Vercel env vars, the subscription Price decision + webhook secret + service-role key, and the §312k/legal review on a preview deploy.

Keep edits surgical: change only the affected clauses within those two blocks. Do NOT restructure other sections. Do NOT use the em-dash character anywhere in the added or edited text (use a spaced en-dash, a comma, or reword).
  </action>
  <verify>
    <automated>grep -q 'accounts E2E' CLAUDE.md && grep -qi 'passed' CLAUDE.md && grep -q 'thgmhbzimnjcaoqyyiyp' CLAUDE.md && ! grep -q '—' CLAUDE.md && echo OK</automated>
  </verify>
  <done>Both the "NOT done" item 3 and the "Suggested first message" block state the accounts E2E passed on 2026-07-06 with method + coverage; the genuinely remaining gates (Vercel env, subscription Price/webhook/service-role, legal review) stay listed; the two follow-up notes appear; no em-dash present in the file.</done>
</task>

</tasks>

<threat_model>
No trust boundaries introduced or altered: this plan edits two Markdown documentation files only, with no code, network, or data-store changes. STRIDE analysis is not applicable to a documentation-only status update.
</threat_model>

<verification>
- `grep -q '\[x\] Accounts E2E' scanready/docs/stage3-accounts.md` succeeds.
- Both files mention the live project ref `thgmhbzimnjcaoqyyiyp` and that the E2E passed.
- Both files record the orphaned-cvs-row known issue and the email-provider note.
- Neither file contains the em-dash character (`! grep -q '—'` succeeds on both).
- `git diff --stat` shows only CLAUDE.md and scanready/docs/stage3-accounts.md changed.
</verification>

<success_criteria>
- scanready/docs/stage3-accounts.md checklist marks accounts E2E as done with 2026-07-06 verification method and results, and records the two follow-up notes.
- CLAUDE.md "NOT done" item 3 and "Suggested first message" block both reflect the passed E2E and keep only the genuinely remaining gates.
- No code files touched; no em-dash characters introduced.
</success_criteria>

<output>
Create `.planning/quick/260706-nbd-record-stage-3-accounts-e2e-verification/260706-nbd-SUMMARY.md` when done.
</output>
