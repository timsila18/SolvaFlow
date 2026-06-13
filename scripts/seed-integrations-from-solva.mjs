import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

const root = process.cwd();
config({ path: path.join(root, ".env.local"), quiet: true });

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    values[match[1].trim()] = match[2].trim();
  }
  return values;
}

function first(...values) {
  return values.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

function mask(value) {
  if (!value) return null;
  if (value.length <= 8) return "[set]";
  return `${value.slice(0, 4)}...[set]`;
}

function productionUrl(value, fallback) {
  if (!value || /localhost|127\.0\.0\.1/i.test(value)) return fallback;
  return value;
}

async function ensureEndpoint(admin, tenantId, endpoint) {
  const { data: existing, error: findError } = await admin
    .from("integration_endpoints")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("endpoint_name", endpoint.endpoint_name)
    .maybeSingle();

  if (findError) throw new Error(`Endpoint lookup failed for ${endpoint.endpoint_name}: ${findError.message}`);

  if (existing) {
    const { error } = await admin
      .from("integration_endpoints")
      .update(endpoint)
      .eq("id", existing.id);
    if (error) throw new Error(`Endpoint update failed for ${endpoint.endpoint_name}: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await admin
    .from("integration_endpoints")
    .insert({ tenant_id: tenantId, ...endpoint })
    .select("id")
    .single();
  if (error) throw new Error(`Endpoint insert failed for ${endpoint.endpoint_name}: ${error.message}`);
  return data.id;
}

const solvaOneEnv = {
  ...loadEnv("C:\\SolvaOne\\.env"),
  ...loadEnv("C:\\SolvaOne\\.env.local")
};
const solcoEnv = loadEnv("C:\\Solco\\.env.local");
const solvaHrEnv = loadEnv("C:\\Solva HR\\.env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SolvaFlow NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: company, error: companyError } = await admin
  .from("companies")
  .select("id, company_name")
  .eq("company_name", "Safa Dairy Ltd")
  .maybeSingle();

if (companyError) throw new Error(`Company lookup failed: ${companyError.message}`);
if (!company) throw new Error("Safa Dairy Ltd tenant was not found.");

const mpesaShortcode = first(solvaOneEnv.MPESA_SHORTCODE);
const mpesaPayload = {
  tenant_id: company.id,
  paybill: mpesaShortcode,
  till_number: null,
  shortcode: mpesaShortcode,
  consumer_key: first(solvaOneEnv.MPESA_CONSUMER_KEY),
  consumer_secret: first(solvaOneEnv.MPESA_CONSUMER_SECRET),
  passkey: first(solvaOneEnv.MPESA_PASSKEY),
  callback_url: "https://solvaflow.co.ke/api/final-modules/mpesa/callback",
  environment: /prod/i.test(first(solvaOneEnv.MPESA_ENV) ?? "") ? "Production" : "Sandbox",
  status: mpesaShortcode ? "Active" : "Inactive"
};

const { error: mpesaError } = await admin
  .from("mpesa_configurations")
  .upsert(mpesaPayload, { onConflict: "tenant_id" });
if (mpesaError) throw new Error(`M-Pesa configuration failed: ${mpesaError.message}`);

const solcoBaseUrl = productionUrl(first(solcoEnv.NEXT_PUBLIC_APP_URL), "https://www.solco.co.ke");
const solvaHrBaseUrl = productionUrl(first(solvaHrEnv.NEXT_PUBLIC_APP_URL), "https://solvahr.co.ke");

await ensureEndpoint(admin, company.id, {
  endpoint_name: "Solco Notifications",
  integration_type: "Solco",
  base_url: solcoBaseUrl,
  auth_type: "API Key",
  enabled: Boolean(solcoEnv.SUPABASE_SECRET_KEY || solcoEnv.SUPABASE_SERVICE_ROLE_KEY),
  configuration: {
    source: "C:\\Solco\\.env.local",
    supabase_url: first(solcoEnv.NEXT_PUBLIC_SUPABASE_URL),
    project_ref: first(solcoEnv.SUPABASE_PROJECT_REF),
    api_key: first(solcoEnv.SUPABASE_SECRET_KEY, solcoEnv.SUPABASE_SERVICE_ROLE_KEY),
    channels: ["In-App", "Email", "SMS", "Solco"]
  },
  status: Boolean(solcoEnv.SUPABASE_SECRET_KEY || solcoEnv.SUPABASE_SERVICE_ROLE_KEY) ? "Active" : "Inactive"
});

await ensureEndpoint(admin, company.id, {
  endpoint_name: "SolvaHR API",
  integration_type: "SolvaHR",
  base_url: solvaHrBaseUrl,
  auth_type: "API Key",
  enabled: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY),
  configuration: {
    source: "C:\\Solva HR\\.env.local",
    supabase_url: first(solvaHrEnv.NEXT_PUBLIC_SUPABASE_URL),
    api_key: first(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY),
    employee_sync: true,
    payroll_sync: true
  },
  status: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY) ? "Active" : "Inactive"
});

await ensureEndpoint(admin, company.id, {
  endpoint_name: "Solva Finance",
  integration_type: "Solva Finance",
  base_url: `${solvaHrBaseUrl.replace(/\/$/, "")}/api/finance`,
  auth_type: "API Key",
  enabled: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY),
  configuration: {
    credential_source: "SolvaHR API credentials",
    api_key: first(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY),
    posting_mode: "Queue",
    events: ["Sales Invoice Posted", "Customer Receipt Posted", "Credit Note Posted", "Debit Note Posted"]
  },
  status: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY) ? "Active" : "Inactive"
});

const { error: settingsError } = await admin
  .from("collections_settings")
  .update({
    finance_integration_enabled: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY),
    finance_api_base_url: `${solvaHrBaseUrl.replace(/\/$/, "")}/api/finance`,
    finance_posting_mode: "Queue",
    status: "Active"
  })
  .eq("tenant_id", company.id);
if (settingsError) throw new Error(`Collections settings update failed: ${settingsError.message}`);

console.log(JSON.stringify({
  tenant: company.company_name,
  mpesa: {
    shortcode: mpesaShortcode,
    consumer_key: mask(mpesaPayload.consumer_key),
    consumer_secret: mask(mpesaPayload.consumer_secret),
    passkey: mask(mpesaPayload.passkey),
    callback_url: mpesaPayload.callback_url,
    environment: mpesaPayload.environment,
    status: mpesaPayload.status
  },
  integrations: [
    { name: "Solco Notifications", base_url: solcoBaseUrl, enabled: Boolean(solcoEnv.SUPABASE_SECRET_KEY || solcoEnv.SUPABASE_SERVICE_ROLE_KEY) },
    { name: "SolvaHR API", base_url: solvaHrBaseUrl, enabled: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY) },
    { name: "Solva Finance", base_url: `${solvaHrBaseUrl.replace(/\/$/, "")}/api/finance`, enabled: Boolean(solvaHrEnv.SUPABASE_SERVICE_ROLE_KEY) }
  ]
}, null, 2));
