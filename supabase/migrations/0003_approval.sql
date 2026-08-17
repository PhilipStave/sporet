-- Manual admin approval for self-registered members.

alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('pending', 'active'));

-- Pending members have no active organisation context (RLS blocks their data
-- access until an admin approves them).
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid() and status = 'active';
$$;

-- A user may always read their own profile (needed to show the waiting screen).
drop policy if exists profile_select_self on public.profiles;
create policy profile_select_self on public.profiles
  for select using (id = auth.uid());
