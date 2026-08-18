import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logg inn",
  description: "Logg inn på Sporet — CRM for salgsoppfølging.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
