import { NextRequest } from "next/server";
import { handleSalesDistributionDelete, handleSalesDistributionGet, handleSalesDistributionPatch, handleSalesDistributionPost } from "@/lib/sales-distribution-api";

export async function GET(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleSalesDistributionGet(entity, request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleSalesDistributionPost(entity, request);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleSalesDistributionPatch(entity, request);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  const { entity } = await context.params;
  return handleSalesDistributionDelete(entity, request);
}
