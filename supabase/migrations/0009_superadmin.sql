-- Platform owner (Stave Software) flag. Grants access to /admin — a cross-tenant view of all organisations.
-- Not a tenant role; does not change any RLS policy. The /admin pages use the service client server-side,
-- gated on this flag.

alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

-- Bootstrap the owner.
update public.profiles set is_superadmin = true where lower(email) = 'philipstave@outlook.com';
