import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/queries";
import { StoreProvider } from "@/store/Store";
import { TopNav } from "@/components/TopNav";
import { CustomerDrawer } from "@/components/drawer/CustomerDrawer";
import { PendingScreen } from "@/components/PendingScreen";

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
