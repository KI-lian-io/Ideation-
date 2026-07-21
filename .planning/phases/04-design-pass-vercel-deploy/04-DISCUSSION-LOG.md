# Phase 4: Design Pass + Vercel Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 4-design-pass-vercel-deploy
**Areas discussed:** Landing ↔ tool structure, Visual direction / brand, Working name, Deploy target, Audience & positioning (re-opened), Landing language, Before→after visual, OG/favicon, Accessibility

---

## Landing ↔ tool structure

| Option | Description | Selected |
|--------|-------------|----------|
| Hero above the tool (1 page) | Single page, hero stacked above the existing flow | |
| Separate landing route | `/` marketing landing, tool behind a CTA | ✓ |
| Slim value header only | Tool-first + a compact value strip | |

**User's choice:** Separate landing route.
**Notes:** Tool path defaults to `/app`. UI-02 "one page" still holds for the tool flow.

### Follow-up — landing proof element

| Option | Description | Selected |
|--------|-------------|----------|
| Before → after transformation | Show résumé morphing into a Lebenslauf | |
| Founder build-in-public story | Lead with the founder's story | |
| Trust posture front-and-center | Lead with zero-retention/grounded guarantees | |
| All three, stacked | Transformation → trust → founder | ✓ |

**User's choice:** All three, stacked (transformation hook → trust → founder).

---

## Visual direction / brand

| Option | Description | Selected |
|--------|-------------|----------|
| A · Restrained minimal + deep blue | Zinc base + one deep-blue accent | |
| B · Paper / credential | Warm paper tones + serif + ink | |
| C · Modern SaaS + emerald | Confident product look, emerald accent | |
| Hybrid: A + B serif headings | A's structure + B's serif headings | ✓ |

**User's choice:** Hybrid A+B (asked to see mockups of A/B/C first — three browser-frame hero mockups were rendered for comparison — then chose the hybrid).
**Notes:** White/zinc base + deep-blue trust accent + serif headings on hero/sections + sans body.

### Follow-up — theme

| Option | Description | Selected |
|--------|-------------|----------|
| Light-only | Force one light theme; drop dark variants | ✓ |
| Keep auto dark mode | Honor existing `dark:` variants | |

**User's choice:** Light-only.

---

## Working name / wordmark

| Option | Description | Selected |
|--------|-------------|----------|
| Keep ScanReady | Ship as ScanReady | |
| Rename now | Pick a new name before public | |
| Keep for now, revisit pre-launch | Build under ScanReady; name gate before Phase 5 | ✓ |

**User's choice:** Keep ScanReady for Phase 4; naming decision gated before the Phase 5 public push / custom domain.

---

## Deploy target (Vercel)

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel subdomain now | Default `*.vercel.app` | ✓ |
| Custom domain now | Buy + wire a domain this phase | |

| Option (Tier) | Description | Selected |
|--------|-------------|----------|
| Hobby (free) | Free tier, ~300s ceiling w/ Fluid Compute | ✓ |
| Pro | Paid, ~800s ceiling | |

**User's choice:** Vercel subdomain + Hobby tier.
**Notes:** `maxDuration` in `vercel.json` sized to the Hobby ceiling; confirm the Opus stream fits during deploy.

---

## Audience & positioning (re-opened by user)

The user raised (via free-text) that the landing sells only the US/UK-expat localization angle and misses the second "authentic applications" angle, and asked to **re-open the target customer** and **fold in research** (psychology + marketing best practices). A research workflow ran: 3 parallel researchers (audience strategy, dual-angle positioning, high-conversion landing best-practices) → synthesis → adversarial stress-test.

**Audience decision:**

| Option | Description | Selected |
|--------|-------------|----------|
| Broaden messaging, keep reachable launch | Customer = "internationals applying for jobs in Germany" (neutral copy); launch motion stays on US/UK + intl uni grads | ✓ |
| Pivot primary to non-EU migrants now | Make India/Turkey/etc. the explicit primary GTM | |
| Keep US/UK primary, just add the angle | Conservative; only add the authentic angle | |

**User's choice:** Broaden messaging, keep reachable launch.
**Notes:** Critic flagged that naming non-EU migrants the *primary GTM* contradicts the solo build-in-public motion; resolution is nationality-neutral copy (captures the larger inflow via SEO) without a GTM pivot the founder can't execute. Two guardrail fixes applied: (1) authentic angle ships as quality/voice, never "rejected as AI"/detection-evasion; (2) no outcome promises (capability framing only). Live-demo-on-landing and Anschreiben per-change-rationale flagged as out-of-scope/backend-gap.

---

## Additional sub-areas

| Sub-area | Decision |
|----------|----------|
| Landing language | English-primary (German inside document artifacts + wordmark/nav accents) — from research |
| Before→after visual | Static hand-authored mockups, led by the founder's own dogfooded example — from research/critic |
| OG / favicon | Clean minimal now, polished social card deferred to Phase 5 (name gate) |
| Accessibility | WCAG-AA pass on landing + tool as part of the design (not a formal third-party audit) |

---

## Claude's Discretion

- Tool route path name (`/app` default).
- Exact final landing copy wording (within the no-evasion / no-outcome-promise guardrails).
- Mockup rendering technique (SVG vs HTML/CSS), icon choices, spacing.
- `globals.css` cleanup + serif font choice.

## Deferred Ideas

- PROJECT.md "Customer" line + Key Decisions update (strategy change from this discussion).
- Phase 5: final name + custom domain + polished OG card; non-US/UK before/after assets; English-only SEO target set (exclude German-language KI terms).
- Phase 6: PostHog funnel.
- v2: live "paste box IS the demo" hero; PDF upload; live counter (only if real); Anschreiben per-change rationale (backend); source-CV-origin prompt hint; B2B pilot; paywall + Stripe.
- Rejected: native-German / pure anti-AI-slop audience; per-nationality features; non-English UI.
