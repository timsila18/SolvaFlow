import { NextRequest } from "next/server";
import { handleStockAvailability } from "@/lib/sales-distribution-api";

export async function GET(request: NextRequest) {
  return handleStockAvailability(request);
}
