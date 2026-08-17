"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { DetailModal, type DetailData } from "@/components/DetailModal";
import { STAGE_COLORS, STAGE_LABELS, pillStyle } from "@/lib/constants";
import { fmtKr, initials, type Period } from "@/lib/format";
import { sellersFromWon, withinDays } from "@/lib/metrics";

export default function SelgerePage() {
  const { scopedDeals, members, setSelectedDealId, deptName } = useStore();
  const [period, setPeriod] = useState<Period>("alle");
  const [openSeller, setOpenSeller] = useState<string | null>(null);

  const periodDeals = useMemo(
    () => scopedDeals.filter((d) => withinDays(d, period)),
    [scopedDeals, period]
  );

  const sellers = useMemo(
    () => sellersFromWon(periodDeals, members.map((m) => m.full_name)),
    [periodDeals, members]
  );

  const detailData: DetailData | null = useMemo(() => {
    if (!openSeller) return null;
    const list = periodDeals
      .filter((d) => d.stage === "vunnet" && (d.owner_name || "Ukjent") === openSeller)
      .sort((a, b) => b.value - a.value);
    const tv = list.reduce((a, d) => a + d.value, 0);
    const tm = list.reduce((a, d) => a + d.value * ((d.margin_pct || 0) / 100), 0);
    const avg = tv > 0 ? Math.round((tm / tv) * 100) : 0;
    return {
      title: openSeller,
      subtitle: `${list.length} salg · ${fmtKr(tv)} · margin ${avg} % (${fmtKr(tm)})`,
      rows: list.map((d) => ({
        id: d.id,
        company: d.company || "Ny kunde",
        sub: [deptName(d.department_id), d.product].filter(Boolean).join(" · "),
        tagLabel: STAGE_LABELS[d.stage],
        tagStyle: pillStyle(STAGE_COLORS[d.stage]),
        value: fmtKr(d.value),
        onOpen: () => {
          setSelectedDealId(d.id);
          setOpenSeller(null);
        },
      })),
    };
  }, [openSeller, periodDeals, deptName, setSelectedDealId]);

  return (
    <div className="animate-fade">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>Selgere</h2>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            Hva hver selger har solgt, sum og margin
          </span>
        </div>
        <div className="pillgroup">
          {(
            [
              ["uke", "Uke"],
              ["mnd", "Måned"],
              ["ar", "År"],
              ["alle", "Alt"],
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
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {sellers.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => s.count > 0 && setOpenSeller(s.name)}
            className="stat-card"
            style={{
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow)",
              padding: 18,
              cursor: s.count > 0 ? "pointer" : "default",
              opacity: s.count > 0 ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "var(--primary-050)",
                  color: "var(--primary)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                }}
              >
                {initials(s.name)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {s.count} salg · {fmtKr(s.total)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              Margin {s.marginPct} % · {fmtKr(s.margin)}
            </div>
          </button>
        ))}
        {sellers.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Ingen selgere ennå.
          </p>
        )}
      </div>

      {detailData && (
        <DetailModal data={detailData} onClose={() => setOpenSeller(null)} />
      )}
    </div>
  );
}
