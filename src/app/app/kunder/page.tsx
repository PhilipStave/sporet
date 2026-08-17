"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { Autocomplete } from "@/components/Autocomplete";
import { STAGE_COLORS, STAGE_LABELS, pillStyle } from "@/lib/constants";
import { fmtKr, type Period } from "@/lib/format";
import { withinDays } from "@/lib/metrics";
import { exportCustomersCsv } from "@/lib/csv";

const GRID = "1.5fr 1.4fr 1.2fr 1fr .9fr .8fr";

export default function KunderPage() {
  const { scopedDeals, departments, sellerNames, setSelectedDealId, deptName } =
    useStore();

  const [query, setQuery] = useState("");
  // Empty = all departments. Otherwise the set of selected department ids.
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [seller, setSeller] = useState("");
  const [period, setPeriod] = useState<Period>("alle");

  const toggleDept = (id: string) =>
    setDeptFilter((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return scopedDeals
      .filter((d) => {
        if (deptFilter.length && !deptFilter.includes(d.department_id ?? ""))
          return false;
        if (!withinDays(d, period)) return false;
        if (seller.trim() && d.owner_name !== seller.trim()) return false;
        if (
          q &&
          !d.company.toLowerCase().includes(q) &&
          !d.contact.toLowerCase().includes(q) &&
          !(d.email || "").toLowerCase().includes(q) &&
          !(d.product || "").toLowerCase().includes(q)
        )
          return false;
        return true;
      })
      .sort((a, b) => a.company.localeCompare(b.company, "nb"));
  }, [scopedDeals, query, deptFilter, seller, period]);

  return (
    <div className="animate-fade">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: 26 }}>Kunder</h2>
        <button
          className="btn"
          onClick={() => exportCustomersCsv(filtered, deptName)}
        >
          <Icon name="download" size={16} /> Eksporter CSV
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", minWidth: 200, flex: "0 1 260px" }}>
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
            placeholder="Søk kunde …"
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
        <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>
          {filtered.length} kunder
        </span>
      </div>

      {/* Department chips — multi-select (choose one or more) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        <button
          className="chip"
          data-active={deptFilter.length === 0}
          onClick={() => setDeptFilter([])}
        >
          Alle avdelinger
        </button>
        {departments.map((d) => (
          <button
            key={d.id}
            className="chip"
            data-active={deptFilter.includes(d.id)}
            onClick={() => toggleDept(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card scrollbar-thin" style={{ overflowX: "auto", padding: 0 }}>
        <div style={{ minWidth: 820 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".03em",
              color: "var(--muted)",
            }}
          >
            <span>Selskap</span>
            <span>Kontakt</span>
            <span>Kjøpt / produkt</span>
            <span>Selger</span>
            <span>Steg</span>
            <span>Verdi</span>
          </div>
          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDealId(d.id)}
              className="table-row"
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                padding: "13px 18px",
                borderBottom: "1px solid var(--border)",
                fontSize: 14,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600, display: "block" }}>
                  {d.company || "Ny kunde"}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {deptName(d.department_id)}
                </span>
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block" }}>{d.contact || "—"}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {[d.email, d.phone].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span style={{ minWidth: 0, color: "var(--muted)" }}>
                {d.product || "—"}
              </span>
              <span style={{ minWidth: 0 }}>{d.owner_name || "—"}</span>
              <span>
                <span style={pillStyle(STAGE_COLORS[d.stage])}>
                  {STAGE_LABELS[d.stage]}
                </span>
              </span>
              <span style={{ fontWeight: 500 }}>
                {d.value ? fmtKr(d.value) : "—"}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              Ingen kunder ennå. Legg til din første kunde i Pipeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
