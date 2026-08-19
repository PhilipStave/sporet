import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Altiv · Administrasjon",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Platform-owner area (Stave Software). Only profiles.is_superadmin get in. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireSuperadmin();
  if (!me) redirect("/app/oversikt");

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)" }}>
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "12px var(--sp)",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <Link href="/admin" style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--primary)" }} />
            Altiv-administrasjon
          </Link>
          <span className="pill" style={{ background: "var(--tint-danger)", color: "var(--danger)" }}>
            Kun for Stave Software
          </span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--muted)" }}>{me.email}</span>
          <Link href="/app/oversikt" className="btn" style={{ padding: "6px 12px", fontSize: 13 }}>
            Til appen
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, width: "100%", maxWidth: 1320, margin: "0 auto", padding: "var(--sp)" }}>{children}</main>
    </div>
  );
}
