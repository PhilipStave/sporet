"use client";

import { useEffect, useRef, useState } from "react";

/** Free-text input with a filtered suggestion list (used for seller fields). */
export function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  options: string[];
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const q = value.toLowerCase().trim();
  const matches = options
    .filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q)
    .slice(0, 6);

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <input
        className="field-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={(e) => e.stopPropagation()}
      />
      {open && matches.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-fade"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 12px 30px rgba(17,20,32,.14)",
            padding: 6,
            zIndex: 40,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onChange(m);
                onSelect?.(m);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
