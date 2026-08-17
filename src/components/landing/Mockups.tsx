// Crisp vector "screenshots" for the landing page — never pixelate.

const C = {
  surface: "#ffffff",
  bg: "#f5f6f8",
  border: "#e6e8ef",
  text: "#111420",
  muted: "#626b7d",
  primary: "#4f46e5",
  primary050: "#eef0fe",
};

const STAGE = {
  ny: "#64748b",
  kontaktet: "#0ea5e9",
  dialog: "#6366f1",
  tilbud: "#8b5cf6",
  forhandling: "#f59e0b",
  vunnet: "#059669",
};

const frame: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
};

function Chrome({ children, w, h }: { children: React.ReactNode; w: number; h: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={frame} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width={w} height={h} rx="14" fill={C.surface} />
      {/* top bar */}
      <rect x="0" y="0" width={w} height="46" fill={C.surface} />
      <line x1="0" y1="46" x2={w} y2="46" stroke={C.border} />
      <rect x="20" y="16" width="15" height="15" rx="5" fill={C.primary} />
      <rect x="42" y="18" width="52" height="11" rx="3" fill={C.text} opacity="0.85" />
      {children}
    </svg>
  );
}

/** Oversikt dashboard — the hero image. */
export function DashboardMock() {
  const cards = [
    { k: "PIPELINE-VERDI", v: "3 090 000 kr", c: C.primary },
    { k: "SOLGT FOR", v: "95 000 kr", c: STAGE.vunnet },
    { k: "MARGIN", v: "22 %", c: STAGE.tilbud },
    { k: "VINNRATE", v: "50 %", c: STAGE.kontaktet },
    { k: "SNITTVERDI", v: "345 000 kr", c: STAGE.forhandling },
    { k: "OPPFØLGINGER", v: "3", c: "#ef4444" },
  ];
  const bars = [
    { label: "Potensiell", w: 0.4, c: STAGE.ny },
    { label: "Kontaktet", w: 0.32, c: STAGE.kontaktet },
    { label: "I dialog", w: 0.78, c: STAGE.dialog },
    { label: "Tilbud sendt", w: 0.55, c: STAGE.tilbud },
    { label: "Forhandling", w: 0.95, c: STAGE.forhandling },
  ];
  const W = 1000;
  return (
    <Chrome w={W} h={600}>
      {/* nav tabs */}
      {["Oversikt", "Pipeline", "Kalender", "Statistikk", "Selgere"].map((t, i) => (
        <g key={t}>
          {i === 0 && <rect x={120 + i * 92} y="12" width="78" height="22" rx="11" fill={C.primary050} />}
          <rect x={132 + i * 92} y="18" width={44} height="9" rx="3" fill={i === 0 ? C.primary : C.muted} opacity={i === 0 ? 0.9 : 0.5} />
        </g>
      ))}
      {/* body bg */}
      <rect x="0" y="46" width={W} height="554" fill={C.bg} />
      <rect x="40" y="70" width="120" height="18" rx="4" fill={C.text} opacity="0.85" />

      {/* stat cards 3x2 */}
      {cards.map((card, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 40 + col * 312;
        const y = 108 + row * 130;
        return (
          <g key={card.k}>
            <rect x={x} y={y} width="292" height="112" rx="12" fill={C.surface} stroke={C.border} />
            <rect x={x + 18} y={y + 18} width="34" height="34" rx="9" fill={card.c} opacity="0.12" />
            <circle cx={x + 35} cy={y + 35} r="7" fill="none" stroke={card.c} strokeWidth="2" />
            <rect x={x + 62} y={y + 26} width="92" height="8" rx="3" fill={C.muted} opacity="0.55" />
            <rect x={x + 18} y={y + 66} width={card.v.length * 9 + 10} height="18" rx="4" fill={C.text} />
            <rect x={x + 18} y={y + 92} width="70" height="7" rx="3" fill={C.muted} opacity="0.4" />
          </g>
        );
      })}

      {/* pipeline pr steg panel */}
      <g>
        <rect x="40" y="380" width="616" height="196" rx="12" fill={C.surface} stroke={C.border} />
        <rect x="60" y="402" width="130" height="12" rx="4" fill={C.text} opacity="0.8" />
        {bars.map((b, i) => {
          const y = 434 + i * 27;
          return (
            <g key={b.label}>
              <rect x="60" y={y} width="90" height="8" rx="3" fill={C.muted} opacity="0.5" />
              <rect x="164" y={y - 3} width="420" height="13" rx="6" fill="#eef0f4" />
              <rect x="164" y={y - 3} width={420 * b.w} height="13" rx="6" fill={b.c} />
            </g>
          );
        })}
      </g>

      {/* oppfølginger panel */}
      <g>
        <rect x="672" y="380" width="288" height="196" rx="12" fill={C.surface} stroke={C.border} />
        <rect x="692" y="402" width="110" height="12" rx="4" fill={C.text} opacity="0.8" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="692" y={436 + i * 42} width="150" height="9" rx="3" fill={C.text} opacity="0.7" />
            <rect x="692" y={452 + i * 42} width="110" height="7" rx="3" fill={C.muted} opacity="0.4" />
            <rect x="880" y={438 + i * 42} width="56" height="18" rx="9" fill={i === 0 ? "#fdecea" : "#eef0f4"} />
          </g>
        ))}
      </g>
    </Chrome>
  );
}

/** Statistikk — line chart (fancier). */
export function LineChartMock() {
  const W = 1000;
  const H = 560;
  const plotX = 90;
  const plotY = 150;
  const plotW = 860;
  const plotH = 300;
  const series = [
    { c: STAGE.vunnet, pts: [0.2, 0.35, 0.3, 0.55, 0.5, 0.72, 0.68, 0.9] },
    { c: C.primary, pts: [0.4, 0.3, 0.5, 0.45, 0.62, 0.55, 0.78, 0.7] },
    { c: STAGE.tilbud, pts: [0.1, 0.2, 0.28, 0.22, 0.38, 0.42, 0.5, 0.62] },
  ];
  const total = series[0].pts.map((_, i) =>
    Math.min(1, series.reduce((a, s) => a + s.pts[i], 0) / 2.2)
  );
  const px = (i: number, n: number) => plotX + (i / (n - 1)) * plotW;
  const py = (v: number) => plotY + (1 - v) * plotH;
  const toPath = (pts: number[]) =>
    pts.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i, pts.length)} ${py(v)}`).join(" ");

  return (
    <Chrome w={W} h={H}>
      <rect x="0" y="46" width={W} height={H - 46} fill={C.bg} />
      <rect x="40" y="70" width="130" height="18" rx="4" fill={C.text} opacity="0.85" />

      {/* controls */}
      <rect x="40" y="104" width="150" height="30" rx="15" fill={C.surface} stroke={C.border} />
      <rect x="44" y="108" width="70" height="22" rx="11" fill={C.primary} />
      <rect x="58" y="115" width="34" height="8" rx="3" fill="#fff" opacity="0.95" />
      <rect x="128" y="115" width="34" height="8" rx="3" fill={C.muted} opacity="0.6" />

      {/* chart card */}
      <rect x="40" y="150" width="920" height="330" rx="12" fill={C.surface} stroke={C.border} />

      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={plotX} y1={plotY + g * plotH} x2={plotX + plotW} y2={plotY + g * plotH} stroke="#f0f1f5" />
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <rect key={"y" + g} x="52" y={plotY + g * plotH - 5} width="26" height="7" rx="3" fill={C.muted} opacity="0.4" />
      ))}

      {/* total dashed line */}
      <path d={toPath(total)} fill="none" stroke="#1b1a18" strokeWidth="2" strokeDasharray="4 4" opacity="0.55" strokeLinejoin="round" strokeLinecap="round" />
      {/* series */}
      {series.map((s, i) => (
        <g key={i}>
          <path d={toPath(s.pts)} fill="none" stroke={s.c} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {s.pts.map((v, j) => (
            <circle key={j} cx={px(j, s.pts.length)} cy={py(v)} r="3.5" fill={C.surface} stroke={s.c} strokeWidth="2" />
          ))}
        </g>
      ))}

      {/* legend */}
      {["Bane", "Bygg", "Industri", "Alle (total)"].map((t, i) => {
        const colors = [STAGE.vunnet, C.primary, STAGE.tilbud, "#1b1a18"];
        return (
          <g key={t}>
            <rect x={80 + i * 130} y="500" width="16" height="4" rx="2" fill={colors[i]} />
            <rect x={102 + i * 130} y="498" width={t.length * 7} height="8" rx="3" fill={C.muted} opacity="0.6" />
          </g>
        );
      })}
    </Chrome>
  );
}

/** Pipeline kanban board. */
export function PipelineMock() {
  const W = 1000;
  const cols = [
    { label: "Potensiell", c: STAGE.ny, n: 2 },
    { label: "Kontaktet", c: STAGE.kontaktet, n: 2 },
    { label: "I dialog", c: STAGE.dialog, n: 3 },
    { label: "Tilbud", c: STAGE.tilbud, n: 2 },
  ];
  return (
    <Chrome w={W} h={560}>
      <rect x="0" y="46" width={W} height="514" fill={C.bg} />
      <rect x="40" y="70" width="110" height="18" rx="4" fill={C.text} opacity="0.85" />
      {cols.map((col, ci) => {
        const x = 40 + ci * 236;
        return (
          <g key={col.label}>
            <rect x={x} y="110" width="216" height="40" rx="10" fill={C.surface} stroke={C.border} />
            <rect x={x} y="110" width="216" height="3" rx="1.5" fill={col.c} />
            <circle cx={x + 18} cy="132" r="5" fill={col.c} />
            <rect x={x + 32} y="126" width="90" height="10" rx="3" fill={C.text} opacity="0.75" />
            {Array.from({ length: col.n }).map((_, i) => {
              const y = 162 + i * 96;
              return (
                <g key={i}>
                  <rect x={x} y={y} width="216" height="82" rx="10" fill={C.surface} stroke={C.border} />
                  <rect x={x + 14} y={y + 16} width="120" height="11" rx="3" fill={C.text} opacity="0.8" />
                  <rect x={x + 14} y={y + 34} width="70" height="9" rx="3" fill={col.c} opacity="0.8" />
                  <rect x={x + 14} y={y + 54} width="150" height="8" rx="3" fill={C.muted} opacity="0.35" />
                </g>
              );
            })}
          </g>
        );
      })}
    </Chrome>
  );
}

/** Customers table. */
export function CustomersMock() {
  const W = 1000;
  const rows = 6;
  return (
    <Chrome w={W} h={560}>
      <rect x="0" y="46" width={W} height="514" fill={C.bg} />
      <rect x="40" y="70" width="90" height="18" rx="4" fill={C.text} opacity="0.85" />
      <rect x="40" y="108" width="920" height="430" rx="12" fill={C.surface} stroke={C.border} />
      {/* header */}
      {[0, 200, 400, 600, 760].map((x, i) => (
        <rect key={i} x={72 + x} y="128" width="70" height="8" rx="3" fill={C.muted} opacity="0.5" />
      ))}
      <line x1="56" y1="152" x2="944" y2="152" stroke={C.border} />
      {Array.from({ length: rows }).map((_, r) => {
        const y = 170 + r * 60;
        const stageColors = [STAGE.vunnet, STAGE.dialog, STAGE.tilbud, STAGE.kontaktet, STAGE.forhandling, STAGE.ny];
        return (
          <g key={r}>
            <rect x="72" y={y} width="130" height="11" rx="3" fill={C.text} opacity="0.78" />
            <rect x="72" y={y + 18} width="90" height="8" rx="3" fill={C.muted} opacity="0.4" />
            <rect x="272" y={y + 4} width="120" height="10" rx="3" fill={C.muted} opacity="0.55" />
            <rect x="472" y={y + 4} width="90" height="10" rx="3" fill={C.muted} opacity="0.55" />
            <rect x="672" y={y - 1} width="76" height="20" rx="10" fill={stageColors[r]} opacity="0.16" />
            <rect x="686" y={y + 5} width="48" height="8" rx="3" fill={stageColors[r]} />
            <rect x="832" y={y + 4} width="90" height="11" rx="3" fill={C.text} opacity="0.7" />
            {r < rows - 1 && <line x1="56" y1={y + 42} x2="944" y2={y + 42} stroke={C.border} />}
          </g>
        );
      })}
    </Chrome>
  );
}
