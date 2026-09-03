import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

// Where the confirmation link lands.
//
// Supabase verifies the token on its own endpoint and then redirects here, so
// by the time this page renders the address is already confirmed. It exists to
// say so plainly and point at the next step — an unexplained redirect back to a
// login screen reads like the link failed.

export const metadata: Metadata = {
  title: "E-postadressen er bekreftet",
  robots: { index: false, follow: false },
};

export default function BekreftetPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg)",
      }}
    >
      <div
        className="card"
        style={{ padding: 34, maxWidth: 430, width: "100%", textAlign: "center" }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Logo />
        </div>

        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            background: "var(--tint-success)",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
            margin: "0 auto 16px",
          }}
          aria-hidden
        >
          ✓
        </div>

        <h1 style={{ fontSize: 23, margin: "0 0 8px" }}>E-postadressen er bekreftet</h1>
        <p style={{ fontSize: 14.5, color: "var(--muted)", margin: "0 0 22px", lineHeight: 1.6 }}>
          Kontoen er klar. Logg inn med e-posten og passordet du valgte.
        </p>

        <Link
          href="/login"
          className="btn btn-primary"
          style={{ padding: "12px 26px", fontSize: 15, textDecoration: "none" }}
        >
          Logg inn
        </Link>

        <p style={{ fontSize: 13, color: "var(--muted)", margin: "20px 0 0", lineHeight: 1.6 }}>
          Meldte du deg inn i en bedrift som allerede bruker Altiv, må en
          administrator slippe deg inn før du ser noe. De får beskjed.
        </p>
      </div>
    </main>
  );
}
