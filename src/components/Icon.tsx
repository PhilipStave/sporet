import React from "react";

// Lucide-like inline SVG icons (1.5–2px stroke, round caps) — paths from the design handoff.
export const ICON_PATHS: Record<string, string[]> = {
  phone: [
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  ],
  mail: ["M4 4h16v16H4z", "m22 6-10 7L2 6"],
  message: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  users: [
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8",
    "M23 21v-2a4 4 0 0 0-3-3.9",
    "M16 3.1a4 4 0 0 1 0 7.7",
  ],
  plus: ["M12 5v14", "M5 12h14"],
  check: ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  chevron: ["m6 9 6 6 6-6"],
  chevronr: ["m9 18 6-6-6-6"],
  minus: ["M5 12h14"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  list: [
    "M8 6h13",
    "M8 12h13",
    "M8 18h13",
    "M3 6h.01",
    "M3 12h.01",
    "M3 18h.01",
  ],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18", "M12 7v5l3 2"],
  banknote: ["M2 6h20v12H2z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6", "M5 9h.01", "M19 15h.01"],
  target: [
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    "M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2",
  ],
  trending: ["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"],
  scale: ["M12 3v18", "M6 8l-4 8h8z", "M18 8l-4 8h8z", "M6 8h12", "M8 21h8"],
  search: ["M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16", "M21 21l-4.3-4.3"],
  bolt: ["M13 2 3 14h8l-1 8 10-12h-8z"],
  calendar: [
    "M3 4h18v18H3z",
    "M3 10h18",
    "M8 2v4",
    "M16 2v4",
  ],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  building: [
    "M4 22V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v18",
    "M15 9h4a1 1 0 0 1 1 1v12",
    "M8 7h.01",
    "M8 11h.01",
    "M8 15h.01",
  ],
  activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  chart: ["M3 3v18h18", "M8 17V9", "M13 17V5", "M18 17v-6"],
  settings: [
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
    "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  ],
  home: ["M3 12l9-9 9 9", "M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"],
};

export type IconName = keyof typeof ICON_PATHS;

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className,
  style,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const paths = ICON_PATHS[name] ?? [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={style}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
