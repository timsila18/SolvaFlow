create table public.inventory_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  valuation_method text not null default 'Weighted Average' check (valuation_method in ('FIFO', 'Weighted Average', 'Standard Cost')),
  allow_negative_stock boolean not null default false,
  near_expiry_days integer not null default 30,
  require_adjustment_approval boolean not null default true,
  require_transfer_approval boolean not null default true,
  require_opening_balance_approval boolean not null default true,
  default_qc_status text not null default 'Approved',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create table public.stock_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  batch_id uuid references public.production_batches(id),
  batch_number text,
  expiry_date date,
  unit_of_measure_id uuid references public.units_of_measure(id),
  qc_status text not null default 'Approved' check (qc_status in ('Approved', 'On Hold', 'Rework', 'Rejected', 'Damaged', 'Expired', 'Disposed')),
  total_quantity numeric(18,6) not null default 0,
  reserved_quantity numeric(18,6) not null default 0,
  qc_hold_quantity numeric(18,6) not null default 0,
  damaged_quantity numeric(18,6) not null default 0,
  expired_quantity numeric(18,6) not null default 0,
  in_transit_quantity numeric(18,6) not null default 0,
  available_quantity numeric(18,6) generated always as (
    greatest(total_quantity - reserved_quantity - qc_hold_quantity - damaged_quantity - expired_quantity, 0)
  ) stored,
  weighted_average_cost numeric(18,6) not null default 0,
  total_value numeric(18,2) not null default 0,
  last_movement_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, product_id, warehouse_id, batch_number, qc_status)
);

create table public.stock_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  transaction_number text not null,
  transaction_type text not null check (transaction_type in ('Opening Balance', 'Purchase Receipt', 'Production Issue', 'Production Output', 'Warehouse Transfer', 'Sales Dispatch', 'Return from Customer', 'Supplier Return', 'Stock Adjustment', 'Stock Count Gain', 'Stock Count Loss', 'Damage', 'Expiry Write-Off')),
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  batch_id uuid references public.production_batches(id),
  batch_number text,
  quantity_in numeric(18,6) not null default 0,
  quantity_out numeric(18,6) not null default 0,
  balance_after_transaction numeric(18,6) not null default 0,
  unit_cost numeric(18,6) not null default 0,
  total_value numeric(18,2) not null default 0,
  reference_document text,
  reference_id uuid,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, transaction_number)
);

create table public.warehouse_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  transfer_number text not null,
  source_warehouse_id uuid not null references public.warehouses(id),
  destination_warehouse_id uuid not null references public.warehouses(id),
  reason text,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  dispatched_by uuid references auth.users(id),
  received_by uuid references auth.users(id),
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Approved', 'In Transit', 'Received', 'Cancelled')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, transfer_number)
);

create table public.warehouse_transfer_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  transfer_id uuid not null references public.warehouse_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id),
  batch_id uuid references public.production_batches(id),
  batch_number text,
  quantity numeric(18,6) not null check (quantity > 0),
  unit_of_measure_id uuid references public.units_of_measure(id),
  unit_cost numeric(18,6) not null default 0,
  status text not null default 'Draft',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  adjustment_number text not null,
  adjustment_type text not null check (adjustment_type in ('Increase', 'Decrease', 'Damage', 'Expiry', 'Correction', 'Write-off')),
  reason text not null,
  supporting_attachment_url text,
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Approved', 'Posted', 'Rejected', 'Cancelled')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, adjustment_number)
);

create table public.stock_adjustment_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  adjustment_id uuid not null references public.stock_adjustments(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  batch_id uuid references public.production_batches(id),
  batch_number text,
  current_quantity numeric(18,6) not null default 0,
  adjustment_quantity numeric(18,6) not null default 0,
  new_quantity numeric(18,6) not null default 0,
  unit_cost numeric(18,6) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  count_number text not null,
  warehouse_id uuid not null references public.warehouses(id),
  count_date date not null,
  count_team text,
  reviewed_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  status text not null default 'Draft' check (status in ('Draft', 'In Progress', 'Submitted', 'Reviewed', 'Approved', 'Posted')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, count_number)
);

create table public.stock_count_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  stock_count_id uuid not null references public.stock_counts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  batch_id uuid references public.production_batches(id),
  batch_number text,
  system_quantity numeric(18,6) not null default 0,
  counted_quantity numeric(18,6) not null default 0,
  variance numeric(18,6) generated always as (counted_quantity - system_quantity) stored,
  variance_value numeric(18,2) not null default 0,
  reason text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reorder_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid references public.warehouses(id),
  current_stock numeric(18,6) not null default 0,
  reorder_level numeric(18,6) not null default 0,
  suggested_reorder_quantity numeric(18,6) not null default 0,
  preferred_supplier_id uuid references public.suppliers(id),
  lead_time_days integer,
  average_consumption_rate numeric(18,6) not null default 0,
  source text not null default 'Automatic',
  status text not null default 'Open' check (status in ('Open', 'Acknowledged', 'Converted to Procurement Request', 'Closed')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.procurement_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  request_number text not null,
  requested_by uuid references auth.users(id),
  department text,
  required_date date,
  reason text,
  source text not null default 'Manual request' check (source in ('Manual request', 'Reorder alert', 'Production material shortage', 'Stock count variance', 'Management request')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Approved', 'Rejected', 'Converted to Purchase Order', 'Cancelled')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, request_number)
);

create table public.procurement_request_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  procurement_request_id uuid not null references public.procurement_requests(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity_required numeric(18,6) not null check (quantity_required > 0),
  preferred_supplier_id uuid references public.suppliers(id),
  estimated_cost numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_number text not null,
  supplier_id uuid not null references public.suppliers(id),
  procurement_request_id uuid references public.procurement_requests(id),
  order_date date not null default current_date,
  expected_delivery_date date,
  delivery_warehouse_id uuid references public.warehouses(id),
  payment_terms text,
  subtotal numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  approved_by uuid references auth.users(id),
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Approved', 'Sent to Supplier', 'Partially Received', 'Fully Received', 'Closed', 'Cancelled')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, purchase_order_number)
);

create table public.purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(18,6) not null check (quantity > 0),
  unit_price numeric(18,6) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) generated always as ((quantity * unit_price) + tax_amount) stored,
  delivery_warehouse_id uuid references public.warehouses(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goods_received_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  grn_number text not null,
  purchase_order_id uuid references public.purchase_orders(id),
  supplier_id uuid not null references public.suppliers(id),
  delivery_note_number text,
  received_date date not null default current_date,
  received_by uuid references auth.users(id),
  warehouse_id uuid not null references public.warehouses(id),
  attachment_urls text,
  status text not null default 'Draft' check (status in ('Draft', 'Posted', 'Cancelled')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, grn_number)
);

create table public.goods_received_note_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  grn_id uuid not null references public.goods_received_notes(id) on delete cascade,
  purchase_order_line_id uuid references public.purchase_order_lines(id),
  product_id uuid not null references public.products(id),
  quantity_ordered numeric(18,6) not null default 0,
  quantity_received numeric(18,6) not null default 0,
  quantity_accepted numeric(18,6) not null default 0,
  quantity_rejected numeric(18,6) not null default 0,
  batch_number text,
  expiry_date date,
  qc_required boolean not null default false,
  unit_cost numeric(18,6) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_returns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  supplier_return_number text not null,
  supplier_id uuid not null references public.suppliers(id),
  grn_id uuid references public.goods_received_notes(id),
  return_date date not null default current_date,
  reason text,
  status text not null default 'Draft' check (status in ('Draft', 'Approved', 'Dispatched to Supplier', 'Closed')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, supplier_return_number)
);

create table public.supplier_return_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  supplier_return_id uuid not null references public.supplier_returns(id) on delete cascade,
  product_id uuid not null references public.products(id),
  batch_number text,
  quantity_returned numeric(18,6) not null check (quantity_returned > 0),
  unit_cost numeric(18,6) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opening_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  opening_balance_number text not null,
  balance_date date not null default current_date,
  uploaded_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  status text not null default 'Draft' check (status in ('Draft', 'Uploaded', 'Approved', 'Posted', 'Rejected')),
  import_errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, opening_balance_number)
);

create table public.opening_balance_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  opening_balance_id uuid not null references public.opening_balances(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  batch_number text,
  expiry_date date,
  quantity numeric(18,6) not null check (quantity >= 0),
  unit_cost numeric(18,6) not null default 0,
  total_value numeric(18,2) generated always as (quantity * unit_cost) stored,
  approval_status text not null default 'Pending' check (approval_status in ('Pending', 'Approved', 'Rejected')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  price_list_name text not null,
  customer_type text,
  effective_date date,
  expiry_date date,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Archived')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, price_list_name)
);

create table public.price_list_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  product_id uuid not null references public.products(id),
  standard_price numeric(18,2) not null default 0,
  wholesale_price numeric(18,2) not null default 0,
  distributor_price numeric(18,2) not null default 0,
  special_price numeric(18,2) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, price_list_id, product_id)
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
    (new.id, 'supplier_return', 'SRT', 5), (new.id, 'opening_balance', 'OB', 5)
  on conflict (company_id, document_key) do nothing;

  insert into public.manufacturing_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.inventory_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  return new;
end;
$$;

insert into public.numbering_sequences (company_id, document_key, prefix, padding)
select c.id, seq.document_key, seq.prefix, seq.padding
from public.companies c
cross join (
  values
    ('stock_ledger', 'STK', 6), ('warehouse_transfer', 'TRF', 5), ('stock_adjustment', 'ADJ', 5),
    ('stock_count', 'CNT', 5), ('procurement_request', 'PRQ', 5), ('purchase_order', 'PO', 5),
    ('grn', 'GRN', 5), ('supplier_return', 'SRT', 5), ('opening_balance', 'OB', 5)
) as seq(document_key, prefix, padding)
on conflict (company_id, document_key) do nothing;

insert into public.inventory_settings (tenant_id)
select id from public.companies
on conflict (tenant_id) do nothing;

create or replace function private.apply_inventory_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'stock_ledger' and (new.transaction_number is null or new.transaction_number = '') then
    new.transaction_number := private.next_document_number(new.tenant_id, 'stock_ledger');
  elsif tg_table_name = 'warehouse_transfers' and (new.transfer_number is null or new.transfer_number = '') then
    new.transfer_number := private.next_document_number(new.tenant_id, 'warehouse_transfer');
  elsif tg_table_name = 'stock_adjustments' and (new.adjustment_number is null or new.adjustment_number = '') then
    new.adjustment_number := private.next_document_number(new.tenant_id, 'stock_adjustment');
  elsif tg_table_name = 'stock_counts' and (new.count_number is null or new.count_number = '') then
    new.count_number := private.next_document_number(new.tenant_id, 'stock_count');
  elsif tg_table_name = 'procurement_requests' and (new.request_number is null or new.request_number = '') then
    new.request_number := private.next_document_number(new.tenant_id, 'procurement_request');
  elsif tg_table_name = 'purchase_orders' and (new.purchase_order_number is null or new.purchase_order_number = '') then
    new.purchase_order_number := private.next_document_number(new.tenant_id, 'purchase_order');
  elsif tg_table_name = 'goods_received_notes' and (new.grn_number is null or new.grn_number = '') then
    new.grn_number := private.next_document_number(new.tenant_id, 'grn');
  elsif tg_table_name = 'supplier_returns' and (new.supplier_return_number is null or new.supplier_return_number = '') then
    new.supplier_return_number := private.next_document_number(new.tenant_id, 'supplier_return');
  elsif tg_table_name = 'opening_balances' and (new.opening_balance_number is null or new.opening_balance_number = '') then
    new.opening_balance_number := private.next_document_number(new.tenant_id, 'opening_balance');
  end if;
  return new;
end;
$$;

create trigger touch_inventory_settings_updated_at before update on public.inventory_settings for each row execute function private.touch_updated_at();
create trigger touch_stock_balances_updated_at before update on public.stock_balances for each row execute function private.touch_updated_at();
create trigger touch_stock_ledger_updated_at before update on public.stock_ledger for each row execute function private.touch_updated_at();
create trigger touch_warehouse_transfers_updated_at before update on public.warehouse_transfers for each row execute function private.touch_updated_at();
create trigger touch_warehouse_transfer_lines_updated_at before update on public.warehouse_transfer_lines for each row execute function private.touch_updated_at();
create trigger touch_stock_adjustments_updated_at before update on public.stock_adjustments for each row execute function private.touch_updated_at();
create trigger touch_stock_adjustment_lines_updated_at before update on public.stock_adjustment_lines for each row execute function private.touch_updated_at();
create trigger touch_stock_counts_updated_at before update on public.stock_counts for each row execute function private.touch_updated_at();
create trigger touch_stock_count_lines_updated_at before update on public.stock_count_lines for each row execute function private.touch_updated_at();
create trigger touch_reorder_alerts_updated_at before update on public.reorder_alerts for each row execute function private.touch_updated_at();
create trigger touch_procurement_requests_updated_at before update on public.procurement_requests for each row execute function private.touch_updated_at();
create trigger touch_procurement_request_lines_updated_at before update on public.procurement_request_lines for each row execute function private.touch_updated_at();
create trigger touch_purchase_orders_updated_at before update on public.purchase_orders for each row execute function private.touch_updated_at();
create trigger touch_purchase_order_lines_updated_at before update on public.purchase_order_lines for each row execute function private.touch_updated_at();
create trigger touch_grns_updated_at before update on public.goods_received_notes for each row execute function private.touch_updated_at();
create trigger touch_grn_lines_updated_at before update on public.goods_received_note_lines for each row execute function private.touch_updated_at();
create trigger touch_supplier_returns_updated_at before update on public.supplier_returns for each row execute function private.touch_updated_at();
create trigger touch_supplier_return_lines_updated_at before update on public.supplier_return_lines for each row execute function private.touch_updated_at();
create trigger touch_opening_balances_updated_at before update on public.opening_balances for each row execute function private.touch_updated_at();
create trigger touch_opening_balance_lines_updated_at before update on public.opening_balance_lines for each row execute function private.touch_updated_at();
create trigger touch_price_lists_updated_at before update on public.price_lists for each row execute function private.touch_updated_at();
create trigger touch_price_list_lines_updated_at before update on public.price_list_lines for each row execute function private.touch_updated_at();

create trigger apply_stock_ledger_number before insert on public.stock_ledger for each row execute function private.apply_inventory_number();
create trigger apply_transfer_number before insert on public.warehouse_transfers for each row execute function private.apply_inventory_number();
create trigger apply_adjustment_number before insert on public.stock_adjustments for each row execute function private.apply_inventory_number();
create trigger apply_count_number before insert on public.stock_counts for each row execute function private.apply_inventory_number();
create trigger apply_request_number before insert on public.procurement_requests for each row execute function private.apply_inventory_number();
create trigger apply_po_number before insert on public.purchase_orders for each row execute function private.apply_inventory_number();
create trigger apply_grn_number before insert on public.goods_received_notes for each row execute function private.apply_inventory_number();
create trigger apply_supplier_return_number before insert on public.supplier_returns for each row execute function private.apply_inventory_number();
create trigger apply_opening_balance_number before insert on public.opening_balances for each row execute function private.apply_inventory_number();

create index stock_balances_lookup_idx on public.stock_balances(tenant_id, product_id, warehouse_id, expiry_date, qc_status);
create index stock_ledger_lookup_idx on public.stock_ledger(tenant_id, product_id, warehouse_id, created_at desc);
create index transfer_status_idx on public.warehouse_transfers(tenant_id, status, created_at desc);
create index reorder_alerts_status_idx on public.reorder_alerts(tenant_id, status, created_at desc);
create index grn_status_idx on public.goods_received_notes(tenant_id, status, received_date desc);

alter table public.inventory_settings enable row level security;
alter table public.stock_balances enable row level security;
alter table public.stock_ledger enable row level security;
alter table public.warehouse_transfers enable row level security;
alter table public.warehouse_transfer_lines enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.stock_adjustment_lines enable row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_count_lines enable row level security;
alter table public.reorder_alerts enable row level security;
alter table public.procurement_requests enable row level security;
alter table public.procurement_request_lines enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_lines enable row level security;
alter table public.goods_received_notes enable row level security;
alter table public.goods_received_note_lines enable row level security;
alter table public.supplier_returns enable row level security;
alter table public.supplier_return_lines enable row level security;
alter table public.opening_balances enable row level security;
alter table public.opening_balance_lines enable row level security;
alter table public.price_lists enable row level security;
alter table public.price_list_lines enable row level security;

create policy tenant_all_inventory_settings on public.inventory_settings for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_stock_balances on public.stock_balances for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_stock_ledger on public.stock_ledger for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_warehouse_transfers on public.warehouse_transfers for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_warehouse_transfer_lines on public.warehouse_transfer_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_stock_adjustments on public.stock_adjustments for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_stock_adjustment_lines on public.stock_adjustment_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_stock_counts on public.stock_counts for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_stock_count_lines on public.stock_count_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_reorder_alerts on public.reorder_alerts for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_procurement_requests on public.procurement_requests for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_procurement_request_lines on public.procurement_request_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_purchase_orders on public.purchase_orders for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_purchase_order_lines on public.purchase_order_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_grns on public.goods_received_notes for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_grn_lines on public.goods_received_note_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_supplier_returns on public.supplier_returns for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_supplier_return_lines on public.supplier_return_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_opening_balances on public.opening_balances for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_opening_balance_lines on public.opening_balance_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_price_lists on public.price_lists for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_price_list_lines on public.price_list_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into public.permissions (module_key, page_key, action_key, description)
select module_key, page_key, action_key, concat(action_key, ' ', page_key)
from (
  values
    ('inventory', 'dashboard'), ('inventory', 'stock_items'), ('inventory', 'stock_balances'), ('inventory', 'stock_ledger'),
    ('inventory', 'warehouse_transfers'), ('inventory', 'stock_adjustments'), ('inventory', 'stock_counts'), ('inventory', 'reorder_alerts'),
    ('inventory', 'batch_expiry'), ('inventory', 'procurement_requests'), ('inventory', 'purchase_orders'), ('inventory', 'goods_received_notes'),
    ('inventory', 'supplier_returns'), ('inventory', 'stock_valuation'), ('inventory', 'opening_balances'), ('inventory', 'price_lists'),
    ('inventory', 'imports'), ('inventory', 'reports'), ('inventory', 'settings')
) pages(module_key, page_key)
cross join (
  values ('view'), ('create'), ('edit'), ('delete'), ('approve'), ('reject'), ('export'), ('print'), ('administer'), ('post'), ('receive'), ('dispatch')
) actions(action_key)
on conflict do nothing;

insert into public.roles (role_name, role_key, description, is_system_role, is_global_role)
values ('Warehouse Officer', 'warehouse_officer', 'Warehouse operations user for stock movements, GRNs, transfers, and counts.', true, false)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where p.module_key = 'inventory'
  and (
    r.role_key in ('super_admin', 'solva_team', 'full_access', 'operations_manager', 'warehouse_manager')
    or (r.role_key in ('managing_director', 'company_ceo') and p.action_key in ('view', 'approve', 'reject', 'export', 'print'))
    or (r.role_key = 'warehouse_officer' and p.action_key in ('view', 'create', 'edit', 'post', 'receive', 'dispatch', 'export', 'print'))
    or (r.role_key = 'procurement_officer' and p.page_key in ('procurement_requests', 'purchase_orders', 'goods_received_notes', 'supplier_returns', 'reorder_alerts') and p.action_key in ('view', 'create', 'edit', 'approve', 'export', 'print'))
    or (r.role_key = 'production_manager' and p.action_key in ('view', 'export', 'print'))
    or (r.role_key = 'sales_manager' and p.page_key in ('stock_balances', 'batch_expiry', 'reports') and p.action_key in ('view', 'export', 'print'))
    or (r.role_key = 'finance_manager' and p.page_key in ('stock_valuation', 'goods_received_notes', 'purchase_orders', 'reports') and p.action_key in ('view', 'export', 'print'))
    or (r.role_key = 'auditor' and p.action_key in ('view', 'export', 'print'))
  )
on conflict do nothing;
