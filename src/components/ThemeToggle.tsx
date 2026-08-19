"use client";

import { useTheme, type ThemePref } from "./ThemeProvider";

const OPTIONS: { id: ThemePref; label: string; icon: React.ReactNode }[] = [
  {
    id: "light",
    label: "Lys",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    id: "dark",
    label: "Mørk",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
  {
    id: "system",
    label: "Auto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </svg>
    ),
  },
];

/** Three-way theme switch: Lys / Mørk / Auto (follows the OS). */
export function ThemeToggle() {
  const { pref, setPref } = useTheme();
  return (
    <div
      className="pillgroup"
      role="radiogroup"
      aria-label="Fargetema"
      style={{ width: "100%", justifyContent: "space-between" }}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={pref === o.id}
          data-active={pref === o.id}
          onClick={() => setPref(o.id)}
          style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
