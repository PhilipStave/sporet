"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import type { Lead, LeadDetail } from "@/lib/brreg";

// Lead search, opened from the pipeline. Every company shown comes from
// Enhetsregisteret; nothing here is generated.

type Svar = {
  leads: Lead[];
  total: number;
  forklaring: string | null;
  kilde: "lokal" | "ai";
  melding: string | null;
};

const EKSEMPLER = [
  "feiemaskiner til kommuner",
  "gravemaskiner til entreprenører",
  "betongelementer til boligbygg",
  "regnskapstjenester i Oslo",
];

/** Everything the register knows, laid out for the customer's note field. */
function tilNotat(d: LeadDetail) {
  const linjer = [
    `Org.nr. ${d.orgnr}`,
    d.naering && `Bransje: ${d.naering} (${d.naeringskode})`,
    d.ansatte != null && `Ansatte: ${d.ansatte}`,
    [d.adresse, [d.postnummer, d.poststed].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", "),
    d.kommune && `Kommune: ${d.kommune}`,
    d.stiftet && `Stiftet: ${d.stiftet}`,
    d.mva && "Registrert i MVA-registeret",
    d.konsern && "Del av konsern",
    (d.aktivitet || d.formaal) && `\nFormål: ${(d.aktivitet || d.formaal).slice(0, 400)}`,
    `\nHentet fra Enhetsregisteret. E-post og telefon finnes ikke der — fyll inn selv.`,
  ];
  return linjer.filter(Boolean).join("\n");
}

export function FinnKunderDialog({ onClose }: { onClose: () => void }) {
  const { createDeal, canWrite } = useStore();
  const [tekst, setTekst] = useState("");
  const [laster, setLaster] = useState(false);
  const [svar, setSvar] = useState<Svar | null>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [lagtInn, setLagtInn] = useState<Set<string>>(new Set());
  const [jobber, setJobber] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const sok = async (q?: string) => {
    const spørring = (q ?? tekst).trim();
    if (spørring.length < 3) return;
    if (q) setTekst(q);
    setLaster(true);
    setFeil(null);
    setSvar(null);
    try {
      const res = await fetch("/api/kundesok", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tekst: spørring }),
      });
      const json = await res.json();
      if (!res.ok) setFeil(json?.error ?? "Søket feilet");
      else setSvar(json as Svar);
    } catch {
      setFeil("Fikk ikke kontakt med søket. Prøv igjen.");
    } finally {
      setLaster(false);
    }
  };

  /** One click = one customer in the pipeline, with the full record attached. */
  const leggTil = async (lead: Lead) => {
    if (!canWrite || lagtInn.has(lead.orgnr)) return;
    setJobber(lead.orgnr);
    let detalj: LeadDetail | null = null;
    try {
      const res = await fetch("/api/kundesok/detalj", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgnr: [lead.orgnr] }),
      });
      if (res.ok) detalj = (await res.json())?.detaljer?.[0] ?? null;
    } catch {
      // Fall back to what the search already gave us.
    }

    const id = await createDeal({
      company: lead.navn,
      product: lead.naering,
      notes: detalj
        ? tilNotat(detalj)
        : `Org.nr. ${lead.orgnr}\n${lead.naering}\n${lead.poststed}`,
      tags: ["Fra kundesøk"],
    });
    setJobber(null);
    if (id) setLagtInn((s) => new Set(s).add(lead.orgnr));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 16px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: 760, padding: 0, overflow: "hidden" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <h3 style={{ fontSize: 19, margin: 0 }}>Finn kunder</h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "var(--tint-neutral)",
                  color: "var(--muted)",
                }}
              >
                Under utvikling
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
              Ekte bedrifter fra Enhetsregisteret. Trykk + for å legge dem i pipelinen.
            </span>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            aria-label="Lukk"
            style={{ padding: "6px 10px" }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <input
              autoFocus
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sok()}
              placeholder="Hva selger du? F.eks. «bucher feiemaskin» eller «gravemaskiner»"
              style={{
                flex: "1 1 280px",
                minWidth: 0,
                padding: "10px 13px",
                fontSize: 14.5,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => sok()}
              disabled={laster || tekst.trim().length < 3}
              style={{ padding: "10px 20px" }}
            >
              {laster ? "Søker …" : "Søk"}
            </button>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 7, flexWrap: "wrap" }}>
            {EKSEMPLER.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => sok(e)}
                disabled={laster}
                style={{
                  fontSize: 11.5,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "56vh", overflowY: "auto", padding: "14px 20px 20px" }}>
          {feil && <p style={{ fontSize: 14, color: "var(--danger)" }}>{feil}</p>}

          {!svar && !feil && !laster && (
            <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>
              Beskriv hva du selger, så finner vi bedriftene som kjøper det.
            </p>
          )}

          {svar && (
            <>
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 12px" }}>
                {svar.forklaring ? (
                  <>
                    Søkte etter <strong style={{ color: "var(--text)" }}>{svar.forklaring}</strong>
                    {svar.total > svar.leads.length && (
                      <> — viser {svar.leads.length} av {svar.total}</>
                    )}
                  </>
                ) : (
                  svar.melding
                )}
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {svar.leads.map((l) => {
                  const inne = lagtInn.has(l.orgnr);
                  return (
                    <div
                      key={l.orgnr}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        padding: "11px 13px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: inne ? "var(--primary-050)" : "var(--surface)",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{l.navn}</div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 1 }}>
                          {l.naering}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "2px 10px",
                            fontSize: 11.5,
                            color: "var(--muted)",
                            marginTop: 4,
                          }}
                        >
                          <span>Org.nr. {l.orgnr}</span>
                          {l.ansatte != null && <span>{l.ansatte} ansatte</span>}
                          {l.poststed && <span>{l.poststed}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => leggTil(l)}
                        disabled={inne || jobber === l.orgnr || !canWrite}
                        title={
                          inne
                            ? "Allerede lagt til"
                            : canWrite
                              ? "Legg til i pipelinen"
                              : "Abonnementet må være aktivt"
                        }
                        className={inne ? "btn" : "btn btn-primary"}
                        style={{ flexShrink: 0, padding: "8px 12px" }}
                      >
                        {inne ? (
                          <Icon name="check" size={15} />
                        ) : jobber === l.orgnr ? (
                          "…"
                        ) : (
                          <Icon name="plus" size={16} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {svar.leads.length > 0 && (
                <p style={{ marginTop: 14, fontSize: 11.5, color: "var(--muted)" }}>
                  Navn, org.nr., adresse, bransje og ansatte hentes fra registeret. E-post og
                  telefon står ikke der, så de må fylles inn manuelt.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
