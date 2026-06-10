import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Building2,
  Car,
  Factory,
  Map,
  Package,
  Ruler,
  ShieldCheck,
  Store,
  Truck,
  Users
} from "lucide-react";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "currency"
  | "date"
  | "textarea"
  | "checkbox"
  | "select";

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relation?: {
    entity: EntityKey;
    label: string;
  };
};

export type EntityKey =
  | "product_categories"
  | "units_of_measure"
  | "products"
  | "customers"
  | "suppliers"
  | "warehouses"
  | "territories"
  | "vehicles"
  | "routes";

export type EntityConfig = {
  key: EntityKey;
  table: string;
  module: string;
  title: string;
  singular: string;
  path: string;
  codePrefix?: string;
  codeField?: string;
  icon: LucideIcon;
  searchFields: string[];
  listFields: string[];
  fields: FieldConfig[];
};

const statusOptions = ["Active", "Inactive", "Suspended"];
const activeOptions = ["Active", "Inactive"];

export const entityConfigs: Record<EntityKey, EntityConfig> = {
  product_categories: {
    key: "product_categories",
    table: "product_categories",
    module: "master_data",
    title: "Product Categories",
    singular: "Product Category",
    path: "/master-data/product-categories",
    icon: Boxes,
    searchFields: ["category_name", "description"],
    listFields: ["category_name", "description", "status"],
    fields: [
      { key: "category_name", label: "Category Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  units_of_measure: {
    key: "units_of_measure",
    table: "units_of_measure",
    module: "master_data",
    title: "Units of Measure",
    singular: "Unit",
    path: "/master-data/units",
    icon: Ruler,
    searchFields: ["unit_name", "symbol"],
    listFields: ["unit_name", "symbol", "base_unit_name", "conversion_factor", "status"],
    fields: [
      { key: "unit_name", label: "Unit Name", type: "text", required: true },
      { key: "symbol", label: "Symbol", type: "text", required: true },
      { key: "base_unit_name", label: "Base Unit", type: "text" },
      { key: "conversion_factor", label: "Conversion Factor", type: "number" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  products: {
    key: "products",
    table: "products",
    module: "master_data",
    title: "Products",
    singular: "Product",
    path: "/master-data/products",
    codePrefix: "PRD",
    codeField: "sku",
    icon: Package,
    searchFields: ["sku", "barcode", "product_name", "brand"],
    listFields: ["sku", "product_name", "brand", "selling_price", "reorder_level", "status"],
    fields: [
      { key: "sku", label: "SKU", type: "text" },
      { key: "barcode", label: "Barcode", type: "text" },
      { key: "product_name", label: "Product Name", type: "text", required: true },
      { key: "product_description", label: "Product Description", type: "textarea" },
      { key: "brand", label: "Brand", type: "select", options: ["Rayan Ice Cream", "Rayan Syrups", "Rayan Spices", "Other"] },
      { key: "category_id", label: "Category", type: "select", relation: { entity: "product_categories", label: "category_name" } },
      { key: "unit_of_measure_id", label: "Unit of Measure", type: "select", relation: { entity: "units_of_measure", label: "unit_name" } },
      { key: "pack_size", label: "Pack Size", type: "text" },
      { key: "selling_price", label: "Selling Price", type: "currency" },
      { key: "cost_price", label: "Cost Price", type: "currency" },
      { key: "tax_category", label: "Tax Category", type: "text" },
      { key: "minimum_stock", label: "Minimum Stock", type: "number" },
      { key: "maximum_stock", label: "Maximum Stock", type: "number" },
      { key: "reorder_level", label: "Reorder Level", type: "number" },
      { key: "storage_type", label: "Storage Type", type: "select", options: ["Ambient", "Chilled", "Frozen", "Dry", "Hazardous"] },
      { key: "product_image_url", label: "Product Image URL", type: "text" },
      { key: "track_expiry", label: "Track Expiry", type: "checkbox" },
      { key: "track_batch", label: "Track Batch", type: "checkbox" },
      { key: "track_serial", label: "Track Serial", type: "checkbox" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  customers: {
    key: "customers",
    table: "customers",
    module: "customers",
    title: "Customers",
    singular: "Customer",
    path: "/master-data/customers",
    codePrefix: "CUS",
    codeField: "customer_code",
    icon: Store,
    searchFields: ["customer_code", "customer_name", "phone", "email", "county"],
    listFields: ["customer_code", "customer_name", "customer_type", "phone", "credit_limit", "status"],
    fields: [
      { key: "customer_code", label: "Customer Code", type: "text" },
      { key: "customer_name", label: "Customer Name", type: "text", required: true },
      { key: "customer_type", label: "Customer Type", type: "select", options: ["Distributor", "Wholesaler", "Retailer", "Supermarket", "Institution", "Direct Customer"], required: true },
      { key: "pin_number", label: "PIN Number", type: "text" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "physical_address", label: "Physical Address", type: "textarea" },
      { key: "county", label: "County", type: "text" },
      { key: "gps_coordinates", label: "GPS Coordinates", type: "text" },
      { key: "credit_limit", label: "Credit Limit", type: "currency" },
      { key: "payment_terms", label: "Payment Terms", type: "text" },
      { key: "assigned_sales_rep_id", label: "Assigned Sales Rep", type: "select", relation: { entity: "customers", label: "customer_name" } },
      { key: "customer_portal_access", label: "Customer Portal Access", type: "checkbox" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  suppliers: {
    key: "suppliers",
    table: "suppliers",
    module: "procurement",
    title: "Suppliers",
    singular: "Supplier",
    path: "/master-data/suppliers",
    codePrefix: "SUP",
    codeField: "supplier_code",
    icon: Truck,
    searchFields: ["supplier_code", "supplier_name", "pin", "phone", "email"],
    listFields: ["supplier_code", "supplier_name", "phone", "payment_terms", "lead_time_days", "status"],
    fields: [
      { key: "supplier_code", label: "Supplier Code", type: "text" },
      { key: "supplier_name", label: "Supplier Name", type: "text", required: true },
      { key: "pin", label: "PIN", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "products_supplied", label: "Products Supplied", type: "textarea" },
      { key: "payment_terms", label: "Payment Terms", type: "text" },
      { key: "lead_time_days", label: "Lead Time Days", type: "number" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  warehouses: {
    key: "warehouses",
    table: "warehouses",
    module: "warehousing",
    title: "Warehouses",
    singular: "Warehouse",
    path: "/master-data/warehouses",
    codePrefix: "WH",
    codeField: "code",
    icon: Building2,
    searchFields: ["warehouse_name", "code", "location"],
    listFields: ["code", "warehouse_name", "warehouse_type", "location", "status"],
    fields: [
      { key: "warehouse_name", label: "Warehouse Name", type: "text", required: true },
      { key: "code", label: "Code", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "gps_coordinates", label: "GPS Coordinates", type: "text" },
      { key: "manager_id", label: "Manager User ID", type: "text" },
      { key: "warehouse_type", label: "Warehouse Type", type: "select", options: ["Raw Materials", "Production", "Finished Goods", "Dispatch", "External"], required: true },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  territories: {
    key: "territories",
    table: "territories",
    module: "sales",
    title: "Territories",
    singular: "Territory",
    path: "/master-data/territories",
    icon: Map,
    searchFields: ["territory_name", "region"],
    listFields: ["territory_name", "region", "assigned_sales_rep_id", "status"],
    fields: [
      { key: "territory_name", label: "Territory Name", type: "text", required: true },
      { key: "region", label: "Region", type: "text" },
      { key: "assigned_sales_rep_id", label: "Assigned Sales Rep User ID", type: "text" },
      { key: "customer_ids", label: "Customer IDs", type: "textarea" },
      { key: "route_ids", label: "Route IDs", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  },
  vehicles: {
    key: "vehicles",
    table: "vehicles",
    module: "fleet",
    title: "Vehicles",
    singular: "Vehicle",
    path: "/master-data/vehicles",
    codePrefix: "VEH",
    codeField: "vehicle_code",
    icon: Car,
    searchFields: ["vehicle_code", "registration_number", "vehicle_type"],
    listFields: ["vehicle_code", "registration_number", "vehicle_type", "capacity", "status"],
    fields: [
      { key: "vehicle_code", label: "Vehicle Code", type: "text" },
      { key: "registration_number", label: "Registration Number", type: "text", required: true },
      { key: "vehicle_type", label: "Vehicle Type", type: "text" },
      { key: "capacity", label: "Capacity", type: "text" },
      { key: "driver_id", label: "Driver User ID", type: "text" },
      { key: "insurance_expiry", label: "Insurance Expiry", type: "date" },
      { key: "service_date", label: "Service Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Available", "On Delivery", "Maintenance", "Inactive"], required: true }
    ]
  },
  routes: {
    key: "routes",
    table: "routes",
    module: "distribution",
    title: "Routes",
    singular: "Route",
    path: "/master-data/routes",
    icon: Factory,
    searchFields: ["route_name", "region"],
    listFields: ["route_name", "region", "distance_km", "estimated_travel_time", "status"],
    fields: [
      { key: "route_name", label: "Route Name", type: "text", required: true },
      { key: "region", label: "Region", type: "text" },
      { key: "territory_id", label: "Territory", type: "select", relation: { entity: "territories", label: "territory_name" } },
      { key: "distance_km", label: "Distance KM", type: "number" },
      { key: "estimated_travel_time", label: "Estimated Travel Time", type: "text" },
      { key: "assigned_driver_id", label: "Assigned Driver User ID", type: "text" },
      { key: "assigned_sales_rep_id", label: "Assigned Sales Rep User ID", type: "text" },
      { key: "status", label: "Status", type: "select", options: activeOptions, required: true }
    ]
  }
};

export const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: ShieldCheck },
  { label: "Products", href: "/master-data/products", icon: Package },
  { label: "Customers", href: "/master-data/customers", icon: Store },
  { label: "Suppliers", href: "/master-data/suppliers", icon: Truck },
  { label: "Warehouses", href: "/master-data/warehouses", icon: Building2 },
  { label: "Users", href: "/settings/users", icon: Users }
];
