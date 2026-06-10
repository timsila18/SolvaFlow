"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";

const fields = [
  "company_name", "company_pin", "registration_number", "industry", "email", "phone", "address", "county", "country", "website",
  "primary_contact_person", "business_type", "number_of_employees", "number_of_warehouses", "default_currency", "financial_year_start",
  "financial_year_end", "timezone"
];

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || "Unable to onboard company.");
    router.push("/dashboard");
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-solva-line bg-white p-6 shadow-panel">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Company Setup</div>
        <h1 className="mt-1 text-3xl font-black">Onboard Manufacturer</h1>
      </div>
      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <label key={field}>
            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{field.replace(/_/g, " ")}</span>
            <input
              name={field}
              type={field.includes("date") ? "date" : field.includes("email") ? "email" : field.includes("number") ? "number" : "text"}
              defaultValue={field === "country" ? "Kenya" : field === "default_currency" ? "KES" : field === "timezone" ? "Africa/Nairobi" : ""}
              className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue"
              required={["company_name", "industry", "country", "default_currency", "timezone"].includes(field)}
            />
          </label>
        ))}
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Status</span>
          <select name="status" className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue">
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
          </select>
        </label>
      </div>
      <Button className="mt-6">Create Company</Button>
    </form>
  );
}
