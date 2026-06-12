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
