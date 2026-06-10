import { NextRequest } from "next/server";
import { handleInventoryDelete, handleInventoryGet, handleInventoryPatch, handleInventoryPost } from "@/lib/inventory-api";

type Params = { params: Promise<{ entity: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleInventoryGet(entity, request);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleInventoryPost(entity, request);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleInventoryPatch(entity, request);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleInventoryDelete(entity, request);
}
