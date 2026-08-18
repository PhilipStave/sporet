import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Vilkår for bruk",
  description: "Vilkår for bruk av Altiv – CRM for salgsoppfølging.",
  alternates: { canonical: "/vilkar" },
};

export default function VilkarPage() {
  return (
    <LegalPage
      title="Vilkår for bruk"
      intro="Disse vilkårene gjelder for bruk av Altiv. Les dem før du oppretter en konto."
      sections={TERMS}
    />
  );
}
