// Registry of blog posts (used by /blogg index and sitemap).
// Hand-written posts live in src/app/blogg/<slug>/page.tsx; scheduled ones come from blog-content.ts
// and go live by themselves on their datePublished.
import { CONTENT_POSTS } from "./blog-content";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  readMinutes: number;
  image?: string;
  imageAlt?: string;
};

/** A post is live once its publish date has arrived (compared in Europe/Oslo). */
export function isPublished(datePublished: string, now = new Date()): boolean {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(now);
  return datePublished <= today;
}

const HAND_WRITTEN: BlogPost[] = [
  {
    slug: "hva-er-crm",
    title: "Hva er et CRM-system? Enkelt forklart for små bedrifter",
    description:
      "CRM betyr kundeoppfølging satt i system. Her er hva et CRM faktisk gjør, hvem som trenger det, og hva du bør se etter når du velger for en liten eller mellomstor bedrift.",
    datePublished: "2026-08-19",
    readMinutes: 5,
    image: "/blog/hva-er-crm.jpg",
    imageAlt: "Illustrasjon: kontaktkort, pipeline og graf bundet sammen av en linje",
  },
  {
    slug: "excel-vs-crm",
    title: "Excel som CRM: når holder det — og når bør du bytte?",
    description:
      "Mange bedrifter styrer salget i Excel. Det fungerer lenge — helt til det ikke gjør det. Her er tegnene på at regnearket har blitt et problem, og hva et enkelt CRM gir i stedet.",
    datePublished: "2026-08-19",
    readMinutes: 5,
    image: "/blog/excel-vs-crm.jpg",
    imageAlt: "Illustrasjon: kaotiske regneark som strømmer over i en ryddig kundetavle",
  },
  {
    slug: "salgspipeline",
    title: "Salgspipeline: slik bygger du en som selgerne faktisk bruker",
    description:
      "En god pipeline er få, tydelige steg og én regel for hva som flytter en kunde videre. Her er en mal for B2B-salg i Norge — og feilene de fleste gjør.",
    datePublished: "2026-08-19",
    readMinutes: 6,
    image: "/blog/salgspipeline.jpg",
    imageAlt: "Illustrasjon: seks steiner som danner en sti mot et mål med flagg",
  },
];

/** Everything ever written, newest first — including posts not yet live. */
export const ALL_POSTS: BlogPost[] = [
  ...HAND_WRITTEN,
  ...CONTENT_POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    datePublished: p.datePublished,
    readMinutes: p.readMinutes,
  })),
].sort((a, b) => b.datePublished.localeCompare(a.datePublished));

/** Posts visible to readers and search engines right now. */
export const BLOG_POSTS: BlogPost[] = ALL_POSTS.filter((p) => isPublished(p.datePublished));
