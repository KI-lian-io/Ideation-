# Phase 3: Analytics + Security Guards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 3-Analytics + Security Guards
**Areas discussed:** Analytics scope (defer decision), Input-length guards
**Areas selected but collapsed by the defer:** Analytics consent posture, Event taxonomy & properties, Dev/prod gating & resilience (all analytics-specific → moot once analytics was deferred)

---

## Analytics scope (pivotal)

The user selected all four gray areas, then — when asked about consent posture — replied "For what do we use PostHog? Why do we need it?", questioning the premise. After a plain-English explanation of the funnel's purpose (where users drop off, whether the tool delivers, paywall signal) and an honest YAGNI counter (deferrable, but cheap and early-traffic data is unrecoverable), the user chose **Defer**.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep analytics in Phase 3 (cookieless, EU, 5 events) | Build the funnel now alongside the guards | |
| Defer analytics to a pre-launch phase; ship only guards now | Leaner now; add the funnel right before driving traffic | ✓ |

**User's choice:** Defer analytics; Phase 3 becomes Security Guards only.
**Notes:** EU Cloud was selected before the defer and is preserved as the locked approach for the future analytics phase (D-04). Consent posture / event taxonomy / dev-prod gating were not resolved because they became moot — their sensible defaults (cookieless, 5 events, prod-only) are recorded in D-04 for the future phase.

---

## Input-length guards

| Question | Options | Selected |
|----------|---------|----------|
| Limits | Moderate (30k/15k/2k) ✓ · Tight (15k/8k/1k) · You decide | Moderate |
| Placement | Server 400 + client counter ✓ · Server-only 400 | Server 400 + client counter |
| Message language | German ✓ · Bilingual · English | German |

**User's choice:** Moderate per-field limits; server 400 + client live counter & disabled submit; German reject messages.
**Notes:** Existing `/api/parse` messages are English — to be aligned to German during planning.

---

## Claude's Discretion

- Exact German message wording per field; char-counter placement/styling; combined vs per-field 400 detail.

## Deferred Ideas

- PostHog 5-event funnel (TRUST-02 + OPS-01) → pre-launch / deploy-adjacent phase (approach locked in CONTEXT D-04).
- Rate limiting / per-IP throttling → only if abuse appears (out of TRUST-03's length-only scope).
- Server-side request logging → intentionally excluded (zero-retention).
