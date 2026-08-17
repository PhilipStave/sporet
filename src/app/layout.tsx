import type { Metadata } from "next";
import {
  Space_Grotesk,
  Inter,
  Instrument_Serif,
  Karla,
} from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sporet — CRM for salgsoppfølging",
  description:
    "Sporet er et norsk CRM for salgsoppfølging i B2B. Følg hvem som er kontaktet, hvordan, og hvor langt salget har kommet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nb"
      className={`${spaceGrotesk.variable} ${inter.variable} ${instrumentSerif.variable} ${karla.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
