import { handleExecutiveDashboard } from "@/lib/collections-api";

export async function GET() {
  return handleExecutiveDashboard();
}
