"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import type { Deal } from "@/types";

// Altiv on a phone.
//
// The desktop app is where work gets done — a pipeline you drag cards around,
// tables, reports. None of that belongs on a screen you hold in one hand in a
// van between two meetings. This view answers two questions instead: what did
// I promise someone today, and what is this company's number.
//
// It deliberately cannot administer anything. No departments, no members, no
// subscription, no deleting a company. Those go through server calls that a
// phone has no business making, and nobody does them from a phone anyway.

type Fane = "idag" | "kunder";

const DAG = 86_400_000;

/** Local date as YYYY-MM-DD, so "today" means today in Norway, not in UTC. */
function idag() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date());
}

function dagerFra(dato: string, fra: string) {
  return Math.round((new Date(dato).getTime() - new Date(fra).getTime()) / DAG);
}

function norskDato(dato: string) {
  const d = new Date(dato);
  return new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short" }).format(d);
}

/** Digits only, so a number written "+47 900 12 345" still dials. */
function tlf(n: string) {
  return n.replace(/[^\d+]/g, "");
}

export default function MobilPage() {
  const { deals, profile, stageMaps, canWrite, logActivity, markNextDone, moveStage } =
    useStore();
  const [fane, setFane] = useState<Fane>("idag");
  const [sok, setSok] = useState("");
  const [apen, setApen] = useState<string | null>(null);
  const [dagensDato] = useState(() => idag());

  /**
   * Mine, not everyone's. A phone screen showing the whole company's follow-ups
   * is a list you scroll past, not one you act on.
   */
  const mine = useMemo(
    () => deals.filter((d) => d.owner_id === profile.id),
    [deals, profile.id]
  );

  const grupper = useMemo(() => {
    const forfalt: Deal[] = [];
    const iDag: Deal[] = [];
    const uken: Deal[] = [];
    for (const d of mine) {
      if (!d.next_step_date) continue;
      const n = dagerFra(d.next_step_date, dagensDato);
      if (n < 0) forfalt.push(d);
      else if (n === 0) iDag.push(d);
      else if (n <= 7) uken.push(d);
    }
    const etterDato = (a: Deal, b: Deal) =>
      (a.next_step_date ?? "").localeCompare(b.next_step_date ?? "");
    forfalt.sort(etterDato);
    iDag.sort(etterDato);
    uken.sort(etterDato);
    return { forfalt, iDag, uken };
  }, [mine, dagensDato]);

  const treff = useMemo(() => {
    const q = sok.trim().toLowerCase();
    if (!q) return deals.slice(0, 40);
    // Phone number is the one field you search by on a phone, and the desktop
    // search does not cover it. Digits are compared without spacing so "90012"
    // finds "+47 900 12 345".
    const siffer = q.replace(/\D/g, "");
    return deals
      .filter(
        (d) =>
          d.company.toLowerCase().includes(q) ||
          d.contact.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (siffer.length >= 3 && d.phone.replace(/\D/g, "").includes(siffer))
      )
      .slice(0, 40);
  }, [deals, sok]);

  const valgt = apen ? deals.find((d) => d.id === apen) ?? null : null;

  return (
    <div style={{ paddingBottom: 78 }}>
      {valgt ? (
        <Kundekort
          d={valgt}
          onLukk={() => setApen(null)}
          stageMaps={stageMaps}
          canWrite={canWrite}
          logActivity={logActivity}
          markNextDone={markNextDone}
          moveStage={moveStage}
        />
      ) : fane === "idag" ? (
        <IDag grupper={grupper} dagensDato={dagensDato} onApne={setApen} />
      ) : (
        <Kunder sok={sok} setSok={setSok} treff={treff} onApne={setApen} stageMaps={stageMaps} />
      )}

      {!valgt && (
        <nav
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            // Clear of the home indicator on an iPhone without a bezel.
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            zIndex: 30,
          }}
        >
          {(
            [
              { id: "idag", navn: "I dag", ikon: "calendar" },
              { id: "kunder", navn: "Kunder", ikon: "building" },
            ] as { id: Fane; navn: string; ikon: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFane(f.id)}
              style={{
                flex: 1,
                border: "none",
                background: "none",
                padding: "11px 0 13px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: fane === f.id ? "var(--primary)" : "var(--muted)",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <Icon name={f.ikon} size={21} />
              {f.navn}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

/* ---------- I dag ---------- */

function IDag({
  grupper,
  dagensDato,
  onApne,
}: {
  grupper: { forfalt: Deal[]; iDag: Deal[]; uken: Deal[] };
  dagensDato: string;
  onApne: (id: string) => void;
}) {
  const tomt =
    grupper.forfalt.length === 0 && grupper.iDag.length === 0 && grupper.uken.length === 0;

  const seksjon = (tittel: string, liste: Deal[], farge?: string) =>
    liste.length > 0 && (
      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".05em",
            color: farge ?? "var(--muted)",
            margin: "0 0 9px",
          }}
        >
          {tittel} ({liste.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {liste.map((d) => (
            <Rad key={d.id} d={d} dagensDato={dagensDato} onApne={onApne} />
          ))}
        </div>
      </section>
    );

  return (
    <div style={{ padding: "14px 15px 0" }}>
      <h1 style={{ fontSize: 27, margin: "0 0 2px" }}>I dag</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 20px" }}>
        {new Intl.DateTimeFormat("nb-NO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date(dagensDato))}
      </p>

      {tomt ? (
        <div className="card" style={{ padding: 22 }}>
          <p style={{ margin: 0, fontSize: 15 }}>Ingenting står på deg nå.</p>
          <p style={{ margin: "7px 0 0", fontSize: 13.5, color: "var(--muted)" }}>
            Oppfølginger du legger inn med dato dukker opp her — forfalte først.
          </p>
        </div>
      ) : (
        <>
          {seksjon("Forfalt", grupper.forfalt, "var(--danger)")}
          {seksjon("I dag", grupper.iDag)}
          {seksjon("Denne uken", grupper.uken)}
        </>
      )}
    </div>
  );
}

function Rad({
  d,
  dagensDato,
  onApne,
}: {
  d: Deal;
  dagensDato: string;
  onApne: (id: string) => void;
}) {
  const n = d.next_step_date ? dagerFra(d.next_step_date, dagensDato) : null;
  return (
    <div className="card" style={{ padding: 14 }}>
      <button
        type="button"
        onClick={() => onApne(d.id)}
        style={{
          border: "none",
          background: "none",
          padding: 0,
          textAlign: "left",
          width: "100%",
          font: "inherit",
          color: "inherit",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{d.company}</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>
          {d.next_step_text || "Oppfølging"}
          {d.next_step_date && (
            <>
              {" · "}
              {n != null && n < 0
                ? `forfalt ${norskDato(d.next_step_date)}`
                : norskDato(d.next_step_date)}
              {d.next_step_time ? ` kl ${d.next_step_time.slice(0, 5)}` : ""}
            </>
          )}
        </div>
      </button>
      <Handlinger d={d} />
    </div>
  );
}

/** Call and text are the two things a phone does that a laptop cannot. */
function Handlinger({ d }: { d: Deal }) {
  if (!d.phone && !d.email) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
      {d.phone && (
        <a
          href={`tel:${tlf(d.phone)}`}
          className="btn btn-primary"
          style={{ padding: "8px 16px", fontSize: 14, textDecoration: "none" }}
        >
          Ring
        </a>
      )}
      {d.phone && (
        <a
          href={`sms:${tlf(d.phone)}`}
          className="btn"
          style={{ padding: "8px 16px", fontSize: 14, textDecoration: "none" }}
        >
          SMS
        </a>
      )}
      {d.email && (
        <a
          href={`mailto:${d.email}`}
          className="btn"
          style={{ padding: "8px 16px", fontSize: 14, textDecoration: "none" }}
        >
          E-post
        </a>
      )}
    </div>
  );
}

/* ---------- Kunder ---------- */

function Kunder({
  sok,
  setSok,
  treff,
  onApne,
  stageMaps,
}: {
  sok: string;
  setSok: (s: string) => void;
  treff: Deal[];
  onApne: (id: string) => void;
  stageMaps: { labels: Record<string, string> };
}) {
  return (
    <div style={{ padding: "14px 15px 0" }}>
      <h1 style={{ fontSize: 27, margin: "0 0 12px" }}>Kunder</h1>
      <input
        className="field-input"
        value={sok}
        onChange={(e) => setSok(e.target.value)}
        placeholder="Navn, kontakt eller telefonnummer"
        // 16px keeps iOS from zooming the page when the field takes focus.
        style={{ width: "100%", fontSize: 16, marginBottom: 14 }}
      />
      {treff.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Ingen treff.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {treff.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onApne(d.id)}
              className="card"
              style={{
                padding: 14,
                textAlign: "left",
                border: "1px solid var(--border)",
                font: "inherit",
                color: "inherit",
              }}
            >
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>{d.company}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                {[d.contact, stageMaps.labels[d.stage] ?? d.stage].filter(Boolean).join(" · ")}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Kundekort ---------- */

function Kundekort({
  d,
  onLukk,
  stageMaps,
  canWrite,
  logActivity,
  markNextDone,
  moveStage,
}: {
  d: Deal;
  onLukk: () => void;
  stageMaps: { labels: Record<string, string>; list: { key: string; label: string }[] };
  canWrite: boolean;
  logActivity: (id: string, a: { icon: string; label: string; note: string }) => Promise<void>;
  markNextDone: (id: string) => Promise<void>;
  moveStage: (id: string, stage: string) => Promise<void>;
}) {
  const [byttSteg, setByttSteg] = useState(false);

  // What you log right after hanging up, before you forget. One tap, no form —
  // a form on a phone is a note that never gets written.
  const hurtiglogg = [
    { icon: "phone", label: "Ringte" },
    { icon: "users", label: "Møte" },
    { icon: "mail", label: "Sendte tilbud" },
  ];

  return (
    <div style={{ padding: "14px 15px 0" }}>
      <button
        type="button"
        onClick={onLukk}
        style={{
          border: "none",
          background: "none",
          padding: "4px 0 12px",
          color: "var(--primary)",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        ← Tilbake
      </button>

      <h1 style={{ fontSize: 24, margin: "0 0 2px", lineHeight: 1.2 }}>{d.company}</h1>
      {d.contact && (
        <p style={{ fontSize: 14.5, color: "var(--muted)", margin: "0 0 14px" }}>
          {[d.contact, d.contact_role].filter(Boolean).join(" · ")}
        </p>
      )}

      <Handlinger d={d} />

      <div className="card" style={{ padding: 15, marginTop: 16 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)" }}>
          Steg
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {stageMaps.labels[d.stage] ?? d.stage}
          </span>
          {canWrite && (
            <button
              type="button"
              className="btn"
              onClick={() => setByttSteg((v) => !v)}
              style={{ padding: "5px 12px", fontSize: 13, marginLeft: "auto" }}
            >
              Endre
            </button>
          )}
        </div>
        {byttSteg && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 11 }}>
            {stageMaps.list.map((s) => (
              <button
                key={s.key}
                type="button"
                className="chip"
                data-active={s.key === d.stage}
                onClick={() => {
                  moveStage(d.id, s.key);
                  setByttSteg(false);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {d.next_step_text && (
        <div className="card" style={{ padding: 15, marginTop: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)" }}>
            Neste steg
          </div>
          <div style={{ fontSize: 15.5, marginTop: 5 }}>{d.next_step_text}</div>
          {d.next_step_date && (
            <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 2 }}>
              {norskDato(d.next_step_date)}
              {d.next_step_time ? ` kl ${d.next_step_time.slice(0, 5)}` : ""}
            </div>
          )}
          {canWrite && (
            <button
              type="button"
              className="btn"
              onClick={() => markNextDone(d.id)}
              style={{ padding: "7px 14px", fontSize: 13.5, marginTop: 11 }}
            >
              ✓ Gjort
            </button>
          )}
        </div>
      )}

      {canWrite && (
        <div className="card" style={{ padding: 15, marginTop: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)", marginBottom: 10 }}>
            Logg det som skjedde
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {hurtiglogg.map((h) => (
              <button
                key={h.label}
                type="button"
                className="btn"
                onClick={() => logActivity(d.id, { icon: h.icon, label: h.label, note: "" })}
                style={{ padding: "9px 15px", fontSize: 14 }}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {d.activities.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)", marginBottom: 9 }}>
            Historikk
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {d.activities.slice(0, 12).map((a) => (
              <div key={a.id} style={{ fontSize: 13.5, display: "flex", gap: 8 }}>
                <span style={{ color: "var(--muted)", flexShrink: 0, minWidth: 52 }}>
                  {norskDato(a.created_at)}
                </span>
                <span>
                  {a.label}
                  {a.note ? ` — ${a.note}` : ""}
                  <span style={{ color: "var(--muted)" }}> · {a.actor_name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
