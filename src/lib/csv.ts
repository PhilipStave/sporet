import { STAGE_LABELS } from "./constants";
import type { StageMaps } from "./stages";
import type { Deal } from "@/types";

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Semicolon-separated CSV with a UTF-8 BOM, downloaded as altiv-kunder.csv. */
export function exportCustomersCsv(
  deals: Deal[],
  deptName: (id: string | null) => string,
  stageMaps?: StageMaps
) {
  const head = [
    "Selskap",
    "Kontakt",
    "Rolle",
    "E-post",
    "Telefon",
    "Steg",
    "Avdeling",
    "Selger",
    "Produkt",
    "Verdi",
    "Margin%",
    "Tags",
  ];
  const lines = [head.join(";")];
  deals.forEach((d) => {
    lines.push(
      [
        d.company,
        d.contact,
        d.contact_role,
        d.email || "",
        d.phone || "",
        stageMaps?.labels[d.stage] || STAGE_LABELS[d.stage] || d.stage,
        deptName(d.department_id),
        d.owner_name || "",
        d.product || "",
        d.value || 0,
        d.margin_pct || 0,
        (d.tags || []).join(", "),
      ]
        .map(esc)
        .join(";")
    );
  });

  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "altiv-kunder.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
