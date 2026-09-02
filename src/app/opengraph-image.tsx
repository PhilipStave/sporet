import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

// Social share card (Open Graph / Twitter), 1200×630 — generated at build time.
export const runtime = "nodejs";
export const alt = "Altiv — norsk CRM for salgsoppfølging i B2B";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Embed the dashboard screenshot as a data URI (no external fetch allowed).
  let shot = "";
  try {
    const buf = await readFile(
      join(process.cwd(), "public", "screenshots", "02-app-oversikt.png")
    );
    shot = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    shot = "";
  }

  // The mark, as a data URI. Satori renders an <img> reliably; hand-written
  // SVG paths in JSX it does not.
  let merke = "";
  try {
    const buf = await readFile(join(process.cwd(), "src", "app", "icon.svg"));
    merke = `data:image/svg+xml;base64,${buf.toString("base64")}`;
  } catch {
    merke = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf7f2",
          color: "#1b1a18",
          fontFamily: "Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left: text column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 48px 48px 56px",
            width: 520,
            height: "100%",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 34 }}>
              {merke ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={merke} alt="" width={30} height={30} />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "#1b2a52" }} />
              )}
              <div style={{ fontSize: 36, letterSpacing: -0.5 }}>Altiv</div>
            </div>
            <div
              style={{
                fontSize: 50,
                lineHeight: 1.08,
                letterSpacing: -1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>Hold styr på hvem</span>
              <span>du har kontaktet,</span>
              <span style={{ color: "#a8402a", fontStyle: "italic" }}>og hvor langt</span>
              <span style={{ color: "#a8402a", fontStyle: "italic" }}>du er kommet</span>
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 20,
                color: "#6f6a62",
                lineHeight: 1.4,
                fontFamily: "Arial, Helvetica, sans-serif",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>Norsk CRM for salgsoppfølging i B2B.</span>
              <span>Pipeline, kontaktlogg, statistikk og margin.</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            <div
              style={{
                background: "#2f4739",
                color: "#f7f4ee",
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Prøv gratis i 14 dager
            </div>
            <div style={{ fontSize: 18, color: "#6f6a62", fontWeight: 700 }}>altiv.no</div>
          </div>
        </div>

        {/* Right: screenshot card, slightly tilted, bleeding off the edge */}
        {shot && (
          <div
            style={{
              position: "absolute",
              right: -120,
              top: 64,
              width: 800,
              height: 500,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid #e6dfd4",
              boxShadow: "0 30px 70px rgba(27,26,24,.22)",
              transform: "rotate(-4deg)",
              display: "flex",
              background: "#fff",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="" width={800} height={500} style={{ objectFit: "cover", objectPosition: "top left" }} />
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
