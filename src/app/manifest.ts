import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    // The navy of the mark. Was still the old green from before the rebrand.
    theme_color: "#1b2a52",
    lang: "nb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
