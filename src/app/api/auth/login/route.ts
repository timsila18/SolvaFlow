import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return NextResponse.json({ error: error.message }, { status: 401 });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let requirePasswordChange = false;
  if (user) {
    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from("user_profiles")
      .select("force_password_change")
      .eq("id", user.id)
      .maybeSingle();
    requirePasswordChange = Boolean(profile?.force_password_change);
  }

  return NextResponse.json({ ok: true, require_password_change: requirePasswordChange });
}
