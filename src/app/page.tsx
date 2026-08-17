import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sporet — salgsoppfølging for team",
  description:
    "Sporet samler kundene, dialogen og salgstallene ett sted. Pipeline på tvers av avdelinger, logg hver kontakt, planlegg neste steg og følg omsetning og margin per selger.",
};

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
  { users: "0–20 brukere", price: "850", popular: true, extra: "Avdelinger og selgeroversikt" },
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
    <div
      className="landing"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-karla)",
      }}
    >
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
            Sporet
          </span>
          <nav style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: "auto" }}>
            <a href="#produkt" style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
              Produkt
            </a>
            <a href="#priser" style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
              Priser
            </a>
            <Link href="/login" style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
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
            Sporet samler kundene, dialogen og salgstallene ett sted. Se pipeline
            på tvers av avdelinger, logg hver kontakt, planlegg neste steg og følg
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
      <section id="produkt" style={{ ...wrap, padding: "0 24px 48px" }}>
        <div
          style={{
            maxWidth: 914,
            margin: "0 auto",
            borderRadius: "var(--r-lg-land)",
            overflow: "hidden",
            border: "1px solid var(--divider)",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/02-app-oversikt.png"
            alt="Oversikt med pipeline-verdi, solgt for, margin og vinnrate"
            style={{ display: "block", width: "100%", maxWidth: 914, height: "auto" }}
          />
        </div>

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
              title: "Pipeline.",
              text: "Dra kundene mellom stegene, filtrer på avdeling, selger og periode.",
              alt: "Pipeline som tavle med steg fra potensiell kunde til vunnet",
            },
            {
              img: "/screenshots/02-app.png",
              title: "Statistikk.",
              text: "Sammenlign avdelinger og selgere på omsetning og margin.",
              alt: "Statistikk med søylediagram over salg per avdeling",
            },
            {
              img: "/screenshots/03-app.png",
              title: "Kunder.",
              text: "Kontaktinfo, hva de har kjøpt og hvem som solgte.",
              alt: "Kunderegister med kontaktinfo, produkt og selger",
            },
          ].map((f) => (
            <figure key={f.img} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <span
                style={{
                  display: "block",
                  borderRadius: "var(--r-md-land)",
                  overflow: "hidden",
                  border: "1px solid var(--divider)",
                  boxShadow: "var(--shadow)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.img} alt={f.alt} style={{ display: "block", width: "100%", height: "auto" }} />
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
            { kicker: "Kontakt", title: "Hver samtale logget", text: "Telefon, e-post, SMS og møter havner i kundens aktivitetslogg med dato." },
            { kicker: "Oppfølging", title: "Neste steg med dato", text: "Sett tid og deltakere, og se alt samlet i kalenderen." },
            { kicker: "Team", title: "Avdelinger og selgere", text: "Overfør et salg til en kollega, og se hvem som selger hva." },
            { kicker: "Tall", title: "Omsetning og margin", text: "Følg solgt-for per uke, måned og år — med margin i prosent og kroner." },
          ].map((c) => (
            <div
              key={c.kicker}
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
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="priser" style={{ ...wrap, padding: "0 24px 56px" }}>
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
              style={{
                background: "var(--surface)",
                border: `1px solid ${p.popular ? "var(--ink)" : "var(--divider)"}`,
                borderRadius: "var(--r-lg-land)",
                padding: 26,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: p.popular
                  ? "0 14px 34px rgba(27,26,24,.10)"
                  : "0 1px 2px rgba(27,26,24,.04)",
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
                  marginTop: "auto",
                  ...(p.popular
                    ? { background: "var(--ink)", color: "#f7f4ee" }
                    : { background: "transparent", border: "1px solid var(--divider)", color: "var(--text)" }),
                }}
              >
                Kom i gang
              </Link>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 20 }}>
          Alle priser er per måned, eks. mva. Trenger dere flere enn 100 brukere,
          ta kontakt for tilbud.
        </p>
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
              Kom i gang med Sporet
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
            Sporet
          </span>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Salgsoppfølging for team som selger til bedrifter og det offentlige.
          </span>
        </div>
      </footer>
    </div>
  );
}
