import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { email, password, full_name } = await request.json();
  const admin = createAdminSupabase();

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  });

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { data: role } = await admin.from("roles").select("id").eq("role_key", "super_admin").single();
  await admin.from("user_profiles").upsert({
    id: authUser.user.id,
    full_name,
    email,
    role_id: role?.id,
    status: "Active"
  });

  return NextResponse.json({ ok: true });
}
