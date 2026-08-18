import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/queries";

// The logged-in app is private — keep it out of search engines.
export const metadata: Metadata = {
  title: "Altiv",
  robots: { index: false, follow: false },
};
import { StoreProvider } from "@/store/Store";
import { TopNav } from "@/components/TopNav";
import { CustomerDrawer } from "@/components/drawer/CustomerDrawer";
import { PendingScreen } from "@/components/PendingScreen";
import { BillingBanner } from "@/components/BillingBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();

  if (session.kind === "none") redirect("/login");
  if (session.kind === "pending") {
    return <PendingScreen fullName={session.fullName} />;
  }

  return (
    <StoreProvider
      org={session.org}
      profile={session.profile}
      departments={session.departments}
      members={session.members}
    >
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <TopNav />
        <BillingBanner />
        <main
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 1320,
            margin: "0 auto",
            padding: "var(--sp)",
          }}
        >
          {children}
        </main>
      </div>
      <CustomerDrawer />
    </StoreProvider>
  );
}
