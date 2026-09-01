"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import type { BudStatus } from "@/types";

// Most requests a small company answers never touch Doffin — they arrive by
// e-mail from a customer who already knows them. Without this the page would
// only ever be a log of what the search found, which is not the same thing as
// "the bids we have out".

export function RegistrerBudDialog({ onClose }: { onClose: () => void }) {
  const { leggTilBud } = useStore();
  const [tittel, setTittel] = useState("");
  const [kjoper, setKjoper] = useState("");
  const [frist, setFrist] = useState("");
  const [sum, setSum] = useState("");
  const [status, setStatus] = useState<BudStatus>("vurderer");
  const [busy, setBusy] = useState(false);
  const foerste = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => foerste.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    const t = tittel.trim();
    if (!t || busy) return;
    setBusy(true);
    const tall = Number(sum.replace(/[^\d]/g, ""));
    await leggTilBud({
      tittel: t,
      kjoper_navn: kjoper.trim(),
      frist: frist ? new Date(frist).toISOString() : null,
      tilbudssum: tall > 0 ? tall : null,
      status,
      levert_at:
        status === "levert" ? new Date().toISOString().slice(0, 10) : null,
      notat: "Ført inn for hånd.",
    });
    setBusy(false);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,20,32,.28)",
          zIndex: 70,
          animation: "fadeIn .15s ease",
        }}
      />
      <div
        role="dialog"
        aria-modal
        className="animate-fade"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(460px, calc(100% - 32px))",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(17,20,32,.28)",
          zIndex: 71,
          padding: 24,
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <h3 style={{ fontSize: 20 }}>Registrer bud</h3>
          <button
            type="button"
            aria-label="Lukk"
            onClick={onClose}
            className="btn"
            style={{ width: 34, height: 34, padding: 0, borderRadius: 999 }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)" }}>
          For forespørsler som ikke kom fra Doffin — en e-post fra en kunde, en
          henvendelse dere svarte på.
        </p>

        <label className="field-label">Hva gjelder det</label>
        <input
          ref={foerste}
          className="field-input"
          value={tittel}
          onChange={(e) => setTittel(e.target.value)}
          placeholder="F.eks. «Vintervedlikehold Storgata borettslag»"
          style={{ width: "100%", marginBottom: 12 }}
        />

        <label className="field-label">Hvem spør</label>
        <input
          className="field-input"
          value={kjoper}
          onChange={(e) => setKjoper(e.target.value)}
          placeholder="Bedrift eller oppdragsgiver"
          style={{ width: "100%", marginBottom: 12 }}
        />

        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 150px" }}>
            <label className="field-label">Frist</label>
            <input
              type="date"
              className="field-input"
              value={frist}
              onChange={(e) => setFrist(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label className="field-label">Vårt bud (kr)</label>
            <input
              className="field-input"
              inputMode="numeric"
              value={sum}
              onChange={(e) => setSum(e.target.value)}
              placeholder="Valgfritt"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <label className="field-label">Hvor står det</label>
        <div className="pillgroup" style={{ marginBottom: 18, display: "flex" }}>
          {(["vurderer", "levert"] as BudStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              data-active={status === s}
              onClick={() => setStatus(s)}
            >
              {s === "vurderer" ? "Jobber med det" : "Allerede levert"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={busy || !tittel.trim()}
          >
            {busy ? "Lagrer …" : "Legg til"}
          </button>
        </div>
      </div>
    </>
  );
}
