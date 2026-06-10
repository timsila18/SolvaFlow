import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const admin = createAdminSupabase();
  const tenant = auth.user.company_id;
  const today = new Date().toISOString().slice(0, 10);
  const near = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: balances } = await admin.from("stock_balances").select("available_quantity,total_quantity,total_value,qc_status,expiry_date,product_id,products(product_name)").eq("tenant_id", tenant);
  const rows = balances ?? [];
  const totalValue = rows.reduce((sum, row) => sum + Number(row.total_value ?? 0), 0);
  const lowStock = rows.filter((row: any) => Number(row.available_quantity ?? 0) <= Number(row.products?.reorder_level ?? 0)).length;
  const outOfStock = rows.filter((row) => Number(row.available_quantity ?? 0) <= 0).length;
  const nearExpiry = rows.filter((row) => row.expiry_date && row.expiry_date >= today && row.expiry_date <= near).length;
  const expired = rows.filter((row) => row.expiry_date && row.expiry_date < today).length;
  const onHold = rows.filter((row) => row.qc_status === "On Hold").length;
  const damaged = rows.filter((row) => row.qc_status === "Damaged").length;

  const countMetric = async (table: string, status: string) => {
    const { count } = await admin.from(table).select("*", { count: "exact", head: true }).eq("tenant_id", tenant).eq("status", status);
    return count ?? 0;
  };

  const [pendingTransfers, pendingGrns, pendingCounts] = await Promise.all([
    countMetric("warehouse_transfers", "Submitted"),
    countMetric("goods_received_notes", "Draft"),
    countMetric("stock_counts", "Submitted")
  ]);

  const topItems = [...rows].sort((a, b) => Number(b.total_value ?? 0) - Number(a.total_value ?? 0)).slice(0, 8);

  return NextResponse.json({
    metrics: [
      { label: "Total stock value", value: totalValue.toFixed(2) },
      { label: "Low stock items", value: lowStock },
      { label: "Out-of-stock items", value: outOfStock },
      { label: "Near-expiry batches", value: nearExpiry },
      { label: "Expired stock", value: expired },
      { label: "Stock on hold", value: onHold },
      { label: "Damaged stock", value: damaged },
      { label: "Pending transfers", value: pendingTransfers },
      { label: "Pending GRNs", value: pendingGrns },
      { label: "Pending stock counts", value: pendingCounts }
    ],
    topItems
  });
}
