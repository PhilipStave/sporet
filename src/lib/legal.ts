// Legal texts for Altiv. Norwegian. Draft for review by a lawyer before large-scale sales.
// Update LEGAL_VERSION when the terms change materially — users re-accept on next login.

export const LEGAL_VERSION = "2026-08-18";
export const COMPANY_NAME = "Altiv"; // Update to the legal entity name + org.nr. when available.
export const CONTACT_EMAIL = "post@altiv.no";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export const TERMS: LegalSection[] = [
  {
    title: "1. Om tjenesten",
    paragraphs: [
      `Altiv («Tjenesten») er et nettbasert CRM-system for salgsoppfølging levert av ${COMPANY_NAME} («Leverandøren»). Ved å opprette en bedriftskonto, melde deg inn i en bedrift eller bruke Tjenesten, godtar du disse vilkårene på vegne av deg selv og den bedriften du representerer («Kunden»).`,
    ],
  },
  {
    title: "2. Prøveperiode, abonnement og betaling",
    paragraphs: [
      "Nye bedrifter får 14 dagers gratis prøveperiode. Ved valg av pakke registreres et betalingskort, og abonnementet starter automatisk når prøveperioden er over, med mindre det avbestilles før den tid. Avbestilling i prøveperioden er kostnadsfri.",
      "Abonnementet fornyes automatisk hver måned og faktureres forskuddsvis. Priser er oppgitt eksklusive merverdiavgift. Betaling håndteres av Stripe; Leverandøren lagrer aldri kortopplysninger.",
      "Kunden kan når som helst si opp abonnementet med virkning fra utløpet av inneværende betalingsperiode. Betalt vederlag refunderes ikke. Ved manglende betaling kan tilgangen begrenses til lesetilgang, og etter rimelig varsel stenges.",
    ],
  },
  {
    title: "3. Kundens ansvar",
    paragraphs: [
      "Kunden er ansvarlig for alle data som legges inn i Tjenesten, for at bruken er lovlig, og for at Kunden har rettslig grunnlag for å behandle personopplysninger om egne kontakter og kunder. Kunden er behandlingsansvarlig for slike opplysninger; Leverandøren er databehandler.",
      "Kunden er ansvarlig for å holde innloggingsopplysninger, bedriftskode og invitasjonslenker hemmelige, og for all aktivitet som skjer via Kundens brukerkontoer. Kunden må straks varsle Leverandøren ved mistanke om uautorisert tilgang.",
    ],
  },
  {
    title: "4. Tilgjengelighet og endringer",
    paragraphs: [
      "Tjenesten leveres «som den er» og «som tilgjengelig». Leverandøren tilstreber høy oppetid, men garanterer ikke at Tjenesten er feilfri eller uavbrutt. Leverandøren kan endre, forbedre eller avvikle funksjoner, og skal gi rimelig varsel ved vesentlige endringer.",
    ],
  },
  {
    title: "5. Ansvarsbegrensning",
    paragraphs: [
      "Så langt gjeldende rett tillater, er Leverandøren ikke ansvarlig for indirekte tap, følgetap, tapt fortjeneste, tapte data, driftsavbrudd eller tap som følge av tredjeparts handlinger — herunder datainnbrudd, datalekkasje, hacking, virus, feil hos underleverandører (som hosting- og betalingsleverandører) eller andre sikkerhetshendelser utenfor Leverandørens rimelige kontroll.",
      "Leverandørens samlede erstatningsansvar overfor Kunden for ethvert krav knyttet til Tjenesten er, så langt loven tillater, begrenset til det vederlaget Kunden har betalt for Tjenesten de siste 12 månedene før kravet oppstod.",
      "Kunden aksepterer at Kunden selv er ansvarlig for å ta ut sikkerhetskopier av egne data (f.eks. via CSV-eksport), og at Leverandøren ikke er ansvarlig for tap av data uansett årsak, med mindre tapet skyldes Leverandørens grove uaktsomhet eller forsett.",
      "Ansvarsbegrensningene gjelder ikke der de er i strid med ufravikelig lov, herunder ansvar for grov uaktsomhet eller forsett.",
    ],
  },
  {
    title: "6. Sikkerhet og personvern",
    paragraphs: [
      "Leverandøren iverksetter rimelige tekniske og organisatoriske tiltak for å beskytte data, herunder kryptert overføring, tilgangsstyring per bedrift og passordhashing. Ingen tjeneste er fullstendig sikker, og Kunden aksepterer denne restrisikoen. Behandling av personopplysninger er beskrevet i Personvernerklæringen, som er en del av disse vilkårene.",
    ],
  },
  {
    title: "7. Oppsigelse og sletting",
    paragraphs: [
      "Kunden kan når som helst slette bedriftskontoen fra Innstillinger. Da slettes alle Kundens data permanent, og kan ikke gjenopprettes. Leverandøren kan si opp avtalen ved vesentlig mislighold, herunder manglende betaling eller ulovlig bruk.",
    ],
  },
  {
    title: "8. Endringer i vilkårene",
    paragraphs: [
      "Leverandøren kan oppdatere vilkårene. Ved vesentlige endringer varsles Kunden i Tjenesten og må godta de nye vilkårene for fortsatt bruk. Gjeldende versjon er alltid tilgjengelig på altiv.no/vilkar.",
    ],
  },
  {
    title: "9. Lovvalg og tvister",
    paragraphs: [
      "Avtalen er underlagt norsk rett. Tvister søkes løst i minnelighet; ellers er Kundens hjemting verneting.",
    ],
  },
];

export const PRIVACY: LegalSection[] = [
  {
    title: "1. Behandlingsansvarlig og databehandler",
    paragraphs: [
      `${COMPANY_NAME} («vi») er behandlingsansvarlig for opplysninger om brukerne av Tjenesten (navn, e-post, telefon, innlogging). For opplysninger Kunden selv legger inn om sine kunder og kontakter er Kunden behandlingsansvarlig, og vi er databehandler etter Kundens instruks. Kontakt: ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "2. Hvilke opplysninger vi behandler",
    paragraphs: [
      "Brukeropplysninger: navn, e-postadresse, telefonnummer, rolle, bedriftstilknytning, passord (lagres kun som irreversibel hash) og innloggingstidspunkt.",
      "Kundedata som Kunden legger inn: selskapsnavn, kontaktpersoner, e-post, telefon, notater, verdier, aktivitetslogg og lignende.",
      "Betalingsopplysninger behandles av Stripe. Vi mottar kun kunde-ID, abonnementsstatus og fakturagrunnlag — aldri kortnummer.",
      "Tekniske data: IP-adresse og nettleserinformasjon i serverlogger, for drift og sikkerhet.",
    ],
  },
  {
    title: "3. Formål og rettslig grunnlag",
    paragraphs: [
      "Vi behandler opplysningene for å levere Tjenesten (avtale, GDPR art. 6 nr. 1 b), for fakturering og regnskap (rettslig forpliktelse, art. 6 nr. 1 c), og for drift, sikkerhet og forbedring (berettiget interesse, art. 6 nr. 1 f). Vi bruker ikke opplysningene til markedsføring overfor tredjeparter og selger dem aldri.",
    ],
  },
  {
    title: "4. Underleverandører",
    paragraphs: [
      "Vi bruker Supabase (database og autentisering, EU-region), Vercel (hosting) og Stripe (betaling). Disse behandler data på våre vegne under databehandleravtaler. Overføring utenfor EØS skjer i så fall med gyldig overføringsgrunnlag (EU-standardavtaler).",
    ],
  },
  {
    title: "5. Lagring og sletting",
    paragraphs: [
      "Opplysningene lagres så lenge Kunden har en aktiv konto. Når en bedrift slettes fra Innstillinger, slettes alle tilhørende data permanent. Regnskapspliktige opplysninger (fakturaer) oppbevares i henhold til bokføringsloven (5 år).",
    ],
  },
  {
    title: "6. Sikkerhet",
    paragraphs: [
      "Data overføres kryptert (TLS), er isolert per bedrift med tilgangskontroll på databasenivå (Row Level Security), og passord lagres kun som hash. Ved sikkerhetsbrudd som medfører risiko for de registrerte varsler vi Datatilsynet og berørte kunder i tråd med GDPR.",
    ],
  },
  {
    title: "7. Dine rettigheter",
    paragraphs: [
      `Du har rett til innsyn, retting, sletting, begrensning, dataportabilitet og til å protestere. Egne opplysninger kan endres under Innstillinger → Min profil; kundedata kan eksporteres til CSV. Henvendelser sendes til ${CONTACT_EMAIL}. Du kan også klage til Datatilsynet.`,
    ],
  },
  {
    title: "8. Informasjonskapsler",
    paragraphs: [
      "Tjenesten bruker kun nødvendige informasjonskapsler for innlogging og sikkerhet. Vi bruker ingen sporings- eller markedsføringskapsler.",
    ],
  },
];
