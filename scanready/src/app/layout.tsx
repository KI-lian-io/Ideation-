import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// Blend type voices: Inter for UI prose, Geist Mono for code. Serif (display) stays
// a system stack (Iowan/Palatino/Georgia) — defined in globals.css, no web-font load.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  // Vercel injects VERCEL_PROJECT_PRODUCTION_URL (the stable production domain) at build time;
  // falls back to localhost in dev. Resolves relative OG image URLs to absolute (clears build warning).
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "ScanReady — Win the 8-Second German Recruiter Scan",
  description:
    "Turn your CV into a norm-correct German Lebenslauf and an authentic Anschreiben, grounded only in your real facts. Zero-retention, by design.",
  openGraph: {
    title: "ScanReady — Win the 8-Second German Recruiter Scan",
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
