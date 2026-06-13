create or replace function private.apply_inventory_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'stock_ledger' then
    if new.transaction_number is null or new.transaction_number = '' then
      new.transaction_number := private.next_document_number(new.tenant_id, 'stock_ledger');
    end if;
  elsif tg_table_name = 'warehouse_transfers' then
    if new.transfer_number is null or new.transfer_number = '' then
      new.transfer_number := private.next_document_number(new.tenant_id, 'warehouse_transfer');
    end if;
  elsif tg_table_name = 'stock_adjustments' then
    if new.adjustment_number is null or new.adjustment_number = '' then
      new.adjustment_number := private.next_document_number(new.tenant_id, 'stock_adjustment');
    end if;
  elsif tg_table_name = 'stock_counts' then
    if new.count_number is null or new.count_number = '' then
      new.count_number := private.next_document_number(new.tenant_id, 'stock_count');
    end if;
  elsif tg_table_name = 'procurement_requests' then
    if new.request_number is null or new.request_number = '' then
      new.request_number := private.next_document_number(new.tenant_id, 'procurement_request');
    end if;
  elsif tg_table_name = 'purchase_orders' then
    if new.purchase_order_number is null or new.purchase_order_number = '' then
      new.purchase_order_number := private.next_document_number(new.tenant_id, 'purchase_order');
    end if;
  elsif tg_table_name = 'goods_received_notes' then
    if new.grn_number is null or new.grn_number = '' then
      new.grn_number := private.next_document_number(new.tenant_id, 'grn');
    end if;
  elsif tg_table_name = 'supplier_returns' then
    if new.supplier_return_number is null or new.supplier_return_number = '' then
      new.supplier_return_number := private.next_document_number(new.tenant_id, 'supplier_return');
    end if;
  elsif tg_table_name = 'opening_balances' then
    if new.opening_balance_number is null or new.opening_balance_number = '' then
      new.opening_balance_number := private.next_document_number(new.tenant_id, 'opening_balance');
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.apply_manufacturing_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'recipes' then
    if new.recipe_code is null or new.recipe_code = '' then
      new.recipe_code := private.next_document_number(new.tenant_id, 'recipe');
    end if;
  elsif tg_table_name = 'production_plans' then
    if new.plan_number is null or new.plan_number = '' then
      new.plan_number := private.next_document_number(new.tenant_id, 'production_plan');
    end if;
  elsif tg_table_name = 'production_orders' then
    if new.production_order_number is null or new.production_order_number = '' then
      new.production_order_number := private.next_document_number(new.tenant_id, 'production_order');
    end if;
  elsif tg_table_name = 'production_material_issues' then
    if new.issue_number is null or new.issue_number = '' then
      new.issue_number := private.next_document_number(new.tenant_id, 'material_issue');
    end if;
  elsif tg_table_name = 'quality_checks' then
    if new.qc_number is null or new.qc_number = '' then
      new.qc_number := private.next_document_number(new.tenant_id, 'quality_check');
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.apply_sales_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'field_visits' then
    if new.visit_number is null or new.visit_number = '' then
      new.visit_number := private.next_document_number(new.tenant_id, 'field_visit');
    end if;
  elsif tg_table_name = 'route_plans' then
    if new.route_plan_number is null or new.route_plan_number = '' then
      new.route_plan_number := private.next_document_number(new.tenant_id, 'route_plan');
    end if;
  elsif tg_table_name = 'sales_orders' then
    if new.sales_order_number is null or new.sales_order_number = '' then
      new.sales_order_number := private.next_document_number(new.tenant_id, 'sales_order');
    end if;
  elsif tg_table_name = 'dispatch_orders' then
    if new.dispatch_number is null or new.dispatch_number = '' then
      new.dispatch_number := private.next_document_number(new.tenant_id, 'dispatch_order');
    end if;
  elsif tg_table_name = 'picking_lists' then
    if new.picking_number is null or new.picking_number = '' then
      new.picking_number := private.next_document_number(new.tenant_id, 'picking_list');
    end if;
  elsif tg_table_name = 'delivery_notes' then
    if new.delivery_note_number is null or new.delivery_note_number = '' then
      new.delivery_note_number := private.next_document_number(new.tenant_id, 'delivery_note');
    end if;
  elsif tg_table_name = 'driver_trips' then
    if new.trip_number is null or new.trip_number = '' then
      new.trip_number := private.next_document_number(new.tenant_id, 'driver_trip');
    end if;
  elsif tg_table_name = 'customer_returns' then
    if new.return_number is null or new.return_number = '' then
      new.return_number := private.next_document_number(new.tenant_id, 'customer_return');
    end if;
  elsif tg_table_name = 'customer_complaints' then
    if new.complaint_number is null or new.complaint_number = '' then
      new.complaint_number := private.next_document_number(new.tenant_id, 'customer_complaint');
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.apply_collections_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'sales_invoices' then
    if new.invoice_number is null or new.invoice_number = '' then
      new.invoice_number := private.next_document_number(new.tenant_id, 'invoice');
    end if;
  elsif tg_table_name = 'customer_payments' then
    if new.receipt_number is null or new.receipt_number = '' then
      new.receipt_number := private.next_document_number(new.tenant_id, 'receipt');
    end if;
  elsif tg_table_name = 'customer_account_ledger' then
    if new.transaction_number is null or new.transaction_number = '' then
      new.transaction_number := private.next_document_number(new.tenant_id, 'customer_ledger');
    end if;
  elsif tg_table_name = 'credit_notes' then
    if new.credit_note_number is null or new.credit_note_number = '' then
      new.credit_note_number := private.next_document_number(new.tenant_id, 'credit_note');
    end if;
  elsif tg_table_name = 'debit_notes' then
    if new.debit_note_number is null or new.debit_note_number = '' then
      new.debit_note_number := private.next_document_number(new.tenant_id, 'debit_note');
    end if;
  elsif tg_table_name = 'ai_insights' then
    if new.insight_number is null or new.insight_number = '' then
      new.insight_number := private.next_document_number(new.tenant_id, 'ai_insight');
    end if;
  elsif tg_table_name = 'alert_center' then
    if new.alert_number is null or new.alert_number = '' then
      new.alert_number := private.next_document_number(new.tenant_id, 'alert');
    end if;
  end if;
  return new;
end;
$$;
