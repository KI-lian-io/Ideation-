import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = { title: "Datenschutzerklärung: ScanReady" };

/**
 * GDPR Art. 13 notice. Structure mirrors what the product actually does:
 * transient processing only, no storage, no accounts, no analytics cookies.
 * FOUNDER ACTION: have this reviewed before go-live (see docs/humanizer-golive.md).
 */
export default function DatenschutzPage() {
  return (
    <main lang="de" className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6 text-sm text-ink leading-relaxed">
      <h1 className="font-serif text-3xl font-semibold">Datenschutzerklärung</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">1. Verantwortlicher</h2>
        <p>
          {LEGAL.operatorName}, {LEGAL.street}, {LEGAL.city}, {LEGAL.country},{" "}
          <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">2. Verarbeitung Ihrer Lebenslauf-Daten</h2>
        <p>
          Texte, die Sie in das Tool eingeben (Lebenslauf, Stellenanzeige, Antworten), werden
          ausschließlich zur Erstellung Ihrer Dokumente verarbeitet und{" "}
          <strong>nicht gespeichert</strong>. Es gibt keine Konten und keine Datenbank. Die
          Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung:
          Erbringung des von Ihnen angeforderten Dienstes).
        </p>
        <p>
          Zur Texterstellung übermitteln wir Ihre Eingaben an die Anthropic API (Anthropic PBC).
          Anthropic verwendet API-Eingaben nicht zum Training von Modellen. Hosting erfolgt bei
          Vercel Inc.; dabei fallen technisch notwendige Server-Logs (z.&nbsp;B. IP-Adresse) an
          (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
        <p>
          Zur Missbrauchsvermeidung (Ratenbegrenzung) wird pro Anfrage ein gekürzter Hash-Wert
          Ihrer IP-Adresse für maximal 60 Minuten gespeichert (Art. 6 Abs. 1 lit. f DSGVO);
          die IP-Adresse selbst wird dabei nicht gespeichert.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">3. Cookies</h2>
        <p>
          Bei normaler Nutzung setzt diese Website <strong>keine Cookies</strong>. Erst wenn Sie
          eine kostenpflichtige Funktion (Humanizer+) nutzen, wird der Zahlungsdienstleister
          Stripe geladen, der technisch notwendige Cookies zur Betrugsprävention setzt
          (Art. 6 Abs. 1 lit. b und f DSGVO).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">4. Zahlungsabwicklung (Stripe)</h2>
        <p>
          Kostenpflichtige Funktionen werden über Stripe Payments Europe, Ltd. abgewickelt. Ihre
          Zahlungsdaten werden direkt von Stripe verarbeitet; wir erhalten und speichern keine
          Kartendaten. Details: Datenschutzerklärung von Stripe (stripe.com/de/privacy).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">5. Ihre Rechte</h2>
        <p>
          Sie haben die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht
          auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO). Da wir Ihre Dokumentdaten
          nicht speichern, liegen nach Abschluss Ihrer Sitzung in der Regel keine
          personenbezogenen Dokumentdaten mehr vor.
        </p>
      </section>
    </main>
  );
}
