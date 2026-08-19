"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { SITE_URL } from "@/lib/site";

// Settings block: personal iCal subscription link for "neste steg" across the organisation.
export function CalendarSection({ initialToken }: { initialToken: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Always a full https:// URL (SITE_URL) so copy/paste into Outlook never loses the scheme.
  const url = token ? `${SITE_URL}/api/kalender/${token}` : "";
  const webcal = url.replace(/^https?:/, "webcal:");

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const rotate = async () => {
    if (!confirm("Lage ny lenke? Den gamle slutter å virke, og du må legge inn den nye i kalenderen din.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("rotate_calendar_token");
    setBusy(false);
    if (!error && data) setToken(data as string);
  };

  if (!token) {
    return (
      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
        Kalenderlenke er ikke aktivert for denne brukeren ennå.{" "}
        <button className="btn" onClick={rotate} disabled={busy}>Aktiver</button>
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Legg denne lenken inn i Outlook, Google Kalender eller iPhone én gang, så dukker alle
        oppfølginger («neste steg») i bedriften opp i kalenderen din — og oppdateres automatisk.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="field-input"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={{ flex: 1, minWidth: 240, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}
        />
        <button className="btn" onClick={copy} type="button">
          <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Kopiert" : "Kopier"}
        </button>
        <a className="btn" href={webcal}>
          Åpne i kalender
        </a>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 13 }}>
        <button type="button" className="linklike" onClick={() => setShowHelp((v) => !v)}>
          {showHelp ? "Skjul veiledning" : "Slik legger du den inn"}
        </button>
        <button type="button" className="linklike" onClick={rotate} disabled={busy} style={{ color: "var(--muted)" }}>
          Lag ny lenke
        </button>
      </div>
      {showHelp && (
        <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "var(--text)", display: "grid", gap: 10 }}>
          <div>
            <strong>Outlook (PC/Mac/nett):</strong> Kalender → «Legg til kalender» → «Abonner fra nettet» → lim inn lenken → gi den navn «Altiv» → Importer.
          </div>
          <div>
            <strong>Google Kalender:</strong> På PC: venstremeny «Andre kalendere» → + → «Fra nettadresse» → lim inn → Legg til kalender. Vises også på mobilen etterpå.
          </div>
          <div>
            <strong>iPhone:</strong> Trykk «Åpne i kalender» over, eller Innstillinger → Kalender → Kontoer → Legg til konto → Annet → Legg til abonnementskalender → lim inn.
          </div>
          <div style={{ color: "var(--muted)" }}>
            Kalenderprogrammene henter oppdateringer selv, typisk hver 1–24 timer (Outlook/Google bestemmer). Lenken er personlig — ikke del den. Trykk «Lag ny lenke» hvis den kommer på avveie.
          </div>
        </div>
      )}
    </div>
  );
}
