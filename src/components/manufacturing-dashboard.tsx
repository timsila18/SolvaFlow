"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Factory, Gauge, PackageCheck } from "lucide-react";

export function ManufacturingDashboard() {
  const [data, setData] = useState<any>({ metrics: [], topProducts: [] });

  useEffect(() => {
    fetch("/api/manufacturing/dashboard").then((response) => response.json()).then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Manufacturing</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">Production Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data.metrics ?? []).map((metric: any) => (
          <div key={metric.label} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">{metric.label}</div>
              {metric.label.includes("shortage") ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Gauge className="h-4 w-4 text-solva-blue" />}
            </div>
            <div className="mt-3 text-3xl font-black">{metric.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-md border border-solva-line bg-white shadow-panel xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-solva-line px-4 py-3 font-bold"><Factory className="h-4 w-4" /> Top Produced Products</div>
          <div className="divide-y divide-solva-line">
            {(data.topProducts ?? []).length === 0 ? <div className="p-4 text-sm text-slate-500">No completed production batches yet.</div> : data.topProducts.map((row: any, index: number) => (
              <div key={`${row.product_id}-${index}`} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-semibold">{row.products?.product_name ?? row.product_id}</span>
                <span>{row.quantity_produced}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-md border border-solva-line bg-white p-4 shadow-panel">
          <div className="flex items-center gap-2 font-bold"><PackageCheck className="h-4 w-4" /> Factory Controls</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="rounded-md bg-solva-soft px-3 py-2">Recipe costing updates when BOM lines change.</div>
            <div className="rounded-md bg-solva-soft px-3 py-2">QC decisions update batch quality status.</div>
            <div className="rounded-md bg-solva-soft px-3 py-2">Material shortages block order approval unless overridden.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
