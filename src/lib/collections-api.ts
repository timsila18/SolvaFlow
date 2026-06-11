import { NextRequest, NextResponse } from "next/server";
import { auditAction, requireAppUser, type AppUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { finalModuleConfigs, type FinalModuleKey, type FinalOptionSource } from "@/lib/collections";

type Admin = ReturnType<typeof createAdminSupabase>;

const optionSources: Record<FinalOptionSource, { table: string; value: string; label: string; tenantColumn: "company_id" | "tenant_id" | null; order: string }> = {
  customers: { table: "customers", value: "id", label: "customer_name", tenantColumn: "company_id", order: "customer_name" },
  users: { table: "user_profiles", value: "id", label: "full_name", tenantColumn: "company_id", order: "full_name" },
  products: { table: "products", value: "id", label: "product_name", tenantColumn: "company_id", order: "product_name" },
  delivery_notes: { table: "delivery_notes", value: "id", label: "delivery_note_number", tenantColumn: "tenant_id", order: "created_at" },
  sales_orders: { table: "sales_orders", value: "id", label: "sales_order_number", tenantColumn: "tenant_id", order: "created_at" },
  customer_returns: { table: "customer_returns", value: "id", label: "return_number", tenantColumn: "tenant_id", order: "created_at" },
  sales_invoices: { table: "sales_invoices", value: "id", label: "invoice_number", tenantColumn: "tenant_id", order: "created_at" },
  customer_payments: { table: "customer_payments", value: "id", label: "receipt_number", tenantColumn: "tenant_id", order: "created_at" },
  customer_accounts: { table: "customer_accounts", value: "id", label: "risk_level", tenantColumn: "tenant_id", order: "created_at" },
  ai_chat_threads: { table: "ai_chat_threads", value: "id", label: "title", tenantColumn: "tenant_id", order: "created_at" },
  kpi_definitions: { table: "kpi_definitions", value: "id", label: "kpi_name", tenantColumn: "tenant_id", order: "kpi_name" },
  approval_workflows: { table: "approval_workflows", value: "id", label: "workflow_name", tenantColumn: "tenant_id", order: "workflow_name" }
};

export async function handleFinalGet(entity: string, request: NextRequest) {
  const config = finalModuleConfigs[entity as FinalModuleKey];
  if (!config) return NextResponse.json({ error: "Unknown final module entity." }, { status: 404 });
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

export async function handleFinalPost(entity: string, request: NextRequest) {
  const config = finalModuleConfigs[entity as FinalModuleKey];
  if (!config) return NextResponse.json({ error: "Unknown final module entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });
  const admin = createAdminSupabase();
  const payload = normalizePayload(await request.json());
  const insertPayload = { ...payload, tenant_id: auth.user.company_id, created_by: auth.user.id, updated_by: auth.user.id };
  const { data, error } = await admin.from(config.table).insert(insertPayload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: config.module, actionKey: `${slug(config.singular)}_created`, tableName: config.table, recordId: data.id, newValue: data });
  return NextResponse.json({ data }, { status: 201 });
}

export async function handleFinalPatch(entity: string, request: NextRequest) {
  const config = finalModuleConfigs[entity as FinalModuleKey];
  if (!config) return NextResponse.json({ error: "Unknown final module entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const admin = createAdminSupabase();
  const payload = normalizePayload(await request.json());
  const id = payload.id;
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { data: oldValue, error: oldError } = await admin.from(config.table).select("*").eq("id", id).eq("tenant_id", auth.user.company_id).single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });
  const { id: _id, tenant_id: _tenant, created_at: _createdAt, created_by: _createdBy, ...updates } = payload;
  const { data, error } = await admin.from(config.table).update({ ...updates, updated_by: auth.user.id }).eq("id", id).eq("tenant_id", auth.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: config.module, actionKey: `${slug(config.singular)}_updated`, tableName: config.table, recordId: id, oldValue, newValue: data });
  return NextResponse.json({ data });
}

export async function handleFinalDelete(entity: string, request: NextRequest) {
  const config = finalModuleConfigs[entity as FinalModuleKey];
  if (!config) return NextResponse.json({ error: "Unknown final module entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const admin = createAdminSupabase();
  const { data: oldValue, error: oldError } = await admin.from(config.table).select("*").eq("id", id).eq("tenant_id", auth.user.company_id).single();
  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 404 });
  const { error } = await admin.from(config.table).delete().eq("id", id).eq("tenant_id", auth.user.company_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request, user: auth.user, moduleKey: config.module, actionKey: `${slug(config.singular)}_deleted`, tableName: config.table, recordId: id, oldValue });
  return NextResponse.json({ ok: true });
}

export async function handleFinalOptions() {
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

export async function handleFinalAction(entity: string, request: NextRequest) {
  const config = finalModuleConfigs[entity as FinalModuleKey];
  if (!config) return NextResponse.json({ error: "Unknown final module entity." }, { status: 404 });
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  if (!auth.user.company_id) return NextResponse.json({ error: "User is not assigned to a company." }, { status: 403 });
  const admin = createAdminSupabase();
  const body = await request.json();
  const { id, action } = body;
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });
  const input = { request, admin, user: auth.user, id, action, config, body };

  if (entity === "sales_invoices" && action === "post") return postInvoice(input);
  if (entity === "customer_payments" && action === "allocate") return allocatePayment(input);
  if (entity === "credit_notes" && action === "post") return postNote(input, "credit_notes");
  if (entity === "debit_notes" && action === "post") return postNote(input, "debit_notes");
  if (entity === "cash_collections" && action === "approve") return collectionChannelToPayment(input, "cash_collections", "Cash", "Banked");
  if (entity === "bank_transfer_collections" && action === "verify") return collectionChannelToPayment(input, "bank_transfer_collections", "Bank Transfer", "Verified");
  if (entity === "mpesa_collections" && action === "verify") return verifyMpesaCollection(input);
  if (entity === "cheque_collections" && action === "clear") return collectionChannelToPayment(input, "cheque_collections", "Cheque", "Cleared");
  if (entity === "cheque_collections" && action === "bounce") return bounceCheque(input);
  if (entity === "customer_risk_scores" && action === "generate") return generateRiskScore(input);
  if (entity === "ai_insights" && action === "generate") return generateAiInsights(input);
  if (entity === "ai_chat_messages" && action === "generate") return answerAiChat(input);
  if (entity === "finance_integration_events" && action === "sync") return setStatus(input, "finance_integration_events", "Posted", "finance_event_synced", { posted_at: new Date().toISOString() });
  if (entity === "alert_center" && action === "acknowledge") return setStatus(input, "alert_center", "Acknowledged", "alert_acknowledged", { acknowledged_at: new Date().toISOString() });
  if (entity === "alert_center" && action === "resolve") return setStatus(input, "alert_center", "Resolved", "alert_resolved", { resolved_at: new Date().toISOString() });
  if (entity === "approval_requests" && ["approve", "reject"].includes(action)) return setStatus(input, "approval_requests", action === "approve" ? "Approved" : "Rejected", `approval_${action}`, { decided_by: auth.user.id, decided_at: new Date().toISOString() });
  return simpleWorkflowAction(input);
}

export async function handleExecutiveDashboard() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const admin = createAdminSupabase();
  const tenantId = auth.user.company_id;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const [productionValue, salesValue, collections, receivables, delayed, failed, stockouts, nearExpiry, overdue] = await Promise.all([
    sum(admin, "production_orders", tenantId, "planned_quantity", { production_date: today }),
    sum(admin, "sales_orders", tenantId, "total_amount", { order_date: today }),
    sum(admin, "customer_payments", tenantId, "amount", { }),
    sum(admin, "customer_accounts", tenantId, "current_balance", { }),
    count(admin, "dispatch_orders", tenantId, { status: "In Transit" }),
    count(admin, "failed_deliveries", tenantId, { status: "Open" }),
    count(admin, "reorder_alerts", tenantId, { status: "Open" }),
    count(admin, "stock_balances", tenantId, { }),
    count(admin, "sales_invoices", tenantId, { status: "Overdue" })
  ]);
  const monthRevenue = await sumSince(admin, "sales_orders", tenantId, "total_amount", "order_date", monthStart);
  const monthCollections = await sumSince(admin, "customer_payments", tenantId, "amount", "payment_date", monthStart);
  return NextResponse.json({
    metrics: [
      { label: "Production Value Today", value: productionValue.toFixed(2) },
      { label: "Sales Value Today", value: salesValue.toFixed(2) },
      { label: "Collections Today", value: collections.toFixed(2) },
      { label: "Outstanding Receivables", value: receivables.toFixed(2) },
      { label: "Revenue This Month", value: monthRevenue.toFixed(2) },
      { label: "Collections This Month", value: monthCollections.toFixed(2) },
      { label: "Delayed Deliveries", value: delayed },
      { label: "Failed Deliveries", value: failed },
      { label: "Stockouts / Reorder Alerts", value: stockouts },
      { label: "Near Expiry Stock", value: nearExpiry },
      { label: "Overdue Invoices", value: overdue }
    ]
  });
}

export async function handleCollectionsDashboard() {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const admin = createAdminSupabase();
  const tenantId = auth.user.company_id;
  const [invoices, payments, receivables, overdue, mpesa, cheques] = await Promise.all([
    count(admin, "sales_invoices", tenantId, { status: "Posted" }),
    sum(admin, "customer_payments", tenantId, "amount", {}),
    sum(admin, "customer_accounts", tenantId, "current_balance", {}),
    sum(admin, "customer_accounts", tenantId, "overdue_balance", {}),
    sum(admin, "mpesa_collections", tenantId, "amount", {}),
    count(admin, "cheque_collections", tenantId, { status: "Bounced" })
  ]);
  return NextResponse.json({ metrics: [
    { label: "Posted Invoices", value: invoices },
    { label: "Total Collections", value: payments.toFixed(2) },
    { label: "Outstanding Receivables", value: receivables.toFixed(2) },
    { label: "Overdue Balance", value: overdue.toFixed(2) },
    { label: "M-Pesa Collections", value: mpesa.toFixed(2) },
    { label: "Bounced Cheques", value: cheques }
  ] });
}

export async function handleMpesaCallback(request: NextRequest) {
  const admin = createAdminSupabase();
  const payload = await request.json();
  const accountNumber = String(payload.accountNumber ?? payload.BillRefNumber ?? payload.AccountReference ?? "");
  const receipt = String(payload.mpesaReceiptNumber ?? payload.TransID ?? payload.MpesaReceiptNumber ?? "");
  const amount = Number(payload.amount ?? payload.TransAmount ?? payload.Amount ?? 0);
  const phone = String(payload.phoneNumber ?? payload.MSISDN ?? payload.PhoneNumber ?? "");
  if (!accountNumber || amount <= 0) return NextResponse.json({ error: "Invalid M-Pesa callback payload." }, { status: 400 });

  const { data: invoice } = await admin.from("sales_invoices").select("*").eq("invoice_number", accountNumber).maybeSingle();
  if (!invoice) {
    const tenantId = await resolveTenantFromMpesaPayload(admin, payload);
    if (!tenantId) return NextResponse.json({ error: "Invoice or tenant could not be matched." }, { status: 404 });
    const { data } = await admin.from("mpesa_collections").insert({ tenant_id: tenantId, mpesa_receipt_number: receipt, phone_number: phone, account_number: accountNumber, amount, callback_payload: payload, reconciliation_status: "Exception", status: "Received" }).select("*").single();
    return NextResponse.json({ data, matched: false });
  }
  const payment = await createPaymentAndAllocate({ admin, tenantId: invoice.tenant_id, userId: null, customerId: invoice.customer_id, invoiceId: invoice.id, method: "M-Pesa", amount, reference: receipt, notes: "Automatic M-Pesa callback allocation" });
  const { data } = await admin.from("mpesa_collections").insert({ tenant_id: invoice.tenant_id, payment_id: payment.id, mpesa_receipt_number: receipt, phone_number: phone, account_number: accountNumber, amount, callback_payload: payload, reconciliation_status: "Posted", status: "Received" }).select("*").single();
  return NextResponse.json({ data, matched: true });
}

async function postInvoice(input: ActionInput) {
  const { data: invoice, error } = await input.admin.from("sales_invoices").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  if (invoice.status !== "Draft") return NextResponse.json({ error: "Only draft invoices can be posted." }, { status: 409 });
  await postLedger(input.admin, input.user.company_id, input.user.id, invoice.customer_id, "Invoice", invoice.invoice_number, invoice.id, Number(invoice.total_amount), 0, "Sales invoice posted.");
  await queueFinanceEvent(input.admin, input.user.company_id, input.user.id, "collections", "sales_invoices", invoice.id, "Sales Invoice Posted", invoice);
  return setStatus(input, "sales_invoices", "Posted", "invoice_posted", { posted_at: new Date().toISOString() });
}

async function allocatePayment(input: ActionInput) {
  const { data: payment, error } = await input.admin.from("customer_payments").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  try {
    const result = await allocateExistingPayment(input.admin, input.user.company_id, input.user.id, payment);
    await queueFinanceEvent(input.admin, input.user.company_id, input.user.id, "collections", "customer_payments", payment.id, "Customer Receipt Posted", payment);
    await auditAction({ request: input.request, user: input.user, moduleKey: "collections", actionKey: "payment_allocated", tableName: "customer_payments", recordId: input.id, newValue: result });
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Payment allocation failed." }, { status: 400 });
  }
}

async function collectionChannelToPayment(input: ActionInput, table: string, method: string, nextStatus: string) {
  const { data: row, error } = await input.admin.from(table).select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const payment = await createPaymentAndAllocate({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, customerId: row.customer_id, invoiceId: row.invoice_id, method, amount: Number(row.amount), reference: row.receipt_number ?? row.bank_reference ?? row.cheque_number, notes: row.supporting_notes ?? row.verification_notes });
  return setStatus(input, table, nextStatus, `${slug(method)}_collection_verified`, { payment_id: payment.id });
}

async function verifyMpesaCollection(input: ActionInput) {
  const { data: row, error } = await input.admin.from("mpesa_collections").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const { data: invoice } = await input.admin.from("sales_invoices").select("*").eq("invoice_number", row.account_number).eq("tenant_id", input.user.company_id).maybeSingle();
  if (!invoice) return setStatus(input, "mpesa_collections", "Received", "mpesa_collection_exception", { reconciliation_status: "Exception" });
  const payment = await createPaymentAndAllocate({ admin: input.admin, tenantId: input.user.company_id, userId: input.user.id, customerId: invoice.customer_id, invoiceId: invoice.id, method: "M-Pesa", amount: Number(row.amount), reference: row.mpesa_receipt_number, notes: "M-Pesa collection verified." });
  return setStatus(input, "mpesa_collections", "Received", "mpesa_collection_posted", { payment_id: payment.id, reconciliation_status: "Posted" });
}

async function bounceCheque(input: ActionInput) {
  const { data: cheque } = await input.admin.from("cheque_collections").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (cheque?.payment_id) {
    await input.admin.from("customer_payments").update({ status: "Cancelled", updated_by: input.user.id }).eq("id", cheque.payment_id);
  }
  await input.admin.from("alert_center").insert({ tenant_id: input.user.company_id, alert_type: "Bounced cheque", severity: "High", title: "Bounced cheque recorded", message: `Cheque ${cheque?.cheque_number ?? ""} bounced.`, source_module: "collections", source_table: "cheque_collections", source_id: input.id, created_by: input.user.id, updated_by: input.user.id });
  return setStatus(input, "cheque_collections", "Bounced", "cheque_bounced");
}

async function postNote(input: ActionInput, table: "credit_notes" | "debit_notes") {
  const { data: note, error } = await input.admin.from(table).select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const isCredit = table === "credit_notes";
  await postLedger(input.admin, input.user.company_id, input.user.id, note.customer_id, isCredit ? "Credit Note" : "Debit Note", isCredit ? note.credit_note_number : note.debit_note_number, note.id, isCredit ? 0 : Number(note.amount), isCredit ? Number(note.amount) : 0, note.reason);
  await queueFinanceEvent(input.admin, input.user.company_id, input.user.id, "collections", table, note.id, isCredit ? "Credit Note Posted" : "Debit Note Posted", note);
  return setStatus(input, table, "Posted", isCredit ? "credit_note_posted" : "debit_note_posted", { posted_at: new Date().toISOString() });
}

async function generateRiskScore(input: ActionInput) {
  const { data: score } = await input.admin.from("customer_risk_scores").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  const bounced = await count(input.admin, "cheque_collections", input.user.company_id, { customer_id: score.customer_id, status: "Bounced" });
  const complaints = await count(input.admin, "customer_complaints", input.user.company_id, { customer_id: score.customer_id });
  const returns = await count(input.admin, "customer_returns", input.user.company_id, { customer_id: score.customer_id });
  const account = await input.admin.from("customer_accounts").select("current_balance, credit_limit").eq("customer_id", score.customer_id).eq("tenant_id", input.user.company_id).maybeSingle();
  const creditBreach = Number(account.data?.credit_limit ?? 0) > 0 && Number(account.data?.current_balance ?? 0) > Number(account.data?.credit_limit ?? 0) ? 25 : 0;
  const total = bounced * 20 + complaints * 5 + returns * 4 + creditBreach;
  const riskLevel = total >= 80 ? "Critical Risk" : total >= 50 ? "High Risk" : total >= 25 ? "Medium Risk" : "Low Risk";
  const { data } = await input.admin.from("customer_risk_scores").update({ bounced_cheque_score: bounced * 20, complaint_score: complaints * 5, return_score: returns * 4, credit_breach_score: creditBreach, total_score: total, risk_level: riskLevel, calculated_at: new Date().toISOString(), updated_by: input.user.id }).eq("id", input.id).select("*").single();
  return NextResponse.json({ data });
}

async function generateAiInsights(input: ActionInput) {
  const insights = await buildInsightRows(input.admin, input.user.company_id, input.user.id);
  return NextResponse.json({ data: insights });
}

async function answerAiChat(input: ActionInput) {
  const { data: message } = await input.admin.from("ai_chat_messages").select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  const question = String(message?.content ?? "").toLowerCase();
  let answer = "I can answer questions about receivables, production costs, sales reps, and low stock using your tenant data.";
  if (question.includes("owes") || question.includes("receivable")) {
    const { data } = await input.admin.from("customer_accounts").select("customer_id, current_balance").eq("tenant_id", input.user.company_id).order("current_balance", { ascending: false }).limit(1);
    answer = data?.[0] ? `The highest receivable is customer ${data[0].customer_id} with a balance of ${data[0].current_balance}.` : "There are no customer account balances yet.";
  } else if (question.includes("stock") || question.includes("reorder")) {
    const open = await count(input.admin, "reorder_alerts", input.user.company_id, { status: "Open" });
    answer = `${open} stock items currently have open reorder alerts.`;
  } else if (question.includes("sales rep")) {
    const { data } = await input.admin.from("sales_orders").select("sales_rep_id, total_amount").eq("tenant_id", input.user.company_id).order("total_amount", { ascending: false }).limit(1);
    answer = data?.[0] ? `Top recent sales rep is ${data[0].sales_rep_id} with order value ${data[0].total_amount}.` : "There are no sales orders yet.";
  } else if (question.includes("production")) {
    const total = await sum(input.admin, "production_orders", input.user.company_id, "planned_quantity", {});
    answer = `Current recorded planned production quantity is ${total}.`;
  }
  const { data } = await input.admin.from("ai_chat_messages").insert({ tenant_id: input.user.company_id, thread_id: message.thread_id, role: "assistant", content: answer, tool_name: "tenant_analytics", created_by: input.user.id, updated_by: input.user.id }).select("*").single();
  await auditAction({ request: input.request, user: input.user, moduleKey: "ai", actionKey: "ai_chat_answered", tableName: "ai_chat_messages", recordId: data.id, newValue: data });
  return NextResponse.json({ data });
}

async function buildInsightRows(admin: Admin, tenantId: string, userId: string) {
  const [lowStock, overdueInvoices, failedDeliveries, wastage] = await Promise.all([
    count(admin, "reorder_alerts", tenantId, { status: "Open" }),
    count(admin, "sales_invoices", tenantId, { status: "Overdue" }),
    count(admin, "failed_deliveries", tenantId, { status: "Open" }),
    sum(admin, "wastage_records", tenantId, "wastage_quantity", {})
  ]);
  const rows = [
    { insight_type: "Procurement Forecast", module_key: "inventory", title: "Reorder pressure detected", summary: `${lowStock} open reorder alerts require procurement review.`, recommendation: "Review reorder alerts and convert priority shortages into procurement requests.", confidence_score: 82 },
    { insight_type: "Collections Insight", module_key: "collections", title: "Overdue invoices need follow-up", summary: `${overdueInvoices} invoices are marked overdue.`, recommendation: "Prioritize collection calls for the oldest outstanding invoices.", confidence_score: 78 },
    { insight_type: "Delivery Insight", module_key: "sales_distribution", title: "Failed deliveries require route review", summary: `${failedDeliveries} failed deliveries are open.`, recommendation: "Review failed delivery reasons and update route plans or customer contact details.", confidence_score: 74 },
    { insight_type: "Production Insight", module_key: "manufacturing", title: "Production wastage monitoring", summary: `Recorded wastage quantity is ${wastage}.`, recommendation: "Compare wastage by line against recipe allowances and investigate high-loss lines.", confidence_score: 70 }
  ];
  const inserted = [];
  for (const row of rows) {
    const { data } = await admin.from("ai_insights").insert({ tenant_id: tenantId, ...row, source_query: { generated_from: "tenant_operational_tables" }, generated_by: "SolvaFlow AI", created_by: userId, updated_by: userId }).select("*").single();
    inserted.push(data);
  }
  return inserted;
}

async function createPaymentAndAllocate(input: { admin: Admin; tenantId: string; userId: string | null; customerId: string; invoiceId?: string | null; method: string; amount: number; reference?: string | null; notes?: string | null }) {
  const { data: payment, error } = await input.admin.from("customer_payments").insert({ tenant_id: input.tenantId, customer_id: input.customerId, invoice_id: input.invoiceId, payment_method: input.method, amount: input.amount, bank_reference: input.reference, notes: input.notes, created_by: input.userId, updated_by: input.userId }).select("*").single();
  if (error) throw new Error(error.message);
  return allocateExistingPayment(input.admin, input.tenantId, input.userId, payment);
}

async function allocateExistingPayment(admin: Admin, tenantId: string, userId: string | null, payment: Record<string, any>) {
  let remaining = Number(payment.amount ?? 0) - Number(payment.allocated_amount ?? 0);
  if (remaining <= 0) return payment;
  let invoiceQuery = admin.from("sales_invoices").select("*").eq("tenant_id", tenantId).eq("customer_id", payment.customer_id).gt("balance_amount", 0).order("due_date", { ascending: true, nullsFirst: false });
  if (payment.invoice_id) invoiceQuery = invoiceQuery.eq("id", payment.invoice_id);
  const { data: invoices, error } = await invoiceQuery;
  if (error) throw new Error(error.message);
  let allocated = 0;
  for (const invoice of invoices ?? []) {
    if (remaining <= 0) break;
    const amount = Math.min(remaining, Number(invoice.balance_amount ?? 0));
    if (amount <= 0) continue;
    await admin.from("payment_allocations").insert({ tenant_id: tenantId, payment_id: payment.id, invoice_id: invoice.id, customer_id: payment.customer_id, amount_allocated: amount, allocation_method: payment.invoice_id ? "Specific Invoice" : "Oldest Invoice First", created_by: userId, updated_by: userId });
    const paid = Number(invoice.amount_paid ?? 0) + amount;
    const status = paid >= Number(invoice.total_amount ?? 0) ? "Paid" : "Partially Paid";
    await admin.from("sales_invoices").update({ amount_paid: paid, status, updated_by: userId }).eq("id", invoice.id);
    await postLedger(admin, tenantId, userId, payment.customer_id, "Payment", payment.receipt_number, payment.id, 0, amount, `Payment allocated to invoice ${invoice.invoice_number}.`);
    allocated += amount;
    remaining -= amount;
  }
  const paymentStatus = remaining > 0 ? "Partially Allocated" : "Allocated";
  const { data: updated, error: updateError } = await admin.from("customer_payments").update({ allocated_amount: Number(payment.allocated_amount ?? 0) + allocated, status: paymentStatus, updated_by: userId }).eq("id", payment.id).select("*").single();
  if (updateError) throw new Error(updateError.message);
  return updated;
}

async function postLedger(admin: Admin, tenantId: string, userId: string | null, customerId: string, type: string, referenceDocument: string, referenceId: string, debit: number, credit: number, description: string) {
  const { error } = await admin.from("customer_account_ledger").insert({ tenant_id: tenantId, customer_id: customerId, transaction_type: type, reference_document: referenceDocument, reference_id: referenceId, debit_amount: debit, credit_amount: credit, description, created_by: userId, updated_by: userId });
  if (error) throw new Error(error.message);
}

async function queueFinanceEvent(admin: Admin, tenantId: string, userId: string | null, sourceModule: string, sourceTable: string, sourceId: string, eventType: string, payload: unknown) {
  await admin.from("finance_integration_events").insert({ tenant_id: tenantId, source_module: sourceModule, source_table: sourceTable, source_id: sourceId, event_type: eventType, payload: payload ?? {}, created_by: userId, updated_by: userId });
}

async function simpleWorkflowAction(input: ActionInput) {
  const status = titleCase(input.action);
  return setStatus(input, input.config.table, status, `${slug(input.config.singular)}_${input.action}`);
}

async function setStatus(input: ActionInput, table: string, status: string, auditKey: string, extra: Record<string, unknown> = {}) {
  const { data: oldValue } = await input.admin.from(table).select("*").eq("id", input.id).eq("tenant_id", input.user.company_id).single();
  const { data, error } = await input.admin.from(table).update({ status, ...extra, updated_by: input.user.id }).eq("id", input.id).eq("tenant_id", input.user.company_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auditAction({ request: input.request, user: input.user, moduleKey: input.config.module, actionKey: auditKey, tableName: table, recordId: input.id, oldValue, newValue: data });
  await notify(input.admin, input.user.company_id, auditKey, titleCase(auditKey), `${titleCase(auditKey)} completed.`, data);
  return NextResponse.json({ data });
}

async function notify(admin: Admin, tenantId: string, eventKey: string, title: string, message: string, payload: unknown) {
  await admin.from("notifications").insert({ company_id: tenantId, channel: "In-App", event_key: eventKey, title, message, payload: payload ?? {} });
}

async function count(admin: Admin, table: string, tenantId: string | null, filters: Record<string, unknown> = {}) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  if (tenantId) query = query.eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { count: total } = await query;
  return total ?? 0;
}

async function sum(admin: Admin, table: string, tenantId: string | null, field: string, filters: Record<string, unknown>) {
  let query = admin.from(table).select(field);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { data } = await query as { data: Array<Record<string, unknown>> | null };
  return (data ?? []).reduce((total, row) => total + Number(row[field] ?? 0), 0);
}

async function sumSince(admin: Admin, table: string, tenantId: string | null, field: string, dateField: string, since: string) {
  let query = admin.from(table).select(field).gte(dateField, since);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data } = await query as { data: Array<Record<string, unknown>> | null };
  return (data ?? []).reduce((total, row) => total + Number(row[field] ?? 0), 0);
}

async function resolveTenantFromMpesaPayload(admin: Admin, payload: Record<string, unknown>) {
  const shortcode = String(payload.BusinessShortCode ?? payload.ShortCode ?? payload.shortcode ?? "");
  if (!shortcode) return null;
  const { data } = await admin.from("mpesa_configurations").select("tenant_id").eq("shortcode", shortcode).maybeSingle();
  return data?.tenant_id ?? null;
}

function normalizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === "" ? null : value]));
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ActionInput = {
  request: NextRequest;
  admin: Admin;
  user: AppUser & { company_id: string };
  id: string;
  action: string;
  config: typeof finalModuleConfigs[FinalModuleKey];
  body: Record<string, unknown>;
};
