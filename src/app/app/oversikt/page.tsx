"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { DetailModal, type DetailData, type DetailRow } from "@/components/DetailModal";
import {
  pillStyle,
  WON_KEY,
} from "@/lib/constants";
import { fmtKr, fmtShort, diffDays, fmtDateShort } from "@/lib/format";
import { stageLabel, stageColor } from "@/lib/stages";
import { computeOverview, withinDays } from "@/lib/metrics";
import type { Deal } from "@/types";

type SoldPeriod = "uke" | "mnd" | "ar";

/** Stable department colours: index in the department list decides, so a
 *  department keeps its colour across periods and reloads. */
const AVD_FARGER = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#0891b2", "#8b5cf6", "#be185d"];

export default function OversiktPage() {
  const {
    scopedDeals,
    deals,
    departments,
    deptName,
    setSelectedDealId,
    stageMaps,
    scope,
    profile,
    salgsmaal,
  } = useStore();
  const router = useRouter();
  const [soldPeriod, setSoldPeriod] = useState<SoldPeriod>("uke");
  const [detail, setDetail] = useState<string | null>(null);

  const o = useMemo(
    () => computeOverview(scopedDeals, stageMaps.open),
    [scopedDeals, stageMaps.open]
  );

  // "Late" stages used for Snittverdi = last two open stages (e.g. Tilbud sendt / Forhandling)
  const lateLabel = stageMaps.open
    .slice(-2)
    .map((k) => stageLabel(stageMaps, k).toLowerCase())
    .join(" / ");
  const spSub = { uke: "denne uken", mnd: "denne måneden", ar: "i år" }[
    soldPeriod
  ];
  const soldDeals = useMemo(
    () => o.won.filter((d) => withinDays(d, soldPeriod)),
    [o.won, soldPeriod]
  );
  const soldValue = soldDeals.reduce((a, d) => a + (d.value || 0), 0);

  /**
   * Sales per department for the chosen period — the leader's answer to
   * "who is delivering the company number?". Shares are of actual sales, so
   * they always sum to 100 %; the target column is each department's own
   * monthly target scaled to the period, when one is set.
   */
  const avdSalg = useMemo(() => {
    if (departments.length === 0) return [];
    const skala = soldPeriod === "mnd" ? 1 : soldPeriod === "ar" ? 12 : 12 / 52;
    // All won deals in the period, org-wide — this panel deliberately ignores
    // the scope selector: its whole point is comparing departments.
    const vunnet = deals.filter((d) => d.stage === WON_KEY && withinDays(d, soldPeriod));
    const rows = departments.map((avd, i) => {
      const solgt = vunnet
        .filter((d) => d.department_id === avd.id)
        .reduce((a, d) => a + (d.value || 0), 0);
      const maalMnd = salgsmaal.find((m) => m.department_id === avd.id)?.maanedsmaal ?? null;
      return {
        id: avd.id,
        navn: avd.name,
        farge: AVD_FARGER[i % AVD_FARGER.length],
        solgt,
        maal: maalMnd != null ? maalMnd * skala : null,
      };
    });
    const utenAvd = vunnet
      .filter((d) => !d.department_id || !departments.some((a) => a.id === d.department_id))
      .reduce((a, d) => a + (d.value || 0), 0);
    if (utenAvd > 0)
      rows.push({ id: "uten", navn: "Uten avdeling", farge: "#9ca3af", solgt: utenAvd, maal: null });
    const total = rows.reduce((a, r) => a + r.solgt, 0);
    return rows
      .map((r) => ({ ...r, andel: total > 0 ? r.solgt / total : 0 }))
      .sort((a, b) => b.solgt - a.solgt);
  }, [departments, deals, salgsmaal, soldPeriod]);
  const avdTotal = avdSalg.reduce((a, r) => a + r.solgt, 0);

  /**
   * The sales target matching what the screen currently shows: the seller's
   * own target under "Mine", the department's under a department scope, and
   * the org target under "Alle" — falling back to the sum of department (or
   * seller) targets when no org-wide number is set, so a leader who only set
   * per-department targets still gets a company bar.
   *
   * Targets are stored per month. Week and year are steady-pace derivations
   * (×12/52 and ×12), not separate promises.
   */
  const soldTarget = useMemo(() => {
    let mnd: number | null = null;
    if (scope.type === "mine") {
      mnd = salgsmaal.find((m) => m.profile_id === profile.id)?.maanedsmaal ?? null;
    } else if (scope.type === "dept") {
      mnd = salgsmaal.find((m) => m.department_id === scope.deptId)?.maanedsmaal ?? null;
    } else {
      const org = salgsmaal.find((m) => !m.department_id && !m.profile_id);
      if (org) mnd = org.maanedsmaal;
      else {
        const avd = salgsmaal.filter((m) => m.department_id);
        const selgere = salgsmaal.filter((m) => m.profile_id);
        const sum = (avd.length ? avd : selgere).reduce((a, m) => a + m.maanedsmaal, 0);
        mnd = sum > 0 ? sum : null;
      }
    }
    if (mnd == null) return null;
    return soldPeriod === "mnd" ? mnd : soldPeriod === "ar" ? mnd * 12 : (mnd * 12) / 52;
  }, [salgsmaal, scope, profile.id, soldPeriod]);

  const drow = (d: Deal): DetailRow => {
    const parts = [
      deptName(d.department_id),
      d.owner_name || "Ingen selger",
    ].concat(d.product ? [d.product] : []);
    return {
      id: d.id,
      company: d.company || "Ny kunde",
      sub: parts.join(" · "),
      tagLabel: stageLabel(stageMaps, d.stage),
      tagStyle: pillStyle(stageColor(stageMaps, d.stage)),
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
        subtitle: `${list.length} deals i ${lateLabel}`,
        banner: `Snittverdi: ${fmtKr(o.avgDeal)}`,
        rows: list.map(drow),
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, o, soldDeals, soldValue, spSub, stageMaps]);

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
      sub: lateLabel,
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
  const stageBars = stageMaps.list.map((st) => {
    const stage = st.key;
    const list = scopedDeals.filter((d) => d.stage === stage);
    const sum = list.reduce((a, d) => a + (d.value || 0), 0);
    return { stage, count: list.length, sum };
  });
  const maxSum = Math.max(1, ...stageBars.map((b) => b.sum));

  // Oppfølginger panel (upcoming next steps)
  const upcoming = useMemo(
    () =>
      scopedDeals
        .filter((d) => d.next_step_date && stageMaps.open.includes(d.stage))
        .sort((a, b) =>
          (a.next_step_date || "").localeCompare(b.next_step_date || "")
        )
        .slice(0, 8),
    [scopedDeals, stageMaps.open]
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
            {c.periods && soldTarget != null && (
              <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  <span>Mål: {fmtKr(Math.round(soldTarget))}</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: soldValue >= soldTarget ? "#059669" : "var(--muted)",
                    }}
                  >
                    {Math.round((soldValue / soldTarget) * 100)} %
                  </span>
                </div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (soldValue / soldTarget) * 100)}%`,
                      borderRadius: 999,
                      background: soldValue >= soldTarget ? "#059669" : "var(--primary)",
                      transition: "width .3s ease",
                    }}
                  />
                </div>
              </div>
            )}
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

      {/* Sales per department: who delivers the company number, and are they
          on their own target. Hidden when the org has no departments. */}
      {avdSalg.length > 0 && (
        <div className="card stat-card" style={{ padding: 20, marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, margin: 0 }}>Salg per avdeling</h4>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{spSub}</span>
          </div>
          <div style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
            {/* Donut of each department's share of what was actually sold. */}
            <div
              aria-hidden
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                flex: "none",
                background:
                  avdTotal > 0
                    ? `conic-gradient(${avdSalg
                        .reduce<{ stops: string[]; acc: number }>(
                          (s, r) => {
                            const fra = s.acc * 360;
                            const til = (s.acc + r.andel) * 360;
                            s.stops.push(`${r.farge} ${fra}deg ${til}deg`);
                            s.acc += r.andel;
                            return s;
                          },
                          { stops: [], acc: 0 }
                        )
                        .stops.join(", ")})`
                    : "var(--bg)",
                border: avdTotal > 0 ? "none" : "1px dashed var(--border)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 26,
                  borderRadius: "50%",
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                <strong style={{ fontSize: 13, color: "var(--text)" }}>
                  {fmtShort(avdTotal)}
                </strong>
                solgt
              </div>
            </div>

            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 10 }}>
              {avdSalg.map((r) => (
                <div key={r.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13.5,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: r.farge,
                        flex: "none",
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{r.navn}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {fmtKr(r.solgt)} · {Math.round(r.andel * 100)} % av salget
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12.5 }}>
                      {r.maal != null ? (
                        r.solgt >= r.maal ? (
                          <span style={{ color: "#059669", fontWeight: 700 }}>✓ Mål nådd</span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>
                            {Math.round((r.solgt / r.maal) * 100)} % av {fmtShort(r.maal)}
                          </span>
                        )
                      ) : (
                        <span style={{ color: "var(--muted)", opacity: 0.6 }}>uten mål</span>
                      )}
                    </span>
                  </div>
                  {r.maal != null && (
                    <div
                      style={{
                        height: 5,
                        borderRadius: 999,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, (r.solgt / r.maal) * 100)}%`,
                          background: r.solgt >= r.maal ? "#059669" : r.farge,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 16,
        }}
        className="oversikt-panels"
      >
        <div
          className="card stat-card"
          role="button"
          tabIndex={0}
          title="Åpne pipelinen"
          onClick={() => router.push("/app/pipeline")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/app/pipeline");
            }
          }}
          style={{ padding: 20, cursor: "pointer" }}
        >
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
                {stageLabel(stageMaps, b.stage)}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 999,
                  background: "var(--tint-neutral)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${(b.sum / maxSum) * 100}%`,
                    background: stageColor(stageMaps, b.stage),
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
                          ? pillStyle("var(--danger)")
                          : { ...pillStyle("#64748b"), background: "var(--tint-neutral)", color: "var(--tint-neutral-text)" }
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
