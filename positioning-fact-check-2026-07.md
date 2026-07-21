# Positioning review: expat wedge vs. German natives + messaging fact-check (2026-07-04)

Research-backed answer to: "Is focusing mainly on expats-to-Germany right, or should we target German customers? And is our '8-second scan' messaging actually evidenced?" Two research passes (DACH-source-preferred), synthesized against `cv-germany-expat-concept.md`, `.planning/PROJECT.md` decisions, and the shipped product.

## Verdict 1: Stay internationals-first. Don't reposition to German natives.

**The wedge only exists for internationals.** ScanReady's core mechanic — grounded foreign-CV → norm-correct German Lebenslauf conversion with bilingual norm-gap explanations — solves a problem German natives don't have. Nobody else offers this conversion: US builders (resume.io, Zety) run German-language *verticals* but they're translations of a US template engine (their own German blogs exist to *explain* the German format — a tell the tool wasn't built around it), and German-native incumbents are all "build from scratch in German" tools.

**The native market is bigger but structurally hostile.** German-native jobseekers are served by free, distribution-rich incumbents: XING's lebenslauf.com (~371K visits/mo), Stepstone's built-in generators, bewerbung2go (Jobware), lebenslauf.de. They already speak German norms and are AI-enabled. Competing there means head-on generic-AI-quality competition against free products with owned distribution — abandoning our wedge, not exploiting a gap.

**The "US builders push American CVs on Germans" thesis is weaker than it sounds.** Verified German complaints about Zety et al. are overwhelmingly about the **Abofalle** (€2.70 teaser → €23.70/month auto-renew; 64% negative sentiment tracked), not about format Americanness. The format-failure story for *natives* is plausible but unverified. What IS real: the Abofalle reputation — which our one-shot honest pricing already positions against, and that positioning works for BOTH segments.

**Segment economics.** Internationals: bounded niche (~25K concurrent English-language postings, concentrated Berlin/Munich/Frankfurt tech+finance) but strongly growing with policy tailwind — ~6M foreign-born employees, Blue Cards +114% since 2020, record 63.9K international graduates (2025) with 64% intending to stay, Chancenkarte 20K+ since mid-2024. Natives: orders of magnitude more volume (62.4% of 2024 hires were job-switchers) but no differentiated entry point for us today.

**Adjacency, not pivot:** the native market remains a later expansion (Stage 3+), entered through the trust/fair-pricing/quality door once we have German-language content presence — not by repositioning now. This confirms PROJECT.md's existing beachhead decision (internationals, nationality-neutral copy, reachable cohort first).

## Verdict 2: Retire the literal "8-second scan" — it's US lore, and the one DACH study contradicts it.

| Claim | Verdict | Evidence |
|---|---|---|
| "Recruiters scan a CV in 6–8 seconds" | **US import, not defensible for DE.** | Number comes from TheLadders eye-tracking (2012: 6s; 2018: 7.4s) — 30 US recruiters, never peer-reviewed. The only DACH eye-tracking study (StepStone AT × MindTake 2018, 33 HR managers) found **~43 seconds** average: 22.3s on work experience, 7s on the latest role, 1.8s on the photo. |
| "ATS keyword filters auto-reject you" | **US narrative; near-zero in DE.** | Bitkom 2025 (852 German companies): **1%** use AI-based screening (21% considering). SAP SuccessFactors/Personio/softgarden/rexx dominate as *workflow* tools; German vendors explicitly frame AI as advisory — human decides. Our deferral of ATS scoring is validated; never build "beat the ATS bot" messaging. |
| "Photo is expected" | **Partially true, eroding.** | Indeed: 53% of German HR consider it important; ~18.8% reject photo-less applications. Legally optional (AGG). Higher figures (80%) circulating in career blogs are untraceable. **Our current nuanced stance is exactly right.** |
| "Anschreiben is required" | **Outdated for large employers.** | Taledo 2021: only 18% of the largest corporates still required it (falling); DB, BASF, Deutsche Post, Aldi Süd dropped it. Robert Half: 48% of HR find cover letters "not very informative" — genericness is the failure mode. Supports our "authentic voice" pitch; avoid "required" framing. |
| "US-format CVs get rejected" | **Plausible, unmeasured.** | Tabellarischer Lebenslauf is the universal descriptive norm, but no rejection-rate study exists. Keep qualitative ("the format German recruiters expect"); never cite a made-up rejection statistic. |
| "One-page rule" | **Evidenced AGAINST.** | 61% of German HR managers prefer **two** A4 pages (StepStone/MindTake). Explicitly debunk the one-page myth — it's a differentiating "we actually know Germany" proof point. |
| Spelling/grammar as dealbreaker | **Strongest DACH-evidenced hook.** | **64%** call errors a dealbreaker (StepStone/MindTake). Directly anchors our native-quality-German promise. |
| Arbeitszeugnis centrality / handwritten signature | Declining / obsolete. | Academic critique of Arbeitszeugnis validity; signature guidance not found in any current source. Don't lean on either. |

## Recommended messaging shifts (pending founder sign-off)

1. **Tagline:** drop the specific "8-second" number. Candidates: anchor on the evidenced facts — "Recruiters decide in under a minute. Make it count." / "Bestehen Sie den ersten Blick." — or keep "win the recruiter's first scan" without a digit. A brand whose product guardrail is "grounded, never fabricated" cannot run a tagline built on a debunked US statistic; a Reddit commenter with the StepStone study is a real risk during build-in-public.
2. **Lean into the evidenced trio:** 64% spelling-dealbreaker (→ native-quality German), 61% two-pages-preferred (→ debunk the one-page myth in normGapNotes/marketing), photo nuance (already correct).
3. **Anti-Abofalle as explicit positioning:** "2,99 € einmalig. Kein Abo. Keine Falle." — evidenced against the incumbent complaint pattern, works for both segments.
4. **Anschreiben framing:** "where an Anschreiben is asked for, a generic one hurts you" — not "you must have one."
5. **Product copy audit needed** (landing page, OG metadata, `photoAdvice`/`normGapNotes` prompt guidance) once tagline decision lands. Product name "ScanReady" itself survives — "the scan" as concept is fine; only the borrowed number goes.

## Sources (key)

- TheLadders eye-tracking 2018 (US origin of "6–7.4s"): theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf
- StepStone AT × MindTake eye-tracking 2018 (43s; 61% two pages; 64% spelling): stepstone.at/Ueber-StepStone/pressebereich/eyetracking-studie-so-lesen-personalverantwortliche-bewerbungen/
- Bitkom 2025 AI-screening adoption (1%): blog.recrutainment.de/2025/05/30/bitkom-studie-...
- Taledo Anschreiben study via Business Insider DE (2021, 18%): businessinsider.de/karriere/bewerbung/anschreiben-zur-bewerbung-nur-noch-in-18-prozent-der-konzerne-gewollt-a/
- Zety Abofalle sentiment: smartkündigen.de Anbieterportal/Zety; giga.de/artikel/zety-lebenslauf-online-erstellen-achtung-kosten/
- Migration/segment data: BMI 2025 Bilanz, DAAD 2025 (420K intl. students), EY Jobstudie 2025
