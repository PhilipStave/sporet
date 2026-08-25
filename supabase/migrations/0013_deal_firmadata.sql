-- Company facts as real columns instead of prose in the notes field.
--
-- The lead search knows a lot about each company: industry, size, address,
-- founding date, VAT status, website, and the figures from the accounts
-- register. Packing that into `notes` made it unsearchable, unsortable, and
-- left the customer's own note field full of text nobody wrote.
--
-- Everything here is public company data from Brønnøysundregistrene. Nothing
-- about named individuals is stored — that stays out by design.

alter table public.deals
  add column if not exists naeringskode text,
  add column if not exists naering text,
  add column if not exists ansatte integer,
  add column if not exists adresse text,
  add column if not exists postnummer text,
  add column if not exists poststed text,
  add column if not exists kommune text,
  add column if not exists stiftet date,
  add column if not exists mva_registrert boolean,
  add column if not exists nettside text,
  -- Latest filed accounts. Amounts in whole kroner, as the register reports them.
  add column if not exists omsetning bigint,
  add column if not exists driftsresultat bigint,
  add column if not exists aarsresultat bigint,
  add column if not exists regnskapsaar integer;

-- Lets a seller sort or filter their pipeline by company size.
create index if not exists deals_ansatte_idx
  on public.deals (org_id, ansatte)
  where ansatte is not null;
