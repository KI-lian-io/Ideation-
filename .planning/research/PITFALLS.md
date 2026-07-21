# Pitfalls Research

**Domain:** AI-powered document transformation tool — expat German CV/Anschreiben generator
**Researched:** 2026-06-22
**Confidence:** MEDIUM (technical: MEDIUM via verified docs; product/legal/GTM: LOW-MEDIUM via web)

---

## Critical Pitfalls

### Pitfall 1: Node 18 → Node 20.9 Mismatch Breaks the Entire Build

**What goes wrong:**
`npm install` and `next dev` silently fail or produce cryptic errors because the local environment is Node 18.14.0 but Next.js 16 requires Node ≥ 20.9.0. Worse: if `package.json` does not declare an `engines` field and CI/Vercel default to an older Node, the deployed build will mismatch the local dev environment in ways that surface only at runtime (e.g., async API behavior differences).

**Why it happens:**
The project was initialized on Node 18. Next.js 16 dropped Node 18 support entirely (minimum is 20.9). Without a hard guard in `package.json` and `.nvmrc`, anyone picking up the project — or any CI runner — will silently use the wrong runtime.

**How to avoid:**
1. Add `"engines": { "node": ">=20.9.0" }` to `scanready/package.json`.
2. Create `scanready/.nvmrc` with `20.9.0` (or current LTS).
3. In Vercel project settings, pin Node version to 20.x under Settings → General → Node.js Version.
4. Verify locally: `node --version` before `npm run dev`.

**Warning signs:**
- `npm install` completes but `next dev` exits immediately with `error: Next.js requires Node.js v20.9 or later`.
- Vercel build logs show a Node version older than 20.9.

**Phase to address:** Deploy phase (before any CI/Vercel wiring). Also a prerequisite for the UI build phase — confirm locally first.

---

### Pitfall 2: Next.js 16 Async Request APIs Break Every Route Handler and Page

**What goes wrong:**
Next.js 16 removes the synchronous compatibility shim that existed in v15 for `cookies()`, `headers()`, `params`, `searchParams`, and `draftMode()`. Any code that accesses these synchronously — including code written against training data for Next.js 14/15 — will throw at runtime. This is the single most common AI-generated Next.js mistake for v16.

**Why it happens:**
AGENTS.md warns about this explicitly ("This is NOT the Next.js you know"). LLM training data is overwhelmingly on Next.js 13–15 patterns. The v16 API surface looks identical — same import, same function name — but is now a Promise. No static type error at compile time unless you have strict typing; it fails at runtime.

**Concrete breakage points for this project:**
- Any page component that reads `searchParams` synchronously.
- Any future middleware logic (note: `middleware.ts` is also deprecated for Node runtime in v16; replaced by `proxy.ts`).
- Route handlers accessing `request.cookies` via the old sync pattern.

**How to avoid:**
1. Before writing any UI page code, read `node_modules/next/dist/docs/` as AGENTS.md instructs.
2. Enforce the async pattern from day one: `const params = await props.params`, `const cookieStore = await cookies()`.
3. Add a TypeScript strict check: `await` on any access of these APIs — the TS types changed to `Promise<...>`, so strict mode surfaces violations.
4. Run `npx @next/codemod@canary upgrade` which applies official codemods for async migration.

**Warning signs:**
- Runtime error: `Error: cookies() expects to have requestAsyncStorage, none available`.
- Params are `undefined` despite being in the URL.
- Page renders without error but `searchParams` is a Promise object rather than a plain object.

**Phase to address:** UI build phase — enforce this before writing the first page component.

---

### Pitfall 3: Vercel Function Timeout on 120s Streamed Generation

**What goes wrong:**
The cover-letter route sets `maxDuration = 120` and `export const runtime = "nodejs"`. On Vercel's Hobby (free) plan, the maximum function duration is 60 seconds. On Pro, the default is 15 seconds but configurable up to 300 seconds. Deploying on the wrong plan or forgetting to configure `maxDuration` in Vercel's project settings causes the cover-letter stream to be cut off mid-generation with a `FUNCTION_INVOCATION_TIMEOUT` error — indistinguishable to the user from a crash.

**Why it happens:**
The `maxDuration` export in route.ts tells Next.js the limit, but Vercel also enforces a plan-level cap. If the deployed plan is Hobby, the 120s declaration is silently capped at 60s.

**How to avoid:**
1. Deploy on Vercel Pro (required for `maxDuration > 60`).
2. In `vercel.json`, add `{ "functions": { "src/app/api/cover-letter/route.ts": { "maxDuration": 120 } } }` as an explicit declaration.
3. Use Vercel Fluid Compute (enabled by default on Pro) — it keeps warm instances and eliminates cold-start latency; a 120s generation should complete without a timeout in normal conditions.
4. Add a client-side keepalive or heartbeat comment (`data: \n\n`) every 10 seconds during the stream so the connection is not dropped by intermediate proxies before the function completes.
5. Test the full generation in staging before launch: paste a real CV, confirm the Anschreiben streams to completion.

**Warning signs:**
- Stream stops abruptly mid-sentence in production but not locally.
- Vercel function logs show `FUNCTION_INVOCATION_TIMEOUT` at exactly 60s.
- Cold-start latency adds 2–5 seconds before the first byte; users see a blank screen.

**Phase to address:** Deploy phase — confirm plan tier and `maxDuration` before enabling the cover-letter UI. Also: UI phase should show a progress indicator so users know the 10–30s wait is intentional.

---

### Pitfall 4: Claude Adaptive Thinking Streaming — Thinking Deltas Leak to Client

**What goes wrong:**
When `thinking: { type: "adaptive" }` is active, the Claude API emits two types of `content_block_delta` events: `text_delta` (the actual letter text) and `thinking_delta` (the internal reasoning). If the stream handler doesn't filter specifically for `text_delta`, raw thinking blocks — potentially containing the user's CV data verbatim, sensitivity analysis, or inferences about the candidate — are streamed to the browser and may appear in the UI or browser dev tools.

**Why it happens:**
The current `route.ts` correctly filters `event.delta.type === "text_delta"`, so this is not currently broken. The risk is that future developers adding features (e.g. "show reasoning" debug mode, or switching to a different streaming approach) remove the filter, not realizing thinking deltas contain sensitive CV data.

**How to avoid:**
1. Add a comment in `route.ts` explicitly documenting why only `text_delta` is forwarded: `// IMPORTANT: Only forward text_delta — thinking_delta contains internal CV reasoning and must never be sent to the client`.
2. In any future "debug mode" feature, gate thinking display behind an explicit admin-only flag and never in production.
3. If using `messages.stream()` and collecting the final message instead of streaming deltas, use `stream.finalMessage()` and extract only `content` blocks of type `text`.

**Warning signs:**
- Browser network tab shows JSON-like chunks with `type: "thinking"` in the stream response.
- UI shows XML-like reasoning text before the actual letter.

**Phase to address:** UI build phase — document this constraint before adding any stream consumer code.

---

### Pitfall 5: `messages.parse()` / `output_config` Drift — Structured Output Breaks Silently

**What goes wrong:**
The parse route uses `anthropic.messages.parse()` with `output_config: { format: zodOutputFormat(LebenslaufSchema) }`. This is the correct `@anthropic-ai/sdk@0.105` pattern. However: (a) if the SDK is upgraded without checking the changelog, `output_config` may move to a top-level `format` field; (b) if `zodOutputFormat` is imported from the wrong path (not `@anthropic-ai/sdk/helpers/zod`), Zod v4 compatibility breaks; (c) `response.parsed_output` vs `response.output` naming can differ between SDK minor versions.

**Why it happens:**
The Anthropic SDK is still evolving rapidly. `messages.parse()` is a relatively new method. Training data may reference an older call signature.

**How to avoid:**
1. Before building the UI, run the verify step from `PROJECT.md`: `Verify Anthropic SDK call shapes against installed @anthropic-ai/sdk@0.105`.
2. Add an integration test that calls both API routes with a fixture CV and asserts `lebenslauf.personal.fullName` is non-null.
3. Lock the SDK version in `package.json` with an exact version (`"@anthropic-ai/sdk": "0.105.x"`) during the build phase; upgrade deliberately.

**Warning signs:**
- `response.parsed_output` is `undefined` but `response` is not null.
- TypeScript error: `output_config` is not a valid property on `MessageCreateParams`.
- Parse route returns `{ error: "Failed to parse CV." }` with no further details in logs.

**Phase to address:** UI build phase (prerequisite: verify SDK shapes before building on top of the API routes).

---

### Pitfall 6: CV Fabrication Slipping Through Grounding Guardrails

**What goes wrong:**
Despite the anti-fabrication prompt and Zod schema, the model can still introduce subtle fabrications in the Anschreiben that are difficult to detect: (a) attributing a skill from one job to a different employer; (b) inflating a job title slightly ("Senior" vs "Lead") based on the user's question-answer phrasing; (c) conflating two companies the user mentioned into a single achievement claim; (d) inventing a date for an award or certification mentioned without a date in the CV. These are not hallucinations of non-existent facts — they are real-but-misattributed facts that cross the fraud line.

**Why it happens:**
The Anschreiben system prompt grounds facts via the user's CV text, but the 3–5 personalization question answers are freeform and can introduce vague claims ("I led a team of engineers") that the model elaborates without grounding. The Zod schema catches fabrication in the Lebenslauf but the Anschreiben is plain text with no structural validation.

**How to avoid:**
1. In the cover letter system prompt, add explicit instruction: "Every achievement or qualification claim must be directly quotable from the CV text or the applicant's exact answer. Do not combine, extrapolate, or elaborate claims beyond what was stated."
2. In the bilingual output (English explanation), have Claude identify which CV line or answer each Anschreiben claim traces to — this makes fabrication visible to the user.
3. In the UI, display the "grounding sources" alongside the letter so the applicant can verify each claim maps to their real experience.
4. Add a warning banner: "Review all claims before submitting — you are responsible for accuracy."

**Warning signs:**
- Anschreiben mentions a specific number (years, team size) not present in the pasted CV.
- Cover letter attributes an achievement to a company the user only mentioned briefly.
- Dogfooding: Kilian's own letters contain claims he didn't make in his answers.

**Phase to address:** UI build phase (prompt hardening before launch) and design phase (add verification UX).

---

### Pitfall 7: GDPR Zero-Retention Claim Undermined by PostHog Autocapture

**What goes wrong:**
The product's primary trust claim is "zero-retention — we never store your CV." PostHog's autocapture, if enabled with default settings, will capture DOM text from the page — including CV content typed into textarea inputs — and send it to PostHog servers. This directly contradicts the zero-retention claim, constitutes GDPR-violating processing of personal data (and potentially Article 9 sensitive data if the CV includes nationality/age/disability), and could expose the product to regulatory action.

**Why it happens:**
PostHog autocapture is on by default. It records `element text` from the DOM. A CV textarea is exactly the kind of element that autocapture will capture. Developers adding PostHog to "just track funnels" don't realize they are also capturing form content.

**How to avoid:**
1. Disable autocapture entirely in the PostHog init config: `autocapture: false`.
2. Instrument only explicit, handcrafted events: `posthog.capture('parse_started')`, `posthog.capture('letter_streamed')`, etc. — never include CV text or job posting text as event properties.
3. Set `ip: false` in PostHog init to disable IP capture (IP = personal data under GDPR).
4. Use `person_profiles: 'identified_only'` so anonymous visitors do not create PostHog person records.
5. Add PostHog to the `.planning` review checklist: before any analytics event is added, verify the event properties contain zero PII.
6. Explicitly document in Privacy Policy: "We use PostHog for aggregate funnel analytics. No CV content is captured. Events are: start, parse_done, letter_done, copy/download." Then keep it true.

**Warning signs:**
- PostHog event stream shows events with long text properties.
- PostHog session replay shows CV textarea content.
- `$current_url` events capture query parameters that include any CV snippets.

**Phase to address:** Deploy phase — configure PostHog before going live. Mark as a launch blocker.

---

### Pitfall 8: AGG Photo Guidance Trap — Mandating or Dismissing the Photo

**What goes wrong:**
Two opposite failure modes: (a) The tool says "include a photo — German recruiters expect it" without qualification, pushing users to include a photo that could trigger discrimination claims against the employer (or perceived as mandatory, which it is not under the AGG). (b) The tool says "photos are optional/discouraged" citing the AGG, causing users to omit a photo that ~82% of German recruiters still expect, weakening their application.

**Why it happens:**
The AGG (2006) makes requesting photos illegal in most EU countries, but Germany maintained a cultural expectation. The legal reality (optional) and the practical reality (expected) are in direct tension. An AI tool trained on general European norms will lean toward "optional/discouraged"; one trained on German job-application guides will lean toward "expected." Both are partially right and both framings mislead users.

**How to avoid:**
The existing `photoAdvice` field in the Lebenslauf schema is the right place for nuanced guidance. The prompt must produce advice that covers: (a) legally optional since AGG 2006; (b) ~82% of German recruiters still expect a professional Bewerbungsfoto; (c) if included, must be a professional studio photo (not selfie), 4.5×6 cm, top-right corner; (d) international tech companies and anonymous applications are exceptions; (e) the decision is the applicant's. Also ensure the `normGapNotes` includes a note that US/UK applicants typically do not include photos but this is a German norm difference.

**Warning signs:**
- `photoAdvice` field returns a one-line blanket recommendation without nuance.
- Users report being told to skip the photo and then getting negative feedback from German recruiters.
- Users report including a casual selfie based on guidance that didn't specify "professional studio photo."

**Phase to address:** UI build phase (verify photoAdvice prompt produces nuanced output via dogfooding).

---

### Pitfall 9: SEO Timeline Mismatch — Expecting Traffic Before the Sept/Oct Peak

**What goes wrong:**
The strategy document identifies Sept–Oct as the German application peak season and plans SEO content to land by then. The failure mode: starting content production in late summer, expecting first-page rankings within weeks, then finding that fewer than 6% of new pages reach Google's top 10 within a year (Ahrefs, 2M-page study). Pages ranking in the top 10 are on average 2+ years old. If the plan is "publish content in August, rank in September," it will fail.

**Why it happens:**
SEO timelines are routinely underestimated. Long-tail keywords with low competition (the stated entry strategy) can rank in 4–12 weeks, but only with domain authority. A brand-new domain starts from zero authority. The expat-EN long-tail has thin incumbents but any domain with even modest authority will outrank a new one.

**How to avoid:**
1. Start SEO content immediately (June/July 2026) — not before the peak. Target Sept 2026 as the first meaningful traffic opportunity.
2. Accept that the first real SEO results will appear 3–6 months after publication; the Sept 2026 peak is a stretch goal, not a plan.
3. Prioritize the build-in-public distribution channel first for initial traction — Reddit (r/germany, r/expats, r/chancenkarte), LinkedIn, Twitter/X — this gets real users immediately without needing domain authority.
4. Get community backlinks early: sharing the tool in Toytown Germany, Expat forums, Chance Card Facebook groups creates both traffic and domain authority.
5. Use the Sept–Oct peak for paid conversion testing ($50–100) on already-proven long-tail keywords — not as the first organic ranking attempt.

**Warning signs:**
- Publishing first content article in August and expecting ranking by September.
- Treating content output (number of posts) as the primary growth metric instead of backlinks and domain authority.

**Phase to address:** Marketing/SEO operationalization phase — set realistic timeline and prioritize community distribution first.

---

### Pitfall 10: Build-in-Public Turns Into Product Promotion, Not Authentic Story

**What goes wrong:**
Build-in-public fails when it becomes a product announcement feed: "Just shipped the Anschreiben feature!" with a screenshot. Founders post about the product before anyone has a reason to care. Engagement is near-zero, founders conclude "build-in-public doesn't work," abandon it.

**Why it happens:**
The compelling story here is Kilian's actual job search: the frustration of navigating German CV norms as an expat, the rejections, the learning, the tool being built out of real pain. This is the narrative. But it is easier to post about the product than to write authentically about the experience.

**How to avoid:**
1. Lead with the job-search story, not the tool. "Applied to 5 jobs this week. One rejected me for the photo — here's what I learned about the Bewerbungsfoto." Then: "So I'm building this."
2. Show the output, not the interface. Post an anonymized before/after: US resume → German Lebenslauf with norm-gap callouts. That is the demo.
3. 90/10 rule: 90% value/story, 10% product nudge. Every post should be useful even if the reader never signs up.
4. One platform, consistent cadence. LinkedIn for German professional market and expat community; Reddit for direct inbound (r/germany, r/LebenInDeutschland).
5. Kilian's personal application story is the moat — no one else has it. Don't abstract it into generic "building an AI tool" content.

**Warning signs:**
- Posts get no engagement beyond close connections.
- Content is mostly screenshots of the UI or feature announcements.
- The phrase "we" is used instead of "I" — removing the personal story.

**Phase to address:** Marketing/distribution operationalization phase.

---

### Pitfall 11: Paid Ads Treated as Growth Channel Instead of Conversion Proof

**What goes wrong:**
The strategy is "paid LAST, as a conversion test." The failure mode is: traction doesn't come quickly enough from community/build-in-public, so paid ads are started prematurely to accelerate. €50–100 is spent, CAC is high, ROAS is poor, and the conclusion is "paid doesn't work" — when the actual problem is that the value proposition is not yet proven and the landing page is not yet optimized.

**Why it happens:**
Paid ads feel like a lever: spend money, get users. For a free tool with no revenue model yet, paying for users produces no data on willingness-to-pay. The community-first phase exists precisely to validate the value proposition cheaply.

**How to avoid:**
1. Do not start paid until: (a) the tool has real users acquired organically, (b) a copy/download rate is measurable, (c) the landing page has been iterated at least once based on user feedback.
2. When paid is run, the goal is explicit: "Does this audience convert at X copy/download rate on €Y CPL?" Not "get users."
3. €50–100 on a single well-targeted keyword (e.g., "german cv for expats") with one ad and one landing page. Treat as a measurement experiment, not a campaign.

**Warning signs:**
- Running paid before any organic users have been acquired.
- No defined success metric for the paid test beyond "get signups."
- Budget creep past €150 without a clear conversion signal.

**Phase to address:** Marketing/distribution operationalization phase — define paid test criteria before touching a credit card.

---

### Pitfall 12: German Norm Mistakes That Signal "Foreigner Who Didn't Research"

**What goes wrong:**
The tool generates a Lebenslauf or Anschreiben with subtle norm mistakes that a German recruiter will immediately flag — undermining the entire value proposition. Common failure modes:

**Lebenslauf:**
- Wrong date format: `06/2024` instead of `06.2024` (German uses dots, not slashes).
- Missing reverse-chronological order or inconsistent ordering between sections.
- No signature and date at the end (German Lebenslauf must be signed with place/date).
- Missing personal data (Adresse, Geburtsdatum, Staatsangehörigkeit) — these are expected and their absence signals US-norm formatting.
- "CV" heading instead of "Lebenslauf" or "Tabellarischer Lebenslauf".
- One-page format — German Lebenslauf is 1–2 pages for most roles, longer for senior.

**Anschreiben:**
- Using an informal opening ("Hi" or "Dear Hiring Team") instead of "Sehr geehrte Damen und Herren" or the specific contact name.
- No DIN 5008 header block (sender address top-right, recipient address below-left, date, subject line).
- Generic motivation paragraph that doesn't name the specific company or role — this is the #1 German rejection reason.
- Closing with "I look forward to hearing from you" (English pattern) instead of "Ich freue mich auf Ihre Rückmeldung und stehe für Rückfragen gerne zur Verfügung."
- No closing signature block with place, date, and signature line.

**How to avoid:**
1. The system prompt for both routes must encode these norms explicitly. Add a "DIN 5008 compliance checklist" to the Lebenslauf normGapNotes output.
2. Dogfood every output Kilian submits as a real application — he will receive recruiter feedback that surfaces any norm gap.
3. Add German-native review as a quality gate before public launch. Even one native-speaker pass catches systemic issues.

**Warning signs:**
- normGapNotes array is empty or generic for a US resume (means the model isn't catching norms).
- Anschreiben ends without "Mit freundlichen Grüßen".
- Date format in experience section uses slashes rather than dots.

**Phase to address:** UI build phase (prompt review) and design phase (quality gate with native speaker before launch).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No input-length guard on API routes | Simpler code | Unbounded LLM cost + potential prompt injection via giant CV paste | Never — add before launch |
| Both models set to `claude-opus-4-8` | Simplest config | 5× higher cost for parse route vs Sonnet; parse is mechanical | Acceptable for MVP; switch to `claude-sonnet-4-6` for PARSE_MODEL after quality is confirmed |
| `console.error` with raw err on parse/cover-letter failure | Easy debugging | May log CV text snippets to Vercel log drain, violating zero-retention claim | Acceptable only if Vercel log access is private; sanitize err before logging in production |
| No streaming keepalive/heartbeat | Less code | Intermediate proxies drop idle connections before 120s generation completes | Never for the cover-letter route — add heartbeat |
| PostHog with default autocapture | Instant analytics | CV content captured and sent to PostHog, destroying zero-retention claim | Never — disable autocapture before deploy |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `@anthropic-ai/sdk` streaming | Forwarding all `content_block_delta` events to client | Filter strictly for `event.delta.type === "text_delta"` — thinking_deltas contain sensitive CV reasoning |
| `@anthropic-ai/sdk` structured output | Calling `messages.create()` and parsing JSON manually | Use `messages.parse()` with `output_config: { format: zodOutputFormat(schema) }` from `@anthropic-ai/sdk/helpers/zod` |
| Vercel deployment | Assuming `maxDuration = 120` is honored on Hobby plan | Deploy on Pro; verify plan-level cap (Hobby = 60s max); declare in `vercel.json` |
| PostHog JS SDK | Adding PostHog with default init | Set `autocapture: false`, `ip: false`, `person_profiles: 'identified_only'` before init |
| Next.js 16 route handlers | Accessing `cookies()` or `headers()` synchronously | Always `await cookies()`, `await headers()` — synchronous access removed in v16 |
| Node version on CI | Letting CI default to system Node | Pin `.nvmrc` + `engines.node` + Vercel Node version setting to ≥20.9 |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No streaming to client (buffering entire response) | UI hangs for 30–60s then shows text all at once | Use `ReadableStream` with incremental `controller.enqueue()` — already implemented | From day 1 — poor UX even at 1 user |
| Cold start on first request | 3–7s blank screen before first byte streams | Vercel Fluid Compute (Pro) keeps instances warm under any traffic; ensure Pro plan | On every deploy until first warm request |
| Input length unbounded | Single large CV (50KB) blocks the function for its full duration, preventing other requests | Add input length guard: `if (cvText.length > 15000) return 400` | At any traffic level — cost + availability |
| Zod schema too strict | Valid CV data causes `messages.parse()` to fail on `refusal` stop_reason | All fields that might be absent must be `.nullable()` — already handled in schema | Whenever a CV has unusual structure |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging `err` object that contains request body in `catch (err)` | CV text appears in Vercel log drain; if log drain is external, zero-retention claim is violated | Catch `err`, log only `err.message` or a sanitized summary, never `req.body` |
| No rate limiting on API routes | Unlimited free CV parses; competitor scraping; cost abuse | Add Vercel Edge Middleware rate limiting by IP before launch; start with 10 requests/hour/IP |
| `ANTHROPIC_API_KEY` in client bundle | Key exposed; anyone can use it | Key is only in `process.env` server-side — never import `anthropic.ts` from a client component |
| PostHog distinct_id set to email or user identifier | All analytics events have PII attached | Use anonymous IDs only; never call `posthog.identify()` with an email |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress indicator during 30–60s generation | Users think the page is broken; high abandonment | Show streaming progress: "Generating Anschreiben..." with animated indicator + partial text appears as streamed |
| Zero-retention claim buried in footer | German users worried about CV PII don't trust the tool | Put zero-retention claim front and center on landing page AND in the tool form (above the CV paste area) |
| Showing German output only (no bilingual explanation) | Expat cannot verify if the output is correct | Bilingual mode (German letter + English explanation of each change) is in scope — ship it |
| Missing "have a native speaker review" nudge | User submits AI-generated letter without human check; quality risk | Keep the nudge from `prompts.ts` visible in the output UI, not buried in the cover letter footer |
| Form resets on API error | User loses pasted CV and job description | Preserve form state on error; show retry option with the inputs intact |

## "Looks Done But Isn't" Checklist

- [ ] **Streaming route:** Verify stream ends with `controller.close()` and the client detects end-of-stream — check for hanging connections in Network tab
- [ ] **PostHog:** Confirm autocapture is disabled; open PostHog event stream and verify no CV text appears in any event property
- [ ] **Node version:** Run `node --version` locally and confirm Vercel project Node version setting match ≥ 20.9
- [ ] **Anti-fabrication:** Dogfood Kilian's own CV through the full flow and verify every Anschreiben claim traces to a specific CV line or question answer
- [ ] **Photo guidance:** Check `photoAdvice` output for the nuanced AGG guidance (not blanket "include" or "skip")
- [ ] **DIN 5008 compliance:** Verify date format is `DD.MM.YYYY`, address block is correct, closing signature line is present
- [ ] **Input guard:** Test with a 20KB paste — confirm 400 error with helpful message rather than silent cost bleed
- [ ] **Vercel timeout:** Confirm `maxDuration = 120` honored by generating a real cover letter in production staging
- [ ] **Error state:** Simulate API failure; confirm form inputs are preserved and a retry option is shown

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Node version mismatch causing build failure | LOW | `nvm use 20.9`, `rm -rf node_modules`, `npm install` |
| Async params breaking pages at runtime | MEDIUM | Run Next.js codemod `npx @next/codemod@canary upgrade`, manually audit any remaining sync accesses |
| PostHog capturing CV text in production | HIGH | Disable PostHog immediately; rotate PostHog project key; delete captured data via PostHog data deletion tools; update Privacy Policy; notify users via landing page notice |
| Fabricated claim in Anschreiben reported by user | HIGH | Add explicit disclaimer to output; strengthen system prompt; consider adding "I verify this letter accurately reflects my experience" consent checkbox before download |
| Vercel function timeout on cover letter | LOW-MEDIUM | Upgrade to Pro plan; add heartbeat to stream; optionally lower `max_tokens` on GENERATION_MODEL |
| SEO content not ranking before Sept peak | LOW | Pivot to community distribution (Reddit, LinkedIn) as primary channel; treat SEO as 6-month horizon |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Node 18 mismatch | Deploy phase (prerequisite) | `node --version` = 20.9+; Vercel build succeeds |
| Next.js 16 async APIs | UI build phase | TypeScript strict mode, no sync access of cookies/params |
| Vercel timeout on 120s stream | Deploy phase | Cover letter generates to completion in Vercel staging |
| Thinking delta leak to client | UI build phase | Network tab shows only text, no `thinking_delta` chunks |
| SDK `messages.parse()` drift | UI build phase (pre-flight) | Integration test: parse route returns `lebenslauf.personal.fullName` |
| CV fabrication in Anschreiben | UI build phase (prompt hardening) | Dogfood: every Anschreiben claim traces to CV line |
| PostHog capturing CV PII | Deploy phase (launch blocker) | PostHog event stream audit: zero CV text in properties |
| AGG photo guidance trap | UI build phase | `photoAdvice` output review; nuanced guidance confirmed |
| SEO timeline mismatch | Marketing phase | Community distribution started before SEO content; timeline = 6-month horizon |
| Build-in-public product-push trap | Marketing phase | Posts lead with job-search story, not product features |
| Paid ads before validation | Marketing phase | Paid not started until copy/download rate confirmed organically |
| German norm mistakes | UI build phase + design phase | Native-speaker review gate before launch |

## Sources

- Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js 16 async params explainer: https://dev.to/peterlidee/async-params-and-searchparams-in-next-16-5ge9
- Anthropic adaptive thinking docs: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- budget_tokens deprecation issue: https://github.com/block/goose/issues/7293
- Vercel function limitations: https://vercel.com/docs/functions/limitations
- Vercel function duration config: https://vercel.com/docs/functions/configuring-functions/duration
- Vercel FUNCTION_INVOCATION_TIMEOUT: https://vercel.com/docs/errors/FUNCTION_INVOCATION_TIMEOUT
- PostHog GDPR compliance: https://posthog.com/docs/privacy/gdpr-compliance
- PostHog PII exposure checklist: https://productquant.dev/blog/posthog-pii-phi-exposure-checklist/
- PostHog privacy controls: https://posthog.com/docs/product-analytics/privacy
- German CV format 2026: https://www.gluckglobal.com/post/german-cv-lebenslauf-format-the-ultimate-2026-checklist-mistakes-to-avoid
- German cover letter rules: https://liveingermany.de/german-cover-letter-anschreiben/
- AGG discrimination law: https://www.antidiskriminierungsstelle.de/EN/about-discrimination/order-and-law/general-equal-treatment-act/
- SEO ranking timeline: https://resources.averi.ai/benchmarks/seo-ranking-timeline
- SEO 6% top-10 stat: https://www.searchscaleai.com/blog/how-long-does-seo-take-realistic-timeline-2026/
- FTC Operation AI Comply: https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes
- AI hallucination liability: https://smbsecurenow.com/ai-hallucination-liability-guide/
- Founder-led content pitfalls: https://www.founderdistro.com/blog/content-strategy-for-early-stage-founders

---
*Pitfalls research for: ScanReady — expat German CV/Anschreiben AI tool*
*Researched: 2026-06-22*
