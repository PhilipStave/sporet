import { LogoMark } from "@/components/Logo";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hvorfor Altiv? Enkelt CRM for små og mellomstore bedrifter i Norge",
  description:
    "Leter du etter et enkelt CRM-system for salgsoppfølging? Altiv er laget for norske bedrifter som selger B2B — uten kompleksiteten i HubSpot og Salesforce. Pipeline, kontaktlogg, statistikk og margin. Fra 790 kr/mnd, 14 dager gratis.",
  alternates: { canonical: "/hvorfor-altiv" },
  openGraph: {
    title: "Hvorfor Altiv? Enkelt CRM for små og mellomstore bedrifter",
    description:
      "Et norsk CRM uten støy: pipeline, kontaktlogg, statistikk og margin. For team som selger til bedrifter og det offentlige.",
    url: `${SITE_URL}/hvorfor-altiv`,
  },
};

const wrap: React.CSSProperties = { maxWidth: 820, margin: "0 auto" };
const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 400,
  fontSize: "clamp(26px, 3.4vw, 36px)",
  margin: "44px 0 12px",
  lineHeight: 1.15,
};
const p: React.CSSProperties = { margin: "0 0 14px", fontSize: 17, lineHeight: 1.65 };
const li: React.CSSProperties = { marginBottom: 8, fontSize: 17, lineHeight: 1.6 };

export default function HvorforAltivPage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Hvorfor Altiv? Enkelt CRM for små og mellomstore bedrifter i Norge",
    description: metadata.description,
    inLanguage: "nb-NO",
    author: { "@type": "Organization", name: "Altiv" },
    publisher: { "@type": "Organization", name: "Altiv", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/hvorfor-altiv`,
    datePublished: "2026-08-19",
    dateModified: "2026-08-19",
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

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
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text)" }}
          >
            <LogoMark size={38} />
            Altiv
          </Link>
          <nav style={{ display: "flex", gap: 18, marginLeft: "auto", fontSize: 15, fontWeight: 600 }}>
            <Link href="/#priser" style={{ color: "var(--text)" }}>Priser</Link>
            <Link href="/login" style={{ color: "var(--text)" }}>Logg inn</Link>
            <Link
              href="/setup"
              style={{ padding: "8px 16px", borderRadius: 999, background: "var(--ink)", color: "#f7f4ee" }}
            >
              Prøv gratis
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ ...wrap, padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 10px" }}>
          Hvorfor Altiv
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(36px, 5.4vw, 58px)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            margin: "0 0 18px",
          }}
        >
          Et CRM som er så enkelt og oversiktlig at selgerne faktisk bruker det
        </h1>
        <p style={{ ...p, fontSize: 19, color: "var(--muted)" }}>
          De fleste små og mellomstore bedrifter trenger ikke et CRM med hundre
          funksjoner. De trenger å vite hvem som er kontaktet, hva som ble sagt, hva
          neste steg er — og hvor mye de har solgt for. Altiv gir deg akkurat det, i
          et grensesnitt som er selvforklarende fra første klikk, og som du tilpasser
          bedriften din selv — uten kurs, uten konsulent.
        </p>

        <h2 style={h2}>Brukervennlig fra første minutt</h2>
        <p style={p}>
          Ingen opplæring, ingen manual. Altiv er bygget etter ett prinsipp: alt du
          trenger skal være synlig, og alt du gjør skal ta ett klikk. Åpne en kunde, og
          du ser hele bildet på én skjerm — kontaktinfo, verdi, hvor i prosessen den
          er, hva som er neste steg, og hele historikken. Ingenting er gjemt bak
          menyer eller faner.
        </p>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <li style={li}>
            <strong>Selvforklarende.</strong> Nye ansatte er i gang på fem minutter.
            Knapper heter det de gjør. Du trenger ikke lure på «hvor var det nå igjen».
          </li>
          <li style={li}>
            <strong>Oversiktlig.</strong> Pipelinen er én tavle du kan scanne på et
            sekund. Oversikten gir deg de seks tallene som betyr noe, ikke femti. Søk
            finner alt — kunder, selgere, produkter — fra ett felt.
          </li>
          <li style={li}>
            <strong>Raskt.</strong> Dra en kunde til neste steg. Logg en telefon med ett
            klikk. Legg til en ny kunde på fem sekunder. Det som tar tid i andre
            systemer, tar sekunder i Altiv — og derfor blir det faktisk gjort.
          </li>
          <li style={li}>
            <strong>Fungerer på mobil.</strong> Sjekk pipelinen eller logg et møte fra
            bilen, uten app-installasjon.
          </li>
        </ul>

        <h2 style={h2}>Tilpass Altiv til måten dere selger på</h2>
        <p style={p}>
          Ingen to bedrifter selger likt. Derfor former du Altiv etter dere — ikke
          omvendt — og du gjør det selv, i Innstillinger, på minutter:
        </p>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <li style={li}>
            <strong>Egne pipeline-steg.</strong> Gi stegene deres egne navn, legg til
            «Befaring», «Anbud levert» eller «Prøveperiode», bytt farge, endre
            rekkefølge, fjern det dere ikke bruker.
          </li>
          <li style={li}>
            <strong>Egne avdelinger.</strong> Bane, bygg, industri, service — del opp
            som organisasjonen faktisk er. Filtrer alt på én, flere eller alle.
          </li>
          <li style={li}>
            <strong>Skru av det dere ikke trenger.</strong> Bruker dere ikke kalender
            eller statistikk? Skjul dem, så blir menyen enda enklere.
          </li>
          <li style={li}>
            <strong>Tags og tapt-årsaker</strong> som passer bransjen deres — «Anbud»,
            «Kommune», «Nøkkelkunde» — så dere kan filtrere og lære av det.
          </li>
        </ul>
        <p style={p}>
          Og når behovene endrer seg, endrer du Altiv. Ingen konsulent, ingen
          bestilling, ingen ventetid.
        </p>

        <h2 style={h2}>Problemet med de store CRM-systemene</h2>
        <p style={p}>
          HubSpot, Salesforce og Dynamics er laget for store organisasjoner med egne
          CRM-administratorer. For en bedrift med 5–50 ansatte blir resultatet ofte det
          samme: lang oppsettstid, dyre lisenser, og selgere som faller tilbake til
          Excel-ark og notater på telefonen fordi systemet tar for lang tid å bruke.
        </p>
        <p style={p}>
          Når salgsoppfølgingen lever i hodet på hver enkelt selger, forsvinner oversikten
          i det øyeblikket noen er syk, slutter eller bare glemmer. Ledelsen vet ikke
          hva pipelinen er verdt, hvilke tilbud som ligger og venter, eller hvem som
          faktisk leverer.
        </p>

        <h2 style={h2}>Slik løser Altiv det</h2>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <li style={li}>
            <strong>Én tavle for hele salget.</strong> Dra kunden fra «Potensiell» til
            «Vunnet». Alle ser det samme, i sanntid.
          </li>
          <li style={li}>
            <strong>Ett klikk for å logge kontakt.</strong> Telefon, e-post, SMS eller
            møte — med dato og hvem som tok den. Historikken ligger på kunden, ikke i
            innboksen til én person.
          </li>
          <li style={li}>
            <strong>E-post logges av seg selv.</strong> Sett bedriftens logg-adresse på
            BCC når du sender til en kunde — e-posten og vedleggene havner automatisk i
            kundens historikk. Ingen må huske å logge.
          </li>
          <li style={li}>
            <strong>Oppfølginger i din egen kalender.</strong> Ett klikk, så dukker alle
            «neste steg» opp i Outlook, Google Kalender eller på iPhone — og oppdateres
            automatisk.
          </li>
          <li style={li}>
            <strong>Dokumentene der de hører hjemme.</strong> Tilbud, kontrakter og
            tegninger lagres på kunden, ikke i noens «Nedlastinger». Alle finner dem.
          </li>
          <li style={li}>
            <strong>Neste steg med dato.</strong> Kalenderen viser hva som forfaller i
            dag, i morgen og denne uken. Forfalte oppfølginger blir røde.
          </li>
          <li style={li}>
            <strong>Tallene ledelsen faktisk spør om.</strong> Pipeline-verdi, solgt for
            (uke/måned/år), vinnrate, margin i prosent og kroner — per avdeling og per
            selger. Uten å eksportere til Excel.
          </li>
          <li style={li}>
            <strong>Avdelinger og roller.</strong> Bygg, anlegg, industri, salg — hver
            avdeling ser sitt, admin ser alt. Overfør en kunde til en kollega med ett klikk.
          </li>
          <li style={li}>
            <strong>Tilpass pipelinen selv.</strong> Gi stegene nye navn, legg til
            «Befaring» eller «Anbud levert», endre rekkefølgen — uten konsulent.
          </li>
        </ul>

        <h2 style={h2}>Laget for norske B2B-bedrifter</h2>
        <p style={p}>
          Altiv er norsk fra bunnen av: norsk språk, norske kroner, mva håndtert
          riktig, og bygget for bedrifter som selger til andre bedrifter og det
          offentlige — entreprenører, maskinleverandører, industribedrifter,
          konsulenter, grossister. Ikke en oversatt amerikansk løsning.
        </p>
        <p style={p}>
          Dataene dine er isolert per bedrift med tilgangskontroll på databasenivå, overføres
          kryptert, og kan eksporteres til CSV når som helst. Du eier dataene dine —
          og du kan slette alt selv.
        </p>

        <h2 style={h2}>Hva koster det?</h2>
        <p style={p}>
          Prisen følger antall brukere, ikke antall funksjoner — alle pakker inneholder
          hele systemet. Fra <strong>790 kr/mnd</strong> for inntil 10 brukere til
          5 990 kr/mnd for inntil 100. Ingen binding, ingen oppstartsgebyr, avslutt når
          som helst. Alle nye bedrifter får <strong>14 dager gratis</strong> med full
          funksjonalitet — og du trenger ikke legge inn kort for å prøve.
        </p>
        <p style={p}>
          Til sammenligning koster HubSpot Sales Professional fra rundt 900 kr per bruker
          per måned, og Salesforce fra rundt 800 kr per bruker. For et team på ti er
          Altiv typisk en tidel av prisen — for den funksjonaliteten et lite salgsteam
          faktisk bruker.
        </p>

        <h2 style={h2}>Passer Altiv for dere?</h2>
        <p style={p}>Altiv passer godt hvis dere:</p>
        <ul style={{ paddingLeft: 22, margin: "0 0 14px" }}>
          <li style={li}>er 2–100 personer som selger til bedrifter eller det offentlige</li>
          <li style={li}>vil ha oversikt over pipeline og oppfølging uten å ansette en CRM-administrator</li>
          <li style={li}>har flere avdelinger eller selgere som bør se hverandres kunder</li>
          <li style={li}>vil følge omsetning og margin per selger — uten Excel</li>
          <li style={li}>er lei av systemer som ingen bruker</li>
        </ul>
        <p style={p}>
          Altiv passer <em>ikke</em> like godt hvis dere trenger avansert
          markedsføringsautomasjon, e-postkampanjer eller integrasjon mot et stort
          ERP-system fra dag én. Da er et av de store systemene et bedre valg — og vi
          sier det gjerne rett ut.
        </p>

        <div
          style={{
            marginTop: 40,
            padding: 28,
            background: "var(--ink)",
            color: "#f4f1ea",
            borderRadius: "var(--r-lg-land)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginBottom: 6 }}>
              Prøv Altiv gratis i 14 dager
            </h3>
            <p style={{ margin: 0, fontSize: 15, color: "#c3ccc4" }}>
              Sett opp bedriften på to minutter. Ingen binding, ingen trekk i prøveperioden.
            </p>
          </div>
          <Link
            href="/setup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "13px 26px",
              borderRadius: 999,
              background: "#f4f1ea",
              color: "var(--ink)",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Sett opp bedriften
          </Link>
        </div>

        <p style={{ marginTop: 30, fontSize: 14, color: "var(--muted)" }}>
          Se også:{" "}
          <Link href="/#produkt" style={{ color: "var(--accent)", fontWeight: 600 }}>produktet</Link>,{" "}
          <Link href="/#priser" style={{ color: "var(--accent)", fontWeight: 600 }}>prisene</Link>,{" "}
          <Link href="/#faq" style={{ color: "var(--accent)", fontWeight: 600 }}>vanlige spørsmål</Link>.
          {" "}Fra bloggen:{" "}
          <Link href="/blogg/hva-er-crm" style={{ color: "var(--accent)", fontWeight: 600 }}>Hva er et CRM-system?</Link>,{" "}
          <Link href="/blogg/excel-vs-crm" style={{ color: "var(--accent)", fontWeight: 600 }}>Excel som CRM</Link>,{" "}
          <Link href="/blogg/salgspipeline" style={{ color: "var(--accent)", fontWeight: 600 }}>Slik bygger du en salgspipeline</Link>.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid var(--divider)" }}>
        <div style={{ ...wrap, padding: "22px 24px", display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14, color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Forside</Link>
          <Link href="/vilkar" style={{ color: "var(--muted)" }}>Vilkår</Link>
          <Link href="/personvern" style={{ color: "var(--muted)" }}>Personvern</Link>
          <a href="mailto:post@altiv.no" style={{ color: "var(--muted)", marginLeft: "auto" }}>post@altiv.no</a>
        </div>
      </footer>
    </div>
  );
}
