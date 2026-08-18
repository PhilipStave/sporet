"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { TermsCheckbox } from "@/components/TermsCheckbox";
import { acceptCurrentTerms } from "@/app/app/actions";
import { LEGAL_VERSION } from "@/lib/legal";

/** Full-screen gate shown when the terms have changed since the user last accepted. */
export function ReacceptTerms({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await acceptCurrentTerms();
    if (res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.refresh();
  };

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
        className="animate-fade"
        style={{
          width: "min(560px, 100%)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(17,20,32,.14)",
          padding: 30,
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <Logo />
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 6 }}>Oppdaterte vilkår</h3>
        <p style={{ margin: "0 0 6px", fontSize: 14 }}>Hei {fullName || "der"}!</p>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--muted)" }}>
          Vi har oppdatert vilkårene for bruk og personvernerklæringen (versjon{" "}
          {LEGAL_VERSION}). Les gjennom og godta for å fortsette å bruke Altiv.
        </p>
        <TermsCheckbox checked={accepted} onChange={setAccepted} />
        {error && (
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--danger)" }}>{error}</p>
        )}
        <button
          className="btn btn-primary"
          disabled={!accepted || busy}
          onClick={submit}
          style={{ width: "100%", marginTop: 18, padding: "12px 14px" }}
        >
          {busy ? "Lagrer …" : "Godta og fortsett"}
        </button>
      </div>
    </div>
  );
}
