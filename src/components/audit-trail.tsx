"use client";

import { useEffect, useState } from "react";

export function AuditTrail() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/entities/products").then(() => {
      fetch("/api/dashboard").then((response) => response.json()).then((payload) => setRows(payload.activities ?? []));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Governance</div>
        <h1 className="mt-1 text-3xl font-black">Audit Trail</h1>
      </div>
      <section className="rounded-md border border-solva-line bg-white shadow-panel">
        <div className="border-b border-solva-line px-4 py-3 font-bold">Recent Actions</div>
        <div className="divide-y divide-solva-line">
          {rows.length === 0 ? <div className="p-4 text-sm text-slate-500">No audit records found.</div> : rows.map((row) => (
            <div key={row.id} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-4">
              <div className="font-semibold">{row.module_key}</div>
              <div>{row.action_key}</div>
              <div>{row.table_name}</div>
              <div className="text-slate-500">{new Date(row.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
