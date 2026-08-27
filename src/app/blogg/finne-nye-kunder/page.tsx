import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { BLOG_POSTS } from "@/lib/blog";

const post = BLOG_POSTS.find((p) => p.slug === "finne-nye-kunder")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blogg/${post.slug}` },
  openGraph: { title: post.title, description: post.description, type: "article", images: post.image ? [post.image] : undefined },
};

export default function Page() {
  return (
    <ArticleLayout
      meta={{ slug: `blogg/${post.slug}`, kicker: "Blogg · Prospektering", title: post.title, description: post.description, datePublished: post.datePublished, image: post.image, imageAlt: post.imageAlt }}
      related={[
        { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
        { href: "/blogg/hva-er-crm", label: "Hva er et CRM-system?" },
        { href: "/salgsverktoy", label: "Salgsverktøy for norske bedrifter" },
      ]}
    >
      <p style={s.lead}>
        Det vanskeligste med B2B-salg er sjelden samtalen. Det er å vite hvem man
        skal ringe. De fleste ender med å kjøpe en kundeliste, eller å google seg
        gjennom en ettermiddag. Begge deler er dyrere enn de trenger å være — for
        opplysningene ligger allerede åpent, gratis, i et register alle kan bruke.
      </p>

      <h2 style={s.h2}>Alt ligger i Enhetsregisteret</h2>
      <p style={s.p}>
        Brønnøysundregistrene driver Enhetsregisteret, som inneholder omtrent
        1,1 millioner norske virksomheter. For hver av dem finner du navn,
        organisasjonsnummer, adresse, bransjekode, antall ansatte, stiftelsesdato,
        MVA-status og om selskapet er under konkursbehandling. Regnskapstall ligger
        i Regnskapsregisteret ved siden av.
      </p>
      <p style={s.p}>
        Dette er åpne data. Du trenger ingen avtale, ingen innlogging og ingen
        lisens for å slå opp i dem. Kundelistene som selges på markedet er i stor
        grad de samme opplysningene, med en pris på toppen.
      </p>

      <h2 style={s.h2}>Hvorfor det likevel er tungvint</h2>
      <p style={s.p}>
        Problemet er ikke tilgangen — det er at registeret er bygget for
        forvaltning, ikke for salg. Skal du finne bedrifter, må du kjenne
        <strong> bransjekoden</strong> deres. Norge bruker SN2025, som har rundt
        740 koder. «Bygging av veier og motorveier» er 42.110. «Regnskapsføring og
        bokføring» er 69.201. Ingen husker dette, og koden står sjelden i teksten
        du har i hodet når du tenker på en kundegruppe.
      </p>
      <p style={s.p}>
        Så kommer det verre: du må vite hvilken bransje som <em>kjøper</em> det du
        selger. Det er ikke det samme som bransjen du selv er i.
      </p>

      <h2 style={s.h2}>Regel én: søk etter kjøperen, ikke produktet</h2>
      <p style={s.p}>
        Dette er feilen nesten alle gjør første gang. Selger du gravemaskiner og
        søker på «gravemaskiner», får du maskinforhandlere — altså konkurrentene
        dine. Kundene dine er entreprenørene, som står under helt andre koder.
      </p>
      <p style={s.p}>
        Still deg selv spørsmålet motsatt vei: <strong>hvem har et problem som
        dette løser?</strong> Selger du et system for salgsoppfølging, er kjøperen
        en bedrift med selgere. Da er ikke kommunen en kunde, uansett hvor stor
        den er — en kommune driver ikke salg.
      </p>

      <h2 style={s.h2}>Regel to: begrens på størrelse</h2>
      <p style={s.p}>
        En bransjekode alene gir deg gjerne flere tusen treff. Sorterer du på
        antall ansatte, får du landets største arbeidsgivere øverst — ISS, BDO,
        de store kjedene. Det ser imponerende ut i lista og er nesten alltid bortkastet
        tid. De har rammeavtaler, innkjøpsavdelinger og leverandører de allerede
        bruker.
      </p>
      <p style={s.p}>
        For de fleste små og mellomstore selgere ligger de realistiske kundene
        mellom fem og to hundre ansatte. Store nok til å ha et budsjett, små nok
        til at den som svarer på telefonen kan ta en beslutning. Sett en øvre
        grense før du begynner å ringe.
      </p>

      <h2 style={s.h2}>Regel tre: hold deg unna personopplysningene</h2>
      <p style={s.p}>
        Her er det verdt å være presis, for reglene er strengere enn mange tror.
        Opplysninger om en <em>bedrift</em> er ikke personopplysninger. Navn,
        org.nummer, bransje og omsetning kan du fritt bruke.
      </p>
      <p style={s.p}>
        En <em>navngitt persons</em> jobb-e-post er derimot en personopplysning,
        også når den ligger åpent på nettsiden. Skal du kontakte noen på
        <code> fornavn.etternavn@bedrift.no</code>, gjelder personvernforordningen
        og markedsføringsloven fullt ut.
      </p>
      <p style={s.p}>
        Den enkle veien rundt er å holde seg til <strong>fellesadresser</strong>:
        post@, firmapost@, kundesenter@, postmottak@. De tilhører virksomheten, ikke
        et menneske, og er satt opp nettopp for å ta imot henvendelser utenfra. Det
        er også der en salgshenvendelse hører hjemme.
      </p>

      <h2 style={s.h2}>Slik gjør Altiv det for deg</h2>
      <p style={s.p}>
        Vi har bygget de tre reglene inn i et søk. Du skriver med egne ord hva du
        selger og til hvem — «regnskapstjenester til småbedrifter i Trondheim»
        eller «feiemaskiner til kommuner» — og får tilbake ekte norske bedrifter
        fra Enhetsregisteret.
      </p>
      <p style={s.p}>
        En språkmodell oversetter setningen din til bransjekoder og kommunenumre.
        Den velger utelukkende fra de faktiske listene — 740 bransjekoder og 358
        kommuner — så den kan verken finne opp en kode eller et sted. Selve
        bedriftene kommer fra registeret alene. Ingen navn og ingen organisasjonsnumre
        er generert.
      </p>
      <p style={s.p}>
        Vil du styre treffene, tar du det med i setningen: «små bedrifter», «på
        Sørlandet», «finn 20 kunder». Hvert treff viser bransje, ansatte, sted og
        omsetning, så du kan sortere ut hvem som er verdt en telefon før du bruker
        tid. Ett klikk legger bedriften i pipelinen med org.nummer, adresse,
        stiftelsesdato, MVA-status, nettside og regnskapstall ferdig utfylt.
        Konkursbo og selskaper under avvikling er allerede luket bort, og bedrifter
        du har fra før merkes så du ikke legger dem inn to ganger.
      </p>
      <p style={s.p}>
        E-post og telefon hentes fra bedriftens egen nettside. Bare fellesadresser
        — aldri navngitte personer.
      </p>

      <h2 style={s.h2}>Hva søket ikke klarer</h2>
      <p style={s.p}>
        Det er verdt å si høyt: dette er ikke magi, og vi vil heller love for lite
        enn for mye.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong>Modellnavn er svake.</strong> Skriver du et smalt produktnavn i
          stedet for hva produktet er, gjetter modellen bredere enn den burde.
          Beskriv gjerne varen med vanlige ord i tillegg.
        </li>
        <li style={s.li}>
          <strong>Ikke alle publiserer e-post.</strong> Mange større bedrifter
          bruker kontaktskjema. Da finner vi ingen adresse, og lar feltet stå tomt
          i stedet for å gjette.
        </li>
        <li style={s.li}>
          <strong>Bransjekoden er ikke alltid riktig.</strong> Den settes av
          bedriften selv ved registrering og oppdateres sjelden. Et selskap kan ha
          endret virksomhet uten å melde fra.
        </li>
      </ul>
      <p style={s.p}>
        Søket erstatter ikke vurderingen din. Det tar bort ettermiddagen med
        googling, og gir deg en liste å bruke skjønn på.
      </p>

      <h2 style={s.h2}>Kom i gang</h2>
      <p style={s.p}>
        Kundesøket ligger øverst i pipelinen i Altiv og er med i alle pakker — det
        koster ikke noe ekstra. Du kan{" "}
        <Link href="/#priser" style={{ color: "var(--primary)" }}>
          prøve Altiv gratis i 14 dager
        </Link>{" "}
        og teste det på din egen kundegruppe.
      </p>
      <p style={s.p}>
        Vil du lese mer om hvordan du strukturerer salget etterpå, har vi skrevet
        om{" "}
        <Link href="/blogg/salgspipeline" style={{ color: "var(--primary)" }}>
          hvordan du bygger en salgspipeline selgerne faktisk bruker
        </Link>
        .
      </p>
    </ArticleLayout>
  );
}
