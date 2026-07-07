import { Btn, EYEBROW } from "@/components/ui";

/**
 * Branded 404: the "misprint correction" surface (design export 06-founder-
 * assets.dc.html, section 1c). Plain Server Component, no LangProvider: this
 * route renders outside the tool's LangProvider (same split-static-page
 * precedent as / vs /de), so German is the primary copy with the English
 * line as a secondary caption rather than a useLang() toggle.
 *
 * Zero movement by design, safe under prefers-reduced-motion from the start:
 * none of the Typesetting Theater CSS classes are imported here. The three
 * stacked "404" numerals are a static print-misregistration effect (offset
 * color layers), not a moving one.
 */
export default function NotFound() {
  return (
    <div lang="de">
      {/* Quiet masthead, same wordmark-link pattern as /preise. */}
      <nav className="border-b border-hair flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full h-16 flex items-center justify-between gap-4">
          <a
            href="/"
            className="font-serif text-xl sm:text-2xl font-semibold text-ink tracking-tight focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            ScanReady
          </a>
          <p className={`${EYEBROW} hidden sm:block`} aria-hidden="true">
            Druckfehler · Seite 404
          </p>
        </div>
      </nav>

      <main className="bg-paper py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-12 sm:gap-16 items-center">
          {/* Misregistered 404: three static offset print plates, no animation. */}
          <div className="relative leading-none select-none" aria-hidden="true">
            <span className="absolute left-[7px] top-[9px] font-serif text-[120px] sm:text-[180px] font-semibold tracking-[-0.06em] text-brand-error opacity-25">
              404
            </span>
            <span className="absolute left-[-5px] top-[-7px] font-serif text-[120px] sm:text-[180px] font-semibold tracking-[-0.06em] text-accent opacity-20">
              404
            </span>
            <span className="relative font-serif text-[120px] sm:text-[180px] font-semibold tracking-[-0.06em] text-ink">
              404
            </span>
          </div>

          <div className="max-w-md">
            <p className={EYEBROW}>Korrektur der Redaktion</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.1] tracking-tight mt-4">
              Diese Seite ist beim Umbruch verrutscht.
            </h1>
            <p className="text-xs text-muted mt-2">This page slipped during typesetting.</p>

            {/* Correction box: borrows the newspaper-correction format. */}
            <div className="border-t-2 border-ink border-b border-hair py-4 mt-7">
              <p className="font-serif-text text-base leading-relaxed text-ink-soft">
                <strong className="font-semibold">Berichtigung:</strong> Die angeforderte
                Seite wurde nicht gesetzt oder existiert nicht mehr. Wir bitten, den
                Fehler zu entschuldigen. Ihr Lebenslauf ist davon nicht betroffen.
              </p>
              <p className="text-xs text-muted mt-2">
                Correction: the requested page was never set, or no longer exists. We
                apologize for the error. Your Lebenslauf is unaffected.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-7">
              <Btn as="a" href="/" variant="primary">
                Zur Startseite
              </Btn>
              <Btn as="a" href="/app" variant="secondary">
                CV konvertieren
              </Btn>
            </div>

            <p className={`${EYEBROW} mt-6`}>Fehlercode 404 · Nichts wurde gespeichert</p>
            <p className="text-[11px] text-stone mt-1">Error code 404 · Nothing was stored</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-hair py-5">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone">
          <span>ScanReady · Seite 404</span>
          <span className="flex gap-4">
            <a className="hover:text-ink transition-colors" href="/impressum">
              Impressum
            </a>
            <a className="hover:text-ink transition-colors" href="/datenschutz">
              Datenschutz
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
