import { NextRequest } from "next/server";
import { handleMpesaCallback } from "@/lib/collections-api";

export async function POST(request: NextRequest) {
  return handleMpesaCallback(request);
}
