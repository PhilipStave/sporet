import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    // Added to the home screen, Altiv opens straight into the phone view —
    // not the desktop app scaled down.
    start_url: "/app/mobil",
    display: "standalone",
    background_color: "#ffffff",
    // The navy of the mark. Was still the old green from before the rebrand.
    theme_color: "#faf7f2",
    lang: "nb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
