import { createClient, createAdminClient } from "@/lib/supabase/server";
import { computeAccess, PLANS } from "@/lib/billing";
import type { Organization } from "@/types";

// Cross-tenant data for the platform owner (/admin). Service-role client, gated by profiles.is_superadmin.

export async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("id, full_name, email, is_superadmin")
    .eq("id", user.id)
    .single();
  if (!me?.is_superadmin) return null;
  return me;
}

export type OrgSummary = {
  org: Organization;
  access: ReturnType<typeof computeAccess>;
  planPrice: number;
  users: number;
  pendingUsers: number;
  admins: number;
  deals: number;
  wonValue: number;
  activities7d: number;
  emails: number;
  documents: number;
  lastActivityAt: string | null;
  lastSignInAt: string | null;
};

export type AdminOverview = {
  orgs: OrgSummary[];
  totals: {
    orgs: number;
    trial: number;
    active: number;
    pastDue: number;
    expired: number;
    users: number;
    mrr: number;
    newOrgs30d: number;
    activeOrgs7d: number;
  };
};

export async function loadAdminOverview(): Promise<AdminOverview> {
  const admin = createAdminClient();
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: orgs }, { data: profiles }, { data: deals }, { data: acts7 }, { data: acts }, { data: emails }, { data: docs }, authUsers] =
    await Promise.all([
      admin.from("organizations").select("*").order("created_at", { ascending: false }),
      admin.from("profiles").select("id, org_id, role, status"),
      admin.from("deals").select("org_id, stage, value, won_at"),
      admin.from("activities").select("org_id").gte("created_at", since7),
      admin.from("activities").select("org_id, created_at").order("created_at", { ascending: false }).limit(5000),
      admin.from("inbound_emails").select("org_id"),
      admin.from("deal_documents").select("org_id"),
      listAllAuthUsers(admin),
    ]);

  const lastSignIn = new Map<string, string>(); // profile id → last sign in
  for (const u of authUsers) if (u.last_sign_in_at) lastSignIn.set(u.id, u.last_sign_in_at);

  const byOrg = <T extends { org_id: string | null }>(rows: T[] | null) => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) {
      if (!r.org_id) continue;
      const arr = m.get(r.org_id) ?? [];
      arr.push(r);
      m.set(r.org_id, arr);
    }
    return m;
  };
  const pMap = byOrg(profiles);
  const dMap = byOrg(deals);
  const a7Map = byOrg(acts7);
  const aMap = byOrg(acts);
  const eMap = byOrg(emails);
  const docMap = byOrg(docs);

  const summaries: OrgSummary[] = (orgs ?? []).map((org) => {
    const ps = pMap.get(org.id) ?? [];
    const ds = dMap.get(org.id) ?? [];
    const access = computeAccess(org);
    const plan = PLANS.find((p) => p.id === org.plan);
    const planPrice = access.state === "active" || access.state === "past_due" ? plan?.price ?? 0 : 0;
    let lastSign: string | null = null;
    for (const p of ps) {
      const t = lastSignIn.get(p.id);
      if (t && (!lastSign || t > lastSign)) lastSign = t;
    }
    return {
      org,
      access,
      planPrice,
      users: ps.filter((p) => p.status === "active").length,
      pendingUsers: ps.filter((p) => p.status === "pending").length,
      admins: ps.filter((p) => p.role === "admin" && p.status === "active").length,
      deals: ds.length,
      wonValue: ds.filter((d) => d.stage === "vunnet").reduce((s, d) => s + Number(d.value || 0), 0),
      activities7d: (a7Map.get(org.id) ?? []).length,
      emails: (eMap.get(org.id) ?? []).length,
      documents: (docMap.get(org.id) ?? []).length,
      lastActivityAt: (aMap.get(org.id) ?? [])[0]?.created_at ?? null,
      lastSignInAt: lastSign,
    };
  });

  const totals = {
    orgs: summaries.length,
    trial: summaries.filter((s) => s.access.state === "trial").length,
    active: summaries.filter((s) => s.access.state === "active").length,
    pastDue: summaries.filter((s) => s.access.state === "past_due").length,
    expired: summaries.filter((s) => s.access.state === "expired" || s.access.state === "canceled").length,
    users: summaries.reduce((n, s) => n + s.users, 0),
    mrr: summaries.reduce((n, s) => n + s.planPrice, 0),
    newOrgs30d: summaries.filter((s) => s.org.created_at >= since30).length,
    activeOrgs7d: summaries.filter((s) => s.activities7d > 0 || (s.lastSignInAt && s.lastSignInAt >= since7)).length,
  };

  return { orgs: summaries, totals };
}

export type OrgDetail = {
  summary: OrgSummary;
  members: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    created_at: string;
    last_sign_in_at: string | null;
    deals: number;
  }[];
  departments: { id: string; name: string }[];
  stageCounts: { key: string; label: string; count: number; value: number }[];
  recentActivity: { label: string; note: string; actor_name: string; created_at: string }[];
  unmatchedEmails: number;
};

export async function loadOrgDetail(orgId: string): Promise<OrgDetail | null> {
  const admin = createAdminClient();
  const overview = await loadAdminOverview();
  const summary = overview.orgs.find((o) => o.org.id === orgId);
  if (!summary) return null;

  const [{ data: profiles }, { data: depts }, { data: stages }, { data: deals }, { data: acts }, authUsers] =
    await Promise.all([
      admin.from("profiles").select("id, full_name, email, phone, role, status, created_at").eq("org_id", orgId).order("created_at"),
      admin.from("departments").select("id, name").eq("org_id", orgId).order("name"),
      admin.from("pipeline_stages").select("key, label, position").eq("org_id", orgId).order("position"),
      admin.from("deals").select("stage, value, owner_id").eq("org_id", orgId),
      admin.from("activities").select("label, note, actor_name, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(25),
      listAllAuthUsers(admin),
    ]);

  const signIn = new Map(authUsers.map((u) => [u.id, u.last_sign_in_at ?? null]));
  const dealsByOwner = new Map<string, number>();
  for (const d of deals ?? []) if (d.owner_id) dealsByOwner.set(d.owner_id, (dealsByOwner.get(d.owner_id) ?? 0) + 1);

  const stageCounts = (stages ?? []).map((s) => {
    const rows = (deals ?? []).filter((d) => d.stage === s.key);
    return { key: s.key, label: s.label, count: rows.length, value: rows.reduce((n, d) => n + Number(d.value || 0), 0) };
  });

  const { count: unmatchedCount } = await admin
    .from("inbound_emails")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "unmatched");

  return {
    summary,
    members: (profiles ?? []).map((p) => ({
      ...p,
      last_sign_in_at: signIn.get(p.id) ?? null,
      deals: dealsByOwner.get(p.id) ?? 0,
    })),
    departments: depts ?? [],
    stageCounts,
    recentActivity: acts ?? [],
    unmatchedEmails: unmatchedCount ?? 0,
  };
}

async function listAllAuthUsers(admin: ReturnType<typeof createAdminClient>) {
  const out: { id: string; last_sign_in_at?: string }[] = [];
  let page = 1;
  for (;;) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    out.push(...users.map((u) => ({ id: u.id, last_sign_in_at: u.last_sign_in_at })));
    if (users.length < 1000) break;
    page++;
  }
  return out;
}
