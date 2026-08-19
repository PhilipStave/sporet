import { ACTIVE_STAGES, STAGE_PROB, WON_KEY, LOST_KEY, type Stage } from "./constants";
import { diffDays, type Period, PERIOD_DAYS } from "./format";
import type { Deal } from "@/types";

/** Open = in one of the org's "counts as open" stages (defaults to built-ins). */
export const isOpenIn = (openKeys: string[]) => (d: Deal) => openKeys.includes(d.stage);
export const isOpen = isOpenIn(ACTIVE_STAGES);

/** Timestamp that represents the last meaningful change for period filtering. */
export function stageTime(d: Deal): string {
  if (d.stage === WON_KEY) return d.won_at || d.updated_at;
  if (d.stage === LOST_KEY) return d.lost_at || d.updated_at;
  return d.updated_at;
}

export function withinDays(d: Deal, period: Period): boolean {
  if (period === "alle") return true;
  return Math.abs(diffDays(stageTime(d))) <= PERIOD_DAYS[period];
}

export interface Overview {
  openDeals: Deal[];
  pipelineValue: number;
  weightedValue: number;
  won: Deal[];
  lost: Deal[];
  noReply: Deal[];
  winRate: number;
  avgMarginPct: number;
  marginTotal: number;
  avgDeal: number;
  avgBase: Deal[];
  dueList: Deal[];
}

/**
 * @param openKeys  the org's open-stage keys, in pipeline order
 * @param lateKeys  stages considered "late" for Snittverdi (default: last two open stages)
 */
export function computeOverview(
  deals: Deal[],
  openKeys: string[] = ACTIVE_STAGES,
  lateKeys?: string[]
): Overview {
  const openDeals = deals.filter(isOpenIn(openKeys));
  const pipelineValue = openDeals.reduce((a, d) => a + (d.value || 0), 0);
  const weightedValue = openDeals.reduce(
    (a, d) => a + (d.value || 0) * (STAGE_PROB[d.stage] || 0),
    0
  );
  const won = deals.filter((d) => d.stage === WON_KEY);
  const lost = deals.filter((d) => d.stage === LOST_KEY);
  const noReply = deals.filter((d) => d.stage === "ikkesvart");
  const late = lateKeys ?? openKeys.slice(-2);

  const winRate =
    won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0;

  const marginBase = won.filter((d) => d.value > 0);
  const marTotV = marginBase.reduce((a, d) => a + d.value, 0);
  const marTotM = marginBase.reduce(
    (a, d) => a + d.value * ((d.margin_pct || 0) / 100),
    0
  );
  const avgMarginPct = marTotV > 0 ? Math.round((marTotM / marTotV) * 100) : 0;

  const avgBase = deals.filter((d) => late.includes(d.stage));
  const avgDeal = avgBase.length
    ? Math.round(avgBase.reduce((a, d) => a + (d.value || 0), 0) / avgBase.length)
    : 0;

  const dueList = openDeals.filter(
    (d) => d.next_step_date && diffDays(d.next_step_date) <= 0
  );

  return {
    openDeals,
    pipelineValue,
    weightedValue,
    won,
    lost,
    noReply,
    winRate,
    avgMarginPct,
    marginTotal: marTotM,
    avgDeal,
    avgBase,
    dueList,
  };
}

export interface SellerAgg {
  name: string;
  count: number;
  total: number;
  margin: number;
  marginPct: number;
}

/** Aggregate won deals by seller (owner_name). */
export function sellersFromWon(
  deals: Deal[],
  extraNames: string[] = []
): SellerAgg[] {
  const by: Record<string, SellerAgg> = {};
  extraNames.forEach((n) => {
    if (n) by[n] = { name: n, count: 0, total: 0, margin: 0, marginPct: 0 };
  });
  deals
    .filter((d) => d.stage === WON_KEY)
    .forEach((d) => {
      const n = (d.owner_name || "").trim() || "Ukjent";
      const o = (by[n] = by[n] || {
        name: n,
        count: 0,
        total: 0,
        margin: 0,
        marginPct: 0,
      });
      o.count++;
      o.total += d.value || 0;
      o.margin += (d.value || 0) * ((d.margin_pct || 0) / 100);
    });
  return Object.values(by)
    .map((s) => ({
      ...s,
      marginPct: s.total > 0 ? Math.round((s.margin / s.total) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        Number(b.count > 0) - Number(a.count > 0) ||
        b.total - a.total ||
        a.name.localeCompare(b.name, "nb")
    );
}

export const stageCount = (deals: Deal[], stage: Stage) =>
  deals.filter((d) => d.stage === stage).length;
