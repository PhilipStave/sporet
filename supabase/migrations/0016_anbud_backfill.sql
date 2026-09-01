-- Bring the tenders that were already added to the pipeline into the new list,
-- so the page does not start out empty for anyone who has been using search.
--
-- All that can be recovered is the title and the deadline, which the tender
-- page wrote into next_step_text/next_step_date. The link and the Doffin id
-- were never stored, so these rows can never be matched against Doffin later.
-- The note below says so plainly rather than leaving a dead link in the UI.
--
-- The deal itself is left untouched: the deadline stays in next_step_date, so
-- nothing disappears from the calendar or the follow-up list.

insert into public.anbud
  (org_id, deal_id, department_id, owner_id, owner_name, tittel,
   kjoper_navn, kjoper_orgnr, frist, lopende, status,
   created_by, created_at, notat)
select
  d.org_id,
  d.id,
  d.department_id,
  d.owner_id,
  d.owner_name,
  regexp_replace(d.next_step_text, '^(Anbudsfrist|Søk opptak): ', ''),
  d.company,
  d.org_nr,
  d.next_step_date::timestamptz,
  'Løpende ordning' = any (d.tags),
  'vurderer',
  d.created_by,
  d.created_at,
  'Lagt inn før anbudsoversikten fantes — lenken til kunngjøringen ble aldri lagret.'
from public.deals d
where 'Anbud' = any (d.tags)
  and coalesce(d.next_step_text, '') ~ '^(Anbudsfrist|Søk opptak): '
  and not exists (
    select 1 from public.anbud a where a.deal_id = d.id
  );
