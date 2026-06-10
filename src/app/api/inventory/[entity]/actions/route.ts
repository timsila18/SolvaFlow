import { NextRequest } from "next/server";
import { handleInventoryAction } from "@/lib/inventory-api";

type Params = { params: Promise<{ entity: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleInventoryAction(entity, request);
}
