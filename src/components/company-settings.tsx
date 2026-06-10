"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/button";

const fields = ["logo_url", "favicon_url", "primary_color", "secondary_color", "theme", "report_header", "invoice_footer", "delivery_note_footer", "email_signature", "system_watermark"];

export function CompanySettings() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company/branding").then((response) => response.json()).then((payload) => setForm(payload.data ?? {}));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/company/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setMessage(response.ok ? "Branding saved." : "Unable to save branding.");
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Company Settings</div>
        <h1 className="mt-1 text-3xl font-black">Branding Engine</h1>
      </div>
      {message && <div className="rounded-md border border-solva-line bg-white px-4 py-3 text-sm font-semibold">{message}</div>}
      <section className="grid gap-4 rounded-md border border-solva-line bg-white p-4 shadow-panel md:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className={field.includes("footer") || field.includes("signature") || field.includes("header") ? "md:col-span-2" : ""}>
            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{field.replace(/_/g, " ")}</span>
            {field.includes("footer") || field.includes("signature") || field.includes("header") ? (
              <textarea value={form[field] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="min-h-24 w-full rounded-md border border-solva-line px-3 py-2 outline-none focus:border-solva-blue" />
            ) : (
              <input type={field.includes("color") ? "color" : "text"} value={form[field] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" />
            )}
          </label>
        ))}
        <Button className="md:col-span-2"><Save className="h-4 w-4" /> Save Branding</Button>
      </section>
    </form>
  );
}
