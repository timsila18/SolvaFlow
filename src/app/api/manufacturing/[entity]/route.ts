import { NextRequest } from "next/server";
import {
  handleManufacturingDelete,
  handleManufacturingGet,
  handleManufacturingPatch,
  handleManufacturingPost
} from "@/lib/manufacturing-api";

type Params = { params: Promise<{ entity: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleManufacturingGet(entity, request);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleManufacturingPost(entity, request);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleManufacturingPatch(entity, request);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleManufacturingDelete(entity, request);
}
