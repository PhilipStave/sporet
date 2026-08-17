"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";
import { useStore } from "@/store/Store";
import { logout } from "@/app/(auth)/actions";
import { initials } from "@/lib/format";
import { type FeatureKey } from "@/lib/constants";

interface Tab {
  id: string;
  label: string;
  icon: string;
  feature?: FeatureKey;
}

const TABS: Tab[] = [
  { id: "oversikt", label: "Oversikt", icon: "home" },
  { id: "pipeline", label: "Pipeline", icon: "list" },
  { id: "kalender", label: "Kalender", icon: "calendar", feature: "kalender" },
  { id: "statistikk", label: "Statistikk", icon: "chart", feature: "statistikk" },
  { id: "selgere", label: "Selgere", icon: "users", feature: "selgere" },
  { id: "kunder", label: "Kunder", icon: "building", feature: "kunder" },
  { id: "aktivitet", label: "Aktivitet", icon: "activity", feature: "aktivitet" },
];

export function TopNav() {
  const {
    org,
    profile,
    departments,
    scope,
    setScope,
    deals,
    sellerNames,
    setSelectedDealId,
  } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs = TABS.filter(
    (t) => !t.feature || org.features[t.feature]
  );

  const scopeOptions = useMemo(
    () => [
      { value: "all", label: "Alle avdelinger" },
      { value: "mine", label: "Bare meg" },
      ...departments.map((d) => ({ value: `dept:${d.id}`, label: d.name })),
    ],
    [departments]
  );

  const scopeValue =
    scope.type === "all"
      ? "all"
      : scope.type === "mine"
      ? "mine"
      : `dept:${scope.deptId}`;

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 62,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          height: "100%",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Link href="/app/oversikt" style={{ flexShrink: 0 }}>
          <Logo textSize={17} />
        </Link>

        {/* Tabs */}
        <nav
          className="scrollbar-thin"
          style={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            flex: 1,
            marginLeft: 6,
          }}
        >
          {tabs.map((t) => {
            const active = pathname.startsWith(`/app/${t.id}`);
            return (
              <Link
                key={t.id}
                href={`/app/${t.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 12px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  background: active ? "var(--primary-050)" : "transparent",
                  color: active ? "var(--primary)" : "var(--muted)",
                }}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <GlobalSearch
            deals={deals}
            sellerNames={sellerNames}
            departments={departments}
            features={org.features}
            onCustomer={(id) => {
              setSelectedDealId(id);
              router.push("/app/pipeline");
            }}
            onNavigate={(href) => router.push(href)}
          />

          <div className="hide-sm">
            <Dropdown
              value={scopeValue}
              options={scopeOptions}
              align="right"
              onChange={(v) => {
                if (v === "all") setScope({ type: "all" });
                else if (v === "mine") setScope({ type: "mine" });
                else setScope({ type: "dept", deptId: v.slice(5) });
              }}
            />
          </div>

          {/* Profile menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Profil"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "var(--font-heading)",
              }}
            >
              {initials(profile.full_name)}
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="animate-fade"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 220,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 12px 30px rgba(17,20,32,.14)",
                  padding: 8,
                  zIndex: 60,
                }}
              >
                <div style={{ padding: "8px 10px 10px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {profile.full_name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {profile.email}
                  </div>
                  <div
                    className="pill"
                    style={{
                      marginTop: 6,
                      background: "var(--primary-050)",
                      color: "var(--primary)",
                    }}
                  >
                    {profile.role === "admin" ? "Administrator" : "Selger"} ·{" "}
                    {org.name}
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "2px 0 6px" }} />
                {profile.role === "admin" && (
                  <Link
                    href="/app/innstillinger"
                    style={menuItemStyle}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon name="settings" size={16} /> Innstillinger
                  </Link>
                )}
                <form action={logout}>
                  <button type="submit" style={{ ...menuItemStyle, width: "100%", border: "none", background: "transparent" }}>
                    <Icon name="logout" size={16} /> Logg ut
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "9px 10px",
  borderRadius: 8,
  fontSize: 14,
  color: "var(--text)",
  cursor: "pointer",
};

// ------------------------------------------------------------
// Global search
// ------------------------------------------------------------
import type { Deal, Department } from "@/types";

const PAGES: { id: string; label: string; feature?: FeatureKey }[] = [
  { id: "oversikt", label: "Oversikt" },
  { id: "pipeline", label: "Pipeline" },
  { id: "kalender", label: "Kalender", feature: "kalender" },
  { id: "statistikk", label: "Statistikk", feature: "statistikk" },
  { id: "selgere", label: "Selgere", feature: "selgere" },
  { id: "kunder", label: "Kunder", feature: "kunder" },
  { id: "aktivitet", label: "Aktivitet", feature: "aktivitet" },
];

function GlobalSearch({
  deals,
  sellerNames,
  departments,
  features,
  onCustomer,
  onNavigate,
}: {
  deals: Deal[];
  sellerNames: string[];
  departments: Department[];
  features: Record<FeatureKey, boolean>;
  onCustomer: (id: string) => void;
  onNavigate: (href: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  type Row = { kind: string; label: string; sub?: string; run: () => void };
  const rows: Row[] = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return [];
    const out: Row[] = [];

    departments
      .filter((d) => d.name.toLowerCase().includes(s))
      .slice(0, 2)
      .forEach((d) =>
        out.push({
          kind: "Avdeling",
          label: d.name,
          sub: "Se statistikk",
          run: () => onNavigate("/app/statistikk"),
        })
      );

    sellerNames
      .filter((n) => n.toLowerCase().includes(s))
      .slice(0, 3)
      .forEach((n) =>
        out.push({
          kind: "Selger",
          label: n,
          sub: "Se salg",
          run: () => onNavigate("/app/selgere"),
        })
      );

    PAGES.filter((p) => !p.feature || features[p.feature])
      .filter((p) => p.label.toLowerCase().includes(s))
      .slice(0, 2)
      .forEach((p) =>
        out.push({
          kind: "Side",
          label: p.label,
          run: () => onNavigate(`/app/${p.id}`),
        })
      );

    const products = new Set<string>();
    deals.forEach((d) => d.product && products.add(d.product));
    [...products]
      .filter((p) => p.toLowerCase().includes(s))
      .slice(0, 2)
      .forEach((p) =>
        out.push({
          kind: "Produkt",
          label: p,
          sub: "Se kunder",
          run: () => onNavigate("/app/kunder"),
        })
      );

    deals
      .filter(
        (d) =>
          d.company.toLowerCase().includes(s) ||
          d.contact.toLowerCase().includes(s)
      )
      .slice(0, 4)
      .forEach((d) =>
        out.push({
          kind: "Kunde",
          label: d.company,
          sub: d.contact || undefined,
          run: () => onCustomer(d.id),
        })
      );

    return out.slice(0, 8);
  }, [q, deals, sellerNames, departments, features, onCustomer, onNavigate]);

  return (
    <div ref={ref} style={{ position: "relative" }} className="hide-sm">
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            pointerEvents: "none",
          }}
        >
          <Icon name="search" size={15} />
        </span>
        <input
          className="field-input"
          value={q}
          placeholder="Søk …"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 190, paddingLeft: 32, borderRadius: 999 }}
        />
      </div>
      {open && rows.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-fade"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 320,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 12px 30px rgba(17,20,32,.14)",
            padding: 6,
            zIndex: 60,
          }}
        >
          {rows.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                r.run();
                setOpen(false);
                setQ("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.label}
                </span>
                {r.sub && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {r.sub}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: ".04em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                {r.kind}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
