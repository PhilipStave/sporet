"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@/components/Icon";
import {
  CHANNELS,
  pillStyle,
} from "@/lib/constants";
import { fmtShort, fmtDateShort, fmtTime, diffDays } from "@/lib/format";
import type { Deal } from "@/types";

export function DealCard({
  deal,
  onOpen,
  onDelete,
}: {
  deal: Deal;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const overdue =
    !!deal.next_step_date && diffDays(deal.next_step_date) < 0;
  const channel = CHANNELS[deal.channel];

  return (
    <div
      ref={setNodeRef}
      className="deal-card"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 13,
        position: "relative",
        cursor: "grab",
        boxShadow: "0 1px 2px rgba(17,20,32,.04)",
      }}
      {...listeners}
      {...attributes}
      onClick={onOpen}
    >
      <button
        type="button"
        aria-label="Slett"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          border: "none",
          background: "transparent",
          color: "var(--placeholder)",
          borderRadius: 6,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="x" size={14} />
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          paddingRight: 18,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          {deal.company || "Ny kunde"}
        </span>
      </div>
      {deal.value > 0 && (
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            color: "var(--primary)",
            fontSize: 14,
          }}
        >
          {fmtShort(deal.value)} kr
        </span>
      )}

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        {[deal.contact, deal.contact_role].filter(Boolean).join(" · ") || "—"}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--muted)",
          marginTop: 8,
        }}
      >
        <Icon name={channel.icon} size={13} />
        {channel.label}
      </div>

      {deal.next_step_text && (
        <div style={{ marginTop: 9 }}>
          <span
            style={
              overdue
                ? pillStyle("var(--danger)")
                : {
                    ...pillStyle("#64748b"),
                    background: "var(--tint-neutral)",
                    color: "var(--tint-neutral-text)",
                  }
            }
          >
            {deal.next_step_text}
            {deal.next_step_date
              ? ` · ${fmtDateShort(deal.next_step_date)}${
                  deal.next_step_time ? " kl " + fmtTime(deal.next_step_time) : ""
                }`
              : ""}
          </span>
        </div>
      )}
    </div>
  );
}
