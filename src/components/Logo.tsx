/**
 * The mark on its own, for the places that set their own wordmark — the
 * landing page and the article pages draw "Altiv" in the display font at their
 * own size, and only need the symbol.
 */
export function LogoMark({ size = 20, tone }: { size?: number; tone?: "light" | "dark" }) {
  const ink =
    tone === "light" ? "#fff" : tone === "dark" ? "#1B2A52" : "var(--logo-ink)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "block" }}
      aria-hidden
    >
      <path d="M32 6 L58 57 L46.5 57 L32 26.5 L17.5 57 L6 57 Z" fill={ink} />
      <path
        d="M9.5 54.5 C 21 51.5, 32 43, 40 28.5"
        stroke="var(--logo-accent)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M50.5 15.5 L46.5 34 L33.5 24.5 Z" fill="var(--logo-accent)" />
    </svg>
  );
}

/**
 * The Altiv mark: an A drawn as a peak, with a rising arrow through it.
 *
 * The navy is a token rather than a literal because navy on a dark background
 * is invisible — in dark mode the ink flips to near-white and only the teal
 * stays put, which it can, since it reads on both. `tone="light"` forces the
 * white version for placing the mark on a navy or coloured surface.
 */
export function Logo({
  size = 32,
  showText = true,
  textSize = 21,
  tone,
}: {
  size?: number;
  showText?: boolean;
  textSize?: number;
  /** Force the ink colour when the surface is not the page background. */
  tone?: "light" | "dark";
}) {
  const ink =
    tone === "light" ? "#fff" : tone === "dark" ? "#1B2A52" : "var(--logo-ink)";

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: "block" }}
        aria-hidden
      >
        <path d="M32 6 L58 57 L46.5 57 L32 26.5 L17.5 57 L6 57 Z" fill={ink} />
        <path
          d="M9.5 54.5 C 21 51.5, 32 43, 40 28.5"
          stroke="var(--logo-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M50.5 15.5 L46.5 34 L33.5 24.5 Z" fill="var(--logo-accent)" />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: textSize,
            letterSpacing: "-0.02em",
            color: tone ? ink : "var(--text)",
          }}
        >
          Altiv
        </span>
      )}
    </span>
  );
}
