import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

const counts = [
  ["products", "Total Products"],
  ["customers", "Total Customers"],
  ["suppliers", "Total Suppliers"],
  ["warehouses", "Total Warehouses"],
  ["user_profiles", "Total Users"],
  ["vehicles", "Active Vehicles"]
] as const;

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const metrics = await Promise.all(
    counts.map(async ([table, label]) => {
      let query = admin.from(table).select("*", { count: "exact", head: true });
      if (auth.user.company_id && table !== "user_profiles") query = query.eq("company_id", auth.user.company_id);
      if (auth.user.company_id && table === "user_profiles") query = query.eq("company_id", auth.user.company_id);
      if (label === "Active Vehicles") query = query.eq("status", "Available");
      const { count, error } = await query;
      return { label, value: error ? 0 : count ?? 0 };
    })
  );

  const { count: activeSalesReps } = await admin
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", auth.user.company_id)
    .ilike("designation", "%sales%");

  const { count: activeDrivers } = await admin
    .from("user_profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", auth.user.company_id)
    .ilike("designation", "%driver%");

  const { data: activities } = await admin
    .from("audit_logs")
    .select("id, module_key, action_key, table_name, created_at, user_profiles(full_name)")
    .eq("company_id", auth.user.company_id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { count: pendingApprovals } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("company_id", auth.user.company_id)
    .eq("event_key", "approval")
    .eq("status", "Queued");

  return NextResponse.json({
    metrics: [
      ...metrics,
      { label: "Active Sales Reps", value: activeSalesReps ?? 0 },
      { label: "Active Drivers", value: activeDrivers ?? 0 },
      { label: "Pending Approvals", value: pendingApprovals ?? 0 }
    ],
    activities: activities ?? [],
    health: {
      database: "Connected",
      auth: "Supabase Auth",
      storage: "Tenant Buckets",
      rls: "Enabled"
    }
  });
}
