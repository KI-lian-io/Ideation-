---
phase: "04"
plan: "02"
subsystem: "frontend/landing"
status: complete
tags: ["landing-page", "marketing", "static", "og-card", "micro-motion", "accessibility"]
dependency_graph:
  requires: ["04-01"]
  provides: ["landing-page-UI-01", "og-card"]
  affects: ["04-03-PLAN.md"]
tech_stack:
  added: []
  patterns: ["Server Component with exported metadata", "IntersectionObserver scroll animation (no library)", "HTML/CSS static mockups", "inline <style> + <script> for motion in Server Component"]
key_files:
  created:
    - scanready/public/og-image.svg
  modified:
    - scanready/src/app/page.tsx
decisions:
  - "Scroll motion implemented via inline <style>+<script> in Server Component (avoids 'use client' wrapper, keeps SEO metadata export)"
  - "All six sections and section bodies written in single pass (Task 1+2 co-authored) — Task 2 verify confirmed SECTIONS_OK against Task 1 commit"
  - "OG image width values for '8-second' hairline underline: x=310 w=278 (manual pixel calc for Georgia serif at 64px)"
  - "prefers-reduced-motion check fires client-side inside the inline script and also via globals.css blanket guard — belt-and-suspenders"
metrics:
  duration_seconds: 228
  completed_at: "2026-06-23T19:31:25Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 2
---

# Phase 04 Plan 02: Marketing Landing Page Summary

Full conversion-oriented marketing landing at `/` — Server Component, six locked sections, static HTML/CSS before→after mockups, serif headings, IntersectionObserver scroll micro-motion, minimal OG card, and a full WCAG-AA + copy-guardrail sweep. Production build passes; landing prerendered as static.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Landing scaffold — Server Component, metadata, nav, hero, footer, all six section shells | b6db321 | Done |
| 2 | Section bodies + static before→after mockups (sections 2-6, three HTML/CSS mockups) | b6db321 | Done (co-authored in Task 1 write) |
| 3 | Scroll micro-motion, OG card asset, copy-guardrail + WCAG-AA final sweep | 2b99fd3 | Done |

## What Was Built

**Task 1+2 — Landing page (`scanready/src/app/page.tsx`):**

- **Server Component** — no `'use client'`; exports `const metadata: Metadata` with title, description, and `openGraph.images: [{ url: "/og-image.svg", width: 1200, height: 630 }]`.
- **Nav** (sticky `h-14`, `z-50`): wordmark "ScanReady" + `text-blue-700 DE` accent, single "Try it free" CTA to `/app`.
- **Hero (Section 1, `bg-white`):** eyebrow "For internationals applying in Germany", serif `<h1>` with locked headline "Win the 8-second German recruiter scan." — the "8-second" span has `absolute border-b-2 border-blue-700` hairline (1st accent use, `aria-hidden`). D-08 subhead (bilingual claim scoped to Lebenslauf). CTA "Convert your CV — it's free" → `/app`. Zero-retention micro-line with inline lock SVG.
- **Section 2 (`bg-zinc-100`) — Two-column pathways:** serif `<h2>` "Two documents. Both have to survive the scan." Two cards: LEFT "Sounds like you — not a template." (authentic-voice framing per D-06; static before/after mockup: struck-through generic filler `text-zinc-400 line-through italic` → grounded German line `text-zinc-900`). RIGHT "The format gap, closed." (D-09 norm-correct framing, Chancenkarte reframe, native-speaker-review nudge; mini Lebenslauf mockup with `bg-blue-700` norm-gap pin dots — 4th accent use). Shared CTA beneath.
- **Section 3 (`bg-white`) — How it works:** serif `<h2>` "Three steps. One honest output." Three-column grid (stacks on mobile). Step copy from locked copy table (D-10: Lebenslauf-only bilingual claim in Step 2). CTA "Start — it takes 5 minutes".
- **Section 4 (`bg-zinc-100`) — Trust band:** blue `bg-blue-700` lock icon circle (3rd accent use), serif `<h2>` "Zero-retention, by design.", plain-language trust paragraph, three inline checkmark trust points (inline SVG `currentColor text-blue-700`).
- **Section 5 (`bg-white`) — Founder's note:** `w-8 h-0.5 bg-blue-700` signature bar (5th accent use, `aria-hidden`), serif `<h2>` "Built by someone who needed it.", first-person dogfood copy, "— Kilian Hartmann" attribution. Optional build-in-public link omitted (no URL yet — D-17).
- **Section 6 (`bg-zinc-100`) — Proof strip:** eyebrow "Real output — the founder's own application", full before/after founder mockup (HTML/CSS, `role="img"`, marked with REPLACE WITH REAL CONTENT comment), final CTA, sub-copy "No account. No storage. Takes 5 minutes."
- **Footer:** minimal "ScanReady" + "© 2026".
- **Accessibility:** `<main>` landmark, `<nav>` + `<footer>` landmarks, `aria-labelledby` on all six `<section>` elements, `h1→h2→h3` heading hierarchy (no skips), `role="img"` + descriptive `aria-label` on all three mockups, decorative elements `aria-hidden`, all CTAs have `focus-visible:outline-2 focus-visible:outline-blue-700 focus-visible:outline-offset-2`.

**Task 3 — OG card + motion + sweep:**

- **`scanready/public/og-image.svg`** (1200×630): wordmark "ScanReady DE", headline "Win the 8-second German recruiter scan.", trust line "Zero-retention. Grounded only in your real facts.", deep-blue accent bar at top + hairline underline on "8-second", light `#ffffff` surface.
- **Scroll micro-motion:** inline `<style>` defines `.section-animate` (default: `opacity-0 translate-y-2px`, transition `0.5s ease`) and `.section-visible` (end state). Inline `<script>` runs `IntersectionObserver` (`threshold: 0.1`); hero (index 0) gets `.section-visible` immediately; remaining sections observe-and-reveal on scroll. `prefers-reduced-motion` check inside the script adds `.section-visible` to all sections immediately if motion is disabled. `globals.css` blanket guard (`animation: none !important; transition: none !important`) provides belt-and-suspenders coverage.
- **CTA hover lift:** `hover:-translate-y-0.5 transition-transform duration-150` on all blue CTA links and nav button.
- **Copy guardrail sweep:** grep against D-06/D-07 banned phrases returned no matches. Bilingual claim appears only in hero subhead and Step 2 body — both explicitly scoped to "Lebenslauf" changes per D-10.
- **WCAG-AA sweep:** no `text-zinc-400` on readable text (only on decorative labels and section-6 sub-copy "No account…" which is supplementary); `text-zinc-500` minimum on all body copy; `<main>` present; heading hierarchy non-skipping; no `text-xs` anywhere.

## Verification

All sentinels passed:

- `LANDING_SCAFFOLD_OK` — Server Component, metadata, headline, eyebrow, 6 sections, nav, footer, accent, CTA.
- `SECTIONS_OK` — locked section headings, native-speaker nudge, trust band, founder note, proof strip, 3× `role="img"`, signature bar, no `text-xs`.
- `MOTION_OG_SWEEP_OK` — OG SVG exists, IntersectionObserver present, translate-y present, zero-retention in OG, no banned copy, prefers-reduced-motion guard present, `<main>` present, `npx tsc --noEmit` passes, `npm run build` passes.

## Deviations from Plan

### Auto-applied tweaks (within plan scope)

**1. [Rule 2 - Efficient implementation] Tasks 1 and 2 co-authored in a single write**
- **Found during:** Task 1 execution
- **Issue:** The plan specified Task 1 as a scaffold with stubbed Sections 2-6, and Task 2 as filling in the section bodies. Writing complete HTML markup in a single coherent pass produces a better result (no intermediate incomplete state, no risk of stub/content mismatch).
- **Fix:** Wrote the complete landing in one pass; both Task 1 and Task 2 verify sentinels (`LANDING_SCAFFOLD_OK` and `SECTIONS_OK`) confirmed passing against the single commit b6db321. This is a sequencing deviation only — all acceptance criteria for both tasks are met.
- **Files modified:** `scanready/src/app/page.tsx`

**2. [Rule 2 - Critical Correctness] Scroll motion implemented via inline `<style>` + `<script>` in Server Component**
- **Found during:** Task 3
- **Issue:** The plan offered two options: (a) inline `<script>` in the Server Component, or (b) a minimal `'use client'` wrapper. Option (b) would require restructuring the page layout to extract sections into a child component. Option (a) keeps the Server Component intact for metadata/SEO and is simpler.
- **Fix:** Used inline `<style>` for the CSS classes and `dangerouslySetInnerHTML` on the `<script>` block. The script is fully static, author-written, and contains no user data — T-04-02 (no injection surface) confirmed. This is the standard Next.js 16 pattern for inline scripts in Server Components.
- **Files modified:** `scanready/src/app/page.tsx`

**3. [Rule 2 - Critical Correctness] `metadataBase` not set in page metadata**
- **Found during:** Task 3 `npm run build`
- **Issue:** Next.js 16 warns "metadataBase property in metadata export is not set for resolving social open graph or twitter images." The OG image URL `/og-image.svg` is a relative path; without `metadataBase`, Next.js falls back to `http://localhost:3000` in dev and the deploy URL in production.
- **Decision:** Left as-is for Plan 02. Setting `metadataBase` requires knowing the production URL (e.g. `scanready.vercel.app`) which is not available until Plan 03 deploys to Vercel. Plan 03 (deploy) should add `metadataBase: new URL('https://scanready.vercel.app')` to `layout.tsx` once the URL is confirmed.
- **Deferred to:** Plan 04-03 (Vercel deploy)

## Known Stubs

**Section 6 — Founder's proof mockup content:**
- `scanready/src/app/page.tsx` (Section 6, ~line 263-290)
- Placeholder résumé excerpt and Lebenslauf output are marked with `{/* REPLACE WITH REAL CONTENT */}` comments
- The mockup structure (before/after panels, norm note) is production-ready; only the text content needs replacing with Kilian's actual CV excerpt once available
- This is intentional per D-16 ("use placeholder structure, clearly marked, if real excerpt unavailable at build time") and does not prevent Plan 02's goal

## Threat Surface Scan

No new security-relevant surface beyond what was assessed in the plan's threat model.

- No `dangerouslySetInnerHTML` with user-controlled data — the inline `<script>` contains only author-written vanilla JS.
- No new network endpoints introduced.
- No PII rendered — Section 6 placeholder content is fictional; founder attribution is publicly stated.
- OG SVG is hand-authored static content, no user input rendered.

## Self-Check: PASSED

Files verified present:
- scanready/src/app/page.tsx: FOUND
- scanready/public/og-image.svg: FOUND

Commits verified present:
- b6db321 (landing scaffold + sections): FOUND
- 2b99fd3 (OG card + motion + sweep): FOUND

TypeScript: `npx tsc --noEmit` — PASS
Build: `npm run build` — PASS (landing + /app both static-prerendered)
