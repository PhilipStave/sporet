import Link from "next/link";
import { notFound } from "next/navigation";
import { loadOrgDetail } from "@/lib/admin-data";
import { fmtKr, relativeLabel, fmtDateShort, fmtDateLong } from "@/lib/format";
import { OrgAdminControls } from "./OrgAdminControls";

export const dynamic = "force-dynamic";

export default async function AdminOrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const d = await loadOrgDetail(orgId);
  if (!d) notFound();
  const { summary, members, departments, stageCounts, recentActivity, unmatchedEmails } = d;
  const { org, access } = summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--muted)" }}>
          ← Alle bedrifter
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 2px" }}>{org.name}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Opprettet {fmtDateLong(org.created_at)} · {access.message}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <Kpi label="Status" value={access.state} />
        <Kpi label="Plan" value={org.plan === "trial" ? "—" : `${org.plan} brukere`} sub={summary.planPrice ? `${fmtKr(summary.planPrice)}/mnd` : undefined} />
        <Kpi label="Brukere" value={summary.users} sub={summary.pendingUsers ? `${summary.pendingUsers} venter på godkjenning` : `${summary.admins} admin`} />
        <Kpi label="Kunder" value={summary.deals} />
        <Kpi label="Vunnet for" value={fmtKr(summary.wonValue)} />
        <Kpi label="E-poster logget" value={summary.emails} sub={unmatchedEmails ? `${unmatchedEmails} ikke plassert` : undefined} />
        <Kpi label="Dokumenter" value={summary.documents} />
        <Kpi label="Aktivitet 7 d" value={summary.activities7d} sub={summary.lastActivityAt ? `sist ${relativeLabel(summary.lastActivityAt)}` : "ingen"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Members */}
          <section className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14 }}>
              Brukere ({members.length})
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
                    <th style={th}>Navn</th>
                    <th style={th}>E-post</th>
                    <th style={th}>Rolle</th>
                    <th style={th}>Status</th>
                    <th style={th}>Kunder</th>
                    <th style={th}>Sist innlogget</th>
                    <th style={th}>Opprettet</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td style={td}>{m.full_name || "—"}</td>
                      <td style={td}>{m.email}</td>
                      <td style={td}>{m.role === "admin" ? "Admin" : "Selger"}</td>
                      <td style={td}>{m.status === "active" ? "Aktiv" : "Venter"}</td>
                      <td style={td}>{m.deals}</td>
                      <td style={{ ...td, color: "var(--muted)" }}>{m.last_sign_in_at ? relativeLabel(m.last_sign_in_at) : "aldri"}</td>
                      <td style={{ ...td, color: "var(--muted)" }}>{fmtDateShort(m.created_at)}</td>
                      <td style={td}>
                        <OrgAdminControls.ResetPassword userId={m.id} name={m.full_name || m.email} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pipeline */}
          <section className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Pipeline</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {stageCounts.map((s) => (
                <div key={s.key} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{s.label}</div>
                  <div style={{ color: "var(--muted)" }}>
                    {s.count} · {fmtKr(s.value)}
                  </div>
                </div>
              ))}
            </div>
            {departments.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
                Avdelinger: {departments.map((x) => x.name).join(", ")}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Siste aktivitet</div>
            {recentActivity.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Ingen aktivitet ennå.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                {recentActivity.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: "var(--muted)", minWidth: 90 }}>{relativeLabel(a.created_at)}</span>
                    <span>
                      <strong>{a.label}</strong>
                      {a.note ? ` · ${a.note.slice(0, 120)}` : ""}
                      {a.actor_name ? <span style={{ color: "var(--muted)" }}> — {a.actor_name}</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <OrgAdminControls.Subscription
            orgId={org.id}
            plan={org.plan}
            status={org.subscription_status}
            trialEndsAt={org.trial_ends_at}
            currentPeriodEnd={org.current_period_end}
            stripeCustomerId={org.stripe_customer_id}
            stripeSubscriptionId={org.stripe_subscription_id}
          />
          <section className="card" style={{ padding: 16, fontSize: 13 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Teknisk</div>
            <div style={{ display: "grid", gap: 6, color: "var(--muted)" }}>
              <div>Org-ID: <code style={{ fontSize: 11 }}>{org.id}</code></div>
              <div>Bedriftskode: <code>{org.join_code}</code></div>
              <div>Logg-adresse: <code>{org.inbound_key ? `${org.inbound_key}@altiv.no` : "—"}</code></div>
              <div>Stripe-kunde: <code>{org.stripe_customer_id ?? "—"}</code></div>
              <div>Stripe-abonnement: <code>{org.stripe_subscription_id ?? "—"}</code></div>
            </div>
          </section>
          <OrgAdminControls.Danger orgId={org.id} name={org.name} />
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 14px", borderTop: "1px solid var(--border)", whiteSpace: "nowrap" };

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}
