"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/button";
import { entityConfigs, type EntityKey } from "@/lib/entities";
import { titleCase } from "@/lib/utils";

type Row = Record<string, any>;

export function EntityPage({ entityKey }: { entityKey: EntityKey }) {
  const config = entityConfigs[entityKey];
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>(() => defaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visibleFields = useMemo(() => config.fields.filter((field) => field.key !== "created_by" && field.key !== "updated_by"), [config.fields]);

  useEffect(() => {
    loadRows();
  }, [entityKey]);

  async function loadRows(nextSearch = search) {
    setLoading(true);
    const response = await fetch(`/api/entities/${entityKey}?search=${encodeURIComponent(nextSearch)}`);
    const payload = await response.json();
    setRows(payload.data ?? []);
    setError(payload.error ?? null);
    setLoading(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/entities/${entityKey}`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...form, id: editingId } : form)
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || "Unable to save record.");
      return;
    }

    setForm(defaultForm());
    setEditingId(null);
    await loadRows();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/entities/${entityKey}?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to delete record.");
      return;
    }
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-bold uppercase text-solva-blue">Master Data</div>
          <h1 className="mt-1 text-3xl font-black tracking-normal">{config.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Tenant-isolated records with audit logging, numbering rules, and Supabase RLS enforcement.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            loadRows(search);
          }}
          className="flex gap-2"
        >
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-md border border-solva-line px-3 text-sm outline-none focus:border-solva-blue" placeholder={`Search ${config.title.toLowerCase()}`} />
          <Button className="bg-solva-ink">Search</Button>
        </form>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="rounded-md border border-solva-line bg-white shadow-panel">
        <div className="flex items-center gap-3 border-b border-solva-line px-4 py-3">
          <Plus className="h-4 w-4 text-solva-blue" />
          <h2 className="font-bold">{editingId ? `Edit ${config.singular}` : `Create ${config.singular}`}</h2>
        </div>
        <form onSubmit={submit} className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleFields.map((field) => (
            <label key={field.key} className={field.type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""}>
              <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-solva-line px-3 py-2 text-sm outline-none focus:border-solva-blue"
                  required={field.required}
                />
              ) : field.type === "select" ? (
                <select
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="h-10 w-full rounded-md border border-solva-line px-3 text-sm outline-none focus:border-solva-blue"
                  required={field.required}
                >
                  <option value="">Select</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={Boolean(form[field.key])}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.checked }))}
                  className="h-5 w-5 rounded border-solva-line"
                />
              ) : (
                <input
                  type={field.type === "currency" ? "number" : field.type}
                  step={field.type === "currency" || field.type === "number" ? "0.01" : undefined}
                  value={form[field.key] ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="h-10 w-full rounded-md border border-solva-line px-3 text-sm outline-none focus:border-solva-blue"
                  required={field.required}
                />
              )}
            </label>
          ))}
          <div className="flex gap-2 md:col-span-2 xl:col-span-3">
            <Button disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving" : "Save"}
            </Button>
            {editingId && (
              <Button type="button" className="bg-slate-700" onClick={() => { setEditingId(null); setForm(defaultForm()); }}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-md border border-solva-line bg-white shadow-panel">
        <div className="border-b border-solva-line px-4 py-3 font-bold">{config.title}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-solva-line text-sm">
            <thead className="bg-slate-50">
              <tr>
                {config.listFields.map((field) => (
                  <th key={field} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{titleCase(field)}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-solva-line">
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={config.listFields.length + 1}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={config.listFields.length + 1}>No records found.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  {config.listFields.map((field) => (
                    <td key={field} className="whitespace-nowrap px-4 py-3">{formatValue(row[field])}</td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => edit(row)} className="mr-2 rounded-md border border-solva-line p-2 text-slate-700" title="Edit"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => remove(row.id)} className="rounded-md border border-red-200 p-2 text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button>
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

function defaultValue(type: string) {
  if (type === "checkbox") return false;
  return "";
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
