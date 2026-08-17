-- Company join code: lets employees self-register into an organisation.

alter table public.organizations
  add column if not exists join_code text not null
  default encode(gen_random_bytes(4), 'hex');

create unique index if not exists organizations_join_code_idx
  on public.organizations(join_code);
