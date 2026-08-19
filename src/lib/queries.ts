import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile, Department, Member } from "@/types";
import type { StageConfig } from "@/lib/stages";

export interface ActiveSession {
  kind: "active";
  profile: Profile;
  org: Organization;
  departments: Department[];
  members: Member[];
  stages: StageConfig[];
}

export type SessionResult =
  | { kind: "none" }
  | { kind: "pending"; fullName: string }
  | ActiveSession;

/**
 * Resolves the logged-in user's session:
 * - "none": not authenticated or has no profile/org yet
 * - "pending": registered but awaiting admin approval
 * - "active": full context (profile, org, departments, team)
 */
export async function getSessionContext(): Promise<SessionResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { kind: "none" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "none" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.org_id) return { kind: "none" };

  if (profile.status === "pending") {
    return { kind: "pending", fullName: profile.full_name };
  }

  const [
    { data: org },
    { data: departments },
    { data: profiles },
    { data: links },
    { data: stages },
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase
      .from("departments")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("created_at"),
    supabase
      .from("profiles")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("full_name"),
    supabase.from("profile_departments").select("profile_id, department_id"),
    supabase
      .from("pipeline_stages")
      .select("id, key, label, color, position, is_system, counts_as_open")
      .eq("org_id", profile.org_id)
      .order("position"),
  ]);

  if (!org) return { kind: "none" };

  const members: Member[] = (profiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    role: p.role,
    status: p.status,
    department_ids: (links || [])
      .filter((l) => l.profile_id === p.id)
      .map((l) => l.department_id),
  }));

  return {
    kind: "active",
    profile: profile as Profile,
    org: org as Organization,
    departments: (departments || []) as Department[],
    members,
    stages: (stages || []) as StageConfig[],
  };
}
