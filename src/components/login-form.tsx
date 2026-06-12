"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || "Unable to sign in.");
    if (payload.require_password_change) {
      router.push("/change-password");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-solva-line bg-white p-7 shadow-panel">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-solva-blue text-lg font-black text-white shadow-[0_16px_34px_rgba(0,87,255,0.28)]">SF</div>
        <div>
          <h1 className="text-3xl font-black text-solva-ink">SolvaFlow</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">From Production to Payment.</p>
        </div>
      </div>
      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
      <label className="mt-6 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Email</span>
        <input className="h-12 w-full rounded-xl border border-solva-line px-3 outline-none focus:border-solva-blue" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Password</span>
        <input className="h-12 w-full rounded-xl border border-solva-line px-3 outline-none focus:border-solva-blue" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <Button className="mt-6 h-12 w-full">Sign In</Button>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">Secure tenant access with Supabase Auth, RLS, audit logging, and role-based permissions.</div>
    </form>
  );
}
