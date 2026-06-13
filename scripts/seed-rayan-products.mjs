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

loadEnv(envPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const categories = [
  ["Ice Cream", "Finished ice cream products"],
  ["Syrups", "Finished syrup products"],
  ["Spices", "Finished spice products"]
];

const units = [
  ["Piece", "pc"],
  ["Carton", "ctn"],
  ["Bottle", "btl"],
  ["Packet", "pkt"],
  ["Litre", "L"],
  ["Millilitre", "ml"],
  ["Gram", "g"],
  ["Kg", "kg"]
];

const products = [
  {
    sku: "RAY-ICE-VAN-500ML",
    product_name: "Rayan Vanilla Ice Cream 500ml",
    product_description: "Vanilla flavoured Rayan ice cream in a 500ml retail pack.",
    brand: "Rayan Ice Cream",
    category: "Ice Cream",
    unit: "Piece",
    pack_size: "500ml",
    storage_type: "Frozen",
    track_expiry: true,
    track_batch: true,
    reorder_level: 50
  },
  {
    sku: "RAY-ICE-STR-500ML",
    product_name: "Rayan Strawberry Ice Cream 500ml",
    product_description: "Strawberry flavoured Rayan ice cream in a 500ml retail pack.",
    brand: "Rayan Ice Cream",
    category: "Ice Cream",
    unit: "Piece",
    pack_size: "500ml",
    storage_type: "Frozen",
    track_expiry: true,
    track_batch: true,
    reorder_level: 50
  },
  {
    sku: "RAY-ICE-CHO-500ML",
    product_name: "Rayan Chocolate Ice Cream 500ml",
    product_description: "Chocolate flavoured Rayan ice cream in a 500ml retail pack.",
    brand: "Rayan Ice Cream",
    category: "Ice Cream",
    unit: "Piece",
    pack_size: "500ml",
    storage_type: "Frozen",
    track_expiry: true,
    track_batch: true,
    reorder_level: 50
  },
  {
    sku: "RAY-ICE-MAN-500ML",
    product_name: "Rayan Mango Ice Cream 500ml",
    product_description: "Mango flavoured Rayan ice cream in a 500ml retail pack.",
    brand: "Rayan Ice Cream",
    category: "Ice Cream",
    unit: "Piece",
    pack_size: "500ml",
    storage_type: "Frozen",
    track_expiry: true,
    track_batch: true,
    reorder_level: 50
  },
  {
    sku: "RAY-SYR-STR-1L",
    product_name: "Rayan Strawberry Syrup 1L",
    product_description: "Strawberry flavoured Rayan syrup in a 1 litre bottle.",
    brand: "Rayan Syrups",
    category: "Syrups",
    unit: "Bottle",
    pack_size: "1L",
    storage_type: "Ambient",
    track_expiry: true,
    track_batch: true,
    reorder_level: 40
  },
  {
    sku: "RAY-SYR-VAN-1L",
    product_name: "Rayan Vanilla Syrup 1L",
    product_description: "Vanilla flavoured Rayan syrup in a 1 litre bottle.",
    brand: "Rayan Syrups",
    category: "Syrups",
    unit: "Bottle",
    pack_size: "1L",
    storage_type: "Ambient",
    track_expiry: true,
    track_batch: true,
    reorder_level: 40
  },
  {
    sku: "RAY-SYR-MAN-1L",
    product_name: "Rayan Mango Syrup 1L",
    product_description: "Mango flavoured Rayan syrup in a 1 litre bottle.",
    brand: "Rayan Syrups",
    category: "Syrups",
    unit: "Bottle",
    pack_size: "1L",
    storage_type: "Ambient",
    track_expiry: true,
    track_batch: true,
    reorder_level: 40
  },
  {
    sku: "RAY-SYR-ORG-1L",
    product_name: "Rayan Orange Syrup 1L",
    product_description: "Orange flavoured Rayan syrup in a 1 litre bottle.",
    brand: "Rayan Syrups",
    category: "Syrups",
    unit: "Bottle",
    pack_size: "1L",
    storage_type: "Ambient",
    track_expiry: true,
    track_batch: true,
    reorder_level: 40
  },
  {
    sku: "RAY-SYR-PIN-1L",
    product_name: "Rayan Pineapple Syrup 1L",
    product_description: "Pineapple flavoured Rayan syrup in a 1 litre bottle.",
    brand: "Rayan Syrups",
    category: "Syrups",
    unit: "Bottle",
    pack_size: "1L",
    storage_type: "Ambient",
    track_expiry: true,
    track_batch: true,
    reorder_level: 40
  },
  {
    sku: "RAY-SPI-PIL-100G",
    product_name: "Rayan Pilau Masala 100g",
    product_description: "Rayan pilau masala spice blend in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  },
  {
    sku: "RAY-SPI-TEA-100G",
    product_name: "Rayan Tea Masala 100g",
    product_description: "Rayan tea masala spice blend in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  },
  {
    sku: "RAY-SPI-MIX-100G",
    product_name: "Rayan Mixed Spices 100g",
    product_description: "Rayan mixed spices in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  },
  {
    sku: "RAY-SPI-CUR-100G",
    product_name: "Rayan Curry Powder 100g",
    product_description: "Rayan curry powder in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  },
  {
    sku: "RAY-SPI-BLP-100G",
    product_name: "Rayan Black Pepper 100g",
    product_description: "Rayan black pepper in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  },
  {
    sku: "RAY-SPI-GAR-100G",
    product_name: "Rayan Garlic Powder 100g",
    product_description: "Rayan garlic powder in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  },
  {
    sku: "RAY-SPI-GIN-100G",
    product_name: "Rayan Ginger Powder 100g",
    product_description: "Rayan ginger powder in a 100g pack.",
    brand: "Rayan Spices",
    category: "Spices",
    unit: "Packet",
    pack_size: "100g",
    storage_type: "Dry Store",
    track_expiry: true,
    track_batch: true,
    reorder_level: 60
  }
];

async function ensureOne(table, match, values, select = "*") {
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

async function ensureUnit(companyId, unitName, symbol) {
  const { data: byName, error: nameError } = await supabase
    .from("units_of_measure")
    .select("id, unit_name, symbol")
    .eq("company_id", companyId)
    .eq("unit_name", unitName)
    .maybeSingle();
  if (nameError) throw new Error(`units_of_measure lookup failed: ${nameError.message}`);
  if (byName) {
    const { data, error } = await supabase
      .from("units_of_measure")
      .update({ symbol, status: "Active" })
      .eq("id", byName.id)
      .select("id, unit_name, symbol")
      .single();
    if (error) throw new Error(`units_of_measure update failed: ${error.message}`);
    return data;
  }

  const { data: bySymbol, error: symbolError } = await supabase
    .from("units_of_measure")
    .select("id, unit_name, symbol")
    .eq("company_id", companyId)
    .eq("symbol", symbol)
    .maybeSingle();
  if (symbolError) throw new Error(`units_of_measure symbol lookup failed: ${symbolError.message}`);
  if (bySymbol) return bySymbol;

  const { data, error } = await supabase
    .from("units_of_measure")
    .insert({ company_id: companyId, unit_name: unitName, symbol, status: "Active" })
    .select("id, unit_name, symbol")
    .single();
  if (error) throw new Error(`units_of_measure insert failed: ${error.message}`);
  return data;
}

const { data: company, error: companyError } = await supabase
  .from("companies")
  .select("id, company_name")
  .eq("company_name", "Safa Dairy Ltd")
  .maybeSingle();

if (companyError) throw new Error(`Company lookup failed: ${companyError.message}`);
if (!company) throw new Error("Safa Dairy Ltd tenant was not found. Run the Safa Dairy setup seed first.");

const categoryByName = new Map();
for (const [category_name, description] of categories) {
  const category = await ensureOne(
    "product_categories",
    { company_id: company.id, category_name },
    { description, status: "Active" },
    "id, category_name"
  );
  categoryByName.set(category.category_name, category);
}

const unitByName = new Map();
for (const [unit_name, symbol] of units) {
  const unit = await ensureUnit(company.id, unit_name, symbol);
  unitByName.set(unit_name, unit);
}

const seeded = [];
for (const product of products) {
  const category = categoryByName.get(product.category);
  const unit = unitByName.get(product.unit);
  const record = await ensureOne(
    "products",
    { company_id: company.id, sku: product.sku },
    {
      product_name: product.product_name,
      product_description: product.product_description,
      brand: product.brand,
      category_id: category.id,
      unit_of_measure_id: unit.id,
      pack_size: product.pack_size,
      selling_price: 0,
      cost_price: 0,
      tax_category: "VAT",
      minimum_stock: 0,
      maximum_stock: 0,
      reorder_level: product.reorder_level,
      storage_type: product.storage_type,
      status: "Active",
      track_expiry: product.track_expiry,
      track_batch: product.track_batch,
      track_serial: false
    },
    "id, sku, product_name, brand"
  );
  seeded.push(record);
}

const { count, error: countError } = await supabase
  .from("products")
  .select("*", { count: "exact", head: true })
  .eq("company_id", company.id)
  .in("sku", products.map((product) => product.sku));

if (countError) throw new Error(`Verification failed: ${countError.message}`);

console.log(JSON.stringify({
  tenant: company.company_name,
  expectedProducts: products.length,
  verifiedProducts: count,
  seededProducts: seeded.map((product) => product.sku)
}, null, 2));
