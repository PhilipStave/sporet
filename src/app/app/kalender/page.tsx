"use client";

import { useMemo } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { CHANNELS } from "@/lib/constants";
import { diffDays, fmtDateShort, fmtTime } from "@/lib/format";
import type { Deal } from "@/types";

const GROUPS = [
  { key: "forfalt", label: "Forfalt", test: (dd: number) => dd < 0, danger: true },
  { key: "idag", label: "I dag", test: (dd: number) => dd === 0 },
  { key: "imorgen", label: "I morgen", test: (dd: number) => dd === 1 },
  { key: "uke", label: "Denne uken", test: (dd: number) => dd >= 2 && dd <= 7 },
  { key: "senere", label: "Senere", test: (dd: number) => dd > 7 },
];

export default function KalenderPage() {
  const { scopedDeals, setSelectedDealId, deptName, stageMaps } = useStore();

  const withSteps = useMemo(
    () =>
      scopedDeals
        .filter((d) => d.next_step_date && stageMaps.open.includes(d.stage))
        .sort((a, b) =>
          (a.next_step_date || "").localeCompare(b.next_step_date || "")
        ),
    [scopedDeals, stageMaps.open]
  );

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: withSteps.filter((d) => g.test(diffDays(d.next_step_date!))),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="animate-fade">
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>Kalender</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 22px" }}>
        Planlagte neste steg med dato.
      </p>

      {grouped.length === 0 ? (
        <div
          className="card"
          style={{ padding: 36, textAlign: "center", marginTop: 8 }}
        >
          <div style={{ display: "flex", justifyContent: "center", color: "var(--muted)", marginBottom: 8 }}>
            <Icon name="clock" size={22} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
            Ingen planlagte avtaler ennå. Sett dato og klokkeslett på «Neste
            steg» for en kunde, så dukker det opp her.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {grouped.map((g) => (
            <div key={g.key} className="card" style={{ padding: 18 }}>
              <h4
                style={{
                  fontSize: 15,
                  marginBottom: 12,
                  color: g.danger ? "var(--danger)" : "var(--text)",
                }}
              >
                {g.label} · {g.items.length}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.items.map((d) => (
                  <CalItem
                    key={d.id}
                    deal={d}
                    dept={deptName(d.department_id)}
                    onOpen={() => setSelectedDealId(d.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalItem({
  deal,
  dept,
  onOpen,
}: {
  deal: Deal;
  dept: string;
  onOpen: () => void;
}) {
  const channel = CHANNELS[deal.channel];
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "flex",
        gap: 10,
        textAlign: "left",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: "var(--primary-050)",
          color: "var(--primary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={channel.icon} size={15} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>
          {deal.company}
        </span>
        <span style={{ display: "block", fontSize: 13, color: "var(--text)" }}>
          {deal.next_step_text}
        </span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {fmtDateShort(deal.next_step_date)}
          {deal.next_step_time ? ` · kl ${fmtTime(deal.next_step_time)}` : ""}
          {deal.next_step_who ? ` · ${deal.next_step_who}` : ` · ${dept}`}
        </span>
      </span>
    </button>
  );
}
