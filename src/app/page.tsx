import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, PRICING, FAQ } from "@/lib/site";
import { COMPANY_LEGAL_NAME, COMPANY_ORG_NR, COMPANY_ADDRESS } from "@/lib/legal";
import {
  LandingProvider,
  DetailCard,
  ZoomImage,
} from "@/components/landing/DetailModal";
import {
  FEATURE_DETAILS,
  STEP_DETAILS,
  SCREENSHOT_DETAILS,
  planDetail,
} from "@/lib/landingContent";

/**
 * Live since 27. august 2026: the API key is in Vercel and finnkunder is on
 * by default for new orgs, so a trial user who reads about the lead search
 * here finds it in the pipeline the same minute.
 */
const VIS_KUNDESOK = true;

export const metadata: Metadata = {
  title: "Altiv — CRM for salgsoppfølging | Norsk salgsverktøy for B2B",
  description:
    "Altiv samler kundene, dialogen og salgstallene ett sted — og finner nye kunder for deg med AI-søk mot Brønnøysundregistrene. Pipeline, aktivitetslogg og statistikk. Fra 790 kr/mnd — ingen installasjon.",
  alternates: { canonical: "/" },
};

/** Structured data for search engines: product, pricing, FAQ and organisation. */
function jsonLd() {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "CRM",
    operatingSystem: "Web",
    inLanguage: "nb-NO",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/screenshots/02-app-oversikt.png`,
    offers: PRICING.map((p) => ({
      "@type": "Offer",
      name: `Inntil ${p.users} brukere`,
      price: String(p.price),
      priceCurrency: "NOK",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(p.price),
        priceCurrency: "NOK",
        unitText: "MONTH",
        valueAddedTaxIncluded: false,
      },
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/#priser`,
    })),
    featureList: [
      "Pipeline med dra-og-slipp",
      "Kontaktlogg (telefon, e-post, SMS, møte)",
      "Kalender og neste steg",
      "Statistikk per avdeling og selger",
      "Omsetning og margin",
      "Kunderegister med CSV-eksport",
      "Automatisk e-postlogging (BCC)",
      "Kalenderabonnement for Outlook, Google og iPhone",
      "Dokumenter på kunden",
      "Roller: administrator og selger",
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    // The legal entity behind the brand — helps Google tie altiv.no to the
    // company registration rather than treating it as an unknown site.
    legalName: COMPANY_LEGAL_NAME,
    // Organisation number only. No vatID until the company is actually
    // registered for VAT — claiming one it does not hold would be wrong.
    taxID: COMPANY_ORG_NR.replace(/[^0-9]/g, ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Holtegata 12A",
      postalCode: "0259",
      addressLocality: "Oslo",
      addressCountry: "NO",
    },
    email: "post@altiv.no",
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "nb-NO",
  };
  // Site structure — helps search engines understand and link the public pages.
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Altiv", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Priser", item: `${SITE_URL}/#priser` },
      { "@type": "ListItem", position: 3, name: "Sett opp bedriften", item: `${SITE_URL}/setup` },
      { "@type": "ListItem", position: 4, name: "Bli med i en bedrift", item: `${SITE_URL}/bli-med` },
      { "@type": "ListItem", position: 5, name: "Vilkår", item: `${SITE_URL}/vilkar` },
      { "@type": "ListItem", position: 6, name: "Personvern", item: `${SITE_URL}/personvern` },
    ],
  };
  return [software, faq, org, website, breadcrumbs];
}

const CheckIcon = () => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Every plan includes the whole system — only the user limit differs.
// The AI search is listed on every card for the same reason: it is a selling
// point included in the price, not a surcharge tier.
const BASE_FEATURES = [
  "Hele systemet — ingen funksjoner låst",
  "AI-kundesøk mot Brønnøysundregistrene",
  "Ubegrenset antall kunder og avtaler",
  "Pipeline, kalender og aktivitetslogg",
  "Statistikk, margin og selgeroversikt",
  "Support på e-post",
];

const PLAN_DEFS = [
  { users: "0–10 brukere", price: "790", popular: false },
  { users: "0–20 brukere", price: "1 490", popular: true },
  { users: "0–50 brukere", price: "3 490", popular: false },
  { users: "0–100 brukere", price: "5 990", popular: false },
];

const plans = PLAN_DEFS.map((p) => {
  const max = parseInt(p.users.split("–")[1]);
  const per = Math.round(parseInt(p.price.replace(/\s/g, "")) / max);
  return {
    ...p,
    perUser: `fra ${per} kr per bruker`,
    features: BASE_FEATURES,
  };
});

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };

const inkBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 20px",
  borderRadius: 999,
  background: "var(--ink)",
  color: "#f7f4ee",
  fontWeight: 700,
  fontSize: 15,
};

const outlineBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "14px 28px",
  borderRadius: 999,
  border: "1px solid var(--divider)",
  background: "var(--surface)",
  color: "var(--text)",
  fontWeight: 600,
  fontSize: 17,
};

export default function LandingPage() {
  return (
    <LandingProvider>
    <div
      className="landing"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-karla)",
      }}
    >
      {/* Structured data for search engines */}
      {jsonLd().map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg)",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div style={{ ...wrap, padding: "16px 24px", display: "flex", alignItems: "center", gap: 24 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-display)",
              fontSize: 24,
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 999, background: "var(--accent)" }} />
            Altiv
          </span>
          <nav
            style={{ display: "flex", alignItems: "center", gap: 20, marginLeft: "auto" }}
          >
            <a href="#produkt" className="land-navlink">
              Produkt
            </a>
            <a href="#slik" className="land-navlink">
              Slik funker det
            </a>
            <Link href="/hvorfor-altiv" className="land-navlink">
              Hvorfor Altiv
            </Link>
            <a href="#priser" className="land-navlink">
              Priser
            </a>
            <Link href="/bli-med" className="land-navlink">
              Bli med
            </Link>
            <Link href="/login" className="land-navlink">
              Logg inn
            </Link>
            <Link href="/setup" style={inkBtn}>
              Prøv systemet
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero.
          Conversion logic, in order of the eye: the offer sits above the
          headline (free, no lock-in — the objections that stop a click), the
          headline promises the outcome (win more sales) rather than the
          mechanism, the primary button carries the value instead of a generic
          verb, and the check row answers "what am I risking?" before it is
          asked. The right column shows the actual product — proof beats
          adjectives. No claims about cards: the signup flow asks for one. */}
      <section style={{ ...wrap, padding: "34px 24px 30px" }}>
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
            gap: 44,
            alignItems: "center",
          }}
        >
        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 15 }}>
          <span
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-hover)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Prøv gratis i 14 dager — ingen binding
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(38px, 4.8vw, 58px)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            Følg opp hver kunde i tide — og{" "}
            <em style={{ color: "var(--accent)" }}>vinn flere salg</em>
          </h1>
          <p style={{ margin: 0, fontSize: 17.5, color: "var(--muted)", maxWidth: "58ch" }}>
            <strong style={{ color: "var(--text)", fontWeight: 600 }}>
              Salg tapes sjelden på prisen — de tapes på oppfølgingen som glapp.
            </strong>{" "}
            Altiv er et norsk CRM som samler kundene, dialogen og salgstallene
            ett sted, så ingen kunde blir glemt og ingen avtale renner ut i
            stillhet. Se hele pipelinen, logg hver kontakt og følg omsetning og
            margin per selger.
            {VIS_KUNDESOK && (
              <> Og la AI-en finne neste kunde for deg — ekte bedrifter fra Brønnøysundregistrene.</>
            )}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6, alignItems: "center" }}>
            <Link href="/setup" style={{ ...inkBtn, padding: "14px 28px", fontSize: 17 }}>
              Prøv gratis i 14 dager
            </Link>
            <a href="#priser" style={outlineBtn}>
              Se priser
            </a>
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 22px",
              fontSize: 14.5,
              color: "var(--muted)",
            }}
          >
            {[
              "Ingen binding — månedlig, avslutt når som helst",
              "Alt inkludert i alle pakker — også AI-kundesøket",
              "Fungerer i nettleseren, ingen installasjon",
            ].map((t) => (
              <li key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* The product itself, not an illustration of it — plus a floating
            "Solgt for" card with a rising curve. Growth is the promise in the
            headline; this is the same promise drawn. Demo figures, like the
            demo companies in the screenshot behind it. */}
        <figure
          className="hero-bilde"
          style={{ margin: 0, position: "relative" }}
        >
          <span
            style={{
              display: "block",
              borderRadius: "var(--r-lg-land)",
              overflow: "hidden",
              border: "1px solid var(--divider)",
              boxShadow: "0 24px 60px rgba(27,26,24,.14)",
              background: "var(--surface)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/screenshots/01-app.png"
              alt="Pipelinen i Altiv med kunder fordelt på steg"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </span>
          <div
            className="hero-vekst"
            aria-hidden
            style={{
              position: "absolute",
              left: -26,
              bottom: -20,
              background: "var(--surface)",
              border: "1px solid var(--divider)",
              borderRadius: 14,
              boxShadow: "0 16px 40px rgba(27,26,24,.16)",
              padding: "12px 16px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 190,
            }}
          >
            <span style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", fontWeight: 600 }}>
              Solgt for
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <strong style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 24 }}>
                3,9 mill kr
              </strong>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#059669",
                  background: "rgba(5,150,105,.1)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                ↑ 18 %
              </span>
            </span>
            <svg viewBox="0 0 160 40" style={{ width: "100%", height: 34, display: "block" }}>
              <polyline
                points="0,34 22,30 44,31 66,24 88,25 110,16 132,12 160,4"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="160" cy="4" r="3" fill="var(--accent)" />
            </svg>
          </div>
        </figure>
        </div>
      </section>

      {/* Product screenshots */}
      <section
        id="produkt"
        aria-labelledby="produkt-heading"
        style={{ ...wrap, padding: "0 24px 48px", scrollMarginTop: 80 }}
      >
        <h2
          id="produkt-heading"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(26px, 3.2vw, 36px)",
            margin: "0 auto 18px",
            maxWidth: 940,
          }}
        >
          Alt du trenger for å følge opp salget
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.01fr) minmax(0, 1fr)",
            gap: 20,
            alignItems: "stretch",
          }}
          className="hero-shots"
        >
          <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                borderRadius: "var(--r-lg-land)",
                overflow: "hidden",
                border: "1px solid var(--divider)",
                boxShadow: "var(--shadow)",
                display: "block",
              }}
            >
              <ZoomImage
                src="/screenshots/02-app-oversikt.png"
                alt="Altiv CRM – oversikt over salgspipeline med pipeline-verdi, omsetning, margin og vinnrate per avdeling"
                detail={SCREENSHOT_DETAILS.oversikt}
                priority
                sizes="(max-width: 900px) 100vw, 550px"
              />
            </span>
            <figcaption style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
              Oversikten — tallene som betyr noe, i det du logger inn.
            </figcaption>
          </figure>
          <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                borderRadius: "var(--r-lg-land)",
                overflow: "hidden",
                border: "1px solid var(--divider)",
                boxShadow: "var(--shadow)",
                display: "block",
              }}
            >
              <ZoomImage
                src="/screenshots/04-setup.png"
                alt="Oppsett av bedrift i Altiv: bedriftsnavn, avdelinger, funksjoner og administrator-bruker"
                detail={STEP_DETAILS["1"]}
                sizes="(max-width: 900px) 100vw, 550px"
              />
            </span>
            <figcaption style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
              Oppsettet — bedrift, avdelinger og team på to minutter.
            </figcaption>
          </figure>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", margin: "10px 0 0" }}>
          Klikk på bildene og kortene for å se mer.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            marginTop: 24,
          }}
        >
          {[
            {
              img: "/screenshots/01-app.png",
              alt: "Altiv CRM – salgspipeline som kanban-tavle med dra-og-slipp, fra potensiell kunde til vunnet",
              title: "Pipeline.",
              text: "Dra kundene mellom stegene, filtrer på selger og periode.",
              detail: SCREENSHOT_DETAILS.pipeline,
            },
            {
              img: "/screenshots/02-app.png",
              alt: "Altiv CRM – salgsstatistikk med linjediagram over omsetning per avdeling og selger",
              title: "Statistikk.",
              text: "Sammenlign avdelinger og selgere på omsetning og margin.",
              detail: SCREENSHOT_DETAILS.statistikk,
            },
            {
              img: "/screenshots/03-app.png",
              alt: "Altiv CRM – kunderegister med kontaktperson, produkt, selger, steg og verdi, eksport til CSV",
              title: "Kunder.",
              text: "Kontaktinfo, hva de har kjøpt og hvem som solgte.",
              detail: SCREENSHOT_DETAILS.kunder,
            },
          ].map((f) => (
            <figure key={f.title} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <span
                style={{
                  display: "block",
                  borderRadius: "var(--r-md-land)",
                  overflow: "hidden",
                  border: "1px solid var(--divider)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <ZoomImage
                  src={f.img}
                  alt={f.alt}
                  detail={f.detail}
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
              </span>
              <figcaption style={{ fontSize: 15, color: "var(--muted)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)" }}>
                  {f.title}
                </span>{" "}
                {f.text}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ ...wrap, padding: "0 24px 56px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {[
            // Newest selling point first — the one no competitor's card looks like.
            ...(VIS_KUNDESOK
              ? [{ id: "kundesok", kicker: "AI-kundesøk", title: "Finn kunder du ikke visste om", text: "Skriv hva du selger og til hvem. AI-en tolker det, og ekte bedrifter fra Brønnøysund legges rett i pipelinen." }]
              : []),
            { id: "kontakt", kicker: "Kontakt", title: "Hver samtale logget", text: "Telefon, e-post, SMS og møter havner i kundens aktivitetslogg med dato." },
            { id: "oppfolging", kicker: "Oppfølging", title: "Neste steg med dato", text: "Sett tid og deltakere, og se alt samlet i kalenderen." },
            { id: "team", kicker: "Team", title: "Avdelinger og selgere", text: "Overfør et salg til en kollega, og se hvem som selger hva." },
            { id: "tall", kicker: "Tall", title: "Omsetning og margin", text: "Følg solgt-for per uke, måned og år — med margin i prosent og kroner." },
            { id: "epost", kicker: "E-post", title: "E-post logges av seg selv", text: "Sett bedriftens logg-adresse på BCC — e-posten og vedleggene havner på riktig kunde." },
            { id: "kalender", kicker: "Kalender og filer", title: "I din egen kalender", text: "Oppfølginger i Outlook, Google eller iPhone. Dokumenter lagret på kunden." },
          ].map((c) => (
            <DetailCard
              key={c.kicker}
              detail={FEATURE_DETAILS[c.id]}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                borderRadius: "var(--r-lg-land)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}
              >
                {c.kicker}
              </span>
              <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 22 }}>
                {c.title}
              </h4>
              <p style={{ margin: 0, fontSize: 15, color: "var(--muted)" }}>{c.text}</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>
                Les mer →
              </span>
            </DetailCard>
          ))}
        </div>
      </section>

      {/* Demo video */}
      <section style={{ ...wrap, padding: "0 24px 56px" }}>
        <div style={{ maxWidth: 620, marginBottom: 22 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(32px, 4.2vw, 48px)",
              lineHeight: 1.1,
              margin: "0 0 10px",
            }}
          >
            Se Altiv i bruk
          </h2>
          <p style={{ margin: 0, fontSize: 17, color: "var(--muted)", lineHeight: 1.6 }}>
            80 sekunder: logg inn, opprett en kunde, flytt den i pipelinen, logg en telefon, og se
            statistikk, selgerrangering, kundelisten og kalenderen. Ekte system, ingen klipping.
          </p>
        </div>
        <video
          controls
          muted
          playsInline
          preload="metadata"
          poster="/demo-poster.jpg"
          style={{
            width: "100%",
            borderRadius: "var(--r-lg-land)",
            border: "1px solid var(--divider)",
            boxShadow: "0 18px 50px rgba(27,26,24,.12)",
            display: "block",
            background: "var(--surface)",
          }}
        >
          <source src="/demo.mp4" type="video/mp4" />
        </video>
      </section>

      {/* How it works */}
      <section
        id="slik"
        style={{ ...wrap, padding: "0 24px 56px", scrollMarginTop: 80 }}
      >
        <div style={{ maxWidth: 620, marginBottom: 28 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(32px, 4.2vw, 48px)",
              marginBottom: 8,
            }}
          >
            Slik kommer dere i gang
          </h2>
          <p style={{ margin: 0, fontSize: 17, color: "var(--muted)" }}>
            Fra tom konto til første salg i pipelinen på under ti minutter.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              n: "1",
              title: "Sett opp bedriften",
              text: "Administrator oppretter bedriften, avdelingene og velger hvilke funksjoner teamet skal ha.",
              href: "/setup",
              cta: "Sett opp nå",
            },
            {
              n: "2",
              title: "Slipp inn teamet",
              text: "Del bedriftskoden. Ansatte søker opp bedriften, taster koden og lager sin egen bruker — du godkjenner.",
              href: "/bli-med",
              cta: "Bli med i en bedrift",
            },
            {
              n: "3",
              title: "Legg inn kundene",
              text: "Opprett kunder, logg hver kontakt og dra dem gjennom pipelinen fra potensiell til vunnet.",
              href: "/login",
              cta: "Logg inn",
            },
            {
              n: "4",
              title: "Følg tallene",
              text: "Se omsetning, margin og vinnrate per selger og avdeling — per uke, måned eller år.",
              href: "#produkt",
              cta: "Se produktet",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="land-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                borderRadius: "var(--r-lg-land)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Clickable body → detail modal */}
              <DetailCard
                detail={STEP_DETAILS[s.n]}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent-hover)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {s.n}
                </span>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 22 }}>
                  {s.title}
                </h4>
                <p style={{ margin: 0, fontSize: 15, color: "var(--muted)" }}>{s.text}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginTop: 2 }}>
                  Les mer →
                </span>
              </DetailCard>
              {/* Action link stays a real link */}
              <div style={{ padding: "0 24px 20px" }}>
                {s.href.startsWith("#") ? (
                  <a href={s.href} style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                    {s.cta} →
                  </a>
                ) : (
                  <Link href={s.href} style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                    {s.cta} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* Pricing */}
      <section
        id="priser"
        style={{ ...wrap, padding: "0 24px 56px", scrollMarginTop: 80 }}
      >
        <div style={{ maxWidth: 620, marginBottom: 28 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(32px, 4.2vw, 48px)",
              marginBottom: 8,
            }}
          >
            Priser
          </h2>
          <p style={{ margin: 0, fontSize: 17, color: "var(--muted)" }}>
            Velg pakken etter hvor mange brukere dere er. Alle pakkene inneholder
            hele systemet.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          {plans.map((p) => (
            <div
              key={p.users}
              className="land-card"
              style={{
                background: "var(--surface)",
                border: `1px solid ${p.popular ? "var(--ink)" : "var(--divider)"}`,
                borderRadius: "var(--r-lg-land)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: p.popular
                  ? "0 14px 34px rgba(27,26,24,.10)"
                  : "0 1px 2px rgba(27,26,24,.04)",
              }}
            >
            <DetailCard
              detail={planDetail(p.users, p.price)}
              style={{
                background: "transparent",
                border: "none",
                padding: "26px 26px 0",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flex: 1,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  minHeight: 26,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  {p.users}
                </span>
                {p.popular && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--accent-soft)",
                      color: "var(--accent-hover)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Mest valgt
                  </span>
                )}
              </span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <strong
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 46,
                    lineHeight: 1,
                  }}
                >
                  {p.price}
                </strong>
                <span style={{ fontSize: 14, color: "var(--muted)" }}>kr / mnd</span>
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.perUser}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 6 }}>
                {p.features.map((label) => (
                  <span key={label} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 14 }}>
                    <span style={{ color: "var(--accent)", display: "flex", flex: "none", paddingTop: 3 }}>
                      <CheckIcon />
                    </span>
                    {label}
                  </span>
                ))}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                Se alt som er inkludert →
              </span>
            </DetailCard>
            <div style={{ padding: "16px 26px 26px" }}>
              <Link
                href="/setup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 15,
                  ...(p.popular
                    ? { background: "var(--ink)", color: "#f7f4ee" }
                    : { background: "transparent", border: "1px solid var(--divider)", color: "var(--text)" }),
                }}
              >
                Kom i gang
              </Link>
            </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 20 }}>
          Alle priser er per måned, eks. mva. Trenger dere flere enn 100 brukere,
          ta kontakt for tilbud.
        </p>
        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
          Til sammenligning koster tradisjonelle CRM-systemer typisk fra 450 kr{" "}
          <em>per bruker</em> per måned — et team på 10 betaler da fra 4 500 kr/mnd.
        </p>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        style={{ ...wrap, padding: "0 24px 56px", scrollMarginTop: 80 }}
      >
        <div style={{ maxWidth: 620, marginBottom: 24 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(32px, 4.2vw, 48px)",
              marginBottom: 8,
            }}
          >
            Vanlige spørsmål
          </h2>
        </div>
        <div style={{ display: "grid", gap: 12, maxWidth: 820 }}>
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="land-faq"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                borderRadius: "var(--r-md-land)",
                padding: "16px 20px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {f.q}
                <span className="faq-chev" aria-hidden>+</span>
              </summary>
              <p className="faq-body" style={{ margin: "10px 0 0", fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section style={{ ...wrap, padding: "0 24px 56px" }}>
        <div
          style={{
            background: "var(--ink)",
            color: "#f4f1ea",
            borderRadius: "var(--r-lg-land)",
            padding: 44,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ maxWidth: "52ch" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: "clamp(26px, 3.2vw, 38px)",
                marginBottom: 8,
              }}
            >
              Kom i gang med Altiv
            </h3>
            <p style={{ margin: 0, fontSize: 16, color: "#c3ccc4" }}>
              Sett opp bedriften på et par minutter: legg inn kunder, flytt dem
              gjennom pipelinen og se tallene oppdatere seg.
            </p>
          </div>
          <Link
            href="/setup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 28px",
              borderRadius: 999,
              background: "#f4f1ea",
              color: "var(--ink)",
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            Sett opp bedriften
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--divider)" }}>
        <div
          style={{
            ...wrap,
            padding: "26px 24px",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-display)",
              fontSize: 20,
            }}
          >
            <span style={{ width: 13, height: 13, borderRadius: 999, background: "var(--accent)" }} />
            Altiv
          </span>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 14 }}>
            <a href="#produkt" style={{ color: "var(--muted)" }}>Produkt</a>
            <a href="#slik" style={{ color: "var(--muted)" }}>Slik funker det</a>
            <a href="#priser" style={{ color: "var(--muted)" }}>Priser</a>
            <a href="#faq" style={{ color: "var(--muted)" }}>Spørsmål</a>
            <Link href="/hvorfor-altiv" style={{ color: "var(--muted)" }}>Hvorfor Altiv</Link>
            <Link href="/salgsoppfolging" style={{ color: "var(--muted)" }}>Salgsoppfølging</Link>
            <Link href="/salgsverktoy" style={{ color: "var(--muted)" }}>Salgsverktøy</Link>
            <Link href="/blogg" style={{ color: "var(--muted)" }}>Blogg</Link>
            <Link href="/bli-med" style={{ color: "var(--muted)" }}>Bli med</Link>
            <Link href="/login" style={{ color: "var(--muted)" }}>Logg inn</Link>
            <Link href="/vilkar" style={{ color: "var(--muted)" }}>Vilkår</Link>
            <Link href="/personvern" style={{ color: "var(--muted)" }}>Personvern</Link>
          </nav>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Salgsoppfølging for team som selger til bedrifter og det offentlige. Spørsmål?{" "}
            <a href="mailto:post@altiv.no" style={{ color: "var(--accent)", fontWeight: 600 }}>post@altiv.no</a>
          </span>
          <span style={{ fontSize: 13, color: "var(--muted)", opacity: 0.85 }}>
            Altiv leveres av{" "}
            <a
              href="https://stavesoftware.no"
              style={{ color: "var(--muted)", textDecoration: "underline" }}
            >
              {COMPANY_LEGAL_NAME}
            </a>
            , org.nr. {COMPANY_ORG_NR} · {COMPANY_ADDRESS}
            {/* Deliberately quiet: the platform owner's door, not a nav item. */}
            {" · "}
            <Link href="/admin" style={{ color: "var(--muted)", opacity: 0.6 }}>
              Administrasjon
            </Link>
          </span>
        </div>
      </footer>
    </div>
    </LandingProvider>
  );
}
