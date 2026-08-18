"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { setupCompany, type AuthState } from "../actions";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { TermsCheckbox } from "@/components/TermsCheckbox";
import { FEATURE_ORDER, FEATURE_LABELS, type FeatureKey } from "@/lib/constants";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(17,20,32,.14)",
  padding: 30,
};

export default function SetupPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    setupCompany,
    {}
  );

  const [company, setCompany] = useState("");
  const [depts, setDepts] = useState<string[]>(["", ""]);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    kalender: true,
    statistikk: true,
    selgere: true,
    kunder: true,
    aktivitet: true,
  });
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [adminDepts, setAdminDepts] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);

  const cleanDepts = useMemo(
    () => depts.map((d) => d.trim()).filter(Boolean),
    [depts]
  );

  const pwHint =
    password && password.length < 4
      ? "Passordet må ha minst 4 tegn."
      : password && password2 && password !== password2
      ? "Passordene er ikke like."
      : "";

  const pwValid = password.length >= 4 && password === password2;
  const canSubmit =
    !!company.trim() && cleanDepts.length >= 1 && pwValid && accepted;

  const toggleFeature = (k: FeatureKey) =>
    setFeatures((f) => ({ ...f, [k]: !f[k] }));

  const toggleAdminDept = (name: string) =>
    setAdminDepts((a) =>
      a.includes(name) ? a.filter((x) => x !== name) : [...a, name]
    );

  return (
    <div style={cardStyle} className="animate-fade">
      <div style={{ marginBottom: 18 }}>
        <Logo />
      </div>
      <h3 style={{ fontSize: 22, marginBottom: 4 }}>Sett opp bedriften</h3>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--muted)" }}>
        Du er administrator. Velg navn, avdelinger og hvilke funksjoner teamet
        skal ha. Alt kan endres senere.
      </p>

      <form action={formAction}>
        {/* Company name */}
        <label className="field-label">
          Bedriftsnavn
          <input
            name="company"
            className="field-input"
            placeholder="Bedriftsnavn"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ marginTop: 5 }}
          />
        </label>

        {/* Departments */}
        <div style={{ marginTop: 16 }}>
          <span className="field-label">Avdelinger</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {depts.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input
                  name="depts"
                  className="field-input"
                  placeholder="Avdelingsnavn"
                  value={d}
                  onChange={(e) =>
                    setDepts((arr) =>
                      arr.map((x, ix) => (ix === i ? e.target.value : x))
                    )
                  }
                />
                <button
                  type="button"
                  aria-label="Fjern avdeling"
                  onClick={() =>
                    setDepts((arr) => arr.filter((_, ix) => ix !== i))
                  }
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--surface)",
                    color: "var(--muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="chip"
            style={{ marginTop: 8 }}
            onClick={() => setDepts((arr) => [...arr, ""])}
          >
            <Icon name="plus" size={14} /> Legg til avdeling
          </button>
        </div>

        {/* Features */}
        <div style={{ marginTop: 18 }}>
          <span className="field-label">Funksjoner</span>
          <p style={{ margin: "-2px 0 8px", fontSize: 13, color: "var(--muted)" }}>
            Oversikt og Pipeline er alltid med. Velg hva mer teamet skal se.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FEATURE_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                className="chip"
                data-active={features[k]}
                onClick={() => toggleFeature(k)}
              >
                {features[k] && <Icon name="check" size={13} />}
                {FEATURE_LABELS[k]}
              </button>
            ))}
          </div>
          {FEATURE_ORDER.filter((k) => features[k]).map((k) => (
            <input key={k} type="hidden" name="features" value={k} />
          ))}
        </div>

        {/* Password */}
        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <label className="field-label" style={{ flex: 1 }}>
            Passord
            <input
              name="password"
              type="password"
              className="field-input"
              placeholder="Velg passord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          <label className="field-label" style={{ flex: 1 }}>
            Gjenta passord
            <input
              type="password"
              className="field-input"
              placeholder="Gjenta passord"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
        </div>
        <span
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--danger)",
            minHeight: 16,
            marginTop: 5,
          }}
        >
          {pwHint}
        </span>

        {/* Admin user */}
        <div style={{ marginTop: 12 }}>
          <span className="field-label">Din bruker (administrator)</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              name="adminName"
              className="field-input"
              placeholder="Fullt navn"
            />
            <input
              name="adminEmail"
              type="email"
              className="field-input"
              placeholder="E-postadresse"
            />
            <input
              name="adminPhone"
              type="tel"
              className="field-input"
              placeholder="Telefonnummer"
            />
          </div>
          {cleanDepts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
              }}
            >
              {cleanDepts.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="chip"
                  data-active={adminDepts.includes(name)}
                  onClick={() => toggleAdminDept(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {adminDepts.map((name) => (
            <input key={name} type="hidden" name="adminDepts" value={name} />
          ))}
        </div>

        <TermsCheckbox checked={accepted} onChange={setAccepted} />

        {state.error && (
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 13,
              color: "var(--danger)",
            }}
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit || pending}
          style={{ width: "100%", marginTop: 20, padding: "12px 14px" }}
        >
          {pending ? "Setter opp …" : "Fullfør oppsett"}
        </button>
      </form>

      <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--muted)" }}>
        Har bedriften allerede en konto?{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>
          Logg inn
        </Link>
      </p>
    </div>
  );
}
