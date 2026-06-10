"use client";

import { FileDown, Printer } from "lucide-react";
import { Button } from "@/components/button";

const reports = ["Stock Balance Report", "Stock Ledger Report", "Warehouse Stock Report", "Batch Traceability Report", "Expiry Report", "Near-Expiry Report", "Stock Valuation Report", "Reorder Report", "Stock Adjustment Report", "Stock Count Variance Report", "GRN Report", "Supplier Return Report", "Opening Balance Report"];

export function InventoryReports() {
  function exportCsv(report: string) {
    const blob = new Blob([`Report,Generated At\n${report},${new Date().toISOString()}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Inventory & Warehouse</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">Inventory Reports</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <div key={report} className="rounded-md border border-solva-line bg-white p-4 shadow-panel">
            <div className="font-bold">{report}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button className="bg-solva-ink" onClick={() => exportCsv(report)}><FileDown className="h-4 w-4" /> Excel</Button>
              <Button className="bg-slate-700" onClick={() => window.print()}><Printer className="h-4 w-4" /> PDF</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
