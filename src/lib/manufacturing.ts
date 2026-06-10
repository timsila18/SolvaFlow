import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FlaskConical,
  Gauge,
  PackageCheck,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Workflow,
  Wrench
} from "lucide-react";
import type { FieldType } from "@/lib/entities";

export type ManufacturingKey =
  | "recipes"
  | "recipe_versions"
  | "recipe_lines"
  | "production_plans"
  | "production_orders"
  | "production_material_reservations"
  | "production_material_issues"
  | "production_batches"
  | "product_quality_templates"
  | "quality_check_parameters"
  | "quality_checks"
  | "wastage_records"
  | "production_lines"
  | "machines"
  | "manufacturing_settings";

export type ManufacturingField = {
  key: string;
  label: string;
  type: FieldType | "datetime";
  required?: boolean;
  options?: string[];
  relation?: OptionSource;
};

export type OptionSource =
  | "products"
  | "product_categories"
  | "units_of_measure"
  | "warehouses"
  | "users"
  | "production_lines"
  | "machines"
  | "recipes"
  | "recipe_versions"
  | "production_plans"
  | "production_orders"
  | "production_batches"
  | "product_quality_templates";

export type ManufacturingConfig = {
  key: ManufacturingKey;
  table: string;
  title: string;
  singular: string;
  path: string;
  icon: LucideIcon;
  pageKey: string;
  searchFields: string[];
  listFields: string[];
  fields: ManufacturingField[];
  workflowActions?: Array<"submit" | "approve" | "activate" | "reserve" | "start" | "complete" | "qc_decision">;
};

const status = {
  recipe: ["Draft", "Submitted for Approval", "Approved", "Active", "Inactive", "Archived"],
  plan: ["Draft", "Planned", "Submitted for Approval", "Approved", "Converted", "Cancelled"],
  order: ["Draft", "Planned", "Approved", "Materials Reserved", "In Production", "Quality Check", "Completed", "Closed", "Cancelled"],
  active: ["Active", "Inactive"],
  line: ["Active", "Maintenance", "Inactive"],
  machine: ["Active", "Maintenance", "Inactive", "Out of Service"],
  priority: ["Low", "Normal", "High", "Urgent"],
  qcResult: ["Pass", "Fail", "Conditional Pass"],
  qcDecision: ["Approved for Stock", "Hold", "Rework Required", "Rejected", "Disposed"]
};

export const manufacturingConfigs: Record<ManufacturingKey, ManufacturingConfig> = {
  recipes: {
    key: "recipes",
    table: "recipes",
    title: "Recipes / BOM",
    singular: "Recipe",
    path: "/manufacturing/recipes",
    icon: FlaskConical,
    pageKey: "recipes",
    searchFields: ["recipe_code", "recipe_name", "description"],
    listFields: ["recipe_code", "recipe_name", "finished_product_id", "status", "created_at"],
    workflowActions: ["submit", "approve", "activate"],
    fields: [
      { key: "recipe_code", label: "Recipe Code", type: "text" },
      { key: "finished_product_id", label: "Finished Product", type: "select", relation: "products", required: true },
      { key: "recipe_name", label: "Recipe Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.recipe }
    ]
  },
  recipe_versions: {
    key: "recipe_versions",
    table: "recipe_versions",
    title: "Recipe Versions",
    singular: "Recipe Version",
    path: "/manufacturing/recipe-versions",
    icon: Workflow,
    pageKey: "recipes",
    searchFields: ["recipe_name", "description"],
    listFields: ["recipe_name", "version_number", "output_quantity", "total_raw_material_cost", "expected_cost_per_output_unit", "status"],
    workflowActions: ["submit", "approve", "activate"],
    fields: [
      { key: "recipe_id", label: "Recipe", type: "select", relation: "recipes", required: true },
      { key: "finished_product_id", label: "Finished Product", type: "select", relation: "products", required: true },
      { key: "version_number", label: "Version Number", type: "number", required: true },
      { key: "recipe_name", label: "Recipe Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "output_quantity", label: "Output Quantity", type: "number", required: true },
      { key: "output_unit_of_measure_id", label: "Output Unit", type: "select", relation: "units_of_measure" },
      { key: "production_yield_percentage", label: "Yield %", type: "number" },
      { key: "standard_production_time_minutes", label: "Standard Time Minutes", type: "number" },
      { key: "effective_date", label: "Effective Date", type: "date" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: status.recipe }
    ]
  },
  recipe_lines: {
    key: "recipe_lines",
    table: "recipe_lines",
    title: "Recipe Ingredient Lines",
    singular: "Recipe Line",
    path: "/manufacturing/recipe-lines",
    icon: ClipboardList,
    pageKey: "recipes",
    searchFields: ["item_type", "required_stage", "notes"],
    listFields: ["input_item_id", "item_type", "quantity_required", "unit_cost", "total_cost", "required_stage"],
    fields: [
      { key: "recipe_version_id", label: "Recipe Version", type: "select", relation: "recipe_versions", required: true },
      { key: "input_item_id", label: "Input Item", type: "select", relation: "products", required: true },
      { key: "item_type", label: "Item Type", type: "select", options: ["Raw Material", "Packaging", "Semi-Finished Good", "Consumable"], required: true },
      { key: "quantity_required", label: "Quantity Required", type: "number", required: true },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "unit_cost", label: "Unit Cost", type: "currency" },
      { key: "wastage_allowance_percentage", label: "Wastage Allowance %", type: "number" },
      { key: "required_stage", label: "Required Stage", type: "text" },
      { key: "is_mandatory", label: "Mandatory", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  production_plans: {
    key: "production_plans",
    table: "production_plans",
    title: "Production Planning",
    singular: "Production Plan",
    path: "/manufacturing/planning",
    icon: ClipboardList,
    pageKey: "production_planning",
    searchFields: ["plan_number", "priority", "notes"],
    listFields: ["plan_number", "product_id", "quantity_required", "planned_production_date", "priority", "status"],
    workflowActions: ["approve"],
    fields: [
      { key: "plan_number", label: "Plan Number", type: "text" },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "recipe_version_id", label: "Recipe Version", type: "select", relation: "recipe_versions" },
      { key: "quantity_required", label: "Quantity Required", type: "number", required: true },
      { key: "planned_production_date", label: "Planned Production Date", type: "date", required: true },
      { key: "required_completion_date", label: "Required Completion Date", type: "date" },
      { key: "production_line_id", label: "Production Line", type: "select", relation: "production_lines" },
      { key: "assigned_supervisor_id", label: "Supervisor", type: "select", relation: "users" },
      { key: "priority", label: "Priority", type: "select", options: status.priority },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.plan }
    ]
  },
  production_orders: {
    key: "production_orders",
    table: "production_orders",
    title: "Production Orders",
    singular: "Production Order",
    path: "/manufacturing/orders",
    icon: Factory,
    pageKey: "production_orders",
    searchFields: ["production_order_number", "priority", "notes"],
    listFields: ["production_order_number", "finished_product_id", "planned_quantity", "production_date", "priority", "status"],
    workflowActions: ["approve", "reserve", "start", "complete"],
    fields: [
      { key: "production_order_number", label: "Order Number", type: "text" },
      { key: "production_plan_id", label: "Production Plan", type: "select", relation: "production_plans" },
      { key: "finished_product_id", label: "Finished Product", type: "select", relation: "products", required: true },
      { key: "recipe_version_id", label: "Recipe Version", type: "select", relation: "recipe_versions", required: true },
      { key: "planned_quantity", label: "Planned Quantity", type: "number", required: true },
      { key: "actual_quantity", label: "Actual Quantity", type: "number" },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "production_date", label: "Production Date", type: "date", required: true },
      { key: "expected_completion_date", label: "Expected Completion Date", type: "date" },
      { key: "assigned_supervisor_id", label: "Supervisor", type: "select", relation: "users" },
      { key: "production_line_id", label: "Production Line", type: "select", relation: "production_lines" },
      { key: "machine_id", label: "Machine", type: "select", relation: "machines" },
      { key: "priority", label: "Priority", type: "select", options: status.priority },
      { key: "staff_involved", label: "Staff Involved", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.order }
    ]
  },
  production_material_reservations: {
    key: "production_material_reservations",
    table: "production_material_reservations",
    title: "Material Reservations",
    singular: "Reservation",
    path: "/manufacturing/reservations",
    icon: PackageCheck,
    pageKey: "production_orders",
    searchFields: ["status"],
    listFields: ["production_order_id", "item_id", "required_quantity", "reserved_quantity", "shortage_quantity", "status"],
    fields: [
      { key: "production_order_id", label: "Production Order", type: "select", relation: "production_orders", required: true },
      { key: "item_id", label: "Item", type: "select", relation: "products", required: true },
      { key: "source_warehouse_id", label: "Source Warehouse", type: "select", relation: "warehouses" },
      { key: "required_quantity", label: "Required Quantity", type: "number" },
      { key: "reserved_quantity", label: "Reserved Quantity", type: "number" },
      { key: "available_quantity_snapshot", label: "Available Snapshot", type: "number" },
      { key: "shortage_quantity", label: "Shortage Quantity", type: "number" },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Reserved", "Issued", "Released", "Shortage"] }
    ]
  },
  production_material_issues: {
    key: "production_material_issues",
    table: "production_material_issues",
    title: "Material Issue to Production",
    singular: "Material Issue",
    path: "/manufacturing/material-issues",
    icon: PackageCheck,
    pageKey: "production_orders",
    searchFields: ["issue_number", "destination"],
    listFields: ["issue_number", "production_order_id", "item_id", "quantity_issued", "destination", "issued_at"],
    fields: [
      { key: "issue_number", label: "Issue Number", type: "text" },
      { key: "production_order_id", label: "Production Order", type: "select", relation: "production_orders", required: true },
      { key: "source_warehouse_id", label: "Source Warehouse", type: "select", relation: "warehouses" },
      { key: "destination", label: "Destination", type: "text" },
      { key: "item_id", label: "Item", type: "select", relation: "products", required: true },
      { key: "quantity_issued", label: "Quantity Issued", type: "number", required: true },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "issued_by", label: "Issued By", type: "select", relation: "users" },
      { key: "received_by", label: "Received By", type: "select", relation: "users" }
    ]
  },
  production_batches: {
    key: "production_batches",
    table: "production_batches",
    title: "Batch Management",
    singular: "Batch",
    path: "/manufacturing/batches",
    icon: Gauge,
    pageKey: "batch_management",
    searchFields: ["batch_number", "quality_status", "notes"],
    listFields: ["batch_number", "product_id", "production_date", "expiry_date", "quantity_available", "quality_status"],
    fields: [
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "production_order_id", label: "Production Order", type: "select", relation: "production_orders", required: true },
      { key: "recipe_version_id", label: "Recipe Version", type: "select", relation: "recipe_versions", required: true },
      { key: "production_date", label: "Production Date", type: "date", required: true },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "shelf_life_days", label: "Shelf Life Days", type: "number" },
      { key: "quantity_produced", label: "Quantity Produced", type: "number" },
      { key: "quantity_available", label: "Quantity Available", type: "number" },
      { key: "quality_status", label: "Quality Status", type: "select", options: status.qcDecision },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses" },
      { key: "supervisor_id", label: "Supervisor", type: "select", relation: "users" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  product_quality_templates: {
    key: "product_quality_templates",
    table: "product_quality_templates",
    title: "QC Templates",
    singular: "QC Template",
    path: "/manufacturing/qc-templates",
    icon: SlidersHorizontal,
    pageKey: "quality_control",
    searchFields: ["template_name", "status"],
    listFields: ["template_name", "product_category_id", "product_id", "status"],
    fields: [
      { key: "product_category_id", label: "Product Category", type: "select", relation: "product_categories" },
      { key: "product_id", label: "Product", type: "select", relation: "products" },
      { key: "template_name", label: "Template Name", type: "text", required: true },
      { key: "status", label: "Status", type: "select", options: status.active }
    ]
  },
  quality_check_parameters: {
    key: "quality_check_parameters",
    table: "quality_check_parameters",
    title: "QC Parameters",
    singular: "QC Parameter",
    path: "/manufacturing/qc-parameters",
    icon: SlidersHorizontal,
    pageKey: "quality_control",
    searchFields: ["parameter_name", "parameter_type"],
    listFields: ["template_id", "parameter_name", "parameter_type", "target_value", "is_required"],
    fields: [
      { key: "template_id", label: "Template", type: "select", relation: "product_quality_templates" },
      { key: "parameter_name", label: "Parameter Name", type: "text", required: true },
      { key: "parameter_type", label: "Parameter Type", type: "select", options: ["Text", "Number", "Pass/Fail", "Temperature", "Percentage"] },
      { key: "target_value", label: "Target Value", type: "text" },
      { key: "min_value", label: "Minimum Value", type: "number" },
      { key: "max_value", label: "Maximum Value", type: "number" },
      { key: "is_required", label: "Required", type: "checkbox" },
      { key: "display_order", label: "Display Order", type: "number" }
    ]
  },
  quality_checks: {
    key: "quality_checks",
    table: "quality_checks",
    title: "Quality Control",
    singular: "Quality Check",
    path: "/manufacturing/quality",
    icon: ClipboardCheck,
    pageKey: "quality_control",
    searchFields: ["qc_number", "inspection_type", "result", "decision", "comments"],
    listFields: ["qc_number", "inspection_type", "product_id", "result", "decision", "inspection_date"],
    workflowActions: ["qc_decision"],
    fields: [
      { key: "qc_number", label: "QC Number", type: "text" },
      { key: "production_order_id", label: "Production Order", type: "select", relation: "production_orders" },
      { key: "batch_id", label: "Batch", type: "select", relation: "production_batches" },
      { key: "product_id", label: "Product", type: "select", relation: "products" },
      { key: "inspection_type", label: "Inspection Type", type: "select", options: ["Before Production", "During Production", "After Production", "Before Dispatch"], required: true },
      { key: "inspector_id", label: "Inspector", type: "select", relation: "users" },
      { key: "parameters_checked", label: "Parameters Checked JSON", type: "textarea" },
      { key: "result", label: "Result", type: "select", options: status.qcResult },
      { key: "decision", label: "Decision", type: "select", options: status.qcDecision },
      { key: "corrective_action", label: "Corrective Action", type: "textarea" },
      { key: "comments", label: "Comments", type: "textarea" },
      { key: "attachment_urls", label: "Attachments / Photos URLs", type: "textarea" }
    ]
  },
  wastage_records: {
    key: "wastage_records",
    table: "wastage_records",
    title: "Wastage & Variance",
    singular: "Wastage Record",
    path: "/manufacturing/wastage",
    icon: AlertTriangle,
    pageKey: "wastage_variance",
    searchFields: ["wastage_reason", "responsible_department", "notes"],
    listFields: ["production_order_id", "item_id", "expected_quantity", "actual_quantity_used", "wastage_quantity", "wastage_reason"],
    fields: [
      { key: "production_order_id", label: "Production Order", type: "select", relation: "production_orders", required: true },
      { key: "item_id", label: "Item", type: "select", relation: "products", required: true },
      { key: "expected_quantity", label: "Expected Quantity", type: "number" },
      { key: "actual_quantity_used", label: "Actual Quantity Used", type: "number" },
      { key: "wastage_quantity", label: "Wastage Quantity", type: "number" },
      { key: "wastage_percentage", label: "Wastage %", type: "number" },
      { key: "wastage_reason", label: "Wastage Reason", type: "select", options: ["Spillage", "Machine loss", "Overuse", "Damaged packaging", "Expired raw material", "Quality failure", "Human error", "Other"], required: true },
      { key: "responsible_department", label: "Responsible Department", type: "text" },
      { key: "wastage_cost", label: "Wastage Cost", type: "currency" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  production_lines: {
    key: "production_lines",
    table: "production_lines",
    title: "Production Lines",
    singular: "Production Line",
    path: "/manufacturing/lines",
    icon: Workflow,
    pageKey: "settings",
    searchFields: ["line_name", "line_code", "status"],
    listFields: ["line_code", "line_name", "capacity_per_hour", "status"],
    fields: [
      { key: "line_name", label: "Line Name", type: "text", required: true },
      { key: "line_code", label: "Line Code", type: "text", required: true },
      { key: "product_category_id", label: "Product Category Supported", type: "select", relation: "product_categories" },
      { key: "capacity_per_hour", label: "Capacity Per Hour", type: "number" },
      { key: "supervisor_id", label: "Supervisor", type: "select", relation: "users" },
      { key: "status", label: "Status", type: "select", options: status.line },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  machines: {
    key: "machines",
    table: "machines",
    title: "Machines / Equipment",
    singular: "Machine",
    path: "/manufacturing/machines",
    icon: Wrench,
    pageKey: "settings",
    searchFields: ["machine_code", "machine_name", "category", "status"],
    listFields: ["machine_code", "machine_name", "production_line_id", "next_service_date", "status"],
    fields: [
      { key: "machine_code", label: "Machine Code", type: "text", required: true },
      { key: "machine_name", label: "Machine Name", type: "text", required: true },
      { key: "production_line_id", label: "Production Line", type: "select", relation: "production_lines" },
      { key: "category", label: "Category", type: "text" },
      { key: "capacity", label: "Capacity", type: "text" },
      { key: "last_service_date", label: "Last Service Date", type: "date" },
      { key: "next_service_date", label: "Next Service Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: status.machine },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  manufacturing_settings: {
    key: "manufacturing_settings",
    table: "manufacturing_settings",
    title: "Manufacturing Settings",
    singular: "Manufacturing Settings",
    path: "/manufacturing/settings",
    icon: Settings,
    pageKey: "settings",
    searchFields: ["batch_number_prefix", "batch_number_pattern"],
    listFields: ["batch_number_prefix", "batch_number_pattern", "reserve_materials_on_approval", "deduct_materials_on_start", "require_qc_before_stock"],
    fields: [
      { key: "batch_number_prefix", label: "Batch Number Prefix", type: "text" },
      { key: "batch_number_pattern", label: "Batch Number Pattern", type: "text" },
      { key: "reserve_materials_on_approval", label: "Reserve Materials on Approval", type: "checkbox" },
      { key: "deduct_materials_on_start", label: "Deduct Materials on Start", type: "checkbox" },
      { key: "require_qc_before_stock", label: "Require QC Before Stock", type: "checkbox" },
      { key: "default_shelf_life_days", label: "Default Shelf Life Days", type: "number" },
      { key: "allow_shortage_override", label: "Allow Shortage Override", type: "checkbox" }
    ]
  }
};

export const manufacturingNavigation = [
  { label: "Production Dashboard", href: "/manufacturing", icon: Gauge },
  { label: "Recipes / BOM", href: "/manufacturing/recipes", icon: FlaskConical },
  { label: "Recipe Versions", href: "/manufacturing/recipe-versions", icon: Workflow },
  { label: "Recipe Lines", href: "/manufacturing/recipe-lines", icon: ClipboardList },
  { label: "Production Planning", href: "/manufacturing/planning", icon: ClipboardList },
  { label: "Production Orders", href: "/manufacturing/orders", icon: Factory },
  { label: "Material Reservations", href: "/manufacturing/reservations", icon: PackageCheck },
  { label: "Material Issues", href: "/manufacturing/material-issues", icon: PackageCheck },
  { label: "Batch Management", href: "/manufacturing/batches", icon: Gauge },
  { label: "Quality Control", href: "/manufacturing/quality", icon: ClipboardCheck },
  { label: "QC Templates", href: "/manufacturing/qc-templates", icon: SlidersHorizontal },
  { label: "QC Parameters", href: "/manufacturing/qc-parameters", icon: SlidersHorizontal },
  { label: "Wastage & Variance", href: "/manufacturing/wastage", icon: AlertTriangle },
  { label: "Manufacturing Reports", href: "/manufacturing/reports", icon: ScrollText },
  { label: "Production Lines", href: "/manufacturing/lines", icon: Workflow },
  { label: "Machines", href: "/manufacturing/machines", icon: Wrench },
  { label: "Manufacturing Settings", href: "/manufacturing/settings", icon: Settings }
];
