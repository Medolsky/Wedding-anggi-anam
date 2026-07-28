import type { Metadata } from "next";
import { Great_Vibes, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Wedding of Anam & Angi",
  description:
    "Undangan Pernikahan Digital Misbakhul Anam Roziqin & Angi Sulistia — Sabtu, 10 Oktober 2026 di BALAI IKABAMA, Depok.",
  keywords: ["Undangan Pernikahan", "Anam & Angi", "The Wedding of Anam & Angi", "Wedding Invitation"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "The Wedding of Anam & Angi",
    description: "Undangan Pernikahan Digital Misbakhul Anam Roziqin & Angi Sulistia — Sabtu, 10 Oktober 2026 di BALAI IKABAMA, Depok.",
    type: "website",
    locale: "id_ID",
    siteName: "The Wedding of Anam & Angi",
    images: [
      {
        url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "The Wedding of Anam & Angi",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${greatVibes.variable} ${cormorant.variable} ${manrope.variable}`}
    >
      <head>
        <meta name="theme-color" content="#d4af37" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body
        className="min-h-screen"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {children}
      </body>
    </html>
  );
}
