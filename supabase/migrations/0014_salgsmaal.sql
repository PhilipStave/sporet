-- Sales targets, set by admins and read by everyone in the org.
--
-- One row per target-holder: the whole org (both ids null), one department, or
-- one seller. The amount is a monthly figure — week and year views derive from
-- it in the UI, so there is exactly one number to keep up to date.

create table if not exists public.salgsmaal (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  maanedsmaal numeric not null check (maanedsmaal >= 0),
  updated_at timestamptz not null default now(),
  -- A target belongs to the org, a department or a seller — never two at once.
  constraint salgsmaal_en_dimensjon
    check (department_id is null or profile_id is null),
  -- And each holder has at most one target.
  constraint salgsmaal_en_per_holder
    unique nulls not distinct (org_id, department_id, profile_id)
);

alter table public.salgsmaal enable row level security;

-- Everyone in the org sees the targets (the bar on Oversikt needs them);
-- only admins set them.
drop policy if exists salgsmaal_select on public.salgsmaal;
create policy salgsmaal_select on public.salgsmaal
  for select using (org_id = public.current_org_id());

drop policy if exists salgsmaal_admin on public.salgsmaal;
create policy salgsmaal_admin on public.salgsmaal
  for all using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id() and public.is_admin());
