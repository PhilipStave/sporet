// Scheduled blog posts. Each entry renders through /blogg/[slug] and goes live on `datePublished`
// on its own — the index, sitemap and article page all hide posts with a future date.
// (The first three articles are hand-written pages under /blogg/<slug>/page.tsx instead.)

export type Section = {
  h2: string;
  /** Paragraphs before the bullet list. */
  paras?: string[];
  bullets?: { strong?: string; text: string }[];
  /** Paragraphs after the bullet list. */
  parasAfter?: string[];
};

export type ContentPost = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  readMinutes: number;
  kicker: string;
  lead: string;
  sections: Section[];
  related: { href: string; label: string }[];
};

export const CONTENT_POSTS: ContentPost[] = [
  {
    slug: "hva-koster-crm",
    title: "Hva koster et CRM-system i Norge? Priser og skjulte kostnader",
    description:
      "Prisene på CRM spenner fra noen hundrelapper til titusener i måneden. Her er hva de vanlige systemene faktisk koster i Norge, og hvilke kostnader som ikke står i prislisten.",
    datePublished: "2026-08-31",
    readMinutes: 6,
    kicker: "Blogg · Pris",
    lead: "Det korte svaret: mellom 500 og 15 000 kroner i måneden for en bedrift med ti selgere — avhengig av hvilket system du velger. Det lange svaret handler om alt som ikke står i prislisten.",
    sections: [
      {
        h2: "Slik prises CRM vanligvis",
        paras: [
          "Nesten alle CRM-systemer prises per bruker per måned. Har du ti selgere og prisen er 800 kr per bruker, betaler du 8 000 kr i måneden — 96 000 kr i året. Det er modellen som gjør at CRM oppleves som dyrt for små bedrifter: hver nye ansatt gjør regningen større.",
          "Noen få systemer, blant annet Altiv, prises per team i stedet. Da betaler du én sum for hele bedriften opp til et visst antall brukere, og det koster ikke mer å slippe inn hele salgsavdelingen.",
        ],
      },
      {
        h2: "Priser i det norske markedet (2026)",
        bullets: [
          { strong: "SuperOffice", text: "fra ca. 450 kr per bruker per måned, opp til 1 550 kr for de største pakkene. Ti brukere: 4 500–15 500 kr/mnd." },
          { strong: "HubSpot", text: "gratis nivå finnes, men reell salgsfunksjonalitet starter rundt 500–900 kr per bruker. Ti brukere: 5 000–9 000 kr/mnd." },
          { strong: "Pipedrive", text: "ca. 200–700 kr per bruker. Ti brukere: 2 000–7 000 kr/mnd." },
          { strong: "Microsoft Dynamics 365 Sales", text: "fra ca. 700 kr per bruker, men krever ofte konsulenthjelp for oppsett." },
          { strong: "Altiv", text: "790 kr i måneden for inntil ti brukere — hele systemet, uansett hvor mange som logger inn." },
        ],
        parasAfter: [
          "Alle prisene er eks. mva. Er bedriften mva-registrert, får dere mva-en tilbake, så det er tallene over som gjelder for lommeboken.",
        ],
      },
      {
        h2: "Kostnadene som ikke står i prislisten",
        paras: [
          "Lisensprisen er sjelden hele regningen. Dette er de fire som overrasker folk:",
        ],
        bullets: [
          { strong: "Oppsett og konsulent.", text: "De store systemene selges gjerne med implementeringsprosjekt. 20 000–150 000 kr er vanlig, og det er engangskostnaden folk glemmer når de sammenligner månedspris." },
          { strong: "Opplæring.", text: "Et system med hundre funksjoner krever kurs. Regn to timer per ansatt, pluss tiden det tar før de er trygge." },
          { strong: "Binding.", text: "Mange kontrakter er årlige og fornyes automatisk. Slutter dere å bruke systemet i mars, betaler dere ut året." },
          { strong: "Tapt tid.", text: "Den dyreste kostnaden er et system selgerne ikke bruker. Da betaler du full pris for null effekt — og mister i tillegg oversikten du trodde du kjøpte." },
        ],
      },
      {
        h2: "Hva er riktig pris for dere?",
        paras: [
          "Snu regnestykket: hva koster det å ikke ha oversikt? Ett glemt tilbud på 200 000 kr i året spiser opp hele CRM-budsjettet for en liten bedrift. Det skal svært lite til før et system som faktisk brukes har betalt seg.",
          "Tommelfingerregel: en bedrift med under 20 ansatte bør ikke betale mer enn 1 500–2 000 kr i måneden for salgsoppfølging. Over det begynner du å betale for markedsføringsautomasjon, kundeservicemoduler og AI-prognoser som dere sannsynligvis ikke kommer til å bruke.",
        ],
      },
      {
        h2: "Sjekkliste før du signerer",
        bullets: [
          { text: "Er prisen per bruker eller per team — og hva skjer når dere ansetter to til?" },
          { text: "Er det oppstartskostnad, og er den valgfri?" },
          { text: "Hvor lang binding, og hvordan sier man opp?" },
          { text: "Får dere prøve gratis med ekte kunder, ikke bare en demo noen viser dere?" },
          { text: "Kan dere ta med dere dataene ut igjen (CSV-eksport) hvis dere bytter?" },
        ],
        parasAfter: [
          "Får du gode svar på alle fem, er prisen sannsynligvis ærlig. Nøler leverandøren på det siste punktet, bør du bli mistenksom.",
        ],
      },
    ],
    related: [
      { href: "/blogg/hva-er-crm", label: "Hva er et CRM-system?" },
      { href: "/blogg/excel-vs-crm", label: "Excel som CRM — når bør du bytte?" },
      { href: "/#priser", label: "Prisene i Altiv" },
    ],
  },
  {
    slug: "beste-crm-smabedrifter",
    title: "Beste CRM for små bedrifter i Norge — en ærlig gjennomgang",
    description:
      "SuperOffice, HubSpot, Pipedrive eller noe enklere? Vi går gjennom hva som passer for norske bedrifter med 2–50 ansatte — inkludert når du bør velge noen andre enn oss.",
    datePublished: "2026-09-10",
    readMinutes: 7,
    kicker: "Blogg · Valg av system",
    lead: "Vi lager selv et CRM, så du skal lese dette med et snev av skepsis. Derfor har vi forsøkt å skrive den gjennomgangen vi selv ville lest: hva hvert system er godt til, og hvem det ikke passer for.",
    sections: [
      {
        h2: "Først: hva slags bedrift er dere?",
        paras: [
          "Det finnes ikke ett beste CRM. Det finnes et beste CRM for en bestemt måte å jobbe på. Kjenner du deg igjen i én av disse, er valget nesten tatt:",
        ],
        bullets: [
          { strong: "Få selgere, mange små salg, mye e-post.", text: "Dere trenger automatisering og e-postkampanjer. Se på HubSpot." },
          { strong: "Rene salgsteam med tydelig prosess og mange avtaler i løpet.", text: "Pipedrive er bygget for akkurat dette." },
          { strong: "Stor organisasjon, egne systemansvarlige, integrasjon mot ERP.", text: "SuperOffice eller Dynamics. De koster, men de tåler kompleksitet." },
          { strong: "5–50 ansatte som selger til bedrifter, og som i dag bruker Excel.", text: "Da trenger dere det enkleste som faktisk blir brukt — der hører Altiv hjemme." },
        ],
      },
      {
        h2: "SuperOffice",
        paras: [
          "Norsk-utviklet, markedsledende i Norden, og trolig det tryggeste valget hvis dere er over hundre ansatte. Sterkt på kundeservice, markedsføring og integrasjoner.",
          "Ulempen for en liten bedrift: prisen (fra ca. 450 kr per bruker per måned), salgsprosessen med «kontakt oss»-skjema i stedet for å prøve selv, og et grensesnitt som er laget for folk som bruker det hele dagen.",
        ],
      },
      {
        h2: "HubSpot",
        paras: [
          "Gratisnivået er sjenerøst og gjør at mange starter her. Best i klassen på innholdsmarkedsføring og e-postoppfølging.",
          "Fellen er prishoppene: det du faktisk trenger ligger gjerne i et dyrere nivå, og regningen vokser raskt når kontaktlisten gjør det. Passer best hvis markedsføring, ikke bare salg, er en stor del av jobben.",
        ],
      },
      {
        h2: "Pipedrive",
        paras: [
          "Enkelt, visuelt og laget rundt pipelinen. Godt valg for team som selger mye og trenger struktur på mange samtidige avtaler.",
          "Grensesnittet er på engelsk for mange funksjoner, og prisen er fortsatt per bruker. For en bedrift der bare tre av ti ansatte selger regelmessig, betaler dere for stoler ingen sitter i.",
        ],
      },
      {
        h2: "Altiv",
        paras: [
          "Vårt eget. Bygget for norske B2B-bedrifter som vil ha oversikt uten å ansette en systemansvarlig: pipeline, kontaktlogg, neste steg, statistikk med margin per selger og avdeling. Pris per team fra 790 kr i måneden, alt inkludert.",
          "Vi sier det rett ut: trenger dere e-postkampanjer til tusenvis av mottakere, kundeservice med ticketing, eller dyp ERP-integrasjon fra dag én — velg noen av de andre. Altiv er laget for å gjøre én ting godt: at ingen kunde blir glemt, og at ledelsen ser tallene.",
        ],
      },
      {
        h2: "Slik tester du før du bestemmer deg",
        bullets: [
          { strong: "Bruk ekte kunder, ikke demodata.", text: "Legg inn de 20 mest aktive og kjør i to uker." },
          { strong: "La selgerne teste, ikke bare ledelsen.", text: "Det er de som avgjør om systemet lever." },
          { strong: "Mål én ting:", text: "logger de inn frivillig i uke to? Hvis ja, har dere funnet riktig system." },
          { strong: "Sjekk utveien.", text: "Får dere dataene ut igjen? Alt annet er innlåsing." },
        ],
        parasAfter: [
          "De fleste velger feil fordi de sammenligner funksjonslister. Funksjoner ingen bruker er verdt null. Sammenlign i stedet hvor lang tid det tar å logge en telefonsamtale — den forskjellen avgjør alt.",
        ],
      },
    ],
    related: [
      { href: "/blogg/hva-koster-crm", label: "Hva koster et CRM-system?" },
      { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
      { href: "/blogg/excel-vs-crm", label: "Excel som CRM" },
    ],
  },
  {
    slug: "crm-entreprenor-maskin",
    title: "CRM for entreprenører og maskinforhandlere: hva som faktisk trengs",
    description:
      "Salg i bygg, anlegg og maskin har lange løp, befaringer og anbud. Her er hvordan en salgsprosess i den bransjen bør settes opp — og hvilke tall ledelsen bør følge.",
    datePublished: "2026-09-20",
    readMinutes: 6,
    kicker: "Blogg · Bransje",
    lead: "Selger du maskiner, entreprenørtjenester eller utstyr til bygg og anlegg, ser salgsprosessen helt annerledes ut enn i et programvareselskap. Færre kunder, større beløp, lengre løp — og en befaring i midten.",
    sections: [
      {
        h2: "Hva som er annerledes i denne bransjen",
        bullets: [
          { strong: "Lange salgsløp.", text: "Fra første kontakt til signert kontrakt kan det gå et halvt år. Uten et system er det umulig å huske hvem som ventet på hva." },
          { strong: "Befaring og teknisk avklaring.", text: "Salget stopper ofte opp mellom «interessert» og «tilbud» fordi noen må ut og se." },
          { strong: "Anbud med frister.", text: "Å bomme på en frist er å tape jobben, uansett hvor godt tilbudet var." },
          { strong: "Store beløp, få avtaler.", text: "Én tapt kunde utgjør en reell del av årsresultatet — derfor er oppfølging viktigere enn volum." },
          { strong: "Flere avdelinger.", text: "Bane, vei, betong og industri selger til ulike kunder, men ledelsen vil se totalen." },
        ],
      },
      {
        h2: "En pipeline som passer",
        paras: [
          "Standardoppsettet i de fleste CRM passer dårlig. Vi anbefaler disse stegene for bygg, anlegg og maskin:",
        ],
        bullets: [
          { strong: "Potensiell kunde", text: "— vi vet de finnes og at behovet kan være der." },
          { strong: "Kontaktet", text: "— ringt eller møtt. De vet hvem dere er." },
          { strong: "Befaring avtalt", text: "— det viktigste steget i bransjen. Alt som står her har en dato." },
          { strong: "Tilbud sendt", text: "— konkret pris ute hos kunden." },
          { strong: "Forhandling", text: "— de vil ha det, dere diskuterer pris eller omfang." },
          { strong: "Vunnet / Tapt", text: "— og skriv alltid hvorfor når det er tapt." },
        ],
        parasAfter: [
          "Kjører dere anbud mot det offentlige, bytt «Tilbud sendt» med «Anbud levert» og legg frist som neste steg med dato. Da ser hele teamet hva som forfaller denne uken.",
        ],
      },
      {
        h2: "Tallene ledelsen bør se",
        bullets: [
          { strong: "Margin, ikke bare omsetning.", text: "I denne bransjen kan en stor jobb med dårlig margin være verre enn tre små med god. Følg margin i både kroner og prosent, per selger og per avdeling." },
          { strong: "Verdi i pipeline per avdeling.", text: "Sier noe om hva neste kvartal ser ut som, lenge før fakturaene kommer." },
          { strong: "Vinnrate.", text: "Vinner dere 8 av 10 befaringer, men bare 2 av 10 anbud, vet dere hvor tiden bør brukes." },
          { strong: "Tid per steg.", text: "Ligger kundene tre uker i «Tilbud sendt» uten aktivitet, er det der pengene forsvinner." },
        ],
      },
      {
        h2: "Tre grep som gir mest med minst innsats",
        bullets: [
          { strong: "Neste steg med dato på alle aktive kunder.", text: "Ingen unntak. En kunde uten neste steg er en kunde ingen jobber med." },
          { strong: "Logg befaringer og telefoner samme dag.", text: "Tar fem sekunder i et enkelt system, og redder deg når kunden ringer tre måneder senere." },
          { strong: "Legg tilbudet på kunden, ikke i innboksen.", text: "Når kollegaen er på ferie, skal hvem som helst kunne se hva som ble tilbudt." },
        ],
        parasAfter: [
          "Det er ikke mer avansert enn dette. Bransjen taper ikke jobber fordi CRM-et mangler AI — den taper dem fordi noen glemte å ringe tilbake i uke 34.",
        ],
      },
    ],
    related: [
      { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
      { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
      { href: "/blogg/hva-er-crm", label: "Hva er et CRM-system?" },
    ],
  },
  {
    slug: "far-selgerne-til-a-bruke-crm",
    title: "Hvordan få selgerne til å faktisk bruke CRM-systemet",
    description:
      "De fleste CRM-prosjekter feiler ikke på teknikken, men på at ingen bruker systemet. Her er hvorfor det skjer, og de fem grepene som faktisk endrer vanen.",
    datePublished: "2026-09-30",
    readMinutes: 6,
    kicker: "Blogg · Innføring",
    lead: "Et CRM ingen logger inn i, er en kostnad uten inntekt. Og det er ikke fordi selgerne er vrange — det er nesten alltid fordi systemet ble innført for ledelsens skyld, ikke for deres.",
    sections: [
      {
        h2: "Hvorfor det går galt",
        paras: [
          "Mønsteret er nesten alltid det samme. Ledelsen vil ha oversikt. Det kjøpes et system med mange felter. Selgerne får beskjed om å fylle inn. Etter tre uker er dataene halvferdige, og ingen stoler på dem lenger.",
          "Problemet er at systemet ble en rapporteringsplikt. Ingen gjør frivillig ekstraarbeid som bare gagner andre.",
        ],
      },
      {
        h2: "Grep 1: Gjør det raskere enn alternativet",
        paras: [
          "Hvis det tar lengre tid å logge en telefonsamtale enn å skrive den på en gul lapp, taper systemet. Punktum. Krev at logging tar under ti sekunder — ett klikk for kanal, én linje med notat. Alt annet er for mye.",
        ],
      },
      {
        h2: "Grep 2: Færre felter, ikke flere",
        paras: [
          "Hvert obligatoriske felt er en grunn til å utsette. Start med det minimale: bedrift, kontaktperson, verdi, steg, neste steg. Legg til flere først når noen faktisk savner dem — det skjer sjeldnere enn du tror.",
        ],
      },
      {
        h2: "Grep 3: La systemet svare på «hva gjør jeg i dag?»",
        paras: [
          "Dette er vippepunktet. Når en selger logger inn og umiddelbart ser sine egne forfalte oppfølginger, blir systemet et verktøy for dem — ikke en rapport til sjefen. Da åpnes det frivillig hver morgen.",
          "Praktisk: sørg for at alle aktive kunder har et neste steg med dato, og at dagens liste er det første man ser.",
        ],
      },
      {
        h2: "Grep 4: Ledelsen må slutte å spørre utenom systemet",
        paras: [
          "Så lenge sjefen spør «hvordan går det med Nordic Steel?» på mandagsmøtet, er systemet valgfritt. Still spørsmålet med skjermen åpen i stedet: «jeg ser tilbudet er ni dager gammelt — hva er neste steg?»",
          "Det høres smått ut, men det er den enkeltendringen som oftest avgjør om et CRM overlever.",
        ],
      },
      {
        h2: "Grep 5: Start smalt og vis gevinsten",
        bullets: [
          { strong: "Flytt bare aktive kunder.", text: "20–100 stykker. Arkivet kan bli i Excel." },
          { strong: "Kjør to uker parallelt.", text: "Ikke tving noe før verdien er synlig." },
          { strong: "Vis ett tall som ble bedre.", text: "«Vi hadde 14 tilbud liggende uten oppfølging — nå har vi to.»" },
          { strong: "Legg ned regnearket etterpå.", text: "To systemer betyr at det gamle vinner, fordi det er vanen." },
        ],
      },
      {
        h2: "Testen etter fire uker",
        paras: [
          "Én enkel måling: logger selgerne inn uten å bli bedt om det? Hvis ja, er dere i mål — resten kommer av seg selv. Hvis nei, er det nesten alltid grep 1 eller 3 som mangler, ikke motivasjonen deres.",
        ],
      },
    ],
    related: [
      { href: "/blogg/excel-vs-crm", label: "Excel som CRM — når bør du bytte?" },
      { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
      { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
    ],
  },
  {
    slug: "margin-per-selger",
    title: "Margin per selger: tallet som avslører hvem som faktisk tjener penger",
    description:
      "Den som selger mest er ikke alltid den som tjener mest for bedriften. Slik måler du margin per selger og avdeling — og hva du gjør med tallene.",
    datePublished: "2026-10-10",
    readMinutes: 5,
    kicker: "Blogg · Tall og oppfølging",
    lead: "De fleste bedrifter måler selgerne på omsetning. Det er en av de vanligste grunnene til at et godt salgsår gir et middelmådig resultat.",
    sections: [
      {
        h2: "Hvorfor omsetning alene lyver",
        paras: [
          "To selgere selger for tre millioner hver. Den ene med 12 % margin, den andre med 24 %. Den første bidrar med 360 000 kroner, den andre med 720 000 — dobbelt så mye, med samme omsetning.",
          "Måler du bare topplinjen, premierer du den som gir mest rabatt for å lande avtalen. Over tid lærer hele salgsavdelingen at prisen er forhandlingsbar, og marginen faller for alle.",
        ],
      },
      {
        h2: "De to tallene du trenger",
        bullets: [
          { strong: "Margin i kroner.", text: "Hva selgeren faktisk bidro med til bedriften. Dette er tallet som betaler lønninger." },
          { strong: "Margin i prosent.", text: "Hvor godt de holder på prisen. Avslører hvem som rabatterer for å komme i mål." },
        ],
        parasAfter: [
          "Se dem sammen. Høy prosent og lave kroner betyr en flink prisholder med for få avtaler. Lave prosenter og høye kroner betyr en volumselger som kanskje gir bort for mye. Begge deler er nyttig å vite — og begge løses forskjellig.",
        ],
      },
      {
        h2: "Slik gjør du det i praksis",
        bullets: [
          { text: "Legg inn margin i prosent på hver avtale når verdien registreres. Ett felt, tar fem sekunder." },
          { text: "La systemet regne ut kronene — ingen skal sitte i Excel." },
          { text: "Se margin per selger og per avdeling, ikke bare for bedriften samlet." },
          { text: "Sammenlign over tid: går marginen ned tre måneder på rad, er det et prissignal, ikke tilfeldighet." },
        ],
        parasAfter: [
          "I Altiv ligger dette på Selgere- og Avdelinger-sidene: du sorterer på margin i kroner eller prosent, og ser rangeringen umiddelbart.",
        ],
      },
      {
        h2: "Hva du gjør med tallene",
        bullets: [
          { strong: "Ikke heng ut noen.", text: "Rangeringer motiverer bare når de brukes til å lære, ikke til å straffe." },
          { strong: "Spør den beste hvordan.", text: "Den med høyest margin har som regel en konkret måte å håndtere prispress på. Den kunnskapen er gratis å dele." },
          { strong: "Se på hvilke kunder, ikke bare hvem.", text: "Ofte er det bransjen eller produktet som styrer marginen, ikke selgeren." },
          { strong: "Sett et gulv.", text: "En laveste tillatte margin uten godkjenning fjerner mye ubevisst rabattering." },
        ],
      },
      {
        h2: "Kort oppsummert",
        paras: [
          "Omsetning viser aktivitet. Margin viser verdi. Måler du begge, ser du forskjellen på en selger som er flink til å selge, og en som er flink til å tjene penger — og du oppdager det tidsnok til å gjøre noe med det.",
        ],
      },
    ],
    related: [
      { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
      { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
      { href: "/blogg/hva-er-crm", label: "Hva er et CRM-system?" },
    ],
  },
  {
    slug: "folge-opp-tilbud",
    title: "Tilbudet er sendt — og så blir det stille. Slik følger du opp",
    description:
      "De fleste tapte salg dør i stillheten etter at tilbudet er sendt. Her er en enkel oppfølgingsrytme som ikke oppleves som mas, og hva du gjør når kunden ikke svarer.",
    datePublished: "2026-10-20",
    readMinutes: 5,
    kicker: "Blogg · Oppfølging",
    lead: "Du har brukt tre uker på å lage tilbudet. Kunden sa det så bra ut. Så hører du ingenting. To måneder senere står det fortsatt «tilbud sendt» — og du vet egentlig ikke om avtalen er død eller bare glemt.",
    sections: [
      {
        h2: "Hvorfor det blir stille",
        paras: [
          "Nesten aldri fordi kunden har bestemt seg mot dere. Langt vanligere: kontaktpersonen venter på en beslutning internt, har fått andre oppgaver, eller er usikker på ett punkt i tilbudet og utsetter samtalen.",
          "Alle tre løses av at du tar kontakt igjen. Likevel er det nettopp der de fleste stopper, fordi det føles som mas.",
        ],
      },
      {
        h2: "En rytme som fungerer",
        bullets: [
          { strong: "Dag 0 — når du sender.", text: "Avtal neste kontaktpunkt med én gang: «Jeg ringer deg torsdag i neste uke hvis jeg ikke hører noe før.» Da er ikke oppfølgingen mas, den er avtalt." },
          { strong: "Dag 3 — kort sjekk.", text: "«Fikk du åpnet tilbudet? Si fra hvis noe er uklart.» Lav terskel å svare på." },
          { strong: "Dag 7–10 — ring.", text: "Ikke e-post. En telefon gir svar, også når svaret er «vi utsetter»." },
          { strong: "Dag 21 — gi verdi.", text: "Send noe nyttig i stedet for å spørre igjen: et referanseprosjekt, en oppdatert leveringstid." },
          { strong: "Dag 45 — den avklarende.", text: "«Skal jeg legge denne på is, eller er den fortsatt aktuell?» Folk svarer overraskende ofte på et spørsmål som gir dem en enkel utvei." },
        ],
      },
      {
        h2: "Det viktigste enkeltgrepet",
        paras: [
          "Hver kunde du har sendt tilbud til skal ha et neste steg med dato. Ikke «følge opp senere» — en konkret dato og en konkret handling. Uten det er oppfølgingen avhengig av at noen husker, og hukommelse taper alltid mot en travel uke.",
          "Dette er også grunnen til at oppfølging er den funksjonen som betaler for et CRM raskest: ett reddet tilbud i året dekker som regel hele abonnementet mange ganger.",
        ],
      },
      {
        h2: "Når du skal gi deg",
        paras: [
          "Etter fem–seks forsøk uten respons er sannsynligheten liten. Da markerer du som tapt og skriver hvorfor i én linje — «ingen respons etter tilbud», «valgte konkurrent på pris», «utsatt til neste budsjettår».",
          "Det føles som å gi opp. Det er det motsatte: om seks måneder er det denne loggen som forteller deg om dere taper på pris, på leveringstid, eller bare på at ingen ringte tilbake. Uten tapt-årsaker er det umulig å bli bedre.",
        ],
      },
      {
        h2: "Kort oppsummert",
        paras: [
          "Avtal neste kontakt allerede når du sender. Sett dato på alt. Ring i stedet for å sende enda en e-post. Og marker tapt når det er tapt — det er den ærligheten som gjør pipelinen verdt å stole på.",
        ],
      },
    ],
    related: [
      { href: "/blogg/salgspipeline", label: "Slik bygger du en salgspipeline" },
      { href: "/blogg/far-selgerne-til-a-bruke-crm", label: "Få selgerne til å bruke CRM" },
      { href: "/hvorfor-altiv", label: "Hvorfor Altiv" },
    ],
  },
];
