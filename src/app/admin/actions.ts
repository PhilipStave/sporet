"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/admin-data";
import type { Plan, SubscriptionStatus } from "@/types/database";

export interface AdminResult {
  ok?: boolean;
  error?: string;
}

/** Manually set plan + status (e.g. grant free access, mark as paid by invoice). */
export async function adminSetSubscription(
  orgId: string,
  plan: Plan,
  status: SubscriptionStatus,
  periodEnd: string | null
): Promise<AdminResult> {
  if (!(await requireSuperadmin())) return { error: "Ingen tilgang" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ plan, subscription_status: status, current_period_end: periodEnd })
    .eq("id", orgId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/${orgId}`);
  return { ok: true };
}

/** Extend (or set) the trial end date. */
export async function adminSetTrialEnd(orgId: string, trialEndsAt: string): Promise<AdminResult> {
  if (!(await requireSuperadmin())) return { error: "Ingen tilgang" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ trial_ends_at: trialEndsAt, subscription_status: "trialing" })
    .eq("id", orgId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/${orgId}`);
  return { ok: true };
}

/** Delete an organisation and all its users/data. */
export async function adminDeleteOrg(orgId: string, confirmName: string): Promise<AdminResult> {
  if (!(await requireSuperadmin())) return { error: "Ingen tilgang" };
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id, name").eq("id", orgId).single();
  if (!org) return { error: "Fant ikke bedriften" };
  if (org.name !== confirmName) return { error: "Navnet stemmer ikke" };
  const { data: profiles } = await admin.from("profiles").select("id").eq("org_id", orgId);
  for (const p of profiles ?? []) await admin.auth.admin.deleteUser(p.id).catch(() => {});
  const { data: docs } = await admin.from("deal_documents").select("path").eq("org_id", orgId);
  if (docs?.length) await admin.storage.from("documents").remove(docs.map((d) => d.path)).catch(() => {});
  const { error } = await admin.from("organizations").delete().eq("id", orgId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

/** Reset a user's password (support). */
export async function adminSetUserPassword(userId: string, password: string): Promise<AdminResult> {
  if (!(await requireSuperadmin())) return { error: "Ingen tilgang" };
  if (password.length < 6) return { error: "Minst 6 tegn" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { ok: true };
}
