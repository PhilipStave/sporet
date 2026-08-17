import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { InviteForm } from "./InviteForm";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,20,32,.14)",
  padding: 30,
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let invalid = "";
  let orgName = "";
  let email = "";
  let departments: { id: string; name: string }[] = [];

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    invalid = "Supabase er ikke konfigurert ennå.";
  } else {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("invites")
      .select("org_id, email, used_at")
      .eq("token", token)
      .maybeSingle();

    if (!invite) invalid = "Denne invitasjonen finnes ikke.";
    else if (invite.used_at) invalid = "Denne invitasjonen er allerede brukt.";
    else {
      email = invite.email;
      const [{ data: org }, { data: depts }] = await Promise.all([
        admin.from("organizations").select("name").eq("id", invite.org_id).single(),
        admin
          .from("departments")
          .select("id, name")
          .eq("org_id", invite.org_id)
          .order("created_at"),
      ]);
      orgName = org?.name || "";
      departments = depts || [];
    }
  }

  if (invalid) {
    return (
      <div style={cardStyle} className="animate-fade">
        <div style={{ marginBottom: 18 }}>
          <Logo />
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 8 }}>Ugyldig invitasjon</h3>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--muted)" }}>
          {invalid}
        </p>
        <Link href="/login" className="btn btn-primary">
          Til innlogging
        </Link>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="animate-fade">
      <div style={{ marginBottom: 18 }}>
        <Logo />
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>
        Bli med i {orgName || "teamet"}
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
        Du er invitert som selger. Velg passord og avdelingene dine, så er du i
        gang.
      </p>
      <InviteForm token={token} email={email} departments={departments} />
    </div>
  );
}
