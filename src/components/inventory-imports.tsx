"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/button";

const templates = ["Products", "Customers", "Suppliers", "Warehouses", "Opening Stock", "Price Lists"];

export function InventoryImports() {
  const [template, setTemplate] = useState(templates[0]);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<any>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/inventory/import-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template, csv })
    });
    setPreview(await response.json());
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Inventory & Warehouse</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">Excel Imports</h1>
      </div>
      <form onSubmit={submit} className="rounded-md border border-solva-line bg-white p-4 shadow-panel">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Template</span>
            <select value={template} onChange={(event) => setTemplate(event.target.value)} className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue">
              {templates.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="rounded-md bg-solva-soft px-3 py-2 text-sm font-semibold">Paste CSV exported from Excel for validation preview before posting.</div>
        </div>
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} className="mt-4 min-h-56 w-full rounded-md border border-solva-line px-3 py-2 font-mono text-sm outline-none focus:border-solva-blue" placeholder="Column 1,Column 2&#10;Value 1,Value 2" />
        <Button className="mt-4">Validate Import</Button>
      </form>
      {preview && (
        <section className="rounded-md border border-solva-line bg-white p-4 shadow-panel">
          <div className="font-bold">Preview</div>
          {preview.errors?.length > 0 && <div className="mt-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{preview.errors.join(" | ")}</div>}
          <div className="mt-3 text-sm text-slate-600">Required columns: {preview.required?.join(", ")}</div>
          <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-solva-soft p-3 text-xs">{JSON.stringify(preview.rows, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
