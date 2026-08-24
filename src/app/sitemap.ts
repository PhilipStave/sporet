import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/blog";

// Refresh hourly so scheduled posts enter the sitemap on their publish date.
export const revalidate = 3600;

// Only real, indexable pages (no in-page anchors — search engines ignore/flag them).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/hvorfor-altiv`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/blogg`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...BLOG_POSTS.map((p) => ({
      url: `${SITE_URL}/blogg/${p.slug}`,
      lastModified: new Date(p.datePublished),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/setup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/bli-med`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/vilkar`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/personvern`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
