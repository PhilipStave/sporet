"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { Autocomplete } from "@/components/Autocomplete";
import { relativeLabel, withinPeriod, type Period } from "@/lib/format";
import type { ActivityRow, Deal } from "@/types";

interface FeedRow {
  activity: ActivityRow;
  deal: Deal;
}

export default function AktivitetPage() {
  const { scopedDeals, sellerNames, setSelectedDealId, deptName } = useStore();

  const [query, setQuery] = useState("");
  const [seller, setSeller] = useState("");
  const [period, setPeriod] = useState<Period>("alle");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc"); // desc = nyeste først

  const rows: FeedRow[] = useMemo(() => {
    const out: FeedRow[] = [];
    scopedDeals.forEach((d) => {
      (d.activities || []).forEach((a) => out.push({ activity: a, deal: d }));
    });
    return out.sort((a, b) =>
      sortDir === "desc"
        ? b.activity.created_at.localeCompare(a.activity.created_at)
        : a.activity.created_at.localeCompare(b.activity.created_at)
    );
  }, [scopedDeals, sortDir]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    // Department scope is handled globally in the top-right selector.
    return rows.filter(({ activity, deal }) => {
      if (seller.trim() && deal.owner_name !== seller.trim()) return false;
      if (!withinPeriod(activity.created_at, period)) return false;
      if (
        q &&
        !deal.company.toLowerCase().includes(q) &&
        !(activity.note || "").toLowerCase().includes(q) &&
        !(activity.label || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, query, seller, period]);

  return (
    <div className="animate-fade">
      <h2 style={{ fontSize: 26, marginBottom: 18 }}>Aktivitet</h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", minWidth: 190, flex: "0 1 240px" }}>
          <span
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={15} />
          </span>
          <input
            className="field-input"
            value={query}
            placeholder="Søk i aktivitet …"
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 10 }}
          />
        </div>
        <div style={{ flex: "0 1 200px" }}>
          <Autocomplete
            value={seller}
            options={sellerNames}
            placeholder="Alle selgere"
            onChange={setSeller}
            onSelect={setSeller}
          />
        </div>
        <div className="pillgroup">
          {(
            [
              ["alle", "Alt"],
              ["uke", "Uke"],
              ["mnd", "Måned"],
              ["ar", "År"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              data-active={period === id}
              onClick={() => setPeriod(id as Period)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="btn"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          title="Bytt sortering"
        >
          <Icon name={sortDir === "desc" ? "chevron" : "chevronr"} size={14}
            style={{ transform: sortDir === "asc" ? "rotate(-90deg)" : undefined }} />
          {sortDir === "desc" ? "Nyeste først" : "Eldste først"}
        </button>
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>
          {filtered.length} hendelser
        </span>
      </div>

      <div className="card" style={{ padding: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Ingen aktivitet i utvalget.
          </p>
        ) : (
          filtered.map(({ activity, deal }) => (
            <button
              key={activity.id}
              type="button"
              onClick={() => setSelectedDealId(deal.id)}
              style={{
                display: "flex",
                gap: 12,
                width: "100%",
                textAlign: "left",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: "transparent",
                padding: "12px 12px",
                cursor: "pointer",
                alignItems: "center",
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
                <Icon name={activity.icon} size={15} />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {deal.company}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
                    {relativeLabel(activity.created_at)}
                  </span>
                </span>
                <span style={{ display: "block", fontSize: 13 }}>
                  <strong style={{ fontWeight: 600 }}>{activity.label}</strong>
                  {activity.note ? ` · ${activity.note}` : ""}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {(deal.owner_name || activity.actor_name || "—")} ·{" "}
                  {deptName(deal.department_id)}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
