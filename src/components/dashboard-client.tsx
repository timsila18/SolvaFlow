"use client";

import { useEffect, useState } from "react";
import { Activity, Database, ShieldCheck } from "lucide-react";

export function DashboardClient() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((response) => response.json()).then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Executive Dashboard</div>
        <h1 className="mt-1 text-3xl font-black">SolvaFlow Control Center</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((metric: any) => (
          <div key={metric.label} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
            <div className="text-sm font-semibold text-slate-500">{metric.label}</div>
            <div className="mt-3 text-3xl font-black">{metric.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-md border border-solva-line bg-white shadow-panel xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-solva-line px-4 py-3 font-bold"><Activity className="h-4 w-4" /> Recent Activities</div>
          <div className="divide-y divide-solva-line">
            {(data?.activities ?? []).length === 0 ? <div className="p-4 text-sm text-slate-500">No audit activity yet.</div> : data.activities.map((item: any) => (
              <div key={item.id} className="px-4 py-3 text-sm">
                <span className="font-semibold">{item.action_key}</span> in {item.module_key}
                <div className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-md border border-solva-line bg-white shadow-panel">
          <div className="flex items-center gap-2 border-b border-solva-line px-4 py-3 font-bold"><ShieldCheck className="h-4 w-4" /> System Health</div>
          <div className="space-y-3 p-4">
            {Object.entries(data?.health ?? { database: "Loading" }).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-solva-soft px-3 py-2 text-sm">
                <span className="font-semibold">{key}</span>
                <span className="text-solva-blue">{String(value)}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Database className="h-4 w-4" /> Tenant RLS is enforced at the database layer.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
