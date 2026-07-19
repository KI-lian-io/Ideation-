# Phase 8: Account Library Phase B (CV reuse + status + Plus lifecycle) - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Source:** PRD Express Path (scanready/docs/design-impl-plan-library-pricing.md Phase B section + scanready/docs/prd-account-library-pricing.md 6.4, founder-directed 2026-07-17)

<domain>
## Phase Boundary

Reconcile the three Phase-B surfaces of the claude.ai/design export (07-lebenslaeufe, 08-status, 09-plus) into the live app behind the existing Stage 3 env gates. Ships one new migration (0004) applied to the live Frankfurt Supabase project via the established MCP + advisor runbook. Plus stays "Geplant"/non-buyable on every surface; the renewal-reminder email is explicitly NOT built (founder gate: transactional email provider decision, PRD 6.4). The founder explicitly directed building Phase B now; the "wait for Pass demand signal" gate applies to ENABLING Plus, not to building these env-gated surfaces.

</domain>

<decisions>
## Implementation Decisions

### Surface 07: CV reuse / "Meine Lebenslaeufe"
- Save flow: when a signed-in user with 1+ stored CVs saves, the save card offers a radio: "an bestehenden Lebenslauf anhaengen" vs "als neuen Lebenslauf speichern". A >80% text-overlap heuristic between the current CV text and stored cvs preselects attach (simple normalized token/line overlap, client-side; planner's call on exact metric). Attaching reuses the matched cvs row id (saveApplicationPackage gains an optional existingCvId path, NO new cvs insert); save-as-new keeps today's insert. Packages keep snapshotting their own lebenslauf JSONB (point-in-time; live-linked editing is a PRD non-goal).
- /konto gains a "Meine Lebenslaeufe" section: CV cards from a new listCvs() helper in scanready/src/lib/account.ts, each with per-CV usage count (packages grouped by cv_id), inline rename (cvs.title EXISTS already, default 'Lebenslauf'; cvs_update_own RLS already permits), delete via existing cvs_delete_own RLS.
- "Bewerbungen behalten ihre Kopie" is currently FALSE at the schema level: application_packages.cv_id is `not null references public.cvs (id) on delete cascade` (0001 line ~95ff) - deleting a CV would CASCADE-DELETE its packages. Migration 0004 MUST change this: drop not null on cv_id + re-create the FK as `on delete set null`. Package cards must tolerate cv_id null (they render from their own snapshot).
- The remembered orphaned-cvs-row fix (895e03d: cvs insert AFTER the guarded package insert) must survive the attach-or-new refactor.

### Surface 08: package status chip
- Migration 0004 adds `status text` (nullable) to application_packages with a CHECK constraint limiting to 'entwurf' | 'beworben' | 'interview' | 'absage' | 'zusage' (or null). Display labels come from i18n; store lowercase keys.
- Chip renders in the card badge row on BOTH galleries (/konto SavedPackagesSection and /app SavedApplications). Click opens a dropdown (KebabMenu-style floating menu or a small listbox; NEVER cycles on click). Null status shows a neutral "Status setzen" affordance per the surface deck.
- Editable even on read_only packages: the existing RLS policy application_packages_update_own_and_editable is `using (auth.uid() = user_id and read_only = false)`, so a plain UPDATE silently no-ops on read_only rows. Migration 0004 adds a SECURITY DEFINER RPC `set_package_status(package_id uuid, new_status text)` that checks `user_id = auth.uid()` (ownership only, ignoring read_only), validates the status value, updates ONLY the status column, and gets the same grant hardening as delete_own_account (revoke from public/anon, grant execute to authenticated). ALL status writes go through this RPC (both galleries) so behavior is uniform. The document-content read-only contract stays intact.
- Auto-suggest: on the FIRST PDF export or copy of a SAVED package, suggest status 'beworben' as an inline undoable nudge (set via the RPC, with an Rueckgaengig link that sets it back). Never fires for anonymous users; never a modal.
- Gallery filter: the existing client-side text filter gains status awareness (filter by status label text is acceptable; a dedicated status dropdown filter is planner's discretion within the deck's design).

### Surface 09: Plus subscription lifecycle
- subscriptions table does NOT track cancel_at_period_end today (columns: id, user_id, stripe_subscription_id, status, current_period_end, created_at, updated_at). Migration 0004 adds `cancel_at_period_end boolean not null default false`. mapStripeSubscription()/StripeSubscriptionLike in scanready/src/lib/subscription.ts gain the field; the webhook (/api/stripe/webhook) and /api/subscription/cancel sync it (cancel route already calls Stripe with cancel_at_period_end: true - it must now also flip the row).
- /konto subscription card gains two new states from real rows: cancelled-but-running (status active + cancel_at_period_end true: show paid-until date from current_period_end + "Kuendigung zuruecknehmen" action) and expired (status canceled/past current_period_end: neutral, never red, with the read-only downgrade explainer). Copy verbatim from 09-plus.dc.html.
- New un-cancel route `/api/subscription/reactivate` mirroring /api/subscription/cancel: same-origin + rate-limit guards, auth required, flips Stripe cancel_at_period_end back to false and syncs the row. Flag the new route + German copy for the same 312k-adjacent legal review as the cancel flow (flag, do not block).
- Renewal-reminder email: DO NOT BUILD. Record as an open founder gate (provider decision, PRD 6.4) in the docs the phase touches.
- Plus stays "Geplant" and non-buyable everywhere (/preise, StorageGate, /konto); nothing in this phase makes Plus purchasable.

### Migration 0004 (single migration for the phase)
- Contents: packages.status column + CHECK; set_package_status() RPC + grant hardening; cv_id nullable + FK on delete set null; subscriptions.cancel_at_period_end column. Follow 0001-0003 style (idempotent guards, comment blocks explaining WHY, no em-dash). Applied live via mcp__supabase__apply_migration + get_advisors, same runbook as 0002/0003 (recorded in scanready/docs/stage3-accounts.md); if MCP auth is unavailable, flag as founder gate, never skip silently.
- Remember the 0002/0003 lesson: any new constraint must not break delete_own_account() (FK ON DELETE actions fire during account deletion; CHECK constraints validate on those implicit UPDATEs; prefer INSERT-scoped triggers or nullable-tolerant CHECKs). status CHECK must allow null; cv_id set-null action must not violate anything.

### Cross-cutting guardrails (every plan must honor)
- NO em-dash anywhere. DE/EN copy lifted VERBATIM from the three .dc.html decks into the existing flat i18n dictionary (both en and de in lockstep); no ad hoc strings; new German copy flagged for native-speaker review.
- Env-gated inert (accountsEnabled()/paymentsEnabled()/subscriptionConfigured() patterns); anonymous zero-retention flow, explicit-save-only, no-photos, grounded-only all untouched.
- Do NOT touch scanready/src/lib/legal-data.ts (street confirmation is an open founder item); do NOT resolve PRD section 9 founder decisions (Plus price stays 5,99 display-only default; names unchanged).
- Do NOT build: renewal-reminder email, Plus checkout enablement, kanban/tracker features, server-side search (PRD non-goals/P2).
- Workflow: branch claude/ecom-low-barrier-tools-zpyb10; node v22; run npx tsc --noEmit + npm test (node built-in runner, NOT vitest) + npm run build inside scanready/; verify UI via preview tools.

### Claude's Discretion
- Exact overlap heuristic and its threshold handling (>80% is the spec's anchor).
- Component layout for the CV cards and status dropdown (reuse Phase A primitives: SheetCard, KebabMenu, MonoBadge, EmptyState, InlineRenameField, BottomSheet).
- Whether the status auto-suggest lives in the export/copy handlers or a small hook.
- Test placement following existing patterns (src/lib/__tests__/, pure helpers; package.json test file list may need extending - check before assuming).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary spec
- `scanready/docs/design-impl-plan-library-pricing.md` - Phase B section (07/08/09 deltas, explicitly deferred from Phase A)
- `scanready/docs/prd-account-library-pricing.md` - 6.4 P1 fast-follows, non-goals (3), open founder decisions (9)

### Design surfaces (exhaustive DE/EN copy decks - use copy VERBATIM)
- `scanready/claude design files/Scanready award-winning design_updated/07-lebenslaeufe.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/08-status.dc.html`
- `scanready/claude design files/Scanready award-winning design_updated/09-plus.dc.html`

### Existing code the phase extends (verified 2026-07-17)
- `scanready/supabase/migrations/0001_stage3_accounts.sql` - cvs table (HAS title), application_packages (cv_id not null + ON DELETE CASCADE - must change), subscriptions (NO cancel_at_period_end - must add), RLS policies incl. application_packages_update_own_and_editable (read_only=false qual), delete_own_account grant-hardening pattern
- `scanready/supabase/migrations/0002_pass.sql` + `0003_pass_requires_user_fix.sql` - migration style + the GDPR-deletion lesson
- `scanready/src/lib/account.ts` - saveApplicationPackage (orphan-fix ordering), listPackages/delete helpers, updatePackageTitle, pass helpers; add listCvs(), attach path, status RPC caller
- `scanready/src/lib/subscription.ts` - SubscriptionRow/mapStripeSubscription to extend with cancel_at_period_end
- `scanready/src/app/api/subscription/cancel/route.ts` - the route /api/subscription/reactivate mirrors (incl. guards)
- `scanready/src/app/api/stripe/webhook/route.ts` - row sync to extend
- `scanready/src/app/konto/KontoClient.tsx` - SavedPackagesSection gallery + SubscriptionSection to extend; PackageCard badge row for the status chip
- `scanready/src/app/app/page.tsx` - SavedApplications gallery, save card (attach-or-new radio slot), export/copy handlers (auto-suggest hook point)
- `scanready/src/components/ui.tsx` - Phase A primitives to reuse
- `scanready/src/lib/i18n.tsx` - flat Dict, en/de lockstep
- `scanready/docs/stage3-accounts.md` - migration runbook to append 0004 to
- `.planning/phases/07-account-library-honest-pricing-design-reconciliation-phase-a/07-PATTERNS.md` + `07-*-SUMMARY.md` - Phase A analog map and decisions (query-string bridge, Stripe-free chip file split, etc.)

</canonical_refs>

<specifics>
## Specific Ideas

- The /konto -> /app handoff bridge from Phase A (plain ?package=&action= query string) is the model if CV cards need a "use this CV" jump into the tool.
- PassStatusChip.tsx's Stripe-free file split is the model for any new chip that renders on every page view.
- Status chip on read_only rows is a deliberate exception to "read-only hides edit controls": status is package METADATA, not document content; the RPC design (ownership-only check, single-column update) is what keeps the exception safe. State this in code comments.
- package.json runs tests from an explicit file list; adding a new test file requires adding it there.
</specifics>

<deferred>
## Deferred Ideas

- Renewal-reminder email infrastructure (founder gate: provider decision, PRD 6.4).
- Plus purchase enablement (founder gate: demand signal + price decision PRD 9).
- PRD 6.5 P2: server-side posting search, zip export, pass gifting, multi-CV A/B stats.
- Kanban/tracker board, live-linked CV editing (PRD non-goals).
- Founder gates unchanged: legal-data.ts street confirmation, Stripe/PostHog keys, Vercel production promotion, native-speaker review, DPMA name check.

</deferred>

---

*Phase: 08-account-library-phase-b-cv-reuse-meine-lebenslaeufe-package-*
*Context gathered: 2026-07-17 via PRD Express Path*
