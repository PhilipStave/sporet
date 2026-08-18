import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sett opp bedriften",
  description: "Opprett bedriften din i Sporet på et par minutter. Ingen installasjon.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
