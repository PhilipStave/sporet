import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bli med i en bedrift",
  description: "Ny ansatt? Søk opp bedriften din, tast bedriftskoden og lag din egen bruker i Sporet.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
