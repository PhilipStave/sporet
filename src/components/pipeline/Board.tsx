"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  type Stage,
} from "@/lib/constants";
import { fmtShort } from "@/lib/format";
import { DealCard } from "./DealCard";
import { useStore } from "@/store/Store";
import type { Deal } from "@/types";

function Column({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const { setSelectedDealId, deleteDeal } = useStore();
  const color = STAGE_COLORS[stage];
  const sum = deals.reduce((a, d) => a + (d.value || 0), 0);
  // First two stages show a customer count instead of a sum.
  const isCountStage = stage === "ny" || stage === "kontaktet";
  const meta = isCountStage
    ? `${deals.length} kunder`
    : `${deals.length} · ${fmtShort(sum)} kr`;

  return (
    <div style={{ width: 268, flexShrink: 0 }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderTop: `3px solid ${color}`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: color,
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {STAGE_LABELS[stage]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
          {meta}
        </div>
      </div>

      <div
        ref={setNodeRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 80,
          padding: 4,
          borderRadius: 10,
          background: isOver ? "var(--primary-050)" : "transparent",
          transition: "background .12s ease",
        }}
      >
        {deals.map((d) => (
          <DealCard
            key={d.id}
            deal={d}
            onOpen={() => setSelectedDealId(d.id)}
            onDelete={() => {
              if (confirm(`Slette ${d.company || "denne kunden"}?`))
                deleteDeal(d.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Board({ deals }: { deals: Deal[] }) {
  const { moveStage } = useStore();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const dealId = String(e.active.id);
    const overStage = e.over?.id as Stage | undefined;
    if (!overStage) return;
    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage !== overStage) moveStage(dealId, overStage);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div
        className="scrollbar-thin"
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          paddingBottom: 12,
        }}
      >
        {STAGE_ORDER.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            deals={deals.filter((d) => d.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
