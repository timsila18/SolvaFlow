"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, MapPin, Truck } from "lucide-react";

export function SalesDistributionDashboard() {
  const [data, setData] = useState<any>({ metrics: [], byRep: [] });

  useEffect(() => {
    fetch("/api/sales-distribution/dashboard").then((response) => response.json()).then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Sales & Distribution</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">Sales Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(data.metrics ?? []).map((metric: any) => (
          <div key={metric.label} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">{metric.label}</div>
              {String(metric.label).toLowerCase().includes("failed") || String(metric.label).toLowerCase().includes("exception") ? <AlertTriangle className="h-4 w-4 text-red-600" /> : String(metric.label).toLowerCase().includes("transit") ? <Truck className="h-4 w-4 text-solva-blue" /> : <BarChart3 className="h-4 w-4 text-solva-blue" />}
            </div>
            <div className="mt-3 text-3xl font-black">{metric.value}</div>
          </div>
        ))}
      </div>
      <section className="rounded-md border border-solva-line bg-white shadow-panel">
        <div className="flex items-center gap-2 border-b border-solva-line px-4 py-3 font-bold"><MapPin className="h-4 w-4" /> Sales Rep Activity</div>
        <div className="divide-y divide-solva-line">
          {(data.byRep ?? []).length === 0 ? <div className="p-4 text-sm text-slate-500">No sales activity yet.</div> : data.byRep.map((row: any, index: number) => (
            <div key={`${row.sales_rep_id}-${index}`} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-3">
              <div className="font-semibold">{row.sales_rep_id ?? "Unassigned"}</div>
              <div>Order value: {row.total_amount}</div>
              <div className="text-slate-500">Recent sales order</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
