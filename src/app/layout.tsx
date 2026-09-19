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
  "https://wedding-angi-anam.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Wedding of Anam & Angi",
  description: "Sabtu, 10 Oktober 2026",
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
    description: "Sabtu, 10 Oktober 2026",
    url: siteUrl,
    type: "website",
    locale: "id_ID",
    siteName: "The Wedding of Anam & Angi",
    images: [
      {
        url: "/og-image.jpg",
        width: 1080,
        height: 1080,
        alt: "The Wedding of Anam & Angi",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Wedding of Anam & Angi",
    description: "Sabtu, 10 Oktober 2026",
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
        <link rel="image_src" href={`${siteUrl}/og-image.jpg`} />
        <meta property="og:title" content="The Wedding of Anam & Angi" />
        <meta property="og:description" content="Sabtu, 10 Oktober 2026" />
        <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />
        <meta property="og:image:secure_url" content={`${siteUrl}/og-image.jpg`} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1080" />
        <meta property="og:image:height" content="1080" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
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
