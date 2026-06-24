# ScanReady — Community / Build-in-Public Plan (GTM-01)

**Owner:** Kilian Hartmann  
**Last updated:** 2026-06-24  
**Requirement:** GTM-01  
**Status:** Founder-reviewed and approved 2026-06-24. Before any post goes live, the founder must still (a) verify each target subreddit's live rules and (b) decide the Post 3 PII-redaction question — see Section 6.

---

## Artifacts This Phase Produces

This plan is one of three distribution artifacts produced in Phase 5:

| File | Artifact |
|------|----------|
| `distribution/community-plan.md` | GTM-01 — Build-in-public / community plan (this file) |
| `distribution/seo-keyword-plan.md` | GTM-02 — SEO keyword list + 6-month publishing cadence |
| `distribution/paid-test-spec.md` | GTM-03 — Paid conversion-test spec (Google Search, €100, gated) |

All three are documentation artifacts. No app code is changed in Phase 5.

---

## 1. Strategy and Positioning

### Core Frame

Every post, comment, and piece of content in this motion carries one through-line, reused verbatim from the landing page:

> **"Win the 8-second German recruiter scan."**

German recruiters spend roughly eight seconds deciding whether a CV earns a second look. International CVs fail not because of experience gaps — but because of formatting and norm gaps that German recruiters clock in seconds. This is the insight that leads every post. It is a genuine, grounded claim, not a marketing headline.

### Approach: Reddit-led, Deliberately Low-Profile (D-01)

This is **not** a loud public build-log. The community motion is:

- **Reddit-first** — the places where the target audience (internationals navigating Germany job applications) already gathers and asks questions.
- **Low-profile** — no self-congratulatory founder journey posts, no daily log, no LinkedIn "I built something" noise.
- **LinkedIn: optional and sparing** — the founder's LinkedIn may share the occasional milestone update or long-form note, but it is not the engine. Nothing is cross-posted mechanically.

The model is: show up where the audience is, contribute something genuinely useful, and let the tool surface naturally.

### Self-Promotion: Story/Value-Led Soft Mention (D-02)

Reddit's sitewide principle: *"It's fine to be a Redditor with a website; it's not fine to be a website with a Reddit account."* [ASSUMED — widely cited as Reddit's official framing from multiple secondary sources]

The approach here respects that principle in practice:

1. **Post genuine value first.** The post stands entirely on its own — educational, honest, useful — even if ScanReady never existed.
2. **Mention the tool once, naturally.** If the context makes it directly relevant ("I actually built a tool that does this"), say so once.
3. **Link placement:**
   - **Profile bio** — always fine.
   - **First comment** — acceptable in most subs, preferred over body links.
   - **Post body** — only on first posts in subreddits that explicitly allow self-promo links; default is NO.
4. **Disclose affiliation immediately.** "Disclaimer: I built this." No ambiguity.
5. **Never argue with moderator removals.** If a post is removed, accept it and adapt.

### Guardrails (Non-Negotiable)

Apply to every line of copy, every post, every comment:

| Guardrail | What it means in practice |
|-----------|--------------------------|
| No income/outcome claims | Never say or imply "get hired faster," "land more interviews," "increase your salary." Sell the capability — norm-correct German documents grounded in real facts — never the outcome. |
| "Authentic" = voice, not detection-evasion | Authentic means the Anschreiben sounds like the applicant (grounded in their answers) — never that it "beats AI detectors" or "sounds human to AI systems." |
| Nationality-neutral | Posts are for internationals, expats, and people relocating to Germany — do not target a single nationality (e.g., "for Americans"). The format gap applies broadly. |
| GDPR zero-retention as a trust signal | State it plainly: nothing is stored, no account, no database, not used for AI training. This is a genuine differentiator; message it. |
| Never imply fabrication | The tool never invents employers, titles, dates, or skills. Never write copy that implies it does. |
| Native-quality German + review nudge | Any post describing the output should note: "A native German speaker should review the final letter before you send it." This is an honest quality expectation, not a disclaimer. |

---

## 2. Subreddit Shortlist

> **Important:** Member counts are best-effort estimates from third-party tracking tools (gummysearch.com, redpulse.io, thehiveindex.com). Reddit removed publicly visible subscriber counts in September 2025. All member figures are **[ASSUMED]** unless noted. Per-sub rules are also **[ASSUMED]** from indirect evidence — **see Section 5 for the mandatory pre-posting verification checklist.**

### Target Subreddits

| Subreddit | Est. Members | Self-Promo Risk | Post Format | Notes |
|-----------|-------------|-----------------|-------------|-------|
| r/germany | ~1.5M–2M [ASSUMED] | **MEDIUM** — story/value posts likely tolerated; blatant product links removed | Text and image | Largest English-language Germany community. Norm-gap content is a native fit. Rules [ASSUMED]. |
| r/expats | ~248K [ASSUMED: gummysearch.com] | **MEDIUM** — tool-mention posts observed but informal; tolerates value-first mentions | Text and image | Direct audience: internationals navigating relocation. Tool mentions observed [ASSUMED]. |
| r/cscareerquestionsEU | ~171K [ASSUMED: gummysearch.com] | **HIGH** — tech career community, very sensitive to product promotion | Text-first | Only relevant if the post is pure career advice. German CV norm-gap explainer can work with zero product mention. |
| r/jobs | ~2.58M [ASSUMED: redpulse.io] | **HIGH** — general career advice; product mentions face backlash | Text-first | Large audience but high risk. Post only if purely educational. |
| r/resumes | ~500K [ASSUMED] | **HIGH** — peer critique culture; before/after fits but product links likely removed | Image OK for before/after | The proof post (Post 3) can work here framed as a critique request. No product link in body. |
| r/digitalnomad | ~1M [ASSUMED] | **LOW-MEDIUM** — tool-sharing culture, remote-work audience | Text and image | Germany + Chancenkarte angle has documented traction in this community. |
| r/berlin / r/munich | <100K each [ASSUMED] | **LOW-MEDIUM** — city-specific, smaller, lower mod scrutiny | Text and image | Locals + expats; secondary channel after main subs. |
| r/GermanyExpats | ~379 [ASSUMED: gummysearch.com] | **LOW** — tiny, niche, minimal risk | Text | Very small reach but zero removal risk. Good for early posts while account karma builds. |

### Subs NOT to Use

- **r/cscareerquestions** (~800K–2.4M, US-focused, strict moderation, no European relevance) — wrong audience.

### Staggering Rule (Critical)

**Never post to multiple subreddits simultaneously.** Coordinated posting across subs at launch is a well-documented ban trigger — moderators and automod systems flag it as coordinated spam.

**Rule:** Post to **one subreddit per ≥ 1 week**. Let each post settle, gather feedback, and build account history before moving to the next community.

---

## 3. Cadence

### Weekly Milestone-Anchored Posts (D-03)

**~1 substantive post per week**, anchored to real application milestones from the founder's live job hunt. Dogfooding generates the material:

- Sent a real application using ScanReady? That's content.
- Noticed something unexpected about how German recruiters responded? That's content.
- Revised the Lebenslauf based on feedback? That's content.

The posts are not invented. They trace the real job-search journey. This is the only authentic build-in-public motion — anything manufactured reads as manufactured.

### Cadence Map

| Week | Sub Target | Post Direction | Milestone Anchor |
|------|-----------|----------------|-----------------|
| Week 1 (post-launch) | r/germany | Post 1: "8-second scan" norm-gap explainer | Tool live; first real application submitted |
| Week 2–3 | r/expats | Post 2: Recruiter-expectations checklist | Second application; checklist validated by experience |
| Week 3–4 | r/resumes | Post 3: Before→after founder CV proof | Real Lebenslauf produced; PII decision made |
| Week 5+ | r/digitalnomad, r/cscareerquestionsEU, r/berlin / r/munich | Adapted versions of above + new milestone posts | Ongoing job hunt |
| Ongoing | All | ~1 substantive post/week; reply to relevant questions in comments | Real application milestones |

**LinkedIn:** Optional. The founder may share a milestone update or long-form note occasionally. Not scheduled, not the engine, never cross-posted mechanically.

### TikTok — Organic Short-Form Experiment (D-12)

TikTok is an **optional organic experiment** folded into this same build-in-public motion — it is NOT a separate channel and carries NO paid spend here.

If short-form content fits naturally (e.g., a 30-second before→after clip, a quick norm-gap walkthrough), it repurposes the same material produced for Reddit posts. The format is: take the same before→after proof or norm-gap insight from a Reddit post, adapt it to a short clip.

**This is a noted experiment, not a TikTok content strategy.** A paid TikTok test is explicitly deferred — it earns its own separate budget and plan later, only if organic short-form shows real traction. No budget is allocated here.

---

## 4. Post Format Guidance (D-06)

### Primary Format: Visual-Heavy

Before/after screenshots and carousels are the primary format where the platform allows them. The before/after visual is the most efficient way to communicate the norm gap — it takes three seconds to understand what would take three paragraphs to explain in text.

| Subreddit type | Format approach |
|----------------|----------------|
| r/germany, r/expats, r/digitalnomad | **Visual-first.** Lead with a clear before/after image or carousel. Caption carries the substantive text. |
| r/cscareerquestionsEU, r/jobs | **Text-first.** Lead with substantive educational text. Embed one key screenshot (e.g., the before/after side-by-side) if image posts are allowed — verify rules first. |
| r/resumes | **Visual acceptable.** Before/after image is standard format for this sub. Frame as requesting critique, not showcasing a product. |
| r/berlin / r/munich | **Both.** No known restriction — default to visual-first. |

### Platform-Fit Adaptation (not a separate format)

On text-first subs, the **content** is the same — the same norm-gap insight, the same before/after transformation. The delivery changes: substantive text leads, and the key visual is embedded rather than leading. This is platform adaptation, not a different content strategy.

---

## 5. Three Drafted Posts

> These are ready-to-publish drafts. Each is adapted to its destination subreddit's tone and community norms. **Do not cross-post identical content across subreddits.**
>
> **Before publishing any post:** Complete the per-sub verification checklist in Section 6. Rules are [ASSUMED] from indirect evidence and MUST be confirmed on the real subreddit sidebar before any post goes live.

---

### Post 1 — "8-Second Scan" Norm-Gap Explainer

**Destination:** r/germany (primary), r/expats (adapted)  
**Format:** Text-first (with optional before/after image if platform allows)  
**Self-promo:** None in post body. Tool link in profile bio only.  
**CTA:** None explicit — the post carries the "Win the 8-second German recruiter scan" frame by content, not by product pitch.

---

**TITLE (r/germany):**
> Why German recruiters reject US/UK CVs in the first 8 seconds — and what they actually look for

**BODY:**

If you've applied for jobs in Germany with a US or UK résumé and heard nothing back, the format is probably the first thing that failed — not your experience.

German recruiters apply what's often called an "8-second scan": a quick structural check before they read a single word of your content. Here's what they're looking for in those eight seconds, and what most international CVs get wrong.

**1. The Lebenslauf, not a résumé**

Germany uses the *Lebenslauf* — a structured format with specific conventions that German recruiters expect on sight. It is not just a German-language résumé. It is a different document.

**2. Reverse-chronological, always**

US résumés sometimes use functional or hybrid formats. German recruiters expect strict reverse-chronological order. A functional format reads as a red flag — it signals the applicant is hiding something.

**3. Personal data block**

A German Lebenslauf typically opens with a personal data block: name, address, phone, email, date of birth, nationality, and — depending on the role and your preference — a professional photo. US/UK CVs omit most of this. German recruiters notice.

**4. Date format**

The German standard (DIN 5008) formats dates as `01.03.2022`, not `March 1, 2022` or `3/1/22`. An international date format is a small but legible signal that the applicant did not adapt the document for the German market.

**5. "Present" vs "heute"**

"Jan 2021 – Present" is English-language shorthand. In a German Lebenslauf, the correct term is `heute`. It's a small word; it signals a lot about whether the document was produced for a German reader.

**6. Photo guidance**

By law (AGG / German anti-discrimination law), employers cannot require a photo. In practice, many German job postings and recruiting norms still expect one — particularly in more traditional sectors. Whether to include a photo is the applicant's decision. But if you include one, it should be a professional portrait (not a selfie, not a casual photo).

**7. Length**

German Lebenslauf convention is tight: typically 1–2 pages maximum, with entries structured formally. US résumés use bullet-heavy, achievement-heavy language that reads differently in a German context.

---

The format gap is real, but it is not about competence. It is about knowing the conventions — and most international job seekers have simply never been told them.

*(Zero-retention note: I've been using [a stateless tool](profile bio / first comment) to convert my own CV — nothing stored, no account. Sharing in case it's useful. A native German speaker should still review the final letter before you send it.)*

---

**ADAPTATION for r/expats:**
Lead with the relocation context: "If you've recently relocated to Germany and started applying for jobs..." Same content, slightly different opening frame. Slightly warmer, less technical. Same link placement (profile / first comment only).

---

### Post 2 — Recruiter-Expectations Checklist

**Destination:** r/expats (primary), r/germany (adapted), r/jobs (adapted, no product mention)  
**Format:** Text-first listicle (high shareability)  
**Self-promo:** None in post body. Tool link in profile bio / first comment.  
**Frame:** "Win the 8-second German recruiter scan" — this is a utility post, not a product pitch.

---

**TITLE:**
> 12 things German recruiters expect that international CVs always get wrong

**BODY:**

I've been going through the process of converting my CV for German job applications, and the norm gap is bigger than I expected. Here's the checklist I wish I'd had before I started.

Most of these are things no one tells you unless you've worked in German HR.

---

**Format and structure**

- [ ] **Document is called a Lebenslauf, not a résumé or CV.** The distinction matters to German recruiters.
- [ ] **Strict reverse-chronological order.** Most recent role listed first. Functional formats are not used in Germany.
- [ ] **Personal data block at the top.** Name, address, phone, email, nationality, date of birth. German recruiters expect this; most international CVs omit it.
- [ ] **Dates are DIN format: `01.03.2022`.** Not "March 2022," not "03/2022."
- [ ] **"Present" is written as `heute`.** Small word, visible signal.
- [ ] **Length: 1–2 pages maximum.** Tight, formally structured entries. Not bullet-heavy US achievement prose.

**Content and language**

- [ ] **The document is in German.** Or bilingual with a clearly marked German section. Sending an English-only résumé to most German employers is a fast-track to the rejection pile.
- [ ] **No objective statement.** German Lebenslauf convention does not include a summary or objective at the top.
- [ ] **Entries are structured, not achievement-bulleted.** German Lebenslauf entries typically read: Role, Company, Dates — then a brief factual description of responsibilities. Heavy achievement-quantification bullets are more of an Anglo-American convention.

**Photo**

- [ ] **Photo decision made deliberately.** Employers cannot require a photo (AGG law). In practice, many traditional sectors still expect one. If you include a photo, it should be a professional portrait. If you choose not to, that is entirely valid.

**Cover letter (Anschreiben)**

- [ ] **An Anschreiben is expected, not optional.** German job applications typically include a cover letter as a standard component — not an optional add-on.
- [ ] **DIN 5008 format.** The Anschreiben has a specific layout: sender address, recipient address, date, subject line (Re: [Job Title]), formal opening (Sehr geehrte/r...), formal body, formal close (Mit freundlichen Grüßen). Casual cover letters signal unfamiliarity with the format.

---

If you're going through this process: the format gap is real, but it's fully learnable. The experience and qualifications are yours — the document is just a translation problem.

*(A native German speaker should review your Lebenslauf and Anschreiben before you submit. Even a 20-minute check catches things automated tools miss.)*

*Disclaimer: I built a small free tool that helps with this conversion — link in [first comment / profile] if useful. Nothing stored, no account.*

---

**ADAPTATION for r/germany:**
Lead with "Applying for jobs in Germany as an international?" — slightly broader intro, same checklist. Slightly less process-heavy framing, more conversational.

**ADAPTATION for r/jobs (HIGH-risk sub):**
Remove the product mention entirely. Post purely as a useful international-applicant checklist. No product link anywhere. Only post here if the sub's rules allow general career advice from international job seekers.

---

### Post 3 — Before/After Founder CV Proof

**Destination:** r/resumes (primary — framed as critique request), r/germany / r/expats (adapted — framed as sharing the experience)  
**Format:** Visual-first (before/after image or side-by-side) + text  
**Self-promo:** Soft mention only. Link in first comment, never in post body.

**SECURITY / PRIVACY NOTE (D-05, GDPR guardrail — MANDATORY founder decision before publishing):**

> **This post uses the founder's own real CV excerpt.** Before publishing, the founder must decide the PII-redaction question:
>
> - **Redact all PII (recommended default):** Remove name, contact details, specific employer names, job titles that identify you, and any other personally identifying information. Replace with bracketed placeholders: `[NAME REDACTED]`, `[EMPLOYER REDACTED]`, `[ROLE REDACTED]`.
> - **Expose selectively with explicit consent:** If the founder explicitly chooses to show real employer/role details (e.g., for authenticity), this must be a conscious decision, not an oversight.
>
> **The draft below uses bracketed placeholders throughout.** The founder fills these in (redacted or real) before publishing.

---

**TITLE (r/resumes — critique frame):**
> I converted my international CV to a German Lebenslauf using AI — roast it (and the before)

**TITLE (r/germany / r/expats — experience frame):**
> I'm an expat applying for jobs in Germany — here's what my CV looked like vs. the Lebenslauf it needed to be

**BODY:**

I've been applying for jobs in Germany as an international. The format gap between a US/UK résumé and a German Lebenslauf is bigger than I expected — so here's my real before-and-after.

---

**BEFORE — Original CV section (English format):**

> [FOUNDER'S REAL CV EXCERPT — REDACT OR EXPOSE AT YOUR DISCRETION]
>
> Example placeholder (replace with real content):
> "[ROLE REDACTED] | [EMPLOYER REDACTED] | [DATE RANGE REDACTED]
> [Brief description of responsibilities and achievements in English-language résumé style]"

---

**AFTER — Lebenslauf section (German):**

> [LEBENSLAUF OUTPUT FROM SCANREADY — REAL GENERATED OUTPUT]
>
> Example placeholder (replace with real content):
> "[Translated/converted role entry in German, DIN date format, correct German conventions]"

---

**Norm-gap notes (the tool flagged these):**

- Date reformatted: `[Date]` → `[DIN format date]` (DIN 5008 standard)
- "Present" → `heute` (German norm)
- [Any other norm changes the tool flagged — copy real output]
- Personal data block added (name, address, contact, nationality, DoB)
- Photo guidance: optional by law, expected in practice — I chose [to include / not to include] one

---

What I learned: the format gap is real, but it's a translation problem, not a competence problem. The hardest part was knowing the conventions existed.

I built a small free tool to help with this — [link in first comment]. It's stateless: nothing stored, no account, not used for training. A native German speaker should still review the output before you send it.

*(r/resumes frame: happy to take critique on both the before and the after — especially if anyone here has experience with German HR norms)*

---

**ADAPTATION for r/resumes:**
Open with "Looking for critique on a German Lebenslauf conversion" — frame as a request for feedback, not a showcase. End with "Roast it — especially if you know German application norms." The product mention is still soft and last.

**ADAPTATION for r/germany / r/expats:**
Open with the experience angle: "I've been applying for jobs in Germany as an international and the format difference was bigger than I expected — here's my real before and after." Less critique-request framing, more "sharing what I learned."

---

## 6. Pre-Posting Rule-Verification Checklist (D-04)

> **Why this exists:** Research could NOT fetch per-subreddit rules. Reddit blocks automated access to sidebar content, and subreddit rules change without notice. The rules marked [ASSUMED] in the shortlist above are inferred from indirect evidence (secondary guides, community behaviour observations) — they are not verified.
>
> **Mandatory:** Before publishing any post to any subreddit, the founder MUST open that subreddit on their real logged-in Reddit account and read the pinned/sidebar rules. This checklist structures that verification.

### How to Use

For each target subreddit, complete the following before drafting the final post for that sub:

---

**r/germany**
- [ ] Opened r/germany sidebar / rules on my real account
- [ ] Confirmed whether image posts are allowed
- [ ] Confirmed whether self-promotional content is explicitly permitted or banned
- [ ] Noted any karma or account-age requirement for posting
- [ ] Noted any pinned post with posting rules
- [ ] Confirmed link placement (profile / first comment / body — which are permitted)
- [ ] Confirmed no active pinned announcement that changes current rules
- [ ] Noted date of rule check: ___________

---

**r/expats**
- [ ] Opened r/expats sidebar / rules on my real account
- [ ] Confirmed whether image posts are allowed
- [ ] Confirmed whether self-promotional content is explicitly permitted or banned
- [ ] Noted any karma or account-age requirement for posting
- [ ] Noted any pinned post with posting rules
- [ ] Confirmed link placement (profile / first comment / body — which are permitted)
- [ ] Confirmed no active pinned announcement that changes current rules
- [ ] Noted date of rule check: ___________

---

**r/resumes**
- [ ] Opened r/resumes sidebar / rules on my real account
- [ ] Confirmed whether image posts are allowed (critical for Post 3 before/after)
- [ ] Confirmed whether self-promotional content is explicitly permitted or banned
- [ ] Noted karma or account-age requirement (peer critique communities often have these)
- [ ] Confirmed framing: whether "requesting critique" is the required frame for before/after posts
- [ ] Confirmed link placement permitted (first comment)
- [ ] Noted date of rule check: ___________

---

**r/cscareerquestionsEU**
- [ ] Opened r/cscareerquestionsEU sidebar / rules on my real account
- [ ] Confirmed whether self-promotional content is explicitly banned (assumed HIGH risk)
- [ ] Confirmed whether the norm-gap explainer (no product mention) is acceptable
- [ ] Noted karma or account-age requirement
- [ ] Confirmed link placement (if any product mention is allowed at all)
- [ ] Noted date of rule check: ___________

---

**r/jobs**
- [ ] Opened r/jobs sidebar / rules on my real account
- [ ] Confirmed whether educational international-applicant content is permitted
- [ ] Confirmed whether any product mention is allowed (assumed HIGH risk — likely not)
- [ ] Noted karma or account-age requirement
- [ ] Noted date of rule check: ___________

---

**r/digitalnomad**
- [ ] Opened r/digitalnomad sidebar / rules on my real account
- [ ] Confirmed whether tool-sharing posts are explicitly permitted
- [ ] Confirmed Germany / Chancenkarte framing is relevant to community
- [ ] Confirmed link placement (first comment / body)
- [ ] Noted date of rule check: ___________

---

**r/berlin / r/munich**
- [ ] Opened r/berlin and/or r/munich sidebar / rules on my real account
- [ ] Confirmed whether expat job-application content is relevant to community scope
- [ ] Confirmed whether tool links are permitted
- [ ] Noted karma or account-age requirement (city subs often have these)
- [ ] Noted date of rule check: ___________

---

**r/GermanyExpats**
- [ ] Opened r/GermanyExpats sidebar / rules on my real account
- [ ] Confirmed posting frequency / volume rules (tiny sub — don't over-post)
- [ ] Confirmed whether tool links are permitted
- [ ] Noted date of rule check: ___________

---

### General Pre-Posting Checks (All Subs)

Before every post, regardless of subreddit:

- [ ] Account has ≥ 2 weeks of genuine participation in this subreddit (comments, non-promotional posts) before any soft-mention post
- [ ] Post was reviewed against Section 1 guardrails: no income/outcome claims, no detection-evasion framing, nationality-neutral, zero-retention messaged, no fabrication implied
- [ ] Tool link is in profile bio or first comment — NOT in the post body (unless rules explicitly allow it)
- [ ] Founder affiliation is disclosed: "Disclaimer: I built this"
- [ ] Native-speaker review nudge is included if post describes document output

---

## 7. Assumptions Log

All subreddit-specific claims in this document are [ASSUMED] from indirect evidence unless explicitly noted otherwise. This is not a hedge — it is an honest statement of research limitations. Per-sub rules must be verified via direct sidebar visit (Section 6) before any post goes live.

| # | Claim | Status | Risk |
|---|-------|--------|------|
| A1 | r/germany tolerates value-first story posts | [ASSUMED] | Posts may be removed; verify sidebar |
| A2 | r/expats has tool-mention posts that appear tolerated | [ASSUMED] | Rules may be stricter than observed behaviour suggests |
| A3 | r/resumes accepts before/after image posts | [ASSUMED] | Image rules vary; verify before posting Post 3 |
| A4 | r/digitalnomad has a tool-sharing culture | [ASSUMED] | Community may have tightened rules |
| A5 | City subs (r/berlin, r/munich) have low mod scrutiny | [ASSUMED] | Verify before posting |
| A6 | r/cscareerquestionsEU will not accept product mentions | [ASSUMED: HIGH risk] | Post pure educational content only; no product mention |
| A7 | 90/10 sitewide self-promotion norm is enforced | [ASSUMED from multiple secondary sources] | Build account history before promotional posts |

---

*GTM-01 community plan. See also: `distribution/seo-keyword-plan.md` (GTM-02), `distribution/paid-test-spec.md` (GTM-03).*
