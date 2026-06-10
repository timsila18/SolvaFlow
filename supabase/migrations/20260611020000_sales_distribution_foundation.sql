create table public.sales_distribution_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade unique,
  default_check_in_radius_meters numeric(10,2) not null default 100,
  require_manager_override_outside_radius boolean not null default true,
  allow_backorders boolean not null default false,
  require_credit_approval boolean not null default true,
  fefo_required boolean not null default true,
  delivery_confirmation_required boolean not null default true,
  customer_portal_enabled boolean not null default true,
  status text not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  visit_number text,
  sales_rep_id uuid references public.user_profiles(id),
  customer_id uuid not null references public.customers(id),
  route_id uuid references public.routes(id),
  route_plan_id uuid,
  scheduled_date date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  latitude numeric(10,7),
  longitude numeric(10,7),
  distance_from_customer_meters numeric(12,2),
  allowed_radius_meters numeric(10,2),
  device_information text,
  visit_status text not null default 'Scheduled',
  outcome text,
  notes text,
  location_exception boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_visit_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  field_visit_id uuid not null references public.field_visits(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  sales_rep_id uuid references public.user_profiles(id),
  evidence_type text not null,
  file_url text,
  notes text,
  captured_at timestamptz not null default now(),
  latitude numeric(10,7),
  longitude numeric(10,7),
  gps_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  route_plan_number text,
  sales_rep_id uuid not null references public.user_profiles(id),
  territory_id uuid references public.territories(id),
  route_id uuid references public.routes(id),
  plan_date date not null,
  expected_start_time time,
  expected_end_time time,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_plan_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  route_plan_id uuid not null references public.route_plans(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  planned_sequence integer not null default 1,
  expected_arrival_time time,
  visit_id uuid references public.field_visits(id),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, route_plan_id, customer_id)
);

create table public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  sales_order_number text,
  customer_id uuid not null references public.customers(id),
  sales_rep_id uuid references public.user_profiles(id),
  territory_id uuid references public.territories(id),
  route_id uuid references public.routes(id),
  field_visit_id uuid references public.field_visits(id),
  order_date date not null default current_date,
  expected_delivery_date date,
  payment_terms text,
  price_list_id uuid references public.price_lists(id),
  subtotal numeric(18,2) not null default 0,
  discount_total numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  credit_status text not null default 'Not Checked',
  credit_exception boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales_order_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  batch_id uuid references public.production_batches(id),
  batch_number text,
  quantity numeric(18,3) not null default 0,
  unit_of_measure_id uuid references public.units_of_measure(id),
  unit_price numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  line_total numeric(18,2) generated always as ((quantity * unit_price) - discount_amount + tax_amount) stored,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales_order_stock_reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  sales_order_line_id uuid references public.sales_order_lines(id) on delete cascade,
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  stock_balance_id uuid references public.stock_balances(id),
  batch_number text,
  expiry_date date,
  quantity_reserved numeric(18,3) not null default 0,
  quantity_released numeric(18,3) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Reserved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_credit_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  credit_limit numeric(18,2) not null default 0,
  outstanding_balance numeric(18,2) not null default 0,
  overdue_amount numeric(18,2) not null default 0,
  order_amount numeric(18,2) not null default 0,
  result text not null default 'Pass',
  exception_reason text,
  approved_by uuid references public.user_profiles(id),
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dispatch_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  dispatch_number text,
  sales_order_id uuid not null references public.sales_orders(id),
  customer_id uuid not null references public.customers(id),
  warehouse_id uuid not null references public.warehouses(id),
  dispatch_date date not null default current_date,
  vehicle_id uuid references public.vehicles(id),
  driver_id uuid references public.user_profiles(id),
  route_id uuid references public.routes(id),
  dispatch_officer_id uuid references public.user_profiles(id),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dispatch_order_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  dispatch_order_id uuid not null references public.dispatch_orders(id) on delete cascade,
  sales_order_line_id uuid references public.sales_order_lines(id),
  product_id uuid not null references public.products(id),
  ordered_quantity numeric(18,3) not null default 0,
  picked_quantity numeric(18,3) not null default 0,
  batch_number text,
  expiry_date date,
  warehouse_location text,
  picker_id uuid references public.user_profiles(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.picking_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  picking_number text,
  dispatch_order_id uuid not null references public.dispatch_orders(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id),
  picker_id uuid references public.user_profiles(id),
  picked_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.picking_list_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  picking_list_id uuid not null references public.picking_lists(id) on delete cascade,
  product_id uuid not null references public.products(id),
  ordered_quantity numeric(18,3) not null default 0,
  picked_quantity numeric(18,3) not null default 0,
  batch_number text,
  expiry_date date,
  warehouse_location text,
  picker_id uuid references public.user_profiles(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  delivery_note_number text,
  sales_order_id uuid not null references public.sales_orders(id),
  dispatch_order_id uuid references public.dispatch_orders(id),
  customer_id uuid not null references public.customers(id),
  vehicle_id uuid references public.vehicles(id),
  driver_id uuid references public.user_profiles(id),
  delivery_date date not null default current_date,
  receiver_name text,
  receiver_signature_url text,
  branded_pdf_url text,
  invoice_reference text,
  footer text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_note_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  delivery_note_id uuid not null references public.delivery_notes(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(18,3) not null default 0,
  unit_of_measure_id uuid references public.units_of_measure(id),
  batch_number text,
  expiry_date date,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.driver_trips (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  trip_number text,
  dispatch_order_id uuid references public.dispatch_orders(id),
  driver_id uuid not null references public.user_profiles(id),
  vehicle_id uuid references public.vehicles(id),
  route_id uuid references public.routes(id),
  departure_time timestamptz,
  arrival_time timestamptz,
  completed_at timestamptz,
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  distance_travelled_km numeric(12,2),
  delay_minutes numeric(12,2),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.driver_trip_locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  driver_trip_id uuid not null references public.driver_trips(id) on delete cascade,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  recorded_at timestamptz not null default now(),
  speed_kph numeric(10,2),
  heading numeric(10,2),
  device_information text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_confirmations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  delivery_note_id uuid not null references public.delivery_notes(id),
  dispatch_order_id uuid references public.dispatch_orders(id),
  customer_id uuid not null references public.customers(id),
  receiver_name text not null,
  receiver_phone text,
  receiver_designation text,
  signature_url text,
  stamp_photo_url text,
  goods_received_photo_url text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  confirmed_at timestamptz,
  quantity_accepted numeric(18,3) not null default 0,
  quantity_rejected numeric(18,3) not null default 0,
  comments text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.failed_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  dispatch_order_id uuid references public.dispatch_orders(id),
  delivery_note_id uuid references public.delivery_notes(id),
  customer_id uuid not null references public.customers(id),
  driver_id uuid references public.user_profiles(id),
  reason text not null,
  notes text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  recorded_at timestamptz not null default now(),
  resolution_action text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_returns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  return_number text,
  customer_id uuid not null references public.customers(id),
  sales_order_id uuid references public.sales_orders(id),
  delivery_note_id uuid references public.delivery_notes(id),
  return_date date not null default current_date,
  received_by uuid references public.user_profiles(id),
  reason text,
  condition text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_return_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  customer_return_id uuid not null references public.customer_returns(id) on delete cascade,
  product_id uuid not null references public.products(id),
  batch_number text,
  quantity_delivered numeric(18,3) not null default 0,
  quantity_returned numeric(18,3) not null default 0,
  reason text,
  condition text,
  warehouse_id uuid references public.warehouses(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_complaints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  complaint_number text,
  customer_id uuid not null references public.customers(id),
  product_id uuid references public.products(id),
  batch_number text,
  delivery_note_id uuid references public.delivery_notes(id),
  complaint_type text not null,
  description text not null,
  attachment_url text,
  assigned_to uuid references public.user_profiles(id),
  resolution_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_portal_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  auth_user_id uuid references auth.users(id),
  email text not null,
  full_name text,
  phone text,
  last_login_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

alter table public.field_visits add constraint field_visits_route_plan_fk foreign key (route_plan_id) references public.route_plans(id);

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
    (new.id, 'customer_return', 'RET', 5), (new.id, 'customer_complaint', 'CMP', 5)
  on conflict (company_id, document_key) do nothing;

  insert into public.manufacturing_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.inventory_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  insert into public.sales_distribution_settings (tenant_id) values (new.id) on conflict (tenant_id) do nothing;
  return new;
end;
$$;

insert into public.numbering_sequences (company_id, document_key, prefix, padding)
select c.id, seq.document_key, seq.prefix, seq.padding
from public.companies c
cross join (
  values
    ('field_visit', 'VIS', 5), ('route_plan', 'RPL', 5), ('sales_order', 'SO', 5),
    ('dispatch_order', 'DSP', 5), ('picking_list', 'PCK', 5), ('delivery_note', 'DN', 5),
    ('driver_trip', 'TRIP', 5), ('customer_return', 'RET', 5), ('customer_complaint', 'CMP', 5)
) as seq(document_key, prefix, padding)
on conflict (company_id, document_key) do nothing;

insert into public.sales_distribution_settings (tenant_id)
select id from public.companies
on conflict (tenant_id) do nothing;

create or replace function private.apply_sales_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'field_visits' and (new.visit_number is null or new.visit_number = '') then
    new.visit_number := private.next_document_number(new.tenant_id, 'field_visit');
  elsif tg_table_name = 'route_plans' and (new.route_plan_number is null or new.route_plan_number = '') then
    new.route_plan_number := private.next_document_number(new.tenant_id, 'route_plan');
  elsif tg_table_name = 'sales_orders' and (new.sales_order_number is null or new.sales_order_number = '') then
    new.sales_order_number := private.next_document_number(new.tenant_id, 'sales_order');
  elsif tg_table_name = 'dispatch_orders' and (new.dispatch_number is null or new.dispatch_number = '') then
    new.dispatch_number := private.next_document_number(new.tenant_id, 'dispatch_order');
  elsif tg_table_name = 'picking_lists' and (new.picking_number is null or new.picking_number = '') then
    new.picking_number := private.next_document_number(new.tenant_id, 'picking_list');
  elsif tg_table_name = 'delivery_notes' and (new.delivery_note_number is null or new.delivery_note_number = '') then
    new.delivery_note_number := private.next_document_number(new.tenant_id, 'delivery_note');
  elsif tg_table_name = 'driver_trips' and (new.trip_number is null or new.trip_number = '') then
    new.trip_number := private.next_document_number(new.tenant_id, 'driver_trip');
  elsif tg_table_name = 'customer_returns' and (new.return_number is null or new.return_number = '') then
    new.return_number := private.next_document_number(new.tenant_id, 'customer_return');
  elsif tg_table_name = 'customer_complaints' and (new.complaint_number is null or new.complaint_number = '') then
    new.complaint_number := private.next_document_number(new.tenant_id, 'customer_complaint');
  end if;
  return new;
end;
$$;

create trigger touch_sales_distribution_settings_updated_at before update on public.sales_distribution_settings for each row execute function private.touch_updated_at();
create trigger touch_field_visits_updated_at before update on public.field_visits for each row execute function private.touch_updated_at();
create trigger touch_field_visit_evidence_updated_at before update on public.field_visit_evidence for each row execute function private.touch_updated_at();
create trigger touch_route_plans_updated_at before update on public.route_plans for each row execute function private.touch_updated_at();
create trigger touch_route_plan_customers_updated_at before update on public.route_plan_customers for each row execute function private.touch_updated_at();
create trigger touch_sales_orders_updated_at before update on public.sales_orders for each row execute function private.touch_updated_at();
create trigger touch_sales_order_lines_updated_at before update on public.sales_order_lines for each row execute function private.touch_updated_at();
create trigger touch_sales_order_stock_reservations_updated_at before update on public.sales_order_stock_reservations for each row execute function private.touch_updated_at();
create trigger touch_customer_credit_checks_updated_at before update on public.customer_credit_checks for each row execute function private.touch_updated_at();
create trigger touch_dispatch_orders_updated_at before update on public.dispatch_orders for each row execute function private.touch_updated_at();
create trigger touch_dispatch_order_lines_updated_at before update on public.dispatch_order_lines for each row execute function private.touch_updated_at();
create trigger touch_picking_lists_updated_at before update on public.picking_lists for each row execute function private.touch_updated_at();
create trigger touch_picking_list_lines_updated_at before update on public.picking_list_lines for each row execute function private.touch_updated_at();
create trigger touch_delivery_notes_updated_at before update on public.delivery_notes for each row execute function private.touch_updated_at();
create trigger touch_delivery_note_lines_updated_at before update on public.delivery_note_lines for each row execute function private.touch_updated_at();
create trigger touch_driver_trips_updated_at before update on public.driver_trips for each row execute function private.touch_updated_at();
create trigger touch_driver_trip_locations_updated_at before update on public.driver_trip_locations for each row execute function private.touch_updated_at();
create trigger touch_delivery_confirmations_updated_at before update on public.delivery_confirmations for each row execute function private.touch_updated_at();
create trigger touch_failed_deliveries_updated_at before update on public.failed_deliveries for each row execute function private.touch_updated_at();
create trigger touch_customer_returns_updated_at before update on public.customer_returns for each row execute function private.touch_updated_at();
create trigger touch_customer_return_lines_updated_at before update on public.customer_return_lines for each row execute function private.touch_updated_at();
create trigger touch_customer_complaints_updated_at before update on public.customer_complaints for each row execute function private.touch_updated_at();
create trigger touch_customer_portal_users_updated_at before update on public.customer_portal_users for each row execute function private.touch_updated_at();

create trigger apply_visit_number before insert on public.field_visits for each row execute function private.apply_sales_number();
create trigger apply_route_plan_number before insert on public.route_plans for each row execute function private.apply_sales_number();
create trigger apply_sales_order_number before insert on public.sales_orders for each row execute function private.apply_sales_number();
create trigger apply_dispatch_number before insert on public.dispatch_orders for each row execute function private.apply_sales_number();
create trigger apply_picking_number before insert on public.picking_lists for each row execute function private.apply_sales_number();
create trigger apply_delivery_note_number before insert on public.delivery_notes for each row execute function private.apply_sales_number();
create trigger apply_trip_number before insert on public.driver_trips for each row execute function private.apply_sales_number();
create trigger apply_return_number before insert on public.customer_returns for each row execute function private.apply_sales_number();
create trigger apply_complaint_number before insert on public.customer_complaints for each row execute function private.apply_sales_number();

create index field_visits_lookup_idx on public.field_visits(tenant_id, sales_rep_id, customer_id, scheduled_date, status);
create index route_plans_lookup_idx on public.route_plans(tenant_id, sales_rep_id, plan_date, status);
create index sales_orders_lookup_idx on public.sales_orders(tenant_id, customer_id, sales_rep_id, order_date, status);
create index sales_order_lines_lookup_idx on public.sales_order_lines(tenant_id, sales_order_id, product_id);
create index reservations_lookup_idx on public.sales_order_stock_reservations(tenant_id, sales_order_id, product_id, status);
create index dispatch_lookup_idx on public.dispatch_orders(tenant_id, sales_order_id, driver_id, dispatch_date, status);
create index delivery_notes_lookup_idx on public.delivery_notes(tenant_id, sales_order_id, customer_id, delivery_date, status);
create index driver_trip_locations_lookup_idx on public.driver_trip_locations(tenant_id, driver_trip_id, recorded_at desc);
create index customer_returns_lookup_idx on public.customer_returns(tenant_id, customer_id, return_date, status);
create index complaints_lookup_idx on public.customer_complaints(tenant_id, customer_id, status, created_at desc);

alter table public.sales_distribution_settings enable row level security;
alter table public.field_visits enable row level security;
alter table public.field_visit_evidence enable row level security;
alter table public.route_plans enable row level security;
alter table public.route_plan_customers enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_lines enable row level security;
alter table public.sales_order_stock_reservations enable row level security;
alter table public.customer_credit_checks enable row level security;
alter table public.dispatch_orders enable row level security;
alter table public.dispatch_order_lines enable row level security;
alter table public.picking_lists enable row level security;
alter table public.picking_list_lines enable row level security;
alter table public.delivery_notes enable row level security;
alter table public.delivery_note_lines enable row level security;
alter table public.driver_trips enable row level security;
alter table public.driver_trip_locations enable row level security;
alter table public.delivery_confirmations enable row level security;
alter table public.failed_deliveries enable row level security;
alter table public.customer_returns enable row level security;
alter table public.customer_return_lines enable row level security;
alter table public.customer_complaints enable row level security;
alter table public.customer_portal_users enable row level security;

create policy tenant_all_sales_distribution_settings on public.sales_distribution_settings for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_field_visits on public.field_visits for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_field_visit_evidence on public.field_visit_evidence for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_route_plans on public.route_plans for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_route_plan_customers on public.route_plan_customers for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_sales_orders on public.sales_orders for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_sales_order_lines on public.sales_order_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_sales_order_stock_reservations on public.sales_order_stock_reservations for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_credit_checks on public.customer_credit_checks for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_dispatch_orders on public.dispatch_orders for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_dispatch_order_lines on public.dispatch_order_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_picking_lists on public.picking_lists for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_picking_list_lines on public.picking_list_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_delivery_notes on public.delivery_notes for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_delivery_note_lines on public.delivery_note_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_driver_trips on public.driver_trips for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_driver_trip_locations on public.driver_trip_locations for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_delivery_confirmations on public.delivery_confirmations for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_failed_deliveries on public.failed_deliveries for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_returns on public.customer_returns for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_return_lines on public.customer_return_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_complaints on public.customer_complaints for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_customer_portal_users on public.customer_portal_users for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into public.permissions (module_key, page_key, action_key, description)
select module_key, page_key, action_key, concat(action_key, ' ', page_key)
from (
  values
    ('sales_distribution', 'dashboard'), ('sales_distribution', 'field_visits'), ('sales_distribution', 'customer_routes'),
    ('sales_distribution', 'sales_orders'), ('sales_distribution', 'dispatch_orders'), ('sales_distribution', 'delivery_notes'),
    ('sales_distribution', 'driver_app'), ('sales_distribution', 'delivery_confirmation'), ('sales_distribution', 'customer_returns'),
    ('sales_distribution', 'customer_complaints'), ('sales_distribution', 'customer_portal'), ('sales_distribution', 'sales_rep_performance'),
    ('sales_distribution', 'route_performance'), ('sales_distribution', 'reports'), ('sales_distribution', 'settings')
) pages(module_key, page_key)
cross join (
  values ('view'), ('create'), ('edit'), ('delete'), ('approve'), ('reject'), ('export'), ('print'), ('administer'),
         ('submit'), ('reserve'), ('pick'), ('pack'), ('load'), ('dispatch'), ('confirm'), ('fail'), ('return'), ('track')
) actions(action_key)
on conflict do nothing;

insert into public.roles (role_name, role_key, description, is_system_role, is_global_role)
values
  ('Quality Officer', 'quality_officer', 'Quality user for inspection and release decisions.', true, false),
  ('Production Supervisor', 'production_supervisor', 'Factory floor supervisor for assigned production work.', true, false)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where p.module_key = 'sales_distribution'
  and (
    r.role_key in ('super_admin', 'solva_team', 'full_access', 'operations_manager', 'sales_manager')
    or (r.role_key in ('managing_director', 'company_ceo') and p.action_key in ('view', 'approve', 'reject', 'export', 'print'))
    or (r.role_key = 'sales_representative' and p.page_key in ('field_visits', 'customer_routes', 'sales_orders', 'delivery_notes', 'customer_complaints') and p.action_key in ('view', 'create', 'edit', 'submit', 'export', 'print'))
    or (r.role_key in ('warehouse_manager', 'warehouse_officer', 'dispatch_officer') and p.page_key in ('dispatch_orders', 'delivery_notes', 'delivery_confirmation', 'customer_returns', 'reports') and p.action_key in ('view', 'create', 'edit', 'pick', 'pack', 'load', 'dispatch', 'confirm', 'export', 'print'))
    or (r.role_key = 'driver' and p.page_key in ('driver_app', 'delivery_confirmation', 'customer_returns') and p.action_key in ('view', 'create', 'edit', 'track', 'confirm', 'fail', 'return'))
    or (r.role_key = 'finance_manager' and p.page_key in ('sales_orders', 'delivery_notes', 'customer_returns', 'reports') and p.action_key in ('view', 'approve', 'export', 'print'))
    or (r.role_key = 'customer' and p.page_key in ('customer_portal', 'delivery_confirmation', 'customer_complaints') and p.action_key in ('view', 'create', 'confirm'))
    or (r.role_key = 'auditor' and p.action_key in ('view', 'export', 'print'))
  )
on conflict do nothing;
