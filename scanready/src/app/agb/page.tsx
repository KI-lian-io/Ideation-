import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = { title: "AGB & Widerrufsbelehrung — ScanReady" };

/**
 * Minimal AGB for the single paid feature (Humanizer+ one-shot refinement).
 * FOUNDER ACTION: legal review before go-live (see docs/humanizer-golive.md).
 */
export default function AgbPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6 text-sm text-ink leading-relaxed">
      <h1 className="font-serif text-3xl font-semibold">AGB &amp; Widerrufsbelehrung</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">1. Geltungsbereich und Anbieter</h2>
        <p>
          Diese Bedingungen gelten für die kostenpflichtige Funktion „Humanizer+" auf ScanReady.
          Anbieter: {LEGAL.operatorName}, {LEGAL.street}, {LEGAL.city}.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">2. Leistung und Preis</h2>
        <p>
          Humanizer+ erstellt einmalig eine stilistisch überarbeitete Fassung Ihres bereits
          generierten Anschreibens in der von Ihnen gewählten Richtung. Preis: 2,99&nbsp;€
          (Endpreis). Die Leistung wird unmittelbar nach Zahlung erbracht. Es entsteht kein
          Abonnement; es erfolgen keine wiederkehrenden Abbuchungen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">3. Widerrufsbelehrung</h2>
        <p>
          Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu. Bei digitalen
          Inhalten erlischt das Widerrufsrecht gemäß § 356 Abs. 5 BGB, wenn Sie ausdrücklich
          zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der Ausführung beginnen,
          und Sie Ihre Kenntnis vom Erlöschen des Widerrufsrechts bestätigt haben. Diese
          Zustimmung holen wir vor der Zahlung per Checkbox ein.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">4. Gewährleistung und Haftung</h2>
        <p>
          Die Überarbeitung basiert ausschließlich auf Ihrem eigenen Text; für den Erfolg einer
          Bewerbung wird keine Gewähr übernommen. Bitte lassen Sie das Ergebnis vor dem Versand
          von einem Muttersprachler prüfen. Schlägt die Erstellung nach erfolgreicher Zahlung
          dauerhaft fehl, erstatten wir den Kaufpreis — Kontakt:{" "}
          <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </section>
    </main>
  );
}
