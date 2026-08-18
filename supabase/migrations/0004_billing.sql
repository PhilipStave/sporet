-- Billing / subscription state per organisation (Stripe).

alter table public.organizations
  add column if not exists plan text not null default 'trial'
    check (plan in ('trial','10','20','50','100')),
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing','active','past_due','canceled','expired')),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists current_period_end timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists organizations_stripe_customer_idx
  on public.organizations(stripe_customer_id);

-- True when the org may WRITE data (trial still running, or paid & current).
create or replace function public.org_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when o.subscription_status = 'active' then true
      when o.subscription_status = 'trialing' and o.trial_ends_at > now() then true
      -- grace: past_due keeps write access until the paid period actually ends
      when o.subscription_status = 'past_due'
           and coalesce(o.current_period_end, now()) > now() then true
      else false
    end
    from public.organizations o
    where o.id = public.current_org_id()
  ), false);
$$;

-- Enforce read-only when expired: writes on deals/activities require org_can_write().
drop policy if exists deal_insert on public.deals;
create policy deal_insert on public.deals
  for insert with check (org_id = public.current_org_id() and public.org_can_write());

drop policy if exists deal_update on public.deals;
create policy deal_update on public.deals
  for update using (org_id = public.current_org_id() and public.org_can_write())
  with check (org_id = public.current_org_id() and public.org_can_write());

drop policy if exists deal_delete on public.deals;
create policy deal_delete on public.deals
  for delete using (
    org_id = public.current_org_id() and public.org_can_write()
    and (public.is_admin() or owner_id = auth.uid() or created_by = auth.uid())
  );

drop policy if exists activity_insert on public.activities;
create policy activity_insert on public.activities
  for insert with check (org_id = public.current_org_id() and public.org_can_write());
