import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase";
import { toSlug } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const storageBucket = `${toSlug(payload.company_name)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      ...payload,
      storage_bucket: storageBucket,
      status: payload.status ?? "Active"
    })
    .select("*")
    .single();

  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 400 });

  await admin.storage.createBucket(storageBucket, {
    public: false,
    fileSizeLimit: 25 * 1024 * 1024
  });

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("role_key", "full_access")
    .is("company_id", null)
    .single();

  await admin.from("user_profiles").upsert({
    id: user.id,
    company_id: company.id,
    full_name: payload.primary_contact_person || user.email,
    email: user.email,
    role_id: role?.id,
    status: "Active"
  });

  await admin.from("audit_logs").insert({
    company_id: company.id,
    user_id: user.id,
    module_key: "platform",
    action_key: "create",
    table_name: "companies",
    record_id: company.id,
    new_value: company,
    device: request.headers.get("user-agent")
  });

  return NextResponse.json({ data: company }, { status: 201 });
}
