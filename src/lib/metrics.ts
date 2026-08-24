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

export interface DeptAgg {
  id: string;
  name: string;
  /** Won deals in the period. */
  count: number;
  total: number;
  margin: number;
  marginPct: number;
  /** Open pipeline right now (not period-filtered stages). */
  openCount: number;
  openValue: number;
  /** Lost deals in the period + win rate. */
  lostCount: number;
  winRate: number;
  avgValue: number;
  /** Distinct sellers with a won deal, and the best of them. */
  sellerCount: number;
  topSeller: string | null;
  topSellerTotal: number;
}

/**
 * Aggregate per department: won revenue/margin in the period, plus the currently
 * open pipeline. `openDeals` is unfiltered by period so "in pipeline" stays truthful.
 */
export function departmentsAgg(
  periodDeals: Deal[],
  openDeals: Deal[],
  departments: { id: string; name: string }[],
  openKeys: string[]
): DeptAgg[] {
  const blank = (id: string, name: string): DeptAgg => ({
    id,
    name,
    count: 0,
    total: 0,
    margin: 0,
    marginPct: 0,
    openCount: 0,
    openValue: 0,
    lostCount: 0,
    winRate: 0,
    avgValue: 0,
    sellerCount: 0,
    topSeller: null,
    topSellerTotal: 0,
  });

  const by: Record<string, DeptAgg> = {};
  departments.forEach((d) => (by[d.id] = blank(d.id, d.name)));
  const UNASSIGNED = "__none";
  const get = (id: string | null) => {
    const key = id ?? UNASSIGNED;
    if (!by[key]) by[key] = blank(key, key === UNASSIGNED ? "Uten avdeling" : "Ukjent");
    return by[key];
  };

  // Per-department seller totals, to find the top performer.
  const sellerTotals: Record<string, Record<string, number>> = {};

  periodDeals.forEach((d) => {
    const agg = get(d.department_id);
    if (d.stage === WON_KEY) {
      agg.count++;
      agg.total += d.value || 0;
      agg.margin += (d.value || 0) * ((d.margin_pct || 0) / 100);
      const seller = (d.owner_name || "").trim() || "Ukjent";
      const t = (sellerTotals[agg.id] = sellerTotals[agg.id] || {});
      t[seller] = (t[seller] || 0) + (d.value || 0);
    } else if (d.stage === LOST_KEY) {
      agg.lostCount++;
    }
  });

  openDeals.forEach((d) => {
    if (!openKeys.includes(d.stage)) return;
    const agg = get(d.department_id);
    agg.openCount++;
    agg.openValue += d.value || 0;
  });

  return Object.values(by)
    .map((a) => {
      const sellers = sellerTotals[a.id] || {};
      const top = Object.entries(sellers).sort((x, y) => y[1] - x[1])[0];
      const decided = a.count + a.lostCount;
      return {
        ...a,
        marginPct: a.total > 0 ? Math.round((a.margin / a.total) * 100) : 0,
        avgValue: a.count > 0 ? Math.round(a.total / a.count) : 0,
        winRate: decided > 0 ? Math.round((a.count / decided) * 100) : 0,
        sellerCount: Object.keys(sellers).length,
        topSeller: top ? top[0] : null,
        topSellerTotal: top ? top[1] : 0,
      };
    })
    .sort(
      (a, b) =>
        Number(b.count > 0) - Number(a.count > 0) ||
        b.total - a.total ||
        a.name.localeCompare(b.name, "nb")
    );
}
