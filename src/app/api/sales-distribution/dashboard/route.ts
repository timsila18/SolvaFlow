import { handleSalesDistributionDashboard } from "@/lib/sales-distribution-api";

export async function GET() {
  return handleSalesDistributionDashboard();
}
