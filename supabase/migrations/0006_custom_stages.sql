-- Per-organisation customisable pipeline stages.
-- Defaults mirror the built-in stages so existing data keeps working.
-- `key` is what deals.stage stores; `vunnet`/`tapt` are system stages (renamable, not deletable).

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  label text not null,
  color text not null default '#64748b',
  position int not null default 0,
  is_system boolean not null default false,   -- vunnet / tapt
  counts_as_open boolean not null default true, -- included in "open pipeline" metrics
  created_at timestamptz not null default now(),
  unique (org_id, key)
);
create index if not exists pipeline_stages_org_idx on public.pipeline_stages(org_id, position);

alter table public.pipeline_stages enable row level security;

create policy stages_select on public.pipeline_stages
  for select using (org_id = public.current_org_id());
create policy stages_write on public.pipeline_stages
  for all using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id() and public.is_admin());

-- Relax the fixed CHECK on deals.stage: any key is allowed now (validated by app against org stages).
alter table public.deals drop constraint if exists deals_stage_check;

-- Seed defaults for every existing organisation that has none yet.
insert into public.pipeline_stages (org_id, key, label, color, position, is_system, counts_as_open)
select o.id, s.key, s.label, s.color, s.position, s.is_system, s.counts_as_open
from public.organizations o
cross join (values
  ('ny',          'Potensiell kunde', '#64748b', 0, false, true),
  ('kontaktet',   'Kontaktet',        '#0ea5e9', 1, false, true),
  ('dialog',      'I dialog',         '#6366f1', 2, false, true),
  ('tilbud',      'Tilbud sendt',     '#8b5cf6', 3, false, true),
  ('forhandling', 'Forhandling',      '#f59e0b', 4, false, true),
  ('vunnet',      'Vunnet',           '#059669', 5, true,  false),
  ('tapt',        'Tapt',             '#dc2626', 6, true,  false),
  ('ikkesvart',   'Ikke svart',       '#94a3b8', 7, false, false)
) as s(key, label, color, position, is_system, counts_as_open)
where not exists (select 1 from public.pipeline_stages p where p.org_id = o.id);

-- Helper: seed default stages for a new org (called from app on setup).
create or replace function public.seed_default_stages(p_org uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.pipeline_stages (org_id, key, label, color, position, is_system, counts_as_open)
  values
    (p_org, 'ny',          'Potensiell kunde', '#64748b', 0, false, true),
    (p_org, 'kontaktet',   'Kontaktet',        '#0ea5e9', 1, false, true),
    (p_org, 'dialog',      'I dialog',         '#6366f1', 2, false, true),
    (p_org, 'tilbud',      'Tilbud sendt',     '#8b5cf6', 3, false, true),
    (p_org, 'forhandling', 'Forhandling',      '#f59e0b', 4, false, true),
    (p_org, 'vunnet',      'Vunnet',           '#059669', 5, true,  false),
    (p_org, 'tapt',        'Tapt',             '#dc2626', 6, true,  false),
    (p_org, 'ikkesvart',   'Ikke svart',       '#94a3b8', 7, false, false)
  on conflict do nothing;
$$;
