import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";
import { accountsEnabled } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Datenschutzerklärung: ScanReady" };

/**
 * GDPR Art. 13 notice. Structure mirrors what the product actually does:
 * transient processing only for the anonymous flow; the optional accounts
 * layer (Supabase, opt-in storage) is described ONLY while it is actually
 * enabled (accountsEnabled() branches below), so the live text never claims
 * more or less than the deployed configuration.
 * FOUNDER ACTION: have this reviewed before go-live (see docs/humanizer-golive.md).
 */
export default function DatenschutzPage() {
  const accounts = accountsEnabled();
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
          <strong>nicht gespeichert</strong>.{" "}
          {accounts
            ? "Ohne Konto gibt es keine Speicherung und keine Datenbank; eine Speicherung findet nur statt, wenn Sie ein optionales Konto anlegen und Inhalte ausdrücklich selbst speichern (siehe Abschnitt 7)."
            : "Es gibt keine Konten und keine Datenbank."}{" "}
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung: Erbringung des von Ihnen angeforderten Dienstes).
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
          (Art. 6 Abs. 1 lit. b und f DSGVO). Auch die in Abschnitt 4 beschriebene
          Reichweitenmessung setzt keine Cookies.
          {accounts &&
            " Wenn Sie sich mit einem optionalen Konto anmelden, werden technisch notwendige Authentifizierungs-Cookies gesetzt, die Ihre Anmeldung aufrechterhalten (Art. 6 Abs. 1 lit. b DSGVO); sie entfallen mit der Abmeldung."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">4. Reichweitenmessung (PostHog)</h2>
        <p>
          Diese Website nutzt, sofern der Betreiber einen Analyse-Schlüssel konfiguriert hat,
          eine cookielose Reichweitenmessung über PostHog EU Cloud (Hosting in der EU). Es
          werden <strong>keine Cookies</strong> gesetzt und nicht auf den Gerätespeicher (z.&nbsp;B.
          localStorage) zugegriffen; die Messwerte liegen nur im Arbeitsspeicher der jeweiligen
          Sitzung. Es findet keine sitzungsübergreifende Wiedererkennung statt, und es werden
          keine Eingaben oder Dokumentinhalte aufgezeichnet, weder Lebenslauf noch
          Stellenanzeige noch Anschreiben. Erfasst werden ausschließlich anonyme Ereignisse wie
          &bdquo;Dokument erstellt&ldquo; oder &bdquo;Anschreiben fertiggestellt&ldquo;. Ihre
          IP-Adresse wird bei der Übermittlung technisch verarbeitet, aber nicht gespeichert.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
          Verbesserung des Dienstes). Diese Messung ist nur aktiv, wenn der Betreiber einen
          Analyse-Schlüssel konfiguriert hat; ohne konfigurierten Schlüssel findet keinerlei
          Reichweitenmessung statt.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">5. Zahlungsabwicklung (Stripe)</h2>
        <p>
          Kostenpflichtige Funktionen werden über Stripe Payments Europe, Ltd. abgewickelt. Ihre
          Zahlungsdaten werden direkt von Stripe verarbeitet; wir erhalten und speichern keine
          Kartendaten. Details: Datenschutzerklärung von Stripe (stripe.com/de/privacy).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">6. Ihre Rechte</h2>
        <p>
          Sie haben die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht
          auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO). Da wir Ihre Dokumentdaten
          {accounts ? " ohne Konto " : " "}
          nicht speichern, liegen nach Abschluss Ihrer Sitzung in der Regel keine
          personenbezogenen Dokumentdaten mehr vor.
        </p>
      </section>

      {/* Rendered only while the accounts layer is actually provisioned: the live
          notice must never describe processing that does not exist in the deployed
          configuration (and vice versa the day it does). */}
      {accounts && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">7. Konto und gespeicherte Bewerbungen (optional)</h2>
          <p>
            Optional können Sie ein Konto anlegen (Anmeldung über Google; Authentifizierung und
            Datenhaltung über Supabase, Hosting in der EU). Eine Speicherung Ihrer Inhalte
            (Lebenslauf, Stellenanzeige, Antworten, Anschreiben) erfolgt{" "}
            <strong>nur auf Ihre ausdrückliche Aktion</strong> (&bdquo;Bewerbung
            speichern&ldquo;), niemals automatisch. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
            DSGVO (Vertragserfüllung: Bereitstellung der Speicherfunktion).
          </p>
          <p>
            Bei der Anmeldung über Google erhalten wir Ihre E-Mail-Adresse. Für ein
            Abonnement wird die Zahlungsabwicklung über Stripe Checkout durchgeführt
            (siehe Abschnitt 5); wir speichern dazu eine Kundenreferenz und den
            Abonnementstatus, keine Zahlungsdaten.
          </p>
          <p>
            Sie können Ihr Konto jederzeit selbst löschen (&bdquo;Konto löschen&ldquo; im
            Konto-Bereich); damit werden alle gespeicherten Inhalte entfernt (Art. 17 DSGVO).
            Ein bestehendes Abonnement kündigen Sie unter{" "}
            <a className="underline" href="/kuendigen">Verträge hier kündigen</a>.
          </p>
        </section>
      )}
    </main>
  );
}
