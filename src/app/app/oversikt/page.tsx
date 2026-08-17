"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { DetailModal, type DetailData, type DetailRow } from "@/components/DetailModal";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  ACTIVE_STAGES,
  pillStyle,
} from "@/lib/constants";
import { fmtKr, fmtShort, diffDays, fmtDateShort } from "@/lib/format";
import { computeOverview, withinDays } from "@/lib/metrics";
import type { Deal } from "@/types";

type SoldPeriod = "uke" | "mnd" | "ar";

export default function OversiktPage() {
  const { scopedDeals, deptName, setSelectedDealId } = useStore();
  const router = useRouter();
  const [soldPeriod, setSoldPeriod] = useState<SoldPeriod>("uke");
  const [detail, setDetail] = useState<string | null>(null);

  const o = useMemo(() => computeOverview(scopedDeals), [scopedDeals]);

  const spSub = { uke: "denne uken", mnd: "denne måneden", ar: "i år" }[
    soldPeriod
  ];
  const soldDeals = useMemo(
    () => o.won.filter((d) => withinDays(d, soldPeriod)),
    [o.won, soldPeriod]
  );
  const soldValue = soldDeals.reduce((a, d) => a + (d.value || 0), 0);

  const drow = (d: Deal): DetailRow => {
    const parts = [
      deptName(d.department_id),
      d.owner_name || "Ingen selger",
    ].concat(d.product ? [d.product] : []);
    return {
      id: d.id,
      company: d.company || "Ny kunde",
      sub: parts.join(" · "),
      tagLabel: STAGE_LABELS[d.stage],
      tagStyle: pillStyle(STAGE_COLORS[d.stage]),
      value: fmtKr(d.value),
      onOpen: () => {
        setSelectedDealId(d.id);
        setDetail(null);
      },
    };
  };

  const detailData: DetailData | null = useMemo(() => {
    if (!detail) return null;
    if (detail === "pipeline") {
      const list = o.openDeals
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value);
      return {
        title: "Pipeline-verdi",
        subtitle: `${list.length} åpne deals · ${fmtKr(
          list.reduce((a, d) => a + d.value, 0)
        )}`,
        rows: list.map(drow),
      };
    }
    if (detail === "solgt") {
      const list = [...soldDeals].sort((a, b) => b.value - a.value);
      return {
        title: `Solgt ${spSub}`,
        subtitle: `${list.length} salg · ${fmtKr(soldValue)}`,
        rows: list.map(drow),
      };
    }
    if (detail === "margin") {
      const list = [...o.won].sort((a, b) => b.value - a.value);
      return {
        title: "Margin",
        subtitle: `Snittmargin ${o.avgMarginPct} % · ${fmtKr(
          o.marginTotal
        )} totalt · ${o.won.length} vunne salg`,
        rows: list.map((d) => {
          const r = drow(d);
          r.tagLabel = `${d.margin_pct || 0} % · ${fmtKr(
            (d.value * (d.margin_pct || 0)) / 100
          )}`;
          r.tagStyle = pillStyle("#8b5cf6");
          return r;
        }),
      };
    }
    if (detail === "winrate") {
      const list = [...o.won, ...o.lost].sort((a, b) => b.value - a.value);
      return {
        title: "Vinnrate",
        subtitle: `${o.winRate} % · ${o.won.length} vunnet / ${o.lost.length} tapt`,
        rows: list.map(drow),
      };
    }
    if (detail === "snitt") {
      const list = [...o.avgBase].sort((a, b) => b.value - a.value);
      return {
        title: "Snittverdi",
        subtitle: `${list.length} deals i tilbud sendt / forhandling`,
        banner: `Snittverdi: ${fmtKr(o.avgDeal)}`,
        rows: list.map(drow),
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, o, soldDeals, soldValue, spSub]);

  const cards = [
    {
      kicker: "Pipeline-verdi",
      value: fmtKr(o.pipelineValue),
      sub: `${o.openDeals.length} åpne deals`,
      icon: "banknote",
      color: "#4f46e5",
      onClick: () => setDetail("pipeline"),
    },
    {
      kicker: "Solgt for",
      value: fmtKr(soldValue),
      sub: `${soldDeals.length} vunnet ${spSub}`,
      icon: "trending",
      color: "#059669",
      onClick: () => setDetail("solgt"),
      periods: true,
    },
    {
      kicker: "Margin",
      value: `${o.avgMarginPct} %`,
      sub: `${fmtKr(o.marginTotal)} i margin`,
      icon: "scale",
      color: "#8b5cf6",
      onClick: () => setDetail("margin"),
    },
    {
      kicker: "Vinnrate",
      value: `${o.winRate} %`,
      sub: `${o.won.length} vunnet / ${o.lost.length} tapt`,
      icon: "target",
      color: "#0ea5e9",
      onClick: () => setDetail("winrate"),
    },
    {
      kicker: "Snittverdi",
      value: fmtKr(o.avgDeal),
      sub: "tilbud sendt / forhandling",
      icon: "trending",
      color: "#f59e0b",
      onClick: () => setDetail("snitt"),
    },
    {
      kicker: "Oppfølginger",
      value: `${o.dueList.length}`,
      sub: "krever handling i dag",
      icon: "clock",
      color: "#ef4444",
      onClick: () => router.push("/app/kalender"),
    },
  ];

  // Pipeline pr. steg
  const stageBars = STAGE_ORDER.map((stage) => {
    const list = scopedDeals.filter((d) => d.stage === stage);
    const sum = list.reduce((a, d) => a + (d.value || 0), 0);
    return { stage, count: list.length, sum };
  });
  const maxSum = Math.max(1, ...stageBars.map((b) => b.sum));

  // Oppfølginger panel (upcoming next steps)
  const upcoming = useMemo(
    () =>
      scopedDeals
        .filter((d) => d.next_step_date && ACTIVE_STAGES.includes(d.stage))
        .sort((a, b) =>
          (a.next_step_date || "").localeCompare(b.next_step_date || "")
        )
        .slice(0, 8),
    [scopedDeals]
  );

  return (
    <div className="animate-fade">
      <h2 style={{ fontSize: 26, marginBottom: 18 }}>Oversikt</h2>

      {/* Stat cards */}
      <div className="grid-stats" style={{ marginBottom: 26 }}>
        {cards.map((c) => (
          <div
            key={c.kicker}
            role="button"
            tabIndex={0}
            onClick={c.onClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                c.onClick();
              }
            }}
            className="stat-card"
            style={{
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow)",
              padding: 18,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${c.color}1f`,
                  color: c.color,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={c.icon} size={18} />
              </span>
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  color: "#626b7d",
                  fontWeight: 600,
                }}
              >
                {c.kicker}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 26,
                marginTop: 12,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {c.sub}
            </div>
            {c.periods && (
              <div
                style={{ display: "flex", gap: 5, marginTop: 10 }}
                onClick={(e) => e.stopPropagation()}
              >
                {(
                  [
                    ["uke", "Uke"],
                    ["mnd", "Måned"],
                    ["ar", "År"],
                  ] as const
                ).map(([id, label]) => (
                  <span
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSoldPeriod(id)}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 999,
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                      background:
                        soldPeriod === id ? "var(--primary)" : "var(--surface)",
                      color: soldPeriod === id ? "#fff" : "var(--muted)",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 16,
        }}
        className="oversikt-panels"
      >
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 16, marginBottom: 18 }}>Pipeline pr. steg</h4>
          {stageBars.map((b) => (
            <div
              key={b.stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 13,
              }}
            >
              <span style={{ width: 108, fontSize: 13, flexShrink: 0 }}>
                {STAGE_LABELS[b.stage]}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 999,
                  background: "#eef0f4",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${(b.sum / maxSum) * 100}%`,
                    background: STAGE_COLORS[b.stage],
                    borderRadius: 999,
                    transition: "width .3s ease",
                  }}
                />
              </span>
              <span
                style={{
                  width: 118,
                  textAlign: "right",
                  fontSize: 12,
                  color: "var(--muted)",
                  flexShrink: 0,
                }}
              >
                {b.count} · {fmtShort(b.sum)} kr
              </span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h4
            style={{
              fontSize: 16,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="clock" size={17} /> Oppfølginger
          </h4>
          {upcoming.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "11px 0 0" }}>
              Ingen oppfølginger de nærmeste dagene.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {upcoming.map((d) => {
                const dd = diffDays(d.next_step_date!);
                const overdue = dd < 0;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDealId(d.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      borderRadius: 8,
                      padding: "9px 6px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{ display: "block", fontSize: 14, fontWeight: 500 }}
                      >
                        {d.company}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        {d.next_step_text}
                      </span>
                    </span>
                    <span
                      style={
                        overdue
                          ? pillStyle(STAGE_COLORS.tapt)
                          : { ...pillStyle("#64748b"), background: "#eef0f4", color: "#4b5566" }
                      }
                    >
                      {fmtDateShort(d.next_step_date)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detailData && (
        <DetailModal data={detailData} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
