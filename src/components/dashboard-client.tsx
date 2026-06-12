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
      <div className="rounded-2xl border border-white/70 bg-white/75 p-6 shadow-panel backdrop-blur">
        <div className="module-kicker">Executive Dashboard</div>
        <h1 className="mt-2 text-4xl font-black text-solva-ink">SolvaFlow Control Center</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">A live operating view across production, inventory, sales, collections, security, and tenant health.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((metric: any) => (
          <div key={metric.label} className="rounded-2xl border border-white/70 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-500">{metric.label}</div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-3 text-4xl font-black text-solva-ink">{metric.value}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-solva-blue" /></div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-md border border-solva-line bg-white shadow-panel xl:col-span-2">
          <div className="flex items-center gap-3 border-b border-solva-line bg-slate-50/70 px-5 py-4 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-solva-blue"><Activity className="h-4 w-4" /></span> Recent Activities</div>
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
          <div className="flex items-center gap-3 border-b border-solva-line bg-slate-50/70 px-5 py-4 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck className="h-4 w-4" /></span> System Health</div>
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
