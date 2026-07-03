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

## Abuse protection
- [ ] Anthropic console: set a monthly spend cap + email alerts (the hard ceiling)
- [ ] Create an Upstash Redis database (free tier) and set UPSTASH_REDIS_REST_URL /
      UPSTASH_REDIS_REST_TOKEN in Vercel — without them, rate limiting is OFF (fail-open)
- [ ] Verify: 6th parse from one IP within an hour returns the German 429

## Rollback
- Unset NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY in Vercel → intent route
  returns 503, modal shows the init error, core free flow unaffected.
