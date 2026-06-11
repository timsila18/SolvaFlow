import { NextRequest } from "next/server";
import { handleFinalDelete, handleFinalGet, handleFinalPatch, handleFinalPost } from "@/lib/collections-api";

export async function GET(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleFinalGet(entity, request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleFinalPost(entity, request);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleFinalPatch(entity, request);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleFinalDelete(entity, request);
}
