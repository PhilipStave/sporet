-- Monthly AI search quota per organisation.
--
-- The lead search calls a paid model, so an unbounded customer is an unbounded
-- cost. One row per org per month; the counter is bumped inside a function that
-- also enforces the ceiling, so the check and the increment cannot drift apart.

create table if not exists public.ai_usage (
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- First day of the month, in Europe/Oslo terms. Keeps the row count tiny.
  maaned date not null,
  antall integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (org_id, maaned)
);

alter table public.ai_usage enable row level security;

-- Readable by the org it belongs to; only the function below ever writes.
drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage
  for select using (org_id = public.current_org_id());

-- Quota by plan. Roughly five times normal use, so a working salesperson never
-- meets it but a runaway script stops.
create or replace function public.ai_kvote(p_plan text)
returns integer
language sql
immutable
as $$
  select case p_plan
    when '10'  then 1000
    when '20'  then 2000
    when '50'  then 5000
    when '100' then 10000
    when 'trial' then 200
    else 200
  end;
$$;

/**
 * Claims one AI search for the caller's organisation.
 *
 * Returns the remaining allowance after the claim, or -1 when the quota is
 * already spent. The read and the write happen in one statement so two
 * simultaneous searches cannot both slip past the ceiling.
 */
create or replace function public.ai_bruk_ett()
returns table (tillatt boolean, brukt integer, kvote integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_plan text;
  v_kvote integer;
  v_maaned date := date_trunc('month', (now() at time zone 'Europe/Oslo'))::date;
  v_brukt integer;
begin
  v_org := public.current_org_id();
  if v_org is null then
    return query select false, 0, 0;
    return;
  end if;

  select o.plan into v_plan from public.organizations o where o.id = v_org;
  v_kvote := public.ai_kvote(coalesce(v_plan, 'trial'));

  insert into public.ai_usage (org_id, maaned, antall)
  values (v_org, v_maaned, 0)
  on conflict (org_id, maaned) do nothing;

  -- Bump only while below the ceiling; the WHERE is the enforcement.
  update public.ai_usage u
     set antall = u.antall + 1, updated_at = now()
   where u.org_id = v_org
     and u.maaned = v_maaned
     and u.antall < v_kvote
  returning u.antall into v_brukt;

  if v_brukt is null then
    select u.antall into v_brukt
      from public.ai_usage u
     where u.org_id = v_org and u.maaned = v_maaned;
    return query select false, coalesce(v_brukt, v_kvote), v_kvote;
  end if;

  return query select true, v_brukt, v_kvote;
end;
$$;

grant execute on function public.ai_bruk_ett() to authenticated;
grant execute on function public.ai_kvote(text) to authenticated;
