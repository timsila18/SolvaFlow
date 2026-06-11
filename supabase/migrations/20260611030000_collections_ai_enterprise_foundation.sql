create table public.collections_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade unique,
  allocation_method text not null default 'Oldest Invoice First',
  invoice_due_days integer not null default 30,
  auto_invoice_on_delivery boolean not null default true,
  require_cash_approval boolean not null default true,
  finance_integration_enabled boolean not null default false,
  finance_api_base_url text,
  finance_posting_mode text not null default 'Queue',
  status text not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mpesa_configurations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade unique,
  paybill text,
  till_number text,
  shortcode text,
  consumer_key text,
  consumer_secret text,
  passkey text,
  callback_url text,
  environment text not null default 'Sandbox',
  status text not null default 'Inactive',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  opening_balance numeric(18,2) not null default 0,
  current_balance numeric(18,2) not null default 0,
  credit_limit numeric(18,2) not null default 0,
  available_credit numeric(18,2) generated always as (credit_limit - current_balance) stored,
  overdue_balance numeric(18,2) not null default 0,
  last_payment_at timestamptz,
  last_payment_amount numeric(18,2) not null default 0,
  risk_score numeric(6,2) not null default 0,
  risk_level text not null default 'Low Risk',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, customer_id)
);

create table public.customer_account_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  account_id uuid references public.customer_accounts(id),
  transaction_number text,
  transaction_type text not null,
  reference_document text,
  reference_id uuid,
  transaction_date date not null default current_date,
  debit_amount numeric(18,2) not null default 0,
  credit_amount numeric(18,2) not null default 0,
  balance_after numeric(18,2) not null default 0,
  description text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Posted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  invoice_number text,
  customer_id uuid not null references public.customers(id),
  delivery_note_id uuid references public.delivery_notes(id),
  sales_order_id uuid references public.sales_orders(id),
  invoice_date date not null default current_date,
  due_date date,
  tax_amount numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  subtotal numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  amount_paid numeric(18,2) not null default 0,
  balance_amount numeric(18,2) generated always as (greatest(total_amount - amount_paid, 0)) stored,
  posted_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);

create table public.sales_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  product_id uuid references public.products(id),
  description text,
  quantity numeric(18,3) not null default 0,
  unit_price numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  line_total numeric(18,2) generated always as ((quantity * unit_price) - discount_amount + tax_amount) stored,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  receipt_number text,
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  payment_method text not null,
  payment_date timestamptz not null default now(),
  amount numeric(18,2) not null default 0,
  allocated_amount numeric(18,2) not null default 0,
  unallocated_amount numeric(18,2) generated always as (greatest(amount - allocated_amount, 0)) stored,
  collected_by uuid references public.user_profiles(id),
  bank_reference text,
  notes text,
  approved_by uuid references public.user_profiles(id),
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, receipt_number)
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid not null references public.customer_payments(id) on delete cascade,
  invoice_id uuid not null references public.sales_invoices(id),
  customer_id uuid not null references public.customers(id),
  amount_allocated numeric(18,2) not null default 0,
  allocation_method text not null default 'Oldest Invoice First',
  allocated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Posted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mpesa_collections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid references public.customer_payments(id),
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt_number text,
  phone_number text,
  account_number text,
  amount numeric(18,2) not null default 0,
  transaction_date timestamptz,
  callback_payload jsonb not null default '{}'::jsonb,
  reconciliation_status text not null default 'Pending',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cash_collections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid references public.customer_payments(id),
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  amount numeric(18,2) not null default 0,
  receipt_number text,
  collection_date date not null default current_date,
  collected_by uuid references public.user_profiles(id),
  supporting_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Pending Banking',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cheque_collections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid references public.customer_payments(id),
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  cheque_number text not null,
  bank text,
  branch text,
  amount numeric(18,2) not null default 0,
  cheque_date date,
  maturity_date date,
  front_image_url text,
  back_image_url text,
  bounced_reason text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_transfer_collections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid references public.customer_payments(id),
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  bank_reference text not null,
  transaction_date date not null default current_date,
  amount numeric(18,2) not null default 0,
  attachment_url text,
  verification_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Pending Verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  credit_note_number text,
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  customer_return_id uuid references public.customer_returns(id),
  note_date date not null default current_date,
  amount numeric(18,2) not null default 0,
  reason text not null,
  posted_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, credit_note_number)
);

create table public.debit_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  debit_note_number text,
  customer_id uuid not null references public.customers(id),
  invoice_id uuid references public.sales_invoices(id),
  note_date date not null default current_date,
  amount numeric(18,2) not null default 0,
  reason text not null,
  posted_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, debit_note_number)
);

create table public.customer_risk_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  payment_delay_score numeric(8,2) not null default 0,
  bounced_cheque_score numeric(8,2) not null default 0,
  credit_breach_score numeric(8,2) not null default 0,
  complaint_score numeric(8,2) not null default 0,
  return_score numeric(8,2) not null default 0,
  total_score numeric(8,2) not null default 0,
  risk_level text not null default 'Low Risk',
  calculated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, customer_id)
);

create table public.finance_integration_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  source_module text not null,
  source_table text not null,
  source_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  target_system text not null default 'Solva Finance',
  posted_at timestamptz,
  error_message text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  insight_number text,
  insight_type text not null,
  module_key text not null,
  title text not null,
  summary text not null,
  recommendation text,
  confidence_score numeric(5,2) not null default 0,
  source_query jsonb not null default '{}'::jsonb,
  generated_by text not null default 'System',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_chat_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.user_profiles(id),
  title text not null default 'SolvaFlow AI Chat',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  thread_id uuid not null references public.ai_chat_threads(id) on delete cascade,
  role text not null,
  content text not null,
  tool_name text,
  query_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  kpi_key text not null,
  kpi_name text not null,
  module_key text not null,
  calculation_method text not null,
  target_value numeric(18,2),
  unit text,
  frequency text not null default 'Daily',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kpi_key)
);

create table public.kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  kpi_definition_id uuid not null references public.kpi_definitions(id) on delete cascade,
  snapshot_date date not null default current_date,
  actual_value numeric(18,2) not null default 0,
  target_value numeric(18,2),
  variance numeric(18,2),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Posted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alert_center (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  alert_number text,
  alert_type text not null,
  severity text not null default 'Medium',
  title text not null,
  message text not null,
  source_module text,
  source_table text,
  source_id uuid,
  assigned_to uuid references public.user_profiles(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  module_key text not null,
  table_name text not null,
  record_id uuid not null,
  document_name text not null,
  document_type text,
  file_url text not null,
  file_size_bytes bigint,
  uploaded_by uuid references public.user_profiles(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approval_workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  workflow_key text not null,
  workflow_name text not null,
  module_key text not null,
  threshold_amount numeric(18,2),
  required_role_key text,
  approval_steps jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, workflow_key)
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  workflow_id uuid references public.approval_workflows(id),
  module_key text not null,
  table_name text not null,
  record_id uuid not null,
  requested_by uuid references public.user_profiles(id),
  assigned_to uuid references public.user_profiles(id),
  amount numeric(18,2),
  reason text,
  decision_notes text,
  decided_by uuid references public.user_profiles(id),
  decided_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.companies(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  device_fingerprint text,
  device_name text,
  user_agent text,
  ip_address inet,
  last_seen_at timestamptz not null default now(),
  trusted boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.security_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade unique,
  mfa_required boolean not null default false,
  session_timeout_minutes integer not null default 480,
  password_min_length integer not null default 10,
  password_rotation_days integer,
  ip_allowlist text,
  role_review_frequency_days integer not null default 90,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  job_name text not null,
  schedule text not null default 'Daily',
  last_run_at timestamptz,
  next_run_at timestamptz,
  storage_location text,
  verification_status text not null default 'Pending',
  recovery_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_endpoints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  endpoint_name text not null,
  integration_type text not null,
  base_url text,
  auth_type text,
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.implementation_status (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade unique,
  modules_enabled jsonb not null default '{}'::jsonb,
  users_onboarded integer not null default 0,
  data_imported jsonb not null default '{}'::jsonb,
  go_live_readiness_score numeric(5,2) not null default 0,
  readiness_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'In Progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.create_company_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.company_branding (company_id, logo_url, primary_color, secondary_color)
  values (new.id, new.company_logo_url, '#0b5cff', '#08111f')
  on conflict (company_id) do nothing;

  insert into public.numbering_sequences (company_id, document_key, prefix, padding) values
    (new.id, 'customer', 'CUS', 5), (new.id, 'supplier', 'SUP', 5), (new.id, 'warehouse', 'WH', 5),
    (new.id, 'vehicle', 'VEH', 5), (new.id, 'product', 'PRD', 5), (new.id, 'recipe', 'REC', 5),
    (new.id, 'production_plan', 'PLAN', 5), (new.id, 'production_order', 'PO', 5), (new.id, 'material_issue', 'MI', 5),
    (new.id, 'quality_check', 'QC', 5), (new.id, 'batch', 'BATCH', 3), (new.id, 'stock_ledger', 'STK', 6),
    (new.id, 'warehouse_transfer', 'TRF', 5), (new.id, 'stock_adjustment', 'ADJ', 5), (new.id, 'stock_count', 'CNT', 5),
    (new.id, 'procurement_request', 'PRQ', 5), (new.id, 'purchase_order', 'PO', 5), (new.id, 'grn', 'GRN', 5),
    (new.id, 'supplier_return', 'SRT', 5), (new.id, 'opening_balance', 'OB', 5), (new.id, 'field_visit', 'VIS', 5),
    (new.id, 'route_plan', 'RPL', 5), (new.id, 'sales_order', 'SO', 5), (new.id, 'dispatch_order', 'DSP', 5),
    (new.id, 'picking_list', 'PCK', 5), (new.id, 'delivery_note', 'DN', 5), (new.id, 'driver_trip', 'TRIP', 5),
    (new.id, 'customer_return', 'RET', 5), (new.id, 'customer_complaint', 'CMP', 5), (new.id, 'invoice', 'INV', 5),
    (new.id, 'receipt', 'RCT', 5), (new.id, 'customer_ledger', 'LED', 6), (new.id, 'credit_note', 'CRN', 5),
    (new.id, 'debit_note', 'DBN', 5), (new.id, 'ai_insight', 'AI', 5), (new.id, 'alert', 'ALT', 5)
  on conflict (company_id, document_key) do nothing;

  insert into public.manufacturing_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.inventory_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.sales_distribution_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.collections_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.mpesa_configurations (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.security_policies (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.implementation_status (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  return new;
end;
$$;

insert into public.numbering_sequences (company_id, document_key, prefix, padding)
select c.id, seq.document_key, seq.prefix, seq.padding
from public.companies c
cross join (
  values
    ('invoice', 'INV', 5), ('receipt', 'RCT', 5), ('customer_ledger', 'LED', 6),
    ('credit_note', 'CRN', 5), ('debit_note', 'DBN', 5), ('ai_insight', 'AI', 5), ('alert', 'ALT', 5)
) as seq(document_key, prefix, padding)
on conflict (company_id, document_key) do nothing;

insert into public.collections_settings (tenant_id) select id from public.companies on conflict (tenant_id) do nothing;
insert into public.mpesa_configurations (tenant_id) select id from public.companies on conflict (tenant_id) do nothing;
insert into public.security_policies (tenant_id) select id from public.companies on conflict (tenant_id) do nothing;
insert into public.implementation_status (tenant_id) select id from public.companies on conflict (tenant_id) do nothing;

create or replace function private.apply_collections_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'sales_invoices' and (new.invoice_number is null or new.invoice_number = '') then
    new.invoice_number := private.next_document_number(new.tenant_id, 'invoice');
  elsif tg_table_name = 'customer_payments' and (new.receipt_number is null or new.receipt_number = '') then
    new.receipt_number := private.next_document_number(new.tenant_id, 'receipt');
  elsif tg_table_name = 'customer_account_ledger' and (new.transaction_number is null or new.transaction_number = '') then
    new.transaction_number := private.next_document_number(new.tenant_id, 'customer_ledger');
  elsif tg_table_name = 'credit_notes' and (new.credit_note_number is null or new.credit_note_number = '') then
    new.credit_note_number := private.next_document_number(new.tenant_id, 'credit_note');
  elsif tg_table_name = 'debit_notes' and (new.debit_note_number is null or new.debit_note_number = '') then
    new.debit_note_number := private.next_document_number(new.tenant_id, 'debit_note');
  elsif tg_table_name = 'ai_insights' and (new.insight_number is null or new.insight_number = '') then
    new.insight_number := private.next_document_number(new.tenant_id, 'ai_insight');
  elsif tg_table_name = 'alert_center' and (new.alert_number is null or new.alert_number = '') then
    new.alert_number := private.next_document_number(new.tenant_id, 'alert');
  end if;
  return new;
end;
$$;

create or replace function private.update_customer_account_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_row public.customer_accounts%rowtype;
  next_balance numeric(18,2);
begin
  insert into public.customer_accounts (tenant_id, customer_id, credit_limit, created_by, updated_by)
  select new.tenant_id, new.customer_id, coalesce(c.credit_limit, 0), new.created_by, new.updated_by
  from public.customers c
  where c.id = new.customer_id
  on conflict (tenant_id, customer_id) do nothing;

  select * into account_row
  from public.customer_accounts
  where tenant_id = new.tenant_id and customer_id = new.customer_id
  for update;

  next_balance := coalesce(account_row.current_balance, 0) + coalesce(new.debit_amount, 0) - coalesce(new.credit_amount, 0);
  new.account_id := account_row.id;
  new.balance_after := next_balance;

  update public.customer_accounts
  set current_balance = next_balance,
      overdue_balance = greatest(next_balance, 0),
      last_payment_at = case when new.credit_amount > 0 then now() else last_payment_at end,
      last_payment_amount = case when new.credit_amount > 0 then new.credit_amount else last_payment_amount end,
      updated_at = now(),
      updated_by = new.updated_by
  where id = account_row.id;

  return new;
end;
$$;

create trigger apply_invoice_number before insert on public.sales_invoices for each row execute function private.apply_collections_number();
create trigger apply_receipt_number before insert on public.customer_payments for each row execute function private.apply_collections_number();
create trigger apply_ledger_number before insert on public.customer_account_ledger for each row execute function private.apply_collections_number();
create trigger apply_credit_note_number before insert on public.credit_notes for each row execute function private.apply_collections_number();
create trigger apply_debit_note_number before insert on public.debit_notes for each row execute function private.apply_collections_number();
create trigger apply_ai_insight_number before insert on public.ai_insights for each row execute function private.apply_collections_number();
create trigger apply_alert_number before insert on public.alert_center for each row execute function private.apply_collections_number();
create trigger update_customer_account_balance_before_insert before insert on public.customer_account_ledger for each row execute function private.update_customer_account_balance();

create trigger touch_collections_settings_updated_at before update on public.collections_settings for each row execute function private.touch_updated_at();
create trigger touch_mpesa_configurations_updated_at before update on public.mpesa_configurations for each row execute function private.touch_updated_at();
create trigger touch_customer_accounts_updated_at before update on public.customer_accounts for each row execute function private.touch_updated_at();
create trigger touch_customer_account_ledger_updated_at before update on public.customer_account_ledger for each row execute function private.touch_updated_at();
create trigger touch_sales_invoices_updated_at before update on public.sales_invoices for each row execute function private.touch_updated_at();
create trigger touch_sales_invoice_lines_updated_at before update on public.sales_invoice_lines for each row execute function private.touch_updated_at();
create trigger touch_customer_payments_updated_at before update on public.customer_payments for each row execute function private.touch_updated_at();
create trigger touch_payment_allocations_updated_at before update on public.payment_allocations for each row execute function private.touch_updated_at();
create trigger touch_mpesa_collections_updated_at before update on public.mpesa_collections for each row execute function private.touch_updated_at();
create trigger touch_cash_collections_updated_at before update on public.cash_collections for each row execute function private.touch_updated_at();
create trigger touch_cheque_collections_updated_at before update on public.cheque_collections for each row execute function private.touch_updated_at();
create trigger touch_bank_transfer_collections_updated_at before update on public.bank_transfer_collections for each row execute function private.touch_updated_at();
create trigger touch_credit_notes_updated_at before update on public.credit_notes for each row execute function private.touch_updated_at();
create trigger touch_debit_notes_updated_at before update on public.debit_notes for each row execute function private.touch_updated_at();
create trigger touch_customer_risk_scores_updated_at before update on public.customer_risk_scores for each row execute function private.touch_updated_at();
create trigger touch_finance_integration_events_updated_at before update on public.finance_integration_events for each row execute function private.touch_updated_at();
create trigger touch_ai_insights_updated_at before update on public.ai_insights for each row execute function private.touch_updated_at();
create trigger touch_ai_chat_threads_updated_at before update on public.ai_chat_threads for each row execute function private.touch_updated_at();
create trigger touch_ai_chat_messages_updated_at before update on public.ai_chat_messages for each row execute function private.touch_updated_at();
create trigger touch_kpi_definitions_updated_at before update on public.kpi_definitions for each row execute function private.touch_updated_at();
create trigger touch_kpi_snapshots_updated_at before update on public.kpi_snapshots for each row execute function private.touch_updated_at();
create trigger touch_alert_center_updated_at before update on public.alert_center for each row execute function private.touch_updated_at();
create trigger touch_document_attachments_updated_at before update on public.document_attachments for each row execute function private.touch_updated_at();
create trigger touch_approval_workflows_updated_at before update on public.approval_workflows for each row execute function private.touch_updated_at();
create trigger touch_approval_requests_updated_at before update on public.approval_requests for each row execute function private.touch_updated_at();
create trigger touch_user_devices_updated_at before update on public.user_devices for each row execute function private.touch_updated_at();
create trigger touch_security_policies_updated_at before update on public.security_policies for each row execute function private.touch_updated_at();
create trigger touch_backup_jobs_updated_at before update on public.backup_jobs for each row execute function private.touch_updated_at();
create trigger touch_integration_endpoints_updated_at before update on public.integration_endpoints for each row execute function private.touch_updated_at();
create trigger touch_implementation_status_updated_at before update on public.implementation_status for each row execute function private.touch_updated_at();

create index customer_accounts_lookup_idx on public.customer_accounts(tenant_id, customer_id, status);
create index customer_ledger_lookup_idx on public.customer_account_ledger(tenant_id, customer_id, transaction_date desc);
create index invoices_lookup_idx on public.sales_invoices(tenant_id, customer_id, due_date, status);
create index payments_lookup_idx on public.customer_payments(tenant_id, customer_id, payment_date desc, status);
create index allocations_lookup_idx on public.payment_allocations(tenant_id, payment_id, invoice_id);
create index mpesa_lookup_idx on public.mpesa_collections(tenant_id, mpesa_receipt_number, account_number);
create index risk_lookup_idx on public.customer_risk_scores(tenant_id, risk_level, total_score desc);
create index ai_insights_lookup_idx on public.ai_insights(tenant_id, module_key, insight_type, status, created_at desc);
create index alert_center_lookup_idx on public.alert_center(tenant_id, alert_type, severity, status, created_at desc);
create index documents_lookup_idx on public.document_attachments(tenant_id, module_key, table_name, record_id);
create index approval_requests_lookup_idx on public.approval_requests(tenant_id, module_key, status, created_at desc);

alter table public.collections_settings enable row level security;
alter table public.mpesa_configurations enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.customer_account_ledger enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.sales_invoice_lines enable row level security;
alter table public.customer_payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.mpesa_collections enable row level security;
alter table public.cash_collections enable row level security;
alter table public.cheque_collections enable row level security;
alter table public.bank_transfer_collections enable row level security;
alter table public.credit_notes enable row level security;
alter table public.debit_notes enable row level security;
alter table public.customer_risk_scores enable row level security;
alter table public.finance_integration_events enable row level security;
alter table public.ai_insights enable row level security;
alter table public.ai_chat_threads enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.kpi_definitions enable row level security;
alter table public.kpi_snapshots enable row level security;
alter table public.alert_center enable row level security;
alter table public.document_attachments enable row level security;
alter table public.approval_workflows enable row level security;
alter table public.approval_requests enable row level security;
alter table public.user_devices enable row level security;
alter table public.security_policies enable row level security;
alter table public.backup_jobs enable row level security;
alter table public.integration_endpoints enable row level security;
alter table public.implementation_status enable row level security;

create policy tenant_all_collections_settings on public.collections_settings for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_mpesa_configurations on public.mpesa_configurations for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_accounts on public.customer_accounts for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_account_ledger on public.customer_account_ledger for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_sales_invoices on public.sales_invoices for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_sales_invoice_lines on public.sales_invoice_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_payments on public.customer_payments for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_payment_allocations on public.payment_allocations for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_mpesa_collections on public.mpesa_collections for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_cash_collections on public.cash_collections for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_cheque_collections on public.cheque_collections for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_bank_transfer_collections on public.bank_transfer_collections for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_credit_notes on public.credit_notes for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_debit_notes on public.debit_notes for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_risk_scores on public.customer_risk_scores for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_finance_integration_events on public.finance_integration_events for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_ai_insights on public.ai_insights for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_ai_chat_threads on public.ai_chat_threads for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_ai_chat_messages on public.ai_chat_messages for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_kpi_definitions on public.kpi_definitions for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_kpi_snapshots on public.kpi_snapshots for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_alert_center on public.alert_center for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_document_attachments on public.document_attachments for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_approval_workflows on public.approval_workflows for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_approval_requests on public.approval_requests for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_user_devices on public.user_devices for all using (tenant_id = private.current_company_id() or private.is_solva_admin() or user_id = auth.uid()) with check (tenant_id = private.current_company_id() or private.is_solva_admin() or user_id = auth.uid());
create policy tenant_all_security_policies on public.security_policies for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_backup_jobs on public.backup_jobs for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_integration_endpoints on public.integration_endpoints for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_implementation_status on public.implementation_status for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into public.permissions (module_key, page_key, action_key, description)
select module_key, page_key, action_key, concat(action_key, ' ', page_key)
from (
  values
    ('collections', 'dashboard'), ('collections', 'customer_accounts'), ('collections', 'outstanding_invoices'),
    ('collections', 'collections'), ('collections', 'mpesa_collections'), ('collections', 'cash_collections'),
    ('collections', 'cheque_collections'), ('collections', 'bank_transfers'), ('collections', 'customer_statements'),
    ('collections', 'credit_notes'), ('collections', 'debit_notes'), ('collections', 'aging_reports'), ('collections', 'reports'),
    ('collections', 'settings'), ('ai', 'dashboard'), ('ai', 'insights'), ('ai', 'chat'), ('ai', 'kpis'),
    ('enterprise', 'command_center'), ('enterprise', 'alerts'), ('enterprise', 'documents'), ('enterprise', 'approvals'),
    ('enterprise', 'security'), ('enterprise', 'backups'), ('enterprise', 'integrations'), ('enterprise', 'implementation_status')
) pages(module_key, page_key)
cross join (
  values ('view'), ('create'), ('edit'), ('delete'), ('approve'), ('reject'), ('export'), ('print'), ('administer'),
         ('post'), ('allocate'), ('verify'), ('generate'), ('sync'), ('acknowledge'), ('resolve')
) actions(action_key)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where p.module_key in ('collections', 'ai', 'enterprise')
  and (
    r.role_key in ('super_admin', 'solva_team', 'full_access')
    or (r.role_key in ('managing_director', 'company_ceo') and p.action_key in ('view', 'approve', 'reject', 'export', 'print', 'generate'))
    or (r.role_key = 'finance_manager' and p.module_key = 'collections')
    or (r.role_key = 'finance_manager' and p.module_key = 'enterprise' and p.page_key in ('command_center', 'alerts', 'documents', 'approvals', 'integrations') and p.action_key in ('view', 'create', 'edit', 'approve', 'export', 'print', 'sync'))
    or (r.role_key in ('operations_manager', 'sales_manager') and p.action_key in ('view', 'export', 'print', 'generate'))
    or (r.role_key = 'sales_representative' and p.module_key = 'collections' and p.page_key in ('customer_accounts', 'collections', 'cash_collections', 'customer_statements') and p.action_key in ('view', 'create', 'export', 'print'))
    or (r.role_key = 'auditor' and p.action_key in ('view', 'export', 'print'))
  )
on conflict do nothing;
