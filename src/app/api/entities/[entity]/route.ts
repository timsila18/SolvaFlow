import { NextRequest } from "next/server";
import { handleEntityDelete, handleEntityGet, handleEntityPatch, handleEntityPost } from "@/lib/api";

type Params = { params: Promise<{ entity: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleEntityGet(entity, request);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleEntityPost(entity, request);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleEntityPatch(entity, request);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { entity } = await params;
  return handleEntityDelete(entity, request);
}
