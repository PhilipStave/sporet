-- Column-level protection on profiles and organizations.
--
-- THE HOLE THIS CLOSES
--
-- profile_update (0001_init.sql:166-168) let a user update their own row:
--
--   for update using (id = auth.uid() or public.is_admin())
--   with check (org_id = public.current_org_id());
--
-- It checks WHICH ROW you touch and never WHICH COLUMNS. is_superadmin
-- (0009_superadmin.sql) sits on that row as an ordinary column. So any signed-in
-- user could set it on themselves, and /admin — which runs on the service key,
-- outside every RLS rule — then opened onto every organisation in the database.
-- The same shape let a seller promote themselves to role = 'admin', and let an
-- admin rewrite the billing and AI-quota columns on their own organisation:
-- free subscription, unlimited quota, invoiced to Stave Software.
--
-- Postgres policies cannot see the old row on UPDATE, so a policy cannot
-- express "this column may not change". A BEFORE UPDATE trigger can, and it
-- fires for every path in — PostgREST, the SQL editor, everything.
--
-- The trigger functions are deliberately NOT security definer: they need
-- current_user to be the actual caller. PostgREST switches role per request, so
-- a browser session is 'authenticated' and a server call with the service key
-- is 'service_role'. Every write the app makes to these columns already goes
-- through the server on the service key (checked: every profiles insert and
-- update in src/ uses createAdminClient), so nothing legitimate breaks.

create or replace function public.er_tjenestekonto()
returns boolean
language sql
stable
as $$
  select current_user in
    ('service_role', 'postgres', 'supabase_admin', 'supabase_auth_admin');
$$;

-- Profiles ------------------------------------------------------------------

create or replace function public.profiles_kolonnevern()
returns trigger
language plpgsql
as $$
begin
  if public.er_tjenestekonto() then
    return new;
  end if;

  if new.is_superadmin is distinct from old.is_superadmin then
    raise exception 'is_superadmin kan ikke endres herfra'
      using errcode = '42501';
  end if;

  if new.id is distinct from old.id or new.org_id is distinct from old.org_id then
    raise exception 'id og org_id kan ikke endres'
      using errcode = '42501';
  end if;

  -- Role and status decide who is an admin and who is approved, so they belong
  -- to an admin — never to the person they are about. is_admin() reads the row
  -- as it stands now, so a seller cannot use this to bootstrap themselves.
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_admin() then
    raise exception 'bare en administrator kan endre rolle eller status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_kolonnevern on public.profiles;
create trigger profiles_kolonnevern
  before update on public.profiles
  for each row execute function public.profiles_kolonnevern();

-- The insert side had the same blind spot: "with check (id = auth.uid())" says
-- nothing about which organisation the row points at, what role it claims, or
-- whether it is already approved. Anyone could register through Supabase auth
-- and write themselves an active admin profile inside someone else's company.
-- The app never inserts profiles from the browser, so this only has to be wide
-- enough for a row that is harmless on arrival.
drop policy if exists profile_insert_self on public.profiles;
create policy profile_insert_self on public.profiles
  for insert with check (
    id = auth.uid()
    and is_superadmin = false
    and role = 'seller'
    and status = 'pending'
  );

-- Organizations -------------------------------------------------------------

create or replace function public.organizations_kolonnevern()
returns trigger
language plpgsql
as $$
begin
  if public.er_tjenestekonto() then
    return new;
  end if;

  -- What the browser legitimately edits in Innstillinger: name, features,
  -- join_code, join_code_rotate, join_code_rotated_at. Everything below is
  -- money or quota, and is set by Stripe's webhook or by us.
  if new.id is distinct from old.id
     or new.plan is distinct from old.plan
     or new.subscription_status is distinct from old.subscription_status
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.ai_kvote_override is distinct from old.ai_kvote_override
     or new.inbound_key is distinct from old.inbound_key then
    raise exception 'abonnement, kvote og nokler kan ikke endres herfra'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_kolonnevern on public.organizations;
create trigger organizations_kolonnevern
  before update on public.organizations
  for each row execute function public.organizations_kolonnevern();
