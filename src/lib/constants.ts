// Domain constants for Sporet CRM — mirrors the design handoff spec.

export type Stage =
  | "ny"
  | "kontaktet"
  | "dialog"
  | "tilbud"
  | "forhandling"
  | "vunnet"
  | "tapt"
  | "ikkesvart";

export type Channel = "telefon" | "epost" | "sms" | "mote";

export type Role = "admin" | "seller";

export type FeatureKey =
  | "kalender"
  | "statistikk"
  | "selgere"
  | "kunder"
  | "aktivitet";

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
  kunder: true,
  aktivitet: true,
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  kalender: "Kalender",
  statistikk: "Statistikk",
  selgere: "Selgere",
  kunder: "Kunder",
  aktivitet: "Aktivitet",
};

export const FEATURE_ORDER: FeatureKey[] = [
  "kalender",
  "statistikk",
  "selgere",
  "kunder",
  "aktivitet",
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
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    background: `${color}1f`,
    color,
  };
}
