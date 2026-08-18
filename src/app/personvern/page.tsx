import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Personvernerklæring",
  description: "Hvordan Altiv behandler personopplysninger.",
  alternates: { canonical: "/personvern" },
};

export default function PersonvernPage() {
  return (
    <LegalPage
      title="Personvernerklæring"
      intro="Slik behandler vi opplysninger om deg og om kundene du legger inn i Altiv."
      sections={PRIVACY}
    />
  );
}
