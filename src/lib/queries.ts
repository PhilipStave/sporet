import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile, Department, Member } from "@/types";

export interface SessionContext {
  profile: Profile;
  org: Organization;
  departments: Department[];
  members: Member[];
}

/**
 * Loads the logged-in user's profile, organisation, departments and team.
 * Returns null when the user is not authenticated or has no profile/org yet.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.org_id) return null;

  const [{ data: org }, { data: departments }, { data: profiles }, { data: links }] =
    await Promise.all([
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
    ]);

  if (!org) return null;

  const members: Member[] = (profiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    role: p.role,
    department_ids: (links || [])
      .filter((l) => l.profile_id === p.id)
      .map((l) => l.department_id),
  }));

  return {
    profile: profile as Profile,
    org: org as Organization,
    departments: (departments || []) as Department[],
    members,
  };
}
