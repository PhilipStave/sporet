import type {
  DealRow,
  ActivityRow,
  OrganizationRow,
  ProfileRow,
  DepartmentRow,
} from "./database";

export * from "./database";

/** A deal with its activity log attached (as fetched with a nested select). */
export type Deal = DealRow & { activities: ActivityRow[] };

export type Organization = OrganizationRow;
export type Profile = ProfileRow;
export type Department = DepartmentRow;

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
