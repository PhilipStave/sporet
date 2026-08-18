"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,20,32,.14)",
  padding: 30,
};

export default function GlemtPassordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/nytt-passord`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={cardStyle} className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <Logo />
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>Glemt passord</h3>

      {sent ? (
        <>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--muted)" }}>
            Hvis <strong>{email}</strong> er registrert, har vi sendt en e-post med
            lenke for å velge nytt passord. Sjekk også søppelposten.
          </p>
          <Link href="/login" className="btn" style={{ width: "100%" }}>
            Tilbake til innlogging
          </Link>
        </>
      ) : (
        <>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
            Skriv inn e-posten din, så sender vi deg en lenke for å velge nytt passord.
          </p>
          <form onSubmit={submit}>
            <label className="field-label">
              E-postadresse
              <input
                type="email"
                className="field-input"
                placeholder="E-postadresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginTop: 5 }}
                autoFocus
              />
            </label>
            {error && (
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--danger)" }}>{error}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!email.trim() || busy}
              style={{ width: "100%", marginTop: 18, padding: "12px 14px" }}
            >
              {busy ? "Sender …" : "Send lenke"}
            </button>
          </form>
          <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)" }}>
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>
              ← Tilbake til innlogging
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
