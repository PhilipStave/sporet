-- Tenders the company is following or has bid on.
--
-- One row per competition, not per buyer. A municipality runs many
-- competitions over the years, so this cannot be columns on deals: that would
-- keep the one-deal-per-buyer limit that already blocks the second tender at
-- the same customer.
--
-- deal_id is nullable on purpose. Most small companies get their requests by
-- e-mail rather than through Doffin, and a bid registered by hand must not
-- require a pipeline card to exist first.
--
-- ON MONEY, decided deliberately: deals.value keeps meaning "what we expect to
-- earn", and stays whatever the pipeline already says. Doffin's estimate lives
-- here in verdi instead, because it is the buyer's ceiling for the whole
-- contract and not our revenue — writing it into deals.value would quietly
-- distort the sales targets on Oversikt. When the seller enters their own bid
-- in tilbudssum, that is the number worth carrying over to the deal.

create table if not exists public.anbud (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- Null when the buyer is not in the pipeline, or the bid came by e-mail.
  deal_id uuid references public.deals(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  owner_name text not null default '',

  -- From Doffin. Null for bids registered by hand.
  doffin_id text,
  lenke text,
  tittel text not null,
  beskrivelse text not null default '',
  kjoper_navn text not null default '',
  kjoper_orgnr text,
  frist timestamptz,
  publisert date,
  verdi numeric,
  over_terskel boolean not null default false,
  lopende boolean not null default false,

  -- Ours.
  status text not null default 'vurderer'
    check (status in ('vurderer', 'levert', 'vunnet', 'tapt', 'avlyst', 'droppet')),
  levert_at date,
  tilbudssum numeric,
  notat text not null default '',

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The same competition can only be followed once per company.
create unique index if not exists anbud_org_doffin_idx
  on public.anbud (org_id, doffin_id) where doffin_id is not null;
create index if not exists anbud_org_frist_idx on public.anbud (org_id, frist);
create index if not exists anbud_deal_idx on public.anbud (deal_id);

alter table public.anbud enable row level security;

-- Everyone in the company sees the tenders; writing follows the same rule as
-- deals, including org_can_write() so an expired subscription stays read-only.
drop policy if exists anbud_select on public.anbud;
create policy anbud_select on public.anbud
  for select using (org_id = public.current_org_id());

drop policy if exists anbud_insert on public.anbud;
create policy anbud_insert on public.anbud
  for insert with check (org_id = public.current_org_id() and public.org_can_write());

drop policy if exists anbud_update on public.anbud;
create policy anbud_update on public.anbud
  for update using (org_id = public.current_org_id() and public.org_can_write())
  with check (org_id = public.current_org_id() and public.org_can_write());

drop policy if exists anbud_delete on public.anbud;
create policy anbud_delete on public.anbud
  for delete using (
    org_id = public.current_org_id() and public.org_can_write()
    and (public.is_admin() or owner_id = auth.uid() or created_by = auth.uid())
  );
