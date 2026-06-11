import { handleCollectionsDashboard } from "@/lib/collections-api";

export async function GET() {
  return handleCollectionsDashboard();
}
