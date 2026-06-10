import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser, tenantFilter } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("notifications")
    .select("*")
    .eq("company_id", auth.user.company_id)
    .or(`recipient_user_id.eq.${auth.user.id},recipient_user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const payload = await request.json();
  const { data, error } = await admin.from("notifications").insert(tenantFilter(auth.user, payload)).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({ request, user: auth.user, moduleKey: "notifications", actionKey: "create", tableName: "notifications", recordId: data.id, newValue: data });
  return NextResponse.json({ data }, { status: 201 });
}
