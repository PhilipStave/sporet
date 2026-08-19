// Per-organisation pipeline stage configuration.
// The Store provides `stages` (ordered) and these helpers derive everything
// components need — so nothing else hardcodes stage keys except WON/LOST.

import type { PipelineStageRow } from "@/types/database";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  ACTIVE_STAGES,
  WON_KEY,
  LOST_KEY,
} from "./constants";

export type StageConfig = Pick<
  PipelineStageRow,
  "id" | "key" | "label" | "color" | "position" | "is_system" | "counts_as_open"
>;

/** Built-in defaults, used for new orgs and as a fallback. */
export const DEFAULT_STAGES: StageConfig[] = STAGE_ORDER.map((key, i) => ({
  id: `default-${key}`,
  key,
  label: STAGE_LABELS[key as keyof typeof STAGE_LABELS],
  color: STAGE_COLORS[key as keyof typeof STAGE_COLORS],
  position: i,
  is_system: key === WON_KEY || key === LOST_KEY,
  counts_as_open: ACTIVE_STAGES.includes(key),
}));

export interface StageMaps {
  /** Ordered stage list. */
  list: StageConfig[];
  order: string[];
  labels: Record<string, string>;
  colors: Record<string, string>;
  /** Keys counted as "open pipeline". */
  open: string[];
  /** First open stage — default for new deals. */
  firstKey: string;
  byKey: Record<string, StageConfig>;
}

export function buildStageMaps(stages: StageConfig[] | null | undefined): StageMaps {
  const list = (stages && stages.length ? [...stages] : DEFAULT_STAGES).sort(
    (a, b) => a.position - b.position
  );
  const labels: Record<string, string> = {};
  const colors: Record<string, string> = {};
  const byKey: Record<string, StageConfig> = {};
  list.forEach((s) => {
    labels[s.key] = s.label;
    colors[s.key] = s.color;
    byKey[s.key] = s;
  });
  const open = list.filter((s) => s.counts_as_open).map((s) => s.key);
  return {
    list,
    order: list.map((s) => s.key),
    labels,
    colors,
    open,
    firstKey: open[0] || list[0]?.key || "ny",
    byKey,
  };
}

/** Label for a key even if the org has since deleted that stage. */
export function stageLabel(maps: StageMaps, key: string): string {
  return maps.labels[key] ?? STAGE_LABELS[key as keyof typeof STAGE_LABELS] ?? key;
}
export function stageColor(maps: StageMaps, key: string): string {
  return maps.colors[key] ?? STAGE_COLORS[key as keyof typeof STAGE_COLORS] ?? "#64748b";
}

/** Generate a URL-safe, unique key from a label. */
export function keyFromLabel(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[æ]/g, "ae")
      .replace(/[ø]/g, "o")
      .replace(/[å]/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "steg";
  let key = base;
  let n = 2;
  while (taken.includes(key)) key = `${base}-${n++}`;
  return key;
}

export const STAGE_PALETTE = [
  "#64748b", "#0ea5e9", "#6366f1", "#8b5cf6", "#f59e0b",
  "#059669", "#dc2626", "#94a3b8", "#0d9488", "#d97706",
  "#ec4899", "#14b8a6", "#84cc16", "#f97316",
];
