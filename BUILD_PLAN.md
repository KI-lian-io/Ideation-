# Build Plan — ScanReady (working name)
### CV + cover-letter tool for expats applying in Germany

Concept validated in `cv-germany-expat-concept.md`. This is the execution plan. Working name **ScanReady** (the "win the 8-second German recruiter scan" thesis) — placeholder, rename freely. Code lives in [`/scanready`](./scanready).

---

## 1. Product (v1 — free, dogfood-first)

One page, one flow, no auth, no payment yet:
1. **Paste/upload your CV** (text for v1; PDF parse later).
2. **Norm-gap report + German Lebenslauf** — converted, DIN-aware, with *why each thing changed* (`normGapNotes`) and nuanced photo guidance (`photoAdvice`).
3. **Paste a job posting + answer 3–5 questions** → a grounded, authentic-voice **Anschreiben**, streamed live.
4. Copy/download output. **Stateless: nothing stored.**

The two differentiators (the moat): German-scan-optimized formatting + the *authentic-voice* cover letter from the personalization questions. Everything else is commodity.

## 2. Stack (scaffolded)

- **Next.js (App Router, TS) + Tailwind** — `create-next-app`, in `/scanready`.
- **Claude API** (`@anthropic-ai/sdk`) + **Zod** structured output.
- **Models** (`src/lib/anthropic.ts`): `GENERATION_MODEL = claude-opus-4-8` (cover letter — quality is the moat); `PARSE_MODEL = claude-opus-4-8` (cost lever: switch to `claude-sonnet-4-6` once parse quality is confirmed, ~5× cheaper).
- **Deploy:** Vercel. **Analytics:** PostHog (lightweight, from day 1).
- **Zero-retention:** no DB in v1; CVs processed in memory, never persisted; no training on user data.

## 3. The prompt chain (built — `src/lib/`, `src/app/api/`)

- **`/api/parse`** — `messages.parse()` + `zodOutputFormat(LebenslaufSchema)`. Grounding by construction: *restructure only*, "use only facts in the source; never invent employers/titles/dates/skills; unknown → null."
- **`/api/cover-letter`** — streamed (`messages.stream`, adaptive thinking). Grounded in **CV facts + the 3–5 answers + the job posting**; voice driven by the answers; ends with a "have a native speaker review" note.
- **Anti-hallucination is prompt+schema, not a flag.** The schema forbids free-form invention; the system prompts forbid fabricating facts. (Optional later: a second validation pass that checks every Lebenslauf field traces to the source.)

## 4. Phased roadmap

- **Phase 0 — MVP (now):** the flow above, run locally, **dogfood on Kilian's own live applications**. Fix where the German output is wrong (Kilian judges quality).
- **Phase 1 — shareable:** deploy to Vercel; clean landing; PostHog events (start, parse_done, letter_done, copy/download).
- **Phase 2 — distribution:** see §5.
- **Phase 3 — monetize:** finish-line paywall (€19–29/application, €39–49 bundle) once output quality + demand are proven. Stripe. Add PDF upload, more templates.
- **Phase 4 — moat/scale:** B2B (university career services, relocation firms); sister tools sharing infra (the SEO flywheel from `necessity-tools-strategy.md`).

## 5. Distribution (sequenced — paid LAST, as a *test* not a channel)

1. **Founder-led / Reddit & build-in-public (free, primary):** Kilian is applying *now* — post the before/after CVs + the "8-second scan" insight on LinkedIn, r/germany, r/cscareerquestionsEU. The application story *is* the content. This also seeds the long-term SEO.
2. **SEO content:** expat-EN long-tail (`cv for germany`, `english cv germany`, `how to write a german cv`) + emerging German `ki anschreiben` / `ki bewerbung` — the low-competition openings from the search-volume research. Launch ahead of the **Sept–Oct** application peak.
3. **Paid (€50–100, LAST):** *not* an acquisition channel at this price — a **conversion test**. Point ads at a proper landing page with PostHog and read: do strangers finish and want the output? Reframe spend as learning, not growth.

## 6. Design system

Build with Claude's design capability (artifact-design) / claude.ai/design: one clean, conversion-oriented landing + the tool UI. Trust-forward (zero-retention stated loudly), German-market-credible (not generic AI-purple). Finish-line gate pattern when monetization turns on.

## 7. Guardrails (non-negotiable)

- **Sell the capability, never income** — no earnings claims (FTC/ASA-clean; see `low-barrier-tools-strategy.md` §5).
- **Grounded-only generation** — fabricating qualifications = fraud + liability.
- **Native-quality German** — a sloppy Anschreiben is worse than none; ship the "review with a native speaker" nudge.
- **Photo guidance is nuanced** — optional by AGG, expected in practice, user's choice (never mandate).
- **GDPR posture as a feature** — zero-retention, clear privacy note; no training on user data without explicit consent.

## 8. Run it locally

```bash
cd scanready
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```
API routes work today; the UI is the next build step.

## Open decisions for Kilian
- **B2C (Chancenkarte communities) first**, or a **B2B university/relocation pilot** in parallel?
- **German-only** output, or **bilingual** (German docs + English explanation of every choice, so the expat trusts it)?
- Confirm the **working name** (ScanReady is a placeholder).
