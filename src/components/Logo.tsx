export function Logo({
  size = 26,
  showText = true,
  textSize = 18,
}: {
  size?: number;
  showText?: boolean;
  textSize?: number;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.31,
          background: "var(--primary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden
      >
        <svg
          width={size * 0.62}
          height={size * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18 L10 11 L14 15 L20 6" />
          <path d="M15 6 h5 v5" />
        </svg>
      </span>
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: textSize,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          Altiv
        </span>
      )}
    </span>
  );
}
