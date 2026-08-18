// Central site identity used for SEO metadata, sitemap, robots and JSON-LD.
// The public URL comes from NEXT_PUBLIC_SITE_URL so it follows the deployment.

export const SITE_NAME = "Sporet";
export const SITE_TAGLINE = "CRM for salgsoppfølging";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://altiv.no"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Sporet er et norsk CRM for salgsoppfølging i B2B. Se pipeline på tvers av avdelinger, logg hver kontakt, planlegg neste steg og følg omsetning og margin per selger. Fra 500 kr/mnd.";

export const SITE_KEYWORDS = [
  "CRM",
  "salgsoppfølging",
  "salgsverktøy",
  "pipeline",
  "kundeoppfølging",
  "B2B salg",
  "norsk CRM",
  "salgsstatistikk",
  "kundesystem",
  "salgsstyring",
  "CRM for små bedrifter",
  "CRM Norge",
];

export const PRICING = [
  { users: 10, price: 500 },
  { users: 20, price: 900 },
  { users: 50, price: 2000 },
  { users: 100, price: 3000 },
];

export const FAQ = [
  {
    q: "Hvordan blir de ansatte med?",
    a: "Administrator deler bedriftskoden (finnes under Innstillinger). Ansatte går til «Bli med», søker opp bedriften, taster koden og lager sin egen bruker med e-post og passord. Administrator godkjenner deretter brukeren.",
  },
  {
    q: "Ser alle i bedriften de samme kundene?",
    a: "Ja — hele teamet jobber i én felles database. Du kan filtrere på avdeling, selger og periode, eller velge «Bare meg» for kun dine egne kunder.",
  },
  {
    q: "Kan jeg få ut dataene mine?",
    a: "Ja. Under Kunder eksporterer du hele kundelisten til CSV (semikolonseparert, klar for Excel).",
  },
  {
    q: "Fungerer det på mobil?",
    a: "Ja. Sporet er responsivt og fungerer i nettleseren på telefon og nettbrett, uten installasjon.",
  },
  {
    q: "Hva koster det?",
    a: "Prisen avhenger av antall brukere — fra 500 kr/mnd for opptil 10 brukere. Alle pakker inneholder hele systemet.",
  },
];
