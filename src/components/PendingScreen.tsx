import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export function PendingScreen({ fullName }: { fullName: string }) {
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
      <div
        style={{
          width: "min(480px, 100%)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(17,20,32,.14)",
          padding: 30,
          textAlign: "center",
        }}
        className="animate-fade"
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo />
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            background: "var(--primary-050)",
            color: "var(--primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Icon name="clock" size={24} />
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 8 }}>Venter på godkjenning</h3>
        <p style={{ margin: "0 0 4px", fontSize: 15 }}>
          Hei {fullName || "der"}! Kontoen din er opprettet.
        </p>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--muted)" }}>
          En administrator må godkjenne deg før du får tilgang. Prøv igjen om litt
          — du får tilgang så snart du er godkjent.
        </p>
        <form action={logout}>
          <button type="submit" className="btn" style={{ width: "100%" }}>
            <Icon name="logout" size={15} /> Logg ut
          </button>
        </form>
      </div>
    </div>
  );
}
