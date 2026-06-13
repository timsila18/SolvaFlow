do $$
declare
  v_company_id uuid;
  v_fg_warehouse_id uuid;
  v_dispatch_warehouse_id uuid;
  v_driver_1 uuid;
  v_driver_2 uuid;
  v_sales_rep_1 uuid;
  v_sales_rep_2 uuid;
  v_price_list_id uuid;
  v_opening_balance_id uuid;
begin
  select id into v_company_id
  from public.companies
  where company_name = 'Safa Dairy Ltd'
  limit 1;

  if v_company_id is null then
    raise exception 'Safa Dairy Ltd tenant was not found.';
  end if;

  select id into v_fg_warehouse_id
  from public.warehouses
  where company_id = v_company_id and code = 'FG-WH'
  limit 1;

  select id into v_dispatch_warehouse_id
  from public.warehouses
  where company_id = v_company_id and code = 'DSP-WH'
  limit 1;

  select id into v_driver_1
  from public.user_profiles
  where company_id = v_company_id and designation ilike '%driver%'
  order by full_name
  limit 1;

  select id into v_driver_2
  from public.user_profiles
  where company_id = v_company_id and designation ilike '%driver%'
  order by full_name
  offset 1 limit 1;

  select id into v_sales_rep_1
  from public.user_profiles
  where company_id = v_company_id and designation ilike '%sales%'
  order by full_name
  limit 1;

  select id into v_sales_rep_2
  from public.user_profiles
  where company_id = v_company_id and designation ilike '%sales%'
  order by full_name
  offset 1 limit 1;

  insert into public.customers (
    company_id, customer_code, customer_name, customer_type, pin_number, phone, email,
    physical_address, county, gps_coordinates, credit_limit, payment_terms, assigned_sales_rep_id,
    status, customer_portal_access
  )
  values
    (v_company_id, 'CUS-NAK-001', 'Naivas Supermarket - Westlands', 'Supermarket', null, '+254700100001', 'westlands@naivas.example', 'Westlands, Nairobi', 'Nairobi', '-1.2640,36.8028', 500000, 'Net 30', v_sales_rep_1, 'Active', true),
    (v_company_id, 'CUS-QUI-001', 'Quickmart - Kilimani', 'Supermarket', null, '+254700100002', 'kilimani@quickmart.example', 'Kilimani, Nairobi', 'Nairobi', '-1.2921,36.7820', 400000, 'Net 30', v_sales_rep_1, 'Active', true),
    (v_company_id, 'CUS-EAS-001', 'Eastleigh Wholesale Traders', 'Wholesaler', null, '+254700100003', 'orders@eastleighwholesale.example', 'Eastleigh, Nairobi', 'Nairobi', '-1.2773,36.8497', 300000, 'Net 14', v_sales_rep_1, 'Active', false),
    (v_company_id, 'CUS-MAC-001', 'Machakos Distributor Hub', 'Distributor', null, '+254700100004', 'sales@machakoshub.example', 'Machakos Town', 'Machakos', '-1.5177,37.2634', 600000, 'Net 21', v_sales_rep_2, 'Active', true),
    (v_company_id, 'CUS-NAK-002', 'Nakuru Retail Supplies', 'Retailer', null, '+254700100005', 'orders@nakururetail.example', 'Nakuru CBD', 'Nakuru', '-0.3031,36.0800', 150000, 'Net 14', v_sales_rep_2, 'Active', false),
    (v_company_id, 'CUS-KIS-001', 'Kisumu Lakeside Stores', 'Retailer', null, '+254700100006', 'orders@lakesidestores.example', 'Kisumu CBD', 'Kisumu', '-0.0917,34.7680', 180000, 'Net 14', v_sales_rep_2, 'Active', false),
    (v_company_id, 'CUS-MOM-001', 'Mombasa Coastal Distributor', 'Distributor', null, '+254700100007', 'orders@coastaldistributor.example', 'Mombasa Island', 'Mombasa', '-4.0435,39.6682', 700000, 'Net 21', v_sales_rep_2, 'Active', true),
    (v_company_id, 'CUS-INS-001', 'Safa Staff Canteen', 'Institution', null, '+254700100008', 'canteen@safadairy.example', 'Safa Dairy Ltd Headquarters', 'Nairobi', '-1.2864,36.8172', 50000, 'Cash', v_sales_rep_1, 'Active', false)
  on conflict (company_id, customer_code) do update
  set customer_name = excluded.customer_name,
      customer_type = excluded.customer_type,
      phone = excluded.phone,
      email = excluded.email,
      physical_address = excluded.physical_address,
      county = excluded.county,
      gps_coordinates = excluded.gps_coordinates,
      credit_limit = excluded.credit_limit,
      payment_terms = excluded.payment_terms,
      assigned_sales_rep_id = excluded.assigned_sales_rep_id,
      status = excluded.status,
      customer_portal_access = excluded.customer_portal_access,
      updated_at = now();

  insert into public.vehicles (
    company_id, vehicle_code, registration_number, vehicle_type, capacity, driver_id,
    insurance_expiry, service_date, status
  )
  values
    (v_company_id, 'VEH-SAF-001', 'KDA 101A', 'Refrigerated Truck', '2 Tonnes', v_driver_1, current_date + interval '280 days', current_date + interval '45 days', 'Available'),
    (v_company_id, 'VEH-SAF-002', 'KDB 202B', 'Delivery Van', '1.5 Tonnes', v_driver_2, current_date + interval '260 days', current_date + interval '35 days', 'Available'),
    (v_company_id, 'VEH-SAF-003', 'KDC 303C', 'Pickup', '1 Tonne', null, current_date + interval '220 days', current_date + interval '60 days', 'Available'),
    (v_company_id, 'VEH-SAF-004', 'KDD 404D', 'Refrigerated Truck', '3 Tonnes', null, current_date + interval '300 days', current_date + interval '50 days', 'Maintenance')
  on conflict (company_id, vehicle_code) do update
  set registration_number = excluded.registration_number,
      vehicle_type = excluded.vehicle_type,
      capacity = excluded.capacity,
      driver_id = excluded.driver_id,
      insurance_expiry = excluded.insurance_expiry,
      service_date = excluded.service_date,
      status = excluded.status,
      updated_at = now();

  update public.routes r
  set assigned_sales_rep_id = case
        when r.route_name in ('Nairobi East Route', 'Nairobi West Route') then v_sales_rep_1
        else v_sales_rep_2
      end,
      assigned_driver_id = case
        when r.route_name in ('Nairobi East Route', 'Nairobi West Route') then v_driver_1
        else coalesce(v_driver_2, v_driver_1)
      end,
      distance_km = case r.route_name
        when 'Nairobi East Route' then 42
        when 'Nairobi West Route' then 38
        when 'Machakos Route' then 128
        when 'Nakuru Route' then 320
        when 'Mombasa Route' then 970
        else r.distance_km
      end,
      estimated_travel_time = case r.route_name
        when 'Nairobi East Route' then '4 hours'
        when 'Nairobi West Route' then '4 hours'
        when 'Machakos Route' then '1 day'
        when 'Nakuru Route' then '1 day'
        when 'Mombasa Route' then '2 days'
        else r.estimated_travel_time
      end,
      updated_at = now()
  where r.company_id = v_company_id;

  insert into public.price_lists (tenant_id, price_list_name, customer_type, effective_date, status)
  values (v_company_id, 'Safa Dairy Standard Price List', 'All', current_date, 'Active')
  on conflict (tenant_id, price_list_name) do update
  set customer_type = excluded.customer_type,
      effective_date = excluded.effective_date,
      status = excluded.status,
      updated_at = now()
  returning id into v_price_list_id;

  update public.products
  set selling_price = case sku
        when 'RAY-ICE-VAN-500ML' then 180
        when 'RAY-ICE-STR-500ML' then 185
        when 'RAY-ICE-CHO-500ML' then 190
        when 'RAY-ICE-MAN-500ML' then 185
        when 'RAY-SYR-STR-1L' then 220
        when 'RAY-SYR-VAN-1L' then 215
        when 'RAY-SYR-MAN-1L' then 220
        when 'RAY-SYR-ORG-1L' then 215
        when 'RAY-SYR-PIN-1L' then 220
        when 'RAY-SPI-PIL-100G' then 95
        when 'RAY-SPI-TEA-100G' then 90
        when 'RAY-SPI-MIX-100G' then 85
        when 'RAY-SPI-CUR-100G' then 80
        when 'RAY-SPI-BLP-100G' then 100
        when 'RAY-SPI-GAR-100G' then 90
        when 'RAY-SPI-GIN-100G' then 90
        else selling_price
      end,
      cost_price = case sku
        when 'RAY-ICE-VAN-500ML' then 105
        when 'RAY-ICE-STR-500ML' then 108
        when 'RAY-ICE-CHO-500ML' then 112
        when 'RAY-ICE-MAN-500ML' then 108
        when 'RAY-SYR-STR-1L' then 125
        when 'RAY-SYR-VAN-1L' then 120
        when 'RAY-SYR-MAN-1L' then 125
        when 'RAY-SYR-ORG-1L' then 120
        when 'RAY-SYR-PIN-1L' then 125
        when 'RAY-SPI-PIL-100G' then 52
        when 'RAY-SPI-TEA-100G' then 50
        when 'RAY-SPI-MIX-100G' then 48
        when 'RAY-SPI-CUR-100G' then 45
        when 'RAY-SPI-BLP-100G' then 60
        when 'RAY-SPI-GAR-100G' then 52
        when 'RAY-SPI-GIN-100G' then 52
        else cost_price
      end,
      updated_at = now()
  where company_id = v_company_id and sku like 'RAY-%';

  insert into public.price_list_lines (
    tenant_id, price_list_id, product_id, standard_price, wholesale_price, distributor_price, special_price
  )
  select
    v_company_id,
    v_price_list_id,
    p.id,
    p.selling_price,
    round(p.selling_price * 0.92, 2),
    round(p.selling_price * 0.86, 2),
    0
  from public.products p
  where p.company_id = v_company_id and p.sku like 'RAY-%'
  on conflict (tenant_id, price_list_id, product_id) do update
  set standard_price = excluded.standard_price,
      wholesale_price = excluded.wholesale_price,
      distributor_price = excluded.distributor_price,
      special_price = excluded.special_price,
      updated_at = now();

  insert into public.opening_balances (tenant_id, opening_balance_number, balance_date, uploaded_by, approved_by, status)
  values (v_company_id, 'OB-SAF-START', current_date, v_sales_rep_1, v_sales_rep_1, 'Posted')
  on conflict (tenant_id, opening_balance_number) do update
  set balance_date = excluded.balance_date,
      uploaded_by = excluded.uploaded_by,
      approved_by = excluded.approved_by,
      status = excluded.status,
      updated_at = now()
  returning id into v_opening_balance_id;

  delete from public.opening_balance_lines
  where tenant_id = v_company_id and opening_balance_id = v_opening_balance_id;

  insert into public.opening_balance_lines (
    tenant_id, opening_balance_id, product_id, warehouse_id, batch_number, expiry_date,
    quantity, unit_cost, approval_status
  )
  select
    v_company_id,
    v_opening_balance_id,
    p.id,
    case when p.brand = 'Rayan Ice Cream' then v_fg_warehouse_id else v_dispatch_warehouse_id end,
    'OPEN-' || p.sku,
    case
      when p.brand = 'Rayan Ice Cream' then current_date + interval '180 days'
      when p.brand = 'Rayan Syrups' then current_date + interval '365 days'
      else current_date + interval '540 days'
    end,
    case
      when p.brand = 'Rayan Ice Cream' then 240
      when p.brand = 'Rayan Syrups' then 180
      else 300
    end,
    p.cost_price,
    'Approved'
  from public.products p
  where p.company_id = v_company_id and p.sku like 'RAY-%';

  insert into public.stock_balances (
    tenant_id, product_id, warehouse_id, batch_number, expiry_date, unit_of_measure_id, qc_status,
    total_quantity, reserved_quantity, qc_hold_quantity, damaged_quantity, expired_quantity,
    in_transit_quantity, weighted_average_cost, total_value, last_movement_at
  )
  select
    v_company_id,
    p.id,
    case when p.brand = 'Rayan Ice Cream' then v_fg_warehouse_id else v_dispatch_warehouse_id end,
    'OPEN-' || p.sku,
    case
      when p.brand = 'Rayan Ice Cream' then current_date + interval '180 days'
      when p.brand = 'Rayan Syrups' then current_date + interval '365 days'
      else current_date + interval '540 days'
    end,
    p.unit_of_measure_id,
    'Approved',
    case
      when p.brand = 'Rayan Ice Cream' then 240
      when p.brand = 'Rayan Syrups' then 180
      else 300
    end,
    0,
    0,
    0,
    0,
    0,
    p.cost_price,
    case
      when p.brand = 'Rayan Ice Cream' then 240 * p.cost_price
      when p.brand = 'Rayan Syrups' then 180 * p.cost_price
      else 300 * p.cost_price
    end,
    now()
  from public.products p
  where p.company_id = v_company_id and p.sku like 'RAY-%'
  on conflict (tenant_id, product_id, warehouse_id, batch_number, qc_status) do update
  set expiry_date = excluded.expiry_date,
      unit_of_measure_id = excluded.unit_of_measure_id,
      total_quantity = excluded.total_quantity,
      weighted_average_cost = excluded.weighted_average_cost,
      total_value = excluded.total_value,
      last_movement_at = excluded.last_movement_at,
      updated_at = now();

  insert into public.stock_ledger (
    tenant_id, transaction_number, transaction_type, product_id, warehouse_id, batch_number,
    quantity_in, quantity_out, balance_after_transaction, unit_cost, total_value, reference_document, reference_id
  )
  select
    v_company_id,
    'STK-OPEN-' || p.sku,
    'Opening Balance',
    p.id,
    case when p.brand = 'Rayan Ice Cream' then v_fg_warehouse_id else v_dispatch_warehouse_id end,
    'OPEN-' || p.sku,
    case
      when p.brand = 'Rayan Ice Cream' then 240
      when p.brand = 'Rayan Syrups' then 180
      else 300
    end,
    0,
    case
      when p.brand = 'Rayan Ice Cream' then 240
      when p.brand = 'Rayan Syrups' then 180
      else 300
    end,
    p.cost_price,
    case
      when p.brand = 'Rayan Ice Cream' then 240 * p.cost_price
      when p.brand = 'Rayan Syrups' then 180 * p.cost_price
      else 300 * p.cost_price
    end,
    'OB-SAF-START',
    v_opening_balance_id
  from public.products p
  where p.company_id = v_company_id and p.sku like 'RAY-%'
  on conflict (tenant_id, transaction_number) do update
  set transaction_type = excluded.transaction_type,
      product_id = excluded.product_id,
      warehouse_id = excluded.warehouse_id,
      batch_number = excluded.batch_number,
      quantity_in = excluded.quantity_in,
      quantity_out = excluded.quantity_out,
      balance_after_transaction = excluded.balance_after_transaction,
      unit_cost = excluded.unit_cost,
      total_value = excluded.total_value,
      reference_document = excluded.reference_document,
      reference_id = excluded.reference_id,
      updated_at = now();
end $$;

select 'customers' as area, count(*)::integer as total
from public.customers c
join public.companies co on co.id = c.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'vehicles', count(*)::integer
from public.vehicles v
join public.companies co on co.id = v.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'price_list_lines', count(*)::integer
from public.price_list_lines pll
join public.companies co on co.id = pll.tenant_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'stock_balances', count(*)::integer
from public.stock_balances sb
join public.companies co on co.id = sb.tenant_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'stock_ledger', count(*)::integer
from public.stock_ledger sl
join public.companies co on co.id = sl.tenant_id
where co.company_name = 'Safa Dairy Ltd'
order by area;
