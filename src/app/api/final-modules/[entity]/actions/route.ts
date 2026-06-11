import { NextRequest } from "next/server";
import { handleFinalAction } from "@/lib/collections-api";

export async function POST(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleFinalAction(entity, request);
}
