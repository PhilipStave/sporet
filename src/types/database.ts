// Hand-written Supabase schema types. If you prefer, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

import type { Stage, Channel, Role, FeatureKey } from "@/lib/constants";

export type Features = Record<FeatureKey, boolean>;

export type Plan = "trial" | "10" | "20" | "50" | "100";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type OrganizationRow = {
  id: string;
  name: string;
  features: Features;
  join_code: string;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  inbound_key: string | null;
  created_at: string;
}

export type InboundEmailRow = {
  id: string;
  org_id: string;
  deal_id: string | null;
  resend_id: string;
  from_email: string;
  from_name: string;
  sender_profile_id: string | null;
  to_emails: string[];
  subject: string;
  body_text: string;
  received_at: string;
  status: "matched" | "unmatched" | "rejected";
  created_at: string;
}

export type DepartmentRow = {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  org_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  status: "pending" | "active";
  terms_accepted_version: string | null;
  terms_accepted_at: string | null;
  calendar_token: string | null;
  is_superadmin: boolean;
  created_at: string;
}

export type DealDocumentRow = {
  id: string;
  org_id: string;
  deal_id: string;
  name: string;
  path: string;
  size: number;
  mime: string;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
}

export type ProfileDepartmentRow = {
  profile_id: string;
  department_id: string;
}

export type DealRow = {
  id: string;
  org_id: string;
  department_id: string | null;
  owner_id: string | null;
  owner_name: string;
  company: string;
  contact: string;
  contact_role: string;
  email: string;
  phone: string;
  product: string;
  value: number;
  margin_pct: number;
  stage: Stage;
  channel: Channel;
  tags: string[];
  lost_reason: string | null;
  notes: string;
  next_step_text: string | null;
  next_step_date: string | null;
  next_step_time: string | null;
  next_step_who: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  won_at: string | null;
  lost_at: string | null;
}

export type ActivityRow = {
  id: string;
  deal_id: string;
  org_id: string;
  actor_id: string | null;
  actor_name: string;
  icon: string;
  label: string;
  note: string;
  created_at: string;
}

export type PipelineStageRow = {
  id: string;
  org_id: string;
  key: string;
  label: string;
  color: string;
  position: number;
  is_system: boolean;
  counts_as_open: boolean;
  created_at: string;
}

export type InviteRow = {
  id: string;
  org_id: string;
  email: string;
  role: Role;
  token: string;
  created_by: string | null;
  created_at: string;
  used_at: string | null;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: Table<OrganizationRow>;
      departments: Table<DepartmentRow>;
      profiles: Table<ProfileRow>;
      profile_departments: Table<ProfileDepartmentRow>;
      deals: Table<DealRow>;
      activities: Table<ActivityRow>;
      invites: Table<InviteRow>;
      pipeline_stages: Table<PipelineStageRow>;
      deal_documents: Table<DealDocumentRow>;
      inbound_emails: Table<InboundEmailRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      current_org_id: { Args: Record<PropertyKey, never>; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      seed_default_stages: { Args: { p_org: string }; Returns: undefined };
      rotate_calendar_token: { Args: Record<PropertyKey, never>; Returns: string };
      rotate_inbound_key: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
