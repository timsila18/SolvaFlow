import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { entityConfigs } from "@/lib/entities";
import { manufacturingConfigs } from "@/lib/manufacturing";
import { inventoryConfigs } from "@/lib/inventory";
import { salesDistributionConfigs } from "@/lib/sales-distribution";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });

  const admin = createAdminSupabase();
  const masterResults = await Promise.all(
    Object.values(entityConfigs).map(async (config) => {
      let dbQuery = admin
        .from(config.table)
        .select(`id, ${config.listFields.join(", ")}`)
        .eq("company_id", auth.user.company_id)
        .or(config.searchFields.map((field) => `${field}.ilike.%${query}%`).join(","))
        .limit(8);
      const { data } = await dbQuery;
      return (data ?? []).map((row) => ({ entity: config.key, title: row[config.listFields[0] as keyof typeof row], href: config.path, row }));
    })
  );

  const manufacturingResults = await Promise.all(
    Object.values(manufacturingConfigs).map(async (config) => {
      const { data } = await admin
        .from(config.table)
        .select(`id, ${config.listFields.join(", ")}`)
        .eq("tenant_id", auth.user.company_id)
        .or(config.searchFields.map((field) => `${field}.ilike.%${query}%`).join(","))
        .limit(5);
      return (data ?? []).map((row) => ({ entity: config.key, title: row[config.listFields[0] as keyof typeof row], href: config.path, row }));
    })
  );

  const inventoryResults = await Promise.all(
    Object.values(inventoryConfigs).map(async (config) => {
      if (!config.searchFields.length) return [];
      const { data } = await admin
        .from(config.table)
        .select(`id, ${config.listFields.join(", ")}`)
        .eq("tenant_id", auth.user.company_id)
        .or(config.searchFields.map((field) => `${field}.ilike.%${query}%`).join(","))
        .limit(5);
      return (data ?? []).map((row) => ({ entity: config.key, title: row[config.listFields[0] as keyof typeof row], href: config.path, row }));
    })
  );

  const salesDistributionResults = await Promise.all(
    Object.values(salesDistributionConfigs).map(async (config) => {
      if (!config.searchFields.length) return [];
      const { data } = await admin
        .from(config.table)
        .select(`id, ${config.listFields.join(", ")}`)
        .eq("tenant_id", auth.user.company_id)
        .or(config.searchFields.map((field) => `${field}.ilike.%${query}%`).join(","))
        .limit(5);
      return (data ?? []).map((row) => ({ entity: config.key, title: row[config.listFields[0] as keyof typeof row], href: config.path, row }));
    })
  );

  return NextResponse.json({ results: [...masterResults.flat(), ...manufacturingResults.flat(), ...inventoryResults.flat(), ...salesDistributionResults.flat()] });
}
