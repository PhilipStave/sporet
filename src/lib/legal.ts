// Legal texts for Altiv. Norwegian. This is a carefully drafted starting point —
// have a lawyer with IT/privacy expertise review before large-scale sales.
// Update LEGAL_VERSION when the terms change materially — users re-accept on next login.

export const LEGAL_VERSION = "2026-08-19";

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
    title: "1. Parter, aksept og omfang",
    paragraphs: [
      `1.1 Parter. Disse vilkårene («Avtalen») regulerer bruk av den nettbaserte tjenesten Altiv («Tjenesten»), levert av ${companyLine()} («Leverandøren»). Avtalen inngås mellom Leverandøren og den virksomheten som oppretter eller er tilknyttet en bedriftskonto («Kunden»). Den som oppretter bedriftskontoen bekrefter å ha fullmakt til å binde Kunden.`,
      "1.2 Aksept. Aksept skjer ved avkrysning i registreringsskjemaet; tidspunkt og versjonsnummer lagres. Ansatte som melder seg inn i eller inviteres til en eksisterende bedriftskonto godtar Avtalen for egen bruk og bekrefter at de handler på vegne av Kunden.",
      "1.3 Omfang. Tjenesten er beregnet på næringsdrivende og offentlige virksomheter (B2B). Forbrukerkjøpsloven og angrerettloven kommer ikke til anvendelse.",
    ],
  },
  {
    title: "2. Tjenesten, endringer og tilgjengelighet",
    paragraphs: [
      "2.1 Tjenestebeskrivelse. Tjenesten er et CRM-system for salgsoppfølging: kunderegister, pipeline, aktivitetslogg, kalender, statistikk og brukeradministrasjon, som beskrevet på altiv.no.",
      "2.2 Endringer i funksjonalitet. Leverandøren kan endre, forbedre eller fjerne funksjoner. Ved endringer som vesentlig reduserer Tjenestens funksjonalitet skal Kunden varsles i Tjenesten eller skriftlig minst 30 dager før ikrafttredelse, og kan i så fall si opp med virkning fra endringstidspunktet.",
      "2.3 Tilgjengelighet. Leverandøren tilstreber høy tilgjengelighet, men gir ingen garanti for oppetid, svartid eller feilfri drift, og Avtalen inneholder ingen tjenestenivåavtale (SLA). Nedetid gir ikke rett til prisavslag eller erstatning utover det som følger av ufravikelig lov. Tjenesten leveres «som den er» og «som tilgjengelig», uten uttrykkelige eller underforståtte garantier om egnethet for et bestemt formål. Prøveperioden gir Kunden anledning til å vurdere om Tjenesten dekker Kundens behov før betaling.",
      "2.4 Support og vedlikehold. Support ytes per e-post i normal arbeidstid, uten garantert responstid. Planlagt vedlikehold varsles der det er praktisk mulig, og Leverandøren søker å begrense påvirkning i normal arbeidstid.",
    ],
  },
  {
    title: "3. Prøveperiode, abonnement og betaling",
    paragraphs: [
      "3.1 Prøveperiode. Nye bedriftskontoer får 14 dagers gratis prøveperiode med full funksjonalitet. Ved valg av pakke registreres et betalingskort. Abonnementet starter automatisk når prøveperioden utløper, med mindre Kunden avbestiller før den tid. Avbestilling i prøveperioden er kostnadsfri og medfører ingen belastning.",
      "3.2 Abonnement og fornyelse. Abonnementet løper månedlig, fornyes automatisk og faktureres forskuddsvis. Priser er oppgitt i norske kroner eksklusive merverdiavgift, og fremgår av altiv.no/#priser. Leverandøren kan endre priser med minst 30 dagers varsel; endringen gjelder fra neste fornyelse etter varselet.",
      "3.3 Betaling. Betaling håndteres av Stripe. Leverandøren lagrer aldri kortopplysninger. Kunden er ansvarlig for at registrert betalingsmiddel er gyldig. Ved mislykket belastning kan Tjenesten settes i lesemodus, og etter 30 dager stenges. Betalt vederlag refunderes ikke, heller ikke ved oppsigelse midt i en periode.",
      "3.4 Pakkevalg og brukergrenser. Kunden velger pakke etter antall brukere. Overstiges brukergrensen, kan Leverandøren kreve oppgradering til riktig pakke fra neste fornyelse.",
      "3.5 Lesemodus og sletting av passive kontoer. Velger Kunden ingen pakke innen prøveperiodens utløp, settes Tjenesten i lesemodus: Kunden kan se og eksportere sine data, men ikke opprette eller endre. Kunden kan når som helst velge en pakke for å gjenoppta full tilgang. Kontoer som har stått i lesemodus i mer enn 12 måneder kan slettes; før permanent sletting varsles Kunden skriftlig minst 90 dager i forveien og tilbys eksport av sine data.",
    ],
  },
  {
    title: "4. Kundens plikter og ansvar",
    paragraphs: [
      "4.1 Kundedata. Kunden er ansvarlig for alt innhold og alle data som legges inn i Tjenesten («Kundedata»), og for at bruken skjer i samsvar med gjeldende rett. Kunden garanterer å ha rettslig grunnlag for å behandle personopplysninger som legges inn (f.eks. om kontaktpersoner hos Kundens kunder), og at Kunden oppfyller sin informasjonsplikt overfor de registrerte. Kunden er behandlingsansvarlig for Kundedata; Leverandøren er databehandler etter punkt 7.",
      "4.2 Kontoansvar. Kunden skal holde innloggingsopplysninger, bedriftskode og invitasjonslenker konfidensielle, og er ansvarlig for all aktivitet via Kundens brukerkontoer. Kunden skal straks varsle Leverandøren ved mistanke om uautorisert tilgang. Brukerkontoer er personlige og skal ikke deles. Kunden skal holde administrators kontaktopplysninger oppdatert i Innstillinger; varsler fra Leverandøren sendes dit.",
      "4.3 Forbudte handlinger. Kunden skal ikke (a) forsøke å omgå sikkerhetsmekanismer, teste sårbarheter uten skriftlig samtykke, eller få tilgang til andre kunders data, (b) belaste Tjenesten unormalt (f.eks. automatiserte masseoppslag), (c) videreselge, leie ut eller tilby Tjenesten til tredjeparter, (d) kopiere, dekompilere eller lage avledede verk av Tjenesten, eller (e) bruke Tjenesten til ulovlig eller krenkende formål. Brudd gir Leverandøren rett til umiddelbar stenging.",
      "4.4 Sikkerhetskopi. Kunden er selv ansvarlig for å ta sikkerhetskopi av Kundedata. Tjenesten tilbyr eksport til CSV for dette formålet, og Leverandøren anbefaler regelmessig eksport av kritiske data.",
    ],
  },
  {
    title: "5. Immaterielle rettigheter og konfidensialitet",
    paragraphs: [
      "5.1 Immaterielle rettigheter. Leverandøren og dennes lisensgivere eier alle rettigheter til Tjenesten, herunder programvare, design, varemerker og dokumentasjon. Kunden får en begrenset, ikke-eksklusiv, ikke-overførbar rett til å bruke Tjenesten i avtaleperioden. Kunden beholder alle rettigheter til Kundedata. Leverandøren får en begrenset rett til å behandle Kundedata utelukkende for å levere Tjenesten.",
      "5.2 Konfidensialitet. Partene skal bevare taushet om den annen parts konfidensielle informasjon, herunder Kundedata og ikke-offentlig informasjon om Tjenesten, og ikke bruke slik informasjon til andre formål enn oppfyllelse av Avtalen. Plikten gjelder også etter Avtalens opphør.",
    ],
  },
  {
    title: "6. Ansvarsbegrensning",
    paragraphs: [
      "6.1 Indirekte tap. Så langt gjeldende rett tillater, er Leverandøren — herunder Leverandørens ansatte, eiere og underleverandører — ikke ansvarlig for indirekte tap eller følgetap, herunder tapt fortjeneste, tapt omsetning, tap av goodwill, tap eller korrumpering av data, driftsavbrudd, eller krav fra tredjeparter.",
      "6.2 Sikkerhetshendelser og tredjeparter. Så langt gjeldende rett tillater, er Leverandøren ikke ansvarlig for tap som skyldes (a) datainnbrudd, datalekkasje, hacking, skadelig programvare eller andre sikkerhetshendelser der Leverandøren har iverksatt rimelige sikkerhetstiltak, (b) feil, avbrudd eller sikkerhetsbrudd hos underleverandører som hosting-, database- eller betalingsleverandør, (c) Kundens egen bruk, Kundedata, tap av innloggingsopplysninger eller uautorisert bruk av Kundens kontoer, (d) forhold hos Kunden eller tredjeparter, eller (e) hendelser utenfor Leverandørens rimelige kontroll (force majeure, punkt 8.3).",
      "6.3 Ansvarstak. Leverandørens samlede erstatningsansvar overfor Kunden for ethvert krav knyttet til Avtalen eller Tjenesten er, så langt loven tillater, begrenset til det vederlaget Kunden faktisk har betalt for Tjenesten i de siste 12 månedene før det ansvarsbetingende forholdet oppstod. I prøveperioden er ansvaret begrenset til 0 kr.",
      "6.4 Skadesløsholdelse. Kunden skal holde Leverandøren skadesløs for krav fra tredjeparter, herunder de registrerte og tilsynsmyndigheter, som skyldes Kundens brudd på Avtalen, Kundedata, eller Kundens manglende rettslige grunnlag for behandling av personopplysninger.",
      "6.5 Reklamasjon og foreldelse. Krav mot Leverandøren må fremsettes skriftlig uten ugrunnet opphold, og senest 3 måneder etter at Kunden oppdaget eller burde ha oppdaget forholdet; ellers tapes kravet. Uansett foreldes alle krav 24 måneder etter at det ansvarsbetingende forholdet inntrådte, med mindre ufravikelig lov gir lengre frist.",
      "6.6 Ufravikelig lov. Begrensningene i dette punktet gjelder ikke der de er i strid med ufravikelig lov, herunder ved Leverandørens grove uaktsomhet eller forsett.",
    ],
  },
  {
    title: "7. Personvern og databehandleravtale",
    paragraphs: [
      "7.1 Roller og instruks. Leverandøren behandler Kundedata kun etter Kundens dokumenterte instruks, som utgjøres av denne Avtalen og Kundens bruk av Tjenesten. Dette punktet og Personvernerklæringen (altiv.no/personvern) utgjør sammen databehandleravtalen etter personvernforordningen artikkel 28. På forespørsel utsteder Leverandøren en signert databehandleravtale på eget dokument.",
      "7.2 Leverandørens plikter. Leverandøren skal (a) sikre at personer med tilgang er underlagt taushetsplikt, (b) iverksette egnede tekniske og organisatoriske sikkerhetstiltak, (c) bistå Kunden med å ivareta de registrertes rettigheter i den grad det er rimelig, (d) varsle Kunden som beskrevet i 7.4, (e) slette eller tilbakelevere Kundedata ved Avtalens opphør, og (f) gjøre tilgjengelig informasjon som er nødvendig for å påvise etterlevelse.",
      "7.3 Underdatabehandlere. Kunden godkjenner at Leverandøren bruker følgende underdatabehandlere: Supabase (database og autentisering), Vercel (hosting) og Stripe (betaling). Leverandøren skal ha skriftlige databehandleravtaler med alle underdatabehandlere, sikre at overføring utenfor EØS kun skjer med gyldig overføringsgrunnlag, varsle Kunden minst 30 dager før planlagt endring eller tillegg av underdatabehandler, og gi Kunden rett til å protestere på saklig grunnlag.",
      "7.4 Varsling ved sikkerhetsbrudd. Leverandøren varsler Kunden uten ugrunnet opphold, og senest 48 timer etter at Leverandøren ble kjent med et brudd på personopplysningssikkerheten som berører Kundedata, med den informasjon Leverandøren har på varslingstidspunktet, slik at Kunden kan overholde sin egen 72-timersfrist overfor Datatilsynet. Varsel sendes til administrators registrerte e-postadresse. Kunden er selv ansvarlig for eventuell melding til Datatilsynet og de registrerte, med mindre annet er avtalt skriftlig.",
      "7.5 Lagringstid og sletting. Konto- og kundedata lagres så lenge Kunden har en aktiv bedriftskonto. Ved sletting av bedriftskonto fra Innstillinger slettes alle tilhørende data permanent. Ved oppsigelse eller opphør slettes Kundedata etter 30 dager, med mindre Kunden ber om tidligere sletting. Fakturagrunnlag oppbevares i 5 år etter bokføringsloven. Øvrig lovpålagt oppbevaring ivaretas.",
    ],
  },
  {
    title: "8. Varighet, oppsigelse og force majeure",
    paragraphs: [
      "8.1 Kundens oppsigelse og sletting. Avtalen løper til den sies opp. Kunden kan når som helst si opp abonnementet i Innstillinger eller via Stripes kundeportal, med virkning fra utløpet av inneværende betalingsperiode. Kunden kan slette bedriftskontoen fra Innstillinger; da slettes alle Kundedata, brukere og innstillinger permanent og abonnementet avsluttes. Sletting kan ikke angres. Leverandøren anbefaler eksport av Kundedata før sletting.",
      "8.2 Leverandørens oppsigelse. Leverandøren kan si opp Avtalen med 30 dagers varsel, og med umiddelbar virkning ved vesentlig mislighold — herunder manglende betaling etter purring, brudd på punkt 4, eller bruk som utsetter Leverandøren eller andre kunder for risiko.",
      "8.3 Force majeure. Ingen av partene er ansvarlig for manglende oppfyllelse som skyldes forhold utenfor partens rimelige kontroll, herunder strømbrudd, nettverksfeil, svikt hos underleverandører, cyberangrep av ekstraordinær karakter, naturkatastrofer, krig, streik eller offentlige pålegg. Den rammede part skal varsle den andre uten ugrunnet opphold. Varer hindringen mer enn 60 dager, kan hver av partene si opp Avtalen med umiddelbar virkning.",
    ],
  },
  {
    title: "9. Endringer, hele avtalen og overdragelse",
    paragraphs: [
      "9.1 Endringer i Avtalen. Leverandøren kan endre Avtalen. Endringer publiseres på altiv.no/vilkar med nytt versjonsnummer. Ved vesentlige endringer varsles Kunden i Tjenesten og må godta de nye vilkårene for fortsatt bruk; fortsatt bruk etter varsel anses som aksept. Endringer til Kundens ugunst trer tidligst i kraft 30 dager etter varsel, og Kunden kan si opp med virkning fra ikrafttredelsen.",
      "9.2 Hele avtalen. Avtalen, med Personvernerklæringen og prisene på altiv.no, utgjør hele avtalen mellom partene og erstatter tidligere forståelser. Kundens egne standardvilkår, innkjøpsbetingelser eller bestillingsdokumenter gjelder ikke, selv om Leverandøren ikke uttrykkelig har avvist dem.",
      "9.3 Delvis ugyldighet. Skulle en bestemmelse i Avtalen bli kjent ugyldig eller ikke kunne håndheves, påvirker det ikke gyldigheten av de øvrige bestemmelsene. Den ugyldige bestemmelsen skal erstattes av en gyldig bestemmelse som ligger så nær den opprinnelige hensikten som mulig.",
      "9.4 Overdragelse. Kunden kan ikke overdra Avtalen uten Leverandørens skriftlige samtykke. Leverandøren kan overdra Avtalen til et selskap i samme konsern eller i forbindelse med salg av virksomheten, mot varsel til Kunden.",
    ],
  },
  {
    title: "10. Lovvalg, tvister og kontakt",
    paragraphs: [
      "10.1 Lovvalg og verneting. Avtalen er underlagt norsk rett. Tvister skal søkes løst i minnelighet. Dersom det ikke lykkes, kan hver av partene bringe saken inn for de ordinære domstoler med Oslo tingrett som verneting, med mindre ufravikelig lov gir Kunden rett til å velge annet verneting.",
      `10.2 Kontakt. Spørsmål om Avtalen, databehandleravtalen eller personvern rettes til ${CONTACT_EMAIL}.`,
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
