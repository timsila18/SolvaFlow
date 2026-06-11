import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileArchive,
  FileText,
  Gauge,
  Landmark,
  MessageSquare,
  Receipt,
  Settings,
  ShieldCheck,
  Smartphone,
  Upload,
  Wallet
} from "lucide-react";
import type { FieldType } from "@/lib/entities";

export type FinalModuleKey =
  | "collections_settings"
  | "mpesa_configurations"
  | "customer_accounts"
  | "customer_account_ledger"
  | "sales_invoices"
  | "sales_invoice_lines"
  | "customer_payments"
  | "payment_allocations"
  | "mpesa_collections"
  | "cash_collections"
  | "cheque_collections"
  | "bank_transfer_collections"
  | "credit_notes"
  | "debit_notes"
  | "customer_risk_scores"
  | "finance_integration_events"
  | "ai_insights"
  | "ai_chat_threads"
  | "ai_chat_messages"
  | "kpi_definitions"
  | "kpi_snapshots"
  | "alert_center"
  | "document_attachments"
  | "approval_workflows"
  | "approval_requests"
  | "user_devices"
  | "security_policies"
  | "backup_jobs"
  | "integration_endpoints"
  | "implementation_status";

export type FinalOptionSource =
  | "customers"
  | "users"
  | "products"
  | "delivery_notes"
  | "sales_orders"
  | "customer_returns"
  | "sales_invoices"
  | "customer_payments"
  | "customer_accounts"
  | "ai_chat_threads"
  | "kpi_definitions"
  | "approval_workflows";

export type FinalField = {
  key: string;
  label: string;
  type: FieldType | "datetime";
  required?: boolean;
  options?: string[];
  relation?: FinalOptionSource;
};

export type FinalConfig = {
  key: FinalModuleKey;
  table: string;
  title: string;
  singular: string;
  path: string;
  module: "collections" | "ai" | "enterprise";
  icon: LucideIcon;
  searchFields: string[];
  listFields: string[];
  fields: FinalField[];
  workflowActions?: Array<"post" | "allocate" | "verify" | "clear" | "bounce" | "generate" | "sync" | "acknowledge" | "resolve" | "approve" | "reject">;
};

const statuses = {
  active: ["Active", "Inactive", "Suspended"],
  invoice: ["Draft", "Posted", "Partially Paid", "Paid", "Overdue", "Cancelled"],
  payment: ["Received", "Allocated", "Partially Allocated", "Cancelled"],
  cash: ["Pending Banking", "Banked", "Cancelled"],
  cheque: ["Received", "Deposited", "Cleared", "Bounced", "Cancelled"],
  bank: ["Pending Verification", "Verified", "Rejected"],
  note: ["Draft", "Posted", "Cancelled"],
  risk: ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"],
  finance: ["Queued", "Posted", "Failed", "Skipped"],
  alert: ["Open", "Acknowledged", "Resolved", "Dismissed"],
  approval: ["Pending", "Approved", "Rejected", "Cancelled"],
  severity: ["Low", "Medium", "High", "Critical"]
};

export const finalModuleConfigs: Record<FinalModuleKey, FinalConfig> = {
  collections_settings: { key: "collections_settings", table: "collections_settings", title: "Collections Settings", singular: "Collections Settings", path: "/collections/settings", module: "collections", icon: Settings, searchFields: ["allocation_method", "status"], listFields: ["allocation_method", "invoice_due_days", "auto_invoice_on_delivery", "finance_integration_enabled", "status"], fields: [
    { key: "allocation_method", label: "Allocation Method", type: "select", options: ["Oldest Invoice First", "Specific Invoice", "Customer-defined Allocation"] },
    { key: "invoice_due_days", label: "Invoice Due Days", type: "number" },
    { key: "auto_invoice_on_delivery", label: "Auto Invoice On Delivery", type: "checkbox" },
    { key: "require_cash_approval", label: "Require Cash Approval", type: "checkbox" },
    { key: "finance_integration_enabled", label: "Finance Integration Enabled", type: "checkbox" },
    { key: "finance_api_base_url", label: "Finance API Base URL", type: "text" },
    { key: "finance_posting_mode", label: "Finance Posting Mode", type: "select", options: ["Queue", "Immediate", "Manual"] },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  mpesa_configurations: { key: "mpesa_configurations", table: "mpesa_configurations", title: "M-Pesa Configuration", singular: "M-Pesa Configuration", path: "/collections/mpesa-settings", module: "collections", icon: Smartphone, searchFields: ["paybill", "till_number", "shortcode", "environment", "status"], listFields: ["paybill", "till_number", "shortcode", "environment", "status"], fields: [
    { key: "paybill", label: "Paybill", type: "text" },
    { key: "till_number", label: "Till Number", type: "text" },
    { key: "shortcode", label: "Shortcode", type: "text" },
    { key: "consumer_key", label: "Consumer Key", type: "text" },
    { key: "consumer_secret", label: "Consumer Secret", type: "text" },
    { key: "passkey", label: "Passkey", type: "text" },
    { key: "callback_url", label: "Callback URL", type: "text" },
    { key: "environment", label: "Environment", type: "select", options: ["Sandbox", "Production"] },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  customer_accounts: { key: "customer_accounts", table: "customer_accounts", title: "Customer Accounts", singular: "Customer Account", path: "/collections/customer-accounts", module: "collections", icon: Wallet, searchFields: ["risk_level", "status"], listFields: ["customer_id", "current_balance", "credit_limit", "available_credit", "overdue_balance", "risk_level"], fields: [
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "opening_balance", label: "Opening Balance", type: "currency" },
    { key: "current_balance", label: "Current Balance", type: "currency" },
    { key: "credit_limit", label: "Credit Limit", type: "currency" },
    { key: "overdue_balance", label: "Overdue Balance", type: "currency" },
    { key: "risk_level", label: "Risk Level", type: "select", options: statuses.risk },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  customer_account_ledger: { key: "customer_account_ledger", table: "customer_account_ledger", title: "Customer Statements", singular: "Ledger Entry", path: "/collections/statements", module: "collections", icon: FileText, searchFields: ["transaction_number", "transaction_type", "reference_document", "description"], listFields: ["transaction_number", "customer_id", "transaction_type", "debit_amount", "credit_amount", "balance_after"], fields: [
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "transaction_type", label: "Transaction Type", type: "select", options: ["Opening Balance", "Invoice", "Delivery", "Payment", "Credit Note", "Debit Note", "Write-off", "Adjustment"], required: true },
    { key: "reference_document", label: "Reference Document", type: "text" },
    { key: "transaction_date", label: "Transaction Date", type: "date" },
    { key: "debit_amount", label: "Debit Amount", type: "currency" },
    { key: "credit_amount", label: "Credit Amount", type: "currency" },
    { key: "description", label: "Description", type: "textarea" }
  ] },
  sales_invoices: { key: "sales_invoices", table: "sales_invoices", title: "Outstanding Invoices", singular: "Invoice", path: "/collections/invoices", module: "collections", icon: Receipt, searchFields: ["invoice_number", "status"], listFields: ["invoice_number", "customer_id", "invoice_date", "due_date", "total_amount", "balance_amount", "status"], workflowActions: ["post", "sync"], fields: [
    { key: "invoice_number", label: "Invoice Number", type: "text" },
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "delivery_note_id", label: "Delivery Note", type: "select", relation: "delivery_notes" },
    { key: "sales_order_id", label: "Sales Order", type: "select", relation: "sales_orders" },
    { key: "invoice_date", label: "Invoice Date", type: "date" },
    { key: "due_date", label: "Due Date", type: "date" },
    { key: "subtotal", label: "Subtotal", type: "currency" },
    { key: "tax_amount", label: "Tax", type: "currency" },
    { key: "discount_amount", label: "Discount", type: "currency" },
    { key: "total_amount", label: "Total Amount", type: "currency" },
    { key: "amount_paid", label: "Amount Paid", type: "currency" },
    { key: "status", label: "Status", type: "select", options: statuses.invoice }
  ] },
  sales_invoice_lines: { key: "sales_invoice_lines", table: "sales_invoice_lines", title: "Invoice Lines", singular: "Invoice Line", path: "/collections/invoice-lines", module: "collections", icon: FileText, searchFields: ["description", "status"], listFields: ["invoice_id", "product_id", "quantity", "unit_price", "line_total", "status"], fields: [
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices", required: true },
    { key: "product_id", label: "Product", type: "select", relation: "products" },
    { key: "description", label: "Description", type: "text" },
    { key: "quantity", label: "Quantity", type: "number" },
    { key: "unit_price", label: "Unit Price", type: "currency" },
    { key: "tax_amount", label: "Tax", type: "currency" },
    { key: "discount_amount", label: "Discount", type: "currency" }
  ] },
  customer_payments: { key: "customer_payments", table: "customer_payments", title: "Collections", singular: "Payment", path: "/collections/payments", module: "collections", icon: CreditCard, searchFields: ["receipt_number", "payment_method", "bank_reference", "notes", "status"], listFields: ["receipt_number", "customer_id", "invoice_id", "payment_method", "amount", "allocated_amount", "status"], workflowActions: ["allocate", "sync"], fields: [
    { key: "receipt_number", label: "Receipt Number", type: "text" },
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices" },
    { key: "payment_method", label: "Payment Method", type: "select", options: ["M-Pesa", "Cash", "Cheque", "Bank Transfer"], required: true },
    { key: "payment_date", label: "Payment Date", type: "datetime" },
    { key: "amount", label: "Amount", type: "currency", required: true },
    { key: "collected_by", label: "Collected By", type: "select", relation: "users" },
    { key: "bank_reference", label: "Bank Reference", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.payment }
  ] },
  payment_allocations: { key: "payment_allocations", table: "payment_allocations", title: "Payment Allocations", singular: "Payment Allocation", path: "/collections/allocations", module: "collections", icon: ClipboardCheck, searchFields: ["allocation_method", "status"], listFields: ["payment_id", "invoice_id", "customer_id", "amount_allocated", "allocation_method", "status"], fields: [
    { key: "payment_id", label: "Payment", type: "select", relation: "customer_payments", required: true },
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices", required: true },
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "amount_allocated", label: "Amount Allocated", type: "currency", required: true },
    { key: "allocation_method", label: "Allocation Method", type: "select", options: ["Oldest Invoice First", "Specific Invoice", "Customer-defined Allocation"] }
  ] },
  mpesa_collections: { key: "mpesa_collections", table: "mpesa_collections", title: "M-Pesa Collections", singular: "M-Pesa Collection", path: "/collections/mpesa", module: "collections", icon: Smartphone, searchFields: ["mpesa_receipt_number", "phone_number", "account_number", "reconciliation_status", "status"], listFields: ["mpesa_receipt_number", "account_number", "phone_number", "amount", "reconciliation_status", "status"], workflowActions: ["verify"], fields: [
    { key: "account_number", label: "Account Number", type: "text", required: true },
    { key: "mpesa_receipt_number", label: "M-Pesa Receipt", type: "text" },
    { key: "phone_number", label: "Phone Number", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "reconciliation_status", label: "Reconciliation Status", type: "select", options: ["Pending", "Matched", "Exception", "Posted"] },
    { key: "status", label: "Status", type: "select", options: statuses.payment }
  ] },
  cash_collections: { key: "cash_collections", table: "cash_collections", title: "Cash Collections", singular: "Cash Collection", path: "/collections/cash", module: "collections", icon: Wallet, searchFields: ["receipt_number", "supporting_notes", "status"], listFields: ["receipt_number", "customer_id", "invoice_id", "amount", "collection_date", "status"], workflowActions: ["approve"], fields: [
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices" },
    { key: "amount", label: "Amount", type: "currency", required: true },
    { key: "receipt_number", label: "Receipt Number", type: "text" },
    { key: "collection_date", label: "Collection Date", type: "date" },
    { key: "collected_by", label: "Collected By", type: "select", relation: "users" },
    { key: "supporting_notes", label: "Supporting Notes", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.cash }
  ] },
  cheque_collections: { key: "cheque_collections", table: "cheque_collections", title: "Cheque Collections", singular: "Cheque Collection", path: "/collections/cheques", module: "collections", icon: Landmark, searchFields: ["cheque_number", "bank", "branch", "bounced_reason", "status"], listFields: ["cheque_number", "customer_id", "bank", "amount", "maturity_date", "status"], workflowActions: ["clear", "bounce"], fields: [
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices" },
    { key: "cheque_number", label: "Cheque Number", type: "text", required: true },
    { key: "bank", label: "Bank", type: "text" },
    { key: "branch", label: "Branch", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "cheque_date", label: "Cheque Date", type: "date" },
    { key: "maturity_date", label: "Maturity Date", type: "date" },
    { key: "front_image_url", label: "Front Image URL", type: "text" },
    { key: "back_image_url", label: "Back Image URL", type: "text" },
    { key: "bounced_reason", label: "Bounced Reason", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.cheque }
  ] },
  bank_transfer_collections: { key: "bank_transfer_collections", table: "bank_transfer_collections", title: "Bank Transfers", singular: "Bank Transfer", path: "/collections/bank-transfers", module: "collections", icon: Building2, searchFields: ["bank_reference", "verification_notes", "status"], listFields: ["bank_reference", "customer_id", "invoice_id", "transaction_date", "amount", "status"], workflowActions: ["verify"], fields: [
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices" },
    { key: "bank_reference", label: "Bank Reference", type: "text", required: true },
    { key: "transaction_date", label: "Transaction Date", type: "date" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "attachment_url", label: "Attachment URL", type: "text" },
    { key: "verification_notes", label: "Verification Notes", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.bank }
  ] },
  credit_notes: { key: "credit_notes", table: "credit_notes", title: "Credit Notes", singular: "Credit Note", path: "/collections/credit-notes", module: "collections", icon: FileText, searchFields: ["credit_note_number", "reason", "status"], listFields: ["credit_note_number", "customer_id", "invoice_id", "amount", "reason", "status"], workflowActions: ["post", "sync"], fields: noteFields("credit_note_number") },
  debit_notes: { key: "debit_notes", table: "debit_notes", title: "Debit Notes", singular: "Debit Note", path: "/collections/debit-notes", module: "collections", icon: FileText, searchFields: ["debit_note_number", "reason", "status"], listFields: ["debit_note_number", "customer_id", "invoice_id", "amount", "reason", "status"], workflowActions: ["post", "sync"], fields: noteFields("debit_note_number") },
  customer_risk_scores: { key: "customer_risk_scores", table: "customer_risk_scores", title: "Customer Risk Scores", singular: "Risk Score", path: "/collections/risk-scores", module: "collections", icon: ShieldCheck, searchFields: ["risk_level", "status"], listFields: ["customer_id", "payment_delay_score", "bounced_cheque_score", "total_score", "risk_level", "calculated_at"], workflowActions: ["generate"], fields: [
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "payment_delay_score", label: "Payment Delay Score", type: "number" },
    { key: "bounced_cheque_score", label: "Bounced Cheque Score", type: "number" },
    { key: "credit_breach_score", label: "Credit Breach Score", type: "number" },
    { key: "complaint_score", label: "Complaint Score", type: "number" },
    { key: "return_score", label: "Return Score", type: "number" },
    { key: "risk_level", label: "Risk Level", type: "select", options: statuses.risk }
  ] },
  finance_integration_events: { key: "finance_integration_events", table: "finance_integration_events", title: "Finance Integration", singular: "Finance Event", path: "/enterprise/integrations", module: "enterprise", icon: Building2, searchFields: ["source_module", "source_table", "event_type", "target_system", "status"], listFields: ["event_type", "source_module", "target_system", "posted_at", "status"], workflowActions: ["sync"], fields: [
    { key: "source_module", label: "Source Module", type: "text", required: true },
    { key: "source_table", label: "Source Table", type: "text", required: true },
    { key: "source_id", label: "Source ID", type: "text", required: true },
    { key: "event_type", label: "Event Type", type: "text", required: true },
    { key: "target_system", label: "Target System", type: "text" },
    { key: "error_message", label: "Error Message", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.finance }
  ] },
  ai_insights: { key: "ai_insights", table: "ai_insights", title: "SolvaFlow AI Insights", singular: "AI Insight", path: "/ai/insights", module: "ai", icon: Bot, searchFields: ["insight_number", "insight_type", "module_key", "title", "summary", "recommendation", "status"], listFields: ["insight_number", "insight_type", "module_key", "title", "confidence_score", "status"], workflowActions: ["generate", "resolve"], fields: [
    { key: "insight_type", label: "Insight Type", type: "select", options: ["Demand Forecast", "Procurement Forecast", "Collections Insight", "Sales Insight", "Delivery Insight", "Production Insight"], required: true },
    { key: "module_key", label: "Module", type: "text", required: true },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "summary", label: "Summary", type: "textarea", required: true },
    { key: "recommendation", label: "Recommendation", type: "textarea" },
    { key: "confidence_score", label: "Confidence Score", type: "number" },
    { key: "status", label: "Status", type: "select", options: ["Open", "Reviewed", "Resolved", "Archived"] }
  ] },
  ai_chat_threads: { key: "ai_chat_threads", table: "ai_chat_threads", title: "AI Chat Threads", singular: "AI Chat Thread", path: "/ai/chat-threads", module: "ai", icon: MessageSquare, searchFields: ["title", "status"], listFields: ["title", "user_id", "created_at", "status"], fields: [{ key: "user_id", label: "User", type: "select", relation: "users" }, { key: "title", label: "Title", type: "text" }, { key: "status", label: "Status", type: "select", options: statuses.active }] },
  ai_chat_messages: { key: "ai_chat_messages", table: "ai_chat_messages", title: "AI Chat Assistant", singular: "AI Chat Message", path: "/ai/chat", module: "ai", icon: MessageSquare, searchFields: ["role", "content", "tool_name", "status"], listFields: ["thread_id", "role", "content", "tool_name", "created_at"], workflowActions: ["generate"], fields: [
    { key: "thread_id", label: "Thread", type: "select", relation: "ai_chat_threads", required: true },
    { key: "role", label: "Role", type: "select", options: ["user", "assistant", "system"], required: true },
    { key: "content", label: "Content", type: "textarea", required: true },
    { key: "tool_name", label: "Tool Name", type: "text" }
  ] },
  kpi_definitions: { key: "kpi_definitions", table: "kpi_definitions", title: "KPI Engine", singular: "KPI Definition", path: "/ai/kpis", module: "ai", icon: Gauge, searchFields: ["kpi_key", "kpi_name", "module_key", "calculation_method", "status"], listFields: ["kpi_key", "kpi_name", "module_key", "target_value", "frequency", "status"], fields: [
    { key: "kpi_key", label: "KPI Key", type: "text", required: true },
    { key: "kpi_name", label: "KPI Name", type: "text", required: true },
    { key: "module_key", label: "Module", type: "text", required: true },
    { key: "calculation_method", label: "Calculation Method", type: "textarea", required: true },
    { key: "target_value", label: "Target Value", type: "number" },
    { key: "unit", label: "Unit", type: "text" },
    { key: "frequency", label: "Frequency", type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly"] },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  kpi_snapshots: { key: "kpi_snapshots", table: "kpi_snapshots", title: "KPI Snapshots", singular: "KPI Snapshot", path: "/ai/kpi-snapshots", module: "ai", icon: BarChart3, searchFields: ["status"], listFields: ["kpi_definition_id", "snapshot_date", "actual_value", "target_value", "variance", "status"], fields: [
    { key: "kpi_definition_id", label: "KPI", type: "select", relation: "kpi_definitions", required: true },
    { key: "snapshot_date", label: "Snapshot Date", type: "date" },
    { key: "actual_value", label: "Actual Value", type: "number" },
    { key: "target_value", label: "Target Value", type: "number" },
    { key: "variance", label: "Variance", type: "number" }
  ] },
  alert_center: { key: "alert_center", table: "alert_center", title: "Alert Center", singular: "Alert", path: "/enterprise/alerts", module: "enterprise", icon: AlertTriangle, searchFields: ["alert_number", "alert_type", "severity", "title", "message", "status"], listFields: ["alert_number", "alert_type", "severity", "title", "assigned_to", "status"], workflowActions: ["acknowledge", "resolve"], fields: [
    { key: "alert_type", label: "Alert Type", type: "select", options: ["Low stock", "Expired stock", "Delayed delivery", "Overdue invoice", "Bounced cheque", "Failed QC", "Production delay", "Customer complaint"], required: true },
    { key: "severity", label: "Severity", type: "select", options: statuses.severity },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "message", label: "Message", type: "textarea", required: true },
    { key: "source_module", label: "Source Module", type: "text" },
    { key: "assigned_to", label: "Assigned To", type: "select", relation: "users" },
    { key: "status", label: "Status", type: "select", options: statuses.alert }
  ] },
  document_attachments: { key: "document_attachments", table: "document_attachments", title: "Document Management", singular: "Document", path: "/enterprise/documents", module: "enterprise", icon: Upload, searchFields: ["module_key", "table_name", "document_name", "document_type", "status"], listFields: ["document_name", "module_key", "table_name", "document_type", "uploaded_by", "status"], fields: [
    { key: "module_key", label: "Module", type: "text", required: true },
    { key: "table_name", label: "Table Name", type: "text", required: true },
    { key: "record_id", label: "Record ID", type: "text", required: true },
    { key: "document_name", label: "Document Name", type: "text", required: true },
    { key: "document_type", label: "Document Type", type: "select", options: ["PDF", "Image", "Excel", "Word", "Other"] },
    { key: "file_url", label: "File URL", type: "text", required: true },
    { key: "file_size_bytes", label: "File Size Bytes", type: "number" },
    { key: "uploaded_by", label: "Uploaded By", type: "select", relation: "users" }
  ] },
  approval_workflows: { key: "approval_workflows", table: "approval_workflows", title: "Approval Workflows", singular: "Approval Workflow", path: "/enterprise/approval-workflows", module: "enterprise", icon: ClipboardCheck, searchFields: ["workflow_key", "workflow_name", "module_key", "required_role_key", "status"], listFields: ["workflow_key", "workflow_name", "module_key", "threshold_amount", "status"], fields: [
    { key: "workflow_key", label: "Workflow Key", type: "text", required: true },
    { key: "workflow_name", label: "Workflow Name", type: "text", required: true },
    { key: "module_key", label: "Module", type: "text", required: true },
    { key: "threshold_amount", label: "Threshold Amount", type: "currency" },
    { key: "required_role_key", label: "Required Role Key", type: "text" },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  approval_requests: { key: "approval_requests", table: "approval_requests", title: "Approval Requests", singular: "Approval Request", path: "/enterprise/approvals", module: "enterprise", icon: ClipboardCheck, searchFields: ["module_key", "table_name", "reason", "decision_notes", "status"], listFields: ["module_key", "table_name", "requested_by", "amount", "assigned_to", "status"], workflowActions: ["approve", "reject"], fields: [
    { key: "workflow_id", label: "Workflow", type: "select", relation: "approval_workflows" },
    { key: "module_key", label: "Module", type: "text", required: true },
    { key: "table_name", label: "Table Name", type: "text", required: true },
    { key: "record_id", label: "Record ID", type: "text", required: true },
    { key: "requested_by", label: "Requested By", type: "select", relation: "users" },
    { key: "assigned_to", label: "Assigned To", type: "select", relation: "users" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "reason", label: "Reason", type: "textarea" },
    { key: "decision_notes", label: "Decision Notes", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.approval }
  ] },
  user_devices: { key: "user_devices", table: "user_devices", title: "Device Tracking", singular: "User Device", path: "/enterprise/devices", module: "enterprise", icon: ShieldCheck, searchFields: ["device_fingerprint", "device_name", "user_agent", "status"], listFields: ["user_id", "device_name", "last_seen_at", "trusted", "status"], fields: [
    { key: "user_id", label: "User", type: "select", relation: "users", required: true },
    { key: "device_fingerprint", label: "Device Fingerprint", type: "text" },
    { key: "device_name", label: "Device Name", type: "text" },
    { key: "user_agent", label: "User Agent", type: "textarea" },
    { key: "trusted", label: "Trusted", type: "checkbox" },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  security_policies: { key: "security_policies", table: "security_policies", title: "Security Policies", singular: "Security Policy", path: "/enterprise/security", module: "enterprise", icon: ShieldCheck, searchFields: ["ip_allowlist", "status"], listFields: ["mfa_required", "session_timeout_minutes", "password_min_length", "role_review_frequency_days", "status"], fields: [
    { key: "mfa_required", label: "MFA Required", type: "checkbox" },
    { key: "session_timeout_minutes", label: "Session Timeout Minutes", type: "number" },
    { key: "password_min_length", label: "Password Min Length", type: "number" },
    { key: "password_rotation_days", label: "Password Rotation Days", type: "number" },
    { key: "ip_allowlist", label: "IP Allowlist", type: "textarea" },
    { key: "role_review_frequency_days", label: "Role Review Frequency Days", type: "number" },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  backup_jobs: { key: "backup_jobs", table: "backup_jobs", title: "Backup & Recovery", singular: "Backup Job", path: "/enterprise/backups", module: "enterprise", icon: FileArchive, searchFields: ["job_name", "schedule", "verification_status", "recovery_notes", "status"], listFields: ["job_name", "schedule", "last_run_at", "next_run_at", "verification_status", "status"], fields: [
    { key: "job_name", label: "Job Name", type: "text", required: true },
    { key: "schedule", label: "Schedule", type: "select", options: ["Hourly", "Daily", "Weekly", "Monthly"] },
    { key: "last_run_at", label: "Last Run At", type: "datetime" },
    { key: "next_run_at", label: "Next Run At", type: "datetime" },
    { key: "storage_location", label: "Storage Location", type: "text" },
    { key: "verification_status", label: "Verification Status", type: "select", options: ["Pending", "Verified", "Failed"] },
    { key: "recovery_notes", label: "Recovery Notes", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  integration_endpoints: { key: "integration_endpoints", table: "integration_endpoints", title: "API Integrations", singular: "Integration Endpoint", path: "/enterprise/api-layer", module: "enterprise", icon: Building2, searchFields: ["endpoint_name", "integration_type", "base_url", "auth_type", "status"], listFields: ["endpoint_name", "integration_type", "enabled", "base_url", "status"], fields: [
    { key: "endpoint_name", label: "Endpoint Name", type: "text", required: true },
    { key: "integration_type", label: "Integration Type", type: "select", options: ["Mobile App", "Customer App", "Distributor App", "E-commerce", "SolvaHR", "Solva Finance", "Solco"] },
    { key: "base_url", label: "Base URL", type: "text" },
    { key: "auth_type", label: "Auth Type", type: "select", options: ["None", "API Key", "OAuth", "JWT"] },
    { key: "enabled", label: "Enabled", type: "checkbox" },
    { key: "status", label: "Status", type: "select", options: statuses.active }
  ] },
  implementation_status: { key: "implementation_status", table: "implementation_status", title: "Implementation Status", singular: "Implementation Status", path: "/enterprise/implementation-status", module: "enterprise", icon: Gauge, searchFields: ["readiness_notes", "status"], listFields: ["users_onboarded", "go_live_readiness_score", "readiness_notes", "status"], fields: [
    { key: "users_onboarded", label: "Users Onboarded", type: "number" },
    { key: "go_live_readiness_score", label: "Go-Live Readiness Score", type: "number" },
    { key: "readiness_notes", label: "Readiness Notes", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: ["In Progress", "Ready", "Blocked", "Live"] }
  ] }
};

function noteFields(numberKey: "credit_note_number" | "debit_note_number"): FinalField[] {
  return [
    { key: numberKey, label: numberKey === "credit_note_number" ? "Credit Note Number" : "Debit Note Number", type: "text" },
    { key: "customer_id", label: "Customer", type: "select", relation: "customers", required: true },
    { key: "invoice_id", label: "Invoice", type: "select", relation: "sales_invoices" },
    { key: "note_date", label: "Note Date", type: "date" },
    { key: "amount", label: "Amount", type: "currency", required: true },
    { key: "reason", label: "Reason", type: "textarea", required: true },
    { key: "status", label: "Status", type: "select", options: statuses.note }
  ];
}

export const collectionsNavigation = [
  { href: "/collections", label: "Collections Dashboard", icon: BarChart3 },
  { href: "/collections/customer-accounts", label: "Customer Accounts", icon: Wallet },
  { href: "/collections/invoices", label: "Outstanding Invoices", icon: Receipt },
  { href: "/collections/payments", label: "Collections", icon: CreditCard },
  { href: "/collections/mpesa", label: "M-Pesa Collections", icon: Smartphone },
  { href: "/collections/cash", label: "Cash Collections", icon: Wallet },
  { href: "/collections/cheques", label: "Cheque Collections", icon: Landmark },
  { href: "/collections/bank-transfers", label: "Bank Transfers", icon: Building2 },
  { href: "/collections/statements", label: "Customer Statements", icon: FileText },
  { href: "/collections/credit-notes", label: "Credit Notes", icon: FileText },
  { href: "/collections/debit-notes", label: "Debit Notes", icon: FileText },
  { href: "/collections/reports", label: "Collection Reports", icon: BarChart3 },
  { href: "/collections/settings", label: "Collections Settings", icon: Settings }
];

export const aiNavigation = [
  { href: "/ai", label: "AI Dashboard", icon: Bot },
  { href: "/ai/insights", label: "AI Insights", icon: Bot },
  { href: "/ai/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/ai/kpis", label: "KPI Engine", icon: Gauge }
];

export const enterpriseNavigation = [
  { href: "/enterprise", label: "Command Center", icon: Gauge },
  { href: "/enterprise/alerts", label: "Alert Center", icon: AlertTriangle },
  { href: "/enterprise/documents", label: "Documents", icon: Upload },
  { href: "/enterprise/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/enterprise/security", label: "Security", icon: ShieldCheck },
  { href: "/enterprise/backups", label: "Backups", icon: FileArchive },
  { href: "/enterprise/api-layer", label: "API Layer", icon: Building2 },
  { href: "/enterprise/implementation-status", label: "Implementation Status", icon: Gauge }
];
