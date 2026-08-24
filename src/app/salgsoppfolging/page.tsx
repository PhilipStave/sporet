import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { SITE_URL } from "@/lib/site";

// Landing page targeting "salgsoppfølging" — the one commercial term altiv.no
// already reaches page one on. Deliberately a top-level path, not /blogg/*.

const TITLE = "Salgsoppfølging: slik følger du opp kunder uten å miste salg";
const DESCRIPTION =
  "Salgsoppfølging er alt som skjer mellom første kontakt og signert avtale. Her er hvorfor de fleste salg ryker i oppfølgingen, hva du bør logge, hvor lenge du bør følge opp — og hvordan du får det til å skje av seg selv.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/salgsoppfolging" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_URL}/salgsoppfolging`,
  },
};

const FAQ = [
  {
    q: "Hva er salgsoppfølging?",
    a: "Salgsoppfølging er arbeidet som skjer mellom første kontakt og signert avtale: å holde kontakten, svare på innvendinger, minne om tilbudet og sørge for at kunden tar en beslutning. Selve salget er som regel ikke det som avgjør — oppfølgingen er det.",
  },
  {
    q: "Hvor mange ganger bør man følge opp et tilbud?",
    a: "Som hovedregel til du får et svar — også når svaret er nei. De fleste gir seg etter én purring, mens kunden fortsatt ikke har bestemt seg. Tre til fem kontaktpunkter fordelt over noen uker er et rimelig utgangspunkt for et B2B-tilbud.",
  },
  {
    q: "Hvor lenge bør man vente før man følger opp?",
    a: "Første oppfølging bør skje innen to til tre virkedager etter at tilbudet er sendt, mens saken fortsatt er fersk hos kunden. Deretter kan du øke avstanden: en uke, så to, så en måned.",
  },
  {
    q: "Kan man drive salgsoppfølging i Excel?",
    a: "Ja, og mange gjør det. Excel fungerer så lenge én person følger opp noen få kunder. Det slutter å fungere når flere selgere skal dele informasjon, når noen slutter, eller når ingen lenger husker hvem som skulle ringe hvem.",
  },
  {
    q: "Hva bør logges på hver kunde?",
    a: "Hva som ble sagt, når det skjedde, hvem som snakket med kunden — og hva som er neste steg med dato. Det siste er det viktigste: en oppfølging uten dato blir sjelden gjort.",
  },
];

export default function SalgsoppfolgingPage() {
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
          slug: "salgsoppfolging",
          kicker: "Guide · Salgsoppfølging",
          title: TITLE,
          description: DESCRIPTION,
          datePublished: "2026-08-24",
          readMinutes: 8,
        }}
        related={[
          { href: "/blogg/hva-koster-crm", label: "Hva koster et CRM-system i Norge?" },
          { href: "/blogg/excel-vs-crm", label: "Excel eller CRM?" },
          { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
        ]}
      >
        <p style={s.lead}>
          De fleste salg går ikke tapt fordi tilbudet var for dyrt eller produktet feil. De går tapt
          fordi ingen fulgte opp. Kunden var interessert, fikk andre ting å tenke på, og så hørte de
          aldri fra deg igjen.
        </p>

        <section>
          <h2 style={s.h2}>Hva salgsoppfølging egentlig er</h2>
          <p style={s.p}>
            Salgsoppfølging er alt som skjer mellom første kontakt og signert avtale. Telefonen du
            tar en uke etter møtet. E-posten som minner om tilbudet. Spørsmålet om de har fått
            avklart budsjettet internt. Det er sjelden dramatisk arbeid, og det er nettopp derfor
            det blir nedprioritert.
          </p>
          <p style={s.p}>
            Selgere flest er gode i møtet. Det er tiden etterpå som skiller dem som treffer budsjett
            fra dem som ikke gjør det. Et tilbud som ligger ubesvart i tre uker er ikke et tapt
            salg — det er et salg ingen har tatt tak i.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Hvorfor oppfølgingen svikter</h2>
          <p style={s.p}>
            Nesten alltid av samme fire grunner, og ingen av dem handler om latskap:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>Ingen vet hva som er neste steg.</strong> Samtalen endte med «vi hører fra
              hverandre», og da er det ingen som eier ballen.
            </li>
            <li style={s.li}>
              <strong>Oppfølgingen har ingen dato.</strong> «Jeg må ringe dem snart» er ikke en
              avtale med seg selv. Det er en tanke som forsvinner.
            </li>
            <li style={s.li}>
              <strong>Informasjonen ligger i hodet på én person.</strong> Når vedkommende er på
              ferie eller slutter, er kundehistorikken borte.
            </li>
            <li style={s.li}>
              <strong>De nye kundene stjeler oppmerksomheten.</strong> Det er morsommere å ringe en
              ny prospekt enn å purre på et tilbud fra forrige måned — selv om purringen er verdt mer.
            </li>
          </ul>
          <p style={s.p}>
            Legg merke til at ingen av disse løses med mer motivasjon. De løses med en rutine som
            husker for deg.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Fem steg som gjør oppfølgingen forutsigbar</h2>
          <p style={s.p}>
            Dette er ikke en salgsmetodikk med eget navn. Det er minstekravet for at ingenting skal
            falle mellom stolene.
          </p>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>1. Avslutt alltid med et neste steg og en dato.</strong> Før du legger på:
              «Jeg ringer deg torsdag den 12.» Da finnes oppfølgingen, selv om du glemmer den.
            </li>
            <li style={s.li}>
              <strong>2. Skriv ned hva som ble sagt, samme dag.</strong> Ikke referat — to
              setninger. Hva de er opptatt av, og hva som må avklares.
            </li>
            <li style={s.li}>
              <strong>3. Følg opp første gang innen to–tre dager.</strong> Etter det er tilbudet
              nedover i innboksen, og hos kunden er saken kald.
            </li>
            <li style={s.li}>
              <strong>4. Øk avstanden gradvis.</strong> To dager, så en uke, så to uker, så en
              måned. Da er du til stede uten å mase.
            </li>
            <li style={s.li}>
              <strong>5. Avslutt saken når svaret er nei.</strong> Et ærlig nei er verdt mer enn ti
              åpne saker som aldri kommer noen vei — og pipelinen din blir sann igjen.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={s.h2}>Hvor lenge bør man egentlig følge opp?</h2>
          <p style={s.p}>
            Til du får et svar. Det er hele regelen. De aller fleste gir seg etter én purring, og de
            gir seg som regel før kunden har bestemt seg — ikke etter.
          </p>
          <p style={s.p}>
            Et rimelig utgangspunkt for et B2B-tilbud er tre til fem kontaktpunkter fordelt over
            noen uker. Er beløpet stort, eller skal flere personer inn i beslutningen, tåler det mer.
            Poenget er at du velger det bevisst, i stedet for at oppfølgingen bare stopper fordi
            ingen kom på å gjøre den.
          </p>
          <p style={s.p}>
            Én ting gjør hver oppfølging enklere: ha noe å komme med. En referanse fra en lignende
            kunde, et svar på noe de lurte på, en frist som nærmer seg. «Bare sjekker inn» er den
            svakeste e-posten i salg.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Hva du bør logge på hver kunde</h2>
          <p style={s.p}>
            Ikke alt. Fire ting holder, og de må være så enkle å registrere at det faktisk blir gjort:
          </p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Hva som ble sagt</strong> — kort, med dato.</li>
            <li style={s.li}><strong>Hvem som snakket med kunden</strong> — så neste person slipper å spørre.</li>
            <li style={s.li}><strong>Hvor saken står</strong> — er det et tilbud ute, eller bare en samtale?</li>
            <li style={s.li}><strong>Neste steg med dato</strong> — det ene feltet som avgjør om oppfølgingen skjer.</li>
          </ul>
          <p style={s.p}>
            Systemer som krever femten felter per kunde blir ikke brukt. Systemer som krever fire,
            blir det.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Excel, hodet eller CRM?</h2>
          <p style={s.p}>
            Alle tre fungerer — opp til et punkt.
          </p>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>Hodet</strong> holder til du har rundt ti aktive saker. Over det begynner ting
              å ryke, og du merker det ikke før kvartalet er over.
            </li>
            <li style={s.li}>
              <strong>Excel</strong> holder for én person. Problemet er ikke arket — det er at ingen
              andre ser det, at ingen får beskjed når noe forfaller, og at historikken forsvinner den
              dagen vedkommende slutter.
            </li>
            <li style={s.li}>
              <strong>CRM</strong> lønner seg når flere skal dele kundene, eller når du vil vite hva
              som faktisk ligger i pipelinen uten å spørre alle sammen.
            </li>
          </ul>
          <p style={s.p}>
            Terskelen går som regel ved to–tre selgere, eller ved det første salget som ryker fordi
            ingen fulgte opp. Det siste koster ofte mer enn CRM-et gjør på et helt år.
          </p>
        </section>

        <section>
          <h2 style={s.h2}>Slik ser salgsoppfølging ut i Altiv</h2>
          <p style={s.p}>
            Altiv er bygget rundt akkurat denne rutinen, og ikke stort mer:
          </p>
          <ul style={s.ul}>
            <li style={s.li}>
              <strong>Pipeline.</strong> Hver sak ligger i en fase du kan dra den mellom, så du ser
              på ett sekund hva som er i spill.
            </li>
            <li style={s.li}>
              <strong>Neste steg med dato.</strong> Settes på saken og dukker opp i kalenderen — også
              i Outlook, hvis du abonnerer på feeden.
            </li>
            <li style={s.li}>
              <strong>Automatisk e-postlogging.</strong> Sett Altiv på kopi, så havner e-posten i
              kundens aktivitetslogg uten at noen limer inn noe.
            </li>
            <li style={s.li}>
              <strong>Alt samlet på kunden.</strong> Samtaler, tilbud, dokumenter og hvem som
              snakket med dem sist.
            </li>
            <li style={s.li}>
              <strong>Omsetning og margin per selger og avdeling.</strong> Så du ser hvem som følger
              opp — og hvem som bare selger billig.
            </li>
          </ul>
          <p style={s.p}>
            Prisen er per team, ikke per bruker. Det betyr at det ikke koster mer å slippe inn hele
            salgsavdelingen, og det er som regel først da oppfølgingen faktisk blir felles.{" "}
            <Link href="/#priser" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Se prisene
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
