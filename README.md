# Altiv — CRM for salgsoppfølging

Altiv er et norsk B2B-CRM for salgsoppfølging: hold styr på hvem som er
kontaktet, hvordan, og hvor langt salget har kommet — pluss omsetning og margin
per selger og avdeling. Prosjektet inneholder både **appen** og en **landingsside
med priser**.

Bygget med **Next.js 16 (App Router) + TypeScript**, **Supabase** (Postgres,
Auth, Row Level Security) og fonter via `next/font`. Klar for deploy på Vercel.

---

## Funksjoner

- **Bedriftsoppsett** (admin, første gang): navn, avdelinger, funksjoner, passord
- **Ekte innlogging** med e-post/passord og roller (**admin** vs. **selger**)
- **Invitasjon** av selgere via delbar lenke
- **Multi-tenant**: hver bedrift har sin egen, delte database (isolert med RLS)
- **Pipeline** som kanban (dra og slipp) og tabell, med filtre
- **Oversikt** med seks nøkkeltall og drill-down
- **Kalender**, **Statistikk** (søyle/linje), **Selgere**, **Kunder** (+ CSV), **Aktivitet**
- **Kundepanel** med inline-redigering, kontaktlogg, neste steg, tags og tapt-årsak
- **Globalt søk**, avdelingsscope og «Bare meg»
- Ekte tidsstempler (ikke dag-offset), responsivt for mobil, ingen demodata

---

## Kom i gang lokalt

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Opprett et Supabase-prosjekt

1. Gå til [app.supabase.com](https://app.supabase.com) og lag et nytt prosjekt.
2. Åpne **SQL Editor**, lim inn hele innholdet i
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) og
   kjør det. Dette oppretter tabeller, hjelpefunksjoner og RLS-policyer.
3. Hent nøklene under **Project Settings → API**:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (hemmelig — kun server)

### 3. Sett miljøvariabler

Kopier `.env.example` til `.env.local` og fyll inn:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://DITT-PROSJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
SUPABASE_SERVICE_ROLE_KEY=din-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> `SUPABASE_SERVICE_ROLE_KEY` brukes kun i server-kode (bedriftsoppsett og
> aksept av invitasjoner) og eksponeres aldri til nettleseren.

### 4. Kjør appen

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000). Landingssiden ligger på `/`,
og appen på `/app`.

### 5. Første gang

1. Klikk **Prøv systemet** / **Sett opp bedriften** (`/setup`).
2. Fyll inn bedriftsnavn, avdelinger, funksjoner, admin-bruker og passord.
3. Du logges inn som administrator med et **tomt** system (ingen demodata).
4. Inviter selgere under **Innstillinger → Inviter selger** og del lenken.

---

## Prosjektstruktur

```
src/
├─ app/
│  ├─ page.tsx                 # landingsside (priser)
│  ├─ (auth)/                  # setup, login, invitasjon + server actions
│  ├─ app/                     # innlogget app (/app/*)
│  │  ├─ layout.tsx            # laster org/profil, StoreProvider + nav + drawer
│  │  ├─ oversikt/ pipeline/ kalender/ statistikk/
│  │  ├─ selgere/ kunder/ aktivitet/ innstillinger/
│  └─ globals.css              # design-tokens (app + landingsside)
├─ components/                 # Icon, Dropdown, Autocomplete, TopNav, DetailModal,
│  ├─ drawer/CustomerDrawer.tsx
│  └─ pipeline/{Board,DealCard,Table}.tsx
├─ lib/
│  ├─ supabase/{client,server,middleware}.ts
│  ├─ constants.ts format.ts metrics.ts csv.ts queries.ts
├─ store/Store.tsx             # klient-datalag (deals + mutasjoner, RLS via browser-klient)
├─ types/                      # database.ts + domenetyper
└─ proxy.ts                    # sesjonsoppdatering + rutebeskyttelse (Next 16)

supabase/migrations/0001_init.sql   # skjema + RLS
```

### Datamodell

`organizations`, `departments`, `profiles` (+ `profile_departments`), `deals`,
`activities`, `invites`. Alle rader er knyttet til `org_id`, og RLS sikrer at en
bruker bare ser og endrer data i sin egen bedrift. Kun admin kan endre bedrift,
avdelinger og invitasjoner samt slette andres deals.

---

## Legge prosjektet på GitHub

```bash
git init
git add .
git commit -m "Altiv CRM – første versjon"
git branch -M main
git remote add origin https://github.com/<brukernavn>/<repo>.git
git push -u origin main
```

`.env.local` er allerede i `.gitignore` og pushes ikke.

## Publisere på Vercel

1. Gå til [vercel.com/new](https://vercel.com/new) og importer GitHub-repoet.
2. Under **Environment Variables**, legg inn de samme fire variablene som i
   `.env.local` (sett `NEXT_PUBLIC_SITE_URL` til Vercel-URL-en din, f.eks.
   `https://altiv.no`).
3. Deploy. Vercel bygger `next build` automatisk.
4. I Supabase under **Authentication → URL Configuration**, legg til
   Vercel-domenet som tillatt Site URL / redirect.

---

## Skript

| Kommando | Beskrivelse |
|---|---|
| `npm run dev` | Utviklingsserver |
| `npm run build` | Produksjonsbygg |
| `npm run start` | Kjør produksjonsbygg lokalt |
| `npm run lint` | ESLint |

---

## Merknader

- CSV-eksport (`Kunder → Eksporter CSV`) lages i nettleseren fra data du allerede
  har lastet: semikolonseparert, UTF-8 med BOM, filnavn `altiv-kunder.csv`.
- «Oppdatert»-tidspunkt og periodefiltre bruker ekte tidsstempler
  (`updated_at`, `won_at`, `lost_at`).
- Type-typene i `src/types/database.ts` er håndskrevne; du kan regenerere dem med
  `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`.
