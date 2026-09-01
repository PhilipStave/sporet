"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { fmtKr } from "@/lib/format";
import { REGIONER, type Anbud } from "@/lib/doffin";

// Open public tenders, from Doffin. The lead search answers "who could buy
// what I sell"; this answers "who is buying it right now, with a deadline".
// Free to use — Doffin is a public register, so nothing here spends AI quota.

type Sortering = "frist" | "verdi";

/** How long a standing scheme stays open, in words a seller can act on. */
function aapenI(dager: number) {
  if (dager >= 400) return `${(dager / 365).toFixed(1).replace(".", ",")} år`;
  if (dager >= 60) return `${Math.round(dager / 30)} md.`;
  return `${dager} dager`;
}

export default function AnbudPage() {
  const { deals, createDeal, updateDeal, canWrite } = useStore();
  const [tekst, setTekst] = useState("");
  const [anbud, setAnbud] = useState<Anbud[]>([]);
  const [laster, setLaster] = useState(false);
  const [sokt, setSokt] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [sortering, setSortering] = useState<Sortering>("frist");
  /** Empty means the whole country. Narrowing happens at Doffin, not here. */
  const [region, setRegion] = useState("");
  const [bareMedVerdi, setBareMedVerdi] = useState(false);
  /** All, one-off competitions, or standing schemes you qualify into. */
  const [type, setType] = useState<"alle" | "frist" | "lopende">("alle");
  const [lagtInn, setLagtInn] = useState<Set<string>>(new Set());
  /** Stamped when results arrive, so the countdown is stable while reading. */
  const [naa, setNaa] = useState(() => Date.now());

  /** Buyers already in the pipeline, so nobody is added twice. */
  const finnesFra = useMemo(() => {
    const s = new Set<string>();
    deals.forEach((d) => {
      if (d.org_nr) s.add(d.org_nr);
      if (d.company) s.add(d.company.trim().toLowerCase());
    });
    return s;
  }, [deals]);

  const erKunde = (a: Anbud) =>
    (a.kjoperOrgnr && finnesFra.has(a.kjoperOrgnr)) ||
    finnesFra.has(a.kjoperNavn.trim().toLowerCase());

  const sok = async (q?: string) => {
    const spørring = (q ?? tekst).trim();
    if (spørring.length < 3) return;
    if (q) setTekst(q);
    setLaster(true);
    setFeil(null);
    try {
      const res = await fetch("/api/kundesok/anbud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tekst: spørring, region: region || undefined }),
      });
      const json = await res.json();
      if (!res.ok) setFeil(json?.error ?? "Søket feilet");
      else {
        setNaa(Date.now());
        setAnbud(json?.anbud ?? []);
      }
    } catch {
      setFeil("Fikk ikke kontakt med Doffin. Prøv igjen.");
    } finally {
      setSokt(true);
      setLaster(false);
    }
  };

  const synlige = useMemo(() => {
    let liste = type === "alle" ? [...anbud] : anbud.filter((a) => a.lopende === (type === "lopende"));
    if (bareMedVerdi) liste = liste.filter((a) => a.verdi != null);
    liste.sort((a, b) => {
      if (sortering === "verdi") return (b.verdi ?? -1) - (a.verdi ?? -1);
      // Soonest deadline first; notices without one (open schemes) go last.
      return (a.frist ?? "9999").localeCompare(b.frist ?? "9999");
    });
    return liste;
  }, [anbud, sortering, bareMedVerdi, type]);

  /**
   * Put the buyer in the pipeline, and note which competition brought them
   * there — without that line the seller opens the card next week and has no
   * idea why the municipality is on the list.
   */
  const leggTil = async (a: Anbud) => {
    if (!canWrite || !a.kjoperOrgnr || lagtInn.has(a.kjoperOrgnr)) return;
    setLagtInn((s) => new Set(s).add(a.kjoperOrgnr!));
    const id = await createDeal({
      company: a.kjoperNavn,
      org_nr: a.kjoperOrgnr,
      value: a.lopende ? 0 : a.verdi ?? 0,
      next_step_text: (a.lopende ? `Søk opptak: ${a.tittel}` : `Anbudsfrist: ${a.tittel}`).slice(0, 200),
      next_step_date: a.frist ? a.frist.slice(0, 10) : null,
      tags: a.lopende ? ["Anbud", "Løpende ordning"] : ["Anbud"],
    });
    if (!id) return;

    // Contact details come from the same lookup the lead search uses.
    try {
      const res = await fetch("/api/kundesok/detalj", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgnr: [a.kjoperOrgnr] }),
      });
      if (!res.ok) return;
      const d = (await res.json())?.detaljer?.[0];
      if (d)
        await updateDeal(id, {
          email: d.kontakt?.epost ?? "",
          phone: d.kontakt?.telefon ?? "",
          nettside: d.kontakt?.domene ?? null,
          adresse: d.adresse || null,
          postnummer: d.postnummer || null,
          poststed: d.poststed || null,
          kommune: d.kommune || null,
          naeringskode: d.naeringskode || null,
          naering: d.naering || null,
          ansatte: d.ansatte ?? null,
        });
    } catch {
      // The buyer is in the pipeline; they just lack contact details.
    }
  };

  return (
    <div className="animate-fade">
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Anbud</h2>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 18px", maxWidth: "72ch" }}>
        Offentlige konkurranser som er åpne akkurat nå, hentet fra Doffin. Skriv
        med dine egne ord hva du leverer — «måke snø» finner det kommunen kaller
        «snøbrøyting». Se særlig etter <strong>løpende opptak</strong>: der søker
        du én gang og blir invitert til småoppdragene i årevis etterpå. Søket er
        gratis og bruker ikke av AI-kvoten.
      </p>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <input
            autoFocus
            className="field-input"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sok()}
            placeholder="Hva leverer du? F.eks. «catering», «vikartjenester», «asfaltering»"
            style={{ flex: "1 1 280px", minWidth: 0 }}
          />
          <select
            className="field-input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            title="Rammeavtaler uten geografi vises uansett landsdel"
            style={{ flex: "0 1 190px" }}
          >
            <option value="">Hele landet</option>
            {REGIONER.map((r) => (
              <option key={r.id} value={r.id}>
                {r.navn}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => sok()}
            disabled={laster || tekst.trim().length < 3}
            style={{ padding: "10px 22px" }}
          >
            {laster ? "Søker …" : "Søk"}
          </button>
        </div>

        {anbud.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Sorter:</span>
            <div className="pillgroup">
              <button data-active={sortering === "frist"} onClick={() => setSortering("frist")}>
                Frist
              </button>
              <button data-active={sortering === "verdi"} onClick={() => setSortering("verdi")}>
                Verdi
              </button>
            </div>
            <div className="pillgroup">
              <button data-active={type === "alle"} onClick={() => setType("alle")}>
                Alle
              </button>
              <button
                data-active={type === "frist"}
                onClick={() => setType("frist")}
                title="Enkeltkonkurranser med en frist du må rekke"
              >
                Med frist
              </button>
              <button
                data-active={type === "lopende"}
                onClick={() => setType("lopende")}
                title="Ordninger du søker opptak i én gang, og så får oppdrag fra i årevis"
              >
                Løpende opptak
              </button>
            </div>
            <label
              style={{
                fontSize: 12.5,
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={bareMedVerdi}
                onChange={(e) => setBareMedVerdi(e.target.checked)}
              />
              Bare med oppgitt verdi
            </label>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)" }}>
              {synlige.length} av {anbud.length} vises
            </span>
          </div>
        )}
      </div>

      {feil && <p style={{ fontSize: 14, color: "var(--danger)" }}>{feil}</p>}

      {!sokt && !laster && !feil && (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Søk for å se hvilke offentlige oppdragsgivere som er ute etter det du
          leverer.
        </p>
      )}

      {sokt && !laster && !feil && anbud.length === 0 && (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 14, margin: 0 }}>Ingen åpne konkurranser på dette nå.</p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0", maxWidth: "68ch" }}>
            Vi har også prøvd fagordene en kunngjøring ville brukt, ikke bare dine
            egne. Utgåtte og allerede tildelte kontrakter er luket bort, og vi
            viser ingenting vi ikke kan stå for. Husk at det offentlige bare
            kunngjør kjøp over terskelverdiene — mindre oppdrag går direkte, uten
            konkurranse.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {synlige.map((a) => {
          const dager = a.frist
            ? Math.ceil((new Date(a.frist).getTime() - naa) / 86_400_000)
            : null;
          const alt = erKunde(a);
          return (
            <div key={a.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <a
                    href={a.lenke}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--primary)",
                      textDecoration: "none",
                    }}
                  >
                    {a.tittel}
                  </a>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      marginTop: 3,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <Icon name="building" size={13} />
                    {a.kjoperNavn}
                    {a.verdi != null && (
                      <span
                        title={
                          a.lopende
                            ? "Taket for hele ordningen i hele perioden — hvert enkelt oppdrag er som regel en brøkdel"
                            : "Oppdragsgivers eget anslag"
                        }
                      >
                        · {a.lopende ? "ramme totalt" : "est."} {fmtKr(a.verdi)}
                      </span>
                    )}
                    {a.verdi == null && a.overTerskel && (
                      <span title="Kunngjort i EU-basen TED, som skjer først over EØS-terskelen">
                        · verdi ikke oppgitt (over EØS-terskel)
                      </span>
                    )}
                    {alt && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "var(--primary-050)",
                          color: "var(--primary)",
                        }}
                      >
                        Kunde
                      </span>
                    )}
                  </div>
                  {a.beskrivelse && (
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0" }}>
                      {a.beskrivelse}
                    </p>
                  )}
                  {a.lopende && (
                    <p
                      style={{
                        fontSize: 12.5,
                        margin: "10px 0 0",
                        padding: "8px 11px",
                        borderRadius: 8,
                        background: "var(--primary-050)",
                        color: "var(--primary)",
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Du søker opptak én gang</strong> — så blir du invitert
                      til de små konkurransene etter hvert som de kommer, i årevis.
                      Det er her mindre leverandører kommer inn: selve oppdragene
                      ligger gjerne på noen hundre tusen, selv når rammen over er
                      stor.
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flex: "none",
                  }}
                >
                  {a.lopende ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        background: "var(--primary-050)",
                        color: "var(--primary)",
                      }}
                    >
                      Løpende opptak
                      {dager != null && dager > 0 && ` · åpen ${aapenI(dager)}`}
                    </span>
                  ) : dager != null ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        background: dager <= 7 ? "var(--tint-warn)" : "var(--tint-success)",
                        color: dager <= 7 ? "var(--tint-warn-text)" : "#059669",
                      }}
                    >
                      {dager <= 0 ? "Frist i dag" : dager === 1 ? "1 dag igjen" : `${dager} dager igjen`}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Uten oppgitt frist</span>
                  )}
                  {a.kjoperOrgnr && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => leggTil(a)}
                      disabled={!canWrite || lagtInn.has(a.kjoperOrgnr) || alt}
                      title={
                        alt
                          ? "Oppdragsgiveren ligger allerede i pipelinen"
                          : `Legg ${a.kjoperNavn} i pipelinen`
                      }
                      style={{ padding: "6px 14px", fontSize: 13, whiteSpace: "nowrap" }}
                    >
                      {lagtInn.has(a.kjoperOrgnr) ? "✓ Lagt til" : "+ Legg i pipeline"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
