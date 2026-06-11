"use client";

import { FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/button";

const reportGroups = [
  "Executive Reports",
  "Operations Reports",
  "Production Reports",
  "Inventory Reports",
  "Sales Reports",
  "Distribution Reports",
  "Collections Reports",
  "Customer Reports",
  "AI Insight Reports",
  "Aging Reports"
];

export function FinalReports({ title = "Final Reports Suite" }: { title?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">SolvaFlow Reports</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">{title}</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportGroups.map((report) => (
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
