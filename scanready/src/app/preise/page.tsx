import type { Metadata } from "next";
import { Btn, CARD, EYEBROW } from "@/components/ui";

export const metadata: Metadata = {
  title: "Preise: ScanReady",
  description:
    "Kostenlos umwandeln, oder einmalig für Feinschliff und druckfertigen Export zahlen. Kein Abo, keine Falle: der Preis steht dran.",
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

// Inline checkmark used inside pricing cards for included-feature lists
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
      className="h-4 w-4 text-accent flex-shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
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
              Einmal zahlen. Kein Abo. Keine Falle.
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto">
              Der Preis steht dran, bevor Sie etwas bezahlen. Die Kernumwandlung
              bleibt kostenlos, dauerhaft. Bezahlt wird nur, wenn Sie
              zusätzlichen Feinschliff oder einen druckfertigen Export wollen,
              einmalig, pro Anwendungsfall.
            </p>
          </div>
        </section>

        {/* ── Preiskarten ── */}
        <section className="bg-paper pb-20 sm:pb-28">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
              {/* Kostenlos */}
              <div className={`${CARD} px-6 py-8 flex flex-col`}>
                <p className={`${EYEBROW} mb-3`}>Kostenlos</p>
                <h2 className="text-2xl font-semibold text-ink mb-1 leading-snug">
                  Kostenlos, und bleibt es
                </h2>
                <p className="text-sm text-muted mb-6">
                  Für jede Bewerbung, ohne Limit.
                </p>
                <ul className="space-y-3 text-sm text-ink flex-1">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Vollständige Lebenslauf-Umwandlung ins DIN-Format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Zweisprachige Norm-Erklärungen zu jeder Änderung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Vollständiges Anschreiben, live erstellt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Bearbeiten, kopieren, als .txt herunterladen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Kein Konto, keine Speicherung</span>
                  </li>
                </ul>
                <p className="mt-6 text-3xl font-serif font-semibold text-ink">
                  0 €
                </p>
                <Btn as="a" href="/app" variant="secondary" className="mt-4 text-center">
                  Jetzt starten
                </Btn>
              </div>

              {/* Humanizer+ */}
              <div className={`${CARD} px-6 py-8 flex flex-col border-accent/30`}>
                <p className={`${EYEBROW} mb-3`}>Feinschliff</p>
                <h2 className="text-2xl font-semibold text-ink mb-1 leading-snug">
                  Humanizer+
                </h2>
                <p className="text-sm text-muted mb-6">
                  Für ein Anschreiben, das zur Unternehmenskultur passt.
                </p>
                <ul className="space-y-3 text-sm text-ink flex-1">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Eine Überarbeitung Ihres fertigen Anschreibens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Drei Richtungen: Formeller, Moderner, Prägnanter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Nur Umformulierung, keine neuen Fakten oder Angaben</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Direkt nach Zahlung, kein Konto nötig</span>
                  </li>
                </ul>
                <p className="mt-6 text-3xl font-serif font-semibold text-ink">
                  2,99 €{" "}
                  <span className="text-sm font-sans font-normal text-muted">
                    einmalig
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">Kein Abo.</p>
                <Btn as="a" href="/app" variant="accent" className="mt-4 text-center">
                  Anschreiben zuerst erstellen
                </Btn>
              </div>

              {/* Bewerbungspaket */}
              <div className={`${CARD} px-6 py-8 flex flex-col relative`}>
                <p className={`${EYEBROW} mb-3`}>Komplettpaket</p>
                <h2 className="text-2xl font-semibold text-ink mb-1 leading-snug">
                  Bewerbungspaket
                </h2>
                <p className="text-sm text-muted mb-6">
                  Für eine Bewerbung, die druckfertig rausgeht.
                </p>
                <ul className="space-y-3 text-sm text-ink flex-1">
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Druckfertiger PDF-Export im DIN-5008-Format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Humanizer+ Feinschliff inklusive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon />
                    <span>Lebenslauf und Anschreiben aus einem Guss formatiert</span>
                  </li>
                </ul>
                <p className="mt-6 text-3xl font-serif font-semibold text-ink">
                  4,99 €{" "}
                  <span className="text-sm font-sans font-normal text-muted">
                    einmalig pro Bewerbung
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">Kein Abo.</p>
                <Btn as="a" href="/app" variant="secondary" className="mt-4 text-center">
                  Im Tool freischalten
                </Btn>
              </div>
            </div>

            {/* Geplanter Konto-Teaser: klein, ehrlich gekennzeichnet */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted max-w-xl mx-auto">
                <span className="font-semibold text-ink">
                  Konto &amp; Speichern (geplant):
                </span>{" "}
                mehrere Bewerbungspakete speichern, monatlich kündbar,
                Kündigungsbutton inklusive. Noch nicht live.
              </p>
            </div>
          </div>
        </section>

        {/* ── Anti-Abofalle-Manifest ── */}
        <section className="bg-ink py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <FolioEyebrow folio="02" label="Warum einmalig" />
            <h2 className="font-serif text-3xl font-semibold text-white leading-[1.2] text-center mt-3 mb-10">
              Das Problem heißt Abofalle.
            </h2>

            <div className="text-base text-white/70 leading-relaxed space-y-5">
              <p>
                Viele Lebenslauf-Baukästen locken mit einem Testzugang für
                wenig Geld, zum Beispiel 2,70 € für zwei Wochen, und wandeln
                ihn danach automatisch in ein Abo um, das dann monatlich rund
                23,70 € kostet, wenn nicht rechtzeitig gekündigt wird. Das
                Muster ist bekannt genug, dass es eigene Kündigungs-Ratgeber
                und Verbraucherwarnungen dazu gibt.
              </p>
              <p>
                Unsere Gegenposition ist einfach: Einmal zahlen. Kein Abo.
                Keine Falle. Der Preis steht dran, bevor Sie zahlen, und Sie
                sehen genau, wofür.
              </p>
              <p>
                Und ohne Konto gilt weiterhin: keine Datenbank, kein Training
                mit Ihren Daten, zustandslose Verarbeitung. Ihr Lebenslauf-Text
                geht an die KI, das Ergebnis kommt zurück, und ohne Konto
                bleibt nichts liegen.
              </p>
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
