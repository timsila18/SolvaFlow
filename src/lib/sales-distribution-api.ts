import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser, type AppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { postStockMovement } from "@/lib/inventory-api";
import { salesDistributionConfigs, type SalesDistributionKey, type SalesDistributionOptionSource } from "@/lib/sales-distribution";

type Admin = ReturnType<typeof createAdminSupabase>;

const optionSources: Record<SalesDistributionOptionSource, { table: string; value: string; label: string; tenantColumn: "company_id" | "tenant_id" | null; order: string }> = {
  products: { table: "products", value: "id", label: "product_name", tenantColumn: "company_id", order: "product_name" },
  units_of_measure: { table: "units_of_measure", value: "id", label: "unit_name", tenantColumn: "company_id", order: "unit_name" },
  customers: { table: "customers", value: "id", label: "customer_name", tenantColumn: "company_id", order: "customer_name" },
  territories: { table: "territories", value: "id", label: "territory_name", tenantColumn: "company_id", order: "territory_name" },
  routes: { table: "routes", value: "id", label: "route_name", tenantColumn: "company_id", order: "route_name" },
  warehouses: { table: "warehouses", value: "id", label: "warehouse_name", tenantColumn: "company_id", order: "warehouse_name" },
  vehicles: { table: "vehicles", value: "id", label: "registration_number", tenantColumn: "company_id", order: "registration_number" },
  users: { table: "user_profiles", value: "id", label: "full_name", tenantColumn: "company_id", order: "full_name" },
  price_lists: { table: "price_lists", value: "id", label: "price_list_name", tenantColumn: "tenant_id", order: "price_list_name" },
  field_visits: { table: "field_visits", value: "id", label: "visit_number", tenantColumn: "tenant_id", order: "created_at" },
  route_plans: { table: "route_plans", value: "id", label: "route_plan_number", tenantColumn: "tenant_id", order: "created_at" },
  sales_orders: { table: "sales_orders", value: "id", label: "sales_order_number", tenantColumn: "tenant_id", order: "created_at" },
  sales_order_lines: { table: "sales_order_lines", value: "id", label: "product_id", tenantColumn: "tenant_id", order: "created_at" },
  dispatch_orders: { table: "dispatch_orders", value: "id", label: "dispatch_number", tenantColumn: "tenant_id", order: "created_at" },
  picking_lists: { table: "picking_lists", value: "id", label: "picking_number", tenantColumn: "tenant_id", order: "created_at" },
  delivery_notes: { table: "delivery_notes", value: "id", label: "delivery_note_number", tenantColumn: "tenant_id", order: "created_at" },
  driver_trips: { table: "driver_trips", value: "id", label: "trip_number", tenantColumn: "tenant_id", order: "created_at" },
  customer_returns: { table: "customer_returns", value: "id", label: "return_number", tenantColumn: "tenant_id", order: "created_at" },
  stock_balances: { table: "stock_balances", value: "id", label: "batch_number", tenantColumn: "tenant_id", order: "expiry_date" },
  production_batches: { table: "production_batches", value: "id", label: "batch_number", tenantColumn: "tenant_id", order: "created_at" }
};

export async function handleSalesDistributionGet(entity: string, request: NextRequest) {
  const config = salesDistributionConfigs[entity as SalesDistributionKey];
  if (!config) return NextResponse.json({ error: "Unknown sales distribution entity." }, { status: 404 });
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

export async function handleSalesDistributionPost(entity: string, request: NextRequest) {
  const config = salesDistributionConfigs[entity as SalesDistributionKey];
  if (!config) return NextResponse.json({ error: "Unknown sales distribution entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });

  const admin = createAdminSupabase();
  const payload = normalizePayload(await request.json());
  const insertPayload = { ...payload, tenant_id: auth.user.company_id, created_by: auth.user.id, updated_by: auth.user.id };
  const { data, error } = await admin.from(config.table).insert(insertPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: "sales_distribution", actionKey: `${slug(config.singular)}_created`, tableName: config.table, recordId: data.id, newValue: data });
  await notify(admin, auth.user.company_id, `${slug(config.singular)}_created`, `${config.singular} created`, `${config.singular} was created.`, data);
  return NextResponse.json({ data }, { status: 201 });
}

export async function handleSalesDistributionPatch(entity: string, request: NextRequest) {
  const config = salesDistributionConfigs[entity as SalesDistributionKey];
  if (!config) return NextResponse.json({ error: "Unknown sales distribution entity." }, { status: 404 });
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
  const { data, error } = await admin.from(config.table).update({ ...updates, updated_by: auth.user.id }).eq("id", id).eq("tenant_id", auth.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: "sales_distribution", actionKey: `${slug(config.singular)}_updated`, tableName: config.table, recordId: id, oldValue, newValue: data });
  return NextResponse.json({ data });
}

export async function handleSalesDistributionDelete(entity: string, request: NextRequest) {
  const config = salesDistributionConfigs[entity as SalesDistributionKey];
  if (!config) return NextResponse.json({ error: "Unknown sales distribution entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const admin = createAdminSupabase();
  const { data: oldValue, error: oldError } = await admin.from(config.table).select("*").eq("id", id).eq("tenant_id", auth.user.company_id).single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });
  const { error } = await admin.from(config.table).delete().eq("id", id).eq("tenant_id", auth.user.company_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: "sales_distribution", actionKey: `${slug(config.singular)}_deleted`, tableName: config.table, recordId: id, oldValue });
  return NextResponse.json({ ok: true });
}

export async function handleSalesDistributionOptions() {
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

export async function handleSalesDistributionAction(entity: string, request: NextRequest) {
  const config = salesDistributionConfigs[entity as SalesDistributionKey];
  if (!config) return NextResponse.json({ error: "Unknown sales distribution entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });

  const admin = createAdminSupabase();
  const body = await request.json();
  const { id, action } = body;
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  if (entity === "field_visits") return fieldVisitAction({ request, admin, user: auth.user, id, action, body });
  if (entity === "sales_orders") return salesOrderAction({ request, admin, user: auth.user, id, action });
  if (entity === "dispatch_orders") return dispatchAction({ request, admin, user: auth.user, id, action });
  if (entity === "delivery_confirmations") return deliveryConfirmationAction({ request, admin, user: auth.user, id, action, body });
  if (entity === "driver_trips") return driverTripAction({ request, admin, user: auth.user, id, action, body });
  if (entity === "failed_deliveries") return failedDeliveryAction({ request, admin, user: auth.user, id, action, body });
  if (entity === "customer_returns") return customerReturnAction({ request, admin, user: auth.user, id, action });
  return simpleWorkflowAction({ request, admin, user: auth.user, config, id, action });
}

export async function handleSalesDistributionDashboard() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const admin = createAdminSupabase();
  const tenantId = auth.user.company_id;
  const today = new Date().toISOString().slice(0, 10);

  const [orders, approvals, dispatches, inTransit, deliveries, failed, returns, visits, exceptions] = await Promise.all([
    count(admin, "sales_orders", tenantId, { order_date: today }),
    count(admin, "sales_orders", tenantId, { status: "Submitted" }),
    count(admin, "dispatch_orders", tenantId, { status: "Draft" }),
    count(admin, "dispatch_orders", tenantId, { status: "In Transit" }),
    count(admin, "dispatch_orders", tenantId, { status: "Delivered" }),
    count(admin, "failed_deliveries", tenantId, { status: "Open" }),
    count(admin, "customer_returns", tenantId, { status: "Submitted" }),
    count(admin, "field_visits", tenantId, { scheduled_date: today }),
    count(admin, "field_visits", tenantId, { location_exception: true })
  ]);
  const { data: orderRows } = await admin.from("sales_orders").select("total_amount").eq("tenant_id", tenantId).eq("order_date", today);
  const salesValue = (orderRows ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);

  const { data: byRep } = await admin
    .from("sales_orders")
    .select("sales_rep_id, total_amount")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    metrics: [
      { label: "Today's Sales Orders", value: orders },
      { label: "Pending Approvals", value: approvals },
      { label: "Awaiting Dispatch", value: dispatches },
      { label: "In Transit", value: inTransit },
      { label: "Delivered Orders", value: deliveries },
      { label: "Failed Deliveries", value: failed },
      { label: "Customer Returns", value: returns },
      { label: "Sales Value Today", value: salesValue.toFixed(2) },
      { label: "Planned Visits Today", value: visits },
      { label: "Location Exceptions", value: exceptions }
    ],
    byRep: byRep ?? []
  });
}

export async function handleStockAvailability(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Missing productId." }, { status: 400 });
  const admin = createAdminSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from("stock_balances")
    .select("id, product_id, warehouse_id, batch_number, expiry_date, total_quantity, reserved_quantity, available_quantity, weighted_average_cost, qc_status")
    .eq("tenant_id", auth.user.company_id)
    .eq("product_id", productId)
    .eq("qc_status", "Approved")
    .gt("available_quantity", 0)
    .or(`expiry_date.is.null,expiry_date.gte.${today}`)
    .order("expiry_date", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

async function fieldVisitAction(input: ActionInput & { body: Record<string, unknown> }) {
  const { data: visit, error } = await input.admin.from("field_visits").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const latitude = numberOrNull(input.body.latitude);
  const longitude = numberOrNull(input.body.longitude);
  const device = String(input.body.deviceInformation ?? "");

  if (input.action === "check_in") {
    const settings = await getSettings(input.admin, input.user.company_id);
    const { data: customer } = await input.admin.from("customers").select("gps_coordinates").eq("id", visit.customer_id).eq("company_id", input.user.company_id).maybeSingle();
    const customerCoords = parseCoordinates(customer?.gps_coordinates);
    const distance = latitude !== null && longitude !== null && customerCoords ? haversineMeters(latitude, longitude, customerCoords.lat, customerCoords.lng) : null;
    const allowed = Number(visit.allowed_radius_meters ?? settings.default_check_in_radius_meters ?? 100);
    const locationException = distance !== null && distance > allowed;
    return setStatus(input, "field_visits", locationException ? "Location Exception" : "Checked In", locationException ? "location_exception" : "field_visit_check_in", {
      check_in_at: new Date().toISOString(),
      latitude,
      longitude,
      distance_from_customer_meters: distance,
      allowed_radius_meters: allowed,
      device_information: device,
      location_exception: locationException,
      visit_status: locationException ? "Location Exception" : "Checked In"
    });
  }
  if (input.action === "check_out") {
    return setStatus(input, "field_visits", "Completed", "field_visit_check_out", { check_out_at: new Date().toISOString(), visit_status: "Completed" });
  }
  if (input.action === "complete") {
    return setStatus(input, "field_visits", "Completed", "field_visit_completed", { check_out_at: visit.check_out_at ?? new Date().toISOString(), visit_status: "Completed" });
  }
  return NextResponse.json({ error: "Unknown visit action." }, { status: 400 });
}

async function salesOrderAction(input: ActionInput) {
  if (input.action === "submit") return simpleWorkflowAction({ ...input, config: salesDistributionConfigs.sales_orders, status: "Submitted" });
  if (input.action === "approve") {
    const credit = await runCreditCheck(input);
    if (credit.blocked) return NextResponse.json({ error: credit.reason, creditCheck: credit.record }, { status: 409 });
    return setStatus(input, "sales_orders", "Approved", "sales_order_approved", { credit_status: credit.record.result, credit_exception: credit.record.result !== "Pass" });
  }
  if (input.action === "reserve") return reserveSalesOrder(input);
  return NextResponse.json({ error: "Unknown sales order action." }, { status: 400 });
}

async function runCreditCheck(input: ActionInput) {
  const { data: order, error } = await input.admin.from("sales_orders").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) throw new Error(error.message);
  const { data: customer } = await input.admin.from("customers").select("credit_limit").eq("id", order.customer_id).eq("company_id", input.user.company_id).single();
  const creditLimit = Number(customer?.credit_limit ?? 0);
  const orderAmount = Number(order.total_amount ?? 0);
  const result = creditLimit > 0 && orderAmount > creditLimit ? "Credit Exception" : "Pass";
  const recordPayload = {
    tenant_id: input.user.company_id,
    sales_order_id: input.id,
    customer_id: order.customer_id,
    credit_limit: creditLimit,
    outstanding_balance: 0,
    overdue_amount: 0,
    order_amount: orderAmount,
    result,
    exception_reason: result === "Credit Exception" ? "Order amount exceeds customer credit limit." : null,
    status: result === "Pass" ? "Closed" : "Open",
    created_by: input.user.id,
    updated_by: input.user.id
  };
  const { data: record, error: checkError } = await input.admin.from("customer_credit_checks").insert(recordPayload).select("*").single();
  if (checkError) throw new Error(checkError.message);
  await notify(input.admin, input.user.company_id, "credit_check_completed", "Customer credit checked", `Credit result: ${result}`, record);
  return { blocked: false, reason: null, record };
}

async function reserveSalesOrder(input: ActionInput) {
  const { data: order, error } = await input.admin.from("sales_orders").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const { data: lines } = await input.admin.from("sales_order_lines").select("*").eq("sales_order_id", input.id).eq("tenant_id", input.user.company_id);
  if (!lines?.length) return NextResponse.json({ error: "Add sales order lines before reserving stock." }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  try {
    for (const line of lines) {
      let remaining = Number(line.quantity);
      const { data: balances, error: balanceError } = await input.admin
        .from("stock_balances")
        .select("*")
        .eq("tenant_id", input.user.company_id)
        .eq("product_id", line.product_id)
        .eq("qc_status", "Approved")
        .gt("available_quantity", 0)
        .or(`expiry_date.is.null,expiry_date.gte.${today}`)
        .order("expiry_date", { ascending: true, nullsFirst: false });
      if (balanceError) throw new Error(balanceError.message);
      for (const balance of balances ?? []) {
        if (remaining <= 0) break;
        const reserveQty = Math.min(remaining, Number(balance.available_quantity ?? 0));
        if (reserveQty <= 0) continue;
        await input.admin.from("sales_order_stock_reservations").insert({
          tenant_id: input.user.company_id,
          sales_order_id: input.id,
          sales_order_line_id: line.id,
          product_id: line.product_id,
          warehouse_id: balance.warehouse_id,
          stock_balance_id: balance.id,
          batch_number: balance.batch_number,
          expiry_date: balance.expiry_date,
          quantity_reserved: reserveQty,
          created_by: input.user.id,
          updated_by: input.user.id
        });
        const { error: reserveError } = await input.admin
          .from("stock_balances")
          .update({ reserved_quantity: Number(balance.reserved_quantity ?? 0) + reserveQty, updated_by: input.user.id })
          .eq("id", balance.id);
        if (reserveError) throw new Error(reserveError.message);
        remaining -= reserveQty;
      }
      if (remaining > 0) throw new Error("Insufficient approved non-expired stock to reserve this sales order.");
    }
    return setStatus(input, "sales_orders", "Reserved", "stock_reserved", { credit_status: order.credit_status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Stock reservation failed." }, { status: 400 });
  }
}

async function dispatchAction(input: ActionInput) {
  const statusMap: Record<string, string> = { pick: "Picking", pack: "Packed", load: "Loaded", dispatch: "In Transit", close: "Closed" };
  const status = statusMap[input.action];
  if (!status) return NextResponse.json({ error: "Unknown dispatch action." }, { status: 400 });
  return setStatus(input, "dispatch_orders", status, input.action === "load" ? "vehicle_loaded" : `dispatch_${input.action}`);
}

async function driverTripAction(input: ActionInput & { body: Record<string, unknown> }) {
  const statusMap: Record<string, string> = { start: "In Transit", arrive: "Arrived", close: "Completed" };
  const status = statusMap[input.action];
  if (!status) return NextResponse.json({ error: "Unknown driver trip action." }, { status: 400 });
  const latitude = numberOrNull(input.body.latitude);
  const longitude = numberOrNull(input.body.longitude);
  if (latitude !== null && longitude !== null) {
    await input.admin.from("driver_trip_locations").insert({
      tenant_id: input.user.company_id,
      driver_trip_id: input.id,
      latitude,
      longitude,
      device_information: String(input.body.deviceInformation ?? ""),
      created_by: input.user.id,
      updated_by: input.user.id
    });
  }
  const updates: Record<string, unknown> = { current_latitude: latitude, current_longitude: longitude };
  if (input.action === "start") updates.departure_time = new Date().toISOString();
  if (input.action === "arrive") updates.arrival_time = new Date().toISOString();
  if (input.action === "close") updates.completed_at = new Date().toISOString();
  return setStatus(input, "driver_trips", status, `driver_trip_${input.action}`, updates);
}

async function deliveryConfirmationAction(input: ActionInput & { body: Record<string, unknown> }) {
  if (input.action !== "confirm") return NextResponse.json({ error: "Unknown delivery confirmation action." }, { status: 400 });
  const { data: confirmation, error } = await input.admin.from("delivery_confirmations").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  if (confirmation.status === "Confirmed") return NextResponse.json({ error: "Delivery has already been confirmed. Stock will not be deducted twice." }, { status: 409 });
  const { data: note } = await input.admin.from("delivery_notes").select("*").eq("id", confirmation.delivery_note_id).eq("tenant_id", input.user.company_id).single();
  const { data: lines } = await input.admin.from("delivery_note_lines").select("*").eq("delivery_note_id", confirmation.delivery_note_id).eq("tenant_id", input.user.company_id);
  try {
    for (const line of lines ?? []) {
      const dispatchWarehouse = await resolveDispatchWarehouse(input.admin, input.user.company_id, note?.dispatch_order_id);
      if (!dispatchWarehouse) throw new Error("Delivery note needs a dispatch order with a warehouse before confirmation can deduct stock.");
      await postStockMovement({
        admin: input.admin,
        tenantId: input.user.company_id,
        userId: input.user.id,
        transactionType: "Sales Dispatch",
        productId: line.product_id,
        warehouseId: dispatchWarehouse,
        batchNumber: line.batch_number,
        expiryDate: line.expiry_date,
        unitOfMeasureId: line.unit_of_measure_id,
        quantityOut: Number(line.quantity),
        referenceDocument: note?.delivery_note_number,
        referenceId: confirmation.delivery_note_id
      });
    }
    const updates = {
      status: "Confirmed",
      confirmed_at: new Date().toISOString(),
      latitude: numberOrNull(input.body.latitude) ?? confirmation.latitude,
      longitude: numberOrNull(input.body.longitude) ?? confirmation.longitude,
      updated_by: input.user.id
    };
    const { data } = await input.admin.from("delivery_confirmations").update(updates).eq("id", input.id).select("*").single();
    if (note?.dispatch_order_id) await input.admin.from("dispatch_orders").update({ status: "Delivered", updated_by: input.user.id }).eq("id", note.dispatch_order_id);
    await input.admin.from("delivery_notes").update({ status: "Delivered", updated_by: input.user.id }).eq("id", confirmation.delivery_note_id);
    if (note?.sales_order_id) await input.admin.from("sales_orders").update({ status: "Delivered", updated_by: input.user.id }).eq("id", note.sales_order_id);
    await auditAction({ request: input.request, user: input.user, moduleKey: "sales_distribution", actionKey: "delivery_confirmed", tableName: "delivery_confirmations", recordId: input.id, newValue: data });
    await notify(input.admin, input.user.company_id, "delivery_confirmed", "Delivery confirmed", "A customer delivery has been confirmed.", data);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Delivery confirmation failed." }, { status: 400 });
  }
}

async function failedDeliveryAction(input: ActionInput & { body: Record<string, unknown> }) {
  if (input.action !== "fail" && input.action !== "close") return NextResponse.json({ error: "Unknown failed delivery action." }, { status: 400 });
  const status = input.action === "fail" ? "Open" : "Closed";
  return setStatus(input, "failed_deliveries", status, input.action === "fail" ? "failed_delivery_recorded" : "failed_delivery_closed", {
    latitude: numberOrNull(input.body.latitude),
    longitude: numberOrNull(input.body.longitude),
    recorded_at: new Date().toISOString()
  });
}

async function customerReturnAction(input: ActionInput) {
  if (input.action === "submit") return simpleWorkflowAction({ ...input, config: salesDistributionConfigs.customer_returns, status: "Submitted" });
  if (input.action === "approve") return simpleWorkflowAction({ ...input, config: salesDistributionConfigs.customer_returns, status: "Approved" });
  if (input.action === "close") return simpleWorkflowAction({ ...input, config: salesDistributionConfigs.customer_returns, status: "Closed" });
  if (!["receive", "restock"].includes(input.action)) return NextResponse.json({ error: "Unknown return action." }, { status: 400 });
  const { data: customerReturn } = await input.admin.from("customer_returns").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  const { data: lines } = await input.admin.from("customer_return_lines").select("*").eq("customer_return_id", input.id).eq("tenant_id", input.user.company_id);
  try {
    for (const line of lines ?? []) {
      if (!line.warehouse_id) throw new Error("Return line requires a receiving warehouse.");
      await postStockMovement({
        admin: input.admin,
        tenantId: input.user.company_id,
        userId: input.user.id,
        transactionType: "Return from Customer",
        productId: line.product_id,
        warehouseId: line.warehouse_id,
        batchNumber: line.batch_number,
        quantityIn: Number(line.quantity_returned),
        qcStatus: "On Hold",
        referenceDocument: customerReturn?.return_number,
        referenceId: input.id
      });
      await input.admin.from("customer_return_lines").update({ status: "QC Hold", updated_by: input.user.id }).eq("id", line.id);
    }
    return setStatus(input, "customer_returns", input.action === "receive" ? "Received" : "Restocked", input.action === "receive" ? "customer_return_received" : "customer_return_restocked");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Return action failed." }, { status: 400 });
  }
}

async function simpleWorkflowAction(input: ActionInput & { config: { table: string; singular: string }, status?: string }) {
  const status = input.status ?? titleCase(input.action);
  return setStatus(input, input.config.table, status, `${slug(input.config.singular)}_${input.action}`);
}

async function setStatus(input: ActionInput, table: string, status: string, auditKey: string, extra: Record<string, unknown> = {}) {
  const { data: oldValue } = await input.admin.from(table).select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  const { data, error } = await input.admin.from(table).update({ status, ...extra, updated_by: input.user.id }).eq("id", input.id).eq("tenant_id", input.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request: input.request, user: input.user, moduleKey: "sales_distribution", actionKey: auditKey, tableName: table, recordId: input.id, oldValue, newValue: data });
  await notify(input.admin, input.user.company_id, auditKey, titleCase(auditKey), `${titleCase(auditKey)} completed.`, data);
  return NextResponse.json({ data });
}

async function resolveDispatchWarehouse(admin: Admin, tenantId: string, dispatchOrderId?: string | null) {
  if (!dispatchOrderId) return null;
  const { data } = await admin.from("dispatch_orders").select("warehouse_id").eq("id", dispatchOrderId).eq("tenant_id", tenantId).single();
  return data?.warehouse_id ?? null;
}

async function getSettings(admin: Admin, tenantId: string) {
  const { data } = await admin.from("sales_distribution_settings").select("*").eq("tenant_id", tenantId).maybeSingle();
  return data ?? { default_check_in_radius_meters: 100 };
}

async function notify(admin: Admin, tenantId: string, eventKey: string, title: string, message: string, payload: unknown) {
  await admin.from("notifications").insert({
    company_id: tenantId,
    channel: "In-App",
    event_key: eventKey,
    title,
    message,
    payload: payload ?? {}
  });
}

async function count(admin: Admin, table: string, tenantId: string | null, filters: Record<string, unknown> = {}) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  if (tenantId) query = query.eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { count: total } = await query;
  return total ?? 0;
}

function normalizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === "" ? null : value]));
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "_");
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseCoordinates(value?: string | null) {
  if (!value) return null;
  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000;
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type ActionInput = {
  request: NextRequest;
  admin: Admin;
  user: AppUser & { company_id: string };
  id: string;
  action: string;
};
