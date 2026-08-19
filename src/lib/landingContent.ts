// Expanded content shown when a landing-page card or screenshot is opened.

export interface DetailBlock {
  title: string;
  lead: string;
  bullets: string[];
  image?: string; // optional screenshot to show in the modal
  imageAlt?: string;
}

export const FEATURE_DETAILS: Record<string, DetailBlock> = {
  kontakt: {
    title: "Hver samtale logget",
    lead: "Aldri mer «hvem snakket sist med dem, og hva ble sagt?». Hver kontakt ligger på kunden — med dato, kanal og hvem som tok den.",
    bullets: [
      "Ett klikk logger telefon, e-post, SMS eller møte — direkte fra kundekortet",
      "Aktivitetsloggen viser hele historikken kronologisk, for hele teamet",
      "Kundens «kanal» oppdateres automatisk, så du ser hvordan dere pleier å nå dem",
      "Aktivitet-fanen samler alt på tvers av kunder — filtrer på selger, periode og søk i notater",
    ],
  },
  oppfolging: {
    title: "Neste steg med dato",
    lead: "Hver kunde har ett tydelig neste steg: hva, når og hvem. Ingen glipper.",
    bullets: [
      "Sett tekst, dato, klokkeslett og deltakere på «Neste steg» i kundekortet",
      "Kalenderen grupperer alt i Forfalt · I dag · I morgen · Denne uken · Senere",
      "Forfalte oppfølginger markeres rødt på kundekortet, i tavlen og i oversikten",
      "Marker som fullført med ett klikk — det skrives automatisk inn i aktivitetsloggen",
    ],
  },
  team: {
    title: "Avdelinger og selgere",
    lead: "Bygget for team som selger sammen: alle jobber i samme kundebase, men hver ser det som er relevant.",
    bullets: [
      "Del bedriften inn i avdelinger — filtrer hele systemet på én, flere eller alle",
      "«Bare meg» viser kun dine egne kunder; admin ser alt",
      "Overfør en kunde til en kollega med ett klikk (autocomplete på navn)",
      "Selgere-fanen viser hva hver selger har solgt, til hvilken sum og margin — klikk for detaljer",
      "Nye ansatte melder seg på med bedriftskode; admin godkjenner før de får tilgang",
    ],
  },
  tall: {
    title: "Omsetning og margin",
    lead: "Tallene dere faktisk styrer etter — uten å eksportere til Excel først.",
    bullets: [
      "Oversikten viser pipeline-verdi, solgt for (uke/måned/år), margin, vinnrate, snittverdi og oppfølginger som haster",
      "Klikk på et tall for å se nøyaktig hvilke kunder som ligger bak",
      "Statistikk per avdeling og selger, som søyler eller kumulativ linje, for uke, måned, år eller siste 12 måneder",
      "Margin i både prosent og kroner — per salg, per selger, per avdeling",
      "Eksporter kundelisten til CSV når som helst",
    ],
  },
};

export const STEP_DETAILS: Record<string, DetailBlock> = {
  "1": {
    title: "Sett opp bedriften",
    lead: "Administrator oppretter bedriften på under to minutter. Ingen installasjon, ingen IT-avdeling.",
    bullets: [
      "Bedriftsnavn, avdelinger og hvilke funksjoner teamet skal se (Kalender, Statistikk, Selgere, Kunder, Aktivitet)",
      "Din egen admin-bruker med e-post og passord",
      "14 dagers gratis prøve starter automatisk — full funksjonalitet, ingen kort kreves for å prøve",
      "Systemet starter tomt — ingen eksempeldata å rydde bort",
    ],
  },
  "2": {
    title: "Slipp inn teamet",
    lead: "Én bedriftskode til hele teamet — ingen manuell brukeropprettelse.",
    bullets: [
      "Finn bedriftskoden under Innstillinger og del den med de ansatte",
      "Ansatte går til «Bli med», søker opp bedriften, taster koden og lager sin egen bruker",
      "Du godkjenner hver ny bruker før de får tilgang — full kontroll",
      "Alternativt: send en personlig invitasjonslenke til én og én",
      "Hver bruker har egen innlogging; passord kan nullstilles av brukeren selv eller av admin",
    ],
  },
  "3": {
    title: "Legg inn kundene",
    lead: "Fra potensiell kunde til vunnet — alt i én tavle.",
    bullets: [
      "«Ny kunde» → bedriftsnavn, kontaktperson, avdeling — klar på fem sekunder",
      "Dra kortet mellom stegene: Potensiell → Kontaktet → I dialog → Tilbud sendt → Forhandling → Vunnet / Tapt",
      "Kundekortet samler kontaktinfo, verdi, margin, selger, tags, neste steg, notater og hele aktivitetsloggen",
      "Bytt mellom tavle og tabell; søk og filtrer på steg, avdeling, selger og periode",
    ],
  },
  "4": {
    title: "Følg tallene",
    lead: "Når dataene ligger inne, kommer innsikten av seg selv.",
    bullets: [
      "Oversikten gir deg nøkkeltallene i det du logger inn",
      "Statistikk viser trend per avdeling og selger over tid",
      "Selgere-fanen gjør det enkelt å se hvem som leverer — og følge opp de som trenger det",
      "Alt oppdateres i sanntid etter hvert som teamet jobber",
    ],
  },
};

export function planDetail(users: string, price: string): DetailBlock {
  return {
    title: `${users} · ${price} kr/mnd`,
    lead: "Alle pakker inneholder hele systemet — forskjellen er bare hvor mange brukere som kan logge inn. Velg den som passer teamet i dag; bytt når som helst.",
    bullets: [
      "14 dager gratis prøve — ingen trekk før prøveperioden er over",
      "Hele systemet: Pipeline, Oversikt, Kalender, Statistikk, Selgere, Kunder, Aktivitet",
      "Ubegrenset antall kunder, avdelinger og aktiviteter",
      "Egen isolert database for bedriften — ingen andre ser dataene deres",
      "CSV-eksport av alt når som helst",
      "Månedlig, ingen binding — avslutt når som helst i Innstillinger",
      "Pris eks. mva. Betaling med kort via Stripe, eller faktura på forespørsel",
    ],
  };
}

export const SCREENSHOT_DETAILS: Record<string, DetailBlock> = {
  oversikt: {
    title: "Oversikt",
    lead: "Det første du ser når du logger inn: seks nøkkeltall, pipeline per steg og oppfølgingene som haster.",
    bullets: [
      "Pipeline-verdi · Solgt for · Margin · Vinnrate · Snittverdi · Oppfølginger",
      "Klikk på et kort for å se kundene bak tallet",
      "Bytt periode (uke/måned/år) direkte på «Solgt for»",
    ],
    image: "/screenshots/02-app-oversikt.png",
    imageAlt: "Oversikt i Altiv",
  },
  pipeline: {
    title: "Pipeline",
    lead: "Kanban-tavle med dra-og-slipp. Hvert kort viser bedrift, verdi, kontakt, kanal og neste steg.",
    bullets: [
      "Forfalte neste steg markeres rødt",
      "Filtrer på deals (åpne/vunnet/tapt), avdeling, selger og periode",
      "Bytt til tabellvisning for sortering og oversikt",
    ],
    image: "/screenshots/01-app.png",
    imageAlt: "Pipeline i Altiv",
  },
  statistikk: {
    title: "Statistikk",
    lead: "Vunne salg over tid — per avdeling, som søyler eller kumulativ linje.",
    bullets: [
      "Velg avdelinger fritt; «Alle (total)» legger en stiplet totallinje over",
      "Uke, måned, år eller siste 12 måneder",
      "Klikk på et avdelingskort for å se salgene bak — med selger, produkt og margin",
    ],
    image: "/screenshots/02-app.png",
    imageAlt: "Statistikk i Altiv",
  },
  kunder: {
    title: "Kunder",
    lead: "Hele kunderegisteret i én tabell — søkbart, filtrerbart og eksporterbart.",
    bullets: [
      "Selskap, kontakt, produkt, selger, steg, verdi og sist oppdatert",
      "Filtrer på avdeling (flere samtidig), selger og periode; sorter nyeste/eldste",
      "Eksporter til CSV med ett klikk",
    ],
    image: "/screenshots/03-app.png",
    imageAlt: "Kunder i Altiv",
  },
};
