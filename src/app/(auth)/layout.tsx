import type { Metadata } from "next";

// Innlogging, registrering og oppsett er ikke søkeresultater. Rotlayouten
// setter index/follow for hele nettstedet, og uten dette arvet hver side i
// denne gruppen den. Å sette det her dekker også glemt-passord, nytt-passord,
// invitasjon og bekreftet, som ellers ville blitt glemt hver for seg.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "min(560px, 100%)" }}>{children}</div>
    </div>
  );
}
