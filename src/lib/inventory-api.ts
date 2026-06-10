import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { inventoryConfigs, type InventoryKey, type InventoryOptionSource } from "@/lib/inventory";

const optionSources: Record<InventoryOptionSource, { table: string; value: string; label: string; tenantColumn: "company_id" | "tenant_id" | null; order: string }> = {
  products: { table: "products", value: "id", label: "product_name", tenantColumn: "company_id", order: "product_name" },
  product_categories: { table: "product_categories", value: "id", label: "category_name", tenantColumn: "company_id", order: "category_name" },
  units_of_measure: { table: "units_of_measure", value: "id", label: "unit_name", tenantColumn: "company_id", order: "unit_name" },
  warehouses: { table: "warehouses", value: "id", label: "warehouse_name", tenantColumn: "company_id", order: "warehouse_name" },
  suppliers: { table: "suppliers", value: "id", label: "supplier_name", tenantColumn: "company_id", order: "supplier_name" },
  users: { table: "user_profiles", value: "id", label: "full_name", tenantColumn: "company_id", order: "full_name" },
  production_batches: { table: "production_batches", value: "id", label: "batch_number", tenantColumn: "tenant_id", order: "created_at" },
  warehouse_transfers: { table: "warehouse_transfers", value: "id", label: "transfer_number", tenantColumn: "tenant_id", order: "created_at" },
  stock_adjustments: { table: "stock_adjustments", value: "id", label: "adjustment_number", tenantColumn: "tenant_id", order: "created_at" },
  stock_counts: { table: "stock_counts", value: "id", label: "count_number", tenantColumn: "tenant_id", order: "created_at" },
  procurement_requests: { table: "procurement_requests", value: "id", label: "request_number", tenantColumn: "tenant_id", order: "created_at" },
  purchase_orders: { table: "purchase_orders", value: "id", label: "purchase_order_number", tenantColumn: "tenant_id", order: "created_at" },
  purchase_order_lines: { table: "purchase_order_lines", value: "id", label: "product_id", tenantColumn: "tenant_id", order: "created_at" },
  goods_received_notes: { table: "goods_received_notes", value: "id", label: "grn_number", tenantColumn: "tenant_id", order: "created_at" },
  supplier_returns: { table: "supplier_returns", value: "id", label: "supplier_return_number", tenantColumn: "tenant_id", order: "created_at" },
  opening_balances: { table: "opening_balances", value: "id", label: "opening_balance_number", tenantColumn: "tenant_id", order: "created_at" },
  price_lists: { table: "price_lists", value: "id", label: "price_list_name", tenantColumn: "tenant_id", order: "price_list_name" }
};

export async function handleInventoryGet(entity: string, request: NextRequest) {
  const config = inventoryConfigs[entity as InventoryKey];
  if (!config) return NextResponse.json({ error: "Unknown inventory entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;

  const admin = createAdminSupabase();
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const id = request.nextUrl.searchParams.get("id");
  let query = admin.from(config.table).select("*").order("created_at", { ascending: false }).limit(100);
  if (id) query = query.eq("id", id);
  if (auth.user.company_id) query = query.eq("tenant_id", auth.user.company_id);
  if (search && config.searchFields.length) query = query.or(config.searchFields.map((field) => `${field}.ilike.%${search}%`).join(","));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, config });
}

export async function handleInventoryPost(entity: string, request: NextRequest) {
  const config = inventoryConfigs[entity as InventoryKey];
  if (!config) return NextResponse.json({ error: "Unknown inventory entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });

  const admin = createAdminSupabase();
  const payload = normalizePayload(await request.json());
  const insertPayload = { ...payload, tenant_id: auth.user.company_id, created_by: auth.user.id, updated_by: auth.user.id };
  const { data, error } = await admin.from(config.table).insert(insertPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: "inventory", actionKey: `${config.singular.toLowerCase().replace(/\s+/g, "_")}_created`, tableName: config.table, recordId: data.id, newValue: data });
  return NextResponse.json({ data }, { status: 201 });
}

export async function handleInventoryPatch(entity: string, request: NextRequest) {
  const config = inventoryConfigs[entity as InventoryKey];
  if (!config) return NextResponse.json({ error: "Unknown inventory entity." }, { status: 404 });
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
  const { id: _id, tenant_id: _tenant, created_at: _createdAt, created_by: _createdBy, ...updates } = payload;
  const { data, error } = await admin.from(config.table).update({ ...updates, updated_by: auth.user.id }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: "inventory", actionKey: `${config.singular.toLowerCase().replace(/\s+/g, "_")}_updated`, tableName: config.table, recordId: id, oldValue, newValue: data });
  return NextResponse.json({ data });
}

export async function handleInventoryDelete(entity: string, request: NextRequest) {
  const config = inventoryConfigs[entity as InventoryKey];
  if (!config) return NextResponse.json({ error: "Unknown inventory entity." }, { status: 404 });
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
  await auditAction({ request, user: auth.user, moduleKey: "inventory", actionKey: `${config.singular.toLowerCase().replace(/\s+/g, "_")}_deleted`, tableName: config.table, recordId: id, oldValue });
  return NextResponse.json({ ok: true });
}

export async function handleInventoryOptions() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const admin = createAdminSupabase();
  const entries = await Promise.all(Object.entries(optionSources).map(async ([key, source]) => {
    let query = admin.from(source.table).select(`${source.value}, ${source.label}`).order(source.order, { ascending: source.order !== "created_at" }).limit(250);
    if (source.tenantColumn && auth.user.company_id) query = query.eq(source.tenantColumn, auth.user.company_id);
    const { data } = await query as { data: Array<Record<string, unknown>> | null };
    return [key, (data ?? []).map((row) => ({ value: String(row[source.value]), label: String(row[source.label] ?? row[source.value]) }))];
  }));
  return NextResponse.json({ options: Object.fromEntries(entries) });
}

export async function handleInventoryAction(entity: string, request: NextRequest) {
  const config = inventoryConfigs[entity as InventoryKey];
  if (!config) return NextResponse.json({ error: "Unknown inventory entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });
  const admin = createAdminSupabase();
  const { id, action } = await request.json();
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  if (entity === "warehouse_transfers") return transferAction({ request, admin, user: auth.user, id, action });
  if (entity === "stock_adjustments") return adjustmentAction({ request, admin, user: auth.user, id, action });
  if (entity === "stock_counts") return countAction({ request, admin, user: auth.user, id, action });
  if (entity === "goods_received_notes") return grnAction({ request, admin, user: auth.user, id, action });
  if (entity === "opening_balances") return openingBalanceAction({ request, admin, user: auth.user, id, action });
  return simpleWorkflowAction({ request, admin, user: auth.user, config, id, action });
}

export async function postStockMovement(input: {
  admin: ReturnType<typeof createAdminSupabase>;
  tenantId: string;
  userId: string;
  transactionType: string;
  productId: string;
  warehouseId: string;
  batchNumber?: string | null;
  expiryDate?: string | null;
  unitOfMeasureId?: string | null;
  quantityIn?: number;
  quantityOut?: number;
  unitCost?: number;
  qcStatus?: string;
  referenceDocument?: string;
  referenceId?: string;
}) {
  const quantityIn = Number(input.quantityIn ?? 0);
  const quantityOut = Number(input.quantityOut ?? 0);
  const unitCost = Number(input.unitCost ?? 0);
  const qcStatus = input.qcStatus ?? "Approved";
  const { data: existing } = await input.admin
    .from("stock_balances")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("product_id", input.productId)
    .eq("warehouse_id", input.warehouseId)
    .eq("batch_number", input.batchNumber ?? "")
    .eq("qc_status", qcStatus)
    .maybeSingle();
  const oldQty = Number(existing?.total_quantity ?? 0);
  const newQty = oldQty + quantityIn - quantityOut;
  if (newQty < 0) throw new Error("Insufficient stock. Negative stock is not allowed.");
  const oldValue = Number(existing?.total_value ?? 0);
  const incomingValue = quantityIn * unitCost;
  const outgoingValue = quantityOut * Number(existing?.weighted_average_cost ?? unitCost);
  const newValue = Math.max(oldValue + incomingValue - outgoingValue, 0);
  const avgCost = newQty > 0 ? newValue / newQty : unitCost;
  const payload = {
    tenant_id: input.tenantId,
    product_id: input.productId,
    warehouse_id: input.warehouseId,
    batch_number: input.batchNumber ?? "",
    expiry_date: input.expiryDate ?? null,
    unit_of_measure_id: input.unitOfMeasureId ?? null,
    qc_status: qcStatus,
    total_quantity: newQty,
    qc_hold_quantity: qcStatus === "On Hold" ? newQty : 0,
    damaged_quantity: qcStatus === "Damaged" ? newQty : 0,
    expired_quantity: qcStatus === "Expired" ? newQty : 0,
    weighted_average_cost: avgCost,
    total_value: newValue,
    last_movement_at: new Date().toISOString(),
    updated_by: input.userId
  };
  const { data: balance, error: balanceError } = existing
    ? await input.admin.from("stock_balances").update(payload).eq("id", existing.id).select("*").single()
    : await input.admin.from("stock_balances").insert({ ...payload, created_by: input.userId }).select("*").single();
  if (balanceError) throw new Error(balanceError.message);
  const { data: ledger, error: ledgerError } = await input.admin.from("stock_ledger").insert({
    tenant_id: input.tenantId,
    transaction_type: input.transactionType,
    product_id: input.productId,
    warehouse_id: input.warehouseId,
    batch_number: input.batchNumber ?? "",
    quantity_in: quantityIn,
    quantity_out: quantityOut,
    balance_after_transaction: newQty,
    unit_cost: quantityOut > 0 ? Number(existing?.weighted_average_cost ?? unitCost) : unitCost,
    total_value: quantityIn > 0 ? incomingValue : outgoingValue,
    reference_document: input.referenceDocument,
    reference_id: input.referenceId,
    created_by: input.userId,
    updated_by: input.userId
  }).select("*").single();
  if (ledgerError) throw new Error(ledgerError.message);
  return { balance, ledger };
}

async function transferAction(input: ActionInput) {
  if (["submit", "approve"].includes(input.action)) return simpleWorkflowAction({ ...input, config: inventoryConfigs.warehouse_transfers, status: input.action === "submit" ? "Submitted" : "Approved" });
  const { data: transfer, error } = await input.admin.from("warehouse_transfers").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const { data: lines } = await input.admin.from("warehouse_transfer_lines").select("*").eq("transfer_id", input.id);
  try {
    if (input.action === "dispatch") {
      for (const line of lines ?? []) {
        await postStockMovement({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, transactionType: "Warehouse Transfer", productId: line.product_id, warehouseId: transfer.source_warehouse_id, batchNumber: line.batch_number, quantityOut: Number(line.quantity), unitCost: Number(line.unit_cost), referenceDocument: transfer.transfer_number, referenceId: input.id });
      }
      return setStatus(input, "warehouse_transfers", "In Transit", "stock_transferred", { dispatched_by: input.user.id });
    }
    if (input.action === "receive") {
      for (const line of lines ?? []) {
        await postStockMovement({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, transactionType: "Warehouse Transfer", productId: line.product_id, warehouseId: transfer.destination_warehouse_id, batchNumber: line.batch_number, quantityIn: Number(line.quantity), unitCost: Number(line.unit_cost), referenceDocument: transfer.transfer_number, referenceId: input.id });
      }
      return setStatus(input, "warehouse_transfers", "Received", "stock_transfer_received", { received_by: input.user.id });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Transfer action failed." }, { status: 400 });
  }
  return NextResponse.json({ error: "Unknown transfer action." }, { status: 400 });
}

async function adjustmentAction(input: ActionInput) {
  if (["submit", "approve"].includes(input.action)) return simpleWorkflowAction({ ...input, config: inventoryConfigs.stock_adjustments, status: input.action === "submit" ? "Submitted" : "Approved" });
  if (input.action !== "post") return NextResponse.json({ error: "Unknown adjustment action." }, { status: 400 });
  const { data: adjustment } = await input.admin.from("stock_adjustments").select("*").eq("id", input.id).single();
  const { data: lines } = await input.admin.from("stock_adjustment_lines").select("*").eq("adjustment_id", input.id);
  try {
    for (const line of lines ?? []) {
      const qty = Math.abs(Number(line.adjustment_quantity));
      const increases = adjustment.adjustment_type === "Increase" || Number(line.adjustment_quantity) > 0;
      await postStockMovement({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, transactionType: adjustment.adjustment_type === "Damage" ? "Damage" : adjustment.adjustment_type === "Expiry" ? "Expiry Write-Off" : "Stock Adjustment", productId: line.product_id, warehouseId: line.warehouse_id, batchNumber: line.batch_number, quantityIn: increases ? qty : 0, quantityOut: increases ? 0 : qty, unitCost: Number(line.unit_cost), qcStatus: adjustment.adjustment_type === "Damage" ? "Damaged" : adjustment.adjustment_type === "Expiry" ? "Expired" : "Approved", referenceDocument: adjustment.adjustment_number, referenceId: input.id });
    }
    return setStatus(input, "stock_adjustments", "Posted", "stock_adjusted");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Adjustment posting failed." }, { status: 400 });
  }
}

async function countAction(input: ActionInput) {
  if (["submit", "approve"].includes(input.action)) return simpleWorkflowAction({ ...input, config: inventoryConfigs.stock_counts, status: input.action === "submit" ? "Submitted" : "Approved" });
  if (input.action !== "post") return NextResponse.json({ error: "Unknown count action." }, { status: 400 });
  const { data: count } = await input.admin.from("stock_counts").select("*").eq("id", input.id).single();
  const { data: lines } = await input.admin.from("stock_count_lines").select("*").eq("stock_count_id", input.id);
  try {
    for (const line of lines ?? []) {
      const variance = Number(line.counted_quantity) - Number(line.system_quantity);
      if (variance === 0) continue;
      await postStockMovement({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, transactionType: variance > 0 ? "Stock Count Gain" : "Stock Count Loss", productId: line.product_id, warehouseId: count.warehouse_id, batchNumber: line.batch_number, quantityIn: variance > 0 ? variance : 0, quantityOut: variance < 0 ? Math.abs(variance) : 0, referenceDocument: count.count_number, referenceId: input.id });
    }
    await input.admin.from("notifications").insert({ company_id: input.user.company_id, channel: "In-App", event_key: "stock_count_posted", title: "Stock count posted", message: `${count.count_number} has been posted.`, status: "Queued" });
    return setStatus(input, "stock_counts", "Posted", "stock_counted");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Stock count posting failed." }, { status: 400 });
  }
}

async function grnAction(input: ActionInput) {
  if (input.action !== "post") return NextResponse.json({ error: "Unknown GRN action." }, { status: 400 });
  const { data: grn } = await input.admin.from("goods_received_notes").select("*").eq("id", input.id).single();
  const { data: lines } = await input.admin.from("goods_received_note_lines").select("*").eq("grn_id", input.id);
  try {
    for (const line of lines ?? []) {
      await postStockMovement({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, transactionType: "Purchase Receipt", productId: line.product_id, warehouseId: grn.warehouse_id, batchNumber: line.batch_number, expiryDate: line.expiry_date, quantityIn: Number(line.quantity_accepted), unitCost: Number(line.unit_cost), qcStatus: line.qc_required ? "On Hold" : "Approved", referenceDocument: grn.grn_number, referenceId: input.id });
    }
    if (grn.purchase_order_id) await input.admin.from("purchase_orders").update({ status: "Partially Received", updated_by: input.user.id }).eq("id", grn.purchase_order_id);
    await input.admin.from("notifications").insert({ company_id: input.user.company_id, channel: "In-App", event_key: "grn_posted", title: "GRN posted", message: `${grn.grn_number} has been posted to stock.`, status: "Queued" });
    return setStatus(input, "goods_received_notes", "Posted", "grn_posted");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "GRN posting failed." }, { status: 400 });
  }
}

async function openingBalanceAction(input: ActionInput) {
  if (input.action === "approve") return simpleWorkflowAction({ ...input, config: inventoryConfigs.opening_balances, status: "Approved" });
  if (input.action !== "post") return NextResponse.json({ error: "Unknown opening balance action." }, { status: 400 });
  const { data: opening } = await input.admin.from("opening_balances").select("*").eq("id", input.id).single();
  const { data: lines } = await input.admin.from("opening_balance_lines").select("*").eq("opening_balance_id", input.id);
  try {
    for (const line of lines ?? []) {
      await postStockMovement({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, transactionType: "Opening Balance", productId: line.product_id, warehouseId: line.warehouse_id, batchNumber: line.batch_number, expiryDate: line.expiry_date, quantityIn: Number(line.quantity), unitCost: Number(line.unit_cost), referenceDocument: opening.opening_balance_number, referenceId: input.id });
    }
    return setStatus(input, "opening_balances", "Posted", "opening_balance_posted");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Opening balance posting failed." }, { status: 400 });
  }
}

async function simpleWorkflowAction(input: ActionInput & { config: any; status?: string }) {
  const statusMap: Record<string, string> = { submit: "Submitted", approve: "Approved", reject: "Rejected", dispatch: "Dispatched to Supplier", convert: "Converted to Procurement Request" };
  const nextStatus = input.status ?? statusMap[input.action];
  if (!nextStatus) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  return setStatus(input, input.config.table, nextStatus, `${input.config.singular.toLowerCase().replace(/\s+/g, "_")}_${input.action}`);
}

async function setStatus(input: ActionInput, table: string, status: string, auditKey: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await input.admin.from(table).update({ status, updated_by: input.user.id, ...extra }).eq("id", input.id).eq("tenant_id", input.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request: input.request, user: input.user, moduleKey: "inventory", actionKey: auditKey, tableName: table, recordId: input.id, newValue: data });
  return NextResponse.json({ data });
}

type ActionInput = { request: NextRequest; admin: ReturnType<typeof createAdminSupabase>; user: any; id: string; action: string };

function normalizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === "" ? null : value]));
}
