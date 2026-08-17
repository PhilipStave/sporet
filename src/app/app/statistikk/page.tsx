"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { DetailModal, type DetailData } from "@/components/DetailModal";
import { STAGE_COLORS, STAGE_LABELS, pillStyle } from "@/lib/constants";
import { fmtKr, fmtShort } from "@/lib/format";
import { stageTime } from "@/lib/metrics";
import type { Deal } from "@/types";

type StatPeriod = "uke" | "mnd" | "ar" | "alle";
type ChartType = "bar" | "line";

const LINE_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#059669",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#0d9488",
  "#d97706",
];

const MONTHS = [
  "jan", "feb", "mar", "apr", "mai", "jun",
  "jul", "aug", "sep", "okt", "nov", "des",
];

interface Bucket {
  label: string;
  match: (d: Date) => boolean;
}

function buildBuckets(period: StatPeriod): Bucket[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (period === "ar" || period === "alle") {
    const year = now.getFullYear();
    const upto = period === "alle" ? 11 : now.getMonth();
    return Array.from({ length: upto + 1 }, (_, m) => ({
      label: MONTHS[m],
      match: (d: Date) => d.getFullYear() === year && d.getMonth() === m,
    }));
  }
  if (period === "mnd") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      return {
        label: String(day),
        match: (d: Date) =>
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day,
      };
    });
  }
  // uke — last 7 days
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - i));
    return {
      label: day.toLocaleDateString("nb-NO", { day: "numeric", month: "short" }),
      match: (d: Date) => d.toDateString() === day.toDateString(),
    };
  });
}

export default function StatistikkPage() {
  const { scopedDeals, departments, setSelectedDealId, deptName } = useStore();
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [period, setPeriod] = useState<StatPeriod>("alle");
  const [selDepts, setSelDepts] = useState<string[]>(
    departments.map((d) => d.id)
  );
  const [drill, setDrill] = useState<string | null>(null); // dept id or "alle"

  const showAll = selDepts.length === departments.length;

  const won = useMemo(
    () => scopedDeals.filter((d) => d.stage === "vunnet"),
    [scopedDeals]
  );

  const buckets = useMemo(() => buildBuckets(period), [period]);

  // series[deptId] = number[] per bucket
  const series = useMemo(() => {
    const map: Record<string, number[]> = {};
    const active = departments.filter((d) => selDepts.includes(d.id));
    active.forEach((dep) => {
      map[dep.id] = buckets.map((b) =>
        won
          .filter(
            (d) =>
              d.department_id === dep.id &&
              b.match(new Date(stageTime(d)))
          )
          .reduce((a, d) => a + (d.value || 0), 0)
      );
    });
    return map;
  }, [won, departments, selDepts, buckets]);

  const totals = useMemo(
    () => buckets.map((_, i) => Object.values(series).reduce((a, s) => a + s[i], 0)),
    [series, buckets]
  );
  const maxVal = Math.max(1, ...totals, ...Object.values(series).flat());

  const toggleDept = (id: string) =>
    setSelDepts((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  // Drill-down data
  const drillData: DetailData | null = useMemo(() => {
    if (!drill) return null;
    const spLabel = { uke: "denne uken", mnd: "denne måneden", ar: "i år", alle: "totalt" }[period];
    const inPeriod = (d: Deal) =>
      period === "alle" ? true : buckets.some((b) => b.match(new Date(stageTime(d))));
    const list = won
      .filter(inPeriod)
      .filter((d) => (drill === "alle" ? true : d.department_id === drill))
      .sort((a, b) => b.value - a.value);
    const tv = list.reduce((a, d) => a + d.value, 0);
    const tm = list.reduce((a, d) => a + d.value * ((d.margin_pct || 0) / 100), 0);
    const avg = tv > 0 ? Math.round((tm / tv) * 100) : 0;
    const title = drill === "alle" ? "Alle avdelinger" : deptName(drill);
    return {
      title: `${title} — solgt ${spLabel}`,
      subtitle: `${list.length} salg · ${fmtKr(tv)} · margin ${avg} % (${fmtKr(tm)})`,
      rows: list.map((d) => ({
        id: d.id,
        company: d.company || "Ny kunde",
        sub: [deptName(d.department_id), d.owner_name, d.product]
          .filter(Boolean)
          .join(" · "),
        tagLabel: STAGE_LABELS[d.stage],
        tagStyle: pillStyle(STAGE_COLORS[d.stage]),
        value: fmtKr(d.value),
        onOpen: () => {
          setSelectedDealId(d.id);
          setDrill(null);
        },
      })),
    };
  }, [drill, won, period, buckets, deptName, setSelectedDealId]);

  // Department total cards
  const deptCards = departments
    .filter((d) => selDepts.includes(d.id))
    .map((dep) => {
      const total = (series[dep.id] || []).reduce((a, v) => a + v, 0);
      return { id: dep.id, name: dep.name, total };
    });
  const allTotal = deptCards.reduce((a, c) => a + c.total, 0);

  return (
    <div className="animate-fade">
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>Statistikk</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
        Vunne salg over tid, per avdeling.
      </p>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          margin: "22px 0",
        }}
      >
        <div className="pillgroup">
          <button data-active={chartType === "bar"} onClick={() => setChartType("bar")}>
            Søyler
          </button>
          <button data-active={chartType === "line"} onClick={() => setChartType("line")}>
            Linje
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button
            className="chip"
            data-active={showAll}
            onClick={() => setSelDepts(departments.map((d) => d.id))}
          >
            Alle (total)
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              className="chip"
              data-active={selDepts.includes(d.id)}
              onClick={() => toggleDept(d.id)}
            >
              {d.name}
            </button>
          ))}
        </div>

        <div className="pillgroup" style={{ marginLeft: "auto" }}>
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
              onClick={() => setPeriod(id as StatPeriod)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: 20 }}>
        <Chart
          chartType={chartType}
          buckets={buckets}
          totals={totals}
          series={series}
          departments={departments.filter((d) => selDepts.includes(d.id))}
          maxVal={maxVal}
        />
      </div>

      {/* Totals per department */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          className="stat-card"
          onClick={() => setDrill("alle")}
          style={cardStyle}
        >
          <div style={kickerStyle}>Alle</div>
          <div style={valueStyle}>{fmtKr(allTotal)}</div>
        </button>
        {deptCards.map((c) => (
          <button
            key={c.id}
            type="button"
            className="stat-card"
            onClick={() => setDrill(c.id)}
            style={cardStyle}
          >
            <div style={kickerStyle}>{c.name}</div>
            <div style={valueStyle}>{fmtKr(c.total)}</div>
          </button>
        ))}
      </div>

      {drillData && <DetailModal data={drillData} onClose={() => setDrill(null)} />}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  textAlign: "left",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "var(--shadow)",
  padding: 16,
  cursor: "pointer",
};
const kickerStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  fontWeight: 600,
};
const valueStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 600,
  fontSize: 22,
  marginTop: 6,
};

// ------------------------------------------------------------
// Chart (HTML/CSS bars + SVG line)
// ------------------------------------------------------------
function Chart({
  chartType,
  buckets,
  totals,
  series,
  departments,
  maxVal,
}: {
  chartType: ChartType;
  buckets: { label: string }[];
  totals: number[];
  series: Record<string, number[]>;
  departments: { id: string; name: string }[];
  maxVal: number;
}) {
  const PLOT = 260;
  const yTicks = 4;
  const axis = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxVal / yTicks) * (yTicks - i))
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {/* Y axis */}
        <div
          style={{
            width: 58,
            height: PLOT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--muted)",
            textAlign: "right",
            paddingRight: 6,
          }}
        >
          {axis.map((v, i) => (
            <span key={i}>{fmtShort(v)}</span>
          ))}
        </div>

        {/* Plot */}
        <div
          className="scrollbar-thin"
          style={{ flex: 1, overflowX: "auto" }}
        >
          <div
            style={{
              position: "relative",
              height: PLOT,
              minWidth: Math.max(buckets.length * 44, 200),
              borderLeft: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* Horizontal grid */}
            {axis.map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${(i / yTicks) * 100}%`,
                  borderTop: "1px solid #f0f1f5",
                }}
              />
            ))}

            {chartType === "line" ? (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              >
                {departments.map((dep, di) => {
                  const data = series[dep.id] || [];
                  if (data.length < 1) return null;
                  const pts = data
                    .map((v, i) => {
                      const x =
                        data.length === 1
                          ? 50
                          : (i / (data.length - 1)) * 100;
                      const y = 100 - (v / maxVal) * 100;
                      return `${x},${y}`;
                    })
                    .join(" ");
                  return (
                    <polyline
                      key={dep.id}
                      points={pts}
                      fill="none"
                      stroke={LINE_COLORS[di % LINE_COLORS.length]}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  padding: "0 6px",
                }}
              >
                {buckets.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: 20,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: "100%",
                    }}
                  >
                    {totals[i] > 0 && (
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtShort(totals[i])}
                      </span>
                    )}
                    <div
                      title={`${b.label}: ${fmtKr(totals[i])}`}
                      style={{
                        width: "72%",
                        height: `${(totals[i] / maxVal) * 100}%`,
                        minHeight: totals[i] > 0 ? 3 : 0,
                        background: "var(--primary)",
                        borderRadius: "6px 6px 0 0",
                        transition: "height .3s ease",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* X axis labels */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "6px 6px 0",
              minWidth: Math.max(buckets.length * 44, 200),
            }}
          >
            {buckets.map((b, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  minWidth: 20,
                  textAlign: "center",
                  fontSize: 10,
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend for line mode */}
      {chartType === "line" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 14 }}>
          {departments.map((dep, di) => (
            <span
              key={dep.id}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
            >
              <span
                style={{
                  width: 14,
                  height: 3,
                  borderRadius: 999,
                  background: LINE_COLORS[di % LINE_COLORS.length],
                }}
              />
              {dep.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
