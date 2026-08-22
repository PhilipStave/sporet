"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { computeAccess } from "@/lib/billing";
import {
  CHANNELS,
  WON_KEY,
  LOST_KEY,
  type Channel,
  type Stage,
} from "@/lib/constants";
import {
  buildStageMaps,
  keyFromLabel,
  type StageConfig,
  type StageMaps,
} from "@/lib/stages";
import type {
  Deal,
  Organization,
  Profile,
  Department,
  Member,
  ActivityRow,
} from "@/types";

export type Scope =
  | { type: "all" }
  | { type: "mine" }
  | { type: "dept"; deptId: string };

interface StoreValue {
  org: Organization;
  profile: Profile;
  departments: Department[];
  members: Member[];
  deals: Deal[];
  loading: boolean;
  /** False when the org's trial/subscription has lapsed (read-only mode). */
  canWrite: boolean;
  /** Just-deleted customer awaiting the undo window (for the toast). */
  pendingDelete: Deal | null;
  undoDelete: (id: string) => void;
  /** Append an entry to a customer's activity log. */
  logActivity: (dealId: string, a: { icon: string; label: string; note: string }) => Promise<void>;

  scope: Scope;
  setScope: (s: Scope) => void;
  query: string;
  setQuery: (q: string) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;

  /** Deals visible under the current scope. */
  scopedDeals: Deal[];
  deptName: (id: string | null) => string;
  sellerNames: string[];

  /** Pipeline stages for this org (ordered) + derived lookups. */
  stages: StageConfig[];
  stageMaps: StageMaps;
  addStage: (label: string, color: string, countsAsOpen: boolean) => Promise<string | null>;
  updateStage: (id: string, patch: Partial<Pick<StageConfig, "label" | "color" | "counts_as_open">>) => Promise<string | null>;
  deleteStage: (id: string) => Promise<string | null>;
  moveStageOrder: (id: string, dir: -1 | 1) => Promise<void>;

  createDeal: (partial?: Partial<Deal>) => Promise<string | null>;
  updateDeal: (id: string, patch: Partial<Deal>) => Promise<void>;
  moveStage: (id: string, stage: Stage) => Promise<void>;
  logContact: (id: string, channel: Channel) => Promise<void>;
  markNextDone: (id: string) => Promise<void>;
  clearNextStep: (id: string) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

const DEAL_SELECT =
  "*, activities(id, deal_id, org_id, actor_id, actor_name, icon, label, note, created_at)";

function sortActivities(d: Deal): Deal {
  return {
    ...d,
    activities: [...(d.activities || [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
  };
}

export function StoreProvider({
  org,
  profile,
  departments,
  members,
  stages: initialStages,
  children,
}: {
  org: Organization;
  profile: Profile;
  departments: Department[];
  members: Member[];
  stages: StageConfig[];
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>({ type: "all" });
  const [query, setQuery] = useState("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [stages, setStages] = useState<StageConfig[]>(initialStages);
  const stageMaps = useMemo(() => buildStageMaps(stages), [stages]);

  // ---- stage admin (RLS restricts writes to admins) ----
  const addStage = useCallback(
    async (label: string, color: string, countsAsOpen: boolean) => {
      const name = label.trim();
      if (!name) return "Skriv inn et navn.";
      const key = keyFromLabel(name, stages.map((s) => s.key));
      // Insert before the system stages (won/lost) so new steps land in the flow.
      const firstSystem = stages.find((s) => s.is_system);
      const position = firstSystem ? firstSystem.position : stages.length;
      const { data, error } = await supabase
        .from("pipeline_stages")
        .insert({ org_id: org.id, key, label: name, color, position, counts_as_open: countsAsOpen })
        .select("id, key, label, color, position, is_system, counts_as_open")
        .single();
      if (error || !data) return error?.message || "Kunne ikke legge til steg.";
      // Shift later stages down by one to keep positions unique & ordered.
      const shifted = stages.map((s) =>
        s.position >= position ? { ...s, position: s.position + 1 } : s
      );
      const next = [...shifted, data as StageConfig].sort((a, b) => a.position - b.position);
      setStages(next);
      await Promise.all(
        shifted
          .filter((s) => s.position >= position + 1)
          .map((s) => supabase.from("pipeline_stages").update({ position: s.position }).eq("id", s.id))
      );
      return null;
    },
    [supabase, org.id, stages]
  );

  const updateStage = useCallback(
    async (id: string, patch: Partial<Pick<StageConfig, "label" | "color" | "counts_as_open">>) => {
      const clean = { ...patch };
      if (clean.label !== undefined) {
        clean.label = clean.label.trim();
        if (!clean.label) return "Navnet kan ikke være tomt.";
      }
      setStages((cur) => cur.map((s) => (s.id === id ? { ...s, ...clean } : s)));
      const { error } = await supabase.from("pipeline_stages").update(clean).eq("id", id);
      return error ? error.message : null;
    },
    [supabase]
  );

  const deleteStage = useCallback(
    async (id: string) => {
      const st = stages.find((s) => s.id === id);
      if (!st) return "Fant ikke steget.";
      if (st.is_system) return "«Vunnet» og «Tapt» kan gis nytt navn, men ikke slettes.";
      const remaining = stages.filter((s) => s.id !== id);
      if (!remaining.some((s) => s.counts_as_open))
        return "Det må finnes minst ett åpent steg.";
      // Move deals in this stage to the first open stage.
      const target = buildStageMaps(remaining).firstKey;
      const affected = deals.filter((d) => d.stage === st.key);
      setDeals((cur) => cur.map((d) => (d.stage === st.key ? { ...d, stage: target } : d)));
      setStages(remaining);
      if (affected.length) {
        await supabase.from("deals").update({ stage: target }).eq("stage", st.key).eq("org_id", org.id);
      }
      const { error } = await supabase.from("pipeline_stages").delete().eq("id", id);
      return error ? error.message : null;
    },
    [supabase, org.id, stages, deals]
  );

  const moveStageOrder = useCallback(
    async (id: string, dir: -1 | 1) => {
      const sorted = [...stages].sort((a, b) => a.position - b.position);
      const i = sorted.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return;
      const a = sorted[i];
      const b = sorted[j];
      const next = sorted.map((s) =>
        s.id === a.id ? { ...s, position: b.position } : s.id === b.id ? { ...s, position: a.position } : s
      );
      setStages(next);
      await Promise.all([
        supabase.from("pipeline_stages").update({ position: b.position }).eq("id", a.id),
        supabase.from("pipeline_stages").update({ position: a.position }).eq("id", b.id),
      ]);
    },
    [supabase, stages]
  );

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("deals")
      .select(DEAL_SELECT)
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setDeals((data as unknown as Deal[]).map(sortActivities));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Initial data load — async fetch that sets state after awaiting (external sync).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const deptName = useCallback(
    (id: string | null) =>
      departments.find((d) => d.id === id)?.name ?? "—",
    [departments]
  );

  const scopedDeals = useMemo(() => {
    if (scope.type === "mine")
      return deals.filter((d) => d.owner_id === profile.id);
    if (scope.type === "dept")
      return deals.filter((d) => d.department_id === scope.deptId);
    return deals;
  }, [deals, scope, profile.id]);

  const sellerNames = useMemo(() => {
    const set = new Set<string>();
    members
      .filter((m) => m.status !== "pending")
      .forEach((m) => m.full_name && set.add(m.full_name));
    deals.forEach((d) => d.owner_name && set.add(d.owner_name));
    return [...set].sort((a, b) => a.localeCompare(b, "nb"));
  }, [members, deals]);

  // ---- mutations -------------------------------------------------

  const patchLocal = useCallback((id: string, patch: Partial<Deal>) => {
    setDeals((arr) =>
      arr.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  }, []);

  const updateDeal = useCallback(
    async (id: string, patch: Partial<Deal>) => {
      patchLocal(id, patch);
      // Strip nested/client-only fields before writing.
      const { activities, ...rest } = patch as Deal;
      void activities;
      await supabase.from("deals").update(rest).eq("id", id);
    },
    [supabase, patchLocal]
  );

  const insertActivity = useCallback(
    async (
      dealId: string,
      a: { icon: string; label: string; note: string }
    ) => {
      const now = new Date().toISOString();
      const row: ActivityRow = {
        id: `tmp-${now}-${Math.round(performance.now())}`,
        deal_id: dealId,
        org_id: org.id,
        actor_id: profile.id,
        actor_name: profile.full_name,
        icon: a.icon,
        label: a.label,
        note: a.note,
        created_at: now,
      };
      setDeals((arr) =>
        arr.map((d) =>
          d.id === dealId
            ? { ...d, activities: [row, ...(d.activities || [])] }
            : d
        )
      );
      const { data } = await supabase
        .from("activities")
        .insert({
          deal_id: dealId,
          org_id: org.id,
          actor_id: profile.id,
          actor_name: profile.full_name,
          icon: a.icon,
          label: a.label,
          note: a.note,
        })
        .select()
        .single();
      if (data) {
        setDeals((arr) =>
          arr.map((d) =>
            d.id === dealId
              ? {
                  ...d,
                  activities: (d.activities || []).map((x) =>
                    x.id === row.id ? (data as ActivityRow) : x
                  ),
                }
              : d
          )
        );
      }
    },
    [supabase, org.id, profile.id, profile.full_name]
  );

  const createDeal = useCallback(
    async (partial?: Partial<Deal>) => {
      const now = new Date().toISOString();
      const defaultDept =
        (members.find((m) => m.id === profile.id)?.department_ids[0]) ||
        departments[0]?.id ||
        null;
      const insert = {
        org_id: org.id,
        department_id: partial?.department_id ?? defaultDept,
        owner_id: partial?.owner_id ?? profile.id,
        owner_name: partial?.owner_name ?? profile.full_name,
        company: partial?.company ?? "",
        contact: partial?.contact ?? "",
        contact_role: partial?.contact_role ?? "",
        email: partial?.email ?? "",
        phone: partial?.phone ?? "",
        product: partial?.product ?? "",
        value: partial?.value ?? 0,
        margin_pct: partial?.margin_pct ?? 0,
        stage: (partial?.stage as Stage) ?? stageMaps.firstKey,
        channel: (partial?.channel as Channel) ?? "epost",
        tags: partial?.tags ?? [],
        notes: partial?.notes ?? "",
        created_by: profile.id,
        created_at: now,
        updated_at: now,
      };
      const { data, error } = await supabase
        .from("deals")
        .insert(insert)
        .select(DEAL_SELECT)
        .single();
      if (error || !data) {
        console.error("createDeal failed:", error);
        if (typeof window !== "undefined")
          window.alert(
            "Kunne ikke opprette kunde:\n" +
              (error?.message || "ukjent feil") +
              (error?.code ? ` (kode ${error.code})` : "")
          );
        return null;
      }
      const deal = sortActivities(data as unknown as Deal);
      setDeals((arr) => [deal, ...arr]);
      return deal.id;
    },
    [supabase, org.id, profile.id, profile.full_name, departments, members, stageMaps.firstKey]
  );

  const moveStage = useCallback(
    async (id: string, stage: Stage) => {
      const now = new Date().toISOString();
      const patch: Partial<Deal> = { stage, updated_at: now };
      if (stage === WON_KEY) patch.won_at = now;
      if (stage === LOST_KEY) patch.lost_at = now;
      await updateDeal(id, patch);
      if (stage === WON_KEY)
        await insertActivity(id, {
          icon: "check",
          label: "Vunnet",
          note: "Salget ble vunnet",
        });
    },
    [updateDeal, insertActivity]
  );

  const logContact = useCallback(
    async (id: string, channel: Channel) => {
      const meta = CHANNELS[channel];
      await updateDeal(id, {
        channel,
        updated_at: new Date().toISOString(),
      });
      await insertActivity(id, {
        icon: meta.icon,
        label: meta.label,
        note: "Kontaktet via " + meta.label,
      });
    },
    [updateDeal, insertActivity]
  );

  const markNextDone = useCallback(
    async (id: string) => {
      const deal = deals.find((d) => d.id === id);
      const note = deal?.next_step_text || "Steg fullført";
      await updateDeal(id, {
        next_step_text: null,
        next_step_date: null,
        next_step_time: null,
        next_step_who: null,
        updated_at: new Date().toISOString(),
      });
      await insertActivity(id, { icon: "check", label: "Fullført", note });
    },
    [deals, updateDeal, insertActivity]
  );

  const clearNextStep = useCallback(
    async (id: string) => {
      await updateDeal(id, {
        next_step_text: null,
        next_step_date: null,
        next_step_time: null,
        next_step_who: null,
      });
    },
    [updateDeal]
  );

  // Soft delete: the card disappears immediately, but the row is only deleted after a
  // short undo window (so activities/documents survive an "Angre").
  const deleteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [pendingDelete, setPendingDelete] = useState<Deal | null>(null);
  const deleteDeal = useCallback(
    async (id: string) => {
      const deal = deals.find((d) => d.id === id);
      if (!deal) return;
      setDeals((arr) => arr.filter((d) => d.id !== id));
      setSelectedDealId((cur) => (cur === id ? null : cur));
      setPendingDelete(deal);
      const t = setTimeout(async () => {
        deleteTimers.current.delete(id);
        setPendingDelete((cur) => (cur?.id === id ? null : cur));
        await supabase.from("deals").delete().eq("id", id);
      }, 6000);
      deleteTimers.current.set(id, t);
    },
    [supabase, deals]
  );
  const undoDelete = useCallback((id: string) => {
    const t = deleteTimers.current.get(id);
    if (t) clearTimeout(t);
    deleteTimers.current.delete(id);
    setPendingDelete((cur) => {
      if (cur?.id === id) {
        setDeals((arr) => (arr.some((d) => d.id === id) ? arr : [cur, ...arr]));
        return null;
      }
      return cur;
    });
  }, []);

  const canWrite = computeAccess(org).canWrite;

  const value: StoreValue = {
    org,
    profile,
    departments,
    members,
    deals,
    loading,
    canWrite,
    logActivity: insertActivity,
    pendingDelete,
    undoDelete,
    scope,
    setScope,
    query,
    setQuery,
    selectedDealId,
    setSelectedDealId,
    scopedDeals,
    deptName,
    sellerNames,
    stages,
    stageMaps,
    addStage,
    updateStage,
    deleteStage,
    moveStageOrder,
    createDeal,
    updateDeal,
    moveStage,
    logContact,
    markNextDone,
    clearNextStep,
    deleteDeal,
    refresh,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
