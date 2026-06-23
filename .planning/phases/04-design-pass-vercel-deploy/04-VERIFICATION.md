---
phase: 04-design-pass-vercel-deploy
verified: 2026-06-23T22:00:00Z
status: passed
score: 9/9
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "PostHog key configured in the production environment (ROADMAP SC3 wording)"
    reason: "ROADMAP SC3 says 'PostHog key configured' but D-23 (locked before planning) deferred PostHog to Phase 6. OPS-03 in REQUIREMENTS.md was originally written before the Phase-6 analytics deferral was finalized. The executed plan (04-03) explicitly excludes the PostHog key as a Phase-4 deliverable, and REQUIREMENTS.md itself shows OPS-01/TRUST-02 (PostHog) mapped to Phase 6. This is a roadmap wording lag, not a missed deliverable."
    accepted_by: "kilian"
    accepted_at: "2026-06-23T22:00:00Z"
re_verification: null
---

# Phase 4: Design Pass + Vercel Deploy — Verification Report

**Phase Goal:** The landing page and tool UI are conversion-oriented and German-market-credible, and the app is publicly live on Vercel with streaming completing within the function time limit.
**Verified:** 2026-06-23T22:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Landing page communicates zero-retention, grounded output, norm-correct — trust-forward, not generic AI-purple (SC1 / UI-01) | VERIFIED | `src/app/page.tsx` 531-line Server Component: serif Lora headings, deep-blue accent rationed to 5 contexts, Section 4 "Zero-retention, by design." with lock icon and three checkmarks, white/zinc surface — no AI-purple, no gradients |
| 2 | Tool UI presents full four-step flow on one page, mobile-readable (SC2 / UI-02) | VERIFIED | `src/app/app/page.tsx` exists at `/app` with `'use client'`, full AppState machine (3 AppState references), responsive grid classes throughout, `<main aria-label="ScanReady tool">` |
| 3 | App is publicly reachable on a Vercel URL with ANTHROPIC_API_KEY in production (SC3 / OPS-02+OPS-03) | VERIFIED | 04-03-SUMMARY.md documents owner deploy, live URL returned, `ANTHROPIC_API_KEY` provisioned server-only (non-NEXT_PUBLIC). No `NEXT_PUBLIC_ANTHROPIC` found anywhere in `src/` or `vercel.json`. |
| 4 | PostHog key configured in production environment (SC3 ROADMAP wording) | PASSED (override) | Override: PostHog deferred to Phase 6 per D-23 and confirmed in REQUIREMENTS.md traceability (OPS-01/TRUST-02 → Phase 6). Roadmap SC3 wording predates the analytics-deferral decision. — accepted by kilian on 2026-06-23 |
| 5 | Cover-letter stream completes end-to-end without hitting function time limit; maxDuration declared (SC4 / OPS-02) | VERIFIED | `vercel.json` declares `maxDuration: 300` for cover-letter route; `src/app/api/cover-letter/route.ts` line 6 exports `maxDuration = 300`; `src/lib/anthropic.ts` uses `GENERATION_MODEL = "claude-sonnet-4-6"` (documented D-05 fallback retiring the Opus-300s risk). Owner confirmed live end-to-end completion. Formal P95 log numbers intentionally not collected (owner decision — see caveat). |
| 6 | Light-only surface — no dark: classes remain anywhere (D-12) | VERIFIED | All five component files: `page.tsx` (landing): 0, `app/page.tsx` (tool): 0, `LebenslaufEditor.tsx`: 0, `NormGapPanel.tsx`: 0, `SkillChips.tsx`: 0, `EditableField.tsx`: 0, `globals.css`: no dark media block |
| 7 | Lora serif heading token + deep-blue accent token available app-wide via CSS variables and next/font | VERIFIED | `layout.tsx`: imports `Lora` from `next/font/google`, `variable: "--font-lora"`, wired onto `<html>`. `globals.css`: `--font-serif: var(--font-lora), Georgia, serif` and `--color-accent: #1d4ed8`. Landing uses `font-[--font-serif]` on h1 and all h2. |
| 8 | Route split: `/` is a Server Component landing, `/app` hosts the tool (D-01) | VERIFIED | `src/app/page.tsx`: no `'use client'`, exports `const metadata: Metadata`, 531 lines with 6 sections. `src/app/app/page.tsx`: `'use client'` on line 1, AppState machine present, `href="/"` top-bar wordmark. |
| 9 | maxDuration in sync across vercel.json and route segment; engines.node>=20.9.0; no NEXT_PUBLIC secret (OPS-03) | VERIFIED | `vercel.json` cover-letter `maxDuration: 300`, parse `maxDuration: 60`. `cover-letter/route.ts` line 6: `maxDuration = 300`. `package.json` `engines.node: ">=20.9.0"`. grep confirms zero `NEXT_PUBLIC_ANTHROPIC` in `src/` or `vercel.json`. |

**Score:** 9/9 truths verified (1 via accepted override)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scanready/src/app/layout.tsx` | Lora serif wired, real metadata, lang=en | VERIFIED | Imports `Lora`, `variable: "--font-lora"`, metadata title "ScanReady — Win the 8-Second German Recruiter Scan", `openGraph`, `metadataBase` from VERCEL_PROJECT_PRODUCTION_URL |
| `scanready/src/app/globals.css` | Light-only, Geist body, --font-serif, --color-accent, reduced-motion | VERIFIED | No dark media block, body uses `var(--font-geist-sans)`, `:root` declares `--font-serif` and `--color-accent: #1d4ed8`, `@media (prefers-reduced-motion: reduce)` guard present |
| `scanready/src/app/page.tsx` | Server Component landing, 6 sections, metadata, nav, footer, mockups, OG | VERIFIED | 531 lines, no `'use client'`, exports `metadata` with `openGraph.images: [{url: "/og-image.svg", ...}]`, 6 `<section>` elements, `<nav>`, `<main>`, `<footer>`, 3 `role="img"` mockups, IntersectionObserver motion |
| `scanready/src/app/app/page.tsx` | Tool flow at /app, 'use client', dark: stripped, h1 text-3xl, top-bar | VERIFIED | `'use client'` on line 1, 0 `dark:` classes, h1 `text-3xl`, h2 (CoverLetterInputView) `text-3xl`, `aria-label="ScanReady tool"`, `href="/"` top-bar |
| `scanready/vercel.json` | functions block, cover-letter maxDuration:300, parse maxDuration:60 | VERIFIED | Exact match — `"maxDuration": 300` and `"maxDuration": 60` in functions block |
| `scanready/src/app/api/cover-letter/route.ts` | maxDuration = 300, streaming logic unchanged | VERIFIED | Line 6: `export const maxDuration = 300`, no other logic change |
| `scanready/src/lib/anthropic.ts` | GENERATION_MODEL = claude-sonnet-4-6 (D-05 fallback applied) | VERIFIED | Line 19: `export const GENERATION_MODEL = "claude-sonnet-4-6"` with comment citing D-05 fallback |
| `scanready/public/og-image.svg` | OG card 1200x630, wordmark + headline + trust line | VERIFIED | File exists, contains "Zero-retention. Grounded only in your real facts." text, referenced by page metadata |
| Components: LebenslaufEditor, NormGapPanel, SkillChips | dark: classes stripped | VERIFIED | All three: 0 `dark:` occurrences |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `layout.tsx` | `globals.css` | `--font-lora` consumed by `--font-serif` in globals | VERIFIED | `globals.css` line 6: `--font-serif: var(--font-lora), Georgia, serif` |
| `src/app/page.tsx` (landing) | `src/app/app/page.tsx` (tool) | All CTAs `href="/app"` (D-02 — no embedded demo) | VERIFIED | 5 `href="/app"` occurrences in landing: nav CTA, hero CTA, Section 2 CTA, Section 3 CTA, Section 6 CTA |
| `src/app/page.tsx` | `globals.css` | Serif headings via `font-[--font-serif]` | VERIFIED | Pattern `font-[--font-serif]` found on h1 and all five section h2 elements |
| `vercel.json` | `cover-letter/route.ts` | `maxDuration: 300` must match route segment export | VERIFIED | Both declare 300; no drift |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript typecheck | `cd scanready && npx tsc --noEmit` | Exit 0, no errors | PASS |
| Production build | `cd scanready && npm run build` | Compiled successfully; 7 static pages; `/`, `/app` prerendered; no errors or warnings | PASS |
| No dark: classes across tool + components | `grep -rc 'dark:' page.tsx LebenslaufEditor.tsx NormGapPanel.tsx SkillChips.tsx` | All return 0 | PASS |
| Banned copy (D-06/D-07) | `grep -Eiq 'rejected as ai\|beat the filter\|get hired\|humanize' src/app/page.tsx` | No matches | PASS |
| NEXT_PUBLIC secret exposure | `grep -rq 'NEXT_PUBLIC_ANTHROPIC' src/ vercel.json` | No matches | PASS |
| maxDuration sync | vercel.json `"maxDuration": 300` vs route `maxDuration = 300` | Both 300 | PASS |

---

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| UI-01 | 04-02 | Conversion-oriented landing, trust-forward, not AI-purple | SATISFIED | 531-line Server Component landing with 6 locked sections, serif + zinc + blue-700 design, zero-retention band, no gradients |
| UI-02 | 04-01 | Tool UI full flow on one page, mobile-readable | SATISFIED | Tool at `/app`, responsive grid, all AppState phases present |
| OPS-02 | 04-03 | App publicly on Vercel, cover-letter stream within function limit | SATISFIED (with caveat) | Live deploy confirmed by owner; `maxDuration: 300` in sync; Sonnet fallback eliminates timing risk. P95 log numbers waived by owner. |
| OPS-03 | 04-03 | ANTHROPIC_API_KEY + Node 20.x; PostHog deferred (D-23) | SATISFIED | `ANTHROPIC_API_KEY` provisioned server-only; `engines.node: ">=20.9.0"`; PostHog correctly deferred to Phase 6. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/page.tsx` (Section 6) | ~405 | `{/* REPLACE WITH REAL CONTENT */}` comment with placeholder CV excerpt | INFO | Intentional per D-16 (spec explicitly permits placeholder structure marked with comment when founder's real example unavailable at build time). Not a stub — structure, accessibility, and copy guardrails are all production-ready. |
| `src/app/page.tsx` (Section 6) | ~402 | Section 6 `aria-labelledby` points to a `<p>` element, not an `<h2>` | WARNING | Proof strip section has no `<h2>` — only a styled eyebrow `<p>` labeled with the section ID. The spec said all sections should use `aria-labelledby` to an `<h2>`, but Section 6's eyebrow is intentionally a `<p>` (it's a visual label, not a semantic heading). Sections 1-5 all have proper h1/h2. No heading skip occurs. Low impact — the section is fully navigable. |
| `src/components/LebenslaufEditor.tsx` | 137, 477 | `text-xs` on section eyebrow labels | WARNING | Two eyebrow labels inside `LebenslaufEditor` remain at `text-xs` (the Phase 4 spec eliminated `text-xs` entirely). The tool page `app/page.tsx` and the landing were fully remediated; these two component label instances were missed. `text-xs` = 12px fails the UI-SPEC's readability consolidation goal (all labels to `text-sm`) though both use `text-zinc-400` which is eyebrow-/decorative-level text. |
| `src/components/SkillChips.tsx` | 65, 72, 78, 99, 124 | `text-xs` on chip labels and buttons | WARNING | Multiple `text-xs` occurrences in SkillChips. Same issue as LebenslaufEditor above — component internals not fully remediated to the consolidated type scale. |

No `TBD`, `FIXME`, or `XXX` debt markers found in any Phase-4-modified file.

---

### SC4 Caveat (Accepted — Not a Blocker)

The PLAN for 04-03 Task 2 required recording real Function-Log P95 durations. This was waived by the owner: instead of measuring Opus timing, the cover-letter model was switched to `claude-sonnet-4-6` (the pre-documented D-05 fallback), which eliminates the timing question (Sonnet is materially faster). The live flow was confirmed working end-to-end. The SUMMARY explicitly records the decision and escalation path (Pro tier at 800s). This is an accepted owner decision, not an oversight. Logged as a caveat, not a gap.

---

### Human Verification Required

None. All automated checks passed and no behavior-dependent truths were identified requiring runtime exercise beyond what the production deploy confirms.

---

### Gaps Summary

No blocking gaps. The phase goal is achieved: a conversion-oriented landing is live at `/`, the tool is accessible at `/app`, the brand identity (Lora serif, deep-blue accent, light-only) is wired app-wide, the build and typecheck pass, and the Vercel deploy is live with `ANTHROPIC_API_KEY` server-only, `maxDuration = 300` in sync, and `engines.node >= 20.9.0`.

**Three minor warnings (non-blocking):**

1. **Section 6 `aria-labelledby` on `<p>` instead of `<h2>`** — The proof strip section has no semantic `<h2>`; the `aria-labelledby` points to its styled eyebrow `<p>`. No heading skip, no functional impact. Low severity.

2. **`text-xs` survives in `LebenslaufEditor.tsx` (lines 137, 477) and `SkillChips.tsx` (multiple lines)** — The consolidated type scale (no `text-xs`) was applied to `page.tsx` and the landing but not fully propagated into component internals. The tool's interactive labels still use 12px type. This falls short of the UI-SPEC §Typography "text-xs eliminated entirely" contract. Recommend a cleanup pass in Phase 5 prep or as a standalone fix.

3. **Section 6 founder mockup is placeholder content** — Marked with `REPLACE WITH REAL CONTENT` per D-16. Intentional, not a defect.

---

*Verified: 2026-06-23T22:00:00Z*
*Verifier: Claude (gsd-verifier)*
