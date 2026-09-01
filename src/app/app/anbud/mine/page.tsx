"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { fmtKr } from "@/lib/format";
import { RegistrerBudDialog } from "@/components/anbud/RegistrerBudDialog";
import type { Utfall } from "@/lib/doffin";
import type { Bud, BudStatus } from "@/types";

// The other half of the tender page: what happened to the ones we went for.
//
// The page answers three questions, in the order a seller has them on a Monday
// morning: what must go out this week, what am I waiting to hear about, and
// how did the last ones go. Doffin answers the third one where it can — only
// about one competition in four ever gets an award notice published, so the
// rest stays a checkbox the seller ticks.

const STATUSTEKST: Record<BudStatus, string> = {
  vurderer: "Vurderer",
  levert: "Bud levert",
  vunnet: "Vunnet",
  tapt: "Tapt",
  avlyst: "Avlyst",
  droppet: "Droppet",
};

const DAG = 86_400_000;

/** A deadline more than six months gone was never acted on. */
const GLEMT = 182 * DAG;

function dagerTil(frist: string | null, naa: number) {
  if (!frist) return null;
  return Math.ceil((new Date(frist).getTime() - naa) / DAG);
}

export default function MineBudPage() {
  const { anbud, oppdaterBud, slettBud, canWrite, org, setSelectedDealId } = useStore();
  const [utfall, setUtfall] = useState<Record<string, Utfall>>({});
  const [visAlle, setVisAlle] = useState(false);
  const [visGlemte, setVisGlemte] = useState(false);
  const [dialog, setDialog] = useState(false);
  /** Stamped once on open, so the countdowns hold still while you read. */
  const [naa] = useState(() => Date.now());

  /**
   * Ask Doffin about the ones where an answer could exist: bids we have
   * delivered, and competitions whose deadline has passed. Ten at a time, so a
   * long list never turns into a long wait.
   */
  useEffect(() => {
    const kandidater = anbud
      .filter((b) => b.doffin_id && (b.status === "levert" || b.status === "vurderer"))
      .filter((b) => !b.frist || new Date(b.frist).getTime() < Date.now())
      .filter((b) => !(b.doffin_id! in utfall))
      .slice(0, 10)
      .map((b) => b.doffin_id!);
    if (kandidater.length === 0) return;

    let avbrutt = false;
    (async () => {
      try {
        const res = await fetch("/api/anbud/utfall", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ider: kandidater }),
        });
        if (!res.ok || avbrutt) return;
        const json = await res.json();
        setUtfall((u) => ({ ...u, ...(json?.utfall ?? {}) }));
      } catch {
        // No outcome is the normal state anyway.
      }
    })();
    return () => {
      avbrutt = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anbud]);

  const grupper = useMemo(() => {
    const maaLeveres: Bud[] = [];
    const venter: Bud[] = [];
    const avgjort: Bud[] = [];
    const glemte: Bud[] = [];
    for (const b of anbud) {
      const d = dagerTil(b.frist, naa);
      if (b.status === "levert") venter.push(b);
      else if (b.status === "vurderer") {
        if (d != null && d * DAG < -GLEMT) glemte.push(b);
        else if (d != null && d < 0) venter.push(b);
        else maaLeveres.push(b);
      } else avgjort.push(b);
    }
    maaLeveres.sort((a, b) => (a.frist ?? "9999").localeCompare(b.frist ?? "9999"));
    venter.sort((a, b) => (b.frist ?? "").localeCompare(a.frist ?? ""));
    avgjort.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return { maaLeveres, venter, avgjort, glemte };
  }, [anbud, naa]);

  const tall = useMemo(() => {
    const denneUken = grupper.maaLeveres.filter((b) => {
      const d = dagerTil(b.frist, naa);
      return d != null && d >= 0 && d <= 7;
    }).length;
    const aar = new Date(naa).getFullYear();
    const iAar = anbud.filter(
      (b) =>
        (b.status === "vunnet" || b.status === "tapt") &&
        new Date(b.updated_at).getFullYear() === aar
    );
    return {
      denneUken,
      venter: grupper.venter.length,
      vunnet: iAar.filter((b) => b.status === "vunnet").length,
      avgjorte: iAar.length,
    };
  }, [grupper, anbud, naa]);

  /** Doffin names the winners; we only suggest what that means for us. */
  const viVant = (u: Utfall) => {
    const vaart = org.name.trim().toLowerCase().replace(/\s+(as|asa|ans|da)$/, "");
    return u.vinnere.some((v) => {
      const n = v.trim().toLowerCase().replace(/\s+(as|asa|ans|da)$/, "");
      return n === vaart || n.includes(vaart) || vaart.includes(n);
    });
  };

  const sett = (b: Bud, status: BudStatus) => {
    if (!canWrite) return;
    oppdaterBud(b.id, {
      status,
      levert_at:
        status === "levert" && !b.levert_at
          ? new Date().toISOString().slice(0, 10)
          : b.levert_at,
    });
  };

  const kort = (b: Bud, knapper: React.ReactNode) => {
    const d = dagerTil(b.frist, naa);
    const u = b.doffin_id ? utfall[b.doffin_id] : undefined;
    return (
      <div key={b.id} className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            {b.lenke ? (
              <a
                href={b.lenke}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 15, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
              >
                {b.tittel}
              </a>
            ) : (
              <span style={{ fontSize: 15, fontWeight: 600 }}>{b.tittel}</span>
            )}
            <div
              style={{
                fontSize: 12.5,
                color: "var(--muted)",
                marginTop: 3,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Icon name="building" size={12} />
              {b.deal_id ? (
                <button
                  type="button"
                  onClick={() => setSelectedDealId(b.deal_id)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    color: "inherit",
                    font: "inherit",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {b.kjoper_navn}
                </button>
              ) : (
                b.kjoper_navn
              )}
              {b.lopende && <>· løpende ordning</>}
              {b.tilbudssum != null ? (
                <>· vårt bud {fmtKr(b.tilbudssum)}</>
              ) : (
                b.verdi != null && <>· {b.lopende ? "ramme" : "est."} {fmtKr(b.verdi)}</>
              )}
              {b.levert_at && <>· levert {b.levert_at.slice(8, 10)}.{b.levert_at.slice(5, 7)}</>}
            </div>

            {u?.avgjort && (
              <p
                style={{
                  fontSize: 12.5,
                  margin: "9px 0 0",
                  padding: "7px 10px",
                  borderRadius: 8,
                  background: viVant(u) ? "var(--tint-success)" : "var(--surface-2, var(--primary-050))",
                  color: viVant(u) ? "#059669" : "var(--muted)",
                  lineHeight: 1.5,
                }}
              >
                <strong>Doffin: kontrakten er tildelt</strong>
                {u.vinnere.length > 0 && <> {u.vinnere.join(", ")}</>}
                {u.antallTilbud != null && <> · {u.antallTilbud} bud kom inn</>}
                {u.lenke && (
                  <>
                    {" "}
                    <a href={u.lenke} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                      Se kunngjøringen
                    </a>
                  </>
                )}
              </p>
            )}
            {b.notat && (
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>{b.notat}</p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: "none" }}>
            {d != null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background: d < 0 ? "var(--surface)" : d <= 7 ? "var(--tint-warn)" : "var(--tint-success)",
                  color: d < 0 ? "var(--muted)" : d <= 7 ? "var(--tint-warn-text)" : "#059669",
                }}
              >
                {d < 0
                  ? `Frist gikk ut ${Math.abs(d)} dager siden`
                  : d === 0
                    ? "Frist i dag"
                    : d === 1
                      ? "1 dag igjen"
                      : `${d} dager igjen`}
              </span>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {knapper}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const seksjon = (
    tittel: string,
    forklaring: string,
    liste: Bud[],
    knapper: (b: Bud) => React.ReactNode
  ) =>
    liste.length > 0 && (
      <section style={{ marginBottom: 26 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 2px" }}>
          {tittel} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({liste.length})</span>
        </h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 10px", maxWidth: "70ch" }}>
          {forklaring}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {liste.map((b) => kort(b, knapper(b)))}
        </div>
      </section>
    );

  const knapp = (tekst: string, onClick: () => void, primaer = false) => (
    <button
      type="button"
      className={primaer ? "btn btn-primary" : "btn"}
      onClick={onClick}
      disabled={!canWrite}
      style={{ padding: "5px 12px", fontSize: 12.5, whiteSpace: "nowrap" }}
    >
      {tekst}
    </button>
  );

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 auto" }}>
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>Mine bud</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 18px", maxWidth: "72ch" }}>
            Anbudene dere følger, og hvordan det gikk. Alt du følger fra søket havner
            her — og leverer dere på noe som kom på e-post i stedet, kan du føre det
            inn selv.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDialog(true)}
          disabled={!canWrite}
          style={{ padding: "9px 18px" }}
        >
          + Registrer bud
        </button>
      </div>

      {anbud.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { t: "Frist denne uken", v: String(tall.denneUken), h: "må leveres innen sju dager" },
            { t: "Venter på svar", v: String(tall.venter), h: "levert, ikke avgjort" },
            {
              t: "Vunnet i år",
              v: tall.avgjorte > 0 ? `${tall.vunnet} av ${tall.avgjorte}` : "—",
              h: tall.avgjorte > 0 ? "av de avgjorte" : "ingen avgjort ennå",
            },
          ].map((k) => (
            <div key={k.t} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{k.t}</div>
              <div style={{ fontSize: 26, fontWeight: 700, margin: "2px 0" }}>{k.v}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.h}</div>
            </div>
          ))}
        </div>
      )}

      {anbud.length === 0 && (
        <div className="card" style={{ padding: 22 }}>
          <p style={{ fontSize: 14, margin: 0 }}>Ingen bud registrert ennå.</p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0", maxWidth: "68ch" }}>
            Søk opp en konkurranse under «Søk konkurranser» og trykk «Følg anbudet»,
            så havner den her med frist og alt. Har dere fått en forespørsel på e-post,
            bruk «Registrer bud».
          </p>
        </div>
      )}

      {seksjon(
        "Må leveres",
        "Frist er ikke gått ut. Trykk «Bud levert» når tilbudet er sendt, så flytter det seg ned til dem du venter på svar om.",
        grupper.maaLeveres,
        (b) => (
          <>
            {knapp("Bud levert", () => sett(b, "levert"), true)}
            {knapp("Dropp", () => sett(b, "droppet"))}
          </>
        )
      )}

      {seksjon(
        "Venter på svar",
        "Altiv spør Doffin om kontrakten er tildelt. Bare rundt én av fire konkurranser får kunngjort et resultat, så de fleste må du krysse av selv.",
        grupper.venter,
        (b) => (
          <>
            {knapp("Vi vant", () => sett(b, "vunnet"), true)}
            {knapp("Vi tapte", () => sett(b, "tapt"))}
            {knapp("Avlyst", () => sett(b, "avlyst"))}
          </>
        )
      )}

      {grupper.avgjort.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>
            Avgjort{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>
              ({grupper.avgjort.length})
            </span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(visAlle ? grupper.avgjort : grupper.avgjort.slice(0, 10)).map((b) =>
              kort(
                b,
                <>
                  <span style={{ fontSize: 12.5, color: "var(--muted)", alignSelf: "center" }}>
                    {STATUSTEKST[b.status]}
                  </span>
                  {knapp("Fjern", () => slettBud(b.id))}
                </>
              )
            )}
          </div>
          {grupper.avgjort.length > 10 && (
            <button
              type="button"
              className="btn"
              onClick={() => setVisAlle((v) => !v)}
              style={{ marginTop: 10, padding: "6px 14px", fontSize: 13 }}
            >
              {visAlle ? "Vis færre" : `Vis alle ${grupper.avgjort.length}`}
            </button>
          )}
        </section>
      )}

      {grupper.glemte.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setVisGlemte((v) => !v)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              fontSize: 13,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            {visGlemte ? "▾" : "▸"} Antatt ikke aktuelt ({grupper.glemte.length}) — frist
            gikk ut for over et halvår siden
          </button>
          {visGlemte && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {grupper.glemte.map((b) =>
                kort(
                  b,
                  <>
                    {knapp("Vi vant", () => sett(b, "vunnet"))}
                    {knapp("Fjern", () => slettBud(b.id))}
                  </>
                )
              )}
            </div>
          )}
        </section>
      )}

      {dialog && <RegistrerBudDialog onClose={() => setDialog(false)} />}
    </div>
  );
}
