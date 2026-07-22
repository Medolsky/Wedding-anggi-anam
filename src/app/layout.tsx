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
  title: "The Wedding of Alya & Raka",
  description:
    "Undangan pernikahan Alya Maharani & Raka Pratama, 12 Desember 2026.",
  openGraph: {
    title: "The Wedding of Alya & Raka",
    description: "Undangan pernikahan Alya & Raka, 12 Desember 2026",
    type: "website",
    locale: "id_ID",
  },
  robots: {
    index: false,
    follow: false,
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
        <meta name="theme-color" content="#2b2522" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
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
