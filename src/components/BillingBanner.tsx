"use client";

import Link from "next/link";
import { useStore } from "@/store/Store";
import { computeAccess } from "@/lib/billing";
import { Icon } from "@/components/Icon";

/** Shown at the top of the app when the org is in trial, past due or expired. */
export function BillingBanner() {
  const { org, profile } = useStore();
  const a = computeAccess(org);

  // Quiet during a healthy paid subscription; also quiet early in the trial.
  if (a.state === "active") return null;
  if (a.state === "trial" && (a.daysLeft ?? 99) > 7) return null;

  const danger = !a.canWrite;
  const bg = danger ? "#fdf3f2" : "#fff8e6";
  const border = danger ? "#f0d0cc" : "#f0e0b0";
  const color = danger ? "var(--danger)" : "#8a6100";

  return (
    <div
      style={{
        background: bg,
        borderBottom: `1px solid ${border}`,
        color,
        fontSize: 14,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "9px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Icon name={danger ? "x" : "clock"} size={16} />
        <span style={{ flex: 1, minWidth: 200 }}>
          <strong style={{ fontWeight: 600 }}>{a.message}</strong>
          {danger && " Dere kan fortsatt se alt, men ikke legge til eller endre."}
        </span>
        {profile.role === "admin" ? (
          <Link
            href="/app/innstillinger#abonnement"
            className="btn btn-primary"
            style={{ padding: "6px 12px", fontSize: 13 }}
          >
            {a.state === "trial" ? "Velg pakke" : "Ordne betaling"}
          </Link>
        ) : (
          <span style={{ fontSize: 13, opacity: 0.85 }}>
            Be administratoren ordne abonnementet.
          </span>
        )}
      </div>
    </div>
  );
}
