import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { SITE_URL } from "@/lib/site";

// Landing page targeting "salgsverktøy" — page two today (position ~20).
// Deliberately broader than /salgsoppfolging: category overview, not method.

const TITLE = "Salgsverktøy: hvilke du faktisk trenger — og hvilke du kan droppe";
const DESCRIPTION =
  "Det finnes hundrevis av salgsverktøy. De fleste norske B2B-team trenger fire. Her er kategoriene, hva de koster, hvordan du velger — og hvorfor for mange verktøy er verre enn for få.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/salgsverktoy" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_URL}/salgsverktoy`,
  },
};

const FAQ = [
  {
    q: "Hva er et salgsverktøy?",
    a: "Et salgsverktøy er programvare som hjelper deg å finne, følge opp eller lukke salg. Det dekker alt fra CRM og tilbudsverktøy til e-postsporing, prospektering og salgsstatistikk. I praksis er CRM-et navet, og resten er ting som kobles på.",
  },
  {
    q: "Hvor mange salgsverktøy trenger en liten bedrift?",
    a: "De fleste norske B2B-team med under tjue selgere klarer seg med tre til fire: et CRM, e-post og kalender, et sted å lage tilbud, og enkel statistikk. Flere verktøy gir sjelden mer salg — det gir mer administrasjon.",
  },
  {
    q: "Hva koster salgsverktøy i Norge?",
    a: "CRM-er ligger typisk mellom 500 og 15 000 kroner i måneden avhengig av antall brukere og leverandør. De fleste prises per bruker per måned, noen få per team. Tilbuds- og signeringsverktøy koster ofte 200 til 600 kroner per bruker i tillegg.",
  },
  {
    q: "Er Excel et salgsverktøy?",
    a: "Ja, og for én selger med få kunder er det ofte nok. Det slutter å fungere når flere skal dele informasjon, når ingen får varsel om forfalte oppfølginger, eller når historikken forsvinner med den som slutter.",
  },
  {
    q: "Hva er forskjellen på CRM og salgsverktøy?",
    a: "CRM er én type salgsverktøy — den som holder oversikt over kunder, saker og oppfølging. «Salgsverktøy» er samlebegrepet for alle typene, inkludert CRM.",
  },
];

export default function SalgsverktoyPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <ArticleLayout
        meta={{
          slug: "salgsverktoy",
          kicker: "Guide · Salgsverktøy",
          title: TITLE,
          description: DESCRIPTION,
          datePublished: "2026-08-24",
          readMinutes: 7,
        }}
        related={[
          { href: "/salgsoppfolging", label: "Salgsoppfølging: slik følger du opp kunder" },
          { href: "/blogg/hva-koster-crm", label: "Hva koster et CRM-system i Norge?" },
          { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
        ]}
      >
        <p style={s.lead}>
          Det finnes hundrevis av salgsverktøy på markedet, og nesten alle lover det samme: mer
          salg, mindre rot. Sannheten er at de fleste norske B2B-team trenger fire av dem — og at
          det femte og sjette som regel gjør vondt verre.
        </p>

        <section>
          <h2 style={s.h2}>Hva et salgsverktøy egentlig er</h2>
          <p style={s.p}>
            Et salgsverktøy er programvare som hjelper deg å finne, følge opp eller lukke salg. Det
            er et vidt begrep, og det er nettopp derfor det er lett å kjøpe for mye: nesten alt kan
            kalles et salgsverktøy hvis man vil selge det til deg.
          </p>
          <p style={s.p}>
            I praksis er CRM-et navet — det som vet hvem kundene er og hvor sakene står. Resten er
            ting som kobles på rundt: e-post, kalender, tilbud, signering, statistikk.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>De fem kategoriene</h2>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>CRM.</strong> Kunderegister, pipeline og oppfølging. Navet. Uten dette bor
              kundeinformasjonen i hodet på folk.
            </li>
            <li style={s.li}>
              <strong>Kommunikasjon.</strong> E-post og kalender — som regel Outlook eller Google.
              Verdien ligger i at det henger sammen med CRM-et, ikke i verktøyet i seg selv.
            </li>
            <li style={s.li}>
              <strong>Tilbud og signering.</strong> Å lage tilbudet og få det signert digitalt.
              Mange bruker Word og e-post her, og det går helt fint på lave volumer.
            </li>
            <li style={s.li}>
              <strong>Statistikk.</strong> Hva som er solgt, av hvem, med hvilken margin. Bør ligge i
              CRM-et — separate rapportverktøy blir sjelden åpnet.
            </li>
            <li style={s.li}>
              <strong>Prospektering.</strong> Å finne nye kunder: bransjeregistre, LinkedIn,
              e-postlister. Den kategorien flest kjøper for tidlig.
            </li>
          </ul>
          <p style={s.p}>
            De tre første er nesten alltid verdt pengene. De to siste avhenger av hvor du er.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Fellen: for mange verktøy</h2>
          <p style={s.p}>
            Det vanligste problemet i små salgsteam er ikke at de mangler verktøy. Det er at de har
            fem stykker som ikke snakker sammen.
          </p>
          <p style={s.p}>
            Kunden ligger i CRM-et, e-posten i Outlook, tilbudet i en mappe på OneDrive, tallene i
            et Excel-ark og oppfølgingen på en gul lapp. Hver overgang er et sted informasjon kan bli
            borte — og hver av dem koster penger hver måned.
          </p>
          <p style={s.p}>
            Et enkelt system som brukes av alle slår et avansert system som halvparten logger seg
            inn i. Det er den viktigste regelen når du velger.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Slik velger du</h2>
          <p style={s.p}>Fem spørsmål som luker ut det meste:</p>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>Kan en ny selger ta det i bruk uten opplæring?</strong> Krever det kurs, blir
              det ikke brukt.
            </li>
            <li style={s.li}>
              <strong>Koster det per bruker eller per team?</strong> Per bruker betyr at det blir
              dyrere hver gang dere ansetter — og at noen blir holdt utenfor for å spare penger.
            </li>
            <li style={s.li}>
              <strong>Er det på norsk?</strong> Ikke av prinsipp, men fordi engelske felter gir
              slurvete utfylling hos folk som ikke er komfortable med språket.
            </li>
            <li style={s.li}>
              <strong>Ligger dataene i EU?</strong> Relevant hvis dere selger til det offentlige
              eller til større kunder som spør om databehandleravtale.
            </li>
            <li style={s.li}>
              <strong>Er det binding?</strong> Årsbinding på et verktøy dere ikke har prøvd er
              unødvendig risiko. Test først.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={s.h2}>Hva det bør koste</h2>
          <p style={s.p}>
            CRM-er i Norge ligger typisk mellom 500 og 15 000 kroner i måneden. Spennet skyldes
            nesten alltid antall brukere, ikke funksjoner — de fleste prises per bruker per måned.
          </p>
          <p style={s.p}>
            Regn med et påslag i året én: import av eksisterende kunder, oppsett og tiden det tar før
            teamet er i gang. Det er den kostnaden som aldri står i prislisten.{" "}
            <Link href="/blogg/hva-koster-crm" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Vi har regnet på det her
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Altiv som samlet salgsverktøy</h2>
          <p style={s.p}>
            Altiv dekker de fire tingene de fleste faktisk trenger, i ett system:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>Pipeline og kunderegister</strong> — hver sak i en fase du kan dra den mellom.
            </li>
            <li style={s.li}>
              <strong>Automatisk e-postlogging</strong> — sett Altiv på kopi, så havner e-posten i
              kundens aktivitetslogg av seg selv.
            </li>
            <li style={s.li}>
              <strong>Oppfølging i kalenderen</strong> — neste steg med dato, synlig i Outlook.
            </li>
            <li style={s.li}>
              <strong>Omsetning og margin</strong> — per selger og per avdeling, uten at noen må
              bygge en rapport.
            </li>
          </ul>
          <p style={s.p}>
            Prisen er per team, ikke per bruker. Det betyr at hele salgsavdelingen kan være med uten
            at regningen vokser, og det er som regel først da et salgsverktøy gir verdi.{" "}
            <Link href="/#priser" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Se prisene
            </Link>{" "}
            eller les om{" "}
            <Link href="/salgsoppfolging" style={{ color: "var(--accent)", fontWeight: 600 }}>
              salgsoppfølging i praksis
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Vanlige spørsmål</h2>
          {FAQ.map((f) => (
            <div key={f.q} style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{f.q}</h3>
              <p style={{ ...s.p, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </section>
      </ArticleLayout>
    </>
  );
}
