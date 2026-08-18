"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { joinAction, searchCompanies, type JoinState } from "../actions";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { TermsCheckbox } from "@/components/TermsCheckbox";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,20,32,.14)",
  padding: 30,
};

type Company = { id: string; name: string };

export function BliMedForm({ initial }: { initial: JoinState }) {
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    joinAction,
    initial
  );

  // Step 1 (search) — client only
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 (register) — controlled bits for validation
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [deptIds, setDeptIds] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const toggle = (id: string) =>
    setDeptIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const onSearch = (v: string) => {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setResults(await searchCompanies(v));
    }, 250);
  };

  // ---- Step 3: register ------------------------------------------
  if (state.stage === "register") {
    const canSubmit = !!name.trim() && password.length >= 4 && accepted;
    return (
      <div style={cardStyle} className="animate-fade">
        <div style={{ marginBottom: 18 }}>
          <Logo />
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 4 }}>
          Bli med i {state.orgName || "bedriften"}
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
          Lag din egen bruker med navn, e-post og passord.
        </p>

        <form action={formAction}>
          <input type="hidden" name="stage" value="register" />
          <input type="hidden" name="orgId" value={state.orgId} />
          <input type="hidden" name="code" value={state.code} />

          <label className="field-label">
            Fullt navn
            <input
              name="name"
              className="field-input"
              placeholder="Fullt navn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          <label className="field-label" style={{ marginTop: 12, display: "block" }}>
            E-postadresse
            <input
              name="email"
              type="email"
              className="field-input"
              placeholder="E-postadresse"
              style={{ marginTop: 5 }}
            />
          </label>
          <label className="field-label" style={{ marginTop: 12, display: "block" }}>
            Telefonnummer
            <input
              name="phone"
              type="tel"
              className="field-input"
              placeholder="Telefonnummer"
              style={{ marginTop: 5 }}
            />
          </label>
          <label className="field-label" style={{ marginTop: 12, display: "block" }}>
            Passord
            <input
              name="password"
              type="password"
              className="field-input"
              placeholder="Velg passord (minst 4 tegn)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>

          {state.departments && state.departments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span className="field-label">Avdelinger</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {state.departments.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="chip"
                    data-active={deptIds.includes(d.id)}
                    onClick={() => toggle(d.id)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              {deptIds.map((id) => (
                <input key={id} type="hidden" name="deptIds" value={id} />
              ))}
            </div>
          )}

          <TermsCheckbox checked={accepted} onChange={setAccepted} />

          {state.error && (
            <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--danger)" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || pending}
            style={{ width: "100%", marginTop: 18, padding: "12px 14px" }}
          >
            {pending ? "Oppretter konto …" : "Bli med"}
          </button>
        </form>
      </div>
    );
  }

  // ---- Step 2: enter code (company already chosen) ---------------
  if (selected) {
    return (
      <div style={cardStyle} className="animate-fade">
        <div style={{ marginBottom: 18 }}>
          <Logo />
        </div>
        <h3 style={{ fontSize: 22, marginBottom: 4 }}>{selected.name}</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
          Skriv inn bedriftskoden du har fått hos bedriften.
        </p>

        <form action={formAction}>
          <input type="hidden" name="stage" value="code" />
          <input type="hidden" name="orgId" value={selected.id} />
          <label className="field-label">
            Bedriftskode
            <input
              name="code"
              className="field-input"
              placeholder="f.eks. a3f9c2e1"
              autoFocus
              style={{ marginTop: 5, letterSpacing: "0.08em" }}
            />
          </label>

          {state.error && (
            <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--danger)" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", marginTop: 18, padding: "12px 14px" }}
          >
            {pending ? "Sjekker …" : "Fortsett"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setSelected(null)}
          style={{
            marginTop: 14,
            border: "none",
            background: "transparent",
            color: "var(--primary)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          ← Velg en annen bedrift
        </button>
      </div>
    );
  }

  // ---- Step 1: search for the company ----------------------------
  return (
    <div style={cardStyle} className="animate-fade">
      <div style={{ marginBottom: 18 }}>
        <Logo />
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>Bli med i en bedrift</h3>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
        Søk opp bedriften din for å komme i gang.
      </p>

      <label className="field-label">
        Søk etter bedrift
        <div style={{ position: "relative", marginTop: 5 }}>
          <span
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={15} />
          </span>
          <input
            className="field-input"
            value={query}
            placeholder="Bedriftsnavn …"
            onChange={(e) => onSearch(e.target.value)}
            autoFocus
            style={{ paddingLeft: 32 }}
          />
        </div>
      </label>

      {query.trim() && (
        <div
          style={{
            marginTop: 10,
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {results.length === 0 ? (
            <p style={{ padding: "12px 14px", margin: 0, fontSize: 14, color: "var(--muted)" }}>
              Ingen bedrifter funnet.
            </p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  background: "transparent",
                  padding: "12px 14px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {c.name}
                <Icon name="chevronr" size={15} style={{ color: "var(--muted)" }} />
              </button>
            ))
          )}
        </div>
      )}

      <p style={{ margin: "18px 0 0", fontSize: 13, color: "var(--muted)" }}>
        Har du allerede en konto?{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>
          Logg inn
        </Link>
      </p>
    </div>
  );
}
