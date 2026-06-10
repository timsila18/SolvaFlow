import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase";

export type AppUser = {
  id: string;
  email: string;
  company_id: string | null;
  full_name: string;
  role_key: string | null;
  role_name: string | null;
};

export async function requireAppUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = createAdminSupabase();
  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("id, company_id, full_name, email, status, roles(role_key, role_name)")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: NextResponse.json({ error: profileError.message }, { status: 500 }) };
  }

  if (!profile || profile.status !== "Active") {
    return { error: NextResponse.json({ error: "User profile is not active." }, { status: 403 }) };
  }

  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  return {
    user: {
      id: user.id,
      email: user.email,
      company_id: profile.company_id,
      full_name: profile.full_name,
      role_key: role?.role_key ?? null,
      role_name: role?.role_name ?? null
    } satisfies AppUser
  };
}

export function isGlobalAdmin(user: AppUser) {
  return user.role_key === "super_admin" || user.role_key === "solva_team";
}

export async function auditAction(input: {
  request: NextRequest;
  user: AppUser;
  moduleKey: string;
  actionKey: string;
  tableName?: string;
  recordId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  const admin = createAdminSupabase();
  const forwarded = input.request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const device = input.request.headers.get("user-agent");

  await admin.from("audit_logs").insert({
    company_id: input.user.company_id,
    user_id: input.user.id,
    module_key: input.moduleKey,
    action_key: input.actionKey,
    table_name: input.tableName,
    record_id: input.recordId,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    ip_address: ip,
    device
  });
}

export function tenantFilter<T extends Record<string, unknown>>(user: AppUser, body: T): T & { company_id?: string | null } {
  if (isGlobalAdmin(user)) return body;
  return { ...body, company_id: user.company_id };
}
