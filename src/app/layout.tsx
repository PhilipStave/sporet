import type { Metadata, Viewport } from "next";
import {
  Space_Grotesk,
  Inter,
  Instrument_Serif,
  Karla,
} from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
} from "@/lib/site";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  alternates: {
    canonical: "/",
    languages: { "nb-NO": "/", "no": "/" },
  },
  // Open Graph / Twitter images come from app/opengraph-image.tsx (1200×630).
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    countryName: "Norway",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  other: {
    "geo.region": "NO",
    "geo.placename": "Norge",
    "content-language": "nb-NO",
  },
  // Search-engine ownership verification (Google is verified via DNS TXT).
  verification: {
    other: { "msvalidate.01": "C99E54ABD19C69B1418F8138556C795D" },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nb"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${instrumentSerif.variable} ${karla.variable}`}
    >
      <head>
        {/* Sets data-theme before first paint to avoid a light→dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        {/* Vercel Web Analytics: aggregate, cookieless visitor counts.
            It never identifies a person — that is a feature, not a gap. */}
        <Analytics />
      </body>
    </html>
  );
}
