---
phase: "04"
plan: "03"
subsystem: "ops/deploy"
status: complete
tags: ["vercel", "deploy", "maxduration", "model-fallback", "metadatabase", "sc4"]
dependency_graph:
  requires: ["04-01", "04-02"]
  provides: ["public-deploy", "cover-letter-300s-config", "metadatabase"]
  affects: []
tech_stack:
  added: []
  patterns: ["vercel.json functions.maxDuration in sync with route segment config", "metadataBase from VERCEL_PROJECT_PRODUCTION_URL env", "documented model fallback (Opus→Sonnet) per D-05"]
key_files:
  created:
    - scanready/vercel.json
  modified:
    - scanready/src/app/api/cover-letter/route.ts
    - scanready/src/lib/anthropic.ts
    - scanready/src/app/layout.tsx
decisions:
  - "Cover-letter GENERATION_MODEL switched claude-opus-4-8 → claude-sonnet-4-6 (the pre-documented D-05 fallback) to retire the Opus + adaptive-thinking risk against the 300s Hobby ceiling. Pipeline logic unchanged; one-line revert if quality delta warrants a Pro 800s tier."
  - "maxDuration=300 kept in sync across vercel.json and the route segment config (override-drift pitfall)."
  - "metadataBase resolved from VERCEL_PROJECT_PRODUCTION_URL (stable production domain) with localhost dev fallback — clears the relative-OG-URL build warning without hardcoding the per-deploy hash URL."
  - "SC4 closed pragmatically per owner direction: live flow confirmed working end-to-end by the owner; Opus retired in favour of Sonnet so the 300s timing question no longer applies. Formal Function-Log P95 numbers were NOT captured (owner waived)."
metrics:
  completed_at: "2026-06-23T21:15:58Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Phase 04 Plan 03: Vercel Deploy + Timing Proof Summary

The branded app is deployed and live on Vercel (Hobby, default `*.vercel.app` subdomain). The cover-letter function is configured for the 300s ceiling, and the Opus-vs-300s timing risk was retired by adopting the documented Sonnet fallback rather than relying on measured headroom.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Deploy config — bump cover-letter maxDuration 120→300, vercel.json in sync, verify prod build | 65ca720 | Done |
| 2 | Checkpoint: human deploy to Vercel + Production ANTHROPIC_API_KEY + Node 20.x | (human-action) | Done — owner deployed; live URL returned |
| 3 | SC4 disposition — adopt Sonnet fallback (D-05) + metadataBase; finalize | (this commit) | Done |

## What shipped

- **Live deploy.** Owner created the Vercel project (root `scanready/`), provisioned `ANTHROPIC_API_KEY` in Production, and deployed from `claude/ecom-low-barrier-tools-zpyb10`. Deployment responds and serves the app (verified HTTP-reachable; currently behind Vercel Authentication — see open items).
- **300s function config.** `maxDuration = 300` in both `vercel.json` (`functions["src/app/api/cover-letter/route.ts"]`) and the route segment export, kept in sync.
- **Model fallback (D-05).** `GENERATION_MODEL` → `claude-sonnet-4-6` in `src/lib/anthropic.ts`. This is the pre-documented cost/speed lever; the cover-letter streaming pipeline is unchanged. Eliminates the Opus + adaptive-thinking risk of approaching the 300s ceiling.
- **metadataBase.** Added to `layout.tsx`, sourced from `VERCEL_PROJECT_PRODUCTION_URL` (stable production domain, dev→localhost). Clears the relative-OG-URL build warning for the landing's `/og-image.svg`.

## SC4 disposition (OPS-02)

The RESEARCH rated "does Opus fit in 300s?" LOW confidence — answerable only by a real deploy. Rather than collect Function-Log P95 numbers, the owner elected to **switch the cover-letter model to Sonnet 4.6** (the documented fallback), which removes the timing question entirely (Sonnet is materially faster than Opus + adaptive thinking and sits comfortably under 300s). The live end-to-end flow was confirmed working by the owner. **Formal P95 Function-Log measurements were not recorded** — this is a deliberate, owner-approved simplification, not an oversight. If real-world cover-letter runs ever 504, the escalation path remains: confirm Sonnet timings in Function Logs, or upgrade to Pro (800s ceiling, D-22).

## Open items (not blockers for this phase)

- **Vercel Authentication is enabled** on the deployment (returns 401 to the public). Fine for owner testing now; must be disabled (Settings → Deployment Protection) before Phase 5 public distribution.
- **Production domain** for sharing: use the stable alias (Vercel → Domains), not the per-deploy hash URL.
- Local-only build noise: a stray `~/package-lock.json` makes Next infer the wrong workspace root locally; harmless on Vercel (Root Directory = `scanready`).

## Self-Check: PASSED

- `npx tsc --noEmit` clean.
- `npm run build` compiles; 7 static pages generated; no relative-OG-URL warning.
- `maxDuration: 300` verified in sync (vercel.json + route).
- No secret committed; `ANTHROPIC_API_KEY` provisioned server-side in Vercel (non-`NEXT_PUBLIC_`).
