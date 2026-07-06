# Humanizer+ Go-Live Checklist (founder actions)

Code-complete is NOT launch-ready. Every box below must be checked before the
Humanizer+ button ships to production traffic.

## Legal (blocking)
- [ ] Fill real data in `src/lib/legal-data.ts` (name, address, email) — no FOUNDER_TODO left
- [ ] Decide VAT: Kleinunternehmerregelung (§19 UStG) → keep the vatLine; otherwise
      remove it, register for VAT/OSS, and enable Stripe Tax
- [ ] Have Datenschutzerklärung + AGB reviewed (template text ≠ legal advice)
- [ ] Verify the Widerruf checkbox blocks payment when unchecked (manual test)
- [ ] Verify pay button label is exactly "Zahlungspflichtig bestellen (2,99 €)"

## Stripe (blocking)
- [ ] Live keys in Vercel env: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] One real production purchase + refund drill (buy with a real card, refund via dashboard)
- [ ] Stripe email receipts enabled (Settings → Emails → successful payments)
- [ ] Statement descriptor set to something recognizable (e.g. SCANREADY)

## Product
- [ ] Native-speaker review of refined output in all three directions (existing quality gate)
- [ ] Measurement denominator live (PostHog funnel or Vercel Analytics custom events)
      so conversion = purchases / letters_done is computable
- [ ] Landing page copy check: zero-retention claim still accurate (it is — no storage
      was added), but mention that payment uses Stripe

### Analytics setup (PostHog)

Client-side-only, cookieless PostHog is wired but OFF until configured - see
`src/instrumentation-client.ts` and `src/lib/analytics.ts`. Setup steps:

1. Create an EU Cloud project at eu.posthog.com (data residency - do not use the US cloud).
2. In Vercel, set `NEXT_PUBLIC_POSTHOG_KEY` to the project API key. Optionally set
   `NEXT_PUBLIC_POSTHOG_HOST` if not using the default `https://eu.i.posthog.com`.
3. Redeploy. Until the key is set, `track()` calls are no-ops and nothing is sent - no
   code change is needed to turn analytics on or off, only the env var.

Event list (all anonymous, no PII/user content in props - see the doc comment in
`src/lib/analytics.ts`):

| Event | Fires when |
|---|---|
| `cv_submitted` | user submits a CV for parsing |
| `parse_done` | parse succeeds |
| `letter_done` | cover letter stream completes successfully - **denominator** |
| `copy_download` | Lebenslauf/letter copied or letter downloaded (`kind` prop) |
| `humanizer_opened` | Humanizer+ modal mounts |
| `humanizer_paid` | Stripe payment succeeds - **numerator** |
| `humanizer_done` | refined letter fully delivered |

Conversion = `humanizer_paid` / `letter_done`, which is exactly the "Measurement
denominator live" checkbox above.

## Abuse protection
- [ ] Anthropic console: set a monthly spend cap + email alerts (the hard ceiling)
- [ ] Create an Upstash Redis database (free tier) and set UPSTASH_REDIS_REST_URL /
      UPSTASH_REDIS_REST_TOKEN in Vercel — without them, rate limiting is OFF (fail-open)
- [ ] Verify: 6th parse from one IP within an hour returns the German 429

## Rollback
- Unset NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY in Vercel → intent route
  returns 503, modal shows the init error, core free flow unaffected.

## Stage 3 gates (Bewerbungspaket, accounts, subscription) - added 2026-07-06

All Stage 3 code is on the branch and env-gated OFF. Nothing below activates
until the corresponding env vars exist.

### Bewerbungspaket (4,99 EUR one-shot, PDF export + included Humanizer+)
- [ ] Uses the SAME Stripe keys as Humanizer+ - no extra env needed; it is
      live as soon as Stripe keys are set
- [ ] Price check: 4,99 EUR is the code constant PAKET_PRICE_CENTS in
      src/lib/humanizer.ts (spec range 4,99-7,99) - change there if desired,
      and keep /preise and the AGB in sync
- [ ] Native-speaker review of the new German copy: PaketModal, /preise,
      /kuendigen, Datenschutz §7, AGB subscription/Paket sections
- [ ] Test-mode E2E: buy a Paket, export both PDFs, run the included
      Humanizer+ refinement, verify the second refinement asks for 2,99 EUR
- [ ] Print QA: export both documents via "Save as PDF" in Chrome/Safari/
      Firefox once with a real CV (DIN margins, page breaks, photo)

### Accounts + subscription (all steps in docs/stage3-accounts.md)
- [ ] Supabase EU project + run supabase/migrations/0001_stage3_accounts.sql
- [ ] Google OAuth client + Supabase provider config
- [ ] Vercel env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY
- [ ] Stripe: recurring Price (3,99-5,99 EUR decision) + webhook endpoint;
      Vercel env: STRIPE_SUBSCRIPTION_PRICE_ID, STRIPE_WEBHOOK_SECRET
- [ ] Legal review: §312k /kuendigen flow, AGB subscription section,
      Datenschutz account sections (they render only once accounts are
      enabled - review them with env set on a preview deployment)
- [ ] E2E: sign in, save 1 package (free), verify the 2nd is blocked,
      subscribe in test mode, verify the 2nd saves, cancel via /kuendigen,
      verify packages flip to read-only at period end
