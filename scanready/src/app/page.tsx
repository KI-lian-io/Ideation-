import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "ScanReady — Win the 8-Second German Recruiter Scan",
  description:
    "Turn your CV into a norm-correct German Lebenslauf and an authentic Anschreiben, grounded only in your real facts. Zero-retention, by design.",
  openGraph: {
    title: "ScanReady — Win the 8-Second German Recruiter Scan",
    description:
      "Norm-correct German Lebenslauf and authentic Anschreiben. Zero-retention, grounded only in your real facts.",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
};

// Inline lock SVG — reused in hero and trust band
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
      className="h-4 w-4 text-ink flex-shrink-0"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// CTA link with consistent styling and focus/hover states
function CtaLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-block rounded-lg bg-ink px-8 py-3 text-sm font-semibold text-white active:scale-[0.97] transition-[transform,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 ${className}`}
    >
      {children}
    </a>
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

export default function HomePage() {
  return (
    <>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-paper border-b border-hair h-14 flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full flex items-center justify-between">
          <a
            href="/"
            className="text-sm font-semibold text-ink tracking-tight focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            ScanReady
            <span className="text-eyebrow font-mono text-sm ml-1 tracking-normal">
              DE
            </span>
          </a>
          <a
            href="/app"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white active:scale-[0.97] transition-[transform,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            Try it free
          </a>
        </div>
      </nav>

      <main>
        {/* ── Section 1: Hero ── */}
        <section
          className="bg-paper pt-24 pb-20 sm:pt-32 sm:pb-28 section-animate"
          aria-labelledby={SECTION_IDS.hero}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-6">
              For internationals applying in Germany
            </p>

            <h1
              id={SECTION_IDS.hero}
              className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.15] mb-6"
            >
              {/* Headline: Win the 8-second German recruiter scan. */}
              Win the{" "}
              <span className="relative inline-block">8-second<span className="absolute bottom-0 left-0 right-0 border-b-2 border-ink/30" aria-hidden="true" /></span>{" "}
              German recruiter scan.
            </h1>

            <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto mb-10">
              Turn your CV into a norm-correct German Lebenslauf and an
              Anschreiben that sounds like you — grounded only in your real
              facts, never invented. Bilingual output explains every Lebenslauf
              change so you trust what you send.
            </p>

            <CtaLink href="/app">Convert your CV — it&rsquo;s free</CtaLink>

            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
              <LockIcon />
              Nothing is stored. Processing is stateless and zero-retention.
            </p>
          </div>
        </section>

        {/* ── Section 2: Two-column pathways ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.pathways}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h2
              id={SECTION_IDS.pathways}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] text-center mb-12"
            >
              Two documents. Both have to survive the scan.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* LEFT: Authentic voice */}
              <div className="rounded-[14px] border border-hair bg-card px-6 py-8">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-4">
                  Authentic voice
                </p>
                <h3 className="text-3xl font-semibold text-ink mb-3 leading-snug">
                  Sounds like you — not a template.
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  We ask 3–5 questions about your actual motivations, specific
                  achievements, and what draws you to this role. Your answers
                  become the letter — we never invent an employer, title, date,
                  or skill.
                </p>

                {/* Authentic before/after mockup */}
                <div
                  className="bg-paper rounded-lg border border-hair p-4 h-40 overflow-hidden text-left"
                  role="img"
                  aria-label="Before and after: generic filler sentence replaced by grounded, specific language drawn from the applicant's own answers"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-2">
                    Before
                  </p>
                  <p
                    className="text-sm text-muted line-through italic mb-3"
                    aria-hidden="true"
                  >
                    &ldquo;I am a results-driven professional with strong
                    communication skills…&rdquo;
                  </p>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-2">
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
              <div className="rounded-[14px] border border-hair bg-card px-6 py-8">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-4">
                  German-norm format
                </p>
                <h3 className="text-3xl font-semibold text-ink mb-3 leading-snug">
                  The format gap, closed.
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Whether you&rsquo;re on a Chancenkarte or just never learned the
                  German format — the rules are the gap, not your experience.
                  Reverse-chronological DIN layout, correct date format,
                  personal-data block, photo guidance.
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

            <div className="text-center mt-12">
              <CtaLink href="/app">Convert your CV — it&rsquo;s free</CtaLink>
            </div>
          </div>
        </section>

        {/* ── Section 3: How it works ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.howItWorks}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h2
              id={SECTION_IDS.howItWorks}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] text-center mb-14"
            >
              Three steps. One honest output.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-3">
                  Step 1
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Paste your CV
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Paste your résumé text — US, UK, or any English format. No
                  account, no upload, no storage.
                </p>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-3">
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
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-3">
                  Step 3
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Answer 3–5 questions, get your Anschreiben
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Paste the job posting and answer a few questions about your
                  real motivations and experience. The letter streams live —
                  grounded only in your own facts.
                </p>
              </div>
            </div>

            <div className="text-center mt-14">
              <CtaLink href="/app">Start — it takes 5 minutes</CtaLink>
            </div>
          </div>
        </section>

        {/* ── Section 4: Trust & privacy band ── */}
        <section
          className="bg-paper py-16 sm:py-20 section-animate"
          aria-labelledby={SECTION_IDS.trust}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div
              className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"
              aria-hidden="true"
            >
              <LockIcon className="h-5 w-5" />
            </div>

            <h2
              id={SECTION_IDS.trust}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] mb-4"
            >
              Zero-retention, by design.
            </h2>
            <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto mb-8">
              Your CV text is sent to the AI, the output comes back, and nothing
              is saved. No database. No account. No training on your data. What
              you paste here stays between you and your application.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-muted">
              <span className="flex items-center gap-2">
                <CheckIcon />
                No storage, no account
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon />
                Not used for AI training
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon />
                Grounded — never fabricated
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

            <h2
              id={SECTION_IDS.founder}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] mb-6"
            >
              Built by someone who needed it.
            </h2>

            <div className="text-base text-muted leading-relaxed space-y-4">
              <p>
                I&rsquo;m an expat applying for jobs in Germany. When I tried to
                convert my CV to a Lebenslauf, every tool either invented
                experience I don&rsquo;t have or produced generic filler that sounded
                nothing like me. So I built this.
              </p>
              <p>
                ScanReady is my dogfooded tool — I&rsquo;m using it on my own live
                applications. The output is grounded strictly in real facts. The
                voice comes from your answers to a few honest questions, not a
                template.
              </p>
            </div>

            <p className="mt-8 text-sm font-semibold text-ink">
              — Kilian Hartmann
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
              className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-4"
            >
              Real output — the founder&rsquo;s own application
            </p>

            {/* Full before/after founder mockup */}
            {/* REPLACE WITH REAL CONTENT when founder's real CV excerpt is available */}
            <div
              className="rounded-[14px] border border-hair bg-card overflow-hidden mx-auto max-w-2xl text-left"
              role="img"
              aria-label="Before and after comparison: original English-format résumé section on the left, converted to a norm-correct German Lebenslauf on the right, with English norm-gap annotation notes visible below the German output"
            >
              {/* Before panel */}
              <div className="border-b border-hair px-6 py-5">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-3">
                  Original CV (English)
                </p>
                <p className="text-sm text-muted italic leading-relaxed">
                  {/* REPLACE WITH REAL CONTENT: founder's real résumé excerpt */}
                  &ldquo;Senior Product Manager | Jan 2021–Present | Drove
                  cross-functional alignment across engineering and design to
                  ship three core product features, increasing activation rate
                  by 18%.&rdquo;
                </p>
              </div>

              {/* After panel */}
              <div className="px-6 py-5">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-eyebrow mb-3">
                  Lebenslauf Output (German)
                </p>
                <p className="text-sm text-ink leading-relaxed mb-3">
                  {/* REPLACE WITH REAL CONTENT: real Lebenslauf excerpt generated by the tool */}
                  Senior Product Manager | Jan. 2021 – heute
                  <br />
                  Führte die bereichsübergreifende Zusammenarbeit zwischen
                  Engineering und Design, um drei Kernproduktfunktionen
                  einzuführen — Aktivierungsrate um 18&nbsp;% gesteigert.
                </p>
                <div className="rounded-md bg-paper border border-hair px-3 py-2">
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-ink">
                      Norm note:
                    </span>{" "}
                    Date reformatted to DIN standard (Jan. 2021); &ldquo;Present&rdquo;
                    replaced with &ldquo;heute&rdquo; (German norm); percentage formatted
                    with non-breaking space before symbol.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <CtaLink href="/app">Convert your CV — it&rsquo;s free</CtaLink>
              <p className="mt-3 text-sm text-muted">
                No account. No storage. Takes 5 minutes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-paper border-t border-hair py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-sm text-muted">
          <p>ScanReady</p>
          <p>© 2026</p>
        </div>
      </footer>

      {/* Scroll micro-motion — hydration-safe driver (no inline script, no SSR mismatch) */}
      <ScrollReveal />
    </>
  );
}
