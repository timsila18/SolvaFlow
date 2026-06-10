import { handleInventoryOptions } from "@/lib/inventory-api";

export async function GET() {
  return handleInventoryOptions();
}
