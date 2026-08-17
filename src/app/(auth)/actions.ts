"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_FEATURES, type FeatureKey } from "@/lib/constants";

export interface AuthState {
  error?: string;
}

function missingEnv(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ------------------------------------------------------------
// Company setup (creates a new organisation + admin user)
// ------------------------------------------------------------
export async function setupCompany(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (missingEnv()) {
    return {
      error:
        "Supabase er ikke konfigurert. Fyll inn nøklene i .env.local og start på nytt.",
    };
  }

  const company = String(formData.get("company") || "").trim();
  const depts = (formData.getAll("depts") as string[])
    .map((d) => d.trim())
    .filter(Boolean);
  const featureRaw = (formData.getAll("features") as string[]) || [];
  const adminName = String(formData.get("adminName") || "").trim();
  const adminEmail = String(formData.get("adminEmail") || "")
    .trim()
    .toLowerCase();
  const adminPhone = String(formData.get("adminPhone") || "").trim();
  const adminDepts = (formData.getAll("adminDepts") as string[])
    .map((d) => d.trim())
    .filter(Boolean);
  const password = String(formData.get("password") || "");

  if (!company) return { error: "Skriv inn bedriftsnavn." };
  if (depts.length === 0) return { error: "Legg til minst én avdeling." };
  if (password.length < 4) return { error: "Passordet må ha minst 4 tegn." };
  if (!adminName || !adminEmail)
    return { error: "Fyll inn navn og e-post for administrator." };

  const features: Record<FeatureKey, boolean> = { ...DEFAULT_FEATURES };
  (Object.keys(features) as FeatureKey[]).forEach((k) => {
    features[k] = featureRaw.includes(k);
  });

  const admin = createAdminClient();

  // 1. Create the auth user (email pre-confirmed for a smooth first run).
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: adminName },
  });
  if (userErr || !created.user) {
    if (String(userErr?.message || "").toLowerCase().includes("already"))
      return { error: "En bruker med denne e-posten finnes allerede." };
    return { error: userErr?.message || "Kunne ikke opprette bruker." };
  }
  const userId = created.user.id;

  const cleanup = async () => {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  };

  // 2. Organisation
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: company, features })
    .select("id")
    .single();
  if (orgErr || !org) {
    await cleanup();
    return { error: orgErr?.message || "Kunne ikke opprette bedrift." };
  }

  // 3. Departments
  const { data: deptRows, error: deptErr } = await admin
    .from("departments")
    .insert(depts.map((name) => ({ org_id: org.id, name })))
    .select("id, name");
  if (deptErr || !deptRows) {
    await cleanup();
    return { error: deptErr?.message || "Kunne ikke opprette avdelinger." };
  }

  // 4. Admin profile
  const { error: profErr } = await admin.from("profiles").insert({
    id: userId,
    org_id: org.id,
    full_name: adminName,
    email: adminEmail,
    phone: adminPhone,
    role: "admin",
  });
  if (profErr) {
    await cleanup();
    return { error: profErr.message };
  }

  // 5. Link admin to chosen departments (default: all)
  const chosen = adminDepts.length ? adminDepts : depts;
  const links = deptRows
    .filter((d) => chosen.includes(d.name))
    .map((d) => ({ profile_id: userId, department_id: d.id }));
  if (links.length) await admin.from("profile_departments").insert(links);

  // 6. Sign in (sets the session cookie)
  const supabase = await createClient();
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  if (signErr) return { error: signErr.message };

  redirect("/app/oversikt");
}

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------
export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (missingEnv())
    return {
      error:
        "Supabase er ikke konfigurert. Fyll inn nøklene i .env.local og start på nytt.",
    };

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Fyll inn e-post og passord." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid")) return { error: "Feil e-post eller passord." };
    return { error: error.message };
  }
  redirect("/app/oversikt");
}

// ------------------------------------------------------------
// Accept invite (seller joins an existing organisation)
// ------------------------------------------------------------
export async function acceptInvite(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (missingEnv())
    return {
      error:
        "Supabase er ikke konfigurert. Fyll inn nøklene i .env.local og start på nytt.",
    };

  const token = String(formData.get("token") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const deptIds = (formData.getAll("deptIds") as string[]).filter(Boolean);

  if (!name) return { error: "Skriv inn fullt navn." };
  if (password.length < 4) return { error: "Passordet må ha minst 4 tegn." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("id, org_id, email, role, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "Ugyldig invitasjon." };
  if (invite.used_at) return { error: "Invitasjonen er allerede brukt." };

  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (userErr || !created.user) {
    if (String(userErr?.message || "").toLowerCase().includes("already"))
      return { error: "En bruker med denne e-posten finnes allerede." };
    return { error: userErr?.message || "Kunne ikke opprette bruker." };
  }
  const userId = created.user.id;

  const { error: profErr } = await admin.from("profiles").insert({
    id: userId,
    org_id: invite.org_id,
    full_name: name,
    email: invite.email,
    phone,
    role: invite.role,
  });
  if (profErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return { error: profErr.message };
  }

  if (deptIds.length)
    await admin
      .from("profile_departments")
      .insert(deptIds.map((id) => ({ profile_id: userId, department_id: id })));

  await admin.from("invites").update({ used_at: new Date().toISOString() }).eq("id", invite.id);

  const supabase = await createClient();
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  });
  if (signErr) return { error: signErr.message };

  redirect("/app/oversikt");
}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
