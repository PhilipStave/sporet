import Link from "next/link";
import { loadAdminOverview, type OrgSummary } from "@/lib/admin-data";
import { fmtKr, relativeLabel, fmtDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATE_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  trial: { label: "Prøve", bg: "var(--primary-050)", fg: "var(--primary)" },
  active: { label: "Aktiv", bg: "var(--tint-success, #e6f4ea)", fg: "var(--success, #137333)" },
  past_due: { label: "Forfalt", bg: "var(--tint-warn, #fdf3e0)", fg: "var(--warn, #9a6700)" },
  expired: { label: "Utløpt", bg: "var(--tint-danger)", fg: "var(--danger)" },
  canceled: { label: "Avsluttet", bg: "var(--tint-danger)", fg: "var(--danger)" },
};

function StatePill({ state }: { state: string }) {
  const s = STATE_LABEL[state] ?? { label: state, bg: "var(--row-hover)", fg: "var(--muted)" };
  return (
    <span className="pill" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

export default async function AdminPage() {
  const { orgs, totals } = await loadAdminOverview();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Oversikt</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Alle bedrifter som bruker Altiv. Tall oppdateres hver gang du laster siden.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Stat label="Bedrifter" value={totals.orgs} sub={`${totals.newOrgs30d} nye siste 30 dager`} />
        <Stat label="Betalende" value={totals.active} sub={totals.pastDue ? `${totals.pastDue} med forfalt betaling` : "—"} />
        <Stat label="I prøveperiode" value={totals.trial} />
        <Stat label="Utløpt / avsluttet" value={totals.expired} />
        <Stat label="Aktive brukere" value={totals.users} sub="godkjente innlogginger" />
        <Stat label="Aktive siste 7 d" value={totals.activeOrgs7d} sub="bedrifter med bruk" />
        <Stat label="MRR" value={fmtKr(totals.mrr)} sub="månedlig, eks. mva" />
        <Stat label="ARR" value={fmtKr(totals.mrr * 12)} sub="årlig løpende" />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14 }}>
          Bedrifter ({orgs.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
                <Th>Bedrift</Th>
                <Th>Status</Th>
                <Th>Plan</Th>
                <Th>Brukere</Th>
                <Th>Kunder</Th>
                <Th>Vunnet for</Th>
                <Th>Aktivitet 7 d</Th>
                <Th>E-post</Th>
                <Th>Dok.</Th>
                <Th>Sist innlogget</Th>
                <Th>Opprettet</Th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <Row key={o.org.id} o={o} />
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                    Ingen bedrifter ennå.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap", color: muted ? "var(--muted)" : undefined }}>
      {children}
    </td>
  );
}

function Row({ o }: { o: OrgSummary }) {
  const { org, access } = o;
  const planLabel = org.plan === "trial" ? "—" : `${org.plan} brukere`;
  const when =
    access.state === "trial"
      ? `prøve ut ${fmtDateShort(org.trial_ends_at)}`
      : org.current_period_end
        ? `til ${fmtDateShort(org.current_period_end)}`
        : "";
  return (
    <tr className="row-hover">
      <Td>
        <Link href={`/admin/${org.id}`} style={{ fontWeight: 600, color: "var(--text)" }}>
          {org.name}
        </Link>
      </Td>
      <Td>
        <StatePill state={access.state} />
        {when && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>{when}</span>}
      </Td>
      <Td>
        {planLabel}
        {o.planPrice ? <span style={{ color: "var(--muted)" }}> · {fmtKr(o.planPrice)}/mnd</span> : null}
      </Td>
      <Td>
        {o.users}
        {o.pendingUsers ? <span style={{ color: "var(--warn, #9a6700)" }}> (+{o.pendingUsers} venter)</span> : null}
      </Td>
      <Td>{o.deals}</Td>
      <Td>{fmtKr(o.wonValue)}</Td>
      <Td>{o.activities7d}</Td>
      <Td>{o.emails}</Td>
      <Td>{o.documents}</Td>
      <Td muted>{o.lastSignInAt ? relativeLabel(o.lastSignInAt) : "aldri"}</Td>
      <Td muted>{fmtDateShort(org.created_at)}</Td>
    </tr>
  );
}
