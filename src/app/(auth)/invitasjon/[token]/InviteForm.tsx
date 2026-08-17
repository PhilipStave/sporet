"use client";

import { useActionState, useState } from "react";
import { acceptInvite, type AuthState } from "../../actions";

export function InviteForm({
  token,
  email,
  departments,
}: {
  token: string;
  email: string;
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    acceptInvite,
    {}
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [deptIds, setDeptIds] = useState<string[]>([]);

  const canSubmit = !!name.trim() && password.length >= 4;

  const toggle = (id: string) =>
    setDeptIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />

      <label className="field-label">
        E-postadresse
        <input
          className="field-input"
          value={email}
          disabled
          style={{ marginTop: 5, background: "var(--bg)", color: "var(--muted)" }}
        />
      </label>

      <label className="field-label" style={{ marginTop: 12, display: "block" }}>
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
        Telefonnummer
        <input
          name="phone"
          type="tel"
          className="field-input"
          placeholder="Telefonnummer"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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

      {departments.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <span className="field-label">Avdelinger</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {departments.map((d) => (
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
  );
}
