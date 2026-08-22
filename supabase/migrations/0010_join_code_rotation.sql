-- Optional automatic rotation of the company join code (every 24h).
alter table public.organizations
  add column if not exists join_code_rotate boolean not null default false,
  add column if not exists join_code_rotated_at timestamptz not null default now();
