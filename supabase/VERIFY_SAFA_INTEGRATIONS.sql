select
  'mpesa_configurations' as area,
  mc.status,
  environment,
  shortcode,
  callback_url,
  (consumer_key is not null and consumer_key <> '') as consumer_key_set,
  (consumer_secret is not null and consumer_secret <> '') as consumer_secret_set,
  (passkey is not null and passkey <> '') as passkey_set
from public.mpesa_configurations mc
join public.companies c on c.id = mc.tenant_id
where c.company_name = 'Safa Dairy Ltd';

select
  endpoint_name,
  integration_type,
  base_url,
  auth_type,
  enabled,
  ie.status,
  (configuration ? 'api_key') as api_key_configured
from public.integration_endpoints ie
join public.companies c on c.id = ie.tenant_id
where c.company_name = 'Safa Dairy Ltd'
  and endpoint_name in ('Solco Notifications', 'SolvaHR API', 'Solva Finance')
order by endpoint_name;

select
  finance_integration_enabled,
  finance_api_base_url,
  finance_posting_mode,
  cs.status
from public.collections_settings cs
join public.companies c on c.id = cs.tenant_id
where c.company_name = 'Safa Dairy Ltd';
