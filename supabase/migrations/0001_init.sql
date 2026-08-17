-- ============================================================
-- Sporet CRM — initial schema (multi-tenant, RLS)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  features jsonb not null default
    '{"kalender":true,"statistikk":true,"selgere":true,"kunder":true,"aktivitet":true}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists departments_org_idx on public.departments(org_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  role text not null default 'seller' check (role in ('admin', 'seller')),
  created_at timestamptz not null default now()
);
create index if not exists profiles_org_idx on public.profiles(org_id);

create table if not exists public.profile_departments (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  primary key (profile_id, department_id)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  owner_name text not null default '',
  company text not null default '',
  contact text not null default '',
  contact_role text not null default '',
  email text not null default '',
  phone text not null default '',
  product text not null default '',
  value numeric not null default 0,
  margin_pct numeric not null default 0,
  stage text not null default 'ny'
    check (stage in ('ny','kontaktet','dialog','tilbud','forhandling','vunnet','tapt','ikkesvart')),
  channel text not null default 'epost'
    check (channel in ('telefon','epost','sms','mote')),
  tags text[] not null default '{}',
  lost_reason text,
  notes text not null default '',
  next_step_text text,
  next_step_date date,
  next_step_time text,
  next_step_who text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  won_at timestamptz,
  lost_at timestamptz
);
create index if not exists deals_org_idx on public.deals(org_id);
create index if not exists deals_dept_idx on public.deals(department_id);
create index if not exists deals_owner_idx on public.deals(owner_id);
create index if not exists deals_stage_idx on public.deals(stage);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default '',
  icon text not null default 'edit',
  label text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists activities_deal_idx on public.activities(deal_id);
create index if not exists activities_org_created_idx on public.activities(org_id, created_at desc);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'seller' check (role in ('admin', 'seller')),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index if not exists invites_org_idx on public.invites(org_id);
create index if not exists invites_token_idx on public.invites(token);

-- ------------------------------------------------------------
-- Helper functions (security definer -> bypass RLS internally,
-- so referencing profiles from a profiles policy does not recurse)
-- ------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.organizations     enable row level security;
alter table public.departments        enable row level security;
alter table public.profiles           enable row level security;
alter table public.profile_departments enable row level security;
alter table public.deals              enable row level security;
alter table public.activities         enable row level security;
alter table public.invites            enable row level security;

-- Organizations
create policy org_select on public.organizations
  for select using (id = public.current_org_id());
create policy org_update on public.organizations
  for update using (id = public.current_org_id() and public.is_admin())
  with check (id = public.current_org_id() and public.is_admin());

-- Departments
create policy dept_select on public.departments
  for select using (org_id = public.current_org_id());
create policy dept_write on public.departments
  for all using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id() and public.is_admin());

-- Profiles
create policy profile_select on public.profiles
  for select using (org_id = public.current_org_id());
create policy profile_insert_self on public.profiles
  for insert with check (id = auth.uid());
create policy profile_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (org_id = public.current_org_id());

-- Profile <-> department links
create policy pd_select on public.profile_departments
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_departments.profile_id
        and p.org_id = public.current_org_id()
    )
  );
create policy pd_write on public.profile_departments
  for all using (
    public.is_admin() and exists (
      select 1 from public.profiles p
      where p.id = profile_departments.profile_id
        and p.org_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = profile_departments.profile_id
        and p.org_id = public.current_org_id()
    )
  );

-- Deals
create policy deal_select on public.deals
  for select using (org_id = public.current_org_id());
create policy deal_insert on public.deals
  for insert with check (org_id = public.current_org_id());
create policy deal_update on public.deals
  for update using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy deal_delete on public.deals
  for delete using (
    org_id = public.current_org_id()
    and (public.is_admin() or owner_id = auth.uid() or created_by = auth.uid())
  );

-- Activities
create policy activity_select on public.activities
  for select using (org_id = public.current_org_id());
create policy activity_insert on public.activities
  for insert with check (org_id = public.current_org_id());

-- Invites (admin only)
create policy invite_select on public.invites
  for select using (org_id = public.current_org_id() and public.is_admin());
create policy invite_write on public.invites
  for all using (org_id = public.current_org_id() and public.is_admin())
  with check (org_id = public.current_org_id() and public.is_admin());
