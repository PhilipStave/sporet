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
  // One-click "add subscription" deep links. Outlook (work/school + personal) and Google both
  // accept a pre-filled URL; the user only confirms. webcal: covers Apple + desktop Outlook.
  const calName = "Altiv";
  const outlookAdd = `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=${encodeURIComponent(calName)}`;
  const googleAdd = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

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
        Få alle oppfølginger («neste steg») i bedriften rett inn i din egen kalender. Trykk på
        kalenderen du bruker — den åpnes ferdig utfylt, og du bekrefter med ett klikk. Oppdateres
        automatisk etterpå.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <a className="btn btn-primary" href={outlookAdd} target="_blank" rel="noopener noreferrer">
          <Icon name="calendar" size={15} /> Outlook
        </a>
        <a className="btn" href={googleAdd} target="_blank" rel="noopener noreferrer">
          <Icon name="calendar" size={15} /> Google Kalender
        </a>
        <a className="btn" href={webcal}>
          <Icon name="calendar" size={15} /> iPhone / Mac / annen
        </a>
        <button className="btn" onClick={copy} type="button" title="Kopier lenken hvis du vil lime den inn selv">
          <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Kopiert" : "Kopier lenke"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 13 }}>
        <button type="button" className="linklike" onClick={() => setShowHelp((v) => !v)}>
          {showHelp ? "Skjul veiledning" : "Virker det ikke? Slik legger du den inn manuelt"}
        </button>
        <button type="button" className="linklike" onClick={rotate} disabled={busy} style={{ color: "var(--muted)" }}>
          Lag ny lenke
        </button>
      </div>
      {showHelp && (
        <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "var(--text)", display: "grid", gap: 10 }}>
          <div>
            <strong>Outlook (nett):</strong> «Outlook»-knappen åpner «Legg til kalender» ferdig utfylt — trykk Importer. Bruker du privat Outlook.com og knappen ikke treffer: Kalender → Legg til kalender → Abonner fra nett → lim inn lenken (Kopier lenke) → Importer.
          </div>
          <div>
            <strong>Outlook-programmet (PC):</strong> Trykk «iPhone / Mac / annen» — Outlook spør «Vil du legge til denne kalenderen?» → Ja.
          </div>
          <div>
            <strong>Google Kalender:</strong> «Google Kalender»-knappen åpner «Legg til kalender» — trykk Legg til. Vises på mobilen etterpå.
          </div>
          <div>
            <strong>iPhone / Mac:</strong> Trykk «iPhone / Mac / annen» → Abonner. Ferdig.
          </div>
          <div style={{ color: "var(--muted)" }}>
            Kalenderprogrammene henter oppdateringer selv, typisk hver 1–24 timer (Outlook/Google bestemmer). Lenken er personlig — ikke del den. Trykk «Lag ny lenke» hvis den kommer på avveie.
          </div>
        </div>
      )}
    </div>
  );
}
