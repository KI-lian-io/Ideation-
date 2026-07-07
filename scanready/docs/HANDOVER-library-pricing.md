# Handover: implement the Library + Pricing design (fresh session)

Paste the block below into a fresh Claude Code session in this repo. It leads with `/goal` so the session sets up a goal-tracked run. Everything it needs to read is committed on branch `claude/ecom-low-barrier-tools-zpyb10`.

---

/goal Implement Phase A of the ScanReady account-library + honest-pricing redesign, reconciling the claude.ai/design export into the live app behind the existing Stage 3 env gates.

CONTEXT (read these first, in order):
1. scanready/docs/design-impl-plan-library-pricing.md - the reconciliation map: which .dc.html surface becomes which route/component, the exact deltas vs current code, new primitives, and the build order. This is your primary spec.
2. scanready/docs/prd-account-library-pricing.md - the product decisions (pricing ladder 6.2, paywall placement 6.3, open founder decisions in section 9).
3. The design surfaces themselves: scanready/claude design files/Scanready award-winning design_updated/*.dc.html (01-library, 02-storage-gate, 03-pass, 04-preise, 05-save-moment, 06-founder-assets are Phase A; 07/08/09 are Phase B, do NOT build them). Each file has an exhaustive DE/EN copy deck and design-note annotations - use its copy verbatim.
4. CLAUDE.md (root) for guardrails and the Stage 3 stack; the design system is "Warm Editorial Broadsheet" (scanready/DESIGN.md), extended by "Typesetting Theater".

Note: the export's ds-update/ folder is a drop-in for the SEPARATE scanready-design-system Claude project (see its APPLY.md), NOT React for this repo. Treat it as the reference spec for primitives to add to src/components/ui.tsx; do not copy its .jsx in.

SCOPE - Phase A only, in this order (details per phase in the impl plan):
- A0 Foundation: add shadow-sheet/shadow-modal tokens to globals.css; add the new ui.tsx primitives (SheetCard, KebabMenu, InlineRenameField, MonoBadge + ghost variant, EmptyState, BottomSheet, SavedConfirmationPanel); drop the six founder SVGs from the export assets/ into public/, wire favicon + openGraph.images in src/app/layout.tsx, build src/app/not-found.tsx (net-new) from 06's misprint spec.
- A1 Pass data/API: migration 0002 (humanizer_purchases.expires_at + kind='pass_30d' requiring user_id; tiered enforce_package_limit free=1/pass=25/sub=unlimited, keep the advisory-lock guard); PASS_PRICE_CENTS=1499 in src/lib/humanizer.ts; /api/pass/intent (account-required, metadata.feature='pass'); extend checkHumanizerEntitlement for a live pass window. Keep the anonymous paket/humanizer stateless-token rails untouched.
- A2 Library gallery (01) + save moment (05): rebuild KontoClient SavedPackagesSection and /app SavedApplications into the card gallery (kebab, inline rename, read-only-hides-controls, empty state, storage-transparency footer, no photos); rebuild SaveApplicationButton into the save card with editable-title-as-suggestion + saved-confirmation panel on both result views. Add updatePackageTitle() to src/lib/account.ts. Map all copy into src/lib/i18n.tsx (t.* dictionary).
- A3 Storage-gate chooser (02): new StorageGate inline dismissible panel replacing the plain state==='limit' hint; purchase-history-aware anchor variant; no countdowns.
- A4 Pass modal (03): new PassModal mirroring PaketModal, but a DISTINCT Widerruf variant (proportional value-substitute, §356(4)/§357a - NOT Paket's §356(5) copy); active/expired lifecycle chips.
- A5 Preise v2 (04): full rebuild of src/app/preise/page.tsx (4-card ladder, manifesto pull-quote, before/after comparison, Plus stays "Geplant"/non-buyable).

HARD GUARDRAILS (non-negotiable): no em-dash character anywhere (site convention); no photos in library cards (never read AppState.photoUrl); explicit-save-only (no autosave/blur/periodic-sync; Datenschutz §7 legal basis); read-only rows HIDE edit controls, not disable them (RLS silently no-ops); Pass requires an account, anonymous rails stay stateless; everything env-gated (accountsEnabled/subscriptionConfigured) and inert until keys exist; grounded-only generation and zero-retention anonymous flow unchanged; all new German copy and the Pass Widerruf wording go to native-speaker + legal review before go-live (flag, do not block the build).

WORKFLOW: this repo uses GSD - run through /gsd-plan-phase or /gsd-quick, do not make raw edits outside a GSD workflow. Develop on branch claude/ecom-low-barrier-tools-zpyb10. Before pushing: gh auth switch --hostname github.com --user KI-lian-io (default account gets 403). Local node is v22 (works); run npx tsc --noEmit and npm test in scanready/. Use absolute paths (shell cwd drifts). Verify UI changes with the preview tools against the dev server, do not ask the user to check manually.

DO NOT: build Phase B (07 CV-reuse needs schema work, 08 status needs a new column, 09 Plus surfaces are gated on Pass demand); resolve the open founder decisions in PRD section 9 yourself (Pass duration/price, Plus price, names, storage cap, Pass Widerruf legal mechanics) - use the PRD's recommended defaults and flag them; touch legal-data.ts FOUNDER_TODOs (those are founder gates).

DEFINITION OF DONE for Phase A: all six surfaces reconciled into src/ against the ui.tsx primitives and i18n dictionary, tsc + tests + next build green, previewed working behind env gates, committed on the branch, with the Pass Widerruf copy and new AGB/Datenschutz clauses clearly flagged for legal review.

---

After the goal is set, the session should confirm the plan (ExitPlanMode / GSD plan) before writing code, since this touches payments, a DB migration, and legal copy.
