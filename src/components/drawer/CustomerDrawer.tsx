"use client";

import { useState } from "react";
import { Firmadata } from "./Firmadata";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { Autocomplete } from "@/components/Autocomplete";
import { DealDocuments } from "@/components/drawer/DealDocuments";
import {
  CHANNEL_ORDER,
  CHANNELS,
  TAG_LIST,
  LOST_REASONS,
  pillStyle,
  LOST_KEY,
  type Channel,
} from "@/lib/constants";
import { fmtKr, fmtDateShort, relativeLabel, fmtTime } from "@/lib/format";
import { stageLabel, stageColor, type StageConfig } from "@/lib/stages";
import type { Deal } from "@/types";

/**
 * Send an email, call, or open the company site — without retyping anything.
 *
 * Each link only appears when there is something behind it, so an empty row
 * never promises an action that would open a blank mail window. The website
 * comes from the register as a bare domain, hence the https:// here.
 */
function Handlinger({
  email,
  phone,
  nettside,
}: {
  email: string;
  phone: string;
  nettside?: string | null;
}) {
  const url = nettside?.trim()
    ? /^https?:\/\//i.test(nettside.trim())
      ? nettside.trim()
      : `https://${nettside.trim()}`
    : null;

  const lenker = [
    email.trim() && { tekst: "Send e-post", ikon: "mail", href: `mailto:${email.trim()}` },
    phone.trim() && { tekst: "Ring", ikon: "phone", href: `tel:${phone.replace(/\s/g, "")}` },
    url && { tekst: "Nettside", ikon: "building", href: url, eksternt: true },
  ].filter(Boolean) as { tekst: string; ikon: string; href: string; eksternt?: boolean }[];

  if (lenker.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
      {lenker.map((l) => (
        <a
          key={l.tekst}
          href={l.href}
          {...(l.eksternt ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12.5,
            color: "var(--primary)",
            textDecoration: "none",
          }}
        >
          <Icon name={l.ikon} size={13} />
          {l.tekst}
        </a>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: ".04em",
        color: "var(--muted)",
        margin: "22px 0 10px",
      }}
    >
      {children}
    </div>
  );
}

export function CustomerDrawer() {
  const { deals, selectedDealId } = useStore();
  const deal = deals.find((d) => d.id === selectedDealId) || null;
  if (!deal) return null;
  // Keyed by id so local form state resets cleanly when switching customers,
  // without a state-syncing effect.
  return <DrawerInner key={deal.id} deal={deal} />;
}

function DrawerInner({ deal }: { deal: Deal }) {
  const {
    setSelectedDealId,
    updateDeal,
    moveStage,
    logContact,
    markNextDone,
    deleteDeal,
    sellerNames,
    members,
    profile,
    deptName,
    stageMaps,
  } = useStore();

  // Local editable state, initialised from the deal on mount.
  const [f, setF] = useState({
    company: deal.company,
    contact: deal.contact,
    contact_role: deal.contact_role,
    email: deal.email,
    phone: deal.phone,
    product: deal.product,
    value: deal.value ? String(deal.value) : "",
    margin_pct: deal.margin_pct ? String(deal.margin_pct) : "",
    seller: deal.owner_name,
    next_step_text: deal.next_step_text || "",
    next_step_date: deal.next_step_date || "",
    next_step_time: deal.next_step_time || "",
    next_step_who: deal.next_step_who || "",
    notes: deal.notes,
  });

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const close = () => setSelectedDealId(null);

  const commitSeller = (name: string) => {
    const member = members.find((m) => m.full_name === name);
    updateDeal(deal.id, {
      owner_name: name,
      owner_id: member?.id ?? null,
    });
  };

  const marginKr = Math.round((deal.value * (deal.margin_pct || 0)) / 100);

  const inputStyle: React.CSSProperties = { marginTop: 5 };

  return (
    <>
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17,20,32,.28)",
          zIndex: 70,
          animation: "fadeIn .15s ease",
        }}
      />
      <aside
        className="animate-slide scrollbar-thin"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "min(460px, 100%)",
          background: "var(--surface)",
          boxShadow: "-8px 0 30px rgba(17,20,32,.14)",
          zIndex: 71,
          overflowY: "auto",
          padding: 24,
        }}
      >
        {/* Stage pill + close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={pillStyle(stageColor(stageMaps, deal.stage))}>
            {stageLabel(stageMaps, deal.stage)}
          </span>
          <button
            type="button"
            aria-label="Lukk"
            onClick={close}
            className="btn"
            style={{ width: 34, height: 34, padding: 0, borderRadius: 999 }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Company (inline editable) */}
        <input
          value={f.company}
          onChange={(e) => set("company", e.target.value)}
          onBlur={() => updateDeal(deal.id, { company: f.company })}
          placeholder="Selskap"
          style={{
            width: "100%",
            margin: "16px 0 4px",
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: 24,
            color: "var(--text)",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid transparent",
            padding: "2px 0",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderBottom = "1px solid var(--primary)")}
        />

        {/* Contact + role */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="field-input"
            value={f.contact}
            placeholder="Kontaktperson"
            onChange={(e) => set("contact", e.target.value)}
            onBlur={() => updateDeal(deal.id, { contact: f.contact })}
          />
          <input
            className="field-input"
            value={f.contact_role}
            placeholder="Rolle"
            onChange={(e) => set("contact_role", e.target.value)}
            onBlur={() => updateDeal(deal.id, { contact_role: f.contact_role })}
          />
        </div>

        {/* Email + phone */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            className="field-input"
            value={f.email}
            placeholder="E-post"
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => updateDeal(deal.id, { email: f.email })}
          />
          <input
            className="field-input"
            value={f.phone}
            placeholder="Telefon"
            onChange={(e) => set("phone", e.target.value)}
            onBlur={() => updateDeal(deal.id, { phone: f.phone })}
          />
        </div>

        {/* Act on the contact details rather than copy them out by hand.
            mailto: and tel: hand over to whatever the seller already uses —
            Outlook, Gmail, the phone app — so no integration is needed. */}
        <Handlinger email={f.email} phone={f.phone} nettside={deal.nettside} />

        {/* Product */}
        <input
          className="field-input"
          value={f.product}
          placeholder="Hva skal selges?"
          onChange={(e) => set("product", e.target.value)}
          onBlur={() => updateDeal(deal.id, { product: f.product })}
          style={{ marginTop: 8 }}
        />

        <Firmadata deal={deal} />

        {/* Value + margin */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 10 }}>
          <label className="field-label" style={{ flex: 1 }}>
            Verdi (kr)
            <input
              className="field-input"
              value={f.value}
              inputMode="numeric"
              placeholder="0"
              onChange={(e) => set("value", e.target.value.replace(/\D/g, ""))}
              onBlur={() =>
                updateDeal(deal.id, { value: parseInt(f.value || "0", 10) || 0 })
              }
              style={inputStyle}
            />
          </label>
          <label className="field-label" style={{ flex: 1 }}>
            Margin (%)
            <input
              className="field-input"
              value={f.margin_pct}
              inputMode="numeric"
              placeholder="0"
              onChange={(e) => set("margin_pct", e.target.value.replace(/\D/g, ""))}
              onBlur={() =>
                updateDeal(deal.id, {
                  margin_pct: parseInt(f.margin_pct || "0", 10) || 0,
                })
              }
              style={inputStyle}
            />
          </label>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          {deal.margin_pct || 0} % margin · {fmtKr(marginKr)} · Avdeling:{" "}
          {deptName(deal.department_id)}
        </div>

        {/* Seller */}
        <SectionTitle>Selger</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <Autocomplete
            style={{ flex: 1 }}
            value={f.seller}
            options={sellerNames}
            placeholder="Selger"
            onChange={(v) => set("seller", v)}
            onSelect={(v) => commitSeller(v)}
          />
          <button
            type="button"
            className="btn"
            onClick={() => {
              set("seller", profile.full_name);
              commitSeller(profile.full_name);
            }}
          >
            Meg
          </button>
        </div>
        {f.seller !== deal.owner_name && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 8, padding: "6px 12px", fontSize: 13 }}
            onClick={() => commitSeller(f.seller)}
          >
            Overfør til {f.seller || "…"}
          </button>
        )}

        {/* Stage */}
        <SectionTitle>Steg i prosessen</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {stageMaps.list.map((s) => (
            <StageChip
              key={s.id}
              stage={s}
              active={deal.stage === s.key}
              onClick={() => moveStage(deal.id, s.key)}
            />
          ))}
        </div>

        {/* Log contact */}
        <SectionTitle>Logg kontakt</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CHANNEL_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              data-active={deal.channel === c}
              onClick={() => logContact(deal.id, c as Channel)}
            >
              <Icon name={CHANNELS[c].icon} size={14} />
              {CHANNELS[c].label}
            </button>
          ))}
        </div>

        {/* Next step */}
        <SectionTitle>Neste steg</SectionTitle>
        <input
          className="field-input"
          value={f.next_step_text}
          placeholder="Hva er neste steg?"
          onChange={(e) => set("next_step_text", e.target.value)}
          onBlur={() => updateDeal(deal.id, { next_step_text: f.next_step_text || null })}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <label className="field-label" style={{ flex: 1 }}>
            Dato
            <input
              type="date"
              className="field-input"
              value={f.next_step_date}
              onChange={(e) => {
                set("next_step_date", e.target.value);
                updateDeal(deal.id, { next_step_date: e.target.value || null });
              }}
              style={inputStyle}
            />
          </label>
          <label className="field-label" style={{ flex: 1 }}>
            Klokkeslett
            <input
              type="time"
              className="field-input"
              value={f.next_step_time}
              onChange={(e) => {
                set("next_step_time", e.target.value);
                updateDeal(deal.id, { next_step_time: e.target.value || null });
              }}
              style={inputStyle}
            />
          </label>
        </div>
        <label className="field-label" style={{ display: "block", marginTop: 8 }}>
          Hvem deltar
          <input
            className="field-input"
            value={f.next_step_who}
            placeholder="f.eks. Ola, Kari + kunde"
            onChange={(e) => set("next_step_who", e.target.value)}
            onBlur={() => updateDeal(deal.id, { next_step_who: f.next_step_who || null })}
            style={inputStyle}
          />
        </label>
        {deal.next_step_text && (
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => markNextDone(deal.id)}
          >
            <Icon name="check" size={15} /> Marker som fullført
          </button>
        )}

        {/* Tags */}
        <SectionTitle>Tags</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TAG_LIST.map((tag) => {
            const active = (deal.tags || []).includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className="chip"
                data-active={active}
                onClick={() => {
                  const cur = deal.tags || [];
                  const next = active
                    ? cur.filter((t) => t !== tag)
                    : [...cur, tag];
                  updateDeal(deal.id, { tags: next });
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Lost reason */}
        {deal.stage === LOST_KEY && (
          <>
            <SectionTitle>Tapt-årsak</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {LOST_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="chip"
                  data-active={deal.lost_reason === r}
                  onClick={() =>
                    updateDeal(deal.id, {
                      lost_reason: deal.lost_reason === r ? null : r,
                    })
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        <SectionTitle>Notater</SectionTitle>
        <textarea
          className="field-input"
          value={f.notes}
          placeholder="Skriv notater om kunden …"
          onChange={(e) => set("notes", e.target.value)}
          onBlur={() => updateDeal(deal.id, { notes: f.notes })}
          rows={3}
          style={{ resize: "vertical", minHeight: 72 }}
        />

        {/* Documents */}
        <SectionTitle>Dokumenter</SectionTitle>
        <DealDocuments dealId={deal.id} />

        {/* Activity log */}
        <SectionTitle>Aktivitetslogg</SectionTitle>
        {(deal.activities || []).length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Ingen aktivitet ennå.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {deal.activities.map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 10 }}>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: "var(--primary-050)",
                    color: "var(--primary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={a.icon} size={15} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ fontWeight: 600 }}>{a.label}</strong>
                    {a.note ? ` · ${a.note}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {relativeLabel(a.created_at)}
                    {a.actor_name ? ` · ${a.actor_name}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete */}
        <div style={{ height: 1, background: "var(--border)", margin: "22px 0 16px" }} />
        <button
          type="button"
          onClick={() => {
            deleteDeal(deal.id);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            border: "1px solid var(--tint-danger-border)",
            background: "var(--tint-danger)",
            color: "var(--danger)",
            borderRadius: 10,
            padding: "9px 14px",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon name="x" size={15} /> Slett kunde
        </button>
        {deal.next_step_text && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 14 }}>
            Neste: {deal.next_step_text}
            {deal.next_step_date
              ? ` · ${fmtDateShort(deal.next_step_date)}${
                  deal.next_step_time ? " kl " + fmtTime(deal.next_step_time) : ""
                }`
              : ""}
          </div>
        )}
      </aside>
    </>
  );
}

function StageChip({
  stage,
  active,
  onClick,
}: {
  stage: StageConfig;
  active: boolean;
  onClick: () => void;
}) {
  const color = stage.color;
  return (
    <button
      type="button"
      onClick={onClick}
      className="chip"
      data-active={false}
      style={
        active
          ? {
              background: `${color}1f`,
              borderColor: color,
              color,
              fontWeight: 600,
            }
          : undefined
      }
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          display: "inline-block",
        }}
      />
      {stage.label}
    </button>
  );
}
