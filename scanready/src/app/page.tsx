import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Btn, CARD, EYEBROW } from "@/components/ui";

export const metadata: Metadata = {
  title: "ScanReady: Win the German Recruiter's First Scan",
  description:
    "Turn your CV into a norm-correct German Lebenslauf and an authentic Anschreiben, grounded only in your real facts. Zero-retention, by design.",
  alternates: {
    canonical: "/",
    languages: { en: "/", de: "/de" },
  },
  openGraph: {
    title: "ScanReady: Win the German Recruiter's First Scan",
    description:
      "Norm-correct German Lebenslauf and authentic Anschreiben. Zero-retention, grounded only in your real facts.",
    type: "website",
    images: [{ url: "/og-scanready.svg", width: 1200, height: 630, alt: "ScanReady" }],
  },
};

// Inline lock SVG: reused in hero and trust band
function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Inline checkmark SVG for trust band
function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-accent flex-shrink-0"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Hero typesetting theater: tiny orchestration script (toggles .theater-playing on
// the stage element; all actual motion is CSS keyframes in globals.css). Deferred,
// inert until the stage scrolls into view. IntersectionObserver starts/pauses the
// loop; click/tap/keyboard replays from the start. No React state needed, this is
// decorative theater, not app logic, so a plain inline script keeps page.tsx a
// Server Component (metadata export requires it) without adding a new client file.
const TYPESETTING_THEATER_SCRIPT = `(function () {
  var stage = document.getElementById('typesetting-theater');
  if (!stage) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var HOLD_MS = 8500; // full sequence (~4.5s) + 4s hold before looping
  var timer = null;

  function play() {
    stage.classList.remove('theater-playing');
    // force reflow so re-adding the class restarts the CSS animations
    void stage.offsetWidth;
    stage.classList.add('theater-playing');
    if (timer) clearTimeout(timer);
    timer = setTimeout(play, HOLD_MS);
  }

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          play();
        } else {
          stop();
        }
      });
    },
    { threshold: 0.35 }
  );
  observer.observe(stage);

  function replay() {
    play();
  }
  stage.addEventListener('click', replay);
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      replay();
    }
  });
})();`;

// CTA link with consistent styling and focus/hover states
function CtaLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "accent";
  className?: string;
}) {
  return (
    <Btn as="a" href={href} variant={variant} size="lg" className={className}>
      {children}
    </Btn>
  );
}

// Section IDs for aria-labelledby
const SECTION_IDS = {
  hero: "section-hero-heading",
  pathways: "section-pathways-heading",
  howItWorks: "section-how-it-works-heading",
  trust: "section-trust-heading",
  founder: "section-founder-heading",
  proof: "section-proof-heading",
};

// Folio-style section number: broadsheet page-numbering voice joined to the
// section eyebrow label ("01 · PATHWAYS"). The digit is decorative sequencing
// (aria-hidden); the label text is what screen readers announce. Chrome copy
// stays English per the design system (German lives only inside document
// mockups).
function FolioEyebrow({ folio, label }: { folio: string; label: string }) {
  return (
    <p className={`${EYEBROW} folio-eyebrow justify-center`}>
      <span className="folio-number" aria-hidden="true">
        {folio}
      </span>
      <span>{label}</span>
    </p>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Navigation: broadsheet masthead, larger display-serif wordmark, double
          rule beneath (2px ink + 0.5px hairline, see .masthead-rule), mono dateline. */}
      <nav className="sticky top-0 z-50 bg-paper masthead-rule flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full h-16 flex items-center justify-between gap-4">
          <a
            href="/"
            className="font-serif text-xl sm:text-2xl font-semibold text-ink tracking-tight focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            ScanReady
          </a>
          <p
            className={`${EYEBROW} hidden sm:block flex-1 text-center`}
            aria-hidden="true"
          >
            Bewerbung · Deutschland
          </p>
          <div className="flex items-center gap-3">
            <a
              href="/de"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
            >
              DE
            </a>
            <Btn as="a" href="/app" variant="accent">
              Try it free
            </Btn>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Section 1: Hero ── */}
        <section
          className="bg-paper pt-24 pb-20 sm:pt-32 sm:pb-28 section-animate"
          aria-labelledby={SECTION_IDS.hero}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className={`${EYEBROW} mb-6`}>
              For internationals applying in Germany
            </p>

            <h1
              id={SECTION_IDS.hero}
              className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.15] mb-6"
            >
              {/* Headline: Win the German recruiter's first scan. */}
              Win the German recruiter&rsquo;s{" "}
              <span className="relative inline-block">first scan<span className="absolute bottom-0 left-0 right-0 border-b-2 border-ink/30" aria-hidden="true" /></span>.
            </h1>

            <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto mb-10">
              Turn your CV into a norm-correct German Lebenslauf and an
              Anschreiben that sounds like you, grounded only in your real
              facts, never invented. Bilingual output explains every Lebenslauf
              change so you trust what you send.
            </p>

            <CtaLink href="/app" variant="accent">Convert your CV – it&rsquo;s free</CtaLink>

            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
              <LockIcon />
              Nothing is stored. Processing is stateless and zero-retention.
            </p>
          </div>

          {/* Hero typesetting theater: decorative spectacle, never a substitute for
              the semantic content above. IntersectionObserver-driven loop (see
              TYPESETTING_THEATER_SCRIPT): scan sweep → lines re-typeset into the
              German sheet → date snaps to DIN mono → DIN annotation pins fade in.
              Click/tap/Enter/Space replays. Static, complete end-state under
              prefers-reduced-motion (CSS-only, see globals.css). */}
          <div className="max-w-3xl mx-auto px-6 mt-16 sm:mt-20">
            <div
              id="typesetting-theater"
              role="button"
              tabIndex={0}
              aria-label="Replay the conversion animation"
              className="theater-stage relative grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-4 rounded-xl"
            >
              {/* Left: source résumé card */}
              <div
                className="theater-source relative bg-card border border-hair rounded-lg px-5 py-6 shadow-sm"
                style={{ transform: "rotate(-1.2deg)" }}
                aria-hidden="true"
              >
                <div className="scan-sweep" />
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted mb-4">
                  RESUME.docx
                </p>
                <div className="space-y-2 font-sans">
                  <div className="h-2 w-3/4 rounded bg-faint" />
                  <div className="h-2 w-1/2 rounded bg-faint" />
                  <p className="theater-source-date font-mono text-xs text-brand-error mt-3">
                    Mar 2024 – Present
                  </p>
                  <div className="h-2 w-full rounded bg-faint mt-3" />
                  <div className="h-2 w-2/3 rounded bg-faint" />
                </div>
              </div>

              {/* Center arrow, hidden on mobile stack */}
              <div className="hidden sm:flex items-center justify-center text-muted" aria-hidden="true">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 8H26M26 8L19 1M26 8L19 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Right: destination Lebenslauf sheet */}
              <div className="doc-sheet relative px-5 py-6 text-left" aria-hidden="true">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-eyebrow mb-4">
                  Lebenslauf
                </p>
                <div className="space-y-2 font-serif-text">
                  <div className="theater-line h-2 w-3/4 rounded bg-faint" style={{ "--i": 0 } as React.CSSProperties} />
                  <div className="theater-line h-2 w-1/2 rounded bg-faint" style={{ "--i": 1 } as React.CSSProperties} />
                  <p className="theater-line font-mono text-xs text-accent mt-3" style={{ "--i": 2 } as React.CSSProperties}>
                    <span className="theater-date">03/2024 – heute</span>
                  </p>
                  <div className="theater-line h-2 w-full rounded bg-faint mt-3" style={{ "--i": 3 } as React.CSSProperties} />
                  <div className="theater-line h-2 w-2/3 rounded bg-faint" style={{ "--i": 4 } as React.CSSProperties} />
                </div>

                {/* DIN annotation pins with hairline leader lines */}
                <div className="theater-pin flex items-center gap-2 mt-5 pt-3 border-t border-hair" style={{ "--i": 0 } as React.CSSProperties}>
                  <span className="inline-block h-px w-4 bg-hair" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-eyebrow">
                    DIN 5008
                  </span>
                </div>
                <div className="theater-pin flex items-center gap-2 mt-2" style={{ "--i": 1 } as React.CSSProperties}>
                  <span className="inline-block h-px w-4 bg-hair" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-eyebrow">
                    Rückwärts chronologisch
                  </span>
                </div>
                <div className="theater-pin flex items-center gap-2 mt-2" style={{ "--i": 2 } as React.CSSProperties}>
                  <span className="inline-block h-px w-4 bg-hair" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-eyebrow">
                    Foto optional (AGG)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Orchestration for the hero theater: toggles .theater-playing on the stage
            node (IntersectionObserver start/pause; click/Enter/Space replay). Tiny,
            deferred, no-op under prefers-reduced-motion. All motion itself is CSS. */}
        <script
          defer
          dangerouslySetInnerHTML={{ __html: TYPESETTING_THEATER_SCRIPT }}
        />

        {/* ── Section 2: Two-column pathways ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.pathways}
        >
          <div className="max-w-4xl mx-auto px-6">
            <FolioEyebrow folio="01" label="Pathways" />
            <h2
              id={SECTION_IDS.pathways}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] text-center mt-3 mb-12"
            >
              Two documents. Both have to survive the scan.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* LEFT: Authentic voice */}
              <div className={`${CARD} px-6 py-8`}>
                <p className={`${EYEBROW} mb-4`}>
                  Authentic voice
                </p>
                <h3 className="text-3xl font-semibold text-ink mb-3 leading-snug">
                  Sounds like you, not a template.
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  We ask 3–5 questions about your actual motivations, specific
                  achievements, and what draws you to this role. Your answers
                  become the letter; we never invent an employer, title, date,
                  or skill.
                </p>

                {/* Authentic before/after mockup */}
                <div
                  className="bg-paper rounded-lg border border-hair p-4 h-40 overflow-hidden text-left"
                  role="img"
                  aria-label="Before and after: generic filler sentence replaced by grounded, specific language drawn from the applicant's own answers"
                >
                  <p className={`${EYEBROW} mb-2`}>
                    Before
                  </p>
                  <p
                    className="text-sm text-muted line-through italic mb-3"
                    aria-hidden="true"
                  >
                    &ldquo;I am a results-driven professional with strong
                    communication skills…&rdquo;
                  </p>
                  <p className={`${EYEBROW} mb-2`}>
                    After
                  </p>
                  <p className="text-sm text-ink">
                    &ldquo;Ich habe mein Vertriebsziel im dritten Quartal um 23&nbsp;%
                    übertroffen, indem ich einen neuen Onboarding-Prozess für
                    Enterprise-Kunden eingeführt habe.&rdquo;
                  </p>
                </div>
              </div>

              {/* RIGHT: German-norm format */}
              <div className={`${CARD} px-6 py-8`}>
                <p className={`${EYEBROW} mb-4`}>
                  German-norm format
                </p>
                <h3 className="text-3xl font-semibold text-ink mb-3 leading-snug">
                  The format gap, closed.
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Whether you&rsquo;re on a Chancenkarte or just never learned the
                  German format, the rules are the gap, not your experience.
                  Reverse-chronological DIN layout, correct date format,
                  personal-data block, photo guidance.
                </p>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  The rules aren&rsquo;t what most blogs claim, either, and the
                  numbers below explain why.
                </p>
                <p className="text-sm text-muted italic mb-6">
                  A native German speaker should review the final letter before
                  you send it.
                </p>

                {/* Mini Lebenslauf mockup with norm-gap pins */}
                <div
                  className="bg-paper rounded-lg border border-hair p-4 h-40 overflow-hidden text-left relative"
                  role="img"
                  aria-label="Mini Lebenslauf card showing correct German DIN layout with norm-gap annotation pins marking the photo guidance and date format fields"
                >
                  <p className="text-sm font-semibold text-ink mb-1">
                    Lebenslauf
                  </p>
                  <div className="space-y-1" aria-hidden="true">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded bg-faint" />
                      <div className="h-2 w-2 rounded-full bg-ink flex-shrink-0" />
                      <span className="text-sm text-muted">
                        Foto (optional)
                      </span>
                    </div>
                    <div className="h-2 w-32 rounded bg-faint" />
                    <div className="h-2 w-24 rounded bg-faint" />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 w-16 rounded bg-faint" />
                      <div className="h-2 w-2 rounded-full bg-ink flex-shrink-0" />
                      <span className="text-sm text-muted">
                        01.03.2022 (DIN)
                      </span>
                    </div>
                    <div className="h-2 w-28 rounded bg-faint" />
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial pull quote: the DACH recruiter stats, upgraded from a
                cramped card paragraph into a broadsheet pull quote. Hanging
                opening quote (progressive enhancement via hanging-punctuation,
                negative text-indent fallback), hairline rules, reading serif.
                No new claims: same two evidenced numbers already on the page. */}
            <figure className="max-w-2xl mx-auto mt-16 text-center">
              <div className="h-px w-16 bg-ink/30 mx-auto mb-8" aria-hidden="true" />
              <blockquote className="pull-quote font-serif-text text-2xl sm:text-3xl text-ink leading-snug">
                <span className="pull-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                61% of German recruiters prefer a two-page CV, and 64% call
                spelling errors a dealbreaker.
              </blockquote>
              <figcaption className="mt-5 text-sm text-muted">
                DACH recruiter studies, not imported one-page lore.
              </figcaption>
              <div className="h-px w-16 bg-ink/30 mx-auto mt-8" aria-hidden="true" />
            </figure>

            <div className="text-center mt-12">
              <CtaLink href="/app">Convert your CV – it&rsquo;s free</CtaLink>
            </div>
          </div>
        </section>

        {/* ── Section 3: How it works ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.howItWorks}
        >
          <div className="max-w-4xl mx-auto px-6">
            <FolioEyebrow folio="02" label="How it works" />
            <h2
              id={SECTION_IDS.howItWorks}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] text-center mt-3 mb-14"
            >
              Three steps. One honest output.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div>
                <p className={`${EYEBROW} mb-3`}>
                  Step 1
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Paste your CV
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Paste your résumé text: US, UK, or any English format. No
                  account, no upload, no storage.
                </p>
              </div>

              <div>
                <p className={`${EYEBROW} mb-3`}>
                  Step 2
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Get a Lebenslauf + English notes
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Your CV is restructured into a norm-correct German Lebenslauf.
                  English annotations explain every formatting change so you
                  trust what was reformatted and why.
                </p>
              </div>

              <div>
                <p className={`${EYEBROW} mb-3`}>
                  Step 3
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Answer 3–5 questions, get your Anschreiben
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Paste the job posting and answer a few questions about your
                  real motivations and experience. The letter streams live,
                  grounded only in your own facts.
                </p>
              </div>
            </div>

            <div className="text-center mt-14">
              <CtaLink href="/app">Start now – it takes 5 minutes</CtaLink>
            </div>
          </div>
        </section>

        {/* ── Section 4: Trust & privacy band ── */}
        <section
          className="bg-ink py-20 sm:py-24 section-animate"
          aria-labelledby={SECTION_IDS.trust}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="folio-eyebrow justify-center font-mono text-xs uppercase tracking-[0.18em] text-white/40 mb-5">
              <span className="folio-number" aria-hidden="true">
                03
              </span>
              <span>Trust</span>
            </p>

            <div
              className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white"
              aria-hidden="true"
            >
              <LockIcon className="h-5 w-5" />
            </div>

            <h2
              id={SECTION_IDS.trust}
              className="font-serif text-3xl font-semibold text-white leading-[1.2] mb-4"
            >
              Zero-retention, by design.
            </h2>
            <p className="text-base text-white/70 leading-relaxed max-w-2xl mx-auto mb-8">
              No account needed. Use ScanReady without one and nothing is
              saved: your CV text is sent to the AI, the output comes back,
              no database, no training on your data. What you paste here
              stays between you and your application.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <CheckIcon />
                No account needed, no storage without one
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon />
                Not used for AI training
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon />
                Grounded, never fabricated
              </span>
            </div>
          </div>
        </section>

        {/* ── Section 5: Founder's note ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.founder}
        >
          <div className="max-w-2xl mx-auto px-6">
            <div className="w-8 h-0.5 bg-ink mb-6" aria-hidden="true" />
            <FolioEyebrow folio="04" label="Founder's note" />

            <h2
              id={SECTION_IDS.founder}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] mt-3 mb-6"
            >
              Built by a German, for everyone applying here.
            </h2>

            <div className="text-base text-muted leading-relaxed space-y-4">
              <p className="drop-cap">
                I&rsquo;m German, born and raised, living in Hamburg. I know the
                Lebenslauf and Anschreiben conventions from the inside: what a
                recruiter here expects to see, and what quietly signals
                &ldquo;this person doesn&rsquo;t know the norms.&rdquo;
              </p>
              <p>
                I&rsquo;m also applying for jobs myself right now, so I test every
                change against my own real CV and my own live applications
                before it ships. When I tried existing tools to speed that up,
                they either invented experience I don&rsquo;t have or produced
                generic filler that sounded nothing like me. So I built this
                instead.
              </p>
              <p>
                ScanReady never invents facts. The German is native-quality
                because I&rsquo;m native. The voice is yours, built from your own
                answers to a few honest questions, not a template.
              </p>
            </div>

            <p className="mt-8 text-sm font-semibold text-ink">
              Kilian Hartmann
            </p>
          </div>
        </section>

        {/* ── Section 6: Proof strip + final CTA ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.proof}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p
              id={SECTION_IDS.proof}
              className={`${EYEBROW} folio-eyebrow justify-center mb-4`}
            >
              <span className="folio-number" aria-hidden="true">
                05
              </span>
              <span>What actually changes</span>
            </p>
            <h2 className="font-serif text-3xl font-semibold text-ink leading-[1.2] mb-12">
              Three mechanical fixes, every time.
            </h2>

            {/* Norm-transform grid: real, mechanical product behavior, not a testimonial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className={`${CARD} px-5 py-6`}>
                <p className={`${EYEBROW} mb-2`}>Before</p>
                <p className="text-sm text-muted italic line-through mb-3">
                  Mar 2021 – Present
                </p>
                <p className={`${EYEBROW} mb-2`}>After</p>
                <p className="text-sm text-ink font-mono mb-4">
                  03/2021 – heute
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  German date format, and &ldquo;heute&rdquo; instead of
                  &ldquo;Present.&rdquo;
                </p>
              </div>

              <div className={`${CARD} px-5 py-6`}>
                <p className={`${EYEBROW} mb-2`}>Before</p>
                <p className="text-sm text-muted italic line-through mb-3">
                  German: fluent, English: native
                </p>
                <p className={`${EYEBROW} mb-2`}>After</p>
                <p className="text-sm text-ink mb-4">
                  Deutsch: Verhandlungssicher · Englisch: Muttersprache
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  German recruiters expect German CV vocabulary, not &ldquo;fluent.&rdquo;
                </p>
              </div>

              <div className={`${CARD} px-5 py-6`}>
                <p className={`${EYEBROW} mb-2`}>Before</p>
                <p className="text-sm text-muted italic line-through mb-3">
                  Excel, SQL, Forecasting, Driver&rsquo;s license
                </p>
                <p className={`${EYEBROW} mb-2`}>After</p>
                <p className="text-sm text-ink mb-4">
                  IT-Kenntnisse: Excel, SQL · Fachkenntnisse: Forecasting ·
                  Sonstige Kenntnisse: Führerschein Klasse B
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  Skills grouped into the categories German recruiters scan for.
                </p>
              </div>
            </div>

            {/* Illustrative example: labeled honestly, not attributed to the founder's real CV.
                Upgraded to hero-theater fidelity (static, no animation needed here): the
                Before panel stays a deliberately "wrong" rotated sans card (same -1.2deg
                tilt as the hero source card); the After panel is a real .doc-sheet print
                surface with mono DIN annotation pins + hairline leader lines. */}
            <p className={`${EYEBROW} mt-10 mb-6`}>Illustrative example</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-4 mx-auto max-w-2xl text-left"
              role="img"
              aria-label="Illustrative before and after example: a generic English-format résumé section, deliberately mis-formatted, converted to a norm-correct German Lebenslauf with DIN annotation pins and an English norm-gap note"
            >
              {/* Before panel: deliberately "wrong" - sans, card surface, slight tilt */}
              <div
                className="proof-source bg-card border border-hair rounded-lg px-5 py-6 shadow-sm"
                aria-hidden="true"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted mb-3">
                  Original CV (English)
                </p>
                <p className="text-sm text-muted italic leading-relaxed font-sans">
                  &ldquo;Senior Product Manager | Jan 2021&ndash;Present | Drove
                  cross-functional alignment across engineering and design to
                  ship three core product features, increasing activation rate
                  by 18%.&rdquo;
                </p>
              </div>

              {/* Center arrow, hidden on mobile stack (matches hero theater) */}
              <div className="hidden sm:flex items-center justify-center text-muted" aria-hidden="true">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 8H26M26 8L19 1M26 8L19 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* After panel: real print surface, mono DIN pins with hairline leaders */}
              <div className="doc-sheet px-5 py-6" aria-hidden="true">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-eyebrow mb-3">
                  Lebenslauf Output (German)
                </p>
                <p className="text-sm text-ink leading-relaxed mb-4 font-serif-text">
                  Senior Product Manager | 01/2021 &ndash; heute
                  <br />
                  Führte die bereichsübergreifende Zusammenarbeit zwischen
                  Engineering und Design, um drei Kernproduktfunktionen
                  einzuführen. Aktivierungsrate um 18&nbsp;% gesteigert.
                </p>

                <div className="proof-pin mt-4 pt-3 border-t border-hair">
                  <span className="inline-block h-px w-4 bg-hair" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-eyebrow">
                    MM/JJJJ Datumsformat
                  </span>
                </div>
                <div className="proof-pin mt-2">
                  <span className="inline-block h-px w-4 bg-hair" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-eyebrow">
                    &ldquo;Present&rdquo; &rarr; &ldquo;heute&rdquo;
                  </span>
                </div>
              </div>
            </div>

            {/* Accessible equivalent of the norm note dropped from the visual panel above:
                same content, plain text, always announced regardless of aria-hidden siblings. */}
            <p className="mt-6 mx-auto max-w-2xl text-sm text-muted text-left">
              <span className="font-semibold text-ink">Norm note:</span> date
              reformatted to the German MM/YYYY convention, &ldquo;Present&rdquo;
              replaced with &ldquo;heute&rdquo;, percentage formatted with a
              non-breaking space before the symbol.
            </p>

            <p className="mt-8 text-sm text-muted max-w-xl mx-auto">
              No testimonials yet: the tool is new. Judge the output yourself.
              The first conversion is free.
            </p>

            <div className="mt-12">
              <CtaLink href="/app">Convert your CV, it&rsquo;s free</CtaLink>
              <p className="mt-3 text-sm text-muted">
                No account. No storage. Takes 5 minutes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-ink py-10">
        <div className="max-w-4xl mx-auto px-6">
          {/* Print folio line: mono, broadsheet page-foot convention */}
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
            ScanReady · Seite 1
          </p>
          <div className="flex items-center justify-between text-sm text-white/70">
            <p>ScanReady</p>
            <div className="flex items-center gap-4">
              <a className="hover:text-white transition-colors" href="/preise">
                Pricing
              </a>
              {/* §312k BGB: the cancellation path must be reachable from the site,
                  German statutory link label. */}
              <a className="hover:text-white transition-colors" href="/kuendigen" lang="de">
                Verträge hier kündigen
              </a>
              <p>© 2026</p>
              {/* Registration-mark corner ornament: decorative print detail */}
              <span className="reg-mark" aria-hidden="true" />
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll micro-motion: hydration-safe driver (no inline script, no SSR mismatch) */}
      <ScrollReveal />
    </>
  );
}
