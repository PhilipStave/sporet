import Link from "next/link";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, PRICING, FAQ } from "@/lib/site";
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

export const metadata: Metadata = {
  title: "Altiv — CRM for salgsoppfølging | Norsk salgsverktøy for B2B",
  description:
    "Altiv samler kundene, dialogen og salgstallene ett sted. Pipeline på tvers av avdelinger, logg hver kontakt, planlegg neste steg og følg omsetning og margin per selger. Fra 500 kr/mnd — ingen installasjon.",
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
    logo: `${SITE_URL}/favicon.ico`,
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

const BASE_FEATURES = [
  "Hele systemet",
  "Ubegrenset antall kunder",
  "Statistikk og margin",
  "Support på e-post",
];

const PLAN_DEFS = [
  { users: "0–10 brukere", price: "500", popular: false, extra: "Kalender og oppfølging" },
  { users: "0–20 brukere", price: "900", popular: true, extra: "Avdelinger og selgeroversikt" },
  { users: "0–50 brukere", price: "2 000", popular: false, extra: "Eksport og aktivitetslogg" },
  { users: "0–100 brukere", price: "3 000", popular: false, extra: "Prioritert support" },
];

const plans = PLAN_DEFS.map((p) => {
  const max = parseInt(p.users.split("–")[1]);
  const per = Math.round(parseInt(p.price.replace(/\s/g, "")) / max);
  return {
    ...p,
    perUser: `fra ${per} kr per bruker`,
    features: [...BASE_FEATURES, p.extra],
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

      {/* Hero */}
      <section style={{ ...wrap, padding: "64px 24px 40px" }}>
        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
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
            Salgsoppfølging for team
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(42px, 6.2vw, 74px)",
              lineHeight: 1.03,
              letterSpacing: "-0.01em",
            }}
          >
            Hold styr på hvem du har kontaktet, og{" "}
            <em style={{ color: "var(--accent)" }}>hvor langt du er kommet</em>
          </h1>
          <p style={{ margin: 0, fontSize: 19, color: "var(--muted)", maxWidth: "58ch" }}>
            <strong style={{ color: "var(--text)", fontWeight: 600 }}>
              Altiv er et norsk CRM for salgsoppfølging i B2B.
            </strong>{" "}
            Samle kundene, dialogen og salgstallene ett sted. Se pipeline på
            tvers av avdelinger, logg hver kontakt, planlegg neste steg og følg
            omsetning og margin per selger.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6, alignItems: "center" }}>
            <Link href="/setup" style={{ ...inkBtn, padding: "14px 28px", fontSize: 17 }}>
              Kom i gang
            </Link>
            <a href="#priser" style={outlineBtn}>
              Se priser
            </a>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              Ingen installasjon. Fungerer i nettleseren.
            </span>
          </div>
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
            maxWidth: 940,
            margin: "0 auto",
            borderRadius: "var(--r-lg-land)",
            overflow: "hidden",
            border: "1px solid var(--divider)",
            boxShadow: "var(--shadow)",
          }}
        >
          <ZoomImage
            src="/screenshots/02-app-oversikt.png"
            alt="Altiv CRM – oversikt over salgspipeline med pipeline-verdi, omsetning, margin og vinnrate per avdeling"
            detail={SCREENSHOT_DETAILS.oversikt}
            priority
            sizes="(max-width: 940px) 100vw, 940px"
          />
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
            { id: "kontakt", kicker: "Kontakt", title: "Hver samtale logget", text: "Telefon, e-post, SMS og møter havner i kundens aktivitetslogg med dato." },
            { id: "oppfolging", kicker: "Oppfølging", title: "Neste steg med dato", text: "Sett tid og deltakere, og se alt samlet i kalenderen." },
            { id: "team", kicker: "Team", title: "Avdelinger og selgere", text: "Overfør et salg til en kollega, og se hvem som selger hva." },
            { id: "tall", kicker: "Tall", title: "Omsetning og margin", text: "Følg solgt-for per uke, måned og år — med margin i prosent og kroner." },
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
              detail={planDetail(p.users, p.price, p.extra)}
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
                }}
              >
                {f.q}
              </summary>
              <p style={{ margin: "10px 0 0", fontSize: 15, color: "var(--muted)" }}>
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
            <Link href="/bli-med" style={{ color: "var(--muted)" }}>Bli med</Link>
            <Link href="/login" style={{ color: "var(--muted)" }}>Logg inn</Link>
            <Link href="/vilkar" style={{ color: "var(--muted)" }}>Vilkår</Link>
            <Link href="/personvern" style={{ color: "var(--muted)" }}>Personvern</Link>
          </nav>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Salgsoppfølging for team som selger til bedrifter og det offentlige.
          </span>
        </div>
      </footer>
    </div>
    </LandingProvider>
  );
}
