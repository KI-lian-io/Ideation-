# Phase 3: Analytics + Security Guards - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning — **AFTER the ROADMAP restructure below (analytics deferred)**

<domain>
## Phase Boundary

**Scope narrowed during discussion.** This phase now delivers **input-length security guards only** — the "safe for real traffic" cost/abuse boundary on both API routes, plus a no-regression check on statelessness.

- **In scope:** TRUST-03 (input-length guards on `/api/parse` and `/api/cover-letter`, returning 400 on oversized input) + TRUST-01 (confirm nothing is persisted server-side — already true per `02-SECURITY.md`; must not regress, and guards must reject without logging rejected content).
- **Deferred by user decision (2026-06-23):** TRUST-02 (PostHog config) + OPS-01 (the 5 funnel events). Analytics moves to a **pre-launch / deploy-adjacent phase** so the funnel goes live exactly when real traffic starts (see Deferred Ideas + the locked approach in D-04). Rationale: analytics is non-blocking for the core value (the German docs); early-traffic funnel data is most valuable captured at launch, not before; the guards are the only part of "safe for real users" that's needed *now*.

Mode: **mvp** (per ROADMAP). This is a small, backend-leaning phase: per-handler length checks + client-side char counters; no new product features.

**✓ Phase 3 complete (2026-06-23) — all criteria verified.** This phase = "Security Guards" (TRUST-01 + TRUST-03). Analytics (TRUST-02 + OPS-01) was subsequently pushed to a low-priority post-MVP **Phase 6 "Analytics (post-launch)"**; Design/Deploy = Phase 4, Distribution = Phase 5.
</domain>

<decisions>
## Implementation Decisions

### Input-length guards (TRUST-03)
- **D-01 — Limits (moderate, per-field):** `resumeText` / `cvText` ≤ **30,000** chars · `jobPosting` ≤ **15,000** · each `answer` ≤ **2,000**. Per-field caps (not a single total-payload cap). Generous for real CVs/postings (a long CV ≈ 10–15k chars) while capping Opus input cost + abuse. Count by string length; be deliberate about umlauts (a `ä` is one JS UTF-16 char — fine — just don't double-count surrogate pairs).
- **D-02 — Placement (defense-in-depth):** Hard **server-side 400** on both routes is the real boundary (checked at the top of each `POST` handler, after `req.json()`, before the Anthropic call). **Plus** a client-side **live character counter + disabled submit** past the limit, so users never hit the 400 in normal use. The Phase-2 "disable submit until valid" gate (`disabled={jobPosting.trim()===''}`) is the reusable analog.
- **D-03 — Message language (German):** Reject messages are German, matching the existing Phase 1/2 UI chrome (e.g. `"Der Text ist zu lang (max. 30.000 Zeichen)."`). NOTE: `/api/parse` currently returns English (`"resumeText is required"`) — the planner should align both routes' user-facing guard messages to German. Keep the response shape consistent across both routes (recommend `{ error }` JSON, matching `/api/parse`'s existing pattern; the Phase-2 WR-01 fix already maps the cover-letter client to a controlled message).

### Statelessness (TRUST-01)
- **D-05 — No-regression + no rejection logging:** This phase must introduce **zero** server-side persistence. Guard rejections must NOT log the rejected CV/job-posting/answer content (logging oversized input would itself be a retention leak). `02-SECURITY.md` is the current stateless baseline to preserve.

### Analytics (deferred to Phase 4 — not a Phase-3 decision)
The PostHog funnel and its pre-locked approach (EU Cloud, cookieless, the 5 events, config flags, library) are **out of Phase-3 scope** and recorded in full under **Deferred Ideas** below — Phase 4 implements them. Intentionally not tracked as a Phase-3 `D-` decision.

### Claude's Discretion
- Exact German message wording per field.
- Where/how the client char counter renders (inline under each field, color shift near limit) — follow the Phase-1 UI-SPEC styling.
- Whether the server guard returns one combined 400 or per-field detail (keep it user-readable either way).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 3 entry. **Stale until restructured** (still says "Analytics + Security Guards"); active requirements after restructure = TRUST-01 + TRUST-03.
- `.planning/REQUIREMENTS.md` — TRUST-01 (stateless), TRUST-03 (length guard) active here; TRUST-02 + OPS-01 deferred.

### Files to modify (guards)
- `scanready/src/app/api/parse/route.ts` — add a `resumeText` length guard (currently only presence-checks); align error to German `{ error }`.
- `scanready/src/app/api/cover-letter/route.ts` — add `cvText` / `jobPosting` / per-`answer` length guards (currently presence-only).
- `scanready/src/app/page.tsx` — client char counters + disabled-submit on the CV input (`InputView`/`runParse` path) and on `CoverLetterInputView` (jobPosting + answers).

### Guardrails & baselines
- `.planning/PROJECT.md` — zero-retention / GDPR-as-a-feature core guardrail.
- `.planning/phases/02-cover-letter-flow/02-SECURITY.md` — current statelessness baseline (TRUST-01) to preserve.
- `.claude/CLAUDE.md` — locked PostHog tech decisions (for the future Phase-4 analytics — see Deferred Ideas).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `/api/parse` already returns `NextResponse.json({ error }, { status: 400 })` on missing input — extend the same pattern for length.
- `/api/cover-letter` already 400s on missing fields — add length to the same early-return block.
- Phase-2 disabled-submit gate (`disabled={jobPosting.trim() === ''}`) — the analog for "disable past char limit."
- Phase-1 UI-SPEC textarea + helper-text styling — for the live char counter.

### Established Patterns
- Stateless serverless routes; German UI chrome; `{ error }` JSON on parse, controlled client message on cover-letter (post WR-01).

### Integration Points
- Server: guard block at the top of each `POST` handler (after `req.json()`, before the Anthropic call).
- Client: char counters + disabled state in the two input views; no new components needed.
</code_context>

<specifics>
## Specific Ideas

Limits confirmed: `resumeText`/`cvText` 30k · `jobPosting` 15k · `answer` 2k. German reject copy, e.g. `"Der Text ist zu lang (max. 30.000 Zeichen)."`. Server 400 is the boundary; client counter is the courtesy.
</specifics>

<deferred>
## Deferred Ideas

- **PostHog analytics — the 5-event funnel (TRUST-02 + OPS-01)** — pushed to a low-priority post-MVP **Phase 6 "Analytics (post-launch)"** (Design/Deploy is Phase 4, Distribution Phase 5). Added after the MVP ships to measure usage — no longer "live the moment traffic starts." **Approach pre-locked for Phase 6 (do not re-decide):** PostHog **EU Cloud** (`eu.i.posthog.com`); **cookieless** (`persistence:'memory'` — no cookies/localStorage/device-IDs → no consent banner needed; per-session funnels only, no cross-session stitching); init `autocapture:false` + `ip:false` + `person_profiles:'identified_only'` (TRUST-02), pageview via the Suspense pattern; **5 client-side events** `start`/`parse_done`/`letter_done`/`copy`/`download` (resolves the ROADMAP-vs-CLAUDE.md count discrepancy in favor of ROADMAP) carrying non-PII properties only — never CV/job-posting/answer/letter text; `posthog-js ^1.391.0` + `instrumentation-client.ts` (no `posthog-node`); key in `NEXT_PUBLIC_POSTHOG_KEY`, **no-op gracefully** if unset or blocked by an adblocker, fire **only in production**.
- **Rate limiting / per-IP throttling** — a *different* abuse boundary than length (TRUST-03 is length-only) and awkward on stateless serverless without a store. Revisit only if real abuse appears post-launch.
- **Server-side request logging / metrics** — intentionally NOT added; would conflict with zero-retention (and D-05's no-rejection-logging rule).

### Pre-execution note
- Phase 2 remains pending **human UAT on Node ≥20.9** (`/gsd-verify-work 2`) and the ROADMAP restructure above is a prerequisite to planning Phase 3.
</deferred>

---

*Phase: 3-Analytics + Security Guards (analytics deferred → "Security Guards")*
*Context gathered: 2026-06-23*
