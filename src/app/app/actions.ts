"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

async function currentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Ikke innlogget");
  const { data: me } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", user.id)
    .single();
  if (!me) throw new Error("Fant ikke profil");
  return me;
}

async function requireAdmin() {
  const me = await currentProfile();
  if (me.role !== "admin") throw new Error("Krever administrator");
  return me;
}

async function sameOrg(admin: ReturnType<typeof createAdminClient>, orgId: string | null, targetId: string) {
  const { data } = await admin
    .from("profiles")
    .select("id, org_id")
    .eq("id", targetId)
    .single();
  return data && data.org_id === orgId;
}

export interface ProfileResult {
  ok?: boolean;
  error?: string;
}

/** Approve a pending member. */
export async function approveMember(profileId: string): Promise<ProfileResult> {
  try {
    const me = await requireAdmin();
    const admin = createAdminClient();
    if (!(await sameOrg(admin, me.org_id, profileId)))
      return { error: "Ikke i din bedrift." };
    await admin.from("profiles").update({ status: "active" }).eq("id", profileId);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Reject / remove a member (deletes the account). */
export async function removeMember(profileId: string): Promise<ProfileResult> {
  try {
    const me = await requireAdmin();
    if (profileId === me.id) return { error: "Du kan ikke fjerne deg selv." };
    const admin = createAdminClient();
    if (!(await sameOrg(admin, me.org_id, profileId)))
      return { error: "Ikke i din bedrift." };
    await admin.auth.admin.deleteUser(profileId).catch(() => {});
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Admin edits another member's details. */
export async function updateMember(
  profileId: string,
  fields: { full_name?: string; email?: string; phone?: string; role?: "admin" | "seller" }
): Promise<ProfileResult> {
  try {
    const me = await requireAdmin();
    const admin = createAdminClient();
    if (!(await sameOrg(admin, me.org_id, profileId)))
      return { error: "Ikke i din bedrift." };

    const email = fields.email?.trim().toLowerCase();
    await admin
      .from("profiles")
      .update({
        ...(fields.full_name !== undefined ? { full_name: fields.full_name.trim() } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(fields.phone !== undefined ? { phone: fields.phone.trim() } : {}),
        ...(fields.role !== undefined ? { role: fields.role } : {}),
      })
      .eq("id", profileId);

    if (email)
      await admin.auth.admin.updateUserById(profileId, { email, email_confirm: true });
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** A user edits their own name / email / phone. */
export async function updateMyProfile(fields: {
  full_name: string;
  email: string;
  phone: string;
}): Promise<ProfileResult> {
  try {
    const me = await currentProfile();
    const admin = createAdminClient();
    const email = fields.email.trim().toLowerCase();
    await admin
      .from("profiles")
      .update({
        full_name: fields.full_name.trim(),
        email,
        phone: fields.phone.trim(),
      })
      .eq("id", me.id);
    if (email)
      await admin.auth.admin.updateUserById(me.id, { email, email_confirm: true });
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
