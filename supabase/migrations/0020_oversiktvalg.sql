-- Which panels a company wants on Oversikt.
--
-- The page grew to seven key figures and four panels, and not every company
-- needs all of them: a one-person firm has no departments to compare, and
-- somebody who sells only one-off jobs has no monthly revenue to watch.
--
-- Empty object means "everything", and a key missing from the object counts as
-- on — same rule as features (see src/lib/constants.ts). New panels added
-- later are therefore visible to everybody until somebody turns them off,
-- which is the only behaviour that does not silently hide new work.
alter table public.organizations
  add column if not exists oversikt jsonb not null default '{}'::jsonb;
