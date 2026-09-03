"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_FEATURES, FEATURE_ORDER, type FeatureKey } from "@/lib/constants";
import { LEGAL_VERSION } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";
import { sendBekreftelse } from "@/lib/utsending";

export interface AuthState {
  error?: string;
  /** Set when the account exists but the address has to be confirmed first. */
  sjekkEpost?: string;
}

/**
 * Create the login account WITHOUT confirming the address, and hand back the
 * confirmation link.
 *
 * Every signup path used to pass email_confirm: true — "pre-confirmed for a
 * smooth first run". Smooth, but it meant anyone could register under an
 * address they did not own: a competitors, a customers, or one that does not
 * exist at all. generateLink creates the same user and returns the link
 * instead, so the address has to be proven before anyone gets in.
 *
 * Invitations are deliberately left as they were: the token was e-mailed to
 * that address, so whoever clicks it has already proven the mailbox.
 */
async function opprettUbekreftet(
  admin: ReturnType<typeof createAdminClient>,
  epost: string,
  passord: string,
  navn: string
): Promise<{ userId?: string; lenke?: string; error?: string }> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: epost,
    password: passord,
    options: {
      data: { full_name: navn },
      redirectTo: `${SITE_URL}/bekreftet`,
    },
  });
  if (error || !data?.user) {
    if (String(error?.message || "").toLowerCase().includes("already"))
      return { error: "En bruker med denne e-posten finnes allerede." };
    return { error: error?.message || "Kunne ikke opprette bruker." };
  }
  const lenke = data.properties?.action_link;
  if (!lenke) return { error: "Kunne ikke lage bekreftelseslenke." };
  return { userId: data.user.id, lenke };
}

/** Terms/privacy must be explicitly accepted on every signup path. */
function termsAccepted(formData: FormData): boolean {
  return formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true";
}
const TERMS_ERROR = "Du må godta vilkårene og personvernerklæringen for å fortsette.";
const termsFields = () => ({
  terms_accepted_version: LEGAL_VERSION,
  terms_accepted_at: new Date().toISOString(),
});

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
  if (!termsAccepted(formData)) return { error: TERMS_ERROR };

  // Only the features the form actually asks about. Looping over every key
  // instead turned off whatever the form had not caught up with yet — which
  // is how every new company ended up without Anbud and Finn kunder, with no
  // switch anywhere to turn them back on.
  const features: Record<FeatureKey, boolean> = { ...DEFAULT_FEATURES };
  FEATURE_ORDER.forEach((k) => {
    features[k] = featureRaw.includes(k);
  });

  const admin = createAdminClient();

  // 1. Create the login account, unconfirmed, and keep the confirmation link.
  const konto = await opprettUbekreftet(admin, adminEmail, password, adminName);
  if (konto.error || !konto.userId || !konto.lenke) return { error: konto.error };
  const userId = konto.userId;

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

  // 2b. Default pipeline stages for the new organisation
  await admin.rpc("seed_default_stages", { p_org: org.id });

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
    ...termsFields(),
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

  // 6. Nobody gets in before the address is proven. If the mail cannot be sent
  //    the account is useless, so it is removed rather than left stranded.
  const sendt = await sendBekreftelse(adminEmail, konto.lenke);
  if (!sendt) {
    await cleanup();
    return {
      error:
        "Vi fikk ikke sendt bekreftelsen til " +
        adminEmail +
        ". Sjekk at adressen er riktig, og prøv igjen.",
    };
  }
  return { sjekkEpost: adminEmail };
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
  const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.toLowerCase();
    // Supabase answers "Email not confirmed" in English. The person on the
    // other end registered days ago and has forgotten the mail exists.
    if (msg.includes("not confirmed") || msg.includes("email_not_confirmed"))
      return {
        error: "E-postadressen er ikke bekreftet ennå. Se etter e-posten fra Altiv.",
        sjekkEpost: email,
      };
    if (msg.includes("invalid")) return { error: "Feil e-post eller passord." };
    return { error: error.message };
  }
  // Platform owner (no tenant org) lands in /admin instead of the app.
  if (signIn.user) {
    const { data: me } = await createAdminClient()
      .from("profiles")
      .select("org_id, is_superadmin")
      .eq("id", signIn.user.id)
      .maybeSingle();
    if (me?.is_superadmin && !me.org_id) redirect("/admin");
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
  if (!termsAccepted(formData)) return { error: TERMS_ERROR };

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
    ...termsFields(),
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
// Join with company code (self-service seller signup)
// ------------------------------------------------------------
export interface JoinState {
  stage: "search" | "code" | "register";
  /** Set when the account exists but the address has to be confirmed first. */
  sjekkEpost?: string;
  error?: string;
  orgId?: string;
  orgName?: string;
  code?: string;
  departments?: { id: string; name: string }[];
}

/**
 * Search organisations by name, for someone joining a company they belong to.
 *
 * This runs on the service key and cannot require a login — the person has no
 * account yet. That makes it the one place where the customer list is readable
 * from outside, and with a single letter it used to return ten companies and
 * their internal ids. Walking the alphabet gave you the whole customer list.
 *
 * Three characters minimum and five results narrows it to something a person
 * joining actually types, and makes walking it tedious. It does not make it
 * impossible: the real fix is rate limiting, which the app does not have
 * anywhere yet.
 */
export async function searchCompanies(
  query: string
): Promise<{ id: string; name: string }[]> {
  if (missingEnv()) return [];
  const q = query.trim();
  if (q.length < 3) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name")
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(5);
  return data || [];
}

export async function joinAction(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  if (missingEnv())
    return { stage: "code", error: "Supabase er ikke konfigurert." };

  const stage = String(formData.get("stage") || "code");
  const code = String(formData.get("code") || "")
    .trim()
    .toLowerCase();
  const admin = createAdminClient();

  // Step 2 — company already chosen; validate the code for that company.
  if (stage === "code") {
    const orgId = String(formData.get("orgId") || "");
    if (!orgId) return { stage: "code", error: "Velg en bedrift først." };
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, join_code, join_code_rotate, join_code_rotated_at")
      .eq("id", orgId)
      .maybeSingle();
    if (!org) return { stage: "code", error: "Fant ikke bedriften." };
    // With auto-rotation on, a code older than 24h is expired: rotate it now and reject.
    if (
      org.join_code_rotate &&
      Date.now() - new Date(org.join_code_rotated_at).getTime() > 24 * 60 * 60 * 1000
    ) {
      const { randomBytes } = await import("crypto");
      await admin
        .from("organizations")
        .update({ join_code: randomBytes(4).toString("hex"), join_code_rotated_at: new Date().toISOString() })
        .eq("id", org.id);
      return {
        stage: "code",
        error: "Bedriftskoden er utløpt. Be administrator om den nye koden.",
        orgId,
        orgName: org.name,
      };
    }
    if (!code || code !== org.join_code)
      return { stage: "code", error: "Feil bedriftskode.", orgId, orgName: org.name };
    const { data: depts } = await admin
      .from("departments")
      .select("id, name")
      .eq("org_id", org.id)
      .order("created_at");
    return {
      stage: "register",
      orgId: org.id,
      orgName: org.name,
      code,
      departments: depts || [],
    };
  }

  // Step 2 — create the user's account in that organisation.
  const orgId = String(formData.get("orgId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const deptIds = (formData.getAll("deptIds") as string[]).filter(Boolean);

  const reload = async (error: string): Promise<JoinState> => {
    const { data: org } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .maybeSingle();
    const { data: depts } = await admin
      .from("departments")
      .select("id, name")
      .eq("org_id", orgId)
      .order("created_at");
    return {
      stage: "register",
      orgId,
      orgName: org?.name,
      code,
      departments: depts || [],
      error,
    };
  };

  // Re-validate the code still maps to this org.
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("join_code", code)
    .maybeSingle();
  if (!org) return { stage: "code", error: "Ugyldig bedriftskode." };

  if (!name) return reload("Skriv inn fullt navn.");
  if (!email) return reload("Skriv inn e-post.");
  if (password.length < 4) return reload("Passordet må ha minst 4 tegn.");
  if (!termsAccepted(formData)) return reload(TERMS_ERROR);

  const konto = await opprettUbekreftet(admin, email, password, name);
  if (konto.error || !konto.userId || !konto.lenke) return reload(konto.error!);
  const userId = konto.userId;

  const { error: profErr } = await admin.from("profiles").insert({
    id: userId,
    org_id: orgId,
    full_name: name,
    email,
    phone,
    role: "seller",
    status: "pending", // must be approved by an admin
    ...termsFields(),
  });
  if (profErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return reload(profErr.message);
  }

  if (deptIds.length)
    await admin
      .from("profile_departments")
      .insert(deptIds.map((id) => ({ profile_id: userId, department_id: id })));

  // Two gates from here: the address has to be confirmed, and an admin has to
  // approve the member (status is "pending" above). The mail comes first.
  const sendt = await sendBekreftelse(email, konto.lenke);
  if (!sendt) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return reload(
      `Vi fikk ikke sendt bekreftelsen til ${email}. Sjekk at adressen er riktig, og prøv igjen.`
    );
  }
  return { stage: "register", sjekkEpost: email };
}

/**
 * Send the confirmation again.
 *
 * Always answers the same way, whether or not the address exists. Telling an
 * unknown caller "no such user" turns this into a way to check which addresses
 * are registered with Altiv.
 */
export async function sendBekreftelsePaaNytt(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const svar = {
    sjekkEpost: String(formData.get("email") || "").trim().toLowerCase(),
  };
  if (missingEnv() || !svar.sjekkEpost) return svar;

  try {
    const admin = createAdminClient();
    // A magic link, not another signup link. Re-running signup would take a
    // password argument and could overwrite the one the person already chose —
    // a resend button must never be able to lock someone out. Clicking a magic
    // link proves the mailbox just as well, and Supabase marks the address
    // confirmed when it is used.
    const { data } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: svar.sjekkEpost,
      options: { redirectTo: `${SITE_URL}/bekreftet` },
    });
    const lenke = data?.properties?.action_link;
    if (lenke) await sendBekreftelse(svar.sjekkEpost, lenke);
  } catch {
    // Same answer either way.
  }
  return svar;
}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

// ------------------------------------------------------------
// Admin login (platform owner only)
// ------------------------------------------------------------

/**
 * Separate door for the /admin area, reached from the small footer link.
 *
 * It differs from login() in one deliberate way: an account without the
 * superadmin flag is signed straight out again and told no. The regular
 * login would happily send them to their own workspace — fine there, but
 * this form promises the admin area, and a door that quietly leads
 * somewhere else teaches people to mistrust doors.
 */
export async function adminLogin(
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
  const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid")) return { error: "Feil e-post eller passord." };
    return { error: error.message };
  }

  const { data: me } = await createAdminClient()
    .from("profiles")
    .select("is_superadmin")
    .eq("id", signIn.user?.id ?? "")
    .maybeSingle();

  if (!me?.is_superadmin) {
    await supabase.auth.signOut();
    return { error: "Denne innloggingen er kun for Stave Software." };
  }

  redirect("/admin");
}
