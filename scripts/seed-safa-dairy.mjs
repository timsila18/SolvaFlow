import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    if (!process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

async function ensureSingle(supabase, table, match, values, select = "*") {
  const { data: existing, error: findError } = await supabase.from(table).select(select).match(match).maybeSingle();
  if (findError) throw new Error(`${table} lookup failed: ${findError.message}`);
  if (existing) {
    const { data, error } = await supabase.from(table).update(values).match(match).select(select).single();
    if (error) throw new Error(`${table} update failed: ${error.message}`);
    return data;
  }
  const { data, error } = await supabase.from(table).insert({ ...match, ...values }).select(select).single();
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
  return data;
}

async function getRoleId(supabase, roleKey) {
  const { data, error } = await supabase
    .from("roles")
    .select("id, role_key")
    .eq("role_key", roleKey)
    .order("is_global_role", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw new Error(`Role lookup failed for ${roleKey}: ${error.message}`);
  if (!data?.[0]) throw new Error(`Missing role '${roleKey}'. Apply all Prompt 1-5 migrations before seeding.`);
  return data[0].id;
}

async function ensureAuthUser(supabase, user) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.proposed_login_email,
    password: user.temporary_password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      employee_number: user.employee_number,
    },
  });

  if (!error) return data.user.id;
  if (!/already registered|already exists|User already registered/i.test(error.message)) {
    throw new Error(`Auth user create failed for ${user.proposed_login_email}: ${error.message}`);
  }

  let page = 1;
  while (page < 20) {
    const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) throw new Error(`Auth user lookup failed: ${listError.message}`);
    const found = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === user.proposed_login_email.toLowerCase());
    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password: user.temporary_password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          employee_number: user.employee_number,
        },
      });
      return found.id;
    }
    if (usersPage.users.length < 1000) break;
    page += 1;
  }

  throw new Error(`Auth user exists but could not be found: ${user.proposed_login_email}`);
}

loadEnv(envPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { "X-Client-Info": "solvaflow-safa-seed" } },
});

const csvPath = path.join(root, "supabase", "safa_dairy_login_allocation.csv");
const users = parseCsv(fs.readFileSync(csvPath, "utf8"));

const { error: schemaError } = await supabase.from("user_profiles").select("id").limit(1);
if (schemaError) {
  throw new Error(`SolvaFlow schema is not ready: ${schemaError.message}`);
}

const company = await ensureSingle(
  supabase,
  "companies",
  { storage_bucket: "safa-dairy-ltd" },
  {
    company_name: "Safa Dairy Ltd",
    industry: "Food Manufacturing",
    country: "Kenya",
    county: "Nairobi",
    default_currency: "KES",
    timezone: "Africa/Nairobi",
    business_type: "Manufacturer and Distributor",
    number_of_employees: users.length,
    number_of_warehouses: 4,
    primary_contact_person: "John Kariuki",
    status: "Active",
  },
  "id, company_name, storage_bucket"
);

await ensureSingle(
  supabase,
  "company_branding",
  { company_id: company.id },
  {
    primary_color: "#0057ff",
    secondary_color: "#050b14",
    theme: "Light",
    report_header: "Safa Dairy Ltd",
    invoice_footer: "SolvaFlow - From Production to Payment.",
    delivery_note_footer: "Goods are delivered subject to Safa Dairy Ltd delivery terms.",
    email_signature: "Safa Dairy Ltd | Powered by SolvaFlow",
    system_watermark: "Safa Dairy",
  },
  "company_id"
);

const roleIds = {};
for (const roleKey of [...new Set(users.map((user) => user.recommended_solvaflow_role))]) {
  roleIds[roleKey] = await getRoleId(supabase, roleKey);
}

const createdUsers = [];
for (const user of users) {
  const authUserId = await ensureAuthUser(supabase, user);
  await ensureSingle(
    supabase,
    "user_profiles",
    { id: authUserId },
    {
      company_id: company.id,
      employee_number: user.employee_number,
      full_name: user.full_name,
      email: user.proposed_login_email,
      department: user.source_department,
      designation: user.recommended_solvaflow_role.replaceAll("_", " "),
      role_id: roleIds[user.recommended_solvaflow_role],
      status: "Active",
      force_password_change: true,
    },
    "id, email"
  );
  createdUsers.push(user.proposed_login_email);
}

const categories = [
  ["Ice Cream", "Finished ice cream products"],
  ["Syrups", "Finished syrup products"],
  ["Spices", "Finished spice products"],
  ["Raw Materials", "Production input materials"],
  ["Packaging", "Cups, bottles, labels, cartons and closures"],
  ["Consumables", "Factory consumables"],
  ["Finished Goods", "Saleable stock"],
  ["Semi-Finished Goods", "Intermediate production outputs"],
];

for (const [category_name, description] of categories) {
  await ensureSingle(supabase, "product_categories", { company_id: company.id, category_name }, { description, status: "Active" }, "id");
}

const units = [
  ["Kilogram", "kg"],
  ["Gram", "g"],
  ["Litre", "L"],
  ["Millilitre", "ml"],
  ["Piece", "pc"],
  ["Carton", "ctn"],
  ["Bottle", "btl"],
  ["Packet", "pkt"],
  ["Sachet", "sachet"],
  ["Tray", "tray"],
  ["Pallet", "plt"],
];

for (const [unit_name, symbol] of units) {
  await ensureSingle(supabase, "units_of_measure", { company_id: company.id, unit_name }, { symbol, status: "Active" }, "id");
}

const warehouses = [
  ["Raw Materials Warehouse", "RM-WH", "Safa Dairy Ltd Headquarters", "Raw Materials"],
  ["Production Floor", "PROD-FLR", "Safa Dairy Ltd Headquarters", "Production"],
  ["Finished Goods Warehouse", "FG-WH", "Safa Dairy Ltd Headquarters", "Finished Goods"],
  ["Dispatch Warehouse", "DSP-WH", "Safa Dairy Ltd Headquarters", "Dispatch"],
];

for (const [warehouse_name, code, location, warehouse_type] of warehouses) {
  await ensureSingle(supabase, "warehouses", { company_id: company.id, code }, { warehouse_name, location, warehouse_type, status: "Active" }, "id");
}

const territories = ["Nairobi East", "Nairobi West", "Machakos", "Nakuru", "Eldoret", "Kisumu", "Mombasa"];
for (const territory_name of territories) {
  await ensureSingle(supabase, "territories", { company_id: company.id, territory_name }, { region: territory_name, status: "Active" }, "id");
}

for (const route_name of ["Nairobi East Route", "Nairobi West Route", "Machakos Route", "Nakuru Route", "Mombasa Route"]) {
  await ensureSingle(supabase, "routes", { company_id: company.id, route_name }, { region: route_name.replace(" Route", ""), status: "Active" }, "id");
}

const suppliers = [
  ["SUP-00001", "Milk Supplier", "Raw milk", 1],
  ["SUP-00002", "Sugar Supplier", "Sugar", 3],
  ["SUP-00003", "Packaging Supplier", "Cups, bottles, caps, labels and cartons", 7],
  ["SUP-00004", "Spice Supplier", "Mixed spices", 5],
];

for (const [supplier_code, supplier_name, products_supplied, lead_time_days] of suppliers) {
  await ensureSingle(
    supabase,
    "suppliers",
    { company_id: company.id, supplier_code },
    { supplier_name, products_supplied, lead_time_days, payment_terms: "Net 30", status: "Active" },
    "id"
  );
}

console.log(JSON.stringify({
  ok: true,
  company: company.company_name,
  users: createdUsers.length,
  defaultPassword: "Stored in supabase/safa_dairy_login_allocation.csv",
  next: "Run workflow tests after confirming login and RLS isolation.",
}, null, 2));
