"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/button";

export function SetupForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const payload = await response.json();
    setError(response.ok ? null : payload.error);
    setMessage(response.ok ? "Super admin created. Sign in to onboard the first company." : null);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-lg rounded-md border border-solva-line bg-white p-6 shadow-panel">
      <h1 className="text-2xl font-black">Create Platform Super Admin</h1>
      {message && <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{message}</div>}
      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
      {["full_name", "email", "password"].map((name) => (
        <label key={name} className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{name.replace(/_/g, " ")}</span>
          <input name={name} type={name === "password" ? "password" : name === "email" ? "email" : "text"} className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" required />
        </label>
      ))}
      <Button className="mt-6 w-full">Create Admin</Button>
    </form>
  );
}
