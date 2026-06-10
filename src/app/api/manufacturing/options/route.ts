import { handleManufacturingOptions } from "@/lib/manufacturing-api";

export async function GET() {
  return handleManufacturingOptions();
}
