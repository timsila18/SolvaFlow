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
    <form onSubmit={submit} className="w-full max-w-md rounded-md border border-solva-line bg-white p-6 shadow-panel">
      <h1 className="text-3xl font-black">SolvaFlow</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">From Production to Payment.</p>
      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
      <label className="mt-6 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Email</span>
        <input className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Password</span>
        <input className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <Button className="mt-6 w-full">Sign In</Button>
    </form>
  );
}
