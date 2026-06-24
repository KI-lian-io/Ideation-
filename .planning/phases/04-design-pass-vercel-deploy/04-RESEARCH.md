# Phase 4: Design Pass + Vercel Deploy — Research

**Researched:** 2026-06-23
**Domain:** Next.js 16 App Router route split; Vercel Hobby function limits + SSE streaming
**Confidence:** HIGH (all claims below sourced from installed code or live Vercel docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: `/` = marketing landing (server component); tool at `/app` (default path). Tool stays single-page.
- D-02: Hero CTA routes to existing tool. No live demo on `/`.
- D-03–D-05: Audience/positioning is messaging change only — zero backend changes in Phase 4.
- D-06–D-09: Authentic angle = quality/voice. No detection-evasion copy. Capability framing only.
- D-10: "Explains every change" copy scoped to the Lebenslauf (normGapNotes[]). Cover-letter route streams the letter only.
- D-11–D-13: Deep-blue accent, serif headings, Geist body, light-only, restrained motion.
- D-14–D-17: Landing in English-primary; 6-section blueprint; static before/after mockups.
- D-18–D-20: Keep "ScanReady" for Phase 4; OG/favicon minimal; layout.tsx metadata fix.
- D-21–D-23: Vercel Hobby subdomain; maxDuration in vercel.json sized to Hobby ceiling; ANTHROPIC_API_KEY in prod; PostHog DEFERRED to Phase 6.

### Claude's Discretion
- Tool route path name (`/app` default).
- Exact final landing copy wording (within D-06/D-07/D-08 guardrails).
- Mockup rendering technique (SVG vs HTML/CSS), icon choices, exact spacing.
- `globals.css` cleanup details; choice of serif font (credible Google/system serif).

### Deferred Ideas (OUT OF SCOPE)
- Final name + custom domain + polished OG card (Phase 5 gate).
- PostHog/analytics (Phase 6).
- PDF upload (v2); live "paste-box" interactive hero.
- German OR English output language choice (needs backend/prompt/UI changes, separate phase).
- B2B pilot; paywall + Stripe.
- Per-nationality features; non-English UI.
- German-language KI/Anschreiben SEO terms (Phase 5; explicitly excluded from native-German niche).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Conversion-oriented landing: trust-forward, zero-retention stated loudly, German-market-credible, not generic AI-purple | Q1 findings: landing lives at `src/app/page.tsx` as a new Server Component; metadata API covers OG/title; `globals.css` cleanup removes dark-mode auto-switch |
| UI-02 | Tool UI on one page, mobile-readable | Existing `page.tsx` (`'use client'`) moves to `src/app/app/page.tsx` as-is; no structural change needed |
| OPS-02 | App deployed publicly on Vercel; cover-letter stream completes within function time limit | Q2: Hobby ceiling is 300 s; route currently declares `maxDuration = 120`; vercel.json needed |
| OPS-03 | Production env configured (ANTHROPIC_API_KEY, Node pinned to 20.x) | `engines` already set to `>=20.9.0` in package.json; `.nvmrc` contains `20`; Vercel UI env var provision |
</phase_requirements>

---

## Summary

This research covers exactly two questions: how to wire the Next.js 16 App Router for the landing/tool split, and whether the Opus cover-letter stream survives the Vercel Hobby function ceiling.

**Q1 — Route split:** Next.js 16 App Router is standard for this task. The key facts sourced from installed `node_modules/next/dist/docs/` are: (a) `params` and `searchParams` are now **async Promises** (breaking change finalised in v16 — synchronous compat removed); (b) `metadata` / `generateMetadata` export is Server-Component-only; (c) the `'use client'` directive on the existing `page.tsx` is entirely safe to keep when the file is moved to a nested route. The landing (`/`) becomes a plain Server Component with a static `metadata` export. No breaking-change landmines apply to this codebase because `page.tsx` takes no `params` or `searchParams` and is already `'use client'`.

**Q2 — Vercel streaming:** Verified from live Vercel docs (last updated 2026-06-19): Hobby **maximum** is **300 s** (same as default; no headroom beyond 300 s on Hobby). The cover-letter route currently declares `export const maxDuration = 120`. That is under the ceiling but may not be enough for a slow Opus 4.8 + adaptive-thinking run. Setting it to `300` (the Hobby hard ceiling) is the correct move. Whether Opus 4.8 reliably completes a full Anschreiben under 300 s can only be confirmed by a real deploy test — do not fabricate certainty.

**Primary recommendation:** Create `src/app/app/page.tsx` (move tool), replace `src/app/page.tsx` with landing Server Component, fix `layout.tsx` metadata and serif font, add `vercel.json` with `maxDuration: 300` for the cover-letter function, provision `ANTHROPIC_API_KEY` on Vercel.

---

## Q1 — Next.js 16 App Router Route Split

### D-10 Confirmation (MANDATORY per scope)

**Verified from `scanready/src/app/api/cover-letter/route.ts`:**

```typescript
// line 6
export const maxDuration = 120;
// lines 59-63
for await (const event of stream) {
  if (
    event.type === "content_block_delta" &&
    event.delta.type === "text_delta"
  ) {
    controller.enqueue(encoder.encode(event.delta.text));
  }
}
```

The filter passes only `text_delta` events. Thinking blocks emit `thinking_delta` — they are excluded by this filter and never reach the client. **The route streams the letter text only** — no per-change English change-log for the Anschreiben. Landing copy claiming "we explain every change" must be scoped to the Lebenslauf `normGapNotes[]` only. D-10 is confirmed. [VERIFIED: scanready/src/app/api/cover-letter/route.ts]

### File/Route Layout

**Current state (confirmed by reading source):**
- `src/app/page.tsx` — 1053-line `'use client'` component with the full AppState machine [VERIFIED: scanready/src/app/page.tsx]
- `src/app/layout.tsx` — root layout; imports Geist Sans + Geist Mono from `next/font/google`; metadata still `"Create Next App"` [VERIFIED: scanready/src/app/layout.tsx]
- `src/app/globals.css` — dark-mode auto-switch via `@media (prefers-color-scheme: dark)`; body uses `Arial, Helvetica, sans-serif` (not the Geist CSS variable) [VERIFIED: scanready/src/app/globals.css]
- No `src/app/app/` directory exists yet [VERIFIED: filesystem check]
- No `vercel.json` exists yet [VERIFIED: filesystem check]

**Target layout after Phase 4:**

```
src/app/
├── layout.tsx          # Root layout — fix metadata, add serif font variable, remove dark-mode from globals.css
├── globals.css         # Remove @media dark block; remove Arial fallback; wire --font-geist-sans properly; add serif CSS var
├── page.tsx            # NEW — marketing landing Server Component (6 sections, static metadata export)
├── app/
│   └── page.tsx        # MOVED — existing 'use client' tool flow, re-skinned only
├── api/
│   ├── parse/route.ts  # Unchanged (maxDuration = 60 stays)
│   └── cover-letter/route.ts  # maxDuration bumped 120 → 300
└── favicon.ico         # Keep / update (D-20)
```

[VERIFIED: scanready/node_modules/next/dist/docs/ — page.md, layout.md, font.md]

### Server vs Client Component Boundary

The landing at `/` should be a **Server Component** (no `'use client'` directive). This allows:
- Static `export const metadata` for real title/description/OG (metadata export is Server-Component-only in Next.js 16 — confirmed in `generate-metadata.md`) [VERIFIED: scanready/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md]
- Static HTML served at CDN — zero JS needed for a static marketing page
- Natural SSR for the hero and six sections

The tool at `/app` keeps its `'use client'` directive. No changes needed to the directive or the AppState machine. The file is moved as-is; re-skinning only touches Tailwind class names and layout containers. [VERIFIED: scanready/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md]

**No hydration mismatch risk:** The existing `initialState` in `page.tsx` is already guarded ("Static, deterministic — no Date.now, Math.random, or window") [VERIFIED: scanready/src/app/page.tsx line 52 comment].

### Next.js 16 Breaking Changes — Impact Assessment

From `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` [VERIFIED]:

| Breaking change | Impact on this codebase |
|---|---|
| `params` / `searchParams` are async Promises | **No impact** — existing `page.tsx` and the new landing take zero params or searchParams. No `await params` needed. |
| Synchronous `cookies()` / `headers()` removed | **No impact** — neither route uses these. |
| `experimental_ppr` route segment config removed | **No impact** — not used. |
| `middleware` renamed to `proxy` | **No impact** — no middleware file. |
| Local images with query strings need `localPatterns.search` | **No impact** — no local image with query string. |
| `next lint` command removed | Minor: `package.json` `lint` script calls `eslint` directly — already compliant. |
| Turbopack default for dev + build | **Potential impact:** No custom webpack config exists; Turbopack should work. If build fails with webpack reference from a dependency, add `next build --webpack` as a fallback. |
| `dynamic`, `dynamicParams`, `revalidate`, `fetchCache` removed when `cacheComponents` is enabled | **No impact** — `cacheComponents` is not enabled and should not be enabled in Phase 4. |

**Key non-breaking fact:** The `'use client'` directive on the tool's `page.tsx` is fully compatible with Next.js 16. Moving it from `src/app/page.tsx` to `src/app/app/page.tsx` requires only updating the file path — the directive, imports, and component code are unchanged.

### Adding the Serif Font via `next/font/google`

From `font.md` [VERIFIED: scanready/node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md]:

```typescript
// In layout.tsx — add alongside existing Geist imports
import { Lora } from 'next/font/google'  // or Playfair_Display, Merriweather, etc.

const serifFont = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],   // for non-variable fonts; Lora has variable weight
})

// Apply to <html>:
<html className={`${geistSans.variable} ${geistMono.variable} ${serifFont.variable} h-full antialiased`}>
```

Fonts are downloaded at build time and self-hosted — no Google request from the browser at runtime. [VERIFIED: font.md line 13: "No requests are sent to Google by the browser."]

**Serif choices for the "paper credential" aesthetic (builder's discretion):**
- `Lora` — old-style serif, variable font, good for running headings, humanist feel
- `Playfair_Display` — high contrast, editorial, strong display weight
- `Merriweather` — print-style legibility, neutral authority

The `variable` option emits a CSS custom property that can be wired into `globals.css`:

```css
/* globals.css — add after existing @theme inline block */
@theme inline {
  --font-serif: var(--font-serif);   /* exposes to Tailwind as font-serif */
}
```

Then in Tailwind: `font-serif` applies the variable serif to any element.

### Per-Route Metadata (D-20)

Landing `src/app/page.tsx` **cannot** export `metadata` because `page.tsx` would be a Server Component but the `metadata` export must come from a **Server Component** — which it will be. Pattern from `generate-metadata.md` [VERIFIED]:

```typescript
// src/app/page.tsx (new landing — Server Component)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ScanReady — Win the 8-second German recruiter scan',
  description: 'Turn your CV into a norm-correct German Lebenslauf and an authentic Anschreiben. Bilingual output. Zero data retained.',
  openGraph: {
    title: 'ScanReady — Win the 8-second German recruiter scan',
    description: 'Turn your CV into a norm-correct German Lebenslauf and an authentic Anschreiben. Bilingual output. Zero data retained.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function LandingPage() { ... }
```

The root `layout.tsx` metadata (`"Create Next App"`) acts as a fallback; page-level metadata overrides it. The planner should also update `layout.tsx`'s base metadata to something sensible (e.g., `title: { default: 'ScanReady', template: '%s | ScanReady' }`).

**Important:** `metadata` is **not** compatible with `'use client'` components. The new landing **must** be a Server Component (no `'use client'`). The existing `page.tsx` tool component already has `'use client'`, so it correctly cannot export metadata — which is fine since `/app` does not need SEO metadata in Phase 4. [VERIFIED: generate-metadata.md line 110: "The metadata object and generateMetadata function exports are only supported in Server Components."]

### `globals.css` Required Changes (D-11, D-12)

**Current state confirmed from file:**
1. `@media (prefers-color-scheme: dark)` block auto-switches `--background` to `#0a0a0a` — this fights D-12 (light-only) [VERIFIED: scanready/src/app/globals.css line 15-20]
2. `body { font-family: Arial, Helvetica, sans-serif; }` — overrides Geist; Tailwind `font-sans` already uses `var(--font-geist-sans)` via `@theme inline`, but this body rule takes precedence [VERIFIED: scanready/src/app/globals.css line 25]

**Required edits:**
- Remove the `@media (prefers-color-scheme: dark)` block entirely
- Remove `font-family: Arial, Helvetica, sans-serif` from `body` (let Tailwind `font-sans` apply via CSS variable)
- Wire the deep-blue accent as a CSS custom property (e.g., `--color-accent: #1e3a5f;`) in `@theme inline`
- Add `--font-serif: var(--font-serif)` to `@theme inline` after adding the serif font in `layout.tsx`

### Anti-Patterns to Avoid

- **Do not add `'use client'` to the landing page.** The landing is pure static content; making it a Client Component loses SSR, SEO, and the metadata export.
- **Do not move the entire `app/layout.tsx` to a Client Component** to share state between landing and tool — they are completely separate routes with no shared state.
- **Do not use Next.js `Link` prefetch to the tool route from the landing unless confirmed compatible** — the tool is a `'use client'` page, but `Link` prefetch works fine across the boundary. No issue here.
- **Do not add `dynamic`, `revalidate`, or `fetchCache` route segment configs** — they are removed in Next.js 16 when `cacheComponents` is enabled; even without it, they are redundant for this static landing.

---

## Q2 — Vercel Hobby Function Duration + SSE Streaming

### Confirmed Hobby Ceiling

**From Vercel docs (last updated 2026-06-19)** [CITED: vercel.com/docs/functions/limitations]:

| Plan | Default | Maximum |
|------|---------|---------|
| Hobby | 300 s | **300 s (hard ceiling — no extension available)** |
| Pro | 300 s | 800 s (1800 s extended beta) |

The Hobby plan has **no headroom above 300 s**. This is both the default and the hard maximum. The `.claude/CLAUDE.md` note "~300s with Fluid Compute" is confirmed accurate.

### Current Route Declarations (Confirmed from Source)

| Route | `runtime` | `maxDuration` | Source |
|-------|-----------|---------------|--------|
| `/api/parse` | `nodejs` | `60` | [VERIFIED: scanready/src/app/api/parse/route.ts lines 5-6] |
| `/api/cover-letter` | `nodejs` | `120` | [VERIFIED: scanready/src/app/api/cover-letter/route.ts lines 5-6] |

**The cover-letter route already declares `export const maxDuration = 120`.** This is within the Hobby ceiling but leaves 180 s unused. Set it to `300` to use the full Hobby budget. The parse route's 60 s declaration is fine.

### `vercel.json` — Correct Pattern for Next.js 16

From the Next.js route segment config docs [VERIFIED: scanready/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md]:

> "Deployment platforms can use `maxDuration` from the Next.js build output to add specific execution limits."

The `export const maxDuration` in the route file is the **primary** mechanism — Next.js 16 embeds it in the build output, and Vercel reads it from there. A `vercel.json` with a `functions` block is a secondary override for platforms that need it, but it is not required when the route already declares `maxDuration`.

D-22 says "create `vercel.json`." A minimal `vercel.json` for Node pinning and region is appropriate. **Do NOT set `maxDuration` in `vercel.json` to override the per-route segment config** — they can conflict. The correct split is:

- Per-route `export const maxDuration` in the route file (already done; bump cover-letter to 300)
- `vercel.json` for Node version pin and optional region config

**Minimal `vercel.json`:**
```json
{
  "functions": {
    "src/app/api/cover-letter/route.ts": {
      "maxDuration": 300
    },
    "src/app/api/parse/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**Note:** If the per-route `export const maxDuration` in the source file and the `vercel.json` `functions[].maxDuration` both exist, Vercel uses the `vercel.json` value as an override. To avoid ambiguity, keep them in sync. The planner should update both.

### Node Version Pin

`package.json` already has `"engines": { "node": ">=20.9.0" }` [VERIFIED: scanready/package.json line 5-7]. `.nvmrc` contains `20` [VERIFIED: scanready/.nvmrc]. Vercel respects `engines.node` and `engines` in `package.json` when selecting the Node runtime. Node 20, 22, and 24 are all available on Vercel (confirmed in `.claude/CLAUDE.md` citing Vercel Node versions docs). No additional action needed for the pin — provision steps just require verifying the Vercel project uses Node 20.x (set in Vercel dashboard under Project Settings > General > Node.js Version if Vercel does not auto-detect it).

### Will Opus 4.8 + Adaptive Thinking Complete Under 300 s?

**Honest assessment — cannot be confirmed without a real deploy test.**

What is known from the codebase:
- `max_tokens: 4000` on the cover-letter route [VERIFIED: scanready/src/app/api/cover-letter/route.ts line 48]
- `thinking: { type: "adaptive" }` — adaptive thinking uses thinking tokens before the output; those tokens are not streamed to the client (thinking blocks are filtered out), but they do count against wall-clock time
- Anthropic's claude-opus-4-8 with adaptive thinking adds a variable pre-computation step

**What is unknown:** How many thinking tokens Opus 4.8 allocates for a typical cover-letter request, and what the P95 wall-clock time is under Vercel's cold-start + network latency conditions.

**Risk:** If Opus 4.8 adaptive thinking uses a large thinking budget on complex inputs, the function could hit 300 s on Hobby and return a 504 (`FUNCTION_INVOCATION_TIMEOUT`). This is a real risk that a deploy test must validate.

**Mitigation options (for planner to include as a conditional task):**
1. First deploy: test with a representative CV + job posting; measure actual duration in Vercel's Function Logs.
2. If P95 exceeds 280 s: switch `PARSE_MODEL` and `GENERATION_MODEL` to `claude-sonnet-4-6` for the cover-letter route (already anticipated in `anthropic.ts` as the cost lever); Sonnet is meaningfully faster.
3. Upgrade to Vercel Pro (800 s ceiling) if Opus quality is non-negotiable and timing is tight.

### `ANTHROPIC_API_KEY` in Vercel Production (D-23)

Provision via Vercel dashboard: Project > Settings > Environment Variables. Set as a non-`NEXT_PUBLIC_` variable (server-only). The route accesses it via `process.env.ANTHROPIC_API_KEY` through the `anthropic` client in `src/lib/anthropic.ts`. No code change needed — just the env var provision in the Vercel dashboard. **PostHog key is explicitly DEFERRED to Phase 6 per D-23.** Do not add a `NEXT_PUBLIC_POSTHOG_KEY` variable at this stage.

### SSE / ReadableStream Survival on Vercel

The cover-letter route uses a `ReadableStream` with chunked plain-text output, not Server-Sent Events (EventSource protocol). Vercel's Fluid Compute supports chunked transfer encoding / streaming for `nodejs` runtime functions. The route returns `new Response(body, { headers: { "Content-Type": "text/plain" } })` — this is a standard streaming response compatible with Vercel's platform [CITED: vercel.com/docs/functions/limitations — "For request handlers, this includes time spent processing the request and sending the response, including streamed responses."]. No special Vercel-specific configuration is needed beyond `maxDuration`. [VERIFIED: scanready/src/app/api/cover-letter/route.ts lines 77-80]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Font loading + self-hosting | Manual @font-face + preload links | `next/font/google` (already pattern in layout.tsx) |
| Metadata/OG tags | Manual `<head>` injection | `export const metadata` in Server Component page |
| Streaming HTTP response | Custom SSE infra | `new Response(ReadableStream)` — already implemented |
| Function timeout config | vercel.json + code duplication | `export const maxDuration` in route file (planner: keep route file and vercel.json in sync) |

---

## Common Pitfalls

### Pitfall 1: `metadata` export in a `'use client'` component

**What goes wrong:** Adding `export const metadata` to the tool's `page.tsx` (which has `'use client'`) causes a build error: "You are attempting to export metadata from a component marked with 'use client'".

**Why it happens:** `metadata` is Server-Component-only in Next.js 16.

**How to avoid:** The landing (`/`) is a Server Component with `metadata`. The tool (`/app`) has `'use client'` and correctly does **not** export metadata.

### Pitfall 2: `globals.css` dark-mode block fighting the light-only design

**What goes wrong:** The existing `@media (prefers-color-scheme: dark)` block flips `--background` to `#0a0a0a` for users with system dark mode. Since Phase 4 is light-only, the landing looks broken on dark-mode machines.

**Why it happens:** The create-next-app template adds this block by default.

**How to avoid:** Remove the entire `@media (prefers-color-scheme: dark) { :root { ... } }` block from `globals.css`. Also remove the existing `dark:` Tailwind variants from the existing `page.tsx` classes (noted in 01-UI-SPEC.md as a Phase 4 cleanup task). [VERIFIED: scanready/src/app/globals.css]

### Pitfall 3: Turbopack build failure on unexpected webpack config

**What goes wrong:** Next.js 16 makes Turbopack the default for `next build`. If any dependency injects a webpack config, the build fails.

**Why it happens:** Next.js 16 breaking change — if a webpack config is detected, build refuses unless `--webpack` flag is added.

**How to avoid:** Run `npm run build` after creating the route split. If it fails citing a webpack config, add `"build": "next build --webpack"` to `package.json` scripts. (No custom webpack config exists in this project — risk is only from a transitive dependency.) [VERIFIED: scanready/node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md]

### Pitfall 4: `maxDuration` in `vercel.json` and route file drifting out of sync

**What goes wrong:** `vercel.json` sets `maxDuration: 60` for the cover-letter route; route file says 120; Vercel uses the `vercel.json` value — function times out at 60 s despite the code saying 120.

**Why it happens:** `vercel.json` overrides the route segment config value.

**How to avoid:** Keep them in sync. If `vercel.json` is created (D-22), set `maxDuration: 300` for the cover-letter route in **both** the route file and `vercel.json`.

### Pitfall 5: Body CSS variable not picking up Geist

**What goes wrong:** `body` renders in Arial because `globals.css` hardcodes `font-family: Arial, Helvetica, sans-serif`, overriding the Tailwind `font-sans` → `var(--font-geist-sans)` mapping. [VERIFIED: scanready/src/app/globals.css line 25]

**How to avoid:** Remove the `font-family` rule from the `body` block in `globals.css`. Geist is already wired as a CSS variable on `<html>`; the `@theme inline` block maps it to Tailwind's `font-sans` utility. No other change needed.

---

## Open Items (Only Confirmable by Deploy Test)

1. **Opus 4.8 + adaptive thinking P95 duration under Vercel Hobby:** The cover-letter route has `max_tokens: 4000` and `thinking: { type: "adaptive" }`. Adaptive thinking introduces a variable pre-computation step. Whether this completes within 300 s on Hobby — including cold start — can only be confirmed by a real deploy. Plan must include a "measure duration in Vercel Function Logs" step and a contingency: if P95 > 280 s, switch to `claude-sonnet-4-6` or upgrade to Pro.

2. **Turbopack + dependency webpack config compatibility:** No known issue, but `next build` must be run post-route-split to confirm no transitive webpack config causes a build failure.

3. **OG image path:** `vercel.json` and `metadata.openGraph.images` reference `/og-image.png`. This file must exist in `public/` before build. Phase 4 scope includes a minimal OG card (D-20); the actual PNG/SVG must be created as part of the phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 (>=20.9.0) | Yes | 22.22.0 (miniconda) | — |
| npm | Package installs | Yes | bundled with Node | — |
| Vercel CLI | Deploy | Unknown | — | Deploy via Vercel dashboard (push-to-deploy) |
| ANTHROPIC_API_KEY | Cover-letter + parse routes | Yes (local .env.local) | — | Must provision on Vercel dashboard |

---

## Sources

### Primary (HIGH confidence — read from installed files)
- `scanready/src/app/api/cover-letter/route.ts` — confirmed `maxDuration = 120`, `max_tokens = 4000`, letter-only streaming (D-10 gate)
- `scanready/src/app/api/parse/route.ts` — confirmed `maxDuration = 60`, `runtime = nodejs`
- `scanready/src/app/page.tsx` — confirmed 1053-line `'use client'` AppState machine; `initialState` deterministic
- `scanready/src/app/layout.tsx` — confirmed Geist fonts, stale metadata (`"Create Next App"`)
- `scanready/src/app/globals.css` — confirmed dark-mode block, Arial body override
- `scanready/package.json` — confirmed `engines: { node: ">=20.9.0" }`
- `scanready/.nvmrc` — confirmed `20`
- `scanready/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — params/searchParams as async Promises
- `scanready/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md` — layout constraints; metadata pattern
- `scanready/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` — metadata Server-Component-only constraint
- `scanready/node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` — `next/font/google` API + variable option
- `scanready/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` — maxDuration segment config
- `scanready/node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` — full breaking-change list for v16
- `scanready/node_modules/next/dist/docs/01-app/02-guides/deploying-to-platforms.md` — streaming requirements

### Secondary (MEDIUM confidence — live Vercel docs)
- `vercel.com/docs/functions/limitations` (last updated 2026-06-19) — Hobby maxDuration = 300 s (default and hard ceiling); streaming included in duration

---

## Metadata

**Confidence breakdown:**
- Route split patterns: HIGH — read directly from installed Next.js 16 docs
- Breaking-change impact: HIGH — verified against the v16 upgrade guide; none apply
- Vercel Hobby ceiling: HIGH — from live Vercel docs dated 2026-06-19
- Opus 4.8 stream duration: LOW — cannot be confirmed without deploy test

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (Vercel limits stable; Next.js 16 docs pinned to installed version 16.2.9)
