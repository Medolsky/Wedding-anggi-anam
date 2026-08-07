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
  metadataBase: new URL("https://wedding-anam-anggi.netlify.app"),
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
    url: "https://wedding-anam-anggi.netlify.app",
    type: "website",
    locale: "id_ID",
    siteName: "The Wedding of Anam & Angi",
    images: [
      {
        url: "/image/hero.jpg",
        width: 1200,
        height: 630,
        alt: "The Wedding of Anam & Angi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Wedding of Anam & Angi",
    description: "Undangan Pernikahan Digital Misbakhul Anam Roziqin & Angi Sulistia — Sabtu, 10 Oktober 2026 di BALAI IKABAMA, Depok.",
    images: ["/image/hero.jpg"],
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
        <meta name="theme-color" content="#FAF8F5" />
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
