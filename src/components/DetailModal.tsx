"use client";

import { Icon } from "./Icon";

export interface DetailRow {
  id: string;
  company: string;
  sub?: string;
  tagLabel?: string;
  tagStyle?: React.CSSProperties;
  value?: string;
  onOpen?: () => void;
}

export interface DetailData {
  title: string;
  subtitle?: string;
  banner?: string;
  rows: DetailRow[];
}

export function DetailModal({
  data,
  onClose,
}: {
  data: DetailData;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,20,32,.28)",
          zIndex: 70,
          animation: "fadeIn .15s ease",
        }}
      />
      <div
        className="animate-fade scrollbar-thin"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(620px, calc(100% - 32px))",
          maxHeight: "min(80dvh, 720px)",
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(17,20,32,.28)",
          zIndex: 71,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: 20 }}>{data.title}</h3>
            {data.subtitle && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                {data.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Lukk"
            onClick={onClose}
            className="btn"
            style={{ width: 34, height: 34, padding: 0, borderRadius: 999 }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {data.banner && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              background: "var(--primary-050)",
              color: "var(--primary)",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {data.banner}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column" }}>
          {data.rows.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Ingen data å vise for dette utvalget.
            </p>
          )}
          {data.rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={r.onOpen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                textAlign: "left",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: "transparent",
                padding: "12px 4px",
                cursor: r.onOpen ? "pointer" : "default",
              }}
            >
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>
                  {r.company}
                </span>
                {r.sub && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {r.sub}
                  </span>
                )}
              </span>
              {r.tagLabel && <span style={r.tagStyle}>{r.tagLabel}</span>}
              {r.value && (
                <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
                  {r.value}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
