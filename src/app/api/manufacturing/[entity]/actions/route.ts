import { NextRequest } from "next/server";
import { handleManufacturingAction } from "@/lib/manufacturing-api";

type Params = { params: Promise<{ entity: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleManufacturingAction(entity, request);
}
