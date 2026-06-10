create table public.production_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  line_name text not null,
  line_code text not null,
  product_category_id uuid references public.product_categories(id),
  capacity_per_hour numeric(18,3),
  supervisor_id uuid references auth.users(id),
  status text not null default 'Active' check (status in ('Active', 'Maintenance', 'Inactive')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, line_code)
);

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  machine_code text not null,
  machine_name text not null,
  production_line_id uuid references public.production_lines(id),
  category text,
  capacity text,
  last_service_date date,
  next_service_date date,
  status text not null default 'Active' check (status in ('Active', 'Maintenance', 'Inactive', 'Out of Service')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, machine_code)
);

create table public.manufacturing_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  batch_number_prefix text default 'BATCH',
  batch_number_pattern text not null default '{PRODUCT}-{YYYYMMDD}-{SEQ}',
  reserve_materials_on_approval boolean not null default true,
  deduct_materials_on_start boolean not null default false,
  require_qc_before_stock boolean not null default true,
  default_shelf_life_days integer,
  allow_shortage_override boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  recipe_code text not null,
  finished_product_id uuid not null references public.products(id),
  recipe_name text not null,
  description text,
  status text not null default 'Draft' check (status in ('Draft', 'Submitted for Approval', 'Approved', 'Active', 'Inactive', 'Archived')),
  current_version_id uuid,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, recipe_code)
);

create table public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  finished_product_id uuid not null references public.products(id),
  version_number integer not null,
  recipe_name text not null,
  description text,
  output_quantity numeric(18,3) not null check (output_quantity > 0),
  output_unit_of_measure_id uuid references public.units_of_measure(id),
  production_yield_percentage numeric(8,3) not null default 100,
  standard_production_time_minutes integer,
  total_raw_material_cost numeric(18,2) not null default 0,
  total_packaging_cost numeric(18,2) not null default 0,
  total_consumable_cost numeric(18,2) not null default 0,
  expected_cost_per_output_unit numeric(18,4) not null default 0,
  expected_gross_margin numeric(18,4) not null default 0,
  status text not null default 'Draft' check (status in ('Draft', 'Submitted for Approval', 'Approved', 'Active', 'Inactive', 'Archived')),
  effective_date date,
  expiry_date date,
  approved_by uuid references auth.users(id),
  approval_date timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, recipe_id, version_number)
);

alter table public.recipes
  add constraint recipes_current_version_fk foreign key (current_version_id) references public.recipe_versions(id);

create unique index recipe_versions_one_active_per_product
  on public.recipe_versions (tenant_id, finished_product_id)
  where status = 'Active';

create table public.recipe_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  recipe_version_id uuid not null references public.recipe_versions(id) on delete cascade,
  input_item_id uuid not null references public.products(id),
  item_type text not null check (item_type in ('Raw Material', 'Packaging', 'Semi-Finished Good', 'Consumable')),
  quantity_required numeric(18,6) not null check (quantity_required >= 0),
  unit_of_measure_id uuid references public.units_of_measure(id),
  unit_cost numeric(18,4) not null default 0,
  total_cost numeric(18,4) generated always as (quantity_required * unit_cost) stored,
  wastage_allowance_percentage numeric(8,3) not null default 0,
  required_stage text,
  is_mandatory boolean not null default true,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.production_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  plan_number text not null,
  product_id uuid not null references public.products(id),
  recipe_version_id uuid references public.recipe_versions(id),
  quantity_required numeric(18,3) not null check (quantity_required > 0),
  planned_production_date date not null,
  required_completion_date date,
  production_line_id uuid references public.production_lines(id),
  assigned_supervisor_id uuid references auth.users(id),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  expected_production_cost numeric(18,2) not null default 0,
  expected_finished_goods_output numeric(18,3) not null default 0,
  status text not null default 'Draft' check (status in ('Draft', 'Planned', 'Submitted for Approval', 'Approved', 'Converted', 'Cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, plan_number)
);

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  production_order_number text not null,
  production_plan_id uuid references public.production_plans(id),
  finished_product_id uuid not null references public.products(id),
  recipe_version_id uuid not null references public.recipe_versions(id),
  planned_quantity numeric(18,3) not null check (planned_quantity > 0),
  actual_quantity numeric(18,3),
  unit_of_measure_id uuid references public.units_of_measure(id),
  production_date date not null,
  expected_completion_date date,
  assigned_supervisor_id uuid references auth.users(id),
  production_line_id uuid references public.production_lines(id),
  machine_id uuid references public.machines(id),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  status text not null default 'Draft' check (status in ('Draft', 'Planned', 'Approved', 'Materials Reserved', 'In Production', 'Quality Check', 'Completed', 'Closed', 'Cancelled')),
  start_time timestamptz,
  completion_time timestamptz,
  staff_involved text,
  notes text,
  planned_material_cost numeric(18,2) not null default 0,
  actual_material_cost numeric(18,2) not null default 0,
  labour_cost_placeholder numeric(18,2) not null default 0,
  overhead_cost_placeholder numeric(18,2) not null default 0,
  packaging_cost numeric(18,2) not null default 0,
  wastage_cost numeric(18,2) not null default 0,
  total_production_cost numeric(18,2) not null default 0,
  cost_per_unit numeric(18,4) not null default 0,
  expected_margin numeric(18,4) not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, production_order_number)
);

create table public.production_material_reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  item_id uuid not null references public.products(id),
  source_warehouse_id uuid references public.warehouses(id),
  required_quantity numeric(18,6) not null default 0,
  reserved_quantity numeric(18,6) not null default 0,
  available_quantity_snapshot numeric(18,6) not null default 0,
  shortage_quantity numeric(18,6) not null default 0,
  unit_of_measure_id uuid references public.units_of_measure(id),
  status text not null default 'Reserved' check (status in ('Pending', 'Reserved', 'Issued', 'Released', 'Shortage')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.production_material_issues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  issue_number text not null,
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  source_warehouse_id uuid references public.warehouses(id),
  destination text not null default 'Production Floor',
  item_id uuid not null references public.products(id),
  quantity_issued numeric(18,6) not null check (quantity_issued > 0),
  unit_of_measure_id uuid references public.units_of_measure(id),
  issued_by uuid references auth.users(id),
  received_by uuid references auth.users(id),
  issued_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, issue_number)
);

create table public.production_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  batch_number text not null,
  product_id uuid not null references public.products(id),
  production_order_id uuid not null references public.production_orders(id),
  recipe_version_id uuid not null references public.recipe_versions(id),
  production_date date not null,
  expiry_date date,
  shelf_life_days integer,
  quantity_produced numeric(18,3) not null default 0,
  quantity_available numeric(18,3) not null default 0,
  quality_status text not null default 'Pending' check (quality_status in ('Pending', 'Approved for Stock', 'Hold', 'Rework Required', 'Rejected', 'Disposed')),
  warehouse_id uuid references public.warehouses(id),
  supervisor_id uuid references auth.users(id),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, batch_number)
);

create table public.product_quality_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  product_category_id uuid references public.product_categories(id),
  product_id uuid references public.products(id),
  template_name text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quality_check_parameters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.product_quality_templates(id) on delete cascade,
  parameter_name text not null,
  parameter_type text not null default 'Text' check (parameter_type in ('Text', 'Number', 'Pass/Fail', 'Temperature', 'Percentage')),
  target_value text,
  min_value numeric(18,4),
  max_value numeric(18,4),
  is_required boolean not null default true,
  display_order integer not null default 1,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  qc_number text not null,
  production_order_id uuid references public.production_orders(id),
  batch_id uuid references public.production_batches(id),
  product_id uuid references public.products(id),
  inspection_type text not null check (inspection_type in ('Before Production', 'During Production', 'After Production', 'Before Dispatch')),
  inspection_date timestamptz not null default now(),
  inspector_id uuid references auth.users(id),
  parameters_checked jsonb not null default '[]'::jsonb,
  result text not null default 'Pass' check (result in ('Pass', 'Fail', 'Conditional Pass')),
  decision text not null default 'Approved for Stock' check (decision in ('Approved for Stock', 'Hold', 'Rework Required', 'Rejected', 'Disposed')),
  corrective_action text,
  comments text,
  attachment_urls text,
  approved_by uuid references auth.users(id),
  status text not null default 'Completed' check (status in ('Draft', 'Completed', 'Approved', 'Rejected')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, qc_number)
);

create table public.wastage_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.companies(id) on delete cascade,
  production_order_id uuid not null references public.production_orders(id),
  item_id uuid not null references public.products(id),
  expected_quantity numeric(18,6) not null default 0,
  actual_quantity_used numeric(18,6) not null default 0,
  wastage_quantity numeric(18,6) not null default 0,
  wastage_percentage numeric(8,3) not null default 0,
  wastage_reason text not null check (wastage_reason in ('Spillage', 'Machine loss', 'Overuse', 'Damaged packaging', 'Expired raw material', 'Quality failure', 'Human error', 'Other')),
  responsible_department text,
  notes text,
  wastage_cost numeric(18,2) not null default 0,
  status text not null default 'Recorded' check (status in ('Recorded', 'Reviewed', 'Approved')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
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
    (new.id, 'customer', 'CUS', 5),
    (new.id, 'supplier', 'SUP', 5),
    (new.id, 'warehouse', 'WH', 5),
    (new.id, 'vehicle', 'VEH', 5),
    (new.id, 'product', 'PRD', 5),
    (new.id, 'recipe', 'REC', 5),
    (new.id, 'production_plan', 'PLAN', 5),
    (new.id, 'production_order', 'PO', 5),
    (new.id, 'material_issue', 'MI', 5),
    (new.id, 'quality_check', 'QC', 5),
    (new.id, 'batch', 'BATCH', 3)
  on conflict (company_id, document_key) do nothing;

  insert into public.manufacturing_settings (tenant_id)
  values (new.id)
  on conflict (tenant_id) do nothing;

  return new;
end;
$$;

insert into public.numbering_sequences (company_id, document_key, prefix, padding)
select c.id, seq.document_key, seq.prefix, seq.padding
from public.companies c
cross join (
  values
    ('recipe', 'REC', 5),
    ('production_plan', 'PLAN', 5),
    ('production_order', 'PO', 5),
    ('material_issue', 'MI', 5),
    ('quality_check', 'QC', 5),
    ('batch', 'BATCH', 3)
) as seq(document_key, prefix, padding)
on conflict (company_id, document_key) do nothing;

insert into public.manufacturing_settings (tenant_id)
select id from public.companies
on conflict (tenant_id) do nothing;

create or replace function private.apply_manufacturing_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'recipes' and (new.recipe_code is null or new.recipe_code = '') then
    new.recipe_code := private.next_document_number(new.tenant_id, 'recipe');
  elsif tg_table_name = 'production_plans' and (new.plan_number is null or new.plan_number = '') then
    new.plan_number := private.next_document_number(new.tenant_id, 'production_plan');
  elsif tg_table_name = 'production_orders' and (new.production_order_number is null or new.production_order_number = '') then
    new.production_order_number := private.next_document_number(new.tenant_id, 'production_order');
  elsif tg_table_name = 'production_material_issues' and (new.issue_number is null or new.issue_number = '') then
    new.issue_number := private.next_document_number(new.tenant_id, 'material_issue');
  elsif tg_table_name = 'quality_checks' and (new.qc_number is null or new.qc_number = '') then
    new.qc_number := private.next_document_number(new.tenant_id, 'quality_check');
  end if;
  return new;
end;
$$;

create or replace function private.apply_batch_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_code text;
  sequence_number text;
begin
  if new.batch_number is not null and new.batch_number <> '' then
    return new;
  end if;

  select coalesce(nullif(sku, ''), 'FG') into product_code
  from public.products
  where id = new.product_id;

  sequence_number := split_part(private.next_document_number(new.tenant_id, 'batch'), '-', 2);
  new.batch_number := upper(regexp_replace(product_code, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || to_char(coalesce(new.production_date, current_date), 'YYYYMMDD') || '-' || sequence_number;
  return new;
end;
$$;

create or replace function private.refresh_recipe_costs(target_recipe_version_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  output_qty numeric(18,3);
  selling numeric(18,2);
begin
  select rv.output_quantity, coalesce(p.selling_price, 0)
  into output_qty, selling
  from public.recipe_versions rv
  join public.products p on p.id = rv.finished_product_id
  where rv.id = target_recipe_version_id;

  update public.recipe_versions rv
  set
    total_raw_material_cost = coalesce((select sum(total_cost) from public.recipe_lines where recipe_version_id = target_recipe_version_id and item_type = 'Raw Material'), 0),
    total_packaging_cost = coalesce((select sum(total_cost) from public.recipe_lines where recipe_version_id = target_recipe_version_id and item_type = 'Packaging'), 0),
    total_consumable_cost = coalesce((select sum(total_cost) from public.recipe_lines where recipe_version_id = target_recipe_version_id and item_type = 'Consumable'), 0),
    expected_cost_per_output_unit = case when output_qty > 0 then coalesce((select sum(total_cost) from public.recipe_lines where recipe_version_id = target_recipe_version_id), 0) / output_qty else 0 end,
    expected_gross_margin = selling - case when output_qty > 0 then coalesce((select sum(total_cost) from public.recipe_lines where recipe_version_id = target_recipe_version_id), 0) / output_qty else 0 end,
    updated_at = now()
  where rv.id = target_recipe_version_id;
end;
$$;

create or replace function private.refresh_recipe_costs_from_line()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.refresh_recipe_costs(coalesce(new.recipe_version_id, old.recipe_version_id));
  return coalesce(new, old);
end;
$$;

create or replace function private.prevent_approved_recipe_version_edit()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('Approved', 'Active') and new.status = old.status and to_jsonb(new) - 'updated_at' - 'updated_by' <> to_jsonb(old) - 'updated_at' - 'updated_by' then
    raise exception 'Approved or active recipe versions cannot be edited directly. Create a new version.';
  end if;
  return new;
end;
$$;

create trigger touch_production_lines_updated_at before update on public.production_lines for each row execute function private.touch_updated_at();
create trigger touch_machines_updated_at before update on public.machines for each row execute function private.touch_updated_at();
create trigger touch_manufacturing_settings_updated_at before update on public.manufacturing_settings for each row execute function private.touch_updated_at();
create trigger touch_recipes_updated_at before update on public.recipes for each row execute function private.touch_updated_at();
create trigger touch_recipe_versions_updated_at before update on public.recipe_versions for each row execute function private.touch_updated_at();
create trigger touch_recipe_lines_updated_at before update on public.recipe_lines for each row execute function private.touch_updated_at();
create trigger touch_production_plans_updated_at before update on public.production_plans for each row execute function private.touch_updated_at();
create trigger touch_production_orders_updated_at before update on public.production_orders for each row execute function private.touch_updated_at();
create trigger touch_production_material_reservations_updated_at before update on public.production_material_reservations for each row execute function private.touch_updated_at();
create trigger touch_production_material_issues_updated_at before update on public.production_material_issues for each row execute function private.touch_updated_at();
create trigger touch_production_batches_updated_at before update on public.production_batches for each row execute function private.touch_updated_at();
create trigger touch_product_quality_templates_updated_at before update on public.product_quality_templates for each row execute function private.touch_updated_at();
create trigger touch_quality_check_parameters_updated_at before update on public.quality_check_parameters for each row execute function private.touch_updated_at();
create trigger touch_quality_checks_updated_at before update on public.quality_checks for each row execute function private.touch_updated_at();
create trigger touch_wastage_records_updated_at before update on public.wastage_records for each row execute function private.touch_updated_at();

create trigger apply_recipe_number before insert on public.recipes for each row execute function private.apply_manufacturing_number();
create trigger apply_plan_number before insert on public.production_plans for each row execute function private.apply_manufacturing_number();
create trigger apply_order_number before insert on public.production_orders for each row execute function private.apply_manufacturing_number();
create trigger apply_issue_number before insert on public.production_material_issues for each row execute function private.apply_manufacturing_number();
create trigger apply_qc_number before insert on public.quality_checks for each row execute function private.apply_manufacturing_number();
create trigger apply_batch_number before insert on public.production_batches for each row execute function private.apply_batch_number();
create trigger refresh_recipe_costs_after_line_change after insert or update or delete on public.recipe_lines for each row execute function private.refresh_recipe_costs_from_line();
create trigger prevent_approved_recipe_version_edit before update on public.recipe_versions for each row execute function private.prevent_approved_recipe_version_edit();

create index production_lines_tenant_idx on public.production_lines(tenant_id);
create index machines_tenant_idx on public.machines(tenant_id);
create index recipes_tenant_product_idx on public.recipes(tenant_id, finished_product_id);
create index recipe_versions_tenant_status_idx on public.recipe_versions(tenant_id, status);
create index recipe_lines_version_idx on public.recipe_lines(recipe_version_id);
create index production_plans_tenant_date_idx on public.production_plans(tenant_id, planned_production_date desc);
create index production_orders_tenant_status_idx on public.production_orders(tenant_id, status, production_date desc);
create index material_reservations_order_idx on public.production_material_reservations(production_order_id);
create index material_issues_order_idx on public.production_material_issues(production_order_id);
create index production_batches_expiry_idx on public.production_batches(tenant_id, expiry_date, quality_status);
create index quality_checks_tenant_date_idx on public.quality_checks(tenant_id, inspection_date desc);
create index wastage_records_order_idx on public.wastage_records(production_order_id);

alter table public.production_lines enable row level security;
alter table public.machines enable row level security;
alter table public.manufacturing_settings enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_versions enable row level security;
alter table public.recipe_lines enable row level security;
alter table public.production_plans enable row level security;
alter table public.production_orders enable row level security;
alter table public.production_material_reservations enable row level security;
alter table public.production_material_issues enable row level security;
alter table public.production_batches enable row level security;
alter table public.product_quality_templates enable row level security;
alter table public.quality_check_parameters enable row level security;
alter table public.quality_checks enable row level security;
alter table public.wastage_records enable row level security;

create policy tenant_all_production_lines on public.production_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_machines on public.machines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_manufacturing_settings on public.manufacturing_settings for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_recipes on public.recipes for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_recipe_versions on public.recipe_versions for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_recipe_lines on public.recipe_lines for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_production_plans on public.production_plans for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_production_orders on public.production_orders for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_material_reservations on public.production_material_reservations for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_material_issues on public.production_material_issues for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_batches on public.production_batches for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_quality_templates on public.product_quality_templates for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_quality_parameters on public.quality_check_parameters for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_quality_checks on public.quality_checks for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_all_wastage_records on public.wastage_records for all using (tenant_id = private.current_company_id() or private.is_solva_admin()) with check (tenant_id = private.current_company_id() or private.is_solva_admin());

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into public.permissions (module_key, page_key, action_key, description)
select module_key, page_key, action_key, concat(action_key, ' ', page_key)
from (
  values
    ('manufacturing', 'dashboard'),
    ('manufacturing', 'recipes'),
    ('manufacturing', 'production_planning'),
    ('manufacturing', 'production_orders'),
    ('manufacturing', 'batch_management'),
    ('manufacturing', 'quality_control'),
    ('manufacturing', 'wastage_variance'),
    ('manufacturing', 'reports'),
    ('manufacturing', 'settings'),
    ('manufacturing', 'production_lines'),
    ('manufacturing', 'machines')
) pages(module_key, page_key)
cross join (
  values ('view'), ('create'), ('edit'), ('delete'), ('approve'), ('reject'), ('export'), ('print'), ('administer'), ('override_shortage'), ('start'), ('complete'), ('issue_materials')
) actions(action_key)
on conflict do nothing;

insert into public.roles (role_name, role_key, description, is_system_role, is_global_role)
values
  ('Production Supervisor', 'production_supervisor', 'Factory floor production execution.', true, false),
  ('Quality Officer', 'quality_officer', 'Quality inspection and QC decisions.', true, false)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where p.module_key = 'manufacturing'
  and (
    r.role_key in ('super_admin', 'solva_team', 'full_access', 'operations_manager')
    or (r.role_key in ('managing_director', 'company_ceo') and p.action_key in ('view', 'approve', 'reject', 'export', 'print'))
    or (r.role_key = 'production_manager' and p.action_key in ('view', 'create', 'edit', 'approve', 'start', 'complete', 'issue_materials', 'export', 'print'))
    or (r.role_key = 'production_supervisor' and p.page_key in ('production_orders', 'quality_control', 'wastage_variance') and p.action_key in ('view', 'start', 'complete', 'issue_materials', 'create'))
    or (r.role_key = 'warehouse_manager' and p.action_key in ('view', 'issue_materials'))
    or (r.role_key = 'quality_officer' and p.page_key in ('quality_control', 'batch_management') and p.action_key in ('view', 'create', 'edit', 'approve', 'reject'))
    or (r.role_key = 'finance_manager' and p.page_key = 'reports' and p.action_key in ('view', 'export', 'print'))
    or (r.role_key = 'auditor' and p.action_key in ('view', 'export', 'print'))
  )
on conflict do nothing;
