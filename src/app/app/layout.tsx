import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/queries";
import { StoreProvider } from "@/store/Store";
import { TopNav } from "@/components/TopNav";
import { CustomerDrawer } from "@/components/drawer/CustomerDrawer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  return (
    <StoreProvider
      org={ctx.org}
      profile={ctx.profile}
      departments={ctx.departments}
      members={ctx.members}
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
