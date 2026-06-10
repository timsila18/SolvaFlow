import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("user_profiles")
    .select("*, roles(role_name, role_key)")
    .eq("company_id", auth.user.company_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const payload = await request.json();
  const admin = createAdminSupabase();
  const temporaryPassword = payload.temporary_password || crypto.randomUUID();

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: payload.full_name }
  });

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { temporary_password: _ignored, ...profile } = payload;
  const { data, error } = await admin
    .from("user_profiles")
    .insert({
      ...profile,
      id: authUser.user.id,
      company_id: auth.user.company_id,
      status: profile.status ?? "Active",
      force_password_change: true
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({ request, user: auth.user, moduleKey: "security", actionKey: "create", tableName: "user_profiles", recordId: data.id, newValue: data });
  return NextResponse.json({ data, temporary_password: temporaryPassword }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const payload = await request.json();
  const { id, ...updates } = payload;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: oldValue } = await admin.from("user_profiles").select("*").eq("id", id).eq("company_id", auth.user.company_id).single();
  const { data, error } = await admin.from("user_profiles").update(updates).eq("id", id).eq("company_id", auth.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({ request, user: auth.user, moduleKey: "security", actionKey: "edit", tableName: "user_profiles", recordId: id, oldValue, newValue: data });
  return NextResponse.json({ data });
}
