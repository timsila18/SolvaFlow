"use client";

import { FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/button";

const reports = [
  "Sales Order Report",
  "Field Visit Report",
  "GPS Visit Exception Report",
  "Sales Rep Performance Report",
  "Customer Order Report",
  "Dispatch Report",
  "Delivery Note Report",
  "Driver Delivery Report",
  "Failed Delivery Report",
  "Customer Return Report",
  "Complaint Report",
  "Territory Sales Report",
  "Route Performance Report"
];

export function SalesDistributionReports() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Sales & Distribution</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">Sales Reports</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <div key={report} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
            <div className="font-bold">{report}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="bg-solva-ink"><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
              <Button><Printer className="h-4 w-4" /> PDF</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
