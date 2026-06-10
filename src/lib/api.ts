import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser, tenantFilter } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { entityConfigs, type EntityKey } from "@/lib/entities";

const allowedEntityKeys = Object.keys(entityConfigs) as EntityKey[];

export async function handleEntityGet(entity: string, request: NextRequest) {
  const config = entityConfigs[entity as EntityKey];
  if (!config) return NextResponse.json({ error: "Unknown entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim();
  const id = searchParams.get("id");

  let query = admin.from(config.table).select("*").order("created_at", { ascending: false }).limit(100);

  if (id) query = query.eq("id", id);
  if (auth.user.company_id) query = query.eq("company_id", auth.user.company_id);
  if (search) {
    query = query.or(config.searchFields.map((field) => `${field}.ilike.%${search}%`).join(","));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, config });
}

export async function handleEntityPost(entity: string, request: NextRequest) {
  const config = entityConfigs[entity as EntityKey];
  if (!config) return NextResponse.json({ error: "Unknown entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const payload = await request.json();
  const cleanPayload = normalizePayload(payload);
  const insertPayload = tenantFilter(auth.user, {
    ...cleanPayload,
    created_by: auth.user.id,
    updated_by: auth.user.id
  });

  const { data, error } = await admin.from(config.table).insert(insertPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({
    request,
    user: auth.user,
    moduleKey: config.module,
    actionKey: "create",
    tableName: config.table,
    recordId: data.id,
    newValue: data
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function handleEntityPatch(entity: string, request: NextRequest) {
  const config = entityConfigs[entity as EntityKey];
  if (!config) return NextResponse.json({ error: "Unknown entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const payload = await request.json();
  const id = payload.id;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  let existingQuery = admin.from(config.table).select("*").eq("id", id);
  if (auth.user.company_id) existingQuery = existingQuery.eq("company_id", auth.user.company_id);
  const { data: oldValue, error: oldError } = await existingQuery.single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });

  const { id: _ignored, ...rest } = normalizePayload(payload);
  const updatePayload = {
    ...rest,
    updated_by: auth.user.id
  };

  const { data, error } = await admin.from(config.table).update(updatePayload).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({
    request,
    user: auth.user,
    moduleKey: config.module,
    actionKey: "edit",
    tableName: config.table,
    recordId: data.id,
    oldValue,
    newValue: data
  });

  return NextResponse.json({ data });
}

export async function handleEntityDelete(entity: string, request: NextRequest) {
  const config = entityConfigs[entity as EntityKey];
  if (!config) return NextResponse.json({ error: "Unknown entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const admin = createAdminSupabase();
  let existingQuery = admin.from(config.table).select("*").eq("id", id);
  if (auth.user.company_id) existingQuery = existingQuery.eq("company_id", auth.user.company_id);
  const { data: oldValue, error: oldError } = await existingQuery.single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });

  const { error } = await admin.from(config.table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({
    request,
    user: auth.user,
    moduleKey: config.module,
    actionKey: "delete",
    tableName: config.table,
    recordId: id,
    oldValue
  });

  return NextResponse.json({ ok: true });
}

export function entityKeys() {
  return allowedEntityKeys;
}

function normalizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (value === "") return [key, null];
      if (typeof value === "string" && value.trim() === "") return [key, null];
      return [key, value];
    })
  );
}
