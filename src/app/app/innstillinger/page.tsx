"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/Store";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import {
  FEATURE_ORDER,
  FEATURE_LABELS,
  type FeatureKey,
} from "@/lib/constants";
import { initials } from "@/lib/format";

export default function InnstillingerPage() {
  const { org, profile, departments, members } = useStore();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [companyName, setCompanyName] = useState(org.name);
  const [features, setFeatures] = useState(org.features);
  const [newDept, setNewDept] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"seller" | "admin">("seller");
  const [inviteLink, setInviteLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (profile.role !== "admin") {
    return (
      <div className="animate-fade">
        <h2 style={{ fontSize: 26, marginBottom: 8 }}>Innstillinger</h2>
        <p style={{ color: "var(--muted)" }}>
          Bare administratorer har tilgang til innstillinger.
        </p>
      </div>
    );
  }

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  const saveCompany = async () => {
    setBusy(true);
    await supabase.from("organizations").update({ name: companyName }).eq("id", org.id);
    setBusy(false);
    flash("Bedriftsnavn lagret.");
    router.refresh();
  };

  const saveFeatures = async (next: Record<FeatureKey, boolean>) => {
    setFeatures(next);
    await supabase.from("organizations").update({ features: next }).eq("id", org.id);
    router.refresh();
  };

  const addDept = async () => {
    const name = newDept.trim();
    if (!name) return;
    setNewDept("");
    await supabase.from("departments").insert({ org_id: org.id, name });
    router.refresh();
  };

  const renameDept = async (id: string, name: string) => {
    await supabase.from("departments").update({ name }).eq("id", id);
    router.refresh();
  };

  const deleteDept = async (id: string) => {
    if (!confirm("Slette avdelingen? Kunder beholdes, men mister avdeling.")) return;
    await supabase.from("departments").delete().eq("id", id);
    router.refresh();
  };

  const createInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("invites")
      .insert({ org_id: org.id, email, role: inviteRole })
      .select("token")
      .single();
    setBusy(false);
    if (error || !data) {
      flash(error?.message || "Kunne ikke lage invitasjon.");
      return;
    }
    const base =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    setInviteLink(`${base}/invitasjon/${data.token}`);
    setInviteEmail("");
    flash("Invitasjon opprettet. Del lenken med selgeren.");
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 760 }}>
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>Innstillinger</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 22px" }}>
        Administrer bedrift, avdelinger, funksjoner og team.
      </p>

      {msg && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "var(--primary-050)",
            color: "var(--primary)",
            borderRadius: 10,
            fontSize: 14,
          }}
        >
          {msg}
        </div>
      )}

      {/* Company */}
      <Section title="Bedrift">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label className="field-label" style={{ flex: 1 }}>
            Bedriftsnavn
            <input
              className="field-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          <button className="btn btn-primary" onClick={saveCompany} disabled={busy}>
            Lagre
          </button>
        </div>
      </Section>

      {/* Features */}
      <Section title="Funksjoner">
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
          Oversikt og Pipeline er alltid med.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FEATURE_ORDER.map((k) => (
            <button
              key={k}
              className="chip"
              data-active={features[k]}
              onClick={() => saveFeatures({ ...features, [k]: !features[k] })}
            >
              {features[k] && <Icon name="check" size={13} />}
              {FEATURE_LABELS[k]}
            </button>
          ))}
        </div>
      </Section>

      {/* Departments */}
      <Section title="Avdelinger">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {departments.map((d) => (
            <div key={d.id} style={{ display: "flex", gap: 8 }}>
              <input
                className="field-input"
                defaultValue={d.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== d.name)
                    renameDept(d.id, e.target.value.trim());
                }}
              />
              <button
                className="btn"
                aria-label="Slett avdeling"
                onClick={() => deleteDept(d.id)}
                style={{ width: 40, padding: 0 }}
              >
                <Icon name="x" size={15} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            className="field-input"
            value={newDept}
            placeholder="Ny avdeling"
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDept()}
          />
          <button className="btn" onClick={addDept}>
            <Icon name="plus" size={15} /> Legg til
          </button>
        </div>
      </Section>

      {/* Team */}
      <Section title="Team">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "var(--primary-050)",
                  color: "var(--primary)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {initials(m.full_name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.full_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.email}</div>
              </div>
              <span
                className="pill"
                style={{ background: "var(--primary-050)", color: "var(--primary)" }}
              >
                {m.role === "admin" ? "Administrator" : "Selger"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Invite */}
      <Section title="Inviter selger">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label className="field-label" style={{ flex: 1, minWidth: 200 }}>
            E-post
            <input
              className="field-input"
              value={inviteEmail}
              placeholder="selger@bedrift.no"
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          <div className="pillgroup">
            <button
              data-active={inviteRole === "seller"}
              onClick={() => setInviteRole("seller")}
            >
              Selger
            </button>
            <button
              data-active={inviteRole === "admin"}
              onClick={() => setInviteRole("admin")}
            >
              Admin
            </button>
          </div>
          <button className="btn btn-primary" onClick={createInvite} disabled={busy}>
            Lag invitasjon
          </button>
        </div>
        {inviteLink && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              className="field-input"
              value={inviteLink}
              readOnly
              onFocus={(e) => e.target.select()}
              style={{ fontSize: 13 }}
            />
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard?.writeText(inviteLink);
                flash("Lenke kopiert.");
              }}
            >
              Kopier
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <h4 style={{ fontSize: 16, marginBottom: 14 }}>{title}</h4>
      {children}
    </div>
  );
}
