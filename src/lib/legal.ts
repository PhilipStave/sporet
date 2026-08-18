// Legal texts for Altiv. Norwegian. This is a carefully drafted starting point —
// have a lawyer with IT/privacy expertise review before large-scale sales.
// Update LEGAL_VERSION when the terms change materially — users re-accept on next login.

export const LEGAL_VERSION = "2026-08-18b";

// TODO: fill in when the company is registered (AS recommended).
export const COMPANY_LEGAL_NAME = "Altiv"; // e.g. "Altiv AS"
export const COMPANY_ORG_NR = ""; // e.g. "123 456 789"
export const COMPANY_ADDRESS = ""; // e.g. "Storgata 1, 0155 Oslo"
export const CONTACT_EMAIL = "post@altiv.no";

const companyLine = () =>
  [COMPANY_LEGAL_NAME, COMPANY_ORG_NR && `org.nr. ${COMPANY_ORG_NR}`, COMPANY_ADDRESS]
    .filter(Boolean)
    .join(", ");

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export const TERMS: LegalSection[] = [
  {
    title: "1. Parter og aksept",
    paragraphs: [
      `Disse vilkårene («Avtalen») regulerer bruk av den nettbaserte tjenesten Altiv («Tjenesten»), levert av ${companyLine()} («Leverandøren»). Avtalen inngås mellom Leverandøren og den virksomheten som oppretter eller er tilknyttet en bedriftskonto («Kunden»).`,
      "Den som oppretter en bedriftskonto, godtar Avtalen på vegne av Kunden og bekrefter å ha fullmakt til å binde Kunden. Ansatte som melder seg inn i en eksisterende bedriftskonto godtar Avtalen for egen bruk og bekrefter at de handler på vegne av Kunden. Aksept skjer ved avkrysning i registreringsskjemaet; tidspunkt og versjon lagres.",
      "Tjenesten er beregnet på næringsdrivende og offentlige virksomheter (B2B). Forbrukerkjøpsloven og angrerettloven kommer ikke til anvendelse.",
    ],
  },
  {
    title: "2. Tjenesten",
    paragraphs: [
      "Tjenesten er et CRM-system for salgsoppfølging: kunderegister, pipeline, aktivitetslogg, kalender, statistikk og brukeradministrasjon, som beskrevet på altiv.no. Leverandøren kan endre, forbedre eller fjerne funksjoner. Ved endringer som vesentlig reduserer Tjenestens funksjonalitet skal Kunden varsles med minst 30 dagers frist, og kan i så fall si opp med virkning fra endringstidspunktet.",
      "Leverandøren tilstreber høy tilgjengelighet, men garanterer ikke uavbrutt eller feilfri drift. Planlagt vedlikehold varsles der det er praktisk mulig. Tjenesten leveres «som den er». Prøveperioden gir Kunden anledning til å vurdere om Tjenesten dekker Kundens behov før betaling.",
    ],
  },
  {
    title: "3. Prøveperiode, abonnement og betaling",
    paragraphs: [
      "Nye bedriftskontoer får 14 dagers gratis prøveperiode med full funksjonalitet. Ved valg av pakke registreres et betalingskort. Abonnementet starter automatisk når prøveperioden utløper, med mindre Kunden avbestiller før den tid. Avbestilling i prøveperioden er kostnadsfri og medfører ingen belastning.",
      "Abonnementet løper månedlig, fornyes automatisk og faktureres forskuddsvis. Priser er oppgitt i norske kroner eksklusive merverdiavgift, og fremgår av altiv.no/#priser. Leverandøren kan endre priser med minst 30 dagers varsel; endringen gjelder fra neste fornyelse etter varselet.",
      "Betaling håndteres av Stripe. Leverandøren lagrer aldri kortopplysninger. Kunden er ansvarlig for at registrert betalingsmiddel er gyldig. Ved mislykket belastning kan Tjenesten settes i lesemodus, og etter 30 dager stenges. Betalt vederlag refunderes ikke, heller ikke ved oppsigelse midt i en periode.",
      "Kunden velger pakke etter antall brukere. Overstiges brukergrensen, kan Leverandøren kreve oppgradering til riktig pakke fra neste fornyelse.",
    ],
  },
  {
    title: "4. Kundens ansvar",
    paragraphs: [
      "Kunden er ansvarlig for alt innhold og alle data som legges inn i Tjenesten («Kundedata»), og for at bruken skjer i samsvar med gjeldende rett. Kunden garanterer å ha rettslig grunnlag for å behandle personopplysninger som legges inn (f.eks. om kontaktpersoner hos Kundens kunder), og at Kunden oppfyller sin informasjonsplikt overfor de registrerte.",
      "Kunden er behandlingsansvarlig for Kundedata; Leverandøren er databehandler. Behandlingen er regulert i Databehandleravtalen (punkt 7), som er en integrert del av Avtalen.",
      "Kunden er ansvarlig for å holde innloggingsopplysninger, bedriftskode og invitasjonslenker konfidensielle, og for all aktivitet via Kundens brukerkontoer. Kunden skal straks varsle Leverandøren ved mistanke om uautorisert tilgang. Brukerkontoer er personlige og skal ikke deles.",
      "Kunden skal ikke (a) forsøke å omgå sikkerhetsmekanismer, teste sårbarheter eller få tilgang til andre kunders data, (b) belaste Tjenesten unormalt (f.eks. automatiserte masseoppslag), (c) videreselge, leie ut eller tilby Tjenesten til tredjeparter, (d) kopiere, dekompilere eller lage avledede verk av Tjenesten, eller (e) bruke Tjenesten til ulovlig eller krenkende formål. Brudd gir Leverandøren rett til umiddelbar stenging.",
      "Kunden er selv ansvarlig for å ta sikkerhetskopi av Kundedata. Tjenesten tilbyr eksport til CSV for dette formålet.",
    ],
  },
  {
    title: "5. Immaterielle rettigheter",
    paragraphs: [
      "Leverandøren og dennes lisensgivere eier alle rettigheter til Tjenesten, herunder programvare, design, varemerker og dokumentasjon. Kunden får en begrenset, ikke-eksklusiv, ikke-overførbar rett til å bruke Tjenesten i avtaleperioden. Kunden beholder alle rettigheter til Kundedata. Leverandøren får en begrenset rett til å behandle Kundedata utelukkende for å levere Tjenesten.",
    ],
  },
  {
    title: "6. Ansvarsbegrensning",
    paragraphs: [
      "Så langt gjeldende rett tillater, er Leverandøren — herunder Leverandørens ansatte, eiere og underleverandører — ikke ansvarlig for indirekte tap eller følgetap, herunder tapt fortjeneste, tapt omsetning, tap av goodwill, tap eller korrumpering av data, driftsavbrudd, eller krav fra tredjeparter.",
      "Så langt gjeldende rett tillater, er Leverandøren ikke ansvarlig for tap som skyldes (a) datainnbrudd, datalekkasje, hacking, skadelig programvare eller andre sikkerhetshendelser der Leverandøren har iverksatt rimelige sikkerhetstiltak, (b) feil, avbrudd eller sikkerhetsbrudd hos underleverandører som hosting-, database- eller betalingsleverandør, (c) Kundens egen bruk, Kundedata, tap av innloggingsopplysninger eller uautorisert bruk av Kundens kontoer, (d) forhold hos Kunden eller tredjeparter, eller (e) hendelser utenfor Leverandørens rimelige kontroll (force majeure, punkt 10).",
      "Leverandørens samlede erstatningsansvar overfor Kunden for ethvert krav knyttet til Avtalen eller Tjenesten er, så langt loven tillater, begrenset til det vederlaget Kunden faktisk har betalt for Tjenesten i de siste 12 månedene før det ansvarsbetingende forholdet oppstod. I prøveperioden er ansvaret begrenset til 0 kr.",
      "Kunden skal holde Leverandøren skadesløs for krav fra tredjeparter, herunder de registrerte og tilsynsmyndigheter, som skyldes Kundens brudd på Avtalen, Kundedata, eller Kundens manglende rettslige grunnlag for behandling av personopplysninger.",
      "Krav mot Leverandøren må fremsettes skriftlig uten ugrunnet opphold, og senest 3 måneder etter at Kunden oppdaget eller burde ha oppdaget forholdet; ellers tapes kravet.",
      "Begrensningene i dette punktet gjelder ikke der de er i strid med ufravikelig lov, herunder ved Leverandørens grove uaktsomhet eller forsett.",
    ],
  },
  {
    title: "7. Personvern og databehandleravtale",
    paragraphs: [
      "Leverandøren behandler Kundedata kun etter Kundens dokumenterte instruks, som utgjøres av denne Avtalen og Kundens bruk av Tjenesten. Leverandøren skal (a) sikre at personer med tilgang er underlagt taushetsplikt, (b) iverksette egnede tekniske og organisatoriske sikkerhetstiltak, (c) bistå Kunden med å ivareta de registrertes rettigheter i den grad det er rimelig, (d) varsle Kunden uten ugrunnet opphold ved brudd på personopplysningssikkerheten, (e) slette eller tilbakelevere Kundedata ved avtalens opphør, og (f) gjøre tilgjengelig informasjon som er nødvendig for å påvise etterlevelse.",
      "Kunden godkjenner at Leverandøren bruker følgende underdatabehandlere: Supabase (database og autentisering), Vercel (hosting) og Stripe (betaling). Leverandøren skal varsle Kunden om planlagte endringer av underdatabehandlere med rimelig frist, og Kunden kan protestere på saklig grunnlag. Overføring utenfor EØS skjer kun med gyldig overføringsgrunnlag.",
      "Behandlingens art, formål, varighet og kategorier av opplysninger er beskrevet i Personvernerklæringen (altiv.no/personvern), som utgjør en del av Avtalen. Dette punktet og Personvernerklæringen utgjør sammen databehandleravtalen etter personvernforordningen artikkel 28. På forespørsel utsteder Leverandøren en signert databehandleravtale på eget dokument.",
    ],
  },
  {
    title: "8. Konfidensialitet",
    paragraphs: [
      "Partene skal bevare taushet om den annen parts konfidensielle informasjon, herunder Kundedata og ikke-offentlig informasjon om Tjenesten, og ikke bruke slik informasjon til andre formål enn oppfyllelse av Avtalen. Plikten gjelder også etter Avtalens opphør.",
    ],
  },
  {
    title: "9. Varighet, oppsigelse og sletting",
    paragraphs: [
      "Avtalen løper til den sies opp. Kunden kan når som helst si opp abonnementet i Innstillinger eller via Stripes kundeportal, med virkning fra utløpet av inneværende betalingsperiode.",
      "Kunden kan slette bedriftskontoen fra Innstillinger. Da slettes alle Kundedata, brukere og innstillinger permanent, og abonnementet avsluttes. Sletting kan ikke angres. Leverandøren anbefaler eksport av Kundedata før sletting.",
      "Leverandøren kan si opp Avtalen med 30 dagers varsel, og med umiddelbar virkning ved vesentlig mislighold — herunder manglende betaling etter purring, brudd på punkt 4, eller bruk som utsetter Leverandøren eller andre kunder for risiko. Ved opphør slettes Kundedata etter 30 dager, med mindre Kunden ber om tidligere sletting eller lovpålagt oppbevaring krever lengre tid.",
    ],
  },
  {
    title: "10. Force majeure",
    paragraphs: [
      "Ingen av partene er ansvarlig for manglende oppfyllelse som skyldes forhold utenfor partens rimelige kontroll, herunder strømbrudd, nettverksfeil, svikt hos underleverandører, cyberangrep av ekstraordinær karakter, naturkatastrofer, krig, streik eller offentlige pålegg. Den rammede part skal varsle den andre uten ugrunnet opphold. Varer hindringen mer enn 60 dager, kan hver av partene si opp Avtalen med umiddelbar virkning.",
    ],
  },
  {
    title: "11. Endringer i Avtalen",
    paragraphs: [
      "Leverandøren kan endre Avtalen. Endringer publiseres på altiv.no/vilkar med nytt versjonsnummer. Ved vesentlige endringer varsles Kunden i Tjenesten og må godta de nye vilkårene for fortsatt bruk; fortsatt bruk etter varsel anses som aksept. Endringer til Kundens ugunst trer tidligst i kraft 30 dager etter varsel, og Kunden kan si opp med virkning fra ikrafttredelsen.",
    ],
  },
  {
    title: "12. Overdragelse",
    paragraphs: [
      "Kunden kan ikke overdra Avtalen uten Leverandørens skriftlige samtykke. Leverandøren kan overdra Avtalen til et selskap i samme konsern eller i forbindelse med salg av virksomheten, mot varsel til Kunden.",
    ],
  },
  {
    title: "13. Lovvalg og tvister",
    paragraphs: [
      "Avtalen er underlagt norsk rett. Tvister skal søkes løst i minnelighet. Dersom det ikke lykkes, kan hver av partene bringe saken inn for de ordinære domstoler med Oslo tingrett som verneting, med mindre ufravikelig lov gir Kunden rett til å velge annet verneting.",
    ],
  },
  {
    title: "14. Kontakt",
    paragraphs: [
      `Spørsmål om Avtalen rettes til ${CONTACT_EMAIL}.`,
    ],
  },
];

export const PRIVACY: LegalSection[] = [
  {
    title: "1. Hvem vi er",
    paragraphs: [
      `${companyLine()} («vi») leverer Altiv. Vi er behandlingsansvarlig for opplysninger om brukerne av Tjenesten (kontoopplysninger). For opplysninger Kunden legger inn om sine egne kunder og kontakter er Kunden behandlingsansvarlig og vi databehandler; slik behandling er regulert i Vilkårenes punkt 7. Kontakt: ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "2. Hvilke opplysninger vi behandler",
    paragraphs: [
      "Kontoopplysninger: navn, e-postadresse, telefonnummer, rolle, bedriftstilknytning, avdeling, passord (lagres kun som irreversibel hash), tidspunkt for aksept av vilkår, og innloggingstidspunkt.",
      "Kundedata (på vegne av Kunden): selskapsnavn, kontaktpersoners navn, rolle, e-post og telefon, notater, verdier, steg i salgsprosessen, tags og aktivitetslogg — det Kunden selv velger å legge inn.",
      "Betalingsopplysninger behandles av Stripe. Vi mottar kun kunde-ID, abonnementsstatus og fakturagrunnlag (firmanavn, adresse, evt. mva-nummer) — aldri kortnummer.",
      "Tekniske data: IP-adresse, nettlesertype og tidspunkt i serverlogger, for drift, feilsøking og sikkerhet. Slettes automatisk etter maksimalt 90 dager.",
    ],
  },
  {
    title: "3. Formål og rettslig grunnlag",
    paragraphs: [
      "Levere og drifte Tjenesten, herunder innlogging, brukeradministrasjon og support — grunnlag: avtale (GDPR art. 6 nr. 1 b).",
      "Fakturering, regnskap og bokføring — grunnlag: rettslig forpliktelse (art. 6 nr. 1 c).",
      "Sikkerhet, misbruksforebygging, feilsøking og forbedring av Tjenesten — grunnlag: berettiget interesse (art. 6 nr. 1 f); vår interesse i en sikker og stabil tjeneste veier tungt, og behandlingen er begrenset til det nødvendige.",
      "Vi bruker ikke opplysningene til markedsføring uten samtykke, deler dem ikke med tredjeparter for deres formål, og selger dem aldri.",
    ],
  },
  {
    title: "4. Underleverandører og overføring",
    paragraphs: [
      "Vi bruker Supabase (database og autentisering), Vercel (hosting og drift) og Stripe (betaling). Alle er bundet av databehandleravtaler. Der data behandles utenfor EØS, sikres overføringen med EU-kommisjonens standardpersonvernbestemmelser (SCC) eller annet gyldig grunnlag.",
    ],
  },
  {
    title: "5. Lagringstid",
    paragraphs: [
      "Konto- og kundedata lagres så lenge Kunden har en aktiv bedriftskonto. Når en bedrift slettes fra Innstillinger, slettes alle tilhørende data permanent. Ved oppsigelse slettes data etter 30 dager. Fakturagrunnlag oppbevares i 5 år etter bokføringsloven. Serverlogger slettes etter maksimalt 90 dager.",
    ],
  },
  {
    title: "6. Sikkerhet",
    paragraphs: [
      "Data overføres kryptert (TLS) og lagres kryptert i hvile. Hver bedrifts data er isolert med tilgangskontroll på databasenivå (Row Level Security), slik at ingen bedrift kan se en annens data. Passord lagres kun som hash. Tilgang til produksjonssystemer er begrenset til autorisert personell. Ved brudd på personopplysningssikkerheten varsler vi Datatilsynet innen 72 timer der loven krever det, og berørte kunder uten ugrunnet opphold.",
    ],
  },
  {
    title: "7. Dine rettigheter",
    paragraphs: [
      `Du har rett til innsyn, retting, sletting, begrensning, dataportabilitet og til å protestere mot behandling basert på berettiget interesse. Egne kontoopplysninger endrer du under Innstillinger → Min profil. Kundedata kan eksporteres til CSV under Kunder. Andre henvendelser sendes til ${CONTACT_EMAIL}; vi svarer innen 30 dager. Du har også rett til å klage til Datatilsynet (datatilsynet.no).`,
      "Er du kontaktperson registrert av en av våre kunder, er det kunden (den behandlingsansvarlige) du bør henvende deg til; vi bistår kunden med å ivareta dine rettigheter.",
    ],
  },
  {
    title: "8. Informasjonskapsler",
    paragraphs: [
      "Tjenesten bruker kun strengt nødvendige informasjonskapsler for innlogging, sesjon og sikkerhet. Vi bruker ingen sporings-, analyse- eller markedsføringskapsler fra tredjeparter, og trenger derfor ikke samtykke til informasjonskapsler.",
    ],
  },
  {
    title: "9. Endringer",
    paragraphs: [
      "Vi kan oppdatere denne erklæringen. Gjeldende versjon ligger alltid på altiv.no/personvern. Ved vesentlige endringer varsler vi i Tjenesten.",
    ],
  },
];
