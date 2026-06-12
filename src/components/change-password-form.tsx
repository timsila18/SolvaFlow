"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";

export function ChangePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Unable to change password.");
      return;
    }

    setMessage("Password changed. Opening your dashboard...");
    router.push("/dashboard");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-md border border-solva-line bg-white p-6 shadow-panel">
      <h1 className="text-3xl font-black">Change Password</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">Set a private password before continuing.</p>
      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
      {message && <div className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-solva-blue">{message}</div>}
      <label className="mt-6 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">New Password</span>
        <input className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} required />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Confirm Password</span>
        <input className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={10} required />
      </label>
      <Button className="mt-6 w-full">Update Password</Button>
    </form>
  );
}
