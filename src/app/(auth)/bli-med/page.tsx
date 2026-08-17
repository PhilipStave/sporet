import { createAdminClient } from "@/lib/supabase/server";
import { BliMedForm } from "./BliMedForm";
import type { JoinState } from "../actions";

export default async function BliMedPage({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string }>;
}) {
  const { kode } = await searchParams;

  let initial: JoinState = { stage: "search" };

  // A shareable link (…/bli-med?kode=XXXX) jumps straight to registration.
  if (
    kode &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const code = kode.trim().toLowerCase();
    const admin = createAdminClient();
    const { data: org } = await admin
      .from("organizations")
      .select("id, name")
      .eq("join_code", code)
      .maybeSingle();
    if (org) {
      const { data: depts } = await admin
        .from("departments")
        .select("id, name")
        .eq("org_id", org.id)
        .order("created_at");
      initial = {
        stage: "register",
        orgId: org.id,
        orgName: org.name,
        code,
        departments: depts || [],
      };
    }
  }

  return <BliMedForm initial={initial} />;
}
