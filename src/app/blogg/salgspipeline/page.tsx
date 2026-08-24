import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { BLOG_POSTS } from "@/lib/blog";

const post = BLOG_POSTS.find((p) => p.slug === "salgspipeline")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blogg/${post.slug}` },
  openGraph: { title: post.title, description: post.description, type: "article", images: post.image ? [post.image] : undefined },
};

const stages = [
  ["Ny", "Vi vet at bedriften finnes og kan være aktuell. Ingen dialog ennå."],
  ["Kontaktet", "Vi har ringt, sendt e-post eller møtt dem. De vet hvem vi er."],
  ["Dialog", "De har svart, og det er en reell samtale om et behov."],
  ["Tilbud", "Vi har sendt et konkret tilbud med pris."],
  ["Forhandling", "De vil ha det, og vi diskuterer pris, omfang eller vilkår."],
  ["Vunnet / Tapt", "Avgjort. Begge er nyttige: tapt forteller deg hvor du mister kunder."],
];

export default function Page() {
  return (
    <ArticleLayout
      meta={{ slug: `blogg/${post.slug}`, kicker: "Blogg · Salgsprosess", title: post.title, description: post.description, datePublished: post.datePublished, image: post.image, imageAlt: post.imageAlt }}
      related={[
        { href: "/blogg/hva-er-crm", label: "Hva er et CRM-system?" },
        { href: "/blogg/excel-vs-crm", label: "Excel som CRM — når bør du bytte?" },
        { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
      ]}
    >
      <p style={s.lead}>
        En salgspipeline er bare en liste over stegene en kunde går gjennom fra
        første kontakt til signert avtale — og hvor hver kunde står akkurat nå. Den
        gir deg to ting: oversikt i dag, og en måte å se hvor salg stopper opp over tid.
      </p>

      <h2 style={s.h2}>Regel nummer én: få steg</h2>
      <p style={s.p}>
        Den vanligste feilen er for mange steg. «Kvalifisert», «Behovsavklart»,
        «Presentasjon holdt», «Beslutningstaker identifisert» … Hver ekstra kolonne er
        en ekstra avgjørelse selgeren må ta, og en ny mulighet for at to selgere
        tolker det forskjellig. Resultatet er en pipeline ingen stoler på.
      </p>
      <p style={s.p}>
        <strong>Fem til sju steg er nok</strong> for nesten all B2B-salg. Her er en mal
        som fungerer for de fleste norske bedrifter som selger til andre bedrifter
        eller det offentlige:
      </p>

      <div style={{ border: "1px solid var(--divider)", borderRadius: "var(--r-lg-land)", overflow: "hidden", margin: "0 0 18px" }}>
        {stages.map(([name, desc], i) => (
          <div
            key={name}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 160px) 1fr",
              gap: 14,
              padding: "12px 18px",
              borderTop: i ? "1px solid var(--divider)" : undefined,
              background: i % 2 ? "var(--surface)" : "transparent",
              fontSize: 16,
              lineHeight: 1.5,
            }}
          >
            <strong>{name}</strong>
            <span>{desc}</span>
          </div>
        ))}
      </div>

      <p style={s.p}>
        Legg merke til at hvert steg er definert av <em>noe som har skjedd</em> — ikke
        av en følelse. «Tilbud» betyr at et tilbud er sendt, ikke at «vi tror de vil ha
        tilbud snart». Det er regel nummer to.
      </p>

      <h2 style={s.h2}>Regel nummer to: én regel for hva som flytter kunden</h2>
      <p style={s.p}>
        For hvert steg, skriv én setning: «En kunde flyttes hit når ___.» Heng den opp,
        eller legg den i beskrivelsen av steget. Når alle bruker samme regel, kan du
        faktisk stole på tallene — og du kan sammenligne selgere og avdelinger på
        like vilkår.
      </p>

      <h2 style={s.h2}>Tilpass til deres prosess — men ikke for mye</h2>
      <p style={s.p}>
        Selger dere maskiner med befaring? Legg inn «Befaring» mellom Dialog og
        Tilbud. Har dere anbud? Kanskje «Anbud levert» i stedet for «Tilbud». Pipelinen
        skal speile <em>deres</em> salg, ikke en mal. Men hvis du kommer over åtte steg,
        stopp og spør: hvilke to kan slås sammen?
      </p>
      <p style={s.p}>
        Et godt CRM lar deg endre stegene selv, når som helst, uten konsulent. I{" "}
        <Link href="/hvorfor-altiv" style={{ color: "var(--accent)", fontWeight: 600 }}>Altiv</Link>{" "}
        gjør administrator det i Innstillinger på ett minutt — legg til, fjern, bytt navn,
        endre rekkefølge — og tavlen oppdateres for alle.
      </p>

      <h2 style={s.h2}>Hva du skal se etter i pipelinen</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong>Kunder som står stille.</strong> En kunde som har ligget i «Tilbud» i
          tre uker uten aktivitet, er enten glemt eller tapt. Begge deler bør du vite.
        </li>
        <li style={s.li}>
          <strong>Hvor det stopper.</strong> Hvis 80 % av kundene kommer til Tilbud og
          20 % til Vunnet, er det tilbudet eller prisen som er problemet — ikke
          førstekontakten. Det forteller deg hvor du skal bruke tid.
        </li>
        <li style={s.li}>
          <strong>Tid per steg.</strong> Hvor lenge ligger en typisk kunde i Dialog? I
          Forhandling? Når du kjenner normalen, ser du avvikene.
        </li>
        <li style={s.li}>
          <strong>Verdi per steg.</strong> Summen i Forhandling er det som trolig
          kommer inn neste måned. Summen i Ny er ønsketenkning. Vekt dem deretter.
        </li>
      </ul>

      <h2 style={s.h2}>Tre feil de fleste gjør</h2>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong>Å aldri markere tapt.</strong> Det føles som å innrømme nederlag, så
          kundene blir liggende. Da lyver pipelinen. Marker tapt — og skriv hvorfor i
          én linje. Det er den mest verdifulle dataen du har om seks måneder.
        </li>
        <li style={s.li}>
          <strong>Å ikke sette neste steg.</strong> Hver kunde i pipelinen bør ha en
          neste handling med dato. Ingen neste steg = ingen fremdrift.
        </li>
        <li style={s.li}>
          <strong>Å bygge pipelinen for ledelsen.</strong> Hvis pipelinen bare er noe
          selgerne fyller ut til mandagsmøtet, dør den. Den må hjelpe selgeren med
          «hva gjør jeg i dag?» — da holdes den oppdatert av seg selv.
        </li>
      </ul>

      <h2 style={s.h2}>Kort oppsummert</h2>
      <p style={s.p}>
        Fem til sju steg, definert av hva som faktisk har skjedd. Én regel per steg.
        Neste steg med dato på alle kunder. Marker tapt, og skriv hvorfor. Og velg et
        verktøy der dere kan endre stegene selv etter hvert som dere lærer — for den
        første pipelinen dere lager, er aldri den siste.
      </p>
    </ArticleLayout>
  );
}
