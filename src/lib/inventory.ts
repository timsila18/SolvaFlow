import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  RotateCcw,
  ScrollText,
  Settings,
  Tags,
  Truck
} from "lucide-react";
import type { FieldType } from "@/lib/entities";

export type InventoryKey =
  | "stock_balances"
  | "stock_ledger"
  | "warehouse_transfers"
  | "warehouse_transfer_lines"
  | "stock_adjustments"
  | "stock_adjustment_lines"
  | "stock_counts"
  | "stock_count_lines"
  | "reorder_alerts"
  | "procurement_requests"
  | "procurement_request_lines"
  | "purchase_orders"
  | "purchase_order_lines"
  | "goods_received_notes"
  | "goods_received_note_lines"
  | "supplier_returns"
  | "supplier_return_lines"
  | "opening_balances"
  | "opening_balance_lines"
  | "price_lists"
  | "price_list_lines"
  | "inventory_settings";

export type InventoryOptionSource =
  | "products"
  | "product_categories"
  | "units_of_measure"
  | "warehouses"
  | "suppliers"
  | "users"
  | "production_batches"
  | "warehouse_transfers"
  | "stock_adjustments"
  | "stock_counts"
  | "procurement_requests"
  | "purchase_orders"
  | "purchase_order_lines"
  | "goods_received_notes"
  | "supplier_returns"
  | "opening_balances"
  | "price_lists";

export type InventoryField = {
  key: string;
  label: string;
  type: FieldType | "datetime";
  required?: boolean;
  options?: string[];
  relation?: InventoryOptionSource;
};

export type InventoryConfig = {
  key: InventoryKey;
  table: string;
  title: string;
  singular: string;
  path: string;
  icon: LucideIcon;
  searchFields: string[];
  listFields: string[];
  fields: InventoryField[];
  workflowActions?: Array<"submit" | "approve" | "post" | "dispatch" | "receive" | "convert">;
};

const status = {
  transfer: ["Draft", "Submitted", "Approved", "In Transit", "Received", "Cancelled"],
  adjustment: ["Draft", "Submitted", "Approved", "Posted", "Rejected", "Cancelled"],
  count: ["Draft", "In Progress", "Submitted", "Reviewed", "Approved", "Posted"],
  reorder: ["Open", "Acknowledged", "Converted to Procurement Request", "Closed"],
  procurement: ["Draft", "Submitted", "Approved", "Rejected", "Converted to Purchase Order", "Cancelled"],
  po: ["Draft", "Submitted", "Approved", "Sent to Supplier", "Partially Received", "Fully Received", "Closed", "Cancelled"],
  grn: ["Draft", "Posted", "Cancelled"],
  supplierReturn: ["Draft", "Approved", "Dispatched to Supplier", "Closed"],
  opening: ["Draft", "Uploaded", "Approved", "Posted", "Rejected"],
  active: ["Active", "Inactive", "Archived"],
  qc: ["Approved", "On Hold", "Rework", "Rejected", "Damaged", "Expired", "Disposed"],
  priority: ["Low", "Normal", "High", "Urgent"]
};

export const inventoryConfigs: Record<InventoryKey, InventoryConfig> = {
  stock_balances: {
    key: "stock_balances", table: "stock_balances", title: "Stock Balances", singular: "Stock Balance", path: "/inventory/balances", icon: Boxes,
    searchFields: ["batch_number", "qc_status"], listFields: ["product_id", "warehouse_id", "batch_number", "expiry_date", "available_quantity", "total_value"],
    fields: [
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "batch_id", label: "Batch", type: "select", relation: "production_batches" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "qc_status", label: "QC Status", type: "select", options: status.qc },
      { key: "total_quantity", label: "Total Quantity", type: "number" },
      { key: "reserved_quantity", label: "Reserved Quantity", type: "number" },
      { key: "qc_hold_quantity", label: "QC Hold Quantity", type: "number" },
      { key: "damaged_quantity", label: "Damaged Quantity", type: "number" },
      { key: "expired_quantity", label: "Expired Quantity", type: "number" },
      { key: "in_transit_quantity", label: "In Transit Quantity", type: "number" },
      { key: "weighted_average_cost", label: "Weighted Average Cost", type: "currency" }
    ]
  },
  stock_ledger: {
    key: "stock_ledger", table: "stock_ledger", title: "Stock Ledger", singular: "Ledger Entry", path: "/inventory/ledger", icon: ScrollText,
    searchFields: ["transaction_number", "transaction_type", "batch_number", "reference_document"], listFields: ["transaction_number", "transaction_type", "product_id", "warehouse_id", "quantity_in", "quantity_out", "balance_after_transaction"],
    fields: [
      { key: "transaction_number", label: "Transaction Number", type: "text" },
      { key: "transaction_type", label: "Transaction Type", type: "select", options: ["Opening Balance", "Purchase Receipt", "Production Issue", "Production Output", "Warehouse Transfer", "Sales Dispatch", "Return from Customer", "Supplier Return", "Stock Adjustment", "Stock Count Gain", "Stock Count Loss", "Damage", "Expiry Write-Off"], required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "quantity_in", label: "Quantity In", type: "number" },
      { key: "quantity_out", label: "Quantity Out", type: "number" },
      { key: "unit_cost", label: "Unit Cost", type: "currency" },
      { key: "reference_document", label: "Reference Document", type: "text" }
    ]
  },
  warehouse_transfers: {
    key: "warehouse_transfers", table: "warehouse_transfers", title: "Warehouse Transfers", singular: "Warehouse Transfer", path: "/inventory/transfers", icon: ArrowLeftRight,
    searchFields: ["transfer_number", "reason", "status"], listFields: ["transfer_number", "source_warehouse_id", "destination_warehouse_id", "status", "created_at"],
    workflowActions: ["submit", "approve", "dispatch", "receive"],
    fields: [
      { key: "transfer_number", label: "Transfer Number", type: "text" },
      { key: "source_warehouse_id", label: "Source Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "destination_warehouse_id", label: "Destination Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "reason", label: "Reason", type: "textarea" },
      { key: "requested_by", label: "Requested By", type: "select", relation: "users" },
      { key: "status", label: "Status", type: "select", options: status.transfer }
    ]
  },
  warehouse_transfer_lines: {
    key: "warehouse_transfer_lines", table: "warehouse_transfer_lines", title: "Transfer Lines", singular: "Transfer Line", path: "/inventory/transfer-lines", icon: ArrowLeftRight,
    searchFields: ["batch_number", "status"], listFields: ["transfer_id", "product_id", "batch_number", "quantity", "unit_cost", "status"],
    fields: [
      { key: "transfer_id", label: "Transfer", type: "select", relation: "warehouse_transfers", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "batch_id", label: "Batch", type: "select", relation: "production_batches" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "unit_cost", label: "Unit Cost", type: "currency" }
    ]
  },
  stock_adjustments: {
    key: "stock_adjustments", table: "stock_adjustments", title: "Stock Adjustments", singular: "Stock Adjustment", path: "/inventory/adjustments", icon: ClipboardCheck,
    searchFields: ["adjustment_number", "adjustment_type", "reason", "status"], listFields: ["adjustment_number", "adjustment_type", "reason", "status", "created_at"],
    workflowActions: ["submit", "approve", "post"],
    fields: [
      { key: "adjustment_number", label: "Adjustment Number", type: "text" },
      { key: "adjustment_type", label: "Adjustment Type", type: "select", options: ["Increase", "Decrease", "Damage", "Expiry", "Correction", "Write-off"], required: true },
      { key: "reason", label: "Reason", type: "textarea", required: true },
      { key: "supporting_attachment_url", label: "Supporting Attachment", type: "text" },
      { key: "requested_by", label: "Requested By", type: "select", relation: "users" },
      { key: "status", label: "Status", type: "select", options: status.adjustment }
    ]
  },
  stock_adjustment_lines: {
    key: "stock_adjustment_lines", table: "stock_adjustment_lines", title: "Adjustment Lines", singular: "Adjustment Line", path: "/inventory/adjustment-lines", icon: ClipboardCheck,
    searchFields: ["batch_number"], listFields: ["adjustment_id", "product_id", "warehouse_id", "current_quantity", "adjustment_quantity", "new_quantity"],
    fields: [
      { key: "adjustment_id", label: "Adjustment", type: "select", relation: "stock_adjustments", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "current_quantity", label: "Current Quantity", type: "number" },
      { key: "adjustment_quantity", label: "Adjustment Quantity", type: "number" },
      { key: "new_quantity", label: "New Quantity", type: "number" },
      { key: "unit_cost", label: "Unit Cost", type: "currency" }
    ]
  },
  stock_counts: {
    key: "stock_counts", table: "stock_counts", title: "Stock Counts", singular: "Stock Count", path: "/inventory/counts", icon: ClipboardList,
    searchFields: ["count_number", "count_team", "status"], listFields: ["count_number", "warehouse_id", "count_date", "count_team", "status"],
    workflowActions: ["submit", "approve", "post"],
    fields: [
      { key: "count_number", label: "Count Number", type: "text" },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "count_date", label: "Count Date", type: "date", required: true },
      { key: "count_team", label: "Count Team", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.count }
    ]
  },
  stock_count_lines: {
    key: "stock_count_lines", table: "stock_count_lines", title: "Stock Count Lines", singular: "Stock Count Line", path: "/inventory/count-lines", icon: ClipboardList,
    searchFields: ["batch_number", "reason"], listFields: ["stock_count_id", "product_id", "system_quantity", "counted_quantity", "variance", "variance_value"],
    fields: [
      { key: "stock_count_id", label: "Stock Count", type: "select", relation: "stock_counts", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "system_quantity", label: "System Quantity", type: "number" },
      { key: "counted_quantity", label: "Counted Quantity", type: "number" },
      { key: "variance_value", label: "Variance Value", type: "currency" },
      { key: "reason", label: "Reason", type: "textarea" }
    ]
  },
  reorder_alerts: {
    key: "reorder_alerts", table: "reorder_alerts", title: "Reorder Alerts", singular: "Reorder Alert", path: "/inventory/reorder-alerts", icon: AlertTriangle,
    searchFields: ["source", "status"], listFields: ["product_id", "warehouse_id", "current_stock", "reorder_level", "suggested_reorder_quantity", "status"],
    workflowActions: ["convert"],
    fields: [
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses" },
      { key: "current_stock", label: "Current Stock", type: "number" },
      { key: "reorder_level", label: "Reorder Level", type: "number" },
      { key: "suggested_reorder_quantity", label: "Suggested Reorder Quantity", type: "number" },
      { key: "preferred_supplier_id", label: "Preferred Supplier", type: "select", relation: "suppliers" },
      { key: "lead_time_days", label: "Lead Time Days", type: "number" },
      { key: "average_consumption_rate", label: "Average Consumption Rate", type: "number" },
      { key: "source", label: "Source", type: "text" },
      { key: "status", label: "Status", type: "select", options: status.reorder }
    ]
  },
  procurement_requests: {
    key: "procurement_requests", table: "procurement_requests", title: "Procurement Requests", singular: "Procurement Request", path: "/inventory/procurement-requests", icon: Receipt,
    searchFields: ["request_number", "department", "reason", "source", "priority", "status"], listFields: ["request_number", "department", "required_date", "source", "priority", "status"],
    workflowActions: ["submit", "approve"],
    fields: [
      { key: "request_number", label: "Request Number", type: "text" },
      { key: "requested_by", label: "Requested By", type: "select", relation: "users" },
      { key: "department", label: "Department", type: "text" },
      { key: "required_date", label: "Required Date", type: "date" },
      { key: "reason", label: "Reason", type: "textarea" },
      { key: "source", label: "Source", type: "select", options: ["Manual request", "Reorder alert", "Production material shortage", "Stock count variance", "Management request"] },
      { key: "priority", label: "Priority", type: "select", options: status.priority },
      { key: "status", label: "Status", type: "select", options: status.procurement }
    ]
  },
  procurement_request_lines: {
    key: "procurement_request_lines", table: "procurement_request_lines", title: "Procurement Request Lines", singular: "Procurement Request Line", path: "/inventory/procurement-request-lines", icon: Receipt,
    searchFields: [], listFields: ["procurement_request_id", "product_id", "quantity_required", "preferred_supplier_id", "estimated_cost"],
    fields: [
      { key: "procurement_request_id", label: "Procurement Request", type: "select", relation: "procurement_requests", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "quantity_required", label: "Quantity Required", type: "number", required: true },
      { key: "preferred_supplier_id", label: "Preferred Supplier", type: "select", relation: "suppliers" },
      { key: "estimated_cost", label: "Estimated Cost", type: "currency" }
    ]
  },
  purchase_orders: {
    key: "purchase_orders", table: "purchase_orders", title: "Purchase Orders", singular: "Purchase Order", path: "/inventory/purchase-orders", icon: FileSpreadsheet,
    searchFields: ["purchase_order_number", "payment_terms", "status"], listFields: ["purchase_order_number", "supplier_id", "order_date", "expected_delivery_date", "total_amount", "status"],
    workflowActions: ["submit", "approve"],
    fields: [
      { key: "purchase_order_number", label: "PO Number", type: "text" },
      { key: "supplier_id", label: "Supplier", type: "select", relation: "suppliers", required: true },
      { key: "procurement_request_id", label: "Procurement Request", type: "select", relation: "procurement_requests" },
      { key: "order_date", label: "Order Date", type: "date", required: true },
      { key: "expected_delivery_date", label: "Expected Delivery Date", type: "date" },
      { key: "delivery_warehouse_id", label: "Delivery Warehouse", type: "select", relation: "warehouses" },
      { key: "payment_terms", label: "Payment Terms", type: "text" },
      { key: "status", label: "Status", type: "select", options: status.po }
    ]
  },
  purchase_order_lines: {
    key: "purchase_order_lines", table: "purchase_order_lines", title: "Purchase Order Lines", singular: "PO Line", path: "/inventory/purchase-order-lines", icon: FileSpreadsheet,
    searchFields: [], listFields: ["purchase_order_id", "product_id", "quantity", "unit_price", "tax_amount", "total_amount"],
    fields: [
      { key: "purchase_order_id", label: "Purchase Order", type: "select", relation: "purchase_orders", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_price", label: "Unit Price", type: "currency" },
      { key: "tax_amount", label: "Tax", type: "currency" },
      { key: "delivery_warehouse_id", label: "Delivery Warehouse", type: "select", relation: "warehouses" }
    ]
  },
  goods_received_notes: {
    key: "goods_received_notes", table: "goods_received_notes", title: "Goods Received Notes", singular: "GRN", path: "/inventory/grns", icon: PackageCheck,
    searchFields: ["grn_number", "delivery_note_number", "status"], listFields: ["grn_number", "purchase_order_id", "supplier_id", "received_date", "warehouse_id", "status"],
    workflowActions: ["post"],
    fields: [
      { key: "grn_number", label: "GRN Number", type: "text" },
      { key: "purchase_order_id", label: "Purchase Order", type: "select", relation: "purchase_orders" },
      { key: "supplier_id", label: "Supplier", type: "select", relation: "suppliers", required: true },
      { key: "delivery_note_number", label: "Delivery Note Number", type: "text" },
      { key: "received_date", label: "Received Date", type: "date", required: true },
      { key: "received_by", label: "Received By", type: "select", relation: "users" },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "attachment_urls", label: "Attachments", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.grn }
    ]
  },
  goods_received_note_lines: {
    key: "goods_received_note_lines", table: "goods_received_note_lines", title: "GRN Lines", singular: "GRN Line", path: "/inventory/grn-lines", icon: PackageCheck,
    searchFields: ["batch_number"], listFields: ["grn_id", "product_id", "quantity_received", "quantity_accepted", "quantity_rejected", "batch_number"],
    fields: [
      { key: "grn_id", label: "GRN", type: "select", relation: "goods_received_notes", required: true },
      { key: "purchase_order_line_id", label: "PO Line", type: "select", relation: "purchase_order_lines" },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "quantity_ordered", label: "Quantity Ordered", type: "number" },
      { key: "quantity_received", label: "Quantity Received", type: "number" },
      { key: "quantity_accepted", label: "Quantity Accepted", type: "number" },
      { key: "quantity_rejected", label: "Quantity Rejected", type: "number" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "qc_required", label: "QC Required", type: "checkbox" },
      { key: "unit_cost", label: "Unit Cost", type: "currency" }
    ]
  },
  supplier_returns: {
    key: "supplier_returns", table: "supplier_returns", title: "Supplier Returns", singular: "Supplier Return", path: "/inventory/supplier-returns", icon: RotateCcw,
    searchFields: ["supplier_return_number", "reason", "status"], listFields: ["supplier_return_number", "supplier_id", "grn_id", "return_date", "status"],
    workflowActions: ["approve", "dispatch"],
    fields: [
      { key: "supplier_return_number", label: "Supplier Return Number", type: "text" },
      { key: "supplier_id", label: "Supplier", type: "select", relation: "suppliers", required: true },
      { key: "grn_id", label: "GRN", type: "select", relation: "goods_received_notes" },
      { key: "return_date", label: "Return Date", type: "date" },
      { key: "reason", label: "Reason", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.supplierReturn }
    ]
  },
  supplier_return_lines: {
    key: "supplier_return_lines", table: "supplier_return_lines", title: "Supplier Return Lines", singular: "Supplier Return Line", path: "/inventory/supplier-return-lines", icon: RotateCcw,
    searchFields: ["batch_number"], listFields: ["supplier_return_id", "product_id", "batch_number", "quantity_returned", "unit_cost"],
    fields: [
      { key: "supplier_return_id", label: "Supplier Return", type: "select", relation: "supplier_returns", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "quantity_returned", label: "Quantity Returned", type: "number", required: true },
      { key: "unit_cost", label: "Unit Cost", type: "currency" }
    ]
  },
  opening_balances: {
    key: "opening_balances", table: "opening_balances", title: "Opening Balances", singular: "Opening Balance", path: "/inventory/opening-balances", icon: BarChart3,
    searchFields: ["opening_balance_number", "status"], listFields: ["opening_balance_number", "balance_date", "uploaded_by", "status", "created_at"],
    workflowActions: ["approve", "post"],
    fields: [
      { key: "opening_balance_number", label: "Opening Balance Number", type: "text" },
      { key: "balance_date", label: "Date", type: "date", required: true },
      { key: "uploaded_by", label: "Uploaded By", type: "select", relation: "users" },
      { key: "status", label: "Status", type: "select", options: status.opening }
    ]
  },
  opening_balance_lines: {
    key: "opening_balance_lines", table: "opening_balance_lines", title: "Opening Balance Lines", singular: "Opening Balance Line", path: "/inventory/opening-balance-lines", icon: BarChart3,
    searchFields: ["batch_number", "approval_status"], listFields: ["opening_balance_id", "product_id", "warehouse_id", "quantity", "unit_cost", "total_value"],
    fields: [
      { key: "opening_balance_id", label: "Opening Balance", type: "select", relation: "opening_balances", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_cost", label: "Unit Cost", type: "currency" },
      { key: "approval_status", label: "Approval Status", type: "select", options: ["Pending", "Approved", "Rejected"] }
    ]
  },
  price_lists: {
    key: "price_lists", table: "price_lists", title: "Price Lists", singular: "Price List", path: "/inventory/price-lists", icon: Tags,
    searchFields: ["price_list_name", "customer_type", "status"], listFields: ["price_list_name", "customer_type", "effective_date", "expiry_date", "status"],
    fields: [
      { key: "price_list_name", label: "Price List Name", type: "text", required: true },
      { key: "customer_type", label: "Customer Type", type: "select", options: ["Distributor", "Wholesaler", "Retailer", "Supermarket", "Institution", "Direct Customer"] },
      { key: "effective_date", label: "Effective Date", type: "date" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: status.active }
    ]
  },
  price_list_lines: {
    key: "price_list_lines", table: "price_list_lines", title: "Price List Lines", singular: "Price List Line", path: "/inventory/price-list-lines", icon: Tags,
    searchFields: [], listFields: ["price_list_id", "product_id", "standard_price", "wholesale_price", "distributor_price", "special_price"],
    fields: [
      { key: "price_list_id", label: "Price List", type: "select", relation: "price_lists", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "standard_price", label: "Standard Price", type: "currency" },
      { key: "wholesale_price", label: "Wholesale Price", type: "currency" },
      { key: "distributor_price", label: "Distributor Price", type: "currency" },
      { key: "special_price", label: "Special Price", type: "currency" }
    ]
  },
  inventory_settings: {
    key: "inventory_settings", table: "inventory_settings", title: "Inventory Settings", singular: "Inventory Settings", path: "/inventory/settings", icon: Settings,
    searchFields: ["valuation_method", "default_qc_status"], listFields: ["valuation_method", "allow_negative_stock", "near_expiry_days", "require_adjustment_approval", "default_qc_status"],
    fields: [
      { key: "valuation_method", label: "Valuation Method", type: "select", options: ["FIFO", "Weighted Average", "Standard Cost"] },
      { key: "allow_negative_stock", label: "Allow Negative Stock", type: "checkbox" },
      { key: "near_expiry_days", label: "Near Expiry Days", type: "number" },
      { key: "require_adjustment_approval", label: "Require Adjustment Approval", type: "checkbox" },
      { key: "require_transfer_approval", label: "Require Transfer Approval", type: "checkbox" },
      { key: "require_opening_balance_approval", label: "Require Opening Balance Approval", type: "checkbox" },
      { key: "default_qc_status", label: "Default QC Status", type: "select", options: status.qc }
    ]
  }
};

export const inventoryNavigation = [
  { label: "Inventory Dashboard", href: "/inventory", icon: BarChart3 },
  { label: "Stock Balances", href: "/inventory/balances", icon: Boxes },
  { label: "Stock Ledger", href: "/inventory/ledger", icon: ScrollText },
  { label: "Warehouse Transfers", href: "/inventory/transfers", icon: ArrowLeftRight },
  { label: "Transfer Lines", href: "/inventory/transfer-lines", icon: ArrowLeftRight },
  { label: "Stock Adjustments", href: "/inventory/adjustments", icon: ClipboardCheck },
  { label: "Adjustment Lines", href: "/inventory/adjustment-lines", icon: ClipboardCheck },
  { label: "Stock Counts", href: "/inventory/counts", icon: ClipboardList },
  { label: "Stock Count Lines", href: "/inventory/count-lines", icon: ClipboardList },
  { label: "Reorder Alerts", href: "/inventory/reorder-alerts", icon: AlertTriangle },
  { label: "Procurement Requests", href: "/inventory/procurement-requests", icon: Receipt },
  { label: "Purchase Orders", href: "/inventory/purchase-orders", icon: FileSpreadsheet },
  { label: "Goods Received Notes", href: "/inventory/grns", icon: PackageCheck },
  { label: "GRN Lines", href: "/inventory/grn-lines", icon: PackageCheck },
  { label: "Supplier Returns", href: "/inventory/supplier-returns", icon: RotateCcw },
  { label: "Opening Balances", href: "/inventory/opening-balances", icon: BarChart3 },
  { label: "Price Lists", href: "/inventory/price-lists", icon: Tags },
  { label: "Excel Imports", href: "/inventory/imports", icon: FileSpreadsheet },
  { label: "Stock Valuation", href: "/inventory/valuation", icon: Truck },
  { label: "Inventory Reports", href: "/inventory/reports", icon: ScrollText },
  { label: "Inventory Settings", href: "/inventory/settings", icon: Settings }
];
