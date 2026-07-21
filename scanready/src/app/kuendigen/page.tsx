import type { Metadata } from "next";
import { accountsEnabled } from "@/lib/supabase/config";
import { KuendigenForm } from "./KuendigenForm";

export const metadata: Metadata = { title: "Verträge hier kündigen: ScanReady" };

/**
 * §312k BGB Kündigungsbutton page. The heading wording ("Verträge hier
 * kündigen") is the statutory button label; this page is linked from the site
 * footers so the cancellation path is reachable without login barriers.
 *
 * FOUNDER review before subscriptions go live (§312k conformity is a legal
 * judgment, not a code property): identification here happens via the same
 * Google sign-in used at purchase, and the confirmation shown after
 * cancellation is the §312k receipt confirmation. See
 * docs/stage3-accounts.md.
 *
 * Env-gated honestly: while accounts/subscriptions are not provisioned, the
 * page states that no subscriptions exist instead of pretending a cancel flow.
 */
export default function KuendigenPage() {
  return (
    <main lang="de" className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6 text-sm text-ink leading-relaxed">
      <h1 className="font-serif text-3xl font-semibold">Verträge hier kündigen</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Einmalkäufe (Humanizer+, Bewerbungspaket)</h2>
        <p>
          Humanizer+ und das Bewerbungspaket sind Einmalkäufe ohne Laufzeit und ohne
          Abonnement. Es entsteht kein fortlaufender Vertrag, den Sie kündigen müssten.
          Fragen zu einer Zahlung oder Erstattung richten Sie an die im{" "}
          <a className="underline" href="/impressum">Impressum</a> genannte Adresse,
          idealerweise mit Ihrer Zahlungsreferenz.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Abonnement (Konto &amp; Speichern)</h2>
        {accountsEnabled() ? (
          <KuendigenForm />
        ) : (
          <p>
            Derzeit bieten wir kein Abonnement an. Es bestehen keine laufenden Verträge,
            die gekündigt werden könnten.
          </p>
        )}
      </section>
    </main>
  );
}
