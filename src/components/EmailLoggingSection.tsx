"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { relativeLabel } from "@/lib/format";
import { placeInboundEmail, discardInboundEmail } from "@/app/app/inbound-actions";
import type { InboundEmailRow } from "@/types/database";

const INBOUND_DOMAIN = "altiv.no";

/** Settings block: the org's BCC logging address + unmatched e-mails waiting to be placed. */
export function EmailLoggingSection({ initialKey }: { initialKey: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const { org, profile, deals, canWrite, refresh } = useStore();
  const isAdmin = profile.role === "admin";
  const [key, setKey] = useState(initialKey);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [unmatched, setUnmatched] = useState<InboundEmailRow[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const address = key ? `${key}@${INBOUND_DOMAIN}` : "";

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("inbound_emails")
      .select("*")
      .eq("org_id", org.id)
      .eq("status", "unmatched")
      .order("received_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!cancelled) setUnmatched(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, org.id]);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const rotate = async () => {
    if (!confirm("Lage ny logg-adresse? Den gamle slutter å virke, og alle må oppdatere BCC-adressen sin.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("rotate_inbound_key");
    setBusy(false);
    if (!error && data) setKey(data as string);
  };

  const place = async (m: InboundEmailRow) => {
    const dealId = pick[m.id];
    if (!dealId) return;
    setBusy(true);
    setMsg("");
    const res = await placeInboundEmail(m.id, dealId);
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    setUnmatched((u) => u.filter((x) => x.id !== m.id));
    void refresh();
  };

  const discard = async (m: InboundEmailRow) => {
    if (!confirm("Forkaste denne e-posten? Den blir ikke logget noe sted.")) return;
    setBusy(true);
    const res = await discardInboundEmail(m.id);
    setBusy(false);
    if (!res.error) setUnmatched((u) => u.filter((x) => x.id !== m.id));
  };

  const sortedDeals = useMemo(
    () => [...deals].sort((a, b) => (a.company || "").localeCompare(b.company || "", "nb")),
    [deals]
  );

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Sett denne adressen på <strong>BCC</strong> når du sender e-post til en kunde, så havner
        e-posten automatisk i kundens aktivitetslogg i Altiv — med vedlegg som dokumenter. Adressen er
        felles for hele bedriften; bare e-post fra registrerte brukere blir logget.
      </p>

      {!address ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Ikke aktivert ennå.{" "}
          {isAdmin && (
            <button className="btn" onClick={rotate} disabled={busy}>Aktiver</button>
          )}
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              className="field-input"
              readOnly
              value={address}
              onFocus={(e) => e.currentTarget.select()}
              style={{ flex: 1, minWidth: 220, fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
            />
            <button className="btn btn-primary" onClick={copy} type="button">
              <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Kopiert" : "Kopier adresse"}
            </button>
            <a className="btn" href="/api/epost/kontakt" title="Laster ned en kontakt du kan åpne i Outlook/Apple/Google — så dukker «Altiv» opp når du skriver i BCC">
              <Icon name="download" size={15} /> Legg til som kontakt
            </a>
            <a
              className="btn"
              href="https://outlook.office.com/mail/options/mail/rules"
              target="_blank"
              rel="noopener noreferrer"
              title="Åpner Outlook-regler — lag en regel som alltid sender kopi til logg-adressen"
            >
              <Icon name="bolt" size={15} /> Automatisk i Outlook
            </a>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 13 }}>
            <button type="button" className="linklike" onClick={() => setShowHelp((v) => !v)}>
              {showHelp ? "Skjul veiledning" : "Slik setter du det opp"}
            </button>
            {isAdmin && (
              <button type="button" className="linklike" onClick={rotate} disabled={busy} style={{ color: "var(--muted)" }}>
                Lag ny adresse
              </button>
            )}
          </div>
          {showHelp && (
            <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, display: "grid", gap: 10 }}>
              <div>
                <strong>Helautomatisk (anbefalt) — Outlook-regel, én gang:</strong> Trykk «Automatisk i Outlook» →
                «Legg til ny regel» → navn «Altiv logg» → Betingelse: <em>Gjelder alle meldinger</em> (eller «Jeg er
                avsender») → Handling: <em>Videresend til</em> / <em>Send kopi (Cc/Bcc) til</em>{" "}
                <code style={{ fontSize: 12 }}>{address}</code> → Lagre. Etter dette logges alt du sender, uten at
                du gjør noe. E-post til ukjente adresser havner i «Ikke plassert» under — forkast eller plasser med to klikk.
              </div>
              <div>
                <strong>Manuelt — når du vil:</strong> Skriv e-posten som vanlig, legg{" "}
                <code style={{ fontSize: 12 }}>{address}</code> i BCC, send. Trykk «Legg til som kontakt» først, så
                dukker «Altiv logg» opp når du skriver «Al…» i BCC-feltet.
              </div>
              <div>
                <strong>Hvordan vet Altiv hvilken kunde?</strong> Den ser på hvem e-posten er sendt til og finner
                kunden med samme e-postadresse — eller samme firmadomene (@nordicsteel.no). Finner den ingen,
                havner e-posten i listen under, og du velger kunde med to klikk.
              </div>
              <div>
                <strong>Svar fra kunden</strong> logges ikke automatisk (de har ikke BCC-adressen). Videresend svaret
                til adressen over, så logges det.
              </div>
              <div style={{ color: "var(--muted)" }}>
                Siterte tråder og signaturer klippes bort så loggen blir lesbar. Vedlegg (ikke bilder i signaturer)
                legges som dokumenter på kunden.
              </div>
            </div>
          )}
        </>
      )}

      {unmatched.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Ikke plassert ({unmatched.length})
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
            Disse e-postene fant ingen kunde automatisk. Velg kunde, så logges de der.
          </p>
          {msg && <p style={{ fontSize: 12, color: "var(--danger)", margin: "0 0 8px" }}>{msg}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unmatched.map((m) => (
              <div
                key={m.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "var(--surface)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  <strong>{m.subject || "(uten emne)"}</strong>
                  <span style={{ color: "var(--muted)" }}>
                    {" "}· {m.from_name || m.from_email} → {m.to_emails.join(", ") || "—"} · {relativeLabel(m.received_at)}
                  </span>
                </div>
                {m.body_text && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      whiteSpace: "pre-wrap",
                      maxHeight: 72,
                      overflow: "hidden",
                    }}
                  >
                    {m.body_text}
                  </div>
                )}
                {canWrite && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select
                      className="field-input"
                      value={pick[m.id] ?? ""}
                      onChange={(e) => setPick((p) => ({ ...p, [m.id]: e.target.value }))}
                      style={{ flex: 1, minWidth: 200 }}
                    >
                      <option value="">Velg kunde …</option>
                      {sortedDeals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.company || d.contact || "Uten navn"}
                          {d.contact && d.company ? ` — ${d.contact}` : ""}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-primary" disabled={busy || !pick[m.id]} onClick={() => void place(m)}>
                      Logg på kunde
                    </button>
                    <button className="btn" disabled={busy} onClick={() => void discard(m)} title="Forkast">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
