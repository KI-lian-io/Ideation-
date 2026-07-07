import type { Metadata } from "next";
import { Btn, CARD, EYEBROW } from "@/components/ui";
import {
  HUMANIZER_PRICE_CENTS,
  PAKET_PRICE_CENTS,
  PASS_PRICE_CENTS,
} from "@/lib/humanizer";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = {
  title: "Preise: ScanReady",
  description:
    "Kostenlos umwandeln, oder einmalig für Feinschliff, druckfertigen Export oder die ganze Bewerbungsphase zahlen. Kein Abo, keine Falle: der Preis steht dran.",
  alternates: {
    canonical: "/preise",
  },
};

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

// Inline checkmark used inside pricing cards for included-feature lists.
// `muted` renders it in the same grey as the "Geplant" card's text, so the
// not-yet-buyable Plus tier never borrows the accent green.
function CheckIcon({ muted = false }: { muted?: boolean } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${muted ? "text-muted" : "text-accent"} flex-shrink-0 mt-0.5`}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Terracotta cross used only in the "before" column of the anti-Abofalle
// comparison, per the before/after rule: the warning tone stays confined to
// the generic "Andere CV-Dienste" side and never touches ScanReady's own copy.
function CrossIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="h-4 w-4 text-brand-error flex-shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Every displayed price is formatted from the same cents constants Stripe
// checkout reads (src/lib/humanizer.ts), so this page cannot silently drift
// from what is actually charged.
function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function PreisePage() {
  return (
    <div lang="de">
      {/* Masthead: gleiche Broadsheet-Navigation wie die Landingpages. */}
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
          <Btn as="a" href="/app" variant="accent">
            Kostenlos testen
          </Btn>
        </div>
      </nav>

      <main>
        {/* ── Kopf ── */}
        <section className="bg-paper pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <FolioEyebrow folio="01" label="Preise" />
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.15] mt-4 mb-6">
              Bezahlen Sie die Bewerbungsphase. Nicht jede Bewerbung.
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto">
              Vier Bausteine, alle Preise inkl. MwSt., keine versteckten
              Verlängerungen. Was Sie nicht kaufen, bleibt trotzdem
              vollständig.
            </p>
          </div>
        </section>

        {/* ── Kostenlos-Manifest ── */}
        <section className="bg-card border-y border-hair py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            <div>
              <FolioEyebrow folio="00" label="Kostenlos" />
              <blockquote className="pull-quote font-serif-text text-2xl sm:text-3xl text-ink leading-snug mt-5">
                <span className="pull-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                Kostenlos heißt vollständig. Wir begrenzen, wie viel wir für
                Sie speichern, nie wie gut Ihr Dokument ist.
              </blockquote>
            </div>
            <ul className="space-y-3 text-sm text-ink">
              <li className="flex items-start gap-2">
                <CheckIcon />
                <span>
                  Vollständiger Lebenslauf und vollständiges Anschreiben,
                  jede Norm-Notiz
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon />
                <span>
                  Text kopieren und als .txt exportieren, ohne Wasserzeichen
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon />
                <span>Ohne Konto nutzbar, zero-retention</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon />
                <span>Mit Konto: 1 gespeicherte Bewerbung, für immer</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Die Leiter: vier Preiskarten ── */}
        <section className="bg-paper py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <FolioEyebrow folio="02" label="Die Leiter" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.15] mt-3 mb-10 max-w-2xl">
              Vier Stufen. Nur eine davon ist ein Abo, und es sagt es laut.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {/* Humanizer+ */}
              <div className={`${CARD} px-6 py-7 flex flex-col`}>
                <p className={`${EYEBROW} mb-3`}>Feinschliff</p>
                <h3 className="text-xl font-semibold text-ink mb-1 leading-snug">
                  Humanizer+
                </h3>
                <p className="text-sm text-muted mb-5">
                  Ein Feinschliff für das fertige Anschreiben: Register,
                  Ton, Präzision.
                </p>
                <p className="mt-auto text-2xl font-serif font-semibold text-ink">
                  {formatEuroCents(HUMANIZER_PRICE_CENTS)}{" "}
                  <span className="text-xs font-sans font-normal text-muted">
                    einmalig
                  </span>
                </p>
                <Btn as="a" href="/app" variant="secondary" className="mt-4 text-center">
                  Feinschliff kaufen
                </Btn>
                <ul className="mt-5 pt-4 border-t border-hair space-y-2 text-xs text-ink">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>1 Anschreiben-Feinschliff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Ohne Konto möglich</span>
                  </li>
                </ul>
              </div>

              {/* Bewerbungspaket */}
              <div className={`${CARD} px-6 py-7 flex flex-col`}>
                <p className={`${EYEBROW} mb-3`}>Komplettpaket</p>
                <h3 className="text-xl font-semibold text-ink mb-1 leading-snug">
                  Bewerbungspaket
                </h3>
                <p className="text-sm text-muted mb-5">
                  Eine Bewerbung, fertig zum Versand: PDF plus ein
                  Feinschliff.
                </p>
                <p className="mt-auto text-2xl font-serif font-semibold text-ink">
                  {formatEuroCents(PAKET_PRICE_CENTS)}{" "}
                  <span className="text-xs font-sans font-normal text-muted">
                    einmalig
                  </span>
                </p>
                <Btn as="a" href="/app" variant="secondary" className="mt-4 text-center">
                  Paket kaufen
                </Btn>
                <ul className="mt-5 pt-4 border-t border-hair space-y-2 text-xs text-ink">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>PDF-Export, DIN 5008</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>1 Feinschliff inklusive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Für genau 1 Bewerbung</span>
                  </li>
                </ul>
              </div>

              {/* Bewerbungsphase-Pass, featured */}
              <div
                className={`${CARD} relative px-6 py-7 flex flex-col border-2 border-accent shadow-[0_0_0_1px_rgba(10,125,99,0.12),0_20px_45px_-20px_rgba(10,125,99,0.55)]`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className={EYEBROW}>Bewerbungsphase-Pass</p>
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-wide bg-accent text-white rounded-full px-2.5 py-0.5">
                    Empfohlen
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-ink mb-1 leading-snug">
                  Bewerbungsphase-Pass
                </h3>
                <p className="text-sm text-muted mb-5">
                  Die ganze Bewerbungsphase: unbegrenzte Pakete, solange er
                  läuft.
                </p>
                <p className="mt-auto text-2xl font-serif font-semibold text-ink">
                  {formatEuroCents(PASS_PRICE_CENTS)}{" "}
                  <span className="text-xs font-sans font-normal text-muted">
                    einmalig &middot; 30 Tage
                  </span>
                </p>
                <Btn as="a" href="/app" variant="accent" className="mt-4 text-center">
                  Pass kaufen
                </Btn>
                <ul className="mt-5 pt-4 border-t border-hair space-y-2 text-xs text-ink">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Unbegrenzte Bewerbungspakete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>PDF und Feinschliff inklusive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Speicher für 25 Bewerbungen</span>
                  </li>
                  <li className="flex items-start gap-2 text-accent-deep font-medium">
                    <CheckIcon />
                    <span>Endet automatisch. Keine Kündigung nötig.</span>
                  </li>
                </ul>
                <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted bg-paper border border-hair rounded-md px-2.5 py-2">
                  Bei 10 Bewerbungen: 1,50&nbsp;€ pro Bewerbung
                </p>
              </div>

              {/* ScanReady Plus, geplant, nicht käuflich */}
              <div className={`${CARD} relative px-6 py-7 flex flex-col bg-paper`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className={EYEBROW}>ScanReady Plus</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted bg-card border border-hair rounded-full px-2.5 py-0.5">
                    Geplant
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-ink mb-1 leading-snug">
                  ScanReady Plus
                </h3>
                <p className="text-sm text-muted mb-5">
                  Für alle, die dauerhaft Zugriff wollen. Das einzige Abo,
                  offen deklariert.
                </p>
                <p className="mt-auto text-2xl font-serif font-semibold text-ink">
                  5,99 €{" "}
                  <span className="text-xs font-sans font-normal text-muted">
                    pro Monat
                  </span>
                </p>
                <Btn
                  as="a"
                  href={`mailto:${LEGAL.email}?subject=${encodeURIComponent(
                    "ScanReady Plus: Benachrichtigen, wenn es startet"
                  )}`}
                  variant="secondary"
                  className="mt-4 text-center"
                >
                  Benachrichtigen lassen
                </Btn>
                <ul className="mt-5 pt-4 border-t border-hair space-y-2 text-xs text-muted">
                  <li className="flex items-start gap-2">
                    <CheckIcon muted />
                    <span>Alles aus dem Pass, fortlaufend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon muted />
                    <span>Unbegrenzter Speicher</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon muted />
                    <span>Monatlich kündbar, ein Klick</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon muted />
                    <span>Erinnerung vor jeder Verlängerung</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Zum Vergleich: Anti-Abofalle ── */}
        <section className="bg-ink py-20 sm:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <FolioEyebrow folio="03" label="Zum Vergleich" />
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-[1.15] mt-3 mb-10 max-w-xl">
              Woran Sie eine Abofalle erkennen.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl border border-white/10 bg-white/5 px-7 py-7">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-brand-error">
                  Andere CV-Dienste
                </p>
                <ul className="mt-4 space-y-3 text-sm text-white/70 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CrossIcon />
                    <span>
                      2,95 € „Test“, der sich still für 14,99 €/Monat
                      verlängert
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CrossIcon />
                    <span>
                      Kostenloser Download, der als unbrauchbare Textdatei
                      endet
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CrossIcon />
                    <span>Kündigung tief im Kundenkonto versteckt</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-7 py-7">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                  ScanReady
                </p>
                <ul className="mt-4 space-y-3 text-sm text-white/70 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>
                      Nichts verlängert sich still. Der Pass endet von
                      selbst.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>
                      Vollständige Dokumente kostenlos, kopieren und .txt
                      inklusive
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>
                      Alle Preise vor jeder Bezahlschranke sichtbar, inkl.
                      MwSt.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-ink py-10 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 mb-4">
            ScanReady · Seite 1
          </p>
          <div className="flex items-center justify-between text-sm text-white/70">
            <p>ScanReady</p>
            <div className="flex items-center gap-4">
              <a className="hover:text-white transition-colors" href="/de">
                Zur Startseite
              </a>
              <p>© 2026</p>
              <span className="reg-mark" aria-hidden="true" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
