import type {
  DealRow,
  ActivityRow,
  OrganizationRow,
  ProfileRow,
  DepartmentRow,
  SalgsmaalRow,
  AnbudRow,
} from "./database";

export * from "./database";

/** A deal with its activity log attached (as fetched with a nested select). */
export type Deal = DealRow & { activities: ActivityRow[] };

export type Organization = OrganizationRow;
export type Profile = ProfileRow;
export type Department = DepartmentRow;
export type Salgsmaal = SalgsmaalRow;
/**
 * A followed tender. Named Bud, not Anbud, because lib/doffin.ts already
 * exports Anbud for a notice as it comes off Doffin — that one is what is out
 * there, this one is what we are doing about it.
 */
export type Bud = AnbudRow;

/** Team member as shown in autocomplete / seller lists. */
export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: "pending" | "active";
  department_ids: string[];
}

export interface NextStep {
  text: string;
  date: string | null;
  time: string | null;
  who: string | null;
}
