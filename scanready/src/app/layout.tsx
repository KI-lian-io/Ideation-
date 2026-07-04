import type { Metadata } from "next";
import { Inter, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Four type voices: Inter (UI prose), Geist Mono (labels/code), Source Serif 4 (the
// reading serif for the generated Lebenslauf/Anschreiben). Display serif stays a system
// stack (Iowan/Palatino/Georgia) — defined in globals.css, no web-font load.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  // Vercel injects VERCEL_PROJECT_PRODUCTION_URL (the stable production domain) at build time;
  // falls back to localhost in dev. Resolves relative OG image URLs to absolute (clears build warning).
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "ScanReady — Win the German Recruiter's First Scan",
  description:
    "Turn your CV into a norm-correct German Lebenslauf and an authentic Anschreiben, grounded only in your real facts. Zero-retention, by design.",
  openGraph: {
    title: "ScanReady — Win the German Recruiter's First Scan",
    description:
      "Norm-correct German Lebenslauf and authentic Anschreiben. Zero-retention, grounded only in your real facts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-hair px-6 py-6">
          <nav className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <a className="hover:text-ink transition-colors" href="/impressum">Impressum</a>
            <a className="hover:text-ink transition-colors" href="/datenschutz">Datenschutz</a>
            <a className="hover:text-ink transition-colors" href="/agb">AGB &amp; Widerruf</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
