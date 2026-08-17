"use client";

import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import {
  CHANNELS,
  STAGE_COLORS,
  STAGE_LABELS,
  pillStyle,
} from "@/lib/constants";
import {
  fmtKr,
  fmtDateShort,
  relativeLabel,
  diffDays,
} from "@/lib/format";
import type { Deal } from "@/types";

const GRID = "1.5fr 1.3fr 1fr .9fr .9fr 1.3fr .8fr";

export function Table({ deals }: { deals: Deal[] }) {
  const { setSelectedDealId } = useStore();

  return (
    <div
      className="card scrollbar-thin"
      style={{ overflowX: "auto", padding: 0 }}
    >
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
          <span>Steg</span>
          <span>Kanal</span>
          <span>Verdi</span>
          <span>Neste steg</span>
          <span>Oppdatert</span>
        </div>

        {deals.map((d) => {
          const overdue = !!d.next_step_date && diffDays(d.next_step_date) < 0;
          return (
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
              <span style={{ fontWeight: 600, minWidth: 0 }}>
                {d.company || "Ny kunde"}
                {d.product && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 400,
                      color: "var(--muted)",
                    }}
                  >
                    {d.product}
                  </span>
                )}
              </span>
              <span style={{ minWidth: 0, color: "var(--muted)" }}>
                {d.contact || "—"}
              </span>
              <span>
                <span style={pillStyle(STAGE_COLORS[d.stage])}>
                  {STAGE_LABELS[d.stage]}
                </span>
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--muted)",
                  fontSize: 13,
                }}
              >
                <Icon name={CHANNELS[d.channel].icon} size={14} />
                <span className="hide-sm">{CHANNELS[d.channel].label}</span>
              </span>
              <span style={{ fontWeight: 500 }}>
                {d.value ? fmtKr(d.value) : "—"}
              </span>
              <span style={{ minWidth: 0, fontSize: 13 }}>
                {d.next_step_text ? (
                  <span style={{ color: overdue ? "var(--danger)" : "var(--text)" }}>
                    {d.next_step_text}
                    {d.next_step_date ? ` · ${fmtDateShort(d.next_step_date)}` : ""}
                  </span>
                ) : (
                  <span style={{ color: "var(--muted)" }}>—</span>
                )}
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                {relativeLabel(d.updated_at)}
              </span>
            </div>
          );
        })}
        {deals.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
            Ingen kunder i utvalget.
          </div>
        )}
      </div>
    </div>
  );
}
