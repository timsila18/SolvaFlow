"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, PackageCheck } from "lucide-react";

export function InventoryDashboard() {
  const [data, setData] = useState<any>({ metrics: [], topItems: [] });

  useEffect(() => {
    fetch("/api/inventory/dashboard").then((response) => response.json()).then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Inventory & Warehouse</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">Inventory Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(data.metrics ?? []).map((metric: any) => (
          <div key={metric.label} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">{metric.label}</div>
              {String(metric.label).toLowerCase().includes("expired") || String(metric.label).toLowerCase().includes("low") ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Boxes className="h-4 w-4 text-solva-blue" />}
            </div>
            <div className="mt-3 text-3xl font-black">{metric.value}</div>
          </div>
        ))}
      </div>
      <section className="rounded-md border border-solva-line bg-white shadow-panel">
        <div className="flex items-center gap-2 border-b border-solva-line px-4 py-3 font-bold"><PackageCheck className="h-4 w-4" /> Top Inventory Value Items</div>
        <div className="divide-y divide-solva-line">
          {(data.topItems ?? []).length === 0 ? <div className="p-4 text-sm text-slate-500">No stock balances yet.</div> : data.topItems.map((row: any, index: number) => (
            <div key={`${row.product_id}-${index}`} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-4">
              <div className="font-semibold">{row.products?.product_name ?? row.product_id}</div>
              <div>Qty: {row.total_quantity}</div>
              <div>Available: {row.available_quantity}</div>
              <div className="font-bold">Value: {row.total_value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
