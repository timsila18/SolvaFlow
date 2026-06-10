import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Route,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Truck,
  UserCheck
} from "lucide-react";
import type { FieldType } from "@/lib/entities";

export type SalesDistributionKey =
  | "field_visits"
  | "field_visit_evidence"
  | "route_plans"
  | "route_plan_customers"
  | "sales_orders"
  | "sales_order_lines"
  | "sales_order_stock_reservations"
  | "customer_credit_checks"
  | "dispatch_orders"
  | "dispatch_order_lines"
  | "picking_lists"
  | "picking_list_lines"
  | "delivery_notes"
  | "delivery_note_lines"
  | "driver_trips"
  | "driver_trip_locations"
  | "delivery_confirmations"
  | "failed_deliveries"
  | "customer_returns"
  | "customer_return_lines"
  | "customer_complaints"
  | "customer_portal_users"
  | "sales_distribution_settings";

export type SalesDistributionOptionSource =
  | "products"
  | "units_of_measure"
  | "customers"
  | "territories"
  | "routes"
  | "warehouses"
  | "vehicles"
  | "users"
  | "price_lists"
  | "field_visits"
  | "route_plans"
  | "sales_orders"
  | "sales_order_lines"
  | "dispatch_orders"
  | "picking_lists"
  | "delivery_notes"
  | "driver_trips"
  | "customer_returns"
  | "stock_balances"
  | "production_batches";

export type SalesDistributionField = {
  key: string;
  label: string;
  type: FieldType | "datetime" | "time";
  required?: boolean;
  options?: string[];
  relation?: SalesDistributionOptionSource;
};

export type SalesDistributionConfig = {
  key: SalesDistributionKey;
  table: string;
  title: string;
  singular: string;
  path: string;
  icon: LucideIcon;
  searchFields: string[];
  listFields: string[];
  fields: SalesDistributionField[];
  workflowActions?: Array<"submit" | "approve" | "reserve" | "pick" | "pack" | "load" | "dispatch" | "start" | "arrive" | "confirm" | "fail" | "receive" | "restock" | "close" | "check_in" | "check_out" | "complete">;
};

const status = {
  visit: ["Scheduled", "Checked In", "In Progress", "Completed", "Missed", "Cancelled", "Location Exception"],
  outcome: ["Order Taken", "No Stock Needed", "Customer Closed", "Customer Unavailable", "Payment Follow-up", "Complaint Raised", "Competitor Issue", "Other"],
  routePlan: ["Draft", "Published", "In Progress", "Completed", "Missed", "Cancelled"],
  order: ["Draft", "Submitted", "Approved", "Rejected", "Reserved", "Picking", "Dispatched", "Partially Delivered", "Delivered", "Closed", "Cancelled"],
  dispatch: ["Draft", "Picking", "Packed", "Loaded", "Dispatched", "In Transit", "Delivered", "Partially Delivered", "Returned", "Closed", "Cancelled"],
  delivery: ["Draft", "Generated", "Sent", "Delivered", "Partially Delivered", "Closed", "Cancelled"],
  trip: ["Assigned", "Started", "In Transit", "Arrived", "Completed", "Delayed", "Cancelled"],
  return: ["Draft", "Submitted", "Approved", "Received", "Inspected", "Restocked", "Written Off", "Closed"],
  complaint: ["Open", "Assigned", "In Review", "Resolved", "Closed"],
  active: ["Active", "Inactive", "Suspended"],
  evidence: ["Shop Photo", "Shelf Photo", "Product Display Photo", "Selfie", "Competitor Product Photo", "General Notes"],
  failReason: ["Customer closed", "Customer refused goods", "Wrong address", "Vehicle issue", "Payment issue", "Goods damaged", "Other"],
  returnReason: ["Damaged", "Expired", "Wrong product", "Short delivery", "Quality complaint", "Customer cancelled", "Other"]
};

export const salesDistributionConfigs: Record<SalesDistributionKey, SalesDistributionConfig> = {
  field_visits: {
    key: "field_visits", table: "field_visits", title: "Field Visits", singular: "Field Visit", path: "/sales-distribution/field-visits", icon: MapPin,
    searchFields: ["visit_number", "visit_status", "outcome", "notes"], listFields: ["visit_number", "sales_rep_id", "customer_id", "scheduled_date", "visit_status", "distance_from_customer_meters"],
    workflowActions: ["check_in", "check_out", "complete"],
    fields: [
      { key: "visit_number", label: "Visit Number", type: "text" },
      { key: "sales_rep_id", label: "Sales Rep", type: "select", relation: "users" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "route_id", label: "Route", type: "select", relation: "routes" },
      { key: "route_plan_id", label: "Route Plan", type: "select", relation: "route_plans" },
      { key: "scheduled_date", label: "Scheduled Date", type: "date" },
      { key: "latitude", label: "GPS Latitude", type: "number" },
      { key: "longitude", label: "GPS Longitude", type: "number" },
      { key: "allowed_radius_meters", label: "Allowed Radius", type: "number" },
      { key: "visit_status", label: "Visit Status", type: "select", options: status.visit },
      { key: "outcome", label: "Outcome", type: "select", options: status.outcome },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  field_visit_evidence: {
    key: "field_visit_evidence", table: "field_visit_evidence", title: "Visit Evidence", singular: "Visit Evidence", path: "/sales-distribution/visit-evidence", icon: FileText,
    searchFields: ["evidence_type", "notes"], listFields: ["field_visit_id", "customer_id", "evidence_type", "captured_at", "status"],
    fields: [
      { key: "field_visit_id", label: "Visit", type: "select", relation: "field_visits", required: true },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "sales_rep_id", label: "Sales Rep", type: "select", relation: "users" },
      { key: "evidence_type", label: "Evidence Type", type: "select", options: status.evidence, required: true },
      { key: "file_url", label: "File URL", type: "text" },
      { key: "latitude", label: "GPS Latitude", type: "number" },
      { key: "longitude", label: "GPS Longitude", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  route_plans: {
    key: "route_plans", table: "route_plans", title: "Customer Routes", singular: "Route Plan", path: "/sales-distribution/routes", icon: Route,
    searchFields: ["route_plan_number", "notes", "status"], listFields: ["route_plan_number", "sales_rep_id", "territory_id", "plan_date", "status"],
    workflowActions: ["submit", "complete"],
    fields: [
      { key: "route_plan_number", label: "Route Plan Number", type: "text" },
      { key: "sales_rep_id", label: "Sales Rep", type: "select", relation: "users", required: true },
      { key: "territory_id", label: "Territory", type: "select", relation: "territories" },
      { key: "route_id", label: "Route", type: "select", relation: "routes" },
      { key: "plan_date", label: "Plan Date", type: "date", required: true },
      { key: "expected_start_time", label: "Expected Start", type: "time" },
      { key: "expected_end_time", label: "Expected End", type: "time" },
      { key: "status", label: "Status", type: "select", options: status.routePlan },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  route_plan_customers: {
    key: "route_plan_customers", table: "route_plan_customers", title: "Route Customers", singular: "Route Customer", path: "/sales-distribution/route-customers", icon: UserCheck,
    searchFields: ["notes", "status"], listFields: ["route_plan_id", "customer_id", "planned_sequence", "expected_arrival_time", "status"],
    fields: [
      { key: "route_plan_id", label: "Route Plan", type: "select", relation: "route_plans", required: true },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "planned_sequence", label: "Planned Sequence", type: "number" },
      { key: "expected_arrival_time", label: "Expected Arrival", type: "time" },
      { key: "status", label: "Status", type: "select", options: ["Planned", "Visited", "Missed", "Cancelled"] },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  sales_orders: {
    key: "sales_orders", table: "sales_orders", title: "Sales Orders", singular: "Sales Order", path: "/sales-distribution/orders", icon: ShoppingCart,
    searchFields: ["sales_order_number", "credit_status", "notes", "status"], listFields: ["sales_order_number", "customer_id", "sales_rep_id", "order_date", "total_amount", "status"],
    workflowActions: ["submit", "approve", "reserve"],
    fields: [
      { key: "sales_order_number", label: "Sales Order Number", type: "text" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "sales_rep_id", label: "Sales Rep", type: "select", relation: "users" },
      { key: "territory_id", label: "Territory", type: "select", relation: "territories" },
      { key: "route_id", label: "Route", type: "select", relation: "routes" },
      { key: "field_visit_id", label: "Field Visit", type: "select", relation: "field_visits" },
      { key: "order_date", label: "Order Date", type: "date", required: true },
      { key: "expected_delivery_date", label: "Expected Delivery", type: "date" },
      { key: "payment_terms", label: "Payment Terms", type: "text" },
      { key: "price_list_id", label: "Price List", type: "select", relation: "price_lists" },
      { key: "total_amount", label: "Total Amount", type: "currency" },
      { key: "status", label: "Status", type: "select", options: status.order },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  sales_order_lines: {
    key: "sales_order_lines", table: "sales_order_lines", title: "Sales Order Lines", singular: "Sales Order Line", path: "/sales-distribution/order-lines", icon: ClipboardList,
    searchFields: ["batch_number", "status"], listFields: ["sales_order_id", "product_id", "quantity", "unit_price", "line_total", "status"],
    fields: [
      { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "batch_id", label: "Batch", type: "select", relation: "production_batches" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "unit_price", label: "Unit Price", type: "currency" },
      { key: "discount_amount", label: "Discount", type: "currency" },
      { key: "tax_amount", label: "Tax", type: "currency" }
    ]
  },
  sales_order_stock_reservations: {
    key: "sales_order_stock_reservations", table: "sales_order_stock_reservations", title: "Order Stock Reservations", singular: "Stock Reservation", path: "/sales-distribution/reservations", icon: ShieldAlert,
    searchFields: ["batch_number", "status"], listFields: ["sales_order_id", "product_id", "warehouse_id", "batch_number", "quantity_reserved", "status"],
    fields: [
      { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders", required: true },
      { key: "sales_order_line_id", label: "Sales Order Line", type: "select", relation: "sales_order_lines" },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "stock_balance_id", label: "Stock Balance", type: "select", relation: "stock_balances" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "quantity_reserved", label: "Reserved Quantity", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Reserved", "Released", "Consumed", "Cancelled"] }
    ]
  },
  customer_credit_checks: {
    key: "customer_credit_checks", table: "customer_credit_checks", title: "Customer Credit Checks", singular: "Credit Check", path: "/sales-distribution/credit-checks", icon: BadgeCheck,
    searchFields: ["result", "exception_reason", "status"], listFields: ["sales_order_id", "customer_id", "credit_limit", "order_amount", "result", "status"],
    workflowActions: ["approve"],
    fields: [
      { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders", required: true },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "credit_limit", label: "Credit Limit", type: "currency" },
      { key: "outstanding_balance", label: "Outstanding Balance", type: "currency" },
      { key: "overdue_amount", label: "Overdue Amount", type: "currency" },
      { key: "order_amount", label: "Order Amount", type: "currency" },
      { key: "result", label: "Result", type: "select", options: ["Pass", "Credit Exception", "Blocked"] },
      { key: "exception_reason", label: "Exception Reason", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["Open", "Approved", "Rejected", "Closed"] }
    ]
  },
  dispatch_orders: {
    key: "dispatch_orders", table: "dispatch_orders", title: "Dispatch Orders", singular: "Dispatch Order", path: "/sales-distribution/dispatch", icon: Truck,
    searchFields: ["dispatch_number", "notes", "status"], listFields: ["dispatch_number", "sales_order_id", "customer_id", "vehicle_id", "driver_id", "status"],
    workflowActions: ["pick", "pack", "load", "dispatch", "close"],
    fields: [
      { key: "dispatch_number", label: "Dispatch Number", type: "text" },
      { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders", required: true },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "dispatch_date", label: "Dispatch Date", type: "date", required: true },
      { key: "vehicle_id", label: "Vehicle", type: "select", relation: "vehicles" },
      { key: "driver_id", label: "Driver", type: "select", relation: "users" },
      { key: "route_id", label: "Route", type: "select", relation: "routes" },
      { key: "dispatch_officer_id", label: "Dispatch Officer", type: "select", relation: "users" },
      { key: "status", label: "Status", type: "select", options: status.dispatch },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  dispatch_order_lines: {
    key: "dispatch_order_lines", table: "dispatch_order_lines", title: "Dispatch Lines", singular: "Dispatch Line", path: "/sales-distribution/dispatch-lines", icon: PackageCheck,
    searchFields: ["batch_number", "warehouse_location", "status"], listFields: ["dispatch_order_id", "product_id", "ordered_quantity", "picked_quantity", "batch_number", "status"],
    fields: [
      { key: "dispatch_order_id", label: "Dispatch Order", type: "select", relation: "dispatch_orders", required: true },
      { key: "sales_order_line_id", label: "Sales Order Line", type: "select", relation: "sales_order_lines" },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "ordered_quantity", label: "Ordered Quantity", type: "number" },
      { key: "picked_quantity", label: "Picked Quantity", type: "number" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "warehouse_location", label: "Warehouse Location", type: "text" },
      { key: "picker_id", label: "Picker", type: "select", relation: "users" },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Picked", "Packed", "Short", "Cancelled"] }
    ]
  },
  picking_lists: {
    key: "picking_lists", table: "picking_lists", title: "Picking Lists", singular: "Picking List", path: "/sales-distribution/picking", icon: ClipboardCheck,
    searchFields: ["picking_number", "status"], listFields: ["picking_number", "dispatch_order_id", "warehouse_id", "picker_id", "status"],
    workflowActions: ["pick", "pack"],
    fields: [
      { key: "picking_number", label: "Picking Number", type: "text" },
      { key: "dispatch_order_id", label: "Dispatch Order", type: "select", relation: "dispatch_orders", required: true },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses", required: true },
      { key: "picker_id", label: "Picker", type: "select", relation: "users" },
      { key: "picked_at", label: "Picked At", type: "datetime" },
      { key: "status", label: "Status", type: "select", options: ["Draft", "Picking", "Picked", "Packed", "Cancelled"] }
    ]
  },
  picking_list_lines: {
    key: "picking_list_lines", table: "picking_list_lines", title: "Picking Lines", singular: "Picking Line", path: "/sales-distribution/picking-lines", icon: ClipboardList,
    searchFields: ["batch_number", "warehouse_location", "status"], listFields: ["picking_list_id", "product_id", "ordered_quantity", "picked_quantity", "batch_number", "status"],
    fields: [
      { key: "picking_list_id", label: "Picking List", type: "select", relation: "picking_lists", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "ordered_quantity", label: "Ordered Quantity", type: "number" },
      { key: "picked_quantity", label: "Picked Quantity", type: "number" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "warehouse_location", label: "Warehouse Location", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Picked", "Short", "Cancelled"] }
    ]
  },
  delivery_notes: {
    key: "delivery_notes", table: "delivery_notes", title: "Delivery Notes", singular: "Delivery Note", path: "/sales-distribution/delivery-notes", icon: FileText,
    searchFields: ["delivery_note_number", "receiver_name", "invoice_reference", "status"], listFields: ["delivery_note_number", "sales_order_id", "dispatch_order_id", "customer_id", "delivery_date", "status"],
    workflowActions: ["submit", "confirm", "close"],
    fields: [
      { key: "delivery_note_number", label: "Delivery Note Number", type: "text" },
      { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders", required: true },
      { key: "dispatch_order_id", label: "Dispatch Order", type: "select", relation: "dispatch_orders" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "vehicle_id", label: "Vehicle", type: "select", relation: "vehicles" },
      { key: "driver_id", label: "Driver", type: "select", relation: "users" },
      { key: "delivery_date", label: "Delivery Date", type: "date", required: true },
      { key: "receiver_name", label: "Receiver Name", type: "text" },
      { key: "invoice_reference", label: "Invoice Reference", type: "text" },
      { key: "footer", label: "Terms/Footer", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.delivery }
    ]
  },
  delivery_note_lines: {
    key: "delivery_note_lines", table: "delivery_note_lines", title: "Delivery Note Lines", singular: "Delivery Note Line", path: "/sales-distribution/delivery-lines", icon: ClipboardList,
    searchFields: ["batch_number", "status"], listFields: ["delivery_note_id", "product_id", "quantity", "batch_number", "expiry_date", "status"],
    fields: [
      { key: "delivery_note_id", label: "Delivery Note", type: "select", relation: "delivery_notes", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_of_measure_id", label: "Unit", type: "select", relation: "units_of_measure" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Delivered", "Rejected", "Returned"] }
    ]
  },
  driver_trips: {
    key: "driver_trips", table: "driver_trips", title: "Driver App", singular: "Driver Trip", path: "/sales-distribution/driver-app", icon: Gauge,
    searchFields: ["trip_number", "notes", "status"], listFields: ["trip_number", "dispatch_order_id", "driver_id", "vehicle_id", "departure_time", "status"],
    workflowActions: ["start", "arrive", "close"],
    fields: [
      { key: "trip_number", label: "Trip Number", type: "text" },
      { key: "dispatch_order_id", label: "Dispatch Order", type: "select", relation: "dispatch_orders" },
      { key: "driver_id", label: "Driver", type: "select", relation: "users", required: true },
      { key: "vehicle_id", label: "Vehicle", type: "select", relation: "vehicles" },
      { key: "route_id", label: "Route", type: "select", relation: "routes" },
      { key: "current_latitude", label: "Current Latitude", type: "number" },
      { key: "current_longitude", label: "Current Longitude", type: "number" },
      { key: "distance_travelled_km", label: "Distance Travelled KM", type: "number" },
      { key: "status", label: "Status", type: "select", options: status.trip },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  driver_trip_locations: {
    key: "driver_trip_locations", table: "driver_trip_locations", title: "Driver Tracking", singular: "Trip Location", path: "/sales-distribution/tracking", icon: MapPin,
    searchFields: ["device_information", "status"], listFields: ["driver_trip_id", "latitude", "longitude", "recorded_at", "status"],
    fields: [
      { key: "driver_trip_id", label: "Driver Trip", type: "select", relation: "driver_trips", required: true },
      { key: "latitude", label: "Latitude", type: "number", required: true },
      { key: "longitude", label: "Longitude", type: "number", required: true },
      { key: "speed_kph", label: "Speed KPH", type: "number" },
      { key: "heading", label: "Heading", type: "number" },
      { key: "device_information", label: "Device Information", type: "text" }
    ]
  },
  delivery_confirmations: {
    key: "delivery_confirmations", table: "delivery_confirmations", title: "Delivery Confirmation", singular: "Delivery Confirmation", path: "/sales-distribution/confirmations", icon: BadgeCheck,
    searchFields: ["receiver_name", "receiver_phone", "comments", "status"], listFields: ["delivery_note_id", "customer_id", "receiver_name", "confirmed_at", "quantity_accepted", "status"],
    workflowActions: ["confirm"],
    fields: [
      { key: "delivery_note_id", label: "Delivery Note", type: "select", relation: "delivery_notes", required: true },
      { key: "dispatch_order_id", label: "Dispatch Order", type: "select", relation: "dispatch_orders" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "receiver_name", label: "Receiver Name", type: "text", required: true },
      { key: "receiver_phone", label: "Receiver Phone", type: "text" },
      { key: "receiver_designation", label: "Receiver Designation", type: "text" },
      { key: "signature_url", label: "Signature URL", type: "text" },
      { key: "stamp_photo_url", label: "Stamp Photo URL", type: "text" },
      { key: "goods_received_photo_url", label: "Goods Received Photo URL", type: "text" },
      { key: "latitude", label: "GPS Latitude", type: "number" },
      { key: "longitude", label: "GPS Longitude", type: "number" },
      { key: "quantity_accepted", label: "Quantity Accepted", type: "number" },
      { key: "quantity_rejected", label: "Quantity Rejected", type: "number" },
      { key: "comments", label: "Comments", type: "textarea" }
    ]
  },
  failed_deliveries: {
    key: "failed_deliveries", table: "failed_deliveries", title: "Failed Deliveries", singular: "Failed Delivery", path: "/sales-distribution/failed-deliveries", icon: ShieldAlert,
    searchFields: ["reason", "notes", "resolution_action", "status"], listFields: ["dispatch_order_id", "delivery_note_id", "customer_id", "reason", "recorded_at", "status"],
    workflowActions: ["fail", "close"],
    fields: [
      { key: "dispatch_order_id", label: "Dispatch Order", type: "select", relation: "dispatch_orders" },
      { key: "delivery_note_id", label: "Delivery Note", type: "select", relation: "delivery_notes" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "driver_id", label: "Driver", type: "select", relation: "users" },
      { key: "reason", label: "Reason", type: "select", options: status.failReason, required: true },
      { key: "latitude", label: "GPS Latitude", type: "number" },
      { key: "longitude", label: "GPS Longitude", type: "number" },
      { key: "resolution_action", label: "Resolution Action", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  customer_returns: {
    key: "customer_returns", table: "customer_returns", title: "Customer Returns", singular: "Customer Return", path: "/sales-distribution/returns", icon: RefreshCcw,
    searchFields: ["return_number", "reason", "condition", "notes", "status"], listFields: ["return_number", "customer_id", "delivery_note_id", "return_date", "reason", "status"],
    workflowActions: ["submit", "approve", "receive", "restock", "close"],
    fields: [
      { key: "return_number", label: "Return Number", type: "text" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders" },
      { key: "delivery_note_id", label: "Delivery Note", type: "select", relation: "delivery_notes" },
      { key: "return_date", label: "Return Date", type: "date", required: true },
      { key: "received_by", label: "Received By", type: "select", relation: "users" },
      { key: "reason", label: "Reason", type: "select", options: status.returnReason },
      { key: "condition", label: "Condition", type: "text" },
      { key: "status", label: "Status", type: "select", options: status.return },
      { key: "notes", label: "Notes", type: "textarea" }
    ]
  },
  customer_return_lines: {
    key: "customer_return_lines", table: "customer_return_lines", title: "Return Lines", singular: "Return Line", path: "/sales-distribution/return-lines", icon: ClipboardList,
    searchFields: ["batch_number", "reason", "condition", "status"], listFields: ["customer_return_id", "product_id", "batch_number", "quantity_returned", "warehouse_id", "status"],
    fields: [
      { key: "customer_return_id", label: "Customer Return", type: "select", relation: "customer_returns", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products", required: true },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "quantity_delivered", label: "Quantity Delivered", type: "number" },
      { key: "quantity_returned", label: "Quantity Returned", type: "number", required: true },
      { key: "reason", label: "Reason", type: "select", options: status.returnReason },
      { key: "condition", label: "Condition", type: "text" },
      { key: "warehouse_id", label: "Warehouse", type: "select", relation: "warehouses" },
      { key: "status", label: "Status", type: "select", options: ["Submitted", "Received", "QC Hold", "Restocked", "Written Off"] }
    ]
  },
  customer_complaints: {
    key: "customer_complaints", table: "customer_complaints", title: "Customer Complaints", singular: "Customer Complaint", path: "/sales-distribution/complaints", icon: ShieldAlert,
    searchFields: ["complaint_number", "complaint_type", "description", "status"], listFields: ["complaint_number", "customer_id", "product_id", "complaint_type", "assigned_to", "status"],
    workflowActions: ["submit", "close"],
    fields: [
      { key: "complaint_number", label: "Complaint Number", type: "text" },
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "product_id", label: "Product", type: "select", relation: "products" },
      { key: "batch_number", label: "Batch Number", type: "text" },
      { key: "delivery_note_id", label: "Delivery Note", type: "select", relation: "delivery_notes" },
      { key: "complaint_type", label: "Complaint Type", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "attachment_url", label: "Attachment URL", type: "text" },
      { key: "assigned_to", label: "Assigned To", type: "select", relation: "users" },
      { key: "resolution_notes", label: "Resolution Notes", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: status.complaint }
    ]
  },
  customer_portal_users: {
    key: "customer_portal_users", table: "customer_portal_users", title: "Customer Portal", singular: "Portal User", path: "/sales-distribution/customer-portal", icon: UserCheck,
    searchFields: ["email", "full_name", "phone", "status"], listFields: ["customer_id", "email", "full_name", "last_login_at", "status"],
    fields: [
      { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
      { key: "auth_user_id", label: "Auth User ID", type: "text" },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "full_name", label: "Full Name", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "status", label: "Status", type: "select", options: status.active }
    ]
  },
  sales_distribution_settings: {
    key: "sales_distribution_settings", table: "sales_distribution_settings", title: "Distribution Settings", singular: "Distribution Settings", path: "/sales-distribution/settings", icon: Settings,
    searchFields: ["status"], listFields: ["default_check_in_radius_meters", "allow_backorders", "require_credit_approval", "fefo_required", "status"],
    fields: [
      { key: "default_check_in_radius_meters", label: "Default GPS Radius Meters", type: "number" },
      { key: "require_manager_override_outside_radius", label: "Require Override Outside Radius", type: "checkbox" },
      { key: "allow_backorders", label: "Allow Backorders", type: "checkbox" },
      { key: "require_credit_approval", label: "Require Credit Approval", type: "checkbox" },
      { key: "fefo_required", label: "FEFO Required", type: "checkbox" },
      { key: "delivery_confirmation_required", label: "Delivery Confirmation Required", type: "checkbox" },
      { key: "customer_portal_enabled", label: "Customer Portal Enabled", type: "checkbox" },
      { key: "status", label: "Status", type: "select", options: status.active }
    ]
  }
};

export const salesDistributionNavigation = [
  { href: "/sales-distribution", label: "Sales Dashboard", icon: BarChart3 },
  { href: "/sales-distribution/field-visits", label: "Field Visits", icon: MapPin },
  { href: "/sales-distribution/routes", label: "Customer Routes", icon: Route },
  { href: "/sales-distribution/orders", label: "Sales Orders", icon: ShoppingCart },
  { href: "/sales-distribution/dispatch", label: "Dispatch Orders", icon: Truck },
  { href: "/sales-distribution/delivery-notes", label: "Delivery Notes", icon: FileText },
  { href: "/sales-distribution/driver-app", label: "Driver App", icon: Gauge },
  { href: "/sales-distribution/confirmations", label: "Delivery Confirmation", icon: BadgeCheck },
  { href: "/sales-distribution/returns", label: "Customer Returns", icon: RefreshCcw },
  { href: "/sales-distribution/complaints", label: "Customer Complaints", icon: ShieldAlert },
  { href: "/sales-distribution/customer-portal", label: "Customer Portal", icon: UserCheck },
  { href: "/sales-distribution/reports", label: "Sales Reports", icon: BarChart3 },
  { href: "/sales-distribution/settings", label: "Distribution Settings", icon: Settings }
];
