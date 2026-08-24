-- Organisation number on a customer.
--
-- The lead search needs to say "you already have this one". Matching on company
-- name is guesswork — "Bergen Bydrift AS" and "Bergen Bydrift" are the same
-- company, "Nordic AS" and "Nordisk AS" are not. The org number is the only
-- identifier that settles it.

alter table public.deals
  add column if not exists org_nr text;

-- Fast lookup when the search compares a page of hits against existing customers.
create index if not exists deals_org_nr_idx
  on public.deals (org_id, org_nr)
  where org_nr is not null;

-- Backfill from customers imported before this column existed: the note field
-- opens with "Org.nr. 123456789".
update public.deals
   set org_nr = substring(notes from 'Org\.nr\.\s*(\d{9})')
 where org_nr is null
   and notes like 'Org.nr.%';
