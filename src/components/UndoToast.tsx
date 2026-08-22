"use client";

import { useStore } from "@/store/Store";

/** Bottom toast shown right after a customer is deleted — one click to undo. */
export function UndoToast() {
  const { pendingDelete, undoDelete } = useStore();
  if (!pendingDelete) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "var(--ink, #1f2937)",
        color: "#f7f4ee",
        borderRadius: 12,
        padding: "12px 18px",
        boxShadow: "0 10px 32px rgba(0,0,0,.25)",
        fontSize: 14,
      }}
    >
      <span>
        «{pendingDelete.company || "Kunde"}» slettet
      </span>
      <button
        type="button"
        onClick={() => undoDelete(pendingDelete.id)}
        style={{
          background: "none",
          border: "none",
          color: "#fbbf77",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Angre
      </button>
    </div>
  );
}
