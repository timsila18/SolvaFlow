"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, FileCheck2, PackageCheck, Send, Truck, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
import { inventoryConfigs, type InventoryKey, type InventoryOptionSource } from "@/lib/inventory";
import { titleCase } from "@/lib/utils";

type Row = Record<string, any>;
type Options = Record<InventoryOptionSource, Array<{ value: string; label: string }>>;

export function InventoryPage({ entityKey }: { entityKey: InventoryKey }) {
  const config = inventoryConfigs[entityKey];
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>(() => defaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [options, setOptions] = useState<Options>({} as Options);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const lookup = useMemo(() => {
    const map: Record<string, string> = {};
    Object.values(options).flat().forEach((option) => (map[option.value] = option.label));
    return map;
  }, [options]);

  useEffect(() => {
    loadRows();
    fetch("/api/inventory/options").then((response) => response.json()).then((payload) => setOptions(payload.options ?? {}));
  }, [entityKey]);

  async function loadRows(nextSearch = search) {
    const response = await fetch(`/api/inventory/${entityKey}?search=${encodeURIComponent(nextSearch)}`);
    const payload = await response.json();
    setRows(payload.data ?? []);
    setError(payload.error ?? null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/inventory/${entityKey}`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...form, id: editingId } : form)
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || "Unable to save record.");
    setMessage(`${config.singular} saved.`);
    setForm(defaultForm());
    setEditingId(null);
    await loadRows();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/inventory/${entityKey}?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json();
      return setError(payload.error || "Unable to delete record.");
    }
    await loadRows();
  }

  async function runAction(id: string, action: string) {
    const response = await fetch(`/api/inventory/${entityKey}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || "Action failed.");
    setMessage(`${titleCase(action)} completed.`);
    await loadRows();
  }

  function edit(row: Row) {
    setEditingId(row.id);
    setForm(Object.fromEntries(config.fields.map((field) => [field.key, row[field.key] ?? defaultValue(field.type)])));
  }

  function defaultForm() {
    return Object.fromEntries(config.fields.map((field) => [field.key, field.type === "select" ? field.options?.[0] ?? "" : defaultValue(field.type)]));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-panel backdrop-blur lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="module-kicker">Inventory & Warehouse</div>
          <h1 className="mt-2 text-4xl font-black tracking-normal text-solva-ink">{config.title}</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">Tenant-isolated warehouse records connected to stock balances, ledger, approvals, audit trail, and notifications.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); loadRows(search); }} className="flex gap-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 rounded-xl border border-solva-line px-3 text-sm outline-none focus:border-solva-blue" placeholder={`Search ${config.title.toLowerCase()}`} />
          <Button className="bg-solva-ink">Search</Button>
        </form>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{message}</div>}

      <section className="rounded-md border border-solva-line bg-white shadow-panel">
        <div className="border-b border-solva-line bg-slate-50/70 px-5 py-4 font-bold">{editingId ? `Edit ${config.singular}` : `Create ${config.singular}`}</div>
        <form onSubmit={submit} className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {config.fields.map((field) => (
            <label key={field.key} className={field.type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""}>
              <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{field.label}</span>
              {field.type === "textarea" ? (
                <textarea value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className="min-h-28 w-full rounded-xl border border-solva-line px-3 py-2 text-sm outline-none focus:border-solva-blue" required={field.required} />
              ) : field.type === "select" ? (
                <select value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className="h-11 w-full rounded-xl border border-solva-line px-3 text-sm outline-none focus:border-solva-blue" required={field.required}>
                  <option value="">Select</option>
                  {(field.relation ? options[field.relation] ?? [] : (field.options ?? []).map((option) => ({ value: option, label: option }))).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : field.type === "checkbox" ? (
                <input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.checked }))} className="h-5 w-5 rounded border-solva-line" />
              ) : (
                <input type={field.type === "currency" || field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type} step={field.type === "currency" || field.type === "number" ? "0.01" : undefined} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} className="h-11 w-full rounded-xl border border-solva-line px-3 text-sm outline-none focus:border-solva-blue" required={field.required} />
              )}
            </label>
          ))}
          <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
            <Button><FileCheck2 className="h-4 w-4" /> Save</Button>
            {editingId && <Button type="button" className="bg-slate-700" onClick={() => { setEditingId(null); setForm(defaultForm()); }}>Cancel</Button>}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-md border border-solva-line bg-white shadow-panel">
        <div className="border-b border-solva-line bg-slate-50/70 px-5 py-4 font-bold">{config.title}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-solva-line text-sm">
            <thead className="bg-slate-50">
              <tr>{config.listFields.map((field) => <th key={field} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{titleCase(field)}</th>)}<th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-solva-line">
              {rows.length === 0 ? <tr><td className="px-4 py-6 text-slate-500" colSpan={config.listFields.length + 1}>No records found.</td></tr> : rows.map((row) => (
                <tr key={row.id}>
                  {config.listFields.map((field) => <td key={field} className="whitespace-nowrap px-4 py-3">{formatValue(row[field], lookup)}</td>)}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {config.workflowActions?.includes("submit") && <IconButton title="Submit" onClick={() => runAction(row.id, "submit")} icon={<Send className="h-4 w-4" />} />}
                      {config.workflowActions?.includes("approve") && <IconButton title="Approve" onClick={() => runAction(row.id, "approve")} icon={<CheckCircle2 className="h-4 w-4" />} />}
                      {config.workflowActions?.includes("post") && <IconButton title="Post" onClick={() => runAction(row.id, "post")} icon={<PackageCheck className="h-4 w-4" />} />}
                      {config.workflowActions?.includes("dispatch") && <IconButton title="Dispatch" onClick={() => runAction(row.id, "dispatch")} icon={<Truck className="h-4 w-4" />} />}
                      {config.workflowActions?.includes("receive") && <IconButton title="Receive" onClick={() => runAction(row.id, "receive")} icon={<PackageCheck className="h-4 w-4" />} />}
                      {config.workflowActions?.includes("convert") && <IconButton title="Convert" onClick={() => runAction(row.id, "convert")} icon={<FileCheck2 className="h-4 w-4" />} />}
                      <IconButton title="Edit" onClick={() => edit(row)} icon={<Edit3 className="h-4 w-4" />} />
                      <IconButton title="Delete" onClick={() => remove(row.id)} icon={<Trash2 className="h-4 w-4" />} danger />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function IconButton({ title, onClick, icon, danger }: { title: string; onClick: () => void; icon: React.ReactNode; danger?: boolean }) {
  return <button onClick={onClick} className={danger ? "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 shadow-sm transition hover:-translate-y-0.5" : "icon-button"} title={title}>{icon}</button>;
}

function defaultValue(type: string) {
  if (type === "checkbox") return false;
  return "";
}

function formatValue(value: unknown, lookup: Record<string, string>) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && lookup[value]) return lookup[value];
  if (typeof value === "string" && value.includes("T")) return new Date(value).toLocaleString();
  return String(value);
}
