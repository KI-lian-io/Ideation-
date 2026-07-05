import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = { title: "Impressum: ScanReady" };

export default function ImpressumPage() {
  return (
    <main lang="de" className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-ink">Impressum</h1>
      <section className="flex flex-col gap-1 text-sm text-ink">
        <p className="font-semibold">Angaben gemäß § 5 DDG</p>
        <p>{LEGAL.operatorName}</p>
        <p>{LEGAL.street}</p>
        <p>{LEGAL.city}</p>
        <p>{LEGAL.country}</p>
      </section>
      <section className="flex flex-col gap-1 text-sm text-ink">
        <p className="font-semibold">Kontakt</p>
        <p>
          E-Mail: <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
      </section>
      <section className="flex flex-col gap-1 text-sm text-ink">
        <p className="font-semibold">Umsatzsteuer</p>
        <p>{LEGAL.vatLine}</p>
      </section>
      <section className="flex flex-col gap-1 text-sm text-muted">
        <p className="font-semibold text-ink">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</p>
        <p>{LEGAL.operatorName}, Anschrift wie oben.</p>
      </section>
    </main>
  );
}
