import { handleFinalOptions } from "@/lib/collections-api";

export async function GET() {
  return handleFinalOptions();
}
