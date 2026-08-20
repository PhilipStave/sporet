import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { BLOG_POSTS } from "@/lib/blog";

const post = BLOG_POSTS.find((p) => p.slug === "excel-vs-crm")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blogg/${post.slug}` },
  openGraph: { title: post.title, description: post.description, type: "article", images: [post.image] },
};

export default function Page() {
  return (
    <ArticleLayout
      meta={{ slug: `blogg/${post.slug}`, kicker: "Blogg · Fra regneark til system", title: post.title, description: post.description, datePublished: post.datePublished, image: post.image, imageAlt: post.imageAlt }}
      related={[
        { href: "/blogg/hva-er-crm", label: "Hva er et CRM-system?" },
        { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
        { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
      ]}
    >
      <p style={s.lead}>
        La oss være ærlige: Excel er et utmerket CRM — for én person, med få kunder,
        som husker godt. Problemet er ikke Excel. Problemet er hva som skjer når
        bedriften vokser forbi det.
      </p>

      <h2 style={s.h2}>Når Excel fungerer helt fint</h2>
      <p style={s.p}>
        Hvis du er alene om salget, har under 30 aktive kundedialoger og sitter med
        regnearket åpent hver dag, trenger du ikke noe annet. Ikke bytt for å bytte.
        Et system du ikke trenger, er bare en ekstra ting å vedlikeholde.
      </p>

      <h2 style={s.h2}>Seks tegn på at regnearket har blitt et problem</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong>Det finnes flere versjoner.</strong> «Kunder_2026_v3_Anders.xlsx» og
          «Kunder_NY.xlsx» ligger side om side, og ingen vet hvilken som gjelder.
        </li>
        <li style={s.li}>
          <strong>Historikken mangler.</strong> Regnearket viser <em>status</em>, men ikke
          hva som ble sagt i forrige samtale, eller når. Det ligger i e-posten til noen.
        </li>
        <li style={s.li}>
          <strong>Oppfølginger glipper.</strong> Det står «følg opp» i en celle, men
          ingen får beskjed den dagen det skulle skjedd.
        </li>
        <li style={s.li}>
          <strong>Flere selgere, samme kunde.</strong> To personer ringer samme
          innkjøpssjef samme uke. Det ser uprofesjonelt ut, og det skjer fordi ingen
          så at den andre allerede hadde kontakt.
        </li>
        <li style={s.li}>
          <strong>Tallene tar tid.</strong> «Hvor mye har vi solgt for i år, per
          avdeling?» tar en time med filtre og SUMIF — og svaret er kanskje feil fordi
          noen skrev «250 000,-» i en tallkolonne.
        </li>
        <li style={s.li}>
          <strong>Folk slutter, og kundene forsvinner.</strong> Når selgeren som «hadde»
          kundene går, er alt som står igjen en kolonne med navn.
        </li>
      </ul>
      <p style={s.p}>
        Kjenner du igjen to eller flere? Da er regnearket allerede dyrere enn et
        system — du ser bare ikke regningen, fordi den kommer som tapte salg og
        bortkastet tid.
      </p>

      <h2 style={s.h2}>Hva et enkelt CRM gir deg i stedet</h2>
      <p style={s.p}>
        Poenget med å bytte er ikke «flere funksjoner». Det er at fire ting som er
        umulige i Excel blir automatiske:
      </p>
      <ul style={s.ul}>
        <li style={s.li}><strong>Én sannhet.</strong> Alle ser samme kunder, samme status, i sanntid. Ingen versjoner.</li>
        <li style={s.li}><strong>Historikk med tidsstempel.</strong> Hver samtale, hvert tilbud, logget med dato og hvem — på kunden, ikke i en innboks.</li>
        <li style={s.li}><strong>Neste steg som faktisk varsler.</strong> Dagens oppfølginger ligger øverst når du logger inn.</li>
        <li style={s.li}><strong>Tall uten regning.</strong> Solgt for, pipeline-verdi, margin, vinnrate, per selger og avdeling — alltid oppdatert.</li>
      </ul>

      <h2 style={s.h2}>«Men vi har prøvd CRM før, og ingen brukte det»</h2>
      <p style={s.p}>
        Dette er den vanligste grunnen til at bedrifter går <em>tilbake</em> til Excel, og
        den er nesten alltid den samme historien: man valgte et stort system, det tok
        tre uker å sette opp, det hadde femti felter per kunde, og selgerne opplevde det
        som rapportering til ledelsen — ikke som et verktøy for dem selv.
      </p>
      <p style={s.p}>
        Løsningen er ikke et bedre stort system. Det er et <strong>mindre</strong> system:
        færre felt, én skjerm per kunde, og logging som tar fem sekunder. Når verktøyet
        gjør selgerens egen dag enklere — «hva skal jeg gjøre i dag?» — blir det brukt.
        Det er hele filosofien bak{" "}
        <Link href="/hvorfor-altiv" style={{ color: "var(--accent)", fontWeight: 600 }}>Altiv</Link>.
      </p>

      <h2 style={s.h2}>Slik bytter du uten smerte</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong>Ikke flytt alt.</strong> Ta med de aktive kundene — de 20–100 det faktisk skjer noe med. Arkivet kan ligge i Excel.</li>
        <li style={s.li}><strong>Sett opp pipelinen først</strong>, med stegene dere faktisk bruker. (Se <Link href="/blogg/salgspipeline" style={{ color: "var(--accent)", fontWeight: 600 }}>artikkelen om salgspipeline</Link>.)</li>
        <li style={s.li}><strong>Kjør parallelt i to uker.</strong> Bruk prøveperioden med ekte kunder. Hvis selgerne logger inn på egen hånd i uke to, er dere i mål.</li>
        <li style={s.li}><strong>Legg ned regnearket.</strong> Ikke «begge deler» — da vinner Excel, fordi det er gammel vane.</li>
      </ul>

      <h2 style={s.h2}>Kort oppsummert</h2>
      <p style={s.p}>
        Excel holder så lenge én person husker alt. Når dere er flere, når oppfølginger
        begynner å glippe, og når tallene tar en time — da er det på tide. Velg det
        enkleste systemet som dekker behovet, og la det bevise seg i prøveperioden.
      </p>
    </ArticleLayout>
  );
}
