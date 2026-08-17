"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { Dropdown } from "@/components/Dropdown";
import { Autocomplete } from "@/components/Autocomplete";
import { Board } from "@/components/pipeline/Board";
import { Table } from "@/components/pipeline/Table";
import { ACTIVE_STAGES } from "@/lib/constants";
import { fmtKr, withinPeriod, type Period } from "@/lib/format";

type FilterKind = "alle" | "apne" | "vunnet" | "tapt";

export default function PipelinePage() {
  const { scopedDeals, sellerNames, createDeal, setSelectedDealId } = useStore();

  const [mode, setMode] = useState<"tavle" | "tabell">("tavle");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKind>("alle");
  const [period, setPeriod] = useState<Period | "alt">("alt");
  const [seller, setSeller] = useState("");

  // Department scope is handled globally in the top-right selector.
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return scopedDeals.filter((d) => {
      if (filter === "apne" && !ACTIVE_STAGES.includes(d.stage)) return false;
      if (filter === "vunnet" && d.stage !== "vunnet") return false;
      if (filter === "tapt" && d.stage !== "tapt") return false;
      if (period !== "alt" && !withinPeriod(d.updated_at, period as Period))
        return false;
      if (seller.trim() && d.owner_name !== seller.trim()) return false;
      if (
        q &&
        !d.company.toLowerCase().includes(q) &&
        !d.contact.toLowerCase().includes(q) &&
        !(d.product || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [scopedDeals, query, filter, period, seller]);

  const openDeals = filtered.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const openValue = openDeals.reduce((a, d) => a + (d.value || 0), 0);

  const newCustomer = async () => {
    const id = await createDeal();
    if (id) setSelectedDealId(id);
  };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>Pipeline</h2>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {openDeals.length} åpne · {fmtKr(openValue)} i pipeline
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="pillgroup">
            <button
              data-active={mode === "tavle"}
              onClick={() => setMode("tavle")}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="grid" size={14} /> Tavle
              </span>
            </button>
            <button
              data-active={mode === "tabell"}
              onClick={() => setMode("tabell")}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="list" size={14} /> Tabell
              </span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={newCustomer}>
            <Icon name="plus" size={16} /> Ny kunde
          </button>
        </div>
      </div>

      {/* Filter row */}
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
            placeholder="Søk kunde …"
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 10 }}
          />
        </div>

        <Dropdown
          value={filter}
          onChange={(v) => setFilter(v as FilterKind)}
          minWidth={140}
          options={[
            { value: "alle", label: "Alle deals" },
            { value: "apne", label: "Kun åpne" },
            { value: "vunnet", label: "Vunnet" },
            { value: "tapt", label: "Tapt" },
          ]}
        />

        <div className="pillgroup">
          {(
            [
              ["alt", "Alt"],
              ["uke", "Uke"],
              ["mnd", "Måned"],
              ["ar", "År"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              data-active={period === id}
              onClick={() => setPeriod(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 1 220px" }}>
          <Autocomplete
            style={{ flex: 1, minWidth: 140 }}
            value={seller}
            options={sellerNames}
            placeholder="Alle selgere"
            onChange={setSeller}
            onSelect={setSeller}
          />
          {seller && (
            <button
              className="btn"
              onClick={() => setSeller("")}
              style={{ padding: "8px 10px" }}
              aria-label="Nullstill selger"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <span
          style={{
            fontSize: 13,
            color: "var(--muted)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} treff
        </span>
      </div>

      {mode === "tavle" ? <Board deals={filtered} /> : <Table deals={filtered} />}
    </div>
  );
}
