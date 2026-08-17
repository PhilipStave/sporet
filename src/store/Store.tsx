"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CHANNELS,
  type Channel,
  type Stage,
} from "@/lib/constants";
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
  children,
}: {
  org: Organization;
  profile: Profile;
  departments: Department[];
  members: Member[];
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>({ type: "all" });
  const [query, setQuery] = useState("");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

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
        stage: (partial?.stage as Stage) ?? "ny",
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
    [supabase, org.id, profile.id, profile.full_name, departments, members]
  );

  const moveStage = useCallback(
    async (id: string, stage: Stage) => {
      const now = new Date().toISOString();
      const patch: Partial<Deal> = { stage, updated_at: now };
      if (stage === "vunnet") patch.won_at = now;
      if (stage === "tapt") patch.lost_at = now;
      await updateDeal(id, patch);
      if (stage === "vunnet")
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

  const deleteDeal = useCallback(
    async (id: string) => {
      setDeals((arr) => arr.filter((d) => d.id !== id));
      setSelectedDealId((cur) => (cur === id ? null : cur));
      await supabase.from("deals").delete().eq("id", id);
    },
    [supabase]
  );

  const value: StoreValue = {
    org,
    profile,
    departments,
    members,
    deals,
    loading,
    scope,
    setScope,
    query,
    setQuery,
    selectedDealId,
    setSelectedDealId,
    scopedDeals,
    deptName,
    sellerNames,
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
