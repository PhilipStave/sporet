"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";

export function NewCustomerDialog({
  open,
  onClose,
  defaultDeptId,
}: {
  open: boolean;
  onClose: () => void;
  defaultDeptId?: string | null;
}) {
  if (!open) return null;
  // Remount on each open so the form starts fresh (no state-syncing effect).
  return <DialogInner onClose={onClose} defaultDeptId={defaultDeptId} />;
}

function DialogInner({
  onClose,
  defaultDeptId,
}: {
  onClose: () => void;
  defaultDeptId?: string | null;
}) {
  const { departments, createDeal, setSelectedDealId } = useStore();
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [deptId, setDeptId] = useState<string>(
    defaultDeptId || departments[0]?.id || ""
  );
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the first field once mounted (DOM side-effect, no state).
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    const name = company.trim();
    if (!name || busy) return;
    setBusy(true);
    const id = await createDeal({
      company: name,
      contact: contact.trim(),
      department_id: deptId || null,
    });
    setBusy(false);
    if (id) {
      onClose();
      setSelectedDealId(id);
    }
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
          <h3 style={{ fontSize: 20 }}>Ny kunde</h3>
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
          Skriv inn bedriften. Resten fyller du inn i kundepanelet etterpå.
        </p>

        <label className="field-label">
          Bedriftsnavn
          <input
            ref={inputRef}
            className="field-input"
            value={company}
            placeholder="f.eks. Nordic Steel AS"
            onChange={(e) => setCompany(e.target.value)}
            style={{ marginTop: 5 }}
          />
        </label>

        <label className="field-label" style={{ display: "block", marginTop: 12 }}>
          Kontaktperson (valgfritt)
          <input
            className="field-input"
            value={contact}
            placeholder="Navn"
            onChange={(e) => setContact(e.target.value)}
            style={{ marginTop: 5 }}
          />
        </label>

        {departments.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <span className="field-label">Avdeling</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="chip"
                  data-active={deptId === d.id}
                  onClick={() => setDeptId(d.id)}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" className="btn" onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={!company.trim() || busy}
          >
            {busy ? "Oppretter …" : "Opprett kunde"}
          </button>
        </div>
      </div>
    </>
  );
}
