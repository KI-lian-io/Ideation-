import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";
import { accountsEnabled } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "AGB & Widerrufsbelehrung: ScanReady" };

/**
 * AGB for the paid features: Humanizer+ and Bewerbungspaket (one-shot
 * purchases), plus the subscription section rendered only while the accounts
 * layer is provisioned (accountsEnabled()), so the live terms never describe
 * an offering that does not exist in the deployed configuration.
 * FOUNDER ACTION: legal review before go-live (see docs/humanizer-golive.md);
 * this is template text, not legal advice.
 */
export default function AgbPage() {
  const accounts = accountsEnabled();
  return (
    <main lang="de" className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6 text-sm text-ink leading-relaxed">
      <h1 className="font-serif text-3xl font-semibold">AGB &amp; Widerrufsbelehrung</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">1. Geltungsbereich und Anbieter</h2>
        <p>
          Diese Bedingungen gelten für die kostenpflichtigen Funktionen auf ScanReady
          (&bdquo;Humanizer+&ldquo; und &bdquo;Bewerbungspaket&ldquo;
          {accounts ? " sowie das optionale Abonnement „Konto & Speichern“" : ""}).
          Anbieter: {LEGAL.operatorName}, {LEGAL.street}, {LEGAL.city}.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">2. Leistung und Preis (Einmalkäufe)</h2>
        <p>
          Humanizer+ erstellt einmalig eine stilistisch überarbeitete Fassung Ihres bereits
          generierten Anschreibens in der von Ihnen gewählten Richtung. Preis: 2,99&nbsp;€
          (Endpreis).
        </p>
        <p>
          Das Bewerbungspaket schaltet für die aktuelle Bewerbung den druckfertigen
          PDF-Export von Lebenslauf und Anschreiben frei und enthält einen Humanizer+
          Feinschliff. Preis: 4,99&nbsp;€ (Endpreis), einmalig pro Bewerbung.
        </p>
        <p>
          Die Leistung wird jeweils unmittelbar nach Zahlung erbracht. Durch einen Einmalkauf
          entsteht kein Abonnement; es erfolgen keine wiederkehrenden Abbuchungen.
        </p>
      </section>

      {accounts && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">3. Abonnement &bdquo;Konto &amp; Speichern&ldquo;</h2>
          <p>
            Mit einem kostenlosen Konto können Sie ein Bewerbungspaket speichern. Das
            kostenpflichtige Abonnement erweitert dies auf mehrere gespeicherte
            Bewerbungspakete. Der Preis ist auf der{" "}
            <a className="underline" href="/preise">Preisseite</a> ausgewiesen; die
            Abrechnung erfolgt monatlich über Stripe.
          </p>
          <p>
            Die Vertragslaufzeit beträgt einen Monat und verlängert sich jeweils um einen
            Monat, wenn nicht gekündigt wird. Sie können jederzeit zum Ende des bereits
            bezahlten Zeitraums kündigen: online über{" "}
            <a className="underline" href="/kuendigen">Verträge hier kündigen</a> (§ 312k BGB)
            oder im Konto-Bereich. Nach dem Ende des Abonnements bleiben gespeicherte
            Bewerbungspakete lesbar; bearbeitbar bleibt Ihr zuletzt genutztes Paket.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{accounts ? "4." : "3."} Widerrufsbelehrung</h2>
        <p>
          Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu. Bei digitalen
          Inhalten erlischt das Widerrufsrecht gemäß § 356 Abs. 5 BGB, wenn Sie ausdrücklich
          zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der Ausführung beginnen,
          und Sie Ihre Kenntnis vom Erlöschen des Widerrufsrechts bestätigt haben. Diese
          Zustimmung holen wir vor der Zahlung per Checkbox ein.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{accounts ? "5." : "4."} Gewährleistung und Haftung</h2>
        <p>
          Die Überarbeitung basiert ausschließlich auf Ihrem eigenen Text; für den Erfolg einer
          Bewerbung wird keine Gewähr übernommen. Bitte lassen Sie das Ergebnis vor dem Versand
          von einem Muttersprachler prüfen. Schlägt die Erstellung nach erfolgreicher Zahlung
          dauerhaft fehl, erstatten wir den Kaufpreis. Kontakt:{" "}
          <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </section>
    </main>
  );
}
