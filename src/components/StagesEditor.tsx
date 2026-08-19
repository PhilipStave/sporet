"use client";

import { useState } from "react";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { STAGE_PALETTE } from "@/lib/stages";
import type { StageConfig } from "@/lib/stages";

/** Admin editor for the organisation's pipeline stages (Innstillinger). */
export function StagesEditor({ onMessage }: { onMessage: (m: string) => void }) {
  const { stageMaps, addStage, updateStage, deleteStage, moveStageOrder, deals } = useStore();
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(STAGE_PALETTE[8]);
  const [newOpen, setNewOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  const countFor = (key: string) => deals.filter((d) => d.stage === key).length;

  const add = async () => {
    setBusy(true);
    const err = await addStage(newLabel, newColor, newOpen);
    setBusy(false);
    if (err) return onMessage(err);
    setNewLabel("");
    onMessage("Steg lagt til.");
  };

  const remove = async (s: StageConfig) => {
    const n = countFor(s.key);
    const msg =
      n > 0
        ? `Slette «${s.label}»? ${n} kunde${n === 1 ? "" : "r"} i dette steget flyttes til første steg.`
        : `Slette «${s.label}»?`;
    if (!confirm(msg)) return;
    setBusy(true);
    const err = await deleteStage(s.id);
    setBusy(false);
    onMessage(err ? err : "Steg slettet.");
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
        Tilpass stegene i pipelinen: gi nytt navn, bytt farge, endre rekkefølge, legg
        til eller fjern. «Åpent steg» betyr at kunder der telles som aktiv pipeline.
        <strong> Vunnet</strong> og <strong>Tapt</strong> kan gis nytt navn, men ikke
        slettes — statistikken bygger på dem.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stageMaps.list.map((s, i) => (
          <StageRow
            key={s.id}
            stage={s}
            count={countFor(s.key)}
            isFirst={i === 0}
            isLast={i === stageMaps.list.length - 1}
            busy={busy}
            onRename={(label) => updateStage(s.id, { label }).then((e) => e && onMessage(e))}
            onColor={(color) => updateStage(s.id, { color }).then((e) => e && onMessage(e))}
            onToggleOpen={() =>
              updateStage(s.id, { counts_as_open: !s.counts_as_open }).then((e) => e && onMessage(e))
            }
            onUp={() => moveStageOrder(s.id, -1)}
            onDown={() => moveStageOrder(s.id, 1)}
            onDelete={() => remove(s)}
          />
        ))}
      </div>

      {/* Add new */}
      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          border: "1px dashed var(--border-strong)",
          borderRadius: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          className="field-input"
          value={newLabel}
          placeholder="Nytt steg, f.eks. «Befaring»"
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newLabel.trim() && add()}
          style={{ flex: "1 1 200px" }}
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
          <input type="checkbox" checked={newOpen} onChange={(e) => setNewOpen(e.target.checked)} />
          Åpent steg
        </label>
        <button className="btn btn-primary" onClick={add} disabled={busy || !newLabel.trim()}>
          <Icon name="plus" size={15} /> Legg til
        </button>
      </div>
    </div>
  );
}

function StageRow({
  stage,
  count,
  isFirst,
  isLast,
  busy,
  onRename,
  onColor,
  onToggleOpen,
  onUp,
  onDown,
  onDelete,
}: {
  stage: StageConfig;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onRename: (label: string) => void;
  onColor: (color: string) => void;
  onToggleOpen: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(stage.label);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${stage.color}`,
        borderRadius: 10,
        background: "var(--surface)",
        flexWrap: "wrap",
      }}
    >
      {/* Reorder */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <button className="btn" onClick={onUp} disabled={isFirst || busy} aria-label="Flytt opp" style={{ padding: "2px 6px", lineHeight: 1 }}>
          <Icon name="chevron" size={12} style={{ transform: "rotate(180deg)" }} />
        </button>
        <button className="btn" onClick={onDown} disabled={isLast || busy} aria-label="Flytt ned" style={{ padding: "2px 6px", lineHeight: 1 }}>
          <Icon name="chevron" size={12} />
        </button>
      </div>

      {/* Name */}
      <input
        className="field-input"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label.trim() && label !== stage.label && onRename(label)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        style={{ flex: "1 1 160px", fontWeight: 600 }}
      />

      <ColorPicker value={stage.color} onChange={onColor} />

      {/* Open toggle */}
      <button
        type="button"
        className="chip"
        data-active={stage.counts_as_open}
        onClick={onToggleOpen}
        disabled={stage.is_system || busy}
        title={stage.is_system ? "Vunnet/Tapt er alltid lukkede steg" : "Telles som aktiv pipeline"}
        style={{ padding: "5px 10px", fontSize: 12 }}
      >
        {stage.counts_as_open ? "Åpent" : "Lukket"}
      </button>

      <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 64, textAlign: "right" }}>
        {count} kunde{count === 1 ? "" : "r"}
      </span>

      {stage.is_system ? (
        <span className="pill" style={{ background: "var(--tint-neutral)", color: "var(--tint-neutral-text)" }}>
          System
        </span>
      ) : (
        <button className="btn" onClick={onDelete} disabled={busy} aria-label="Slett steg" style={{ padding: "6px 9px" }}>
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", maxWidth: 180 }}>
      {STAGE_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Farge ${c}`}
          onClick={() => onChange(c)}
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: c,
            border: value === c ? "2px solid var(--text)" : "2px solid transparent",
            boxShadow: value === c ? "0 0 0 1px var(--surface) inset" : undefined,
            cursor: "pointer",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}
