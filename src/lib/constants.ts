// Domain constants for Altiv CRM — mirrors the design handoff spec.
// Stages are now customisable per organisation (see lib/stages.ts); the
// values below are the DEFAULTS a new company starts with, and the fallback
// when an org has no custom stages configured.

/** A stage key. Built-in defaults are listed, but orgs may add their own. */
export type Stage = string;

/** System stage keys that always exist (renamable, never deletable). */
export const WON_KEY = "vunnet";
export const LOST_KEY = "tapt";

export type Channel = "telefon" | "epost" | "sms" | "mote";

export type Role = "admin" | "seller";

export type FeatureKey =
  | "kalender"
  | "statistikk"
  | "selgere"
  | "avdelinger"
  | "kunder"
  | "aktivitet"
  | "finnkunder"
  | "anbud";

/** Fixed stage order used across board and lists. */
export const STAGE_ORDER: Stage[] = [
  "ny",
  "kontaktet",
  "dialog",
  "tilbud",
  "forhandling",
  "vunnet",
  "tapt",
  "ikkesvart",
];

/** Stages considered "open" / active pipeline. */
export const ACTIVE_STAGES: Stage[] = [
  "ny",
  "kontaktet",
  "dialog",
  "tilbud",
  "forhandling",
];

export const STAGE_LABELS: Record<Stage, string> = {
  ny: "Potensiell kunde",
  kontaktet: "Kontaktet",
  dialog: "I dialog",
  tilbud: "Tilbud sendt",
  forhandling: "Forhandling",
  vunnet: "Vunnet",
  tapt: "Tapt",
  ikkesvart: "Ikke svart",
};

export const STAGE_COLORS: Record<Stage, string> = {
  ny: "#64748b",
  kontaktet: "#0ea5e9",
  dialog: "#6366f1",
  tilbud: "#8b5cf6",
  forhandling: "#f59e0b",
  vunnet: "#059669",
  tapt: "#dc2626",
  ikkesvart: "#94a3b8",
};

/** Probability weights used for weighted pipeline value. */
export const STAGE_PROB: Partial<Record<Stage, number>> = {
  ny: 0.1,
  kontaktet: 0.25,
  dialog: 0.4,
  tilbud: 0.6,
  forhandling: 0.8,
};

export const CHANNELS: Record<Channel, { label: string; icon: string }> = {
  telefon: { label: "Telefon", icon: "phone" },
  epost: { label: "E-post", icon: "mail" },
  sms: { label: "SMS", icon: "message" },
  mote: { label: "Møte", icon: "users" },
};

export const CHANNEL_ORDER: Channel[] = ["telefon", "epost", "sms", "mote"];

export const TAG_LIST = [
  "Kommune",
  "Privat",
  "Nøkkelkunde",
  "Varm",
  "Kald",
  "Anbud",
];

export const LOST_REASONS = [
  "Pris",
  "Konkurrent",
  "Timing",
  "Budsjett",
  "Ingen respons",
  "Annet",
];

export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  kalender: true,
  statistikk: true,
  selgere: true,
  avdelinger: true,
  kunder: true,
  aktivitet: true,
  finnkunder: true,
  anbud: true,
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  kalender: "Kalender",
  statistikk: "Statistikk",
  selgere: "Selgere",
  avdelinger: "Avdelinger",
  kunder: "Kunder",
  aktivitet: "Aktivitet",
  finnkunder: "Finn kunder",
  anbud: "Anbud",
};

export const FEATURE_ORDER: FeatureKey[] = [
  "kalender",
  "statistikk",
  "selgere",
  "avdelinger",
  "kunder",
  "aktivitet",
  "finnkunder",
  "anbud",
];

/** Activity kinds beyond channels. */
export const ACTIVITY_ICONS: Record<string, string> = {
  phone: "phone",
  mail: "mail",
  message: "message",
  users: "users",
  check: "check",
  upload: "upload",
  edit: "edit",
  next: "clock",
};

export function stageColor(stage: Stage): string {
  return STAGE_COLORS[stage] ?? "#64748b";
}

export function pillStyle(color: string): React.CSSProperties {
  // Works for hex colours (#rrggbb → 12% tint) and CSS variables (color-mix).
  const bg = color.startsWith("#")
    ? `${color}1f`
    : `color-mix(in srgb, ${color} 14%, transparent)`;
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    background: bg,
    color,
  };
}
