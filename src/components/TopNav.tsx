"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { Dropdown } from "./Dropdown";
import { useStore } from "@/store/Store";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
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
  { id: "avdelinger", label: "Avdelinger", icon: "org", feature: "avdelinger" },
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
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const behovRef = useRef(0);
  const [kompakt, setKompakt] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Orgs created before a feature existed have no flag for it — treat missing as enabled.
  const tabs = TABS.filter((t) => !t.feature || org.features[t.feature] !== false);

  // Labels collapse to icons only when they genuinely do not fit.
  //
  // Two traps here, both hit on the first attempt:
  //   scrollWidth is never smaller than clientWidth, so a comfortably fitting
  //   row measured as "exactly full" and collapsed itself; the children are
  //   summed instead. And the measurement must happen in the labelled state, so
  //   the class is lifted for the measure and restored before paint.
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const maalBehov = () => {
      const varKompakt = el.classList.contains("nav-kompakt");
      if (varKompakt) el.classList.remove("nav-kompakt");
      const barn = Array.from(el.children) as HTMLElement[];
      const bredde =
        barn.reduce((n, b) => n + b.offsetWidth, 0) + 3 * Math.max(0, barn.length - 1);
      if (varKompakt) el.classList.add("nav-kompakt");
      return bredde;
    };

    const vurder = () => {
      const behov = maalBehov();
      if (!behov) return;
      behovRef.current = behov;
      setKompakt(el.clientWidth < behov);
    };
    vurder();

    // Web fonts land after first paint and change every label's width.
    document.fonts?.ready.then(vurder);

    const ro = new ResizeObserver(vurder);
    ro.observe(el);
    return () => ro.disconnect();
    // Tab count changes when features are toggled, so re-measure from scratch.
  }, [tabs.length]);

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
          maxWidth: 1600,
          margin: "0 auto",
          height: "100%",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link href="/app/oversikt" style={{ flexShrink: 0 }}>
          <Logo textSize={17} />
        </Link>

        {/* Tabs */}
        <nav
          ref={navRef}
          className={"scrollbar-thin nav-tabs" + (kompakt ? " nav-kompakt" : "")}
          style={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            flex: 1,
            minWidth: 0,
            marginLeft: 6,
          }}
        >
          {tabs.map((t) => {
            const active = pathname.startsWith(`/app/${t.id}`);
            return (
              <Link
                key={t.id}
                href={`/app/${t.id}`}
                className="nav-tab"
                data-active={active}
                title={t.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  // Tabs must keep their natural width. As shrinkable flex items
                  // they squeezed to fit and clipped their own text, and the
                  // measurement could never see that the row was too wide.
                  flexShrink: 0,
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
                <span className="nav-tab-label">{t.label}</span>
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
                  width: 280,
                  maxWidth: "calc(100vw - 24px)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 12px 30px rgba(17,20,32,.14)",
                  padding: 8,
                  zIndex: 60,
                }}
              >
                <div style={{ padding: "8px 10px 10px", minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profile.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profile.email}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-block",
                      maxWidth: "100%",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      background: "var(--primary-050)",
                      color: "var(--primary)",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {profile.role === "admin" ? "Administrator" : "Selger"} ·{" "}
                    {org.name}
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "2px 0 6px" }} />
                <div style={{ padding: "4px 6px 8px" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      color: "var(--muted)",
                      marginBottom: 6,
                    }}
                  >
                    Fargetema
                  </div>
                  <ThemeToggle />
                </div>
                <div style={{ height: 1, background: "var(--border)", margin: "2px 0 6px" }} />
                <Link
                  href="/app/innstillinger"
                  className="menu-item"
                  style={menuItemStyle}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="settings" size={16} /> Innstillinger
                </Link>
                {profile.is_superadmin && (
                  <Link
                    href="/admin"
                    className="menu-item"
                    style={menuItemStyle}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon name="grid" size={16} /> Altiv-administrasjon
                  </Link>
                )}
                <button
                  type="button"
                  className="menu-item"
                  disabled={loggingOut}
                  onClick={async () => {
                    setLoggingOut(true);
                    // Sign out client-side (clears the session cookies), then go to login.
                    await supabase.auth.signOut({ scope: "global" });
                    router.replace("/login");
                    router.refresh();
                  }}
                  style={{
                    ...menuItemStyle,
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    opacity: loggingOut ? 0.6 : 1,
                  }}
                >
                  <Icon name="logout" size={16} />{" "}
                  {loggingOut ? "Logger ut …" : "Logg ut"}
                </button>
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
    <div ref={ref} style={{ position: "relative" }} className="hide-sm top-search">
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
