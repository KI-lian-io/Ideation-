import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Btn, CARD, EYEBROW } from "@/components/ui";

export const metadata: Metadata = {
  title: "ScanReady: Bestehen Sie den ersten Blick",
  description:
    "Wandeln Sie Ihren Lebenslauf in einen normgerechten deutschen Lebenslauf um und erhalten Sie ein authentisches Anschreiben, ausschließlich auf Basis Ihrer echten Angaben. Ohne Konto werden keine Daten gespeichert.",
  alternates: {
    canonical: "/de",
    languages: { en: "/", de: "/de" },
  },
  openGraph: {
    title: "ScanReady: Bestehen Sie den ersten Blick",
    description:
      "Normgerechter deutscher Lebenslauf und authentisches Anschreiben, ausschließlich auf Basis Ihrer echten Angaben. Ohne Konto zustandslos.",
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

// Hero typesetting theater: identical orchestration script to the English landing (see
// src/app/page.tsx for the full rationale). Kept as an inline script so this page also
// stays a Server Component (metadata export requires it).
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
  hero: "section-hero-heading-de",
  pathways: "section-pathways-heading-de",
  howItWorks: "section-how-it-works-heading-de",
  trust: "section-trust-heading-de",
  founder: "section-founder-heading-de",
  proof: "section-proof-heading-de",
};

// Folio-style section number: same broadsheet page-numbering voice as the English
// landing, German labels.
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

export default function GermanHomePage() {
  return (
    <div lang="de">
      {/* Navigation: same broadsheet masthead as the English landing, EN link mirrors
          the DE link on that page. */}
      <nav className="sticky top-0 z-50 bg-paper masthead-rule flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full h-16 flex items-center justify-between gap-4">
          <a
            href="/de"
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
              href="/"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
            >
              EN
            </a>
            <Btn as="a" href="/app" variant="accent">
              Kostenlos testen
            </Btn>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Abschnitt 1: Hero ── */}
        <section
          className="bg-paper pt-24 pb-20 sm:pt-32 sm:pb-28 section-animate"
          aria-labelledby={SECTION_IDS.hero}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className={`${EYEBROW} mb-6`}>
              Für Internationals, die sich in Deutschland bewerben
            </p>

            <h1
              id={SECTION_IDS.hero}
              className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.15] mb-6"
            >
              Bestehen Sie den{" "}
              <span className="relative inline-block">ersten Blick<span className="absolute bottom-0 left-0 right-0 border-b-2 border-ink/30" aria-hidden="true" /></span>.
            </h1>

            <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto mb-10">
              Aus Ihrem Lebenslauf wird ein normgerechter deutscher Lebenslauf,
              dazu ein Anschreiben, das nach Ihnen klingt, nicht nach Vorlage.
              Ausschließlich auf Basis Ihrer echten Angaben, nie erfunden.
              Zweisprachige Erklärungen zeigen Ihnen jede Änderung am
              Lebenslauf, damit Sie dem Ergebnis vertrauen können.
            </p>

            <CtaLink href="/app" variant="accent">Lebenslauf umwandeln – kostenlos</CtaLink>

            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
              <LockIcon />
              Ohne Konto wird nichts gespeichert: zustandslos, per Design.
            </p>
          </div>

          {/* Hero typesetting theater: identisch zur englischen Landingpage, siehe
              TYPESETTING_THEATER_SCRIPT oben. Dekoratives Schauspiel, niemals Ersatz
              für den semantischen Inhalt darüber. */}
          <div className="max-w-3xl mx-auto px-6 mt-16 sm:mt-20">
            <div
              id="typesetting-theater"
              role="button"
              tabIndex={0}
              aria-label="Konvertierungs-Animation erneut abspielen"
              className="theater-stage relative grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-4 rounded-xl"
            >
              {/* Links: Quelle, ausländischer Lebenslauf */}
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

              {/* Mitte: Pfeil, auf Mobile ausgeblendet */}
              <div className="hidden sm:flex items-center justify-center text-muted" aria-hidden="true">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 8H26M26 8L19 1M26 8L19 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Rechts: Ziel-Lebenslauf, DIN-Format */}
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

                {/* DIN-Annotationspins mit Hairline-Leitlinien */}
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

        {/* Orchestrierung für das Hero-Theater: identisch zur englischen Seite. */}
        <script
          defer
          dangerouslySetInnerHTML={{ __html: TYPESETTING_THEATER_SCRIPT }}
        />

        {/* ── Abschnitt 2: Zwei Wege ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.pathways}
        >
          <div className="max-w-4xl mx-auto px-6">
            <FolioEyebrow folio="01" label="Zwei Dokumente" />
            <h2
              id={SECTION_IDS.pathways}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] text-center mt-3 mb-12"
            >
              Zwei Dokumente. Beide müssen den Blick überstehen.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* LINKS: Authentische Stimme */}
              <div className={`${CARD} px-6 py-8`}>
                <p className={`${EYEBROW} mb-4`}>
                  Authentische Stimme
                </p>
                <h3 className="text-3xl font-semibold text-ink mb-3 leading-snug">
                  Klingt nach Ihnen, nicht nach Vorlage.
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  Wir stellen Ihnen 3 bis 5 Fragen zu Ihrer echten Motivation,
                  konkreten Erfolgen und dem, was Sie an dieser Stelle reizt.
                  Ihre Antworten werden zum Anschreiben. Wir erfinden nie einen
                  Arbeitgeber, Titel, ein Datum oder eine Fähigkeit.
                </p>

                {/* Vorher/Nachher-Mockup */}
                <div
                  className="bg-paper rounded-lg border border-hair p-4 h-40 overflow-hidden text-left"
                  role="img"
                  aria-label="Vorher und nachher: generischer Füllsatz ersetzt durch konkrete, auf den eigenen Angaben basierende Sprache"
                >
                  <p className={`${EYEBROW} mb-2`}>
                    Vorher
                  </p>
                  <p
                    className="text-sm text-muted line-through italic mb-3"
                    aria-hidden="true"
                  >
                    &ldquo;I am a results-driven professional with strong
                    communication skills…&rdquo;
                  </p>
                  <p className={`${EYEBROW} mb-2`}>
                    Nachher
                  </p>
                  <p className="text-sm text-ink">
                    &ldquo;Ich habe mein Vertriebsziel im dritten Quartal um 23&nbsp;%
                    übertroffen, indem ich einen neuen Onboarding-Prozess für
                    Enterprise-Kunden eingeführt habe.&rdquo;
                  </p>
                </div>
              </div>

              {/* RECHTS: Deutsches Format */}
              <div className={`${CARD} px-6 py-8`}>
                <p className={`${EYEBROW} mb-4`}>
                  Deutsches Format
                </p>
                <h3 className="text-3xl font-semibold text-ink mb-3 leading-snug">
                  Die Formatlücke, geschlossen.
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Ob mit Chancenkarte eingereist oder einfach nie mit dem
                  deutschen Format in Berührung gekommen: Die Regeln sind die
                  Lücke, nicht Ihre Erfahrung. Rückwärts chronologisches
                  DIN-Layout, korrektes Datumsformat, Block für persönliche
                  Daten, Foto-Hinweis.
                </p>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  Die Regeln sind auch nicht das, was die meisten Ratgeber
                  behaupten. Die Zahlen unten zeigen, warum.
                </p>
                <p className="text-sm text-muted italic mb-6">
                  Lassen Sie das fertige Anschreiben von einer Muttersprachlerin
                  oder einem Muttersprachler gegenlesen.
                </p>

                {/* Mini-Lebenslauf mit Norm-Pins */}
                <div
                  className="bg-paper rounded-lg border border-hair p-4 h-40 overflow-hidden text-left relative"
                  role="img"
                  aria-label="Mini-Lebenslauf-Karte im korrekten deutschen DIN-Layout mit Annotationspins für Foto-Hinweis und Datumsformat"
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

            {/* Editorial-Zitat: die DACH-Recruiter-Zahlen als Broadsheet-Pull-Quote. */}
            <figure className="max-w-2xl mx-auto mt-16 text-center">
              <div className="h-px w-16 bg-ink/30 mx-auto mb-8" aria-hidden="true" />
              <blockquote className="pull-quote font-serif-text text-2xl sm:text-3xl text-ink leading-snug">
                <span className="pull-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                Deutsche Recruiter schauen im Schnitt rund 43 Sekunden auf eine
                Bewerbung, nicht 8. 61&nbsp;% bevorzugen zwei Seiten, 64&nbsp;%
                nennen Rechtschreibfehler ein Ausschlusskriterium.
              </blockquote>
              <figcaption className="mt-5 text-sm text-muted">
                StepStone/MindTake Eyetracking-Studie, keine importierte
                Ein-Seiten-Faustregel aus den USA.
              </figcaption>
              <div className="h-px w-16 bg-ink/30 mx-auto mt-8" aria-hidden="true" />
            </figure>

            <div className="text-center mt-12">
              <CtaLink href="/app">Lebenslauf umwandeln – kostenlos</CtaLink>
            </div>
          </div>
        </section>

        {/* ── Abschnitt 3: So funktioniert's ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.howItWorks}
        >
          <div className="max-w-4xl mx-auto px-6">
            <FolioEyebrow folio="02" label="So funktioniert's" />
            <h2
              id={SECTION_IDS.howItWorks}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] text-center mt-3 mb-14"
            >
              Drei Schritte. Ein ehrliches Ergebnis.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div>
                <p className={`${EYEBROW} mb-3`}>
                  Schritt 1
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Lebenslauf einfügen
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Fügen Sie Ihren Lebenslauf als Text ein, egal ob US-, UK-
                  oder anderes englischsprachiges Format. Kein Konto, kein
                  Upload nötig, keine Speicherung.
                </p>
              </div>

              <div>
                <p className={`${EYEBROW} mb-3`}>
                  Schritt 2
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Lebenslauf + Erklärungen erhalten
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Ihr Lebenslauf wird in einen normgerechten deutschen
                  Lebenslauf umgewandelt. Zweisprachige Anmerkungen erklären
                  jede Formatänderung, damit Sie nachvollziehen können, was
                  angepasst wurde und warum.
                </p>
              </div>

              <div>
                <p className={`${EYEBROW} mb-3`}>
                  Schritt 3
                </p>
                <h3 className="text-base font-semibold text-ink mb-2">
                  Fragen beantworten, Anschreiben erhalten
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  Fügen Sie die Stellenanzeige ein und beantworten Sie ein paar
                  Fragen zu Ihrer echten Motivation und Erfahrung. Das
                  Anschreiben entsteht live, ausschließlich auf Basis Ihrer
                  eigenen Angaben.
                </p>
              </div>
            </div>

            <div className="text-center mt-14">
              <CtaLink href="/app">Jetzt starten – dauert 5 Minuten</CtaLink>
            </div>
          </div>
        </section>

        {/* ── Abschnitt 4: Vertrauen & Datenschutz ── */}
        <section
          className="bg-ink py-20 sm:py-24 section-animate"
          aria-labelledby={SECTION_IDS.trust}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="folio-eyebrow justify-center font-mono text-xs uppercase tracking-[0.18em] text-white/40 mb-5">
              <span className="folio-number" aria-hidden="true">
                03
              </span>
              <span>Vertrauen</span>
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
              Zustandslos, per Design.
            </h2>
            <p className="text-base text-white/70 leading-relaxed max-w-2xl mx-auto mb-8">
              Ohne Konto werden Ihre Daten nicht gespeichert: keine Datenbank,
              kein Training, zustandslos. Ihr Lebenslauf-Text wird an die KI
              gesendet, das Ergebnis kommt zurück, und ohne Konto bleibt
              nichts liegen. Was Sie hier einfügen, bleibt zwischen Ihnen und
              Ihrer Bewerbung.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <CheckIcon />
                Ohne Konto keine Speicherung
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon />
                Kein KI-Training mit Ihren Daten
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon />
                Belegt, nie erfunden
              </span>
            </div>
          </div>
        </section>

        {/* ── Abschnitt 5: Vom Gründer ── */}
        <section
          className="bg-paper py-20 sm:py-28 section-animate"
          aria-labelledby={SECTION_IDS.founder}
        >
          <div className="max-w-2xl mx-auto px-6">
            <div className="w-8 h-0.5 bg-ink mb-6" aria-hidden="true" />
            <FolioEyebrow folio="04" label="Vom Gründer" />

            <h2
              id={SECTION_IDS.founder}
              className="font-serif text-3xl font-semibold text-ink leading-[1.2] mt-3 mb-6"
            >
              Gebaut von einem Hamburger, für alle, die sich hier bewerben.
            </h2>

            <div className="text-base text-muted leading-relaxed space-y-4">
              <p className="drop-cap">
                Ich bin gebürtiger Hamburger und kenne die Konventionen von
                Lebenslauf und Anschreiben von innen: was ein Recruiter hier
                erwartet zu sehen, und was still signalisiert, &ldquo;diese
                Person kennt die Normen nicht.&rdquo;
              </p>
              <p>
                Ich bewerbe mich gerade selbst, deshalb teste ich jede
                Änderung an meinem eigenen echten Lebenslauf und meinen
                laufenden Bewerbungen, bevor sie live geht. Als ich bestehende
                Tools ausprobiert habe, um das zu beschleunigen, haben sie
                entweder Erfahrung erfunden, die ich nicht habe, oder
                generischen Füllsatz produziert, der nach niemandem klang. Also
                habe ich dieses Tool stattdessen gebaut.
              </p>
              <p>
                ScanReady erfindet keine Fakten. Das Deutsch ist
                muttersprachlich, weil ich Muttersprachler bin. Die Stimme
                bleibt Ihre, aufgebaut aus Ihren eigenen Antworten auf ein paar
                ehrliche Fragen, nicht aus einer Vorlage.
              </p>
            </div>

            <p className="mt-8 text-sm font-semibold text-ink">
              Kilian Hartmann
            </p>
          </div>
        </section>

        {/* ── Abschnitt 6: Beweis + finaler CTA ── */}
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
              <span>Was sich wirklich ändert</span>
            </p>
            <h2 className="font-serif text-3xl font-semibold text-ink leading-[1.2] mb-12">
              Drei mechanische Korrekturen, jedes Mal.
            </h2>

            {/* Norm-Transform-Raster: echtes, mechanisches Produktverhalten, kein Testimonial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className={`${CARD} px-5 py-6`}>
                <p className={`${EYEBROW} mb-2`}>Vorher</p>
                <p className="text-sm text-muted italic line-through mb-3">
                  Mar 2021 – Present
                </p>
                <p className={`${EYEBROW} mb-2`}>Nachher</p>
                <p className="text-sm text-ink font-mono mb-4">
                  03/2021 – heute
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  Deutsches Datumsformat, und &ldquo;heute&rdquo; statt
                  &ldquo;Present.&rdquo;
                </p>
              </div>

              <div className={`${CARD} px-5 py-6`}>
                <p className={`${EYEBROW} mb-2`}>Vorher</p>
                <p className="text-sm text-muted italic line-through mb-3">
                  German: fluent, English: native
                </p>
                <p className={`${EYEBROW} mb-2`}>Nachher</p>
                <p className="text-sm text-ink mb-4">
                  Deutsch: Verhandlungssicher · Englisch: Muttersprache
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  Deutsche Recruiter erwarten deutsches Lebenslauf-Vokabular,
                  nicht &ldquo;fluent.&rdquo;
                </p>
              </div>

              <div className={`${CARD} px-5 py-6`}>
                <p className={`${EYEBROW} mb-2`}>Vorher</p>
                <p className="text-sm text-muted italic line-through mb-3">
                  Excel, SQL, Forecasting, Driver&rsquo;s license
                </p>
                <p className={`${EYEBROW} mb-2`}>Nachher</p>
                <p className="text-sm text-ink mb-4">
                  IT-Kenntnisse: Excel, SQL · Fachkenntnisse: Forecasting ·
                  Sonstige Kenntnisse: Führerschein Klasse B
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  Fähigkeiten gruppiert in die Kategorien, nach denen deutsche
                  Recruiter scannen.
                </p>
              </div>
            </div>

            {/* Beispielhafte Darstellung: ehrlich gekennzeichnet, nicht dem echten
                Lebenslauf des Gründers zugeschrieben. */}
            <p className={`${EYEBROW} mt-10 mb-6`}>Beispielhafte Darstellung</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-4 mx-auto max-w-2xl text-left"
              role="img"
              aria-label="Beispielhaftes Vorher-Nachher: ein generischer englischsprachiger Lebenslaufabschnitt, absichtlich falsch formatiert, umgewandelt in einen normgerechten deutschen Lebenslauf mit DIN-Annotationspins und einer Norm-Erklärung"
            >
              {/* Vorher-Panel: absichtlich "falsch" formatiert */}
              <div
                className="proof-source bg-card border border-hair rounded-lg px-5 py-6 shadow-sm"
                aria-hidden="true"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted mb-3">
                  Original-Lebenslauf (Englisch)
                </p>
                <p className="text-sm text-muted italic leading-relaxed font-sans">
                  &ldquo;Senior Product Manager | Jan 2021&ndash;Present | Drove
                  cross-functional alignment across engineering and design to
                  ship three core product features, increasing activation rate
                  by 18%.&rdquo;
                </p>
              </div>

              {/* Mitte: Pfeil, auf Mobile ausgeblendet */}
              <div className="hidden sm:flex items-center justify-center text-muted" aria-hidden="true">
                <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 8H26M26 8L19 1M26 8L19 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Nachher-Panel: echte Druck-Oberfläche mit DIN-Pins */}
              <div className="doc-sheet px-5 py-6" aria-hidden="true">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-eyebrow mb-3">
                  Lebenslauf-Ergebnis (Deutsch)
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

            {/* Barrierefreies Äquivalent zur Norm-Anmerkung */}
            <p className="mt-6 mx-auto max-w-2xl text-sm text-muted text-left">
              <span className="font-semibold text-ink">Norm-Hinweis:</span>{" "}
              Datum auf die deutsche Konvention MM/JJJJ umgestellt,
              &ldquo;Present&rdquo; durch &ldquo;heute&rdquo; ersetzt,
              Prozentzahl mit geschütztem Leerzeichen vor dem Symbol
              formatiert.
            </p>

            <p className="mt-8 text-sm text-muted max-w-xl mx-auto">
              Noch keine Erfahrungsberichte: das Tool ist neu. Beurteilen Sie
              das Ergebnis selbst. Die erste Umwandlung ist kostenlos.
            </p>

            <div className="mt-12">
              <CtaLink href="/app">Lebenslauf umwandeln, kostenlos</CtaLink>
              <p className="mt-3 text-sm text-muted">
                Kein Konto. Keine Speicherung. Dauert 5 Minuten.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-ink py-10">
        <div className="max-w-4xl mx-auto px-6">
          {/* Folio-Fußzeile: mono, Broadsheet-Konvention */}
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
            ScanReady · Seite 1
          </p>
          <div className="flex items-center justify-between text-sm text-white/70">
            <p>ScanReady</p>
            <div className="flex items-center gap-4">
              <a className="hover:text-white transition-colors" href="/preise">
                Preise
              </a>
              {/* §312k BGB: gesetzliche Beschriftung des Kündigungspfads */}
              <a className="hover:text-white transition-colors" href="/kuendigen">
                Verträge hier kündigen
              </a>
              <p>© 2026</p>
              {/* Registrierungsmarke: dekoratives Druckdetail */}
              <span className="reg-mark" aria-hidden="true" />
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll-Mikrobewegung: hydration-sicherer Treiber */}
      <ScrollReveal />
    </div>
  );
}
