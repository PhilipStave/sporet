"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import type { Lead, LeadDetail, Regnskap } from "@/lib/brreg";
import type { Kontakt } from "@/lib/kontakt";
import type { Anbud } from "@/lib/doffin";

type Detalj = LeadDetail & { kontakt: Kontakt; regnskap: Regnskap | null };

// Lead search, opened from the pipeline. Every company shown comes from
// Enhetsregisteret; nothing here is generated.

type Svar = {
  leads: Lead[];
  total: number;
  forklaring: string | null;
  kilde: "lokal" | "ai";
  melding: string | null;
  /** Null when the AI path is off — then nothing is metered. */
  kvoteBrukt: number | null;
  kvote: number | null;
};

/**
 * What the search understands, rather than four ready-made queries.
 *
 * Concrete examples taught the wrong lesson: they were all machines and
 * construction, so a seller of anything else read them as "this is not for
 * me". These three are the parameters the search actually acts on — place,
 * size and count — and they hold whatever the user sells.
 */
const HINT = [
  { hva: "Sted", som: "«i Trondheim», «på Sørlandet»" },
  { hva: "Størrelse", som: "«små bedrifter», «over 50 ansatte»" },
  { hva: "Antall", som: "«finn 20 kunder»" },
];

function kr(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")} mrd`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mill`;
  return n.toLocaleString("nb-NO");
}

type Utvalg = "alle" | "nye" | "kunder";

const UTVALG: { id: Utvalg; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "nye", label: "Bare nye" },
  { id: "kunder", label: "Bare kunder" },
];

/** Company names differ in punctuation and casing far more than in substance. */
function navnNokkel(navn: string) {
  return navn
    .toLowerCase()
    .replace(/(as|asa|ans|da|nuf)/g, "")
    .replace(/[^a-z0-9æøå]/g, "");
}

export function FinnKunderDialog({ onClose }: { onClose: () => void }) {
  const { createDeal, updateDeal, canWrite, deals } = useStore();
  const [tekst, setTekst] = useState("");
  const [laster, setLaster] = useState(false);
  const [svar, setSvar] = useState<Svar | null>(null);
  // Active Doffin notices matching the same phrase — buyers who are looking
  // right now. Loaded alongside the company search, never blocking it.
  const [anbud, setAnbud] = useState<Anbud[]>([]);
  const [feil, setFeil] = useState<string | null>(null);
  const [lagtInn, setLagtInn] = useState<Set<string>>(new Set());
  const [jobber, setJobber] = useState<string | null>(null);
  const [vis, setVis] = useState<Utvalg>("alle");
  const [regnskap, setRegnskap] = useState<Record<string, Regnskap>>({});
  const [bulk, setBulk] = useState<{ ferdig: number; av: number } | null>(null);

  // Org number is exact; the name key is the fallback for customers added by
  // hand, who never had one.
  const eksisterende = useMemo(() => {
    const orgnr = new Set<string>();
    const navn = new Set<string>();
    for (const d of deals) {
      if (d.org_nr) orgnr.add(d.org_nr);
      if (d.company) navn.add(navnNokkel(d.company));
    }
    return { orgnr, navn };
  }, [deals]);

  const erKunde = (l: Lead) =>
    eksisterende.orgnr.has(l.orgnr) || eksisterende.navn.has(navnNokkel(l.navn));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const synlige = useMemo(() => {
    const alle = svar?.leads ?? [];
    if (vis === "nye") return alle.filter((l) => !erKunde(l));
    if (vis === "kunder") return alle.filter((l) => erKunde(l));
    return alle;
    // erKunde reads eksisterende, which is itself memoised on deals.
  }, [svar, vis, eksisterende]); // eslint-disable-line react-hooks/exhaustive-deps

  const nye = useMemo(
    () => synlige.filter((l) => !erKunde(l) && !lagtInn.has(l.orgnr)).length,
    [synlige, eksisterende, lagtInn] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const antallKunder = useMemo(
    () => (svar?.leads ?? []).filter((l) => erKunde(l)).length,
    [svar, eksisterende] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const sok = async (q?: string) => {
    const spørring = (q ?? tekst).trim();
    if (spørring.length < 3) return;
    if (q) setTekst(q);
    setLaster(true);
    setFeil(null);
    setSvar(null);
    setAnbud([]);
    // Fire-and-collect: tenders arrive whenever Doffin answers, and a Doffin
    // hiccup never touches the company search.
    fetch("/api/kundesok/anbud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tekst: spørring }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setAnbud(j?.anbud ?? []))
      .catch(() => {});
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
        const s = json as Svar;
        setSvar(s);
        hentRegnskap(s.leads.map((l) => l.orgnr));
      }
    } catch {
      setFeil("Fikk ikke kontakt med søket. Prøv igjen.");
    } finally {
      setLaster(false);
    }
  };

  /** Turnover for the whole page, so size is visible before anyone is picked. */
  const hentRegnskap = async (orgnr: string[]) => {
    setRegnskap({});
    if (orgnr.length === 0) return;
    try {
      const res = await fetch("/api/kundesok/regnskap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgnr }),
      });
      if (res.ok) setRegnskap((await res.json())?.regnskap ?? {});
    } catch {
      // Turnover is a nice-to-have; the list works without it.
    }
  };

  /**
   * The fields that only the detail lookup can fill: contact details scraped
   * from the company's own site, plus the accounts. Kept separate so they can
   * be patched onto a deal that is already in the pipeline.
   */
  const fraDetalj = (lead: Lead, d: Detalj) => ({
    email: d.kontakt.epost ?? "",
    phone: d.kontakt.telefon ?? "",
    adresse: d.adresse || lead.adresse || null,
    postnummer: d.postnummer || null,
    stiftet: d.stiftet ?? null,
    nettside: d.kontakt.domene ?? null,
    omsetning: d.regnskap?.omsetning ?? null,
    driftsresultat: d.regnskap?.driftsresultat ?? null,
    aarsresultat: d.regnskap?.aarsresultat ?? null,
    regnskapsaar: d.regnskap?.aar ?? null,
  });

  /** Everything we know about one company, ready for createDeal. */
  const somKunde = (lead: Lead, detalj: Detalj | null) => ({
    company: lead.navn,
    org_nr: lead.orgnr,
    // Only ever a general company mailbox, never a named person.
    email: detalj?.kontakt.epost ?? "",
    phone: detalj?.kontakt.telefon ?? "",
    naeringskode: lead.naeringskode || null,
    naering: lead.naering || null,
    ansatte: lead.ansatte,
    adresse: detalj?.adresse || lead.adresse || null,
    postnummer: detalj?.postnummer || null,
    poststed: lead.poststed || null,
    kommune: lead.kommune || null,
    stiftet: detalj?.stiftet ?? null,
    mva_registrert: lead.mva,
    nettside: detalj?.kontakt.domene ?? null,
    omsetning: detalj?.regnskap?.omsetning ?? regnskap[lead.orgnr]?.omsetning ?? null,
    driftsresultat: detalj?.regnskap?.driftsresultat ?? regnskap[lead.orgnr]?.driftsresultat ?? null,
    aarsresultat: detalj?.regnskap?.aarsresultat ?? regnskap[lead.orgnr]?.aarsresultat ?? null,
    regnskapsaar: detalj?.regnskap?.aar ?? regnskap[lead.orgnr]?.aar ?? null,
    // Left empty on purpose — the note field belongs to the seller.
    notes: "",
    tags: ["Fra kundesøk"],
  });

  /**
   * Import every hit that is not already a customer, in one go. The detail
   * lookup visits each company's website, so this takes a while — hence the
   * running count rather than a spinner.
   */
  const leggTilAlle = async () => {
    if (!canWrite || bulk) return;
    const kandidater = synlige.filter((l) => !erKunde(l) && !lagtInn.has(l.orgnr));
    if (kandidater.length === 0) return;

    setBulk({ ferdig: 0, av: kandidater.length });

    // Everyone lands in the pipeline first, on register data alone.
    const opprettet = new Map<string, string>();
    for (const lead of kandidater) {
      const id = await createDeal(somKunde(lead, null));
      if (id) {
        opprettet.set(lead.orgnr, id);
        setLagtInn((s) => new Set(s).add(lead.orgnr));
      }
      setBulk((b) => (b ? { ...b, ferdig: b.ferdig + 1 } : b));
    }
    setBulk(null);

    // Then the slow part — one website visit per company — fills in contact
    // details behind the scenes. The list is already usable while this runs.
    //
    // In batches of eight: the endpoint caps each request, and one big call
    // both dropped everyone past the cap and risked running out of time for
    // the rest. Small batches finish, and each one lands as it arrives.
    for (let i = 0; i < kandidater.length; i += 8) {
      const gruppe = kandidater.slice(i, i + 8);
      try {
        const res = await fetch("/api/kundesok/detalj", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orgnr: gruppe.map((l) => l.orgnr) }),
        });
        if (!res.ok) continue;
        const detaljer: Detalj[] = (await res.json())?.detaljer ?? [];
        for (const lead of gruppe) {
          const id = opprettet.get(lead.orgnr);
          const d = detaljer.find((x) => x.orgnr === lead.orgnr);
          if (id && d) await updateDeal(id, fraDetalj(lead, d));
        }
      } catch {
        // This batch missed out; the next one still gets its chance.
      }
    }
  };

  /**
   * One click = one customer in the pipeline.
   *
   * The deal is created from the register data straight away, and the contact
   * details are patched on when they arrive. Waiting for the detail lookup
   * first meant several seconds of nothing after pressing plus — long enough
   * that the button read as broken.
   */
  const leggTil = async (lead: Lead) => {
    if (!canWrite || lagtInn.has(lead.orgnr)) return;

    const id = await createDeal(somKunde(lead, null));
    if (!id) return;
    setLagtInn((s) => new Set(s).add(lead.orgnr));

    setJobber(lead.orgnr);
    try {
      const res = await fetch("/api/kundesok/detalj", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgnr: [lead.orgnr] }),
      });
      if (res.ok) {
        const d: Detalj | null = (await res.json())?.detaljer?.[0] ?? null;
        if (d) await updateDeal(id, fraDetalj(lead, d));
      }
    } catch {
      // The company is already in the pipeline; it just lacks contact details.
    }
    setJobber(null);
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
              placeholder="Hva selger du, og til hvem?"
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
          <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.7 }}>
            Skriv med egne ord hva du selger og hvem som kjøper det. Du kan også ta med:
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 3 }}>
              {HINT.map((h) => (
                <span key={h.hva}>
                  <strong style={{ fontWeight: 600, color: "var(--text)" }}>{h.hva}</strong> {h.som}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Vis:</span>
            <div className="pillgroup">
              {UTVALG.map((u) => (
                <button key={u.id} data-active={vis === u.id} onClick={() => setVis(u.id)}>
                  {u.label}
                </button>
              ))}
            </div>
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

              {(svar.kvote != null || (svar.melding && svar.forklaring)) && (
                <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "-6px 0 12px" }}>
                  {svar.melding && svar.forklaring ? svar.melding + " " : ""}
                  {svar.kvote != null && svar.kvoteBrukt != null && (
                    <>
                      {svar.kvoteBrukt} av {svar.kvote} AI-søk brukt denne måneden.
                    </>
                  )}
                </p>
              )}

              {/* Buyers who are looking RIGHT NOW: open notices from Doffin.
                  The register shows who exists; this shows demand. */}
              {anbud.length > 0 && (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 14,
                    background: "var(--bg)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Aktive anbud på Doffin ({anbud.length})
                    <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                      {" "}
                      — offentlige kjøpere som leter etter dette nå
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {anbud.map((a) => (
                      <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                          <a
                            href={a.lenke}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
                          >
                            {a.tittel}
                          </a>
                          <span style={{ color: "var(--muted)" }}>
                            {" · "}
                            {a.kjoperNavn}
                            {a.verdi != null && <> · est. {kr(a.verdi)} kr</>}
                            {a.frist && (
                              <> · frist {new Date(a.frist).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}</>
                            )}
                          </span>
                        </div>
                        {a.kjoperOrgnr && (
                          <button
                            type="button"
                            className="btn"
                            title={`Legg ${a.kjoperNavn} i pipelinen`}
                            disabled={!canWrite || lagtInn.has(a.kjoperOrgnr)}
                            onClick={() =>
                              leggTil({
                                orgnr: a.kjoperOrgnr!,
                                navn: a.kjoperNavn,
                                form: "",
                                naeringskode: "",
                                naering: "",
                                ansatte: null,
                                poststed: "",
                                kommune: "",
                                adresse: "",
                                registrert: null,
                                mva: false,
                              })
                            }
                            style={{ padding: "3px 10px", fontSize: 12, flex: "none" }}
                          >
                            {lagtInn.has(a.kjoperOrgnr) ? "✓" : "+"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  margin: "-6px 0 10px",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {antallKunder > 0
                    ? `${antallKunder} av ${svar.leads.length} er allerede kunder hos dere.`
                    : ""}
                </span>
                {nye > 0 && (
                  <button
                    type="button"
                    className="btn"
                    onClick={leggTilAlle}
                    disabled={!canWrite || bulk !== null}
                    style={{ padding: "6px 13px", fontSize: 12.5 }}
                  >
                    {bulk
                      ? `Legger til ${bulk.ferdig} av ${bulk.av} …`
                      : `Legg til alle ${nye}`}
                  </button>
                )}
              </div>

              {synlige.length === 0 && (
                <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                  {vis === "nye"
                    ? "Alle treffene er allerede kunder hos dere."
                    : "Ingen av treffene er kunder hos dere ennå."}
                </p>
              )}

              <div style={{ display: "grid", gap: 8 }}>
                {synlige.map((l) => {
                  const inne = lagtInn.has(l.orgnr);
                  const kunde = erKunde(l);
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
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{l.navn}</span>
                          {kunde && (
                            <span
                              title="Ligger allerede i kundelisten"
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
                          {l.anbud && (
                            <span
                              title={`Aktivt anbud: ${l.anbud.tittel}`}
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".04em",
                                padding: "2px 7px",
                                borderRadius: 999,
                                background: "var(--tint-success)",
                                color: "#059669",
                              }}
                            >
                              Anbud ute
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 1 }}>
                          {l.naering}
                        </div>
                        {l.anbud && (
                          <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                            <a
                              href={l.anbud.lenke}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: "#059669", fontWeight: 600 }}
                            >
                              {l.anbud.tittel}
                            </a>
                            {l.anbud.frist && (
                              <>
                                {" "}
                                · frist{" "}
                                {new Date(l.anbud.frist).toLocaleDateString("nb-NO", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </>
                            )}
                          </div>
                        )}
                        {l.hvorfor && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--primary)",
                              marginTop: 2,
                              fontStyle: "italic",
                            }}
                          >
                            {l.hvorfor}
                          </div>
                        )}
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
                          {regnskap[l.orgnr]?.omsetning != null && (
                            <span style={{ fontWeight: 600, color: "var(--text)" }}>
                              {kr(regnskap[l.orgnr].omsetning!)} kr
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => leggTil(l)}
                        disabled={inne || kunde || jobber === l.orgnr || !canWrite}
                        title={
                          kunde
                            ? "Ligger allerede i kundelisten"
                            : inne
                              ? "Allerede lagt til"
                              : canWrite
                                ? "Legg til i pipelinen"
                                : "Abonnementet må være aktivt"
                        }
                        className={inne || kunde ? "btn" : "btn btn-primary"}
                        style={{ flexShrink: 0, padding: "8px 12px" }}
                      >
                        {inne || kunde ? (
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
                  Bedriftsdata kommer fra Enhetsregisteret. E-post og telefon hentes fra
                  bedriftens egen nettside når vi finner den — kun fellesadresser som
                  post@ og firmapost@, aldri navngitte personer.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
