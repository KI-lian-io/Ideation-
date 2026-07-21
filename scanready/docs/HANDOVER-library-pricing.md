# Handover: implement the Library + Pricing design (fresh session)

Paste the block below into a fresh Claude Code session in this repo. It leads with `/goal` so the session sets up a goal-tracked run. Everything it needs to read is committed on branch `claude/ecom-low-barrier-tools-zpyb10`. The goal condition is kept under `/goal`'s 4000-char limit by pointing at the committed docs for the per-phase detail rather than inlining it.

---

/goal Implement Phase A of the ScanReady account-library + honest-pricing redesign: reconcile the claude.ai/design export into the live app behind the existing Stage 3 env gates.

READ FIRST (your full spec is in these, do not re-derive):
1. scanready/docs/design-impl-plan-library-pricing.md - reconciliation map (surface->component), per-phase deltas, new primitives, build order. Primary spec.
2. scanready/docs/prd-account-library-pricing.md - pricing ladder (6.2), paywall placement (6.3), open founder decisions (9).
3. The 6 Phase-A surfaces in "scanready/claude design files/Scanready award-winning design_updated/": 01-library, 02-storage-gate, 03-pass, 04-preise, 05-save-moment, 06-founder-assets (.dc.html). Each has an exhaustive DE/EN copy deck; use its copy verbatim. 07/08/09 are Phase B, do NOT build.
4. CLAUDE.md (root) + scanready/DESIGN.md for guardrails and the "Warm Editorial Broadsheet" system.
Note: the export's ds-update/ folder targets the SEPARATE design-system project (its APPLY.md); it is reference for primitives to add to src/components/ui.tsx, not React to copy in.

SCOPE (Phase A only, this order; full detail in the impl plan):
A0 foundation: sheet/modal shadow tokens in globals.css; new ui.tsx primitives (SheetCard, KebabMenu, InlineRenameField, MonoBadge+ghost, EmptyState, BottomSheet, SavedConfirmationPanel); drop the 6 founder SVGs into public/, wire favicon + openGraph.images in layout.tsx, build src/app/not-found.tsx from 06.
A1 Pass data/API: migration 0002 (humanizer_purchases.expires_at + kind='pass_30d' requiring user_id; tiered enforce_package_limit free1/pass25/sub-unlimited, keep advisory lock); PASS_PRICE_CENTS=1499; /api/pass/intent (account-required); extend checkHumanizerEntitlement for a live pass window; leave anonymous paket/humanizer rails untouched.
A2 library (01)+save (05): rebuild KontoClient SavedPackagesSection and /app SavedApplications into the card gallery; rebuild SaveApplicationButton into the save card (editable-title suggestion + saved-confirmation panel, both result views); add updatePackageTitle() to account.ts; map copy into src/lib/i18n.tsx.
A3 storage-gate (02): StorageGate inline dismissible panel replacing the state==='limit' hint; purchase-history anchor variant; no countdowns.
A4 Pass modal (03): PassModal mirroring PaketModal but a DISTINCT Widerruf variant (proportional, 356(4)/357a, NOT Paket's 356(5)); active/expired chips.
A5 preise (04): rebuild src/app/preise/page.tsx (4-card ladder, manifesto pull-quote, before/after; Plus stays "Geplant").

GUARDRAILS: no em-dash anywhere; no photos in cards; explicit-save-only (no autosave); read-only rows HIDE edit controls (RLS no-ops); Pass needs an account, anonymous rails stay stateless; env-gated and inert until keys exist; grounded-only + zero-retention unchanged; new German copy + Pass Widerruf go to native-speaker + legal review (flag, do not block).

WORKFLOW: GSD only (/gsd-plan-phase or /gsd-quick), no raw edits; branch claude/ecom-low-barrier-tools-zpyb10; before push run gh auth switch --user KI-lian-io; node v22; run tsc + tests in scanready/; verify UI via preview tools.

DO NOT: build Phase B; resolve PRD-9 founder decisions (use recommended defaults, flag them); touch legal-data.ts FOUNDER_TODOs.

DONE = 6 surfaces reconciled into src/, tsc+tests+build green, previewed behind env gates, committed on branch, Pass Widerruf + new AGB/Datenschutz clauses flagged for legal review.

---

After the goal is set, the session should confirm the plan (ExitPlanMode / GSD plan) before writing code, since this touches payments, a DB migration, and legal copy. The full per-phase detail, exact copy, and legal notes live in the impl plan and the .dc.html decks, so the session reads those rather than needing them inline here.
