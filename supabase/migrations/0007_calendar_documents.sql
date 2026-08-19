-- Calendar subscription tokens + documents on customers.

-- ---------- Calendar ----------
-- Each profile gets a secret token; /api/kalender/<token> serves an iCal feed.
alter table public.profiles
  add column if not exists calendar_token text unique default encode(gen_random_bytes(18), 'hex');
update public.profiles set calendar_token = encode(gen_random_bytes(18), 'hex') where calendar_token is null;
create index if not exists profiles_calendar_token_idx on public.profiles(calendar_token);

-- Lets a user rotate their own token (invalidate old link).
create or replace function public.rotate_calendar_token()
returns text language plpgsql security definer set search_path = public as $$
declare t text;
begin
  t := encode(gen_random_bytes(18), 'hex');
  update public.profiles set calendar_token = t where id = auth.uid();
  return t;
end $$;

-- ---------- Documents ----------
create table if not exists public.deal_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  path text not null,               -- storage object path: <org_id>/<deal_id>/<uuid>-<name>
  size bigint not null default 0,
  mime text not null default '',
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_by_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists deal_documents_deal_idx on public.deal_documents(deal_id, created_at desc);
create index if not exists deal_documents_org_idx on public.deal_documents(org_id);

alter table public.deal_documents enable row level security;

create policy deal_documents_select on public.deal_documents
  for select using (org_id = public.current_org_id());
create policy deal_documents_insert on public.deal_documents
  for insert with check (org_id = public.current_org_id() and public.org_can_write());
create policy deal_documents_delete on public.deal_documents
  for delete using (
    org_id = public.current_org_id() and public.org_can_write()
    and (public.is_admin() or uploaded_by = auth.uid())
  );

-- Private storage bucket; objects live under <org_id>/... so RLS can scope by first path segment.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400) -- 25 MB per file
on conflict (id) do update set public = false, file_size_limit = 26214400;

create policy documents_select on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
create policy documents_insert on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.org_can_write()
  );
create policy documents_delete on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.org_can_write()
  );
