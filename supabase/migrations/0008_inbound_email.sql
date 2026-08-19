-- Inbound e-mail logging: each org gets a secret BCC address <inbound_key>@altiv.no.
-- E-mails from active members are logged on the matching customer (by recipient address/domain).
-- Unmatched ones land in inbound_emails for manual placement.

alter table public.organizations
  add column if not exists inbound_key text unique
    default ('logg-' || encode(gen_random_bytes(4), 'hex'));
update public.organizations
  set inbound_key = 'logg-' || encode(gen_random_bytes(4), 'hex')
  where inbound_key is null;
create index if not exists organizations_inbound_key_idx on public.organizations(inbound_key);

-- Admin can rotate the address.
create or replace function public.rotate_inbound_key()
returns text language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  k := 'logg-' || encode(gen_random_bytes(4), 'hex');
  update public.organizations set inbound_key = k where id = public.current_org_id();
  return k;
end $$;

-- Holding table for received e-mails (both matched and unmatched are kept for audit; deal_id null = unmatched).
create table if not exists public.inbound_emails (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  resend_id text not null unique,          -- idempotency
  from_email text not null,
  from_name text not null default '',
  sender_profile_id uuid references public.profiles(id) on delete set null,
  to_emails text[] not null default '{}',
  subject text not null default '',
  body_text text not null default '',
  received_at timestamptz not null default now(),
  status text not null default 'matched' check (status in ('matched','unmatched','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists inbound_emails_org_status_idx on public.inbound_emails(org_id, status, received_at desc);

alter table public.inbound_emails enable row level security;
create policy inbound_emails_select on public.inbound_emails
  for select using (org_id = public.current_org_id());
-- Members can "place" an unmatched e-mail on a deal (update deal_id/status).
create policy inbound_emails_update on public.inbound_emails
  for update using (org_id = public.current_org_id() and public.org_can_write())
  with check (org_id = public.current_org_id() and public.org_can_write());
create policy inbound_emails_delete on public.inbound_emails
  for delete using (org_id = public.current_org_id() and public.org_can_write() and public.is_admin());
