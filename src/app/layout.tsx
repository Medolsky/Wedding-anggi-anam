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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://wedding-anggi-anam.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Wedding of Anam & Angi",
  description:
    "Undangan Pernikahan Digital Misbakhul Anam Roziqin & Angi Sulistia — Sabtu, 10 Oktober 2026 di BALAI IKABAMA, Depok.",
  keywords: ["Undangan Pernikahan", "Anam & Angi", "The Wedding of Anam & Angi", "Wedding Invitation"],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "The Wedding of Anam & Angi",
    description: "Undangan Pernikahan Digital Misbakhul Anam Roziqin & Angi Sulistia — Sabtu, 10 Oktober 2026 di BALAI IKABAMA, Depok.",
    url: siteUrl,
    type: "website",
    locale: "id_ID",
    siteName: "The Wedding of Anam & Angi",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Wedding of Anam & Angi",
        type: "image/jpeg",
      },
      {
        url: "/image/og-whatsapp.jpg",
        width: 800,
        height: 800,
        alt: "Foto Pernikahan Anam & Angi",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Wedding of Anam & Angi",
    description: "Undangan Pernikahan Digital Misbakhul Anam Roziqin & Angi Sulistia — Sabtu, 10 Oktober 2026 di BALAI IKABAMA, Depok.",
    images: ["/og-image.jpg"],
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
        <meta name="theme-color" content="#0E0E0F" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="image_src" href="/og-image.jpg" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:image:secure_url" content="/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
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
