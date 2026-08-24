"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { stageLabel, stageColor } from "@/lib/stages";
import { DetailModal, type DetailData } from "@/components/DetailModal";
import { WON_KEY, pillStyle } from "@/lib/constants";
import { fmtKr, type Period } from "@/lib/format";
import { departmentsAgg, withinDays } from "@/lib/metrics";

type SortKey = "total" | "margin" | "marginPct" | "openValue" | "winRate";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "total", label: "Solgt for" },
  { id: "margin", label: "Margin kr" },
  { id: "marginPct", label: "Margin %" },
  { id: "openValue", label: "I pipeline" },
  { id: "winRate", label: "Vinnrate" },
];

export default function AvdelingerPage() {
  const { deals, departments, setSelectedDealId, stageMaps } = useStore();
  const [period, setPeriod] = useState<Period>("alle");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [asc, setAsc] = useState(false);
  const [openDept, setOpenDept] = useState<{ id: string; name: string } | null>(null);

  // Department view is always company-wide (that is the point of comparing them).
  const periodDeals = useMemo(() => deals.filter((d) => withinDays(d, period)), [deals, period]);

  const rows = useMemo(
    () => departmentsAgg(periodDeals, deals, departments, stageMaps.open),
    [periodDeals, deals, departments, stageMaps.open]
  );

  const ranked = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);
    const withRank = sorted.map((r, i) => ({ ...r, rank: i + 1 }));
    return asc ? withRank.reverse() : withRank;
  }, [rows, sortKey, asc]);

  const totals = useMemo(
    () => ({
      total: rows.reduce((n, r) => n + r.total, 0),
      margin: rows.reduce((n, r) => n + r.margin, 0),
      openValue: rows.reduce((n, r) => n + r.openValue, 0),
      count: rows.reduce((n, r) => n + r.count, 0),
    }),
    [rows]
  );
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  const detailData: DetailData | null = useMemo(() => {
    if (!openDept) return null;
    const list = periodDeals
      .filter(
        (d) =>
          d.stage === WON_KEY &&
          (d.department_id ?? "__none") === openDept.id
      )
      .sort((a, b) => b.value - a.value);
    const tv = list.reduce((a, d) => a + d.value, 0);
    const tm = list.reduce((a, d) => a + d.value * ((d.margin_pct || 0) / 100), 0);
    return {
      title: openDept.name,
      subtitle: `${list.length} salg · ${fmtKr(tv)} · margin ${tv > 0 ? Math.round((tm / tv) * 100) : 0} % (${fmtKr(tm)})`,
      rows: list.map((d) => ({
        id: d.id,
        company: d.company || "Ny kunde",
        sub: [d.owner_name, d.product].filter(Boolean).join(" · "),
        tagLabel: stageLabel(stageMaps, d.stage),
        tagStyle: pillStyle(stageColor(stageMaps, d.stage)),
        value: fmtKr(d.value),
        onOpen: () => {
          setSelectedDealId(d.id);
          setOpenDept(null);
        },
      })),
    };
  }, [openDept, periodDeals, setSelectedDealId, stageMaps]);

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
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>Avdelinger</h2>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            Hva hver avdeling har solgt, margin, pipeline og vinnrate
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="pillgroup">
            {SORTS.map((s) => (
              <button
                key={s.id}
                data-active={sortKey === s.id}
                onClick={() => setSortKey(s.id)}
                title={"Sorter etter " + s.label.toLowerCase()}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => setAsc((v) => !v)}
            title="Snu rekkefølgen"
            style={{ padding: "7px 13px", fontSize: 13 }}
          >
            {asc ? "Siste → første" : "Første → siste"}
          </button>
          <div className="pillgroup">
            {(
              [
                ["uke", "Uke"],
                ["mnd", "Måned"],
                ["ar", "År"],
                ["alle", "Alt"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} data-active={period === id} onClick={() => setPeriod(id as Period)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Company totals */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        {[
          { k: "Solgt for", v: fmtKr(totals.total), s: `${totals.count} salg i perioden` },
          {
            k: "Margin",
            v: `${totals.total > 0 ? Math.round((totals.margin / totals.total) * 100) : 0} %`,
            s: `${fmtKr(totals.margin)} i margin`,
          },
          { k: "I pipeline", v: fmtKr(totals.openValue), s: "åpne avtaler nå" },
          { k: "Avdelinger", v: String(rows.filter((r) => r.count > 0 || r.openCount > 0).length), s: `av ${rows.length} med aktivitet` },
        ].map((c) => (
          <div
            key={c.k}
            className="card"
            style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 3 }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".05em",
                color: "var(--muted)",
              }}
            >
              {c.k}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{c.v}</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{c.s}</span>
          </div>
        ))}
      </div>

      {/* Department cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {ranked.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setOpenDept({ id: r.id, name: r.name })}
            className="stat-card"
            style={{
              position: "relative",
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow)",
              padding: 18,
              cursor: "pointer",
              opacity: r.count > 0 || r.openCount > 0 ? 1 : 0.7,
            }}
          >
            <span
              title={`${r.rank}. plass`}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                minWidth: 26,
                height: 26,
                padding: "0 7px",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                background: r.rank === 1 && r.count > 0 ? "var(--primary)" : "var(--primary-050)",
                color: r.rank === 1 && r.count > 0 ? "#fff" : "var(--primary)",
              }}
            >
              {r.rank}.
            </span>

            <div style={{ fontWeight: 600, fontSize: 16, paddingRight: 34 }}>{r.name}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              {r.count} salg · {fmtKr(r.total)}
            </div>

            {/* Share-of-total bar */}
            <div
              style={{
                marginTop: 12,
                height: 8,
                borderRadius: 999,
                background: "var(--tint-neutral)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(r.total / maxTotal) * 100}%`,
                  background: "var(--primary)",
                  borderRadius: 999,
                  transition: "width .3s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 12px",
                fontSize: 13,
              }}
            >
              <Metric label="Margin" value={`${r.marginPct} % · ${fmtKr(r.margin)}`} />
              <Metric label="Vinnrate" value={`${r.winRate} %`} sub={`${r.count} vunnet / ${r.lostCount} tapt`} />
              <Metric label="I pipeline" value={fmtKr(r.openValue)} sub={`${r.openCount} åpne`} />
              <Metric label="Snittsalg" value={fmtKr(r.avgValue)} />
            </div>

            {r.topSeller && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                Beste selger: <strong style={{ color: "var(--text)" }}>{r.topSeller}</strong> ·{" "}
                {fmtKr(r.topSellerTotal)}
                {r.sellerCount > 1 ? ` · ${r.sellerCount} selgere` : ""}
              </div>
            )}
          </button>
        ))}
        {ranked.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Ingen avdelinger ennå. Legg dem til under Innstillinger.
          </p>
        )}
      </div>

      {detailData && <DetailModal data={detailData} onClose={() => setOpenDept(null)} />}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
        {label}
      </div>
      <div style={{ fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}
