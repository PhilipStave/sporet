"use client";

import Link from "next/link";

/** Required consent checkbox used on every signup form. Submits `acceptTerms=on`. */
export function TermsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 16,
        padding: "12px 14px",
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--bg)",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <input
        type="checkbox"
        name="acceptTerms"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "var(--primary)" }}
      />
      <span>
        Jeg har lest og godtar{" "}
        <Link href="/vilkar" target="_blank" style={{ color: "var(--primary)", fontWeight: 600 }}>
          vilkårene for bruk
        </Link>{" "}
        og{" "}
        <Link href="/personvern" target="_blank" style={{ color: "var(--primary)", fontWeight: 600 }}>
          personvernerklæringen
        </Link>

        . Jeg bekrefter at jeg har fullmakt til å binde bedriften, og er kjent
        med at ansvaret er begrenset (ingen ansvar for indirekte tap, tapte data
        eller sikkerhetshendelser utenfor Altivs kontroll, så langt loven
        tillater — beløpsbegrenset til betalt vederlag), at bedriften selv er
        ansvarlig for sikkerhetskopi og for lovlig behandling av egne kundedata,
        og at abonnementet starter automatisk etter prøveperioden hvis kort er
        registrert.
      </span>
    </label>
  );
}
