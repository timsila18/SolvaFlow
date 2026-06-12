create extension if not exists "pgcrypto";

create schema if not exists private;

create type public.company_status as enum ('Active', 'Inactive', 'Suspended');
create type public.record_status as enum ('Active', 'Inactive');
create type public.user_status as enum ('Active', 'Inactive', 'Suspended', 'Pending');
create type public.notification_channel as enum ('In-App', 'Email', 'SMS', 'Solco');
create type public.notification_status as enum ('Queued', 'Sent', 'Failed', 'Read');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_logo_url text,
  company_pin text,
  registration_number text,
  industry text not null,
  email text,
  phone text,
  address text,
  county text,
  country text not null default 'Kenya',
  website text,
  primary_contact_person text,
  business_type text,
  number_of_employees integer check (number_of_employees is null or number_of_employees >= 0),
  number_of_warehouses integer check (number_of_warehouses is null or number_of_warehouses >= 0),
  default_currency text not null default 'KES',
  financial_year_start date,
  financial_year_end date,
  timezone text not null default 'Africa/Nairobi',
  status public.company_status not null default 'Active',
  storage_bucket text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_branding (
  company_id uuid primary key references public.companies(id) on delete cascade,
  logo_url text,
  favicon_url text,
  primary_color text not null default '#0b5cff',
  secondary_color text not null default '#08111f',
  theme text not null default 'Light',
  report_header text,
  invoice_footer text,
  delivery_note_footer text,
  email_signature text,
  system_watermark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  role_name text not null,
  role_key text not null,
  description text,
  is_system_role boolean not null default false,
  is_global_role boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, role_key)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  page_key text not null,
  action_key text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (module_key, page_key, action_key)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  employee_number text,
  full_name text not null,
  email text not null,
  phone text,
  department text,
  designation text,
  role_id uuid references public.roles(id),
  status public.user_status not null default 'Pending',
  profile_photo_url text,
  assigned_territory_id uuid,
  assigned_warehouse_id uuid,
  assigned_vehicle_id uuid,
  force_password_change boolean not null default false,
  mfa_enabled boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_number)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_name text not null,
  description text,
  status public.record_status not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, category_name)
);

create table public.units_of_measure (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_name text not null,
  symbol text not null,
  base_unit_name text,
  conversion_factor numeric(18,6),
  status public.record_status not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, unit_name),
  unique (company_id, symbol)
);

create table public.unit_conversions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  from_unit_id uuid not null references public.units_of_measure(id),
  to_unit_id uuid not null references public.units_of_measure(id),
  factor numeric(18,6) not null check (factor > 0),
  created_at timestamptz not null default now(),
  unique (company_id, from_unit_id, to_unit_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sku text,
  barcode text,
  product_name text not null,
  product_description text,
  brand text,
  category_id uuid references public.product_categories(id),
  unit_of_measure_id uuid references public.units_of_measure(id),
  pack_size text,
  selling_price numeric(18,2) default 0,
  cost_price numeric(18,2) default 0,
  tax_category text,
  minimum_stock numeric(18,3) default 0,
  maximum_stock numeric(18,3) default 0,
  reorder_level numeric(18,3) default 0,
  storage_type text,
  status public.record_status not null default 'Active',
  product_image_url text,
  track_expiry boolean not null default false,
  track_batch boolean not null default false,
  track_serial boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku),
  unique (company_id, barcode)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_code text,
  customer_name text not null,
  customer_type text not null,
  pin_number text,
  phone text,
  email text,
  physical_address text,
  county text,
  gps_coordinates text,
  credit_limit numeric(18,2) default 0,
  payment_terms text,
  assigned_sales_rep_id uuid references auth.users(id),
  status public.record_status not null default 'Active',
  customer_portal_access boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, customer_code)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_code text,
  supplier_name text not null,
  pin text,
  email text,
  phone text,
  address text,
  products_supplied text,
  payment_terms text,
  lead_time_days integer,
  status public.record_status not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, supplier_code)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_name text not null,
  code text,
  location text,
  gps_coordinates text,
  manager_id uuid references auth.users(id),
  warehouse_type text not null,
  status public.record_status not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.territories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  territory_name text not null,
  region text,
  assigned_sales_rep_id uuid references auth.users(id),
  customer_ids text,
  route_ids text,
  status public.record_status not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, territory_name)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vehicle_code text,
  registration_number text not null,
  vehicle_type text,
  capacity text,
  driver_id uuid references auth.users(id),
  insurance_expiry date,
  service_date date,
  status text not null default 'Available' check (status in ('Available', 'On Delivery', 'Maintenance', 'Inactive')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, vehicle_code),
  unique (company_id, registration_number)
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  route_name text not null,
  region text,
  territory_id uuid references public.territories(id),
  distance_km numeric(12,2),
  estimated_travel_time text,
  assigned_driver_id uuid references auth.users(id),
  assigned_sales_rep_id uuid references auth.users(id),
  status public.record_status not null default 'Active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, route_name)
);

alter table public.user_profiles
  add constraint user_profiles_assigned_territory_fk foreign key (assigned_territory_id) references public.territories(id),
  add constraint user_profiles_assigned_warehouse_fk foreign key (assigned_warehouse_id) references public.warehouses(id),
  add constraint user_profiles_assigned_vehicle_fk foreign key (assigned_vehicle_id) references public.vehicles(id);

create table public.numbering_sequences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_key text not null,
  prefix text not null,
  next_number bigint not null default 1,
  padding integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, document_key)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  module_key text not null,
  action_key text not null,
  table_name text,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  device text,
  location text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_user_id uuid references auth.users(id),
  channel public.notification_channel not null,
  event_key text not null,
  title text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'Queued',
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
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

create or replace function private.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.user_profiles where id = auth.uid() and status = 'Active' limit 1;
$$;

create or replace function private.is_solva_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.roles r on r.id = up.role_id
    where up.id = auth.uid()
      and up.status = 'Active'
      and r.role_key in ('super_admin', 'solva_team')
  );
$$;

create or replace function private.has_permission(module_name text, page_name text, action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_solva_admin() or exists (
    select 1
    from public.user_profiles up
    join public.role_permissions rp on rp.role_id = up.role_id
    join public.permissions p on p.id = rp.permission_id
    where up.id = auth.uid()
      and up.status = 'Active'
      and p.module_key = module_name
      and p.page_key = page_name
      and p.action_key = action_name
  );
$$;

create or replace function private.next_document_number(target_company_id uuid, target_document_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  sequence_row public.numbering_sequences%rowtype;
  generated_number text;
begin
  update public.numbering_sequences
    set next_number = next_number + 1,
        updated_at = now()
    where company_id = target_company_id
      and document_key = target_document_key
    returning * into sequence_row;

  if not found then
    raise exception 'Missing numbering sequence for %', target_document_key;
  end if;

  generated_number := sequence_row.prefix || '-' || lpad(sequence_row.next_number::text, sequence_row.padding, '0');
  return generated_number;
end;
$$;

create or replace function private.apply_document_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'customers' then
    if new.customer_code is null or new.customer_code = '' then
      new.customer_code := private.next_document_number(new.company_id, 'customer');
    end if;
  elsif tg_table_name = 'suppliers' then
    if new.supplier_code is null or new.supplier_code = '' then
      new.supplier_code := private.next_document_number(new.company_id, 'supplier');
    end if;
  elsif tg_table_name = 'warehouses' then
    if new.code is null or new.code = '' then
      new.code := private.next_document_number(new.company_id, 'warehouse');
    end if;
  elsif tg_table_name = 'vehicles' then
    if new.vehicle_code is null or new.vehicle_code = '' then
      new.vehicle_code := private.next_document_number(new.company_id, 'vehicle');
    end if;
  elsif tg_table_name = 'products' then
    if new.sku is null or new.sku = '' then
      new.sku := private.next_document_number(new.company_id, 'product');
    end if;
  end if;
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
  values (new.id, new.company_logo_url, '#0b5cff', '#08111f');

  insert into public.numbering_sequences (company_id, document_key, prefix, padding) values
    (new.id, 'customer', 'CUS', 5),
    (new.id, 'supplier', 'SUP', 5),
    (new.id, 'warehouse', 'WH', 5),
    (new.id, 'vehicle', 'VEH', 5),
    (new.id, 'product', 'PRD', 5);

  return new;
end;
$$;

create trigger touch_companies_updated_at before update on public.companies for each row execute function private.touch_updated_at();
create trigger touch_company_branding_updated_at before update on public.company_branding for each row execute function private.touch_updated_at();
create trigger touch_roles_updated_at before update on public.roles for each row execute function private.touch_updated_at();
create trigger touch_user_profiles_updated_at before update on public.user_profiles for each row execute function private.touch_updated_at();
create trigger touch_product_categories_updated_at before update on public.product_categories for each row execute function private.touch_updated_at();
create trigger touch_units_updated_at before update on public.units_of_measure for each row execute function private.touch_updated_at();
create trigger touch_products_updated_at before update on public.products for each row execute function private.touch_updated_at();
create trigger touch_customers_updated_at before update on public.customers for each row execute function private.touch_updated_at();
create trigger touch_suppliers_updated_at before update on public.suppliers for each row execute function private.touch_updated_at();
create trigger touch_warehouses_updated_at before update on public.warehouses for each row execute function private.touch_updated_at();
create trigger touch_territories_updated_at before update on public.territories for each row execute function private.touch_updated_at();
create trigger touch_vehicles_updated_at before update on public.vehicles for each row execute function private.touch_updated_at();
create trigger touch_routes_updated_at before update on public.routes for each row execute function private.touch_updated_at();
create trigger touch_numbering_updated_at before update on public.numbering_sequences for each row execute function private.touch_updated_at();

create trigger create_company_defaults after insert on public.companies for each row execute function private.create_company_defaults();
create trigger apply_customer_number before insert on public.customers for each row execute function private.apply_document_number();
create trigger apply_supplier_number before insert on public.suppliers for each row execute function private.apply_document_number();
create trigger apply_warehouse_number before insert on public.warehouses for each row execute function private.apply_document_number();
create trigger apply_vehicle_number before insert on public.vehicles for each row execute function private.apply_document_number();
create trigger apply_product_number before insert on public.products for each row execute function private.apply_document_number();

create index companies_status_idx on public.companies(status);
create index user_profiles_company_idx on public.user_profiles(company_id);
create index products_company_search_idx on public.products(company_id, product_name, sku);
create index customers_company_search_idx on public.customers(company_id, customer_name, customer_code);
create index suppliers_company_search_idx on public.suppliers(company_id, supplier_name, supplier_code);
create index warehouses_company_search_idx on public.warehouses(company_id, warehouse_name, code);
create index vehicles_company_search_idx on public.vehicles(company_id, registration_number, vehicle_code);
create index routes_company_search_idx on public.routes(company_id, route_name);
create index audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);
create index notifications_recipient_idx on public.notifications(company_id, recipient_user_id, created_at desc);

alter table public.companies enable row level security;
alter table public.company_branding enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.units_of_measure enable row level security;
alter table public.unit_conversions enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.warehouses enable row level security;
alter table public.territories enable row level security;
alter table public.vehicles enable row level security;
alter table public.routes enable row level security;
alter table public.numbering_sequences enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy companies_tenant_select on public.companies
  for select using (private.is_solva_admin() or id = private.current_company_id());
create policy companies_solva_manage on public.companies
  for all using (private.is_solva_admin()) with check (private.is_solva_admin());

create policy branding_tenant_select on public.company_branding
  for select using (private.is_solva_admin() or company_id = private.current_company_id());
create policy branding_tenant_update on public.company_branding
  for update using (private.is_solva_admin() or company_id = private.current_company_id())
  with check (private.is_solva_admin() or company_id = private.current_company_id());

create policy roles_tenant_read on public.roles
  for select using (private.is_solva_admin() or company_id = private.current_company_id() or is_global_role);
create policy roles_tenant_manage on public.roles
  for all using (private.is_solva_admin() or company_id = private.current_company_id())
  with check (private.is_solva_admin() or company_id = private.current_company_id());

create policy permissions_read_authenticated on public.permissions
  for select to authenticated using (true);
create policy permissions_solva_manage on public.permissions
  for all using (private.is_solva_admin()) with check (private.is_solva_admin());

create policy role_permissions_read on public.role_permissions
  for select using (
    private.is_solva_admin()
    or exists (select 1 from public.roles r where r.id = role_id and (r.company_id = private.current_company_id() or r.is_global_role))
  );
create policy role_permissions_manage on public.role_permissions
  for all using (
    private.is_solva_admin()
    or exists (select 1 from public.roles r where r.id = role_id and r.company_id = private.current_company_id())
  ) with check (
    private.is_solva_admin()
    or exists (select 1 from public.roles r where r.id = role_id and r.company_id = private.current_company_id())
  );

create policy user_profiles_read_tenant on public.user_profiles
  for select using (private.is_solva_admin() or id = auth.uid() or company_id = private.current_company_id());
create policy user_profiles_manage_tenant on public.user_profiles
  for all using (private.is_solva_admin() or company_id = private.current_company_id())
  with check (private.is_solva_admin() or company_id = private.current_company_id());

create policy tenant_select_product_categories on public.product_categories for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_product_categories on public.product_categories for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_units on public.units_of_measure for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_units on public.units_of_measure for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_unit_conversions on public.unit_conversions for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_unit_conversions on public.unit_conversions for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_products on public.products for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_products on public.products for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_customers on public.customers for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_customers on public.customers for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_suppliers on public.suppliers for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_suppliers on public.suppliers for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_warehouses on public.warehouses for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_warehouses on public.warehouses for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_territories on public.territories for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_territories on public.territories for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_vehicles on public.vehicles for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_vehicles on public.vehicles for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_select_routes on public.routes for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy tenant_modify_routes on public.routes for all using (company_id = private.current_company_id() or private.is_solva_admin()) with check (company_id = private.current_company_id() or private.is_solva_admin());

create policy numbering_tenant_read on public.numbering_sequences
  for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy audit_tenant_read on public.audit_logs
  for select using (company_id = private.current_company_id() or private.is_solva_admin());
create policy notifications_recipient_read on public.notifications
  for select using (private.is_solva_admin() or (company_id = private.current_company_id() and (recipient_user_id = auth.uid() or recipient_user_id is null)));
create policy notifications_recipient_update on public.notifications
  for update using (company_id = private.current_company_id() and recipient_user_id = auth.uid())
  with check (company_id = private.current_company_id() and recipient_user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.has_permission(text, text, text) to authenticated;

insert into public.permissions (module_key, page_key, action_key, description)
select module_key, page_key, action_key, concat(action_key, ' ', page_key)
from (
  values
    ('platform', 'companies'), ('platform', 'branding'), ('security', 'users'), ('security', 'roles'),
    ('master_data', 'products'), ('master_data', 'product_categories'), ('master_data', 'units_of_measure'),
    ('customers', 'customers'), ('procurement', 'suppliers'), ('warehousing', 'warehouses'),
    ('sales', 'territories'), ('fleet', 'vehicles'), ('distribution', 'routes'),
    ('audit', 'audit_logs'), ('notifications', 'notifications')
) pages(module_key, page_key)
cross join (
  values ('view'), ('create'), ('edit'), ('delete'), ('approve'), ('reject'), ('export'), ('print'), ('administer')
) actions(action_key)
on conflict do nothing;

insert into public.roles (role_name, role_key, description, is_system_role, is_global_role)
values
  ('Super Admin', 'super_admin', 'Solva platform owner with unrestricted access.', true, true),
  ('Solva Team', 'solva_team', 'Solva implementation and support team.', true, true),
  ('Full Access', 'full_access', 'Tenant administrator with all company permissions.', true, false),
  ('Managing Director', 'managing_director', 'Executive visibility and major approvals.', true, false),
  ('Company CEO', 'company_ceo', 'Executive visibility and approvals.', true, false),
  ('Operations Manager', 'operations_manager', 'Manufacturing and operations oversight.', true, false),
  ('Finance Manager', 'finance_manager', 'Finance, collections and reporting.', true, false),
  ('Production Manager', 'production_manager', 'Production planning and control.', true, false),
  ('Warehouse Manager', 'warehouse_manager', 'Inventory and warehouse control.', true, false),
  ('Sales Manager', 'sales_manager', 'Sales force and customer oversight.', true, false),
  ('Sales Representative', 'sales_representative', 'Field sales execution.', true, false),
  ('Dispatch Officer', 'dispatch_officer', 'Dispatch and logistics coordination.', true, false),
  ('Driver', 'driver', 'Delivery execution only.', true, false),
  ('Procurement Officer', 'procurement_officer', 'Purchasing and supplier management.', true, false),
  ('Customer', 'customer', 'Customer portal access.', true, false),
  ('Auditor', 'auditor', 'Read-only audit access.', true, false)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.role_key in ('super_admin', 'solva_team', 'full_access')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.role_key in ('auditor', 'managing_director', 'company_ceo')
  and p.action_key in ('view', 'export', 'print', 'approve', 'reject')
on conflict do nothing;
