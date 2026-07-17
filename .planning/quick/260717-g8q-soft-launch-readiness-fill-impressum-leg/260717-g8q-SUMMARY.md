---
phase: quick-260717-g8q
plan: 01
subsystem: legal
tags: [nextjs, legal-pages, stripe, env-gating, agb, datenschutz]

requires: []
provides:
  - Founder operator identity filled into scanready/src/lib/legal-data.ts (Impressum/AGB/Datenschutz)
  - New client-safe scanready/src/lib/payments-config.ts exporting paymentsEnabled()
  - /app hides Humanizer+ CTA and both locked-state PDF-export purchase CTAs when Stripe is unconfigured
  - AGB and Datenschutz gate paid-feature sections behind paymentsEnabled(), with contiguous heading numbering in all four {payments} x {accounts} combinations
affects: [payments, legal, soft-launch-readiness]

tech-stack:
  added: []
  patterns:
    - "Client-safe env-gate module pattern (payments-config.ts mirrors supabase/config.ts's accountsEnabled fail-open convention)"

key-files:
  created:
    - scanready/src/lib/payments-config.ts
  modified:
    - scanready/src/lib/legal-data.ts
    - scanready/src/app/app/page.tsx
    - scanready/src/app/agb/page.tsx
    - scanready/src/app/datenschutz/page.tsx

key-decisions:
  - "paymentsEnabled() lives in its own module rather than stripe.ts because stripe.ts imports the server-only stripe package at module scope; a 'use client' import of stripe.ts would leak server code into the browser bundle"
  - "Datenschutz Zahlungsabwicklung section gated on (payments || accounts), not payments alone, because the accounts-only subscription path also documents Stripe processing and section 7 cross-references it as 'Abschnitt 5'"
  - "AGB/Datenschutz imports use double quotes to match each file's pre-existing quote convention, rather than the single-quote form literally written in the plan's automated verify grep; the plan's own instruction to mirror the existing accountsEnabled import style takes precedence, and the import is present under either quote style"

requirements-completed: ["260717-g8q-soft-launch-readiness"]

duration: ~20min
completed: 2026-07-17
status: complete
---

# Quick Task 260717-g8q: Soft-Launch Readiness Summary

**Filled the founder operator identity into legal-data.ts and added a paymentsEnabled() env gate that hides dead-end paid CTAs and paid legal-page sections whenever NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is unset.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-17
- **Tasks:** 3/3 completed
- **Files modified:** 4 (1 created, 4 modified; legal-data.ts counted once, payments-config.ts is new)

## Accomplishments

- `LEGAL` in `scanready/src/lib/legal-data.ts` now carries real founder-provided operator identity (name, street, city, email) instead of `FOUNDER_TODO` placeholder markers; `country` and `vatLine` left untouched.
- New `scanready/src/lib/payments-config.ts` exports `paymentsEnabled(): boolean`, a client-safe single source of truth for whether Stripe-backed paid features (Humanizer+, Bewerbungspaket) are live.
- `/app` no longer renders the Humanizer+ CTA or either locked-state PDF-export purchase CTA when payments are off, while already-unlocked (paid-for) PDF export still renders regardless of the flag.
- AGB and Datenschutz pages hide/renumber paid-feature sections to match the deployed configuration in all four `{payments} x {accounts}` combinations, so the live legal text never describes processing (Stripe purchases, Widerruf) that does not exist in the current deploy.

## Task Commits

1. **Task 1: Fill LEGAL operator identity and add the client-safe paymentsEnabled() gate** - `1ec6fe3` (feat)
2. **Task 2: Hide the three dead-end paid CTAs in /app when payments are off** - `d2dfece` (fix)
3. **Task 3: Gate paid legal sections in AGB + Datenschutz with contiguous renumbering** - `cdb5fb4` (fix)

_No plan-metadata commit was made per this task's constraints: the orchestrator handles the docs commit (SUMMARY.md/STATE.md are intentionally left uncommitted here)._

## Files Created/Modified

- `scanready/src/lib/legal-data.ts` - LEGAL.operatorName/street/city/email filled with founder data; header comment rewritten with two confirmation notes
- `scanready/src/lib/payments-config.ts` - new module, exports `paymentsEnabled()`
- `scanready/src/app/app/page.tsx` - imports `paymentsEnabled`; wraps the Humanizer+ button and both PDF-export purchase-CTA buttons
- `scanready/src/app/agb/page.tsx` - imports `paymentsEnabled`, computes `payments`; gates Geltungsbereich/Anbieter, Leistung und Preis, and Widerrufsbelehrung sections; renumbers Abonnement and Gewaehrleistung headings
- `scanready/src/app/datenschutz/page.tsx` - imports `paymentsEnabled`, computes `payments`; inline-gates the Stripe-fraud-cookie sentence in section 3; gates section 5 (Zahlungsabwicklung) on `(payments || accounts)`; renumbers Ihre Rechte heading

## Decisions Made

- `paymentsEnabled()` kept in its own tiny module (never folded into `stripe.ts`) because `stripe.ts` imports the server-only `stripe` package at module scope; importing it from a `'use client'` component would pull server code into the browser bundle.
- Datenschutz section 5 (Zahlungsabwicklung) is gated on `(payments || accounts)` rather than `payments` alone: the accounts-only subscription flow also runs through Stripe, and section 7's body cross-references "Abschnitt 5" for subscription payment processing, so the section must stay live whenever either payments or accounts is on.
- Kept double-quoted import statements in `agb/page.tsx` and `datenschutz/page.tsx` to match each file's existing quote convention (both files use double quotes exclusively), rather than the single-quote form literally written in the plan's automated verify grep command. The plan's own action text instructs "mirroring the existing accountsEnabled import" style, which is double-quoted in these two files; the import itself is present and correct either way. Ran the plan's exact literal verify commands and note the quote-style mismatch below as the sole deviation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/plan inconsistency] AGB/Datenschutz import quote style**
- **Found during:** Task 3 (gating AGB + Datenschutz)
- **Issue:** The plan's `<verify>` automated command for Task 3 greps for `import { paymentsEnabled } from '@/lib/payments-config'` with single quotes, but both `agb/page.tsx` and `datenschutz/page.tsx` use double-quoted import strings exclusively throughout (matching their existing `accountsEnabled` import), and the plan's own action text says to mirror that existing style.
- **Fix:** Used double quotes (`import { paymentsEnabled } from "@/lib/payments-config";`) to match file convention. The import itself satisfies every functional requirement (present, correct source, used correctly); only the literal quote-character grep in the plan text would fail if run verbatim.
- **Files modified:** scanready/src/app/agb/page.tsx, scanready/src/app/datenschutz/page.tsx
- **Verification:** Confirmed via `grep -n "paymentsEnabled" <file> | grep import` that the import line exists and is wired correctly in both files; tsc/test/build all pass.
- **Committed in:** cdb5fb4 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (plan-verify-script inconsistency, no functional impact)
**Impact on plan:** No scope creep. The import behaves identically regardless of quote character; this only affects a literal-string grep check in the plan's own verify block, not the plan's stated intent (mirror existing file style).

## Issues Encountered

None.

## Founder Flags (action required before production promotion)

1. **Confirm the ladungsfaehige Anschrift.** `LEGAL.street` is currently set to "Teststraße 1, 22299 Hamburg". This reads like a test/placeholder address. Section 5 DDG requires a real postal address at which the operator can actually be reached (a "ladungsfaehige Anschrift"). This MUST be confirmed as the real address before the site is promoted to production. See the header comment in `scanready/src/lib/legal-data.ts` and `scanready/docs/humanizer-golive.md`.
2. **Confirm the contact email.** `LEGAL.email` was defaulted to `kilian.hartmann@liloplus.de` from the founder profile on file, not explicitly re-confirmed for this specific purpose (Impressum/GDPR Art. 13 contact). Please confirm this is the correct public-facing contact address before go-live.

## User Setup Required

None - no external service configuration required. This task only edits application source; it does not touch environment variables, Stripe, or Supabase configuration. `paymentsEnabled()` and `accountsEnabled()` continue to read existing env vars as before.

## Next Phase Readiness

- The deployed site (with no Stripe key set) will now show a coherent free-only experience: no dead-end paid CTAs, no legal text describing non-existent paid processing.
- The moment a founder sets `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel, the Humanizer+ CTA, both PDF-export purchase CTAs, and the paid AGB/Datenschutz sections reappear automatically with correct contiguous numbering - no further code change needed for that transition.
- Outstanding founder gates (unchanged by this task): Stripe test-key E2E, VAT decision, native-speaker legal review, Vercel production promotion - see CLAUDE.md and `scanready/docs/humanizer-golive.md`.

---
*Phase: quick-260717-g8q*
*Completed: 2026-07-17*

## Self-Check: PASSED

All 5 created/modified source files confirmed present on disk; all 3 task commit hashes (1ec6fe3, d2dfece, cdb5fb4) confirmed present in git log. tsc/test/build all green after each task and at final verification.
