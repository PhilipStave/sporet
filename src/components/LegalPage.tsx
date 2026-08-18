import Link from "next/link";
import type { LegalSection } from "@/lib/legal";
import { LEGAL_VERSION } from "@/lib/legal";

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div
      className="landing"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-karla)",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg)",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-display)",
              fontSize: 24,
              color: "var(--text)",
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 999, background: "var(--accent)" }} />
            Altiv
          </Link>
          <nav style={{ display: "flex", gap: 18, marginLeft: "auto", fontSize: 15, fontWeight: 600 }}>
            <Link href="/vilkar" style={{ color: "var(--text)" }}>Vilkår</Link>
            <Link href="/personvern" style={{ color: "var(--text)" }}>Personvern</Link>
            <Link href="/login" style={{ color: "var(--text)" }}>Logg inn</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(34px, 5vw, 52px)",
            lineHeight: 1.05,
            marginBottom: 10,
          }}
        >
          {title}
        </h1>
        <p style={{ margin: "0 0 8px", fontSize: 17, color: "var(--muted)" }}>{intro}</p>
        <p style={{ margin: "0 0 36px", fontSize: 13, color: "var(--muted)" }}>
          Versjon {LEGAL_VERSION}
        </p>

        {sections.map((s) => (
          <section key={s.title} style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 24,
                marginBottom: 8,
              }}
            >
              {s.title}
            </h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} style={{ margin: "0 0 10px", fontSize: 16, lineHeight: 1.6 }}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>

      <footer style={{ borderTop: "1px solid var(--divider)" }}>
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "22px 24px",
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          <Link href="/" style={{ color: "var(--muted)" }}>Forside</Link>
          <Link href="/vilkar" style={{ color: "var(--muted)" }}>Vilkår</Link>
          <Link href="/personvern" style={{ color: "var(--muted)" }}>Personvern</Link>
        </div>
      </footer>
    </div>
  );
}
