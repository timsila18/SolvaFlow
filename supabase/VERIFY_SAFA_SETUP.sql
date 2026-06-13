select 'users' as area, count(*)::integer as total
from public.user_profiles up
join public.companies co on co.id = up.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'products', count(*)::integer
from public.products p
join public.companies co on co.id = p.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'warehouses', count(*)::integer
from public.warehouses w
join public.companies co on co.id = w.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'customers', count(*)::integer
from public.customers c
join public.companies co on co.id = c.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'suppliers', count(*)::integer
from public.suppliers s
join public.companies co on co.id = s.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'vehicles', count(*)::integer
from public.vehicles v
join public.companies co on co.id = v.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'routes', count(*)::integer
from public.routes r
join public.companies co on co.id = r.company_id
where co.company_name = 'Safa Dairy Ltd'
union all
select 'territories', count(*)::integer
from public.territories t
join public.companies co on co.id = t.company_id
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
