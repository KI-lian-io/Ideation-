# ScanReady Monetization — Staged Design (Humanizer+, Bewerbungspaket, Accounts)

**Date:** 2026-07-03
**Status:** Approved in brainstorming session; ready for implementation planning
**Owner:** Kilian Hartmann

## Summary

Monetize ScanReady in three stages, cheapest-to-validate first. Stage 1 ships an account-less one-shot purchase ("Humanizer+" refinement) as the willingness-to-pay test, plus two cheap must-fix gaps (legal pages, Gehaltsvorstellung/Eintrittstermin handling). Stage 2 is the existing distribution roadmap (unchanged, runs in parallel). Stage 3 (accounts + subscription) is designed at decision level but built only if Stage 1 shows conversion.

Pricing research (2026-07-03, six competitors) established: the market's paywall sits at *usable export*, not creation; document count is never the primary gate; the dominant billing shape is a trial-trap subscription ($2 trial → ~$26/4wks auto-renew) that ScanReady explicitly positions against. Full findings in the session log; key consequence: **one-shot honest pricing is a differentiator, and the print-ready PDF export (in design now) becomes the paid artifact when it ships.**

## Decisions locked in this session

| # | Decision | Choice |
|---|----------|--------|
| D1 | Humanizer+ scope | Grounded tone/register/redundancy refinement on the user's own generated text. NOT AI-detection-signature stripping — detection evasion stays banned (CLAUDE.md guardrail). |
| D2 | Billing shape | Humanizer+: one-time per-use purchase (~€2.99). Accounts (Stage 3): monthly subscription ~€3.99–5.99. No weekly billing, no low-price auto-renew trial patterns. |
| D3 | Free/paid line | Free (unchanged, deliberately generous): full generation, editing, copy, .txt download. Paid: Humanizer+ now; print-ready PDF export joins the paid side when built, bundled as the "Bewerbungspaket" (~€4.99–7.99 one-shot per application). |
| D4 | Accounts model | Free account = save 1 application package. Subscription = 2+. Anonymous flow stays fully stateless. |
| D5 | Retention | Zero-retention drops **for account holders only** (store CV text, posting, answers, outputs so regeneration works). Anonymous users keep today's zero-retention. Landing copy + privacy docs must be updated in the same phase that ships storage. |
| D6 | Auth | Google OAuth first; magic-link fallback later. |
| D7 | Stack (Stage 3) | Supabase (Postgres + Auth + RLS, EU region) + Stripe. |
| D8 | Stage-1 payment UX | Stripe Payment Element embedded in a modal (no redirect — letter stays in client memory). Hosted Checkout rejected: redirect can strand a paid user with a lost letter. |

## Stage 1 — Humanizer+ one-shot (build now)

### Product

- CTA under the **finished** Anschreiben: "Feinschliff mit Humanizer+ — €2,99", framed as tailoring, never fixing.
- User picks one refinement direction: **Formeller** (Konzern/traditional), **Moderner** (startup/scale-up register), **Prägnanter** (tighten toward one page). The direction picker is the positioning answer: free output = native-quality letter; paid = a variant tuned to this employer's culture. Additive, not corrective.
- Refinement prompt guardrails: rephrase only content present in the input letter; no new facts, claims, employers, dates, or skills; no detection-evasion framing anywhere (prompt, code, marketing). Native-speaker-review nudge stays on refined output.

### Architecture (fully stateless — no DB, no cookies for anonymous users)

- `POST /api/humanizer/intent` → creates Stripe PaymentIntent (€2.99, `metadata.feature=humanizer`).
- `POST /api/humanize` → body `{ letterText, direction, paymentIntentId }`. Server verifies via Stripe SDK: PI `status=succeeded` AND `metadata.consumed != true`. Streams the refined letter (same streaming pattern as `/api/cover-letter`), sets `metadata.consumed=true` on stream completion.
- **Stripe is the single-use token store.** Failure story: payment ok + stream fails → client retries until PI is marked consumed (worst case: one duplicate Claude call, ~cents). Persistent failure → manual refund via Stripe dashboard; Stripe sends receipt email.
- Known accepted limitation: `metadata` update is not atomic — a deliberate double-submit race could get two refinements for one payment. Cost ~cents; acceptable, documented.
- Same per-field input-length guards as existing routes. No logging of letter content.

### Stage-1 additions (cheap must-fixes riding along)

1. **Impressum + Datenschutzerklärung pages.** Missing entirely today; legally required (§5 DDG, GDPR Art. 13) independent of monetization, mandatory before Stripe. Footer links from landing + tool + payment modal.
2. **Gehaltsvorstellung / Eintrittstermin handling.** Detect in the pasted job posting whether salary expectation / earliest start date are requested; if so, add them to the personalization questions and instruct the Anschreiben prompt to address them. Prompt + questions change, no new architecture.

### Legal checklist (founder tasks, pre-launch of the paywall)

- Impressum + AGB linked from the payment modal.
- Explicit Widerruf waiver checkbox ("deliver immediately, I lose my 14-day withdrawal right") before the pay button.
- Pay button labeled "zahlungspflichtig bestellen".
- Price displayed incl. VAT; decide Kleinunternehmerregelung (§19 UStG) vs. Stripe Tax before go-live.

### Measurement companion (strongly recommended, not a blocker)

Stripe gives purchases (numerator); there is no denominator without an event counter. Pull the backlogged cookieless PostHog funnel forward, or use Vercel Analytics custom events — either preserves the no-consent-banner posture. Success metric for Stage 1: conversion = Humanizer+ purchases / completed letters.

## Stage 2 — Distribution (existing roadmap, unchanged)

Runs in parallel per `distribution/` artifacts. Not part of this design. Native-speaker quality gate remains a blocker for going public.

## Stage 3 — Accounts + subscription (build only on Stage-1 conversion evidence)

Decision-level design; do not build until Stage 1 shows paying users.

- **Data model:** model as **CV + application packages** (1 CV → many applications/letters), NOT "multiple resumes". Tables: `profiles` (mirrors auth.users, `stripe_customer_id`), `subscriptions` (status, period end), `cvs`, `application_packages` (FK to cv; posting, answers, lebenslauf jsonb, anschreiben text), `humanizer_purchases` (receipt records).
- **Free/paid boundary:** free account saves 1 package; 2+ requires active subscription. Enforce with a DB-level constraint (not count-then-insert — two-tab race).
- **Downgrade:** extra packages become read-only (viewable, not editable, not usable as a base). Resubscribe restores. Free tier edit rights attach to the package the user designates.
- **Compliance (same phase, not later):** account-deletion flow (GDPR Art. 17), privacy-policy rewrite, Supabase EU-region pinning + DPA, landing-copy update (zero-retention claim must be scoped to anonymous use the day accounts ship), §312k one-click Kündigungsbutton on our site (Stripe portal alone does not satisfy it).
- **Payments:** Stripe subscriptions + webhook endpoint (signature verification, idempotent event handling).

## Product roadmap context (prioritized, not commitments)

**Minimum before pushing for users:** legal pages (Stage 1), PDF upload of existing CV (own follow-up phase; client-side `unpdf` extraction preserves zero-retention), Gehalt/Eintrittstermin (Stage 1), Ort/Datum/Unterschrift line in the Lebenslauf schema (needed by the PDF template anyway), native-speaker gate, analytics denominator.

**Edge expansions (in priority order):** posting-requirements coverage check (flag salary/start-date/license/language-level asks and where the letter addresses them); Anlagen/Zeugnisse guidance (Bewerbungsmappe order, Anabin/ZAB pointers for foreign degrees); Arbeitszeugnis decoder as a free SEO lead magnet; the anti-trial-trap pricing page as explicit marketing.

**Explicitly not building:** template gallery (one correct format is the USP), full ATS keyword scoring (commodity, v2), LinkedIn import (v2), interview prep (different product), accounts before Stage-1 evidence.

## Error handling

- Payment succeeded, refinement stream fails → client-side retry against unconsumed PI; after N failures show support/refund path. Never leave a paid user without either output or a refund route.
- Stripe unreachable at verify time → 503 with German user-facing message; no refinement without verification.
- Oversized `letterText` → same 400 German-message pattern as existing guards.

## Testing

- Unit: PI verification logic (succeeded/consumed/wrong-feature metadata), input guards.
- Integration: Stripe test mode end-to-end (intent → pay → stream → consumed; replay attempt rejected).
- Manual: Widerruf checkbox blocks pay button until checked; legal pages reachable from all surfaces; refined letter respects direction + grounding (spot-check against input letter for invented facts).

## Open items

- Exact Humanizer+ price (€2.99 default; founder may adjust before launch).
- Kleinunternehmerregelung vs. Stripe Tax decision.
- Bewerbungspaket bundle price point (€4.99–7.99 range) — finalize when PDF export ships.
- Whether Stage-1 measurement uses PostHog (backlogged plan) or Vercel Analytics custom events.
