"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";
import { Logo } from "@/components/Logo";
import { SjekkEpostLenke } from "@/components/SjekkEpost";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,20,32,.14)",
  padding: 30,
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
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
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>Logg inn</h3>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
        Fyll inn e-post og passord for å komme til teamets arbeidsområde.
      </p>

      <form action={formAction}>
        <label className="field-label">
          E-postadresse
          <input
            name="email"
            type="email"
            className="field-input"
            placeholder="E-postadresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginTop: 5 }}
          />
        </label>
        <label className="field-label" style={{ marginTop: 12, display: "block" }}>
          Passord
          <input
            name="password"
            type="password"
            className="field-input"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginTop: 5 }}
          />
        </label>

        <div style={{ textAlign: "right", marginTop: 8 }}>
          <Link
            href="/glemt-passord"
            style={{ fontSize: 13, color: "var(--primary)", fontWeight: 500 }}
          >
            Glemt passord?
          </Link>
        </div>

        {state.error && (
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--danger)" }}>
            {state.error}
          </p>
        )}
        {/* Registrerte seg for noen dager siden og har glemt at e-posten
            finnes. Uten denne veien ut er kontoen laast for godt. */}
        {state.sjekkEpost && <SjekkEpostLenke epost={state.sjekkEpost} />}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit || pending}
          style={{ width: "100%", marginTop: 14, padding: "12px 14px" }}
        >
          {pending ? "Logger inn …" : "Logg inn"}
        </button>
      </form>

      <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)" }}>
        Ny ansatt med en bedriftskode?{" "}
        <Link href="/bli-med" style={{ color: "var(--primary)", fontWeight: 500 }}>
          Bli med i bedriften
        </Link>
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
        Ny bedrift?{" "}
        <Link href="/setup" style={{ color: "var(--primary)", fontWeight: 500 }}>
          Sett opp bedriften
        </Link>
      </p>
    </div>
  );
}
