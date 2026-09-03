import { createAdminClient } from "@/lib/supabase/server";
import type { NettsideDom, NettsideMeta, NettsideStatus, Nettsidevurdering } from "./nettside";

// Month-long memory of website verdicts (migration 0018). Everything here is
// best-effort: if the table is missing or the database is slow, the search
// simply fetches the sites again. A cache must never be the reason a search
// fails.

export type Lagret = Nettsidevurdering & { meta: NettsideMeta };

const DAG = 86_400_000;
/** A verdict holds for a month. */
const GYLDIG_MS = 30 * DAG;
/** "Blocked" and "unknown" are retried sooner — bot walls come and go. */
const USIKKER_MS = 3 * DAG;

type Rad = {
  domene: string;
  status: NettsideStatus;
  dom: NettsideDom;
  poeng: number;
  funn: string[];
  via: "https" | "http" | null;
  hentet_url: string | null;
  sjekket: string;
};

export async function hentLagrede(domener: string[]): Promise<Map<string, Lagret>> {
  const ut = new Map<string, Lagret>();
  if (domener.length === 0) return ut;
  try {
    const { data, error } = await createAdminClient()
      .from("nettsted")
      .select("*")
      .in("domene", domener);
    if (error || !data) return ut;
    const naa = Date.now();
    for (const r of data as Rad[]) {
      const alder = naa - new Date(r.sjekket).getTime();
      const grense = r.status === "blokkert" || r.status === "ukjent" ? USIKKER_MS : GYLDIG_MS;
      if (alder > grense) continue;
      ut.set(r.domene, {
        poeng: r.poeng,
        dom: r.dom,
        funn: r.funn ?? [],
        meta: { status: r.status, via: r.via ?? "https", sistEndret: null, url: r.hentet_url },
      });
    }
  } catch {
    // No cache is fine.
  }
  return ut;
}

export async function lagre(rader: { domene: string; v: Lagret }[]): Promise<void> {
  if (rader.length === 0) return;
  try {
    await createAdminClient()
      .from("nettsted")
      .upsert(
        rader.map(({ domene, v }) => ({
          domene,
          status: v.meta.status,
          dom: v.dom,
          poeng: v.poeng,
          funn: v.funn,
          via: v.meta.via,
          hentet_url: v.meta.url,
          sjekket: new Date().toISOString(),
        })),
        { onConflict: "domene" }
      );
  } catch {
    // Same: a failed write costs a refetch next month, nothing more.
  }
}
