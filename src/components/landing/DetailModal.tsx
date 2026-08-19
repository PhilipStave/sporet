"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DetailBlock } from "@/lib/landingContent";

// ------------------------------------------------------------
// Context so any card/image on the page can open the shared modal/lightbox
// ------------------------------------------------------------
interface Ctx {
  openDetail: (d: DetailBlock) => void;
  openImage: (src: string, alt: string) => void;
}
const LandingCtx = createContext<Ctx>({ openDetail: () => {}, openImage: () => {} });
export const useLanding = () => useContext(LandingCtx);

export function LandingProvider({ children }: { children: React.ReactNode }) {
  const [detail, setDetail] = useState<DetailBlock | null>(null);
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  const close = useCallback(() => {
    setDetail(null);
    setImage(null);
  }, []);

  // Esc closes; lock body scroll while open
  useEffect(() => {
    if (!detail && !image) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [detail, image, close]);

  return (
    <LandingCtx.Provider
      value={{
        openDetail: setDetail,
        openImage: (src, alt) => setImage({ src, alt }),
      }}
    >
      {children}

      {/* Detail modal */}
      {detail && (
        <div
          onClick={close}
          role="dialog"
          aria-modal
          aria-label={detail.title}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(27,26,24,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "fadeIn .15s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade scrollbar-thin"
            style={{
              width: "min(760px, 100%)",
              maxHeight: "min(88dvh, 820px)",
              overflowY: "auto",
              background: "var(--surface)",
              color: "var(--text)",
              borderRadius: 20,
              boxShadow: "0 30px 80px rgba(27,26,24,.35)",
              padding: "28px 28px 24px",
              fontFamily: "var(--font-karla)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(26px, 3.4vw, 36px)",
                  lineHeight: 1.1,
                  flex: 1,
                }}
              >
                {detail.title}
              </h3>
              <button
                type="button"
                aria-label="Lukk"
                onClick={close}
                style={closeBtn}
              >
                ×
              </button>
            </div>
            <p style={{ margin: "10px 0 16px", fontSize: 17, color: "var(--muted)", lineHeight: 1.5 }}>
              {detail.lead}
            </p>

            {detail.image && (
              <button
                type="button"
                onClick={() => {
                  setImage({ src: detail.image!, alt: detail.imageAlt || detail.title });
                }}
                title="Klikk for å forstørre"
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: "1px solid var(--divider)",
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: "zoom-in",
                  marginBottom: 18,
                  background: "transparent",
                }}
              >
                <Image
                  src={detail.image}
                  alt={detail.imageAlt || detail.title}
                  width={2560}
                  height={1600}
                  sizes="(max-width: 800px) 100vw, 760px"
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </button>
            )}

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {detail.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 15.5, lineHeight: 1.5 }}>
                  <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 3 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
              <Link
                href="/setup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "12px 22px",
                  borderRadius: 999,
                  background: "var(--ink)",
                  color: "#f7f4ee",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Prøv gratis i 14 dager
              </Link>
              <button type="button" onClick={close} style={outlineBtn}>
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {image && (
        <div
          onClick={close}
          role="dialog"
          aria-modal
          aria-label={image.alt}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(10,10,12,.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            cursor: "zoom-out",
            animation: "fadeIn .15s ease",
          }}
        >
          <button
            type="button"
            aria-label="Lukk"
            onClick={close}
            style={{ ...closeBtn, position: "fixed", top: 16, right: 16, background: "rgba(255,255,255,.12)", color: "#fff" }}
          >
            ×
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(1400px, 96vw)",
              maxHeight: "92dvh",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 30px 90px rgba(0,0,0,.6)",
              cursor: "default",
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={2560}
              height={1600}
              sizes="96vw"
              priority
              style={{ display: "block", width: "100%", height: "auto", maxHeight: "92dvh", objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </LandingCtx.Provider>
  );
}

const closeBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid var(--divider)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 22,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const outlineBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 22px",
  borderRadius: 999,
  border: "1px solid var(--divider)",
  background: "var(--surface)",
  color: "var(--text)",
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
};

// ------------------------------------------------------------
// Small clickable wrappers used by the landing page
// ------------------------------------------------------------
export function DetailCard({
  detail,
  children,
  style,
}: {
  detail: DetailBlock;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { openDetail } = useLanding();
  return (
    <button
      type="button"
      onClick={() => openDetail(detail)}
      className="land-card"
      style={{
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function ZoomImage({
  src,
  alt,
  detail,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  detail?: DetailBlock;
  priority?: boolean;
  sizes: string;
}) {
  const { openDetail, openImage } = useLanding();
  return (
    <button
      type="button"
      onClick={() => (detail ? openDetail(detail) : openImage(src, alt))}
      title={detail ? "Klikk for mer informasjon" : "Klikk for å forstørre"}
      className="land-zoom"
      style={{
        display: "block",
        width: "100%",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: detail ? "pointer" : "zoom-in",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={2560}
        height={1600}
        priority={priority}
        sizes={sizes}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </button>
  );
}
