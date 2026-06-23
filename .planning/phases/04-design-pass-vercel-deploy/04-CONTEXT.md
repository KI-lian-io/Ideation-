# Phase 4: Design Pass + Vercel Deploy - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Two halves, both grounded in an already-working product (the full functional flow lives in `scanready/src/app/page.tsx`, built across Phases 1–3 on a deliberately neutral zinc-only design system):

1. **Design pass (UI-01 + UI-02):** Give the tool a conversion-oriented **marketing landing page** and a real **brand visual identity** (trust-forward, German-market-credible, explicitly NOT generic "AI-purple"). The tool UI gets retrofitted to the new identity and stays a single-page flow, mobile-readable.
2. **Deploy (OPS-02 + OPS-03):** Ship publicly on Vercel with the Opus cover-letter stream completing inside the function time limit, env vars and Node pinned.

**Scope expanded during discussion (IMPORTANT for planner):** The user re-opened the **target customer** and the **product positioning**. This is handled as a **messaging/positioning change with ZERO backend changes** — see D-03/D-04/D-05. It updates PROJECT.md but does not add features. A research workflow (audience + positioning + landing best-practices, then an adversarial stress-test) backs the decisions below; its conclusions are baked into the decisions and do not need re-deriving.

**In scope:** marketing `/` landing (6-section blueprint), brand identity (accent + serif + light-only) applied to landing AND the existing tool UI, static before/after mockups, OG/favicon (minimal), WCAG-AA pass, `layout.tsx`/`globals.css` cleanup, `vercel.json` + Vercel deploy.

**NOT in this phase:** any backend/prompt/schema change; a live interactive demo on `/` (hero CTA routes to the existing tool — D-02); PostHog/analytics (Phase 6); PDF upload (v2); the final name + custom domain + polished social card (Phase 5 gate); distribution content itself (Phase 5).
</domain>

<decisions>
## Implementation Decisions

### Landing structure & routing
- **D-01 — Separate routes:** `/` is the marketing landing; the tool lives behind a CTA at a separate route (`/app` is the default path — builder's discretion). The **tool flow itself stays single-page** (UI-02 "one page" is about the four-step flow, which is preserved). The app currently renders the whole flow at `/` — introducing this split (move the tool to its route, make `/` the landing) is part of this phase.
- **D-02 — Hero CTA routes to the existing tool. NO live paste-box demo embedded on `/`.** A live demo on the marketing page would pull the parse API + streaming + error states into a marketing-only phase. The "product in action" on the landing is conveyed by **static** artifacts (D-16), not a working mini-tool. (Adversarial critic flagged the live-demo idea as scope creep; deferred as a later conversion optimization.)

### Audience & positioning (STRATEGIC — updates PROJECT.md)
- **D-03 — Re-open the target customer → "internationals applying for jobs in Germany" (nationality-neutral copy).** Broaden the *messaging* so the larger international inflow converts via SEO, but keep the *launch go-to-market motion* on the **reachable** cohort: US/UK expats (the founder dogfoods; his story is the build-in-public content) + international graduates of German universities (overlap his English-content channels + a credible B2B route). **Do NOT** pivot the primary GTM to non-EU migrants (India/Turkey/etc.) — they are the biggest *addressable* market (India alone ≈32% of Opportunity Cards, ≈24% of Blue Cards; US/UK are a trailing minority of the actual inflow) but a solo founder cannot credibly build-in-public into those communities. Neutral copy captures them without requiring that. **Do NOT** chase native-German / pure anti-AI-slop users (zero localization fit, walled/incumbent SEO, off-niche).
- **D-04 — Dual-angle positioning (co-equal value props):** (1) **Authentic / grounded / in-your-own-voice** applications, and (2) **norm-correct German localization** — unified by the **"8-second recruiter scan"** frame. The user's two-column landing idea (authentic | expat) is validated and is the centerpiece (D-09).
- **D-05 — Messaging/positioning ONLY — zero backend changes for v1.** The parse and cover-letter pipelines already convert any résumé regardless of nationality; bilingual German+English output already fits because English is the lingua franca of the whole inflow. No new features, no per-nationality logic, no non-English UI.

### Copy & guardrail framing (CRITICAL — adversarial fixes, do not skip)
- **D-06 — Authentic angle = QUALITY/VOICE, never detection-evasion.** NO "rejected as AI", "looks AI-generated", or "beat the filter" anywhere user-facing — that sells the one thing the project bans. Frame as: "sounds like you wrote it — the facts and voice are yours; it never invents an employer, title, date, or skill." Surface the 3–5 personalization questions as the visible proof of authenticity (= personalization, explicitly not evasion).
- **D-07 — No outcome promises; sell capability.** Replace "never rejected on format / never rejected as AI" with capability framing ("formatted the way German recruiters expect" / "nothing here gives a recruiter a reason to bin you on sight"). No income, "get hired", or job-guarantee claims (FTC/ASA-clean).
- **D-08 — Recommended hero (starting copy, refine within D-06/D-07):** Headline (serif): "Win the 8-second German recruiter scan." Subhead (sans): "Turn your CV into a norm-correct German Lebenslauf and an Anschreiben that sounds like you — grounded only in your real facts, never invented. Bilingual output explains every change so you trust what you send."
- **D-09 — Two-column pathways section:** parallel card structure under one serif title (e.g. "Two documents. Both have to survive the scan."), single shared CTA beneath. LEFT = authentic/voice (D-06 framing + the personalization-questions mechanism, a static struck-through-filler → grounded-line artifact). RIGHT = German-norm localization (mini Lebenslauf card with norm-gap pins incl. the nuanced photo line), with the nationality-neutral reframe woven in: "Whether you're on a Chancenkarte or just never learned the German format — the rules are the gap, not your experience." Keep the "have a native German speaker review" nudge here as a quiet credibility signal.
- **D-10 — Bilingual "explains every change" copy is scoped to the LEBENSLAUF only.** `normGapNotes[]` produces per-change English notes for the Lebenslauf; the cover-letter route **streams the letter, not a change-log**. Do NOT write landing copy promising per-change English rationale for the Anschreiben. **Confirm the cover-letter route's actual output during planning** before any such claim.

### Brand / visual direction
- **D-11 — Hybrid aesthetic (A's restraint + B's serif credential warmth):** white/zinc base + a single **deep-blue trust accent** (rationed to high-signal moments: hero hairline underline, primary CTA, trust band, norm-gap pins, founder signature) + **serif headings** on hero/section titles + **Geist sans** for body/labels/CTAs/tool UI. Flat surfaces, hairline borders; no gradients, shadows, glassmorphism, or dot/grid-mesh. Target feel: "quietly excellent German Mittelstand / paper credential," NOT a SaaS gradient template, NOT AI-purple.
- **D-12 — Light-only.** Drop the existing `dark:` variants; design one tightly-controlled light surface.
- **D-13 — Motion: restrained/earned only.** NO animated gradient/shader/particle/aurora hero backgrounds, no parallax, no autoplay video, no background animation (net-negative for a trust product). Allowed: quiet micro-motion — short fade/slide-up on scroll (respect `prefers-reduced-motion`), gentle CTA hover lift. The genuine "live" moment is the token-by-token Anschreiben streaming **inside the tool**, not on the landing.

### Landing content / blueprint
- **D-14 — Landing language = English-primary.** English is the shared application language across the whole inflow. German appears inside the document artifacts (Lebenslauf section names, DIN dates) and as wordmark/nav accents.
- **D-15 — Six-section blueprint (ordered; planner/ui-researcher may refine, but keep hero + two-column + trust + founder):** (1) Hero — "win the scan" headline + CTA into the tool (static, no live demo); (2) Two-column pathways (D-09); (3) How it works — 3 grounded steps (paste CV → Lebenslauf + English norm notes → job + 3–5 questions → streamed Anschreiben), CTA repeated; (4) Trust & privacy band — "zero-retention, by design" (no DB, no account, no training on your data, native-speaker-review nudge); (5) Founder's note — first-person, dogfooding expat, optional build-in-public link (human touch + strongest pre-launch proof); (6) Pre-launch proof strip + final CTA.
- **D-16 — Before→after visual = static, hand-authored mockups (SVG or HTML/CSS — builder's discretion), led by the founder's OWN dogfooded example** (real US/UK résumé → Lebenslauf; generic-filler line → grounded in-voice line). The most honest pre-launch proof; not a live mini-tool.
- **D-17 — Pre-launch proof = the founder's own dogfooded before/after + the build-in-public link.** NO fabricated counters, "join N", invented testimonials, or logo walls. A live "documents generated" counter ONLY if one genuinely exists in the build.

### Naming, OG, accessibility
- **D-18 — Keep "ScanReady" for Phase 4** (don't block deploy). The final name is an explicit **GATE before the Phase 5 public push / custom domain** — the OG social card and domain carry the name, so their polished versions wait for Phase 5 too.
- **D-19 — WCAG-AA pass on landing + tool** as part of the design (not a formal third-party audit): fix contrast (Phase-1 UI-SPEC flagged `text-zinc-400` fails AA → use `zinc-500`+ for readable text), visible focus states, semantic landmarks/headings, alt text on the mockups, `prefers-reduced-motion` on micro-animations. Light-only makes this tractable.
- **D-20 — OG/favicon: clean minimal now, polish in Phase 5.** Ship a clean OG card (wordmark + headline + trust line) + favicon so the deployed link isn't naked; the polished, distribution-ready social card (carrying the final name) is Phase 5. Also fix `layout.tsx` metadata (currently "Create Next App") → real title/description/`lang` for the landing.

### Deploy (OPS-02 / OPS-03)
- **D-21 — Vercel default subdomain** (e.g. `scanready.vercel.app`). Custom domain deferred to Phase 5 (name gate).
- **D-22 — Hobby tier.** Declare `maxDuration` in `vercel.json` sized to the Hobby ceiling (`.claude/CLAUDE.md` notes ~300s with Fluid Compute; the parse route currently declares `maxDuration = 60`). **Confirm the actual Hobby ceiling AND that the Opus + adaptive-thinking cover-letter stream completes within it** during deploy. Pin Node 20.x on Vercel (`engines` already pinned per PRE-01).
- **D-23 — Production env: provision `ANTHROPIC_API_KEY` now. PostHog key is DEFERRED to Phase 6** with the analytics implementation — do NOT block deploy on it. (Reconciles OPS-03's "PostHog key" wording with the locked analytics→Phase 6 decision.)

### Claude's Discretion
- Tool route path name (`/app` default).
- Exact final landing copy wording (within the D-06/D-07/D-08 guardrails).
- Mockup rendering technique (SVG vs HTML/CSS), icon choices, exact spacing.
- `globals.css` cleanup (remove the Arial body fallback, wire Geist properly, add the serif font), choice of serif (a credible system/Google serif — keep it light-loading).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 4: Design Pass + Vercel Deploy" — goal, requirements (UI-01, UI-02, OPS-02, OPS-03), success criteria
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, OPS-02, OPS-03 (active here); TRUST-02 + OPS-01 (PostHog) are Phase 6; Out-of-Scope table (no accounts, no Europass, no detection-evasion, no income claims)
- `.planning/PROJECT.md` — core value, guardrails (zero-retention, grounded-only, native-quality German, nuanced photo, no income claims, no detection-evasion). **NOTE: the "Customer" line + Key Decisions need updating per D-03/D-04 — see Deferred / next steps.**

### Brand / UI — the design system to EXTEND (do not contradict)
- `.planning/phases/01-pre-flight-parse-flow/01-UI-SPEC.md` — the existing hand-rolled-Tailwind design system (zinc neutral, Geist, spacing/type/color contracts, component inventory). Phase 4 ADDS the deep-blue accent + serif headings + light-only and the landing, on top of this. The spec itself says the conversion design pass + brand palette is "explicitly deferred to Phase 4."
- `.planning/phases/02-cover-letter-flow/02-UI-SPEC.md` — cover-letter flow UI contract

### Existing code (the design pass retrofits these; deploy configures them)
- `scanready/src/app/page.tsx` (~1053 lines) — the full functional flow + `AppState` machine. Tool UI gets the new identity; the landing/tool route split (D-01) touches this entry point.
- `scanready/src/app/layout.tsx` — still has "Create Next App" metadata + `lang="en"`; needs real title/description/OG + the serif font wired (D-20)
- `scanready/src/app/globals.css` — still create-next-app default (Arial body fallback, auto dark-mode `@media`); needs the light-only + accent + serif cleanup (D-11/D-12)
- `scanready/src/components/` — `EditableField`, `LebenslaufEditor`, `NormGapPanel`, `SkillChips` (retrofit to the new identity)
- `scanready/src/app/api/parse/route.ts` — declares `maxDuration = 60`, `runtime = nodejs`
- `scanready/src/app/api/cover-letter/route.ts` — streamed Anschreiben; **check its `maxDuration` and confirm it streams the letter only (D-10) and fits the Hobby ceiling (D-22)**
- `scanready/src/lib/anthropic.ts` — model config (`GENERATION_MODEL` / `PARSE_MODEL` = `claude-opus-4-8`); relevant to the stream-duration question
- No `scanready/vercel.json` exists — create it (D-22)

### Tech stack & deploy constraints (confirm, don't re-litigate)
- `.claude/CLAUDE.md` — locked stack (hand-rolled Tailwind, no component lib, Geist), Vercel plan limits (Hobby 300s / Pro 800s), Node versions, PostHog config (Phase 6), "What NOT to Add" table
- `scanready/AGENTS.md` — **Next.js 16 has breaking changes vs. training data; read `node_modules/next/dist/docs/` before writing app/routing code** (relevant to the App-Router landing/tool split)

### Concept / strategy (background)
- `cv-germany-expat-concept.md` — norm-gap value prop, German Lebenslauf conventions, expat-EN long-tail + emerging German "KI" search terms
- `BUILD_PLAN.md` — distribution sequence (Reddit/build-in-public → SEO → paid LAST); §6 design-pass intent. Distribution is Phase 5.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The entire Phase-1 design system** (`01-UI-SPEC.md` + the classes already in `page.tsx`): zinc scale, spacing, type contract, EditableField/editor patterns. Phase 4 extends it (adds accent/serif/light), does not replace it.
- **The working tool flow** in `page.tsx` — nothing functional changes; it gets re-skinned and moved behind a route.
- **`normGapNotes[]`** (Lebenslauf schema) — the real source for the "we explain every change in English" landing claim (Lebenslauf only — D-10).

### Established Patterns / Constraints
- Next.js 16 App Router, TS, Tailwind v4, hand-rolled (no component library, no new icon lib). Read `node_modules/next/dist/docs/` before routing work.
- Stateless / zero-retention must not regress (the trust band asserts it — it must stay true).
- Inline SVG only for icons (a lock icon already exists in `page.tsx`).

### Integration Points
- **Routing split (new):** `/` landing ↔ tool at `/app`; the whole app is currently one page at `/`. Hero CTA → tool route (D-02).
- **`layout.tsx` + `globals.css`** ↔ brand identity (metadata, fonts, light-only, accent).
- **`vercel.json` (new)** ↔ `maxDuration` for the cover-letter stream; Vercel env (`ANTHROPIC_API_KEY`) + Node pin.
- Tool components ↔ the new accent/serif/light tokens (retrofit).
</code_context>

<specifics>
## Specific Ideas

- The **"8-second recruiter scan"** is the spine of the whole landing — both columns ladder up to it (two ways to fail the glance; ScanReady closes both).
- The user's explicit vision: a hero with the "Win the recruiter scan" headline, then a **two-column** section — "write authentic job applications" | "the expat / German-norm angle."
- Lead the proof with the **founder's own dogfooded before/after** (he is an expat applying in Germany now) — honest, on-brand, and the strongest thing available pre-launch.
- Aesthetic north star: a precise **paper-credential trust object**, confident and still — stillness reads as trustworthy here; busyness reads as cheap.
</specifics>

<deferred>
## Deferred Ideas

**Strategy doc update (do FIRST, outside this phase's code work):**
- **PROJECT.md must be updated** to reflect D-03/D-04: rewrite the "Customer" line from "US/UK English-speaking expats" → "internationals applying for jobs in Germany" (primary addressable = full international inflow; launch motion = US/UK + intl uni grads); record the dual-angle positioning + unified value prop in Key Decisions. This is a project-level strategy change surfaced during this discussion — flag it to the user; do not silently rewrite mid-phase.

**Phase 5 (distribution):**
- Final **name decision** (gate) + **custom domain** + **polished OG social card** (carries the final name).
- **Non-US/UK before/after example assets** for build-in-public content.
- SEO target shift toward **English-language** queries about the German format ("cv for germany", "german cv format", "how to write a german cv") — explicitly EXCLUDE German-language KI/Anschreiben terms to stay off the native-German niche (critic finding #8).

**Phase 6 (analytics):** PostHog funnel (the deferred config is locked in `03-CONTEXT.md`).

**Later / v2 (do NOT scope into v1):**
- Live "paste box IS the demo" interactive hero (conversion optimization).
- PDF upload (`unpdf`); live "documents generated" counter (only if real).
- Prompt-level refinements: source-CV-origin hint; **per-change English rationale for the Anschreiben** (backend gap per D-10); visibly-international AGG photo nuance — all must preserve guardrails verbatim.
- B2B university career-services pilot; finish-line paywall + Stripe.

**Explicitly rejected (keep the niche tight):** native-German / pure anti-AI-slop audience; per-nationality features; non-English UI.
</deferred>

---

*Phase: 4-design-pass-vercel-deploy*
*Context gathered: 2026-06-23*
