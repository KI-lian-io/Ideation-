# Art Direction: "Typesetting Theater" (award-level push)

Direction A, approved 2026-07-04. Extends — never replaces — the Warm Editorial Broadsheet system (`DESIGN.md`). The concept: **the whole site is a living German broadsheet being typeset in front of you.** The product's mechanic (foreign CV → norm-correct Lebenslauf) IS the theater.

## Signature elements

1. **Hero typesetting theater** — the centerpiece. An American resume visibly re-typesets itself into a German Lebenslauf in a looping, choreographed sequence (~6–8s, then holds; replays on click):
   - Stage 1: a slightly rotated, sans-serif "RESUME.docx" card with messy proportions and a US date ("Mar 2024 – Present") highlighted warm-red.
   - Stage 2: the soft green scan sweep passes over it (the signature motion).
   - Stage 3: elements fly/reflow to the right card — text lines re-set into Source Serif, the date snaps to mono "03/2024 – heute" in accent green, a photo slot draws itself in, section labels (mono taupe) stamp in.
   - Stage 4: DIN annotation pins fade in with leader lines ("DIN 5008", "Rückwärts chronologisch", "Foto optional (AGG)").
   - Built with CSS animations + minimal JS orchestration (IntersectionObserver start, click to replay). Transform/opacity only. Full static end-state fallback under `prefers-reduced-motion` (the finished German document with pins — still beautiful).
2. **Scan-line sweep** as the ONE ownable motion signature: soft accent-green band (8–10% tint, 2px leading edge), 1.2s ease-in-out. Appears: hero (stage 2), parse loading state (replaces/joins the skeleton), subtle 600ms version on doc-sheet hover (desktop only, once per hover-intent).
3. **Masthead navigation** — landing nav becomes a broadsheet masthead: wordmark set larger in display serif, thin double-rule beneath (2px + 0.5px hairline pair), mono dateline right ("BEWERBUNG · DEUTSCHLAND"). Tool keeps the simpler bar (consistency via wordmark + rules).
4. **Typographic bravado (landing only)**: hero display size up to ~clamp(3rem, 8vw, 5.5rem); drop cap on the first body paragraph of the explainer section; hanging punctuation on pull quotes; folio-style section numbers ("01 — ZWEI DOKUMENTE").
5. **Paper grain**: 2–3% SVG noise on the warm page background ONLY (never on doc sheets — they stay pristine). Inline data-URI, no network cost.
6. **Print details**: registration-mark corner ornament in the footer, ::selection in accent-tint, mono folio line at page bottom ("SCANREADY — SEITE 1 VON 1").

## Rules (unchanged from the system)

Ink #1b2430 / paper #f0eee9 / accent #0a7d63 only; 6px buttons, 12px cards; no gradients-as-decoration, no parallax, no scroll-jacking; all motion transform/opacity, ≤300ms for UI (the hero sequence is the single exception as authored content); WCAG-AA and `prefers-reduced-motion` are non-negotiable (Awwwards scores dev quality); conversion elements (CTA, trust line) never sacrificed for spectacle. German UI copy only inside document mockups; chrome stays English.

## Build phases

- **Phase 1 (now):** hero theater + masthead + scan signature + paper grain + ::selection/print details on the landing.
- **Phase 2:** section choreography (folio numbers, drop cap, pull-quote treatment, before/after section upgraded to match hero fidelity), tool-side scan-line in LoadingView.
- **Phase 3 (needs founder assets/decisions):** real wordmark, OG image redesign, 404 page as a "misprint" easter egg, Awwwards submission collateral.
