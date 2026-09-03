-- Cache of website assessments, one row per domain.
--
-- The customer search can now judge a company's website (src/lib/nettside.ts).
-- Fetching a front page costs 1–6 s and hits somebody else's server, so a
-- verdict is kept for a month and reused across every search and every
-- customer of Altiv — a domain is the same domain whoever asks.
--
-- Public facts about companies, not personal data. Read and written only by
-- the API route through the service role; no policy exists for ordinary users,
-- so the anon key can neither read nor write it.
create table if not exists public.nettsted (
  domene      text primary key,
  status      text not null,               -- NettsideStatus
  dom         text not null,               -- NettsideDom
  poeng       int  not null default 0,
  funn        text[] not null default '{}',
  via         text,
  hentet_url  text,
  sjekket     timestamptz not null default now()
);

alter table public.nettsted enable row level security;
