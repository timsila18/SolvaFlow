import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const { data: roles, error } = await admin
    .from("roles")
    .select("*, role_permissions(permission_id, permissions(module_key, page_key, action_key))")
    .or(`company_id.eq.${auth.user.company_id},company_id.is.null`)
    .order("role_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: permissions } = await admin.from("permissions").select("*").order("module_key").order("page_key").order("action_key");
  return NextResponse.json({ roles, permissions: permissions ?? [] });
}
