import { NextRequest } from "next/server";
import { handleSalesDistributionAction } from "@/lib/sales-distribution-api";

export async function POST(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleSalesDistributionAction(entity, request);
}
