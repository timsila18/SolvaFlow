import { handleSalesDistributionOptions } from "@/lib/sales-distribution-api";

export async function GET() {
  return handleSalesDistributionOptions();
}
