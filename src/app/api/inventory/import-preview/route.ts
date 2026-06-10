import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";

const templates: Record<string, string[]> = {
  Products: ["SKU", "Product Name", "Category", "Unit of Measure", "Selling Price"],
  Customers: ["Customer Code", "Customer Name", "Customer Type", "Phone"],
  Suppliers: ["Supplier Code", "Supplier Name", "Phone"],
  Warehouses: ["Code", "Warehouse Name", "Warehouse Type"],
  "Opening Stock": ["Product SKU", "Warehouse Code", "Batch Number", "Expiry Date", "Quantity", "Unit Cost"],
  "Price Lists": ["Price List Name", "Customer Type", "Product SKU", "Standard Price"]
};

export async function POST(request: NextRequest) {
  const auth = await requireAppUser();
  if ("error" in auth) return auth.error;
  const { template, csv } = await request.json();
  const required = templates[template] ?? [];
  const [headerLine = "", ...lines] = String(csv ?? "").split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((h) => h.trim());
  const missing = required.filter((column) => !headers.includes(column));
  const rows = lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index] ?? `Column ${index + 1}`, value.trim()])));
  const errors = [
    ...missing.map((column) => `Missing required column: ${column}`),
    ...rows.length === 0 ? ["No data rows found."] : []
  ];
  return NextResponse.json({ template, required, headers, rows: rows.slice(0, 25), errors, canPost: errors.length === 0 });
}
