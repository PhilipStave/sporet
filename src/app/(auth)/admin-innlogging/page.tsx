"use client";

import { useActionState, useState } from "react";
import { adminLogin, type AuthState } from "../actions";
import { Logo } from "@/components/Logo";

// The platform owner's door, reached from the small footer link. Lives in the
// (auth) group rather than under /admin, because the /admin layout requires a
// superadmin session — a login page behind its own lock would be unreachable.

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,20,32,.14)",
  padding: 30,
};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    adminLogin,
    {}
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = !!email.trim() && !!password;

  return (
    <div style={cardStyle} className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <Logo />
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>Administrasjon</h3>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
        Kun for Stave Software. Skal du til teamets arbeidsområde, bruker du
        vanlig innlogging.
      </p>

      <form action={formAction}>
        <label className="field-label">
          E-postadresse
          <input
            name="email"
            type="email"
            className="field-input"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field-label" style={{ marginTop: 12 }}>
          Passord
          <input
            name="password"
            type="password"
            className="field-input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {state.error && (
          <p style={{ color: "var(--danger)", fontSize: 14, margin: "12px 0 0" }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit || pending}
          style={{ width: "100%", marginTop: 18, padding: "12px 0", fontSize: 16 }}
        >
          {pending ? "Logger inn …" : "Logg inn"}
        </button>
      </form>
    </div>
  );
}
