"use client";

import { useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import type { Lead } from "@/lib/brreg";

// Not launched. Reachable only for orgs with the "finnkunder" flag switched on.

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
  "betongelementer til boligprosjekter i Bergen",
  "regnskapstjenester til småbedrifter i Oslo",
];

export default function FinnKunderPage() {
  const { createDeal, canWrite } = useStore();
  const [tekst, setTekst] = useState("");
  const [laster, setLaster] = useState(false);
  const [svar, setSvar] = useState<Svar | null>(null);
  const [feil, setFeil] = useState<string | null>(null);
  const [valgte, setValgte] = useState<Set<string>>(new Set());
  const [importerer, setImporterer] = useState(false);
  const [importert, setImportert] = useState<number | null>(null);

  const sok = async (q?: string) => {
    const spørring = (q ?? tekst).trim();
    if (spørring.length < 3) return;
    if (q) setTekst(q);
    setLaster(true);
    setFeil(null);
    setSvar(null);
    setValgte(new Set());
    setImportert(null);
    try {
      const res = await fetch("/api/kundesok", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tekst: spørring }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeil(json?.error ?? "Søket feilet");
      } else {
        setSvar(json as Svar);
      }
    } catch {
      setFeil("Fikk ikke kontakt med søket. Prøv igjen.");
    } finally {
      setLaster(false);
    }
  };

  const toggle = (orgnr: string) =>
    setValgte((s) => {
      const n = new Set(s);
      if (n.has(orgnr)) n.delete(orgnr);
      else n.add(orgnr);
      return n;
    });

  const importer = async () => {
    if (!svar || valgte.size === 0) return;
    setImporterer(true);
    let antall = 0;
    for (const lead of svar.leads.filter((l) => valgte.has(l.orgnr))) {
      const id = await createDeal({
        company: lead.navn,
        notes:
          `Org.nr. ${lead.orgnr}` +
          (lead.naering ? ` · ${lead.naering}` : "") +
          (lead.ansatte != null ? ` · ${lead.ansatte} ansatte` : "") +
          (lead.adresse || lead.poststed
            ? `\n${[lead.adresse, lead.poststed].filter(Boolean).join(", ")}`
            : "") +
          `\n\nHentet fra Enhetsregisteret.`,
        tags: ["Fra kundesøk"],
      });
      if (id) antall++;
    }
    setImporterer(false);
    setImportert(antall);
    setValgte(new Set());
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontSize: 26 }}>Finn kunder</h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".05em",
              padding: "3px 8px",
              borderRadius: 999,
              background: "var(--tint-neutral)",
              color: "var(--muted)",
            }}
          >
            Under utvikling
          </span>
        </div>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Beskriv hva du selger, så finner vi bedrifter i Enhetsregisteret som kan passe.
        </span>
      </div>

      {/* Search box */}
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sok();
            }}
            placeholder="Hva selger du? F.eks. «feiemaskiner» eller «gravemaskiner»"
            style={{
              flex: "1 1 320px",
              minWidth: 0,
              padding: "11px 14px",
              fontSize: 15,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
          />
          <button
            type="button"
            className="btn primary"
            onClick={() => sok()}
            disabled={laster || tekst.trim().length < 3}
            style={{ padding: "11px 22px", fontSize: 15 }}
          >
            {laster ? "Søker …" : "Søk"}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Prøv:</span>
          {EKSEMPLER.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => sok(e)}
              disabled={laster}
              style={{
                fontSize: 12,
                padding: "5px 11px",
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

      {feil && (
        <div className="card" style={{ padding: 16, marginBottom: 18, color: "var(--danger)" }}>
          {feil}
        </div>
      )}

      {svar && (
        <>
          <div
            className="card"
            style={{
              padding: "13px 16px",
              marginBottom: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--muted)", minWidth: 0 }}>
              {svar.forklaring ? (
                <>
                  Søkte etter <strong style={{ color: "var(--text)" }}>{svar.forklaring}</strong>
                  {svar.total > svar.leads.length && (
                    <> — viser {svar.leads.length} av {svar.total} treff</>
                  )}
                </>
              ) : (
                svar.melding
              )}
            </div>
            <span
              title={
                svar.kilde === "ai"
                  ? "Tolket av språkmodell"
                  : "Tolket lokalt, uten AI — koster ingenting"
              }
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 999,
                background: "var(--tint-neutral)",
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              {svar.kilde === "ai" ? "AI-tolkning" : "Lokalt søk"}
            </span>
          </div>

          {svar.melding && svar.forklaring && (
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>{svar.melding}</p>
          )}

          {svar.leads.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  {valgte.size > 0 ? `${valgte.size} valgt` : "Huk av dem du vil følge opp"}
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {importert != null && (
                    <span style={{ fontSize: 13, color: "var(--success, var(--muted))" }}>
                      {importert} lagt til som kunder
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn primary"
                    onClick={importer}
                    disabled={valgte.size === 0 || importerer || !canWrite}
                    style={{ padding: "9px 18px", fontSize: 14 }}
                  >
                    {importerer ? "Legger til …" : `Legg til som kunder`}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {svar.leads.map((l) => {
                  const valgt = valgte.has(l.orgnr);
                  return (
                    <button
                      key={l.orgnr}
                      type="button"
                      onClick={() => toggle(l.orgnr)}
                      style={{
                        textAlign: "left",
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `1px solid ${valgt ? "var(--primary)" : "var(--border)"}`,
                        background: valgt ? "var(--primary-050)" : "var(--surface)",
                        boxShadow: "var(--shadow)",
                        cursor: "pointer",
                        transition: "border-color .15s ease, background .15s ease",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          flexShrink: 0,
                          width: 20,
                          height: 20,
                          marginTop: 2,
                          borderRadius: 6,
                          border: `1.5px solid ${valgt ? "var(--primary)" : "var(--border)"}`,
                          background: valgt ? "var(--primary)" : "transparent",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {valgt && <Icon name="check" size={13} />}
                      </span>

                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontWeight: 600, fontSize: 15 }}>
                          {l.navn}
                        </span>
                        <span style={{ display: "block", fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                          {l.naering}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px 12px",
                            fontSize: 12,
                            color: "var(--muted)",
                            marginTop: 6,
                          }}
                        >
                          <span>Org.nr. {l.orgnr}</span>
                          {l.ansatte != null && <span>{l.ansatte} ansatte</span>}
                          {l.poststed && <span>{l.poststed}</span>}
                          {l.mva && <span>MVA-registrert</span>}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
                Alle bedrifter kommer direkte fra Enhetsregisteret hos Brønnøysundregistrene.
                Ingen navn eller organisasjonsnumre er generert.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
