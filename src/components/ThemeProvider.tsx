"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
const STORAGE_KEY = "altiv.theme";

interface ThemeCtx {
  pref: ThemePref;
  resolved: "light" | "dark";
  setPref: (p: ThemePref) => void;
}

const Ctx = createContext<ThemeCtx>({
  pref: "system",
  resolved: "light",
  setPref: () => {},
});

export function useTheme() {
  return useContext(Ctx);
}

function systemDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(pref: ThemePref): "light" | "dark" {
  const resolved: "light" | "dark" =
    pref === "system" ? (systemDark() ? "dark" : "light") : pref;
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

// Default is LIGHT. "Auto" (follow the OS) is opt-in.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial state mirrors what the no-flash script already set on <html>.
  const [pref, setPrefState] = useState<ThemePref>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemePref | null;
    return saved === "dark" || saved === "system" ? saved : "light";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  });

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    if (p === "light") window.localStorage.removeItem(STORAGE_KEY); // light = default
    else window.localStorage.setItem(STORAGE_KEY, p);
    setResolved(apply(p));
  }, []);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  return <Ctx.Provider value={{ pref, resolved, setPref }}>{children}</Ctx.Provider>;
}

/** Inline, runs before paint: sets data-theme so there is no light→dark flash. */
// Default light; dark only if explicitly chosen, or if "system" chosen and the OS is dark.
export const themeInitScript = `(function(){try{var k='${STORAGE_KEY}';var s=localStorage.getItem(k);var d=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;
