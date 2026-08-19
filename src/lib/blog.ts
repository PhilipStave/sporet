// Registry of blog posts (used by /blogg index and sitemap). Each post lives in src/app/blogg/<slug>/page.tsx.
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  readMinutes: number;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "hva-er-crm",
    title: "Hva er et CRM-system? Enkelt forklart for små bedrifter",
    description:
      "CRM betyr kundeoppfølging satt i system. Her er hva et CRM faktisk gjør, hvem som trenger det, og hva du bør se etter når du velger for en liten eller mellomstor bedrift.",
    datePublished: "2026-08-19",
    readMinutes: 5,
  },
  {
    slug: "excel-vs-crm",
    title: "Excel som CRM: når holder det — og når bør du bytte?",
    description:
      "Mange bedrifter styrer salget i Excel. Det fungerer lenge — helt til det ikke gjør det. Her er tegnene på at regnearket har blitt et problem, og hva et enkelt CRM gir i stedet.",
    datePublished: "2026-08-19",
    readMinutes: 5,
  },
  {
    slug: "salgspipeline",
    title: "Salgspipeline: slik bygger du en som selgerne faktisk bruker",
    description:
      "En god pipeline er få, tydelige steg og én regel for hva som flytter en kunde videre. Her er en mal for B2B-salg i Norge — og feilene de fleste gjør.",
    datePublished: "2026-08-19",
    readMinutes: 6,
  },
];
