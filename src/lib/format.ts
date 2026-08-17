// Norwegian (nb-NO) formatting helpers.

const nf = new Intl.NumberFormat("nb-NO");

/** 1250000 -> "1 250 000 kr" */
export function fmtKr(n: number | null | undefined): string {
  return `${nf.format(Math.round(n || 0))} kr`;
}

export function fmtNumber(n: number | null | undefined): string {
  return nf.format(Math.round(n || 0));
}

/** 1250000 -> "1,3 mill", 45000 -> "45k" — for chart axes. */
export function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} mill`;
  }
  if (abs >= 1000) return `${Math.round(n / 1000)}k`;
  return `${Math.round(n)}`;
}

export function fmtPct(n: number | null | undefined): string {
  return `${Math.round(n || 0)} %`;
}

/** Whole days between today (local midnight) and a date string / Date. */
export function diffDays(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}

/** Relative day label used for "updated" and next-step chips. */
export function dayLabel(offset: number): string {
  if (offset === 0) return "I dag";
  if (offset === 1) return "I morgen";
  if (offset === -1) return "I går";
  if (offset > 1) return `Om ${offset} dager`;
  return `${-offset} dager siden`;
}

/** Relative label derived from a real timestamp. */
export function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  return dayLabel(diffDays(iso));
}

export function fmtDateShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  } catch {
    return String(date);
  }
}

export function fmtDateLong(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return String(date);
  }
}

export function fmtTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

export function initials(name: string | null | undefined): string {
  if (!name || name === "—") return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type Period = "uke" | "mnd" | "ar" | "alle";

export const PERIOD_DAYS: Record<Period, number> = {
  uke: 7,
  mnd: 31,
  ar: 365,
  alle: 1e9,
};

/** True if a timestamp is within `period` days of now. */
export function withinPeriod(iso: string | null | undefined, period: Period): boolean {
  if (period === "alle") return true;
  if (!iso) return false;
  return Math.abs(diffDays(iso)) <= PERIOD_DAYS[period];
}
