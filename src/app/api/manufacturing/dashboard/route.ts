import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const companyId = auth.user.company_id;
  const today = new Date().toISOString().slice(0, 10);
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const metricQueries = [
    ["Production orders today", admin.from("production_orders").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).eq("production_date", today)],
    ["Orders in production", admin.from("production_orders").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).eq("status", "In Production")],
    ["Completed orders", admin.from("production_orders").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).eq("status", "Completed")],
    ["Orders awaiting QC", admin.from("production_orders").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).eq("status", "Quality Check")],
    ["Failed QC batches", admin.from("production_batches").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).in("quality_status", ["Rejected", "Disposed"])],
    ["Material shortages", admin.from("production_material_reservations").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).gt("shortage_quantity", 0)],
    ["Near-expiry batches", admin.from("production_batches").select("*", { count: "exact", head: true }).eq("tenant_id", companyId).lte("expiry_date", inThirtyDays).gte("expiry_date", today)]
  ] as const;

  const metrics = await Promise.all(metricQueries.map(async ([label, query]) => {
    const { count } = await query;
    return { label, value: count ?? 0 };
  }));

  const { data: wastage } = await admin.from("wastage_records").select("wastage_cost").eq("tenant_id", companyId);
  const wastageValue = (wastage ?? []).reduce((sum, row) => sum + Number(row.wastage_cost ?? 0), 0);

  const { data: topProducts } = await admin
    .from("production_batches")
    .select("product_id, quantity_produced, products(product_name)")
    .eq("tenant_id", companyId)
    .order("quantity_produced", { ascending: false })
    .limit(8);

  return NextResponse.json({
    metrics: [...metrics, { label: "Wastage value", value: wastageValue.toFixed(2) }, { label: "Production efficiency", value: "0%" }],
    topProducts: topProducts ?? []
  });
}
