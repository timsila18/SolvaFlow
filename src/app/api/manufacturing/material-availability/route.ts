import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { getMaterialAvailability } from "@/lib/manufacturing-api";

export async function GET(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const recipeVersionId = request.nextUrl.searchParams.get("recipeVersionId");
  const quantity = Number(request.nextUrl.searchParams.get("quantity") ?? 1);
  if (!recipeVersionId) return NextResponse.json({ error: "Missing recipeVersionId." }, { status: 400 });

  try {
    const data = await getMaterialAvailability(recipeVersionId, quantity);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check material availability." }, { status: 500 });
  }
}
