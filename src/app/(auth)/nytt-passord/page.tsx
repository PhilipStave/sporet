"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NyttPassordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Supabase puts the recovery session in the URL hash; the client picks it up.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setReady(data.session ? "ok" : "invalid");
    };
    // Give the client a moment to process the URL hash on first render.
    const t = setTimeout(check, 400);
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady("ok");
    });
    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 4) return setError("Passordet må ha minst 4 tegn.");
    if (pw1 !== pw2) return setError("Passordene er ikke like.");
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.replace("/app/oversikt"), 1200);
  };

  return (
    <div style={cardStyle} className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <Logo />
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>Velg nytt passord</h3>

      {ready === "checking" && (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Sjekker lenken …</p>
      )}

      {ready === "invalid" && (
        <>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--muted)" }}>
            Lenken er ugyldig eller utløpt. Be om en ny.
          </p>
          <Link href="/glemt-passord" className="btn btn-primary" style={{ width: "100%" }}>
            Send ny lenke
          </Link>
        </>
      )}

      {ready === "ok" && !done && (
        <form onSubmit={submit}>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
            Skriv inn et nytt passord for kontoen din.
          </p>
          <label className="field-label">
            Nytt passord
            <input
              type="password"
              className="field-input"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              style={{ marginTop: 5 }}
              autoFocus
            />
          </label>
          <label className="field-label" style={{ display: "block", marginTop: 12 }}>
            Gjenta passord
            <input
              type="password"
              className="field-input"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          {error && (
            <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--danger)" }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || pw1.length < 4}
            style={{ width: "100%", marginTop: 18, padding: "12px 14px" }}
          >
            {busy ? "Lagrer …" : "Lagre nytt passord"}
          </button>
        </form>
      )}

      {done && (
        <p style={{ fontSize: 14, color: "#046c4e" }}>
          Passordet er endret. Sender deg inn …
        </p>
      )}
    </div>
  );
}
