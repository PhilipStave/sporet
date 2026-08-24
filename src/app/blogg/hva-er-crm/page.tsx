import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { BLOG_POSTS } from "@/lib/blog";

const post = BLOG_POSTS.find((p) => p.slug === "hva-er-crm")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blogg/${post.slug}` },
  openGraph: { title: post.title, description: post.description, type: "article", images: post.image ? [post.image] : undefined },
};

export default function Page() {
  return (
    <ArticleLayout
      meta={{ slug: `blogg/${post.slug}`, kicker: "Blogg · CRM-grunnkurs", title: post.title, description: post.description, datePublished: post.datePublished, image: post.image, imageAlt: post.imageAlt }}
      related={[
        { href: "/blogg/excel-vs-crm", label: "Excel som CRM — når bør du bytte?" },
        { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
        { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
      ]}
    >
      <p style={s.lead}>
        CRM står for <em>Customer Relationship Management</em> — på norsk: kundeoppfølging
        satt i system. Det høres stort ut, men i praksis handler det om å svare på tre
        spørsmål: Hvem har vi snakket med? Hva ble sagt? Hva er neste steg?
      </p>

      <h2 style={s.h2}>Hva gjør et CRM-system egentlig?</h2>
      <p style={s.p}>
        Et CRM er et felles sted der alle i bedriften ser kundene og dialogen med dem.
        I stedet for at informasjonen ligger i hodet til én selger, i en e-posttråd og i
        et regneark på noens PC, ligger den ett sted alle kan åpne. Et CRM for små og
        mellomstore bedrifter gjør typisk fire ting:
      </p>
      <ul style={s.ul}>
        <li style={s.li}><strong>Kunderegister.</strong> Bedrift, kontaktperson, telefon, e-post, hva de er interessert i.</li>
        <li style={s.li}><strong>Pipeline.</strong> Hvor i salgsprosessen hver kunde er — fra første kontakt til vunnet eller tapt.</li>
        <li style={s.li}><strong>Aktivitetslogg.</strong> Hvem ringte, når, og hva ble avtalt. Og hva som er neste steg, med dato.</li>
        <li style={s.li}><strong>Statistikk.</strong> Hvor mye er solgt, hvor mye ligger i pipelinen, hvem selger mest, hvor lang tid tar et salg.</li>
      </ul>
      <p style={s.p}>
        De store systemene (Salesforce, HubSpot, SuperOffice, Dynamics) gjør mye mer:
        e-postkampanjer, markedsautomasjon, kundeservice, AI-prognoser. Det er nyttig
        for store salgsorganisasjoner — og helt unødvendig for de fleste bedrifter med
        2–50 ansatte.
      </p>

      <h2 style={s.h2}>Trenger en liten bedrift et CRM?</h2>
      <p style={s.p}>
        Tommelfingerregel: <strong>hvis mer enn én person snakker med kunder, og dere har
        flere enn 20–30 aktive kundedialoger samtidig, ja.</strong> Under det klarer de
        fleste seg med notater og hukommelse. Over det begynner ting å glippe:
      </p>
      <ul style={s.ul}>
        <li style={s.li}>Et tilbud ble sendt, men ingen fulgte opp.</li>
        <li style={s.li}>To selgere ringer samme kunde uten å vite om hverandre.</li>
        <li style={s.li}>En selger slutter, og kundehistorikken forsvinner med henne.</li>
        <li style={s.li}>Sjefen spør «hvor mye har vi i pipelinen?» og svaret tar en halv dag å regne ut.</li>
      </ul>
      <p style={s.p}>
        Hvert av disse koster penger — ofte mer enn et CRM koster på et år. Det er
        derfor selv små bedrifter går fra Excel til et system. (Vi har skrevet mer om
        akkurat det skiftet i{" "}
        <Link href="/blogg/excel-vs-crm" style={{ color: "var(--accent)", fontWeight: 600 }}>Excel som CRM — når bør du bytte?</Link>)
      </p>

      <h2 style={s.h2}>Hva bør du se etter?</h2>
      <p style={s.p}>
        Det viktigste kriteriet er ikke funksjonslisten. Det er <strong>om selgerne
        kommer til å bruke det.</strong> Et CRM med hundre funksjoner som ingen logger
        inn i, er verdt null. Se etter:
      </p>
      <ul style={s.ul}>
        <li style={s.li}><strong>Enkelt nok til at det tar sekunder å logge en samtale.</strong> Hvis det tar et minutt, blir det ikke gjort.</li>
        <li style={s.li}><strong>Én skjerm per kunde</strong> med alt du trenger — ikke fem faner.</li>
        <li style={s.li}><strong>Pipeline du kan tilpasse selv</strong> til deres salgsprosess, uten konsulent.</li>
        <li style={s.li}><strong>Tall som betyr noe:</strong> solgt for, margin, vinnrate, per selger og per avdeling.</li>
        <li style={s.li}><strong>Norsk</strong>, og data lagret i EU/EØS. Det forenkler personvern (GDPR) betraktelig.</li>
        <li style={s.li}><strong>Forutsigbar pris</strong> uten «kontakt oss for tilbud». Og mulighet til å prøve gratis først.</li>
      </ul>

      <h2 style={s.h2}>Hva koster et CRM?</h2>
      <p style={s.p}>
        De store systemene prises per bruker per måned — typisk 400–1 500 kr per
        bruker, ofte med oppstartskostnad og binding. Ti brukere blir fort 5 000–15 000
        kr i måneden. Enklere systemer som{" "}
        <Link href="/" style={{ color: "var(--accent)", fontWeight: 600 }}>Altiv</Link>{" "}
        prises per team (fra 790 kr/mnd for inntil 10 brukere, alt inkludert), fordi de
        er laget for bedrifter som ikke trenger — eller vil betale for — et helt
        markedsføringsmaskineri.
      </p>

      <h2 style={s.h2}>Kort oppsummert</h2>
      <p style={s.p}>
        Et CRM er et felles sted for kundene, dialogen og neste steg. Små bedrifter
        trenger ikke mye — men de trenger at det blir brukt. Velg det enkleste
        systemet som dekker behovet, prøv det gratis med ekte kunder i to uker, og se
        om selgerne faktisk logger inn uten å bli bedt om det. Det er testen.
      </p>
    </ArticleLayout>
  );
}
