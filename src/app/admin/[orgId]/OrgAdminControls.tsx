"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSetSubscription, adminSetTrialEnd, adminDeleteOrg, adminSetUserPassword } from "../actions";
import { PLANS } from "@/lib/billing";
import type { Plan, SubscriptionStatus } from "@/types/database";

function Subscription(props: {
  orgId: string;
  plan: Plan;
  status: SubscriptionStatus;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(props.plan);
  const [status, setStatus] = useState<SubscriptionStatus>(props.status);
  const [periodEnd, setPeriodEnd] = useState(props.currentPeriodEnd ? props.currentPeriodEnd.slice(0, 10) : "");
  const [trialEnd, setTrialEnd] = useState(props.trialEndsAt.slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setBusy(true);
    setMsg("");
    const res = await adminSetSubscription(props.orgId, plan, status, periodEnd ? `${periodEnd}T23:59:59Z` : null);
    setBusy(false);
    setMsg(res.error ?? "Lagret.");
    if (!res.error) router.refresh();
  };
  const extend = async () => {
    setBusy(true);
    setMsg("");
    const res = await adminSetTrialEnd(props.orgId, `${trialEnd}T23:59:59Z`);
    setBusy(false);
    setMsg(res.error ?? "Prøveperiode oppdatert.");
    if (!res.error) router.refresh();
  };
  const plus = (days: number) => {
    const d = new Date(trialEnd || Date.now());
    d.setDate(d.getDate() + days);
    setTrialEnd(d.toISOString().slice(0, 10));
  };

  return (
    <section className="card" style={{ padding: 16, fontSize: 13, display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Abonnement</div>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Overstyr manuelt — f.eks. gi gratis tilgang, eller registrere at de betaler på faktura. Stripe-webhooken
        vil overskrive dette hvis bedriften har et aktivt Stripe-abonnement.
      </p>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "var(--muted)" }}>Plan</span>
        <select className="field-input" value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
          <option value="trial">Ingen (prøve)</option>
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {p.price} kr/mnd
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "var(--muted)" }}>Status</span>
        <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
          <option value="trialing">Prøveperiode</option>
          <option value="active">Aktiv (betaler)</option>
          <option value="past_due">Forfalt betaling</option>
          <option value="canceled">Avsluttet</option>
        </select>
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "var(--muted)" }}>Betalt til (tom = ubegrenset ved aktiv)</span>
        <input className="field-input" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
      </label>
      <button className="btn btn-primary" disabled={busy} onClick={save}>
        Lagre abonnement
      </button>

      <div style={{ height: 1, background: "var(--border)" }} />

      <div style={{ fontWeight: 600 }}>Prøveperiode</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input className="field-input" type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} style={{ flex: 1 }} />
        <button className="btn" onClick={() => plus(7)} type="button">+7 d</button>
        <button className="btn" onClick={() => plus(30)} type="button">+30 d</button>
      </div>
      <button className="btn" disabled={busy} onClick={extend}>
        Sett prøveperiode (status → prøve)
      </button>

      {(props.stripeCustomerId || props.stripeSubscriptionId) && (
        <a
          className="btn"
          href={`https://dashboard.stripe.com/${props.stripeCustomerId ? `customers/${props.stripeCustomerId}` : `subscriptions/${props.stripeSubscriptionId}`}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Åpne i Stripe
        </a>
      )}
      {msg && <div style={{ color: msg.includes("Lagret") || msg.includes("oppdatert") ? "var(--success, #137333)" : "var(--danger)" }}>{msg}</div>}
    </section>
  );
}

function Danger({ orgId, name }: { orgId: string; name: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const del = async () => {
    if (!window.confirm(`Slette «${name}» med alle brukere, kunder, dokumenter og historikk? Kan ikke angres.`)) return;
    setBusy(true);
    const res = await adminDeleteOrg(orgId, confirm);
    setBusy(false);
    if (res.error) setMsg(res.error);
    else router.push("/admin");
  };
  return (
    <section className="card" style={{ padding: 16, fontSize: 13, display: "grid", gap: 10, borderColor: "var(--tint-danger-border)" }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--danger)" }}>Slett bedrift</div>
      <p style={{ margin: 0, color: "var(--muted)" }}>Skriv bedriftsnavnet nøyaktig for å bekrefte.</p>
      <input className="field-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={name} />
      <button
        className="btn"
        disabled={busy || confirm !== name}
        onClick={del}
        style={{ background: "var(--tint-danger)", color: "var(--danger)", borderColor: "var(--tint-danger-border)" }}
      >
        Slett for godt
      </button>
      {msg && <div style={{ color: "var(--danger)" }}>{msg}</div>}
    </section>
  );
}

function ResetPassword({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <button className="linklike" onClick={() => setOpen(true)} title={`Sett nytt passord for ${name}`}>
        Passord
      </button>
    );
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <input
        className="field-input"
        type="text"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Nytt passord"
        style={{ width: 140, padding: "4px 8px", fontSize: 12 }}
      />
      <button
        className="btn"
        disabled={busy || pw.length < 6}
        style={{ padding: "4px 10px", fontSize: 12 }}
        onClick={async () => {
          setBusy(true);
          const r = await adminSetUserPassword(userId, pw);
          setBusy(false);
          setMsg(r.error ?? "Satt");
          if (!r.error) {
            setPw("");
            setTimeout(() => { setOpen(false); setMsg(""); }, 1500);
          }
        }}
      >
        Sett
      </button>
      {msg && <span style={{ fontSize: 12, color: msg === "Satt" ? "var(--success, #137333)" : "var(--danger)" }}>{msg}</span>}
    </span>
  );
}

export const OrgAdminControls = { Subscription, Danger, ResetPassword };
