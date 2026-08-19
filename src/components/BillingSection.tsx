"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/store/Store";
import { computeAccess, PLANS } from "@/lib/billing";
import { startCheckout, openPortal } from "@/app/app/billing-actions";
import { fmtDateShort } from "@/lib/format";
import { Icon } from "@/components/Icon";

export function BillingSection() {
  const { org } = useStore();
  const params = useSearchParams();
  const a = computeAccess(org);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const justPaid = params.get("betaling") === "ok";
  const canceledCheckout = params.get("betaling") === "avbrutt";

  const choose = async (planId: string) => {
    setBusy(planId);
    setError("");
    const res = await startCheckout(planId);
    if (res?.error) {
      setError(res.error);
      setBusy(null);
    }
  };

  const portal = async () => {
    setBusy("portal");
    setError("");
    const res = await openPortal();
    if (res?.error) {
      setError(res.error);
      setBusy(null);
    }
  };

  const currentPlan = PLANS.find((p) => p.id === org.plan);
  const stateColor =
    a.state === "active" ? "#059669" : a.canWrite ? "var(--tint-warn-text)" : "var(--danger)";
  const stateBg =
    a.state === "active" ? "var(--tint-success)" : a.canWrite ? "var(--tint-warn)" : "var(--tint-danger)";

  return (
    <div id="abonnement" className="card" style={{ padding: 20, marginBottom: 16, scrollMarginTop: 90 }}>
      <h4 style={{ fontSize: 16, marginBottom: 12 }}>Abonnement</h4>

      {justPaid && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--tint-success)", color: "var(--tint-success-text)", borderRadius: 10, fontSize: 14 }}>
          Takk! Betalingen er registrert. Det kan ta et øyeblikk før statusen under oppdateres.
        </div>
      )}
      {canceledCheckout && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--bg)", borderRadius: 10, fontSize: 14, color: "var(--muted)" }}>
          Betalingen ble avbrutt. Ingenting er belastet.
        </div>
      )}

      {/* Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: stateBg,
          borderRadius: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: stateColor }}>
          <Icon name={a.canWrite ? "check" : "x"} size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: stateColor }}>
            {a.state === "trial" && "Gratis prøveperiode"}
            {a.state === "active" && (currentPlan ? `${currentPlan.label} · ${currentPlan.price} kr/mnd` : "Aktivt abonnement")}
            {a.state === "past_due" && "Betaling feilet"}
            {a.state === "expired" && "Prøveperioden er over"}
            {a.state === "canceled" && "Abonnementet er avsluttet"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {a.message}
            {a.state === "active" && org.current_period_end && (
              <> Neste fornyelse {fmtDateShort(org.current_period_end)}.</>
            )}
          </div>
        </div>
        {org.stripe_customer_id && (
          <button className="btn" onClick={portal} disabled={busy !== null}>
            {busy === "portal" ? "Åpner …" : "Administrer abonnement"}
          </button>
        )}
      </div>

      {/* Plans */}
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
        {a.state === "active" || a.cardOnFile
          ? "Bytt pakke via «Administrer abonnement», eller velg en annen pakke under."
          : a.state === "trial"
          ? `Velg pakke og legg inn kort nå — du betaler ingenting før prøveperioden er over (${a.daysLeft} dager). Da starter abonnementet automatisk. Avbestill når som helst før det, helt gratis. Priser eks. mva.`
          : "Velg pakken som passer antall brukere. Alle pakker inneholder hele systemet. Priser eks. mva."}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {PLANS.map((p) => {
          const isCurrent = a.state === "active" && org.plan === p.id;
          return (
            <div
              key={p.id}
              style={{
                border: `1px solid ${isCurrent ? "var(--primary)" : "var(--border)"}`,
                background: isCurrent ? "var(--primary-050)" : "var(--surface)",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                {p.label}
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>
                {p.price.toLocaleString("nb-NO")} kr
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)" }}> /mnd</span>
              </div>
              <button
                className={isCurrent ? "btn" : "btn btn-primary"}
                disabled={isCurrent || busy !== null}
                onClick={() => choose(p.id)}
                style={{ marginTop: 4, padding: "7px 10px", fontSize: 13 }}
              >
                {isCurrent ? "Din pakke" : busy === p.id ? "Åpner …" : "Velg"}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--danger)" }}>{error}</p>
      )}
      <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--muted)" }}>
        Betaling håndteres trygt av Stripe. Vi lagrer aldri kortnummeret ditt.
      </p>
    </div>
  );
}
