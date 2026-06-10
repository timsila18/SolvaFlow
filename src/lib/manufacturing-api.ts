import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { manufacturingConfigs, type ManufacturingKey, type OptionSource } from "@/lib/manufacturing";

const optionSources: Record<OptionSource, { table: string; value: string; label: string; tenantColumn: "company_id" | "tenant_id" | null; order: string }> = {
  products: { table: "products", value: "id", label: "product_name", tenantColumn: "company_id", order: "product_name" },
  product_categories: { table: "product_categories", value: "id", label: "category_name", tenantColumn: "company_id", order: "category_name" },
  units_of_measure: { table: "units_of_measure", value: "id", label: "unit_name", tenantColumn: "company_id", order: "unit_name" },
  warehouses: { table: "warehouses", value: "id", label: "warehouse_name", tenantColumn: "company_id", order: "warehouse_name" },
  users: { table: "user_profiles", value: "id", label: "full_name", tenantColumn: "company_id", order: "full_name" },
  production_lines: { table: "production_lines", value: "id", label: "line_name", tenantColumn: "tenant_id", order: "line_name" },
  machines: { table: "machines", value: "id", label: "machine_name", tenantColumn: "tenant_id", order: "machine_name" },
  recipes: { table: "recipes", value: "id", label: "recipe_name", tenantColumn: "tenant_id", order: "recipe_name" },
  recipe_versions: { table: "recipe_versions", value: "id", label: "recipe_name", tenantColumn: "tenant_id", order: "recipe_name" },
  production_plans: { table: "production_plans", value: "id", label: "plan_number", tenantColumn: "tenant_id", order: "created_at" },
  production_orders: { table: "production_orders", value: "id", label: "production_order_number", tenantColumn: "tenant_id", order: "created_at" },
  production_batches: { table: "production_batches", value: "id", label: "batch_number", tenantColumn: "tenant_id", order: "created_at" },
  product_quality_templates: { table: "product_quality_templates", value: "id", label: "template_name", tenantColumn: "tenant_id", order: "template_name" }
};

export async function handleManufacturingGet(entity: string, request: NextRequest) {
  const config = manufacturingConfigs[entity as ManufacturingKey];
  if (!config) return NextResponse.json({ error: "Unknown manufacturing entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const id = request.nextUrl.searchParams.get("id");

  let query = admin.from(config.table).select("*").order("created_at", { ascending: false }).limit(100);
  if (id) query = query.eq("id", id);
  if (auth.user.company_id) query = query.eq("tenant_id", auth.user.company_id);
  if (search) query = query.or(config.searchFields.map((field) => `${field}.ilike.%${search}%`).join(","));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, config });
}

export async function handleManufacturingPost(entity: string, request: NextRequest) {
  const config = manufacturingConfigs[entity as ManufacturingKey];
  if (!config) return NextResponse.json({ error: "Unknown manufacturing entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });

  const admin = createAdminSupabase();
  const payload = normalizePayload(await request.json());
  const insertPayload = {
    ...payload,
    tenant_id: auth.user.company_id,
    created_by: auth.user.id,
    updated_by: auth.user.id
  };

  const { data, error } = await admin.from(config.table).insert(insertPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({
    request,
    user: auth.user,
    moduleKey: "manufacturing",
    actionKey: `${config.singular.toLowerCase().replace(/\s+/g, "_")}_created`,
    tableName: config.table,
    recordId: data.id,
    newValue: data
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function handleManufacturingPatch(entity: string, request: NextRequest) {
  const config = manufacturingConfigs[entity as ManufacturingKey];
  if (!config) return NextResponse.json({ error: "Unknown manufacturing entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const payload = normalizePayload(await request.json());
  const id = payload.id;
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing id." }, { status: 400 });

  let oldQuery = admin.from(config.table).select("*").eq("id", id);
  if (auth.user.company_id) oldQuery = oldQuery.eq("tenant_id", auth.user.company_id);
  const { data: oldValue, error: oldError } = await oldQuery.single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });

  const { id: _ignored, tenant_id: _tenant, created_by: _createdBy, created_at: _createdAt, ...updates } = payload;
  const { data, error } = await admin
    .from(config.table)
    .update({ ...updates, updated_by: auth.user.id })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({
    request,
    user: auth.user,
    moduleKey: "manufacturing",
    actionKey: `${config.singular.toLowerCase().replace(/\s+/g, "_")}_updated`,
    tableName: config.table,
    recordId: id,
    oldValue,
    newValue: data
  });

  return NextResponse.json({ data });
}

export async function handleManufacturingDelete(entity: string, request: NextRequest) {
  const config = manufacturingConfigs[entity as ManufacturingKey];
  if (!config) return NextResponse.json({ error: "Unknown manufacturing entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const admin = createAdminSupabase();
  let oldQuery = admin.from(config.table).select("*").eq("id", id);
  if (auth.user.company_id) oldQuery = oldQuery.eq("tenant_id", auth.user.company_id);
  const { data: oldValue, error: oldError } = await oldQuery.single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });

  const { error } = await admin.from(config.table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await auditAction({
    request,
    user: auth.user,
    moduleKey: "manufacturing",
    actionKey: `${config.singular.toLowerCase().replace(/\s+/g, "_")}_deleted`,
    tableName: config.table,
    recordId: id,
    oldValue
  });

  return NextResponse.json({ ok: true });
}

export async function handleManufacturingOptions() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const entries = await Promise.all(
    Object.entries(optionSources).map(async ([key, source]) => {
      let query = admin.from(source.table).select(`${source.value}, ${source.label}`).order(source.order, { ascending: source.order !== "created_at" }).limit(200);
      if (source.tenantColumn && auth.user.company_id) query = query.eq(source.tenantColumn, auth.user.company_id);
      const { data } = await query as { data: Array<Record<string, unknown>> | null };
      return [
        key,
        (data ?? []).map((row: Record<string, unknown>) => ({
          value: String(row[source.value]),
          label: String(row[source.label] ?? row[source.value])
        }))
      ];
    })
  );

  return NextResponse.json({ options: Object.fromEntries(entries) });
}

export async function handleManufacturingAction(entity: string, request: NextRequest) {
  const config = manufacturingConfigs[entity as ManufacturingKey];
  if (!config) return NextResponse.json({ error: "Unknown manufacturing entity." }, { status: 404 });

  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });

  const admin = createAdminSupabase();
  const { id, action, payload = {} } = await request.json();
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  if (entity === "recipes" || entity === "recipe_versions") {
    return recipeAction({ request, admin, user: auth.user, config, id, action });
  }
  if (entity === "production_orders") {
    return productionOrderAction({ request, admin, user: auth.user, id, action, payload });
  }
  if (entity === "quality_checks") {
    return qcAction({ request, admin, user: auth.user, id, payload });
  }

  return NextResponse.json({ error: "Action is not available for this entity." }, { status: 400 });
}

export async function getMaterialAvailability(recipeVersionId: string, plannedQuantity: number) {
  const admin = createAdminSupabase();
  const { data: recipe } = await admin.from("recipe_versions").select("output_quantity").eq("id", recipeVersionId).single();
  const multiplier = recipe?.output_quantity ? plannedQuantity / Number(recipe.output_quantity) : 1;
  const { data: lines, error } = await admin
    .from("recipe_lines")
    .select("*, products(product_name, reorder_level), units_of_measure(unit_name)")
    .eq("recipe_version_id", recipeVersionId);

  if (error) throw new Error(error.message);

  const balances = await Promise.all((lines ?? []).map((line: any) =>
    admin.from("stock_balances").select("available_quantity, warehouses(warehouse_name)").eq("product_id", line.input_item_id).eq("qc_status", "Approved")
  ));

  return (lines ?? []).map((line: any, index: number) => {
    const required = Number(line.quantity_required ?? 0) * multiplier;
    const balanceRows = balances[index].data ?? [];
    const available = balanceRows.reduce((sum: number, row: any) => sum + Number(row.available_quantity ?? 0), 0);
    return {
      item_id: line.input_item_id,
      item_name: line.products?.product_name ?? line.input_item_id,
      unit: line.units_of_measure?.unit_name ?? "",
      required_quantity: required,
      available_quantity: available,
      shortage_quantity: Math.max(required - available, 0),
      warehouse_location: balanceRows.map((row: any) => row.warehouses?.warehouse_name).filter(Boolean).join(", "),
      reorder_level: line.products?.reorder_level ?? 0,
      unit_of_measure_id: line.unit_of_measure_id
    };
  });
}

async function recipeAction(input: { request: NextRequest; admin: ReturnType<typeof createAdminSupabase>; user: any; config: any; id: string; action: string }) {
  const statusMap: Record<string, string> = {
    submit: "Submitted for Approval",
    approve: "Approved",
    activate: "Active",
    archive: "Archived"
  };
  const nextStatus = statusMap[input.action];
  if (!nextStatus) return NextResponse.json({ error: "Unknown recipe action." }, { status: 400 });

  const table = input.config.table;
  const extra = input.action === "approve" ? { approved_by: input.user.id, approval_date: new Date().toISOString() } : {};
  const { data, error } = await input.admin
    .from(table)
    .update({ status: nextStatus, updated_by: input.user.id, ...extra })
    .eq("id", input.id)
    .eq("tenant_id", input.user.company_id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (table === "recipe_versions" && nextStatus === "Active") {
    await input.admin.from("recipes").update({ status: "Active", current_version_id: input.id, updated_by: input.user.id }).eq("id", data.recipe_id);
  }

  await input.admin.from("notifications").insert({
    company_id: input.user.company_id,
    channel: "In-App",
    event_key: "recipe_workflow",
    title: `Recipe ${nextStatus}`,
    message: `${data.recipe_name ?? data.recipe_code} is now ${nextStatus}.`,
    status: "Queued"
  });

  await auditAction({ request: input.request, user: input.user, moduleKey: "manufacturing", actionKey: `recipe_${input.action}`, tableName: table, recordId: input.id, newValue: data });
  return NextResponse.json({ data });
}

async function productionOrderAction(input: { request: NextRequest; admin: ReturnType<typeof createAdminSupabase>; user: any; id: string; action: string; payload: Record<string, unknown> }) {
  const { data: order, error: orderError } = await input.admin
    .from("production_orders")
    .select("*")
    .eq("id", input.id)
    .eq("tenant_id", input.user.company_id)
    .single();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 404 });

  if (input.action === "approve") {
    const availability = await getMaterialAvailability(order.recipe_version_id, Number(order.planned_quantity));
    const hasShortage = availability.some((item) => item.shortage_quantity > 0);
    if (hasShortage && !input.payload.override_shortage) {
      await notifyShortage(input.admin, input.user.company_id, order.production_order_number);
      return NextResponse.json({ error: "Material shortage detected. Approval requires shortage override permission.", availability }, { status: 409 });
    }
    return updateOrderStatus(input, "Approved", "production_order_approved", { availability });
  }

  if (input.action === "reserve") {
    const availability = await getMaterialAvailability(order.recipe_version_id, Number(order.planned_quantity));
    const rows = availability.map((item) => ({
      tenant_id: input.user.company_id,
      production_order_id: input.id,
      item_id: item.item_id,
      required_quantity: item.required_quantity,
      reserved_quantity: Math.max(item.required_quantity - item.shortage_quantity, 0),
      available_quantity_snapshot: item.available_quantity,
      shortage_quantity: item.shortage_quantity,
      unit_of_measure_id: item.unit_of_measure_id,
      status: item.shortage_quantity > 0 ? "Shortage" : "Reserved",
      created_by: input.user.id,
      updated_by: input.user.id
    }));
    if (rows.length) await input.admin.from("production_material_reservations").insert(rows);
    await auditAction({ request: input.request, user: input.user, moduleKey: "manufacturing", actionKey: "materials_reserved", tableName: "production_orders", recordId: input.id, newValue: rows });
    return updateOrderStatus(input, "Materials Reserved", "materials_reserved", { availability });
  }

  if (input.action === "start") {
    return updateOrderStatus(input, "In Production", "production_started", { start_time: new Date().toISOString(), ...input.payload });
  }

  if (input.action === "complete") {
    const actualQuantity = Number(input.payload.actual_quantity ?? order.actual_quantity ?? order.planned_quantity);
    const totalCost = Number(order.actual_material_cost || order.planned_material_cost || 0) + Number(order.labour_cost_placeholder || 0) + Number(order.overhead_cost_placeholder || 0) + Number(order.packaging_cost || 0) + Number(order.wastage_cost || 0);
    const { data: updated, error } = await input.admin
      .from("production_orders")
      .update({
        status: "Completed",
        actual_quantity: actualQuantity,
        completion_time: new Date().toISOString(),
        total_production_cost: totalCost,
        cost_per_unit: actualQuantity > 0 ? totalCost / actualQuantity : 0,
        updated_by: input.user.id,
        ...input.payload
      })
      .eq("id", input.id)
      .eq("tenant_id", input.user.company_id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: batch } = await input.admin.from("production_batches").insert({
      tenant_id: input.user.company_id,
      product_id: order.finished_product_id,
      production_order_id: input.id,
      recipe_version_id: order.recipe_version_id,
      production_date: order.production_date,
      expiry_date: input.payload.expiry_date ?? null,
      quantity_produced: actualQuantity,
      quantity_available: actualQuantity,
      warehouse_id: input.payload.warehouse_id ?? null,
      supervisor_id: order.assigned_supervisor_id,
      quality_status: "Pending",
      created_by: input.user.id,
      updated_by: input.user.id
    }).select("*").single();

    await auditAction({ request: input.request, user: input.user, moduleKey: "manufacturing", actionKey: "production_completed", tableName: "production_orders", recordId: input.id, newValue: { updated, batch } });
    return NextResponse.json({ data: updated, batch });
  }

  return NextResponse.json({ error: "Unknown production order action." }, { status: 400 });
}

async function qcAction(input: { request: NextRequest; admin: ReturnType<typeof createAdminSupabase>; user: any; id: string; payload: Record<string, unknown> }) {
  const decision = String(input.payload.decision ?? "Approved for Stock");
  const { data, error } = await input.admin
    .from("quality_checks")
    .update({ decision, status: "Approved", approved_by: input.user.id, updated_by: input.user.id })
    .eq("id", input.id)
    .eq("tenant_id", input.user.company_id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data.batch_id) {
    await input.admin.from("production_batches").update({ quality_status: decision, updated_by: input.user.id }).eq("id", data.batch_id);
  }

  await auditAction({ request: input.request, user: input.user, moduleKey: "manufacturing", actionKey: "qc_completed", tableName: "quality_checks", recordId: input.id, newValue: data });
  return NextResponse.json({ data });
}

async function updateOrderStatus(input: { request: NextRequest; admin: ReturnType<typeof createAdminSupabase>; user: any; id: string; action: string; payload: Record<string, unknown> }, status: string, auditKey: string, updates: Record<string, unknown> = {}) {
  const { data, error } = await input.admin
    .from("production_orders")
    .update({ status, updated_by: input.user.id, ...updates })
    .eq("id", input.id)
    .eq("tenant_id", input.user.company_id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request: input.request, user: input.user, moduleKey: "manufacturing", actionKey: auditKey, tableName: "production_orders", recordId: input.id, newValue: data });
  return NextResponse.json({ data });
}

async function notifyShortage(admin: ReturnType<typeof createAdminSupabase>, companyId: string, orderNumber: string) {
  await admin.from("notifications").insert({
    company_id: companyId,
    channel: "In-App",
    event_key: "material_shortage",
    title: "Material shortage",
    message: `Production order ${orderNumber} has insufficient required materials.`,
    status: "Queued"
  });
}

function normalizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (value === "") return [key, null];
      if (key === "parameters_checked" && typeof value === "string") {
        try {
          return [key, JSON.parse(value)];
        } catch {
          return [key, []];
        }
      }
      return [key, value];
    })
  );
}
