import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const { data, error } = await admin.from("company_branding").select("*").eq("company_id", auth.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const payload = await request.json();
  const admin = createAdminSupabase();
  const { data: oldValue } = await admin.from("company_branding").select("*").eq("company_id", auth.user.company_id).single();
  const { data, error } = await admin.from("company_branding").update(payload).eq("company_id", auth.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({ request, user: auth.user, moduleKey: "platform", actionKey: "edit", tableName: "company_branding", recordId: auth.user.company_id ?? undefined, oldValue, newValue: data });
  return NextResponse.json({ data });
}
