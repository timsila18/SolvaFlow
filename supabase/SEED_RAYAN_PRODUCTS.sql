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

do $$
declare
  v_company_id uuid;
  v_ice_cream_category_id uuid;
  v_syrups_category_id uuid;
  v_spices_category_id uuid;
  v_piece_unit_id uuid;
  v_bottle_unit_id uuid;
  v_packet_unit_id uuid;
begin
  select id into v_company_id
  from public.companies
  where company_name = 'Safa Dairy Ltd'
  limit 1;

  if v_company_id is null then
    raise exception 'Safa Dairy Ltd tenant was not found. Run the Safa Dairy tenant seed first.';
  end if;

  insert into public.product_categories (company_id, category_name, description, status)
  values
    (v_company_id, 'Ice Cream', 'Finished ice cream products', 'Active'),
    (v_company_id, 'Syrups', 'Finished syrup products', 'Active'),
    (v_company_id, 'Spices', 'Finished spice products', 'Active')
  on conflict (company_id, category_name) do update
  set description = excluded.description,
      status = excluded.status,
      updated_at = now();

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Piece' or symbol = 'pc')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Piece', 'pc', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Bottle' or symbol = 'btl')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Bottle', 'btl', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Packet' or symbol = 'pkt')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Packet', 'pkt', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Carton' or symbol = 'ctn')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Carton', 'ctn', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Litre' or symbol = 'L')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Litre', 'L', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Millilitre' or symbol = 'ml')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Millilitre', 'ml', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Gram' or symbol = 'g')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Gram', 'g', 'Active');
  end if;

  if not exists (select 1 from public.units_of_measure where company_id = v_company_id and (unit_name = 'Kg' or symbol = 'kg')) then
    insert into public.units_of_measure (company_id, unit_name, symbol, status) values (v_company_id, 'Kg', 'kg', 'Active');
  end if;

  select id into v_ice_cream_category_id from public.product_categories where company_id = v_company_id and category_name = 'Ice Cream';
  select id into v_syrups_category_id from public.product_categories where company_id = v_company_id and category_name = 'Syrups';
  select id into v_spices_category_id from public.product_categories where company_id = v_company_id and category_name = 'Spices';
  select id into v_piece_unit_id from public.units_of_measure where company_id = v_company_id and (unit_name = 'Piece' or symbol = 'pc') limit 1;
  select id into v_bottle_unit_id from public.units_of_measure where company_id = v_company_id and (unit_name = 'Bottle' or symbol = 'btl') limit 1;
  select id into v_packet_unit_id from public.units_of_measure where company_id = v_company_id and (unit_name = 'Packet' or symbol = 'pkt') limit 1;

  insert into public.products (
    company_id,
    sku,
    product_name,
    product_description,
    brand,
    category_id,
    unit_of_measure_id,
    pack_size,
    selling_price,
    cost_price,
    tax_category,
    minimum_stock,
    maximum_stock,
    reorder_level,
    storage_type,
    status,
    track_expiry,
    track_batch,
    track_serial
  )
  values
    (v_company_id, 'RAY-ICE-VAN-500ML', 'Rayan Vanilla Ice Cream 500ml', 'Vanilla flavoured Rayan ice cream in a 500ml retail pack.', 'Rayan Ice Cream', v_ice_cream_category_id, v_piece_unit_id, '500ml', 0, 0, 'VAT', 0, 0, 50, 'Frozen', 'Active', true, true, false),
    (v_company_id, 'RAY-ICE-STR-500ML', 'Rayan Strawberry Ice Cream 500ml', 'Strawberry flavoured Rayan ice cream in a 500ml retail pack.', 'Rayan Ice Cream', v_ice_cream_category_id, v_piece_unit_id, '500ml', 0, 0, 'VAT', 0, 0, 50, 'Frozen', 'Active', true, true, false),
    (v_company_id, 'RAY-ICE-CHO-500ML', 'Rayan Chocolate Ice Cream 500ml', 'Chocolate flavoured Rayan ice cream in a 500ml retail pack.', 'Rayan Ice Cream', v_ice_cream_category_id, v_piece_unit_id, '500ml', 0, 0, 'VAT', 0, 0, 50, 'Frozen', 'Active', true, true, false),
    (v_company_id, 'RAY-ICE-MAN-500ML', 'Rayan Mango Ice Cream 500ml', 'Mango flavoured Rayan ice cream in a 500ml retail pack.', 'Rayan Ice Cream', v_ice_cream_category_id, v_piece_unit_id, '500ml', 0, 0, 'VAT', 0, 0, 50, 'Frozen', 'Active', true, true, false),
    (v_company_id, 'RAY-SYR-STR-1L', 'Rayan Strawberry Syrup 1L', 'Strawberry flavoured Rayan syrup in a 1 litre bottle.', 'Rayan Syrups', v_syrups_category_id, v_bottle_unit_id, '1L', 0, 0, 'VAT', 0, 0, 40, 'Ambient', 'Active', true, true, false),
    (v_company_id, 'RAY-SYR-VAN-1L', 'Rayan Vanilla Syrup 1L', 'Vanilla flavoured Rayan syrup in a 1 litre bottle.', 'Rayan Syrups', v_syrups_category_id, v_bottle_unit_id, '1L', 0, 0, 'VAT', 0, 0, 40, 'Ambient', 'Active', true, true, false),
    (v_company_id, 'RAY-SYR-MAN-1L', 'Rayan Mango Syrup 1L', 'Mango flavoured Rayan syrup in a 1 litre bottle.', 'Rayan Syrups', v_syrups_category_id, v_bottle_unit_id, '1L', 0, 0, 'VAT', 0, 0, 40, 'Ambient', 'Active', true, true, false),
    (v_company_id, 'RAY-SYR-ORG-1L', 'Rayan Orange Syrup 1L', 'Orange flavoured Rayan syrup in a 1 litre bottle.', 'Rayan Syrups', v_syrups_category_id, v_bottle_unit_id, '1L', 0, 0, 'VAT', 0, 0, 40, 'Ambient', 'Active', true, true, false),
    (v_company_id, 'RAY-SYR-PIN-1L', 'Rayan Pineapple Syrup 1L', 'Pineapple flavoured Rayan syrup in a 1 litre bottle.', 'Rayan Syrups', v_syrups_category_id, v_bottle_unit_id, '1L', 0, 0, 'VAT', 0, 0, 40, 'Ambient', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-PIL-100G', 'Rayan Pilau Masala 100g', 'Rayan pilau masala spice blend in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-TEA-100G', 'Rayan Tea Masala 100g', 'Rayan tea masala spice blend in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-MIX-100G', 'Rayan Mixed Spices 100g', 'Rayan mixed spices in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-CUR-100G', 'Rayan Curry Powder 100g', 'Rayan curry powder in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-BLP-100G', 'Rayan Black Pepper 100g', 'Rayan black pepper in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-GAR-100G', 'Rayan Garlic Powder 100g', 'Rayan garlic powder in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false),
    (v_company_id, 'RAY-SPI-GIN-100G', 'Rayan Ginger Powder 100g', 'Rayan ginger powder in a 100g pack.', 'Rayan Spices', v_spices_category_id, v_packet_unit_id, '100g', 0, 0, 'VAT', 0, 0, 60, 'Dry Store', 'Active', true, true, false)
  on conflict (company_id, sku) do update
  set product_name = excluded.product_name,
      product_description = excluded.product_description,
      brand = excluded.brand,
      category_id = excluded.category_id,
      unit_of_measure_id = excluded.unit_of_measure_id,
      pack_size = excluded.pack_size,
      tax_category = excluded.tax_category,
      reorder_level = excluded.reorder_level,
      storage_type = excluded.storage_type,
      status = excluded.status,
      track_expiry = excluded.track_expiry,
      track_batch = excluded.track_batch,
      track_serial = excluded.track_serial,
      updated_at = now();
end $$;

select
  p.sku,
  p.product_name,
  p.brand,
  pc.category_name,
  u.unit_name,
  p.pack_size,
  p.storage_type,
  p.status
from public.products p
left join public.product_categories pc on pc.id = p.category_id
left join public.units_of_measure u on u.id = p.unit_of_measure_id
where p.company_id = (select id from public.companies where company_name = 'Safa Dairy Ltd' limit 1)
  and p.sku like 'RAY-%'
order by p.brand, p.product_name;
