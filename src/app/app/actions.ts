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

/** Admin sets a new password for a member (passwords are never readable —
 *  they are stored hashed — so "reset" is the only possible operation). */
export async function setMemberPassword(
  profileId: string,
  password: string
): Promise<ProfileResult> {
  try {
    const me = await requireAdmin();
    if (password.length < 4) return { error: "Passordet må ha minst 4 tegn." };
    const admin = createAdminClient();
    if (!(await sameOrg(admin, me.org_id, profileId)))
      return { error: "Ikke i din bedrift." };
    const { error } = await admin.auth.admin.updateUserById(profileId, { password });
    if (error) return { error: error.message };
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** A user changes their own password. */
export async function changeMyPassword(password: string): Promise<ProfileResult> {
  try {
    const me = await currentProfile();
    if (password.length < 4) return { error: "Passordet må ha minst 4 tegn." };
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(me.id, { password });
    if (error) return { error: error.message };
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Permanently delete the whole organisation: all deals, activities, departments,
 * invites, members and their login accounts, and cancel any Stripe subscription.
 * Admin only. Requires the exact company name as confirmation.
 */
export async function deleteOrganization(confirmName: string): Promise<ProfileResult> {
  try {
    const me = await requireAdmin();
    if (!me.org_id) return { error: "Fant ikke bedrift." };
    const admin = createAdminClient();
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, stripe_subscription_id")
      .eq("id", me.org_id)
      .single();
    if (!org) return { error: "Fant ikke bedrift." };
    if (confirmName.trim() !== org.name.trim())
      return { error: "Bedriftsnavnet stemmer ikke. Skriv det nøyaktig slik det står." };

    // Cancel Stripe subscription immediately (best effort).
    if (org.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const { stripe } = await import("@/lib/stripe");
        await stripe().subscriptions.cancel(org.stripe_subscription_id);
      } catch (e) {
        console.error("stripe cancel failed:", (e as Error).message);
      }
    }

    // Collect member ids, then delete the org (cascades deals/activities/departments/invites/profiles).
    const { data: members } = await admin
      .from("profiles")
      .select("id")
      .eq("org_id", org.id);
    const { error } = await admin.from("organizations").delete().eq("id", org.id);
    if (error) return { error: error.message };

    // Delete the login accounts (auth users). Own account last.
    const ids = (members || []).map((m) => m.id).filter((id) => id !== me.id);
    for (const id of ids) await admin.auth.admin.deleteUser(id).catch(() => {});
    await admin.auth.admin.deleteUser(me.id).catch(() => {});
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Record acceptance of the current terms version for the logged-in user. */
export async function acceptCurrentTerms(): Promise<ProfileResult> {
  try {
    const me = await currentProfile();
    const { LEGAL_VERSION } = await import("@/lib/legal");
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        terms_accepted_version: LEGAL_VERSION,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", me.id);
    if (error) return { error: error.message };
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
