"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { Deal } from "@/types";

// Public company facts from Brønnøysundregistrene, shown as data rather than
// as prose in the note field. Only rendered for customers that carry an org
// number — hand-added ones have nothing to show.

function kr(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")} mrd`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mill`;
  return n.toLocaleString("nb-NO");
}

function dato(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${Number(d)}.${Number(m)}.${y}` : iso;
}

export function Firmadata({ deal }: { deal: Deal }) {
  const [apen, setApen] = useState(false);
  if (!deal.org_nr) return null;

  const adresse = [
    deal.adresse,
    [deal.postnummer, deal.poststed].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const rader: { k: string; v: string }[] = [
    { k: "Org.nr.", v: deal.org_nr },
    deal.naering && {
      k: "Bransje",
      v: deal.naeringskode ? `${deal.naering} (${deal.naeringskode})` : deal.naering,
    },
    deal.ansatte != null && { k: "Ansatte", v: String(deal.ansatte) },
    adresse && { k: "Adresse", v: adresse },
    deal.kommune && { k: "Kommune", v: deal.kommune },
    deal.stiftet && { k: "Stiftet", v: dato(deal.stiftet) },
    deal.mva_registrert != null && {
      k: "MVA",
      v: deal.mva_registrert ? "Registrert" : "Ikke registrert",
    },
  ].filter(Boolean) as { k: string; v: string }[];

  const tall: { k: string; v: string }[] = [
    deal.omsetning != null && { k: "Omsetning", v: `${kr(deal.omsetning)} kr` },
    deal.driftsresultat != null && { k: "Driftsresultat", v: `${kr(deal.driftsresultat)} kr` },
    deal.aarsresultat != null && { k: "Årsresultat", v: `${kr(deal.aarsresultat)} kr` },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div
      style={{
        marginTop: 12,
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setApen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="building" size={15} />
          Firmadata
          {deal.omsetning != null && deal.regnskapsaar && (
            <span style={{ fontWeight: 400, color: "var(--muted)" }}>
              · {kr(deal.omsetning)} kr i {deal.regnskapsaar}
            </span>
          )}
        </span>
        <span
          style={{
            transform: apen ? "rotate(180deg)" : "none",
            transition: "transform .15s ease",
            display: "inline-flex",
          }}
        >
          <Icon name="chevron" size={15} />
        </span>
      </button>

      {apen && (
        <div style={{ padding: "0 12px 12px" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "5px 14px",
              margin: 0,
              fontSize: 13,
            }}
          >
            {rader.map((r) => (
              <div key={r.k} style={{ display: "contents" }}>
                <dt style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{r.k}</dt>
                <dd style={{ margin: 0 }}>{r.v}</dd>
              </div>
            ))}
          </dl>

          {tall.length > 0 && (
            <>
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid var(--divider)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  color: "var(--muted)",
                }}
              >
                Regnskap {deal.regnskapsaar ?? ""}
              </div>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "5px 14px",
                  margin: "6px 0 0",
                  fontSize: 13,
                }}
              >
                {tall.map((r) => (
                  <div key={r.k} style={{ display: "contents" }}>
                    <dt style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{r.k}</dt>
                    <dd style={{ margin: 0 }}>{r.v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {deal.nettside && (
            <a
              href={`https://${deal.nettside}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 12,
                fontSize: 13,
                color: "var(--primary)",
                fontWeight: 600,
              }}
            >
              {deal.nettside}
              <Icon name="chevronr" size={13} />
            </a>
          )}

          <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--muted)" }}>
            Offentlige opplysninger fra Brønnøysundregistrene.
          </p>
        </div>
      )}
    </div>
  );
}
