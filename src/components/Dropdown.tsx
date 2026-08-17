"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export interface DropdownOption {
  value: string;
  label: string;
  sub?: string;
}

export function Dropdown({
  value,
  options,
  onChange,
  minWidth = 160,
  align = "left",
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  minWidth?: number;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{ minWidth, justifyContent: "space-between", gap: 8 }}
      >
        <span style={{ whiteSpace: "nowrap" }}>{current?.label ?? "Velg"}</span>
        <Icon name="chevron" size={15} style={{ color: "var(--muted)" }} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-fade"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            [align]: 0,
            minWidth: Math.max(minWidth, 180),
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 12px 30px rgba(17,20,32,.14)",
            padding: 6,
            zIndex: 40,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
                textAlign: "left",
                border: "none",
                background:
                  o.value === value ? "var(--primary-050)" : "transparent",
                color: o.value === value ? "var(--primary)" : "var(--text)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
                gap: 1,
              }}
            >
              <span style={{ fontWeight: o.value === value ? 600 : 500 }}>
                {o.label}
              </span>
              {o.sub && (
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {o.sub}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
