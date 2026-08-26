"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BillingSection } from "@/components/BillingSection";
import { CalendarSection } from "@/components/CalendarSection";
import { EmailLoggingSection } from "@/components/EmailLoggingSection";
import { StagesEditor } from "@/components/StagesEditor";
import { useStore } from "@/store/Store";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import {
  FEATURE_ORDER,
  FEATURE_LABELS,
  type FeatureKey,
} from "@/lib/constants";
import { initials } from "@/lib/format";
import type { Member } from "@/types";
import {
  approveMember,
  removeMember,
  updateMember,
  updateMyProfile,
  setMemberPassword,
  changeMyPassword,
  deleteOrganization,
} from "../actions";

export default function InnstillingerPage() {
  const { org, profile, departments, members } = useStore();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isAdmin = profile.role === "admin";

  const [companyName, setCompanyName] = useState(org.name);
  // Missing flags (features added after the org was created) count as enabled.
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(() => {
    const f = { ...org.features } as Record<FeatureKey, boolean>;
    FEATURE_ORDER.forEach((k) => {
      if (f[k] === undefined) f[k] = true;
    });
    return f;
  });
  const [newDept, setNewDept] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"seller" | "admin">("seller");
  const [inviteLink, setInviteLink] = useState("");
  const [joinCode, setJoinCode] = useState(org.join_code);
  const [autoRotate, setAutoRotate] = useState(org.join_code_rotate);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // My profile
  const [myName, setMyName] = useState(profile.full_name);
  const [myEmail, setMyEmail] = useState(profile.email);
  const [myPhone, setMyPhone] = useState(profile.phone);
  const [myNewPw, setMyNewPw] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const deleteCompany = async () => {
    if (
      !confirm(
        `Er du HELT sikker? Dette sletter «${org.name}» med alle kunder, aktiviteter, avdelinger og brukere for godt. Det kan ikke angres.`
      )
    )
      return;
    setDeleting(true);
    const res = await deleteOrganization(delConfirm);
    if (res.error) {
      setDeleting(false);
      flash(res.error);
      return;
    }
    // Everything is gone, including our own login — go to the front page.
    router.replace("/");
    router.refresh();
  };

  const saveMyPassword = async () => {
    setBusy(true);
    const res = await changeMyPassword(myNewPw);
    setBusy(false);
    flash(res.error ? res.error : "Passordet er endret.");
    if (!res.error) setMyNewPw("");
  };

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2600);
  };

  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status !== "pending");

  // ---- my profile ----
  const saveMyProfile = async () => {
    setBusy(true);
    const res = await updateMyProfile({
      full_name: myName,
      email: myEmail,
      phone: myPhone,
    });
    setBusy(false);
    flash(res.error ? res.error : "Profilen din er lagret.");
    if (!res.error) router.refresh();
  };

  // ---- company / admin ops ----
  const addDept = async () => {
    const name = newDept.trim();
    if (!name) return;
    setNewDept("");
    await supabase.from("departments").insert({ org_id: org.id, name });
    router.refresh();
  };
  // Department names are edited locally and written on save, like the rest.
  const [deptNavn, setDeptNavn] = useState<Record<string, string>>({});
  const deptNavnet = (id: string, fallback: string) => deptNavn[id] ?? fallback;

  const navnEndret = companyName.trim() !== org.name;
  const funksjonerEndret = FEATURE_ORDER.some(
    (k) => features[k] !== (org.features[k] !== false)
  );
  const avdelingerEndret = departments.some(
    (d) => deptNavn[d.id] !== undefined && deptNavn[d.id].trim() !== d.name
  );
  const harEndringer = navnEndret || funksjonerEndret || avdelingerEndret;

  /** One save for everything on the page that is a field rather than an action. */
  const lagreAlt = async () => {
    setBusy(true);
    if (navnEndret) {
      await supabase
        .from("organizations")
        .update({ name: companyName.trim() })
        .eq("id", org.id);
    }
    if (funksjonerEndret) {
      await supabase.from("organizations").update({ features }).eq("id", org.id);
    }
    for (const d of departments) {
      const nytt = deptNavn[d.id]?.trim();
      if (nytt && nytt !== d.name) {
        await supabase.from("departments").update({ name: nytt }).eq("id", d.id);
      }
    }
    setDeptNavn({});
    setBusy(false);
    flash("Endringene er lagret.");
    router.refresh();
  };

  const slettTimere = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [slettede, setSlettede] = useState<string[]>([]);
  const [angre, setAngre] = useState<{ id: string; name: string } | null>(null);

  const deleteDept = (id: string, name: string) => {
    // Hide it now, delete for real after the undo window. Nothing has left the
    // database yet, so undo is just cancelling a timer — no restore needed.
    setSlettede((s) => [...s, id]);
    const t = setTimeout(async () => {
      slettTimere.current.delete(id);
      setAngre((a) => (a?.id === id ? null : a));
      await supabase.from("departments").delete().eq("id", id);
      router.refresh();
    }, 6000);
    slettTimere.current.set(id, t);
    setAngre({ id, name });
  };

  const angreSletting = (id: string) => {
    const t = slettTimere.current.get(id);
    if (t) clearTimeout(t);
    slettTimere.current.delete(id);
    setSlettede((s) => s.filter((x) => x !== id));
    setAngre(null);
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
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    setInviteLink(`${base}/invitasjon/${data.token}`);
    setInviteEmail("");
    flash("Invitasjon opprettet. Del lenken med selgeren.");
  };

  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const joinLink = `${siteBase}/bli-med?kode=${joinCode}`;

  const regenerateCode = async () => {
    if (
      !confirm(
        "Lage ny bedriftskode? Den gamle slutter å virke, så del den nye med teamet."
      )
    )
      return;
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setJoinCode(code);
    await supabase.from("organizations").update({ join_code: code }).eq("id", org.id);
    flash("Ny bedriftskode laget.");
    router.refresh();
  };

  // ---- member approval / removal ----
  const approve = async (id: string) => {
    const res = await approveMember(id);
    flash(res.error ? res.error : "Bruker godkjent.");
    if (!res.error) router.refresh();
  };
  const reject = async (id: string, name: string) => {
    if (!confirm(`Avvise og slette ${name || "denne brukeren"}?`)) return;
    const res = await removeMember(id);
    flash(res.error ? res.error : "Bruker fjernet.");
    if (!res.error) router.refresh();
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 760 }}>
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>Innstillinger</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 22px" }}>
        {isAdmin
          ? "Administrer profilen din, bedrift, avdelinger, funksjoner og team."
          : "Administrer profilen din."}
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

      {/* My profile — everyone */}
      <Section title="Min profil">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label className="field-label">
            Fullt navn
            <input
              className="field-input"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label className="field-label" style={{ flex: 1 }}>
              E-postadresse
              <input
                className="field-input"
                type="email"
                value={myEmail}
                onChange={(e) => setMyEmail(e.target.value)}
                style={{ marginTop: 5 }}
              />
            </label>
            <label className="field-label" style={{ flex: 1 }}>
              Telefonnummer
              <input
                className="field-input"
                type="tel"
                value={myPhone}
                onChange={(e) => setMyPhone(e.target.value)}
                style={{ marginTop: 5 }}
              />
            </label>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={saveMyProfile}
              disabled={busy}
            >
              Lagre profil
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
            E-posten er også innloggingen din. Endrer du den, logger du inn med den
            nye neste gang.
          </p>

          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
          <span className="field-label">Bytt passord</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="field-input"
              type="password"
              value={myNewPw}
              placeholder="Nytt passord (minst 4 tegn)"
              onChange={(e) => setMyNewPw(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn"
              onClick={saveMyPassword}
              disabled={busy || myNewPw.length < 4}
            >
              Sett passord
            </button>
          </div>
        </div>
      </Section>

      <Section title="Kalender">
        <CalendarSection initialToken={profile.calendar_token ?? null} />
      </Section>

      <Section title="E-postlogging">
        <EmailLoggingSection initialKey={org.inbound_key ?? null} />
      </Section>

      {isAdmin && (
        <>
          {/* Subscription / billing */}
          <Suspense fallback={null}>
            <BillingSection />
          </Suspense>

          {/* Pending approvals */}
          {pending.length > 0 && (
            <Section title={`Til godkjenning (${pending.length})`}>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
                Disse har meldt seg på med bedriftskoden og venter på godkjenning.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pending.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      border: "1px solid var(--tint-warn-border)",
                      background: "var(--tint-warn)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {m.full_name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {[m.email, m.phone].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => approve(m.id)}
                      style={{ padding: "7px 12px" }}
                    >
                      <Icon name="check" size={14} /> Godkjenn
                    </button>
                    <button
                      className="btn"
                      onClick={() => reject(m.id, m.full_name)}
                      style={{ padding: "7px 12px" }}
                    >
                      Avvis
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Company */}
          <Section title="Bedrift">
            <label className="field-label" style={{ display: "block" }}>
              Bedriftsnavn
              <input
                className="field-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ marginTop: 5 }}
              />
            </label>
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
                  onClick={() => setFeatures((f) => ({ ...f, [k]: !f[k] }))}
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
              {departments.filter((d) => !slettede.includes(d.id)).map((d) => (
                <div key={d.id} style={{ display: "flex", gap: 8 }}>
                  <input
                    className="field-input"
                    value={deptNavnet(d.id, d.name)}
                    onChange={(e) =>
                      setDeptNavn((n) => ({ ...n, [d.id]: e.target.value }))
                    }
                  />
                  <button
                    className="btn"
                    aria-label="Slett avdeling"
                    onClick={() => deleteDept(d.id, d.name)}
                    style={{ width: 40, padding: 0 }}
                  >
                    <Icon name="x" size={15} />
                  </button>
                </div>
              ))}
            </div>
            {angre && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "var(--tint-neutral)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--muted)" }}>
                  «{angre.name}» slettet
                </span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => angreSletting(angre.id)}
                  style={{ padding: "5px 12px", fontSize: 12.5 }}
                >
                  Angre
                </button>
              </div>
            )}

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

          {/* Saves bedrift, funksjoner and department names in one go. Sticks to
              the bottom so it is reachable without scrolling back up. */}
          {harEndringer && (
            <div
              style={{
                position: "sticky",
                bottom: 16,
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                padding: "12px 16px",
                borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid var(--primary)",
                boxShadow: "0 8px 24px rgba(17,20,32,.12)",
              }}
            >
              <span style={{ fontSize: 13.5, color: "var(--muted)" }}>
                Du har endringer som ikke er lagret.
              </span>
              <button
                className="btn btn-primary"
                onClick={lagreAlt}
                disabled={busy}
                style={{ padding: "9px 20px" }}
              >
                {busy ? "Lagrer …" : "Lagre endringer"}
              </button>
            </div>
          )}

          {/* Pipeline stages */}
          <Section title="Pipeline-steg">
            <StagesEditor onMessage={flash} />
          </Section>

          {/* Team (editable) */}
          <Section title="Team">
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
              Rediger navn, e-post, telefon og rolle. Endringer lagres per person.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {active.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isSelf={m.id === profile.id}
                  onSaved={(t) => {
                    flash(t);
                    router.refresh();
                  }}
                  onRemove={() => reject(m.id, m.full_name)}
                />
              ))}
            </div>
          </Section>

          {/* Company join code */}
          <Section title="Bedriftskode (påmelding)">
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
              Del denne koden med teamet. Ansatte søker opp bedriften på
              påmeldingssiden, taster koden, og lager sin egen bruker — som du så
              godkjenner her.
            </p>

            <span className="field-label">Kode</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  padding: "8px 14px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                {joinCode}
              </div>
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard?.writeText(joinCode);
                  flash("Kode kopiert.");
                }}
              >
                Kopier kode
              </button>
              <button className="btn" onClick={regenerateCode}>
                Lag ny kode
              </button>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, fontSize: 14, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={async (e) => {
                  const on = e.target.checked;
                  setAutoRotate(on);
                  await supabase
                    .from("organizations")
                    .update({ join_code_rotate: on, join_code_rotated_at: new Date().toISOString() })
                    .eq("id", org.id);
                  flash(on ? "Koden byttes nå automatisk hvert døgn." : "Automatisk bytte er slått av.");
                  router.refresh();
                }}
                style={{ width: 17, height: 17, accentColor: "var(--primary)" }}
              />
              <span>
                Bytt koden automatisk hvert døgn
                <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>
                  Gamle koder slutter å virke etter 24 timer — nyttig hvis koden deles bredt.
                </span>
              </span>
            </label>

            <span className="field-label">Delbar lenke</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="field-input"
                value={joinLink}
                readOnly
                onFocus={(e) => e.target.select()}
                style={{ fontSize: 13 }}
              />
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard?.writeText(joinLink);
                  flash("Lenke kopiert.");
                }}
              >
                Kopier
              </button>
            </div>
          </Section>

          {/* Invite */}
          <Section title="Inviter selger (personlig lenke)">
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
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
              Inviterte selgere er automatisk godkjent (du inviterte dem selv).
            </p>
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

          {/* Danger zone */}
          <div
            className="card"
            style={{
              padding: 20,
              marginBottom: 16,
              borderColor: "var(--tint-danger-border)",
              background: "var(--tint-danger)",
            }}
          >
            <h4 style={{ fontSize: 16, marginBottom: 6, color: "var(--danger)" }}>
              Slett bedriften
            </h4>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
              Sletter <strong>{org.name}</strong> permanent — alle kunder, aktiviteter,
              avdelinger og brukere, og avslutter abonnementet. Dette kan ikke angres.
              Ta gjerne en CSV-eksport av kundene først (under Kunder).
            </p>
            <label className="field-label">
              Skriv bedriftsnavnet for å bekrefte: <strong>{org.name}</strong>
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                className="field-input"
                value={delConfirm}
                placeholder={org.name}
                onChange={(e) => setDelConfirm(e.target.value)}
                style={{ flex: "1 1 240px" }}
              />
              <button
                onClick={deleteCompany}
                disabled={deleting || delConfirm.trim() !== org.name.trim()}
                style={{
                  border: "1px solid var(--tint-danger-border)",
                  background: delConfirm.trim() === org.name.trim() ? "var(--danger)" : "var(--tint-danger)",
                  color: delConfirm.trim() === org.name.trim() ? "#fff" : "var(--muted)",
                  borderRadius: 10,
                  padding: "9px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: delConfirm.trim() === org.name.trim() ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? "Sletter …" : "Slett bedriften permanent"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isSelf,
  onSaved,
  onRemove,
}: {
  member: Member;
  isSelf: boolean;
  onSaved: (msg: string) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(member.full_name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone);
  const [role, setRole] = useState<"admin" | "seller">(
    member.role === "admin" ? "admin" : "seller"
  );
  const [busy, setBusy] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const savePassword = async () => {
    setBusy(true);
    const res = await setMemberPassword(member.id, newPw);
    setBusy(false);
    onSaved(
      res.error
        ? res.error
        : `Nytt passord satt for ${name || member.email}. Gi det til vedkommende.`
    );
    if (!res.error) {
      setNewPw("");
      setShowPw(false);
    }
  };

  const dirty =
    name !== member.full_name ||
    email !== member.email ||
    phone !== member.phone ||
    role !== member.role;

  const save = async () => {
    setBusy(true);
    const res = await updateMember(member.id, {
      full_name: name,
      email,
      phone,
      role,
    });
    setBusy(false);
    onSaved(res.error ? res.error : "Medlem lagret.");
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "var(--primary-050)",
            color: "var(--primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {initials(name)}
        </span>
        <div className="pillgroup" style={{ marginLeft: "auto" }}>
          <button data-active={role === "seller"} onClick={() => setRole("seller")}>
            Selger
          </button>
          <button data-active={role === "admin"} onClick={() => setRole("admin")}>
            Admin
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="field-input"
          value={name}
          placeholder="Navn"
          onChange={(e) => setName(e.target.value)}
          style={{ flex: "1 1 160px" }}
        />
        <input
          className="field-input"
          value={email}
          placeholder="E-post"
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: "1 1 180px" }}
        />
        <input
          className="field-input"
          value={phone}
          placeholder="Telefon"
          onChange={(e) => setPhone(e.target.value)}
          style={{ flex: "1 1 120px" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={!dirty || busy}
          style={{ padding: "7px 14px" }}
        >
          Lagre
        </button>
        <button
          className="btn"
          onClick={() => setShowPw((v) => !v)}
          style={{ padding: "7px 14px" }}
        >
          {showPw ? "Avbryt" : "Sett nytt passord"}
        </button>
        {!isSelf && (
          <button className="btn" onClick={onRemove} style={{ padding: "7px 14px" }}>
            Fjern
          </button>
        )}
      </div>
      {showPw && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            alignItems: "center",
            padding: "10px 12px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          <input
            className="field-input"
            type="text"
            value={newPw}
            placeholder="Nytt passord (minst 4 tegn)"
            onChange={(e) => setNewPw(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={savePassword}
            disabled={busy || newPw.length < 4}
            style={{ padding: "7px 14px" }}
          >
            Lagre passord
          </button>
        </div>
      )}
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
