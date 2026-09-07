-- Is a sale a one-off amount, or the same amount every month?
--
-- Until now every deal was just "value", and the sums treated 50 000 for a
-- machine and 790 a month for a subscription as the same kind of number. They
-- are not: the second one comes back next month, and that is the number a
-- company plans on.
--
-- Existing rows become one-off, which is what they were sold as.
alter table public.deals
  add column if not exists verdi_type text not null default 'engangs'
  check (verdi_type in ('engangs', 'maanedlig'));
