"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/button";

export function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
    fetch("/api/roles").then((response) => response.json()).then((payload) => setRoles(payload.roles ?? []));
  }, []);

  async function load() {
    const payload = await fetch("/api/admin/users").then((response) => response.json());
    setUsers(payload.data ?? []);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    const payload = await response.json();
    setMessage(response.ok ? `User created. Temporary password: ${payload.temporary_password}` : payload.error);
    if (response.ok) {
      event.currentTarget.reset();
      load();
    }
  }

  async function updateUser(id: string, updates: Record<string, unknown>) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Security</div>
        <h1 className="mt-1 text-3xl font-black">User Management</h1>
      </div>
      {message && <div className="rounded-md border border-solva-line bg-white px-4 py-3 text-sm font-semibold">{message}</div>}
      <form onSubmit={submit} className="grid gap-4 rounded-md border border-solva-line bg-white p-4 shadow-panel md:grid-cols-3">
        {["employee_number", "full_name", "email", "phone", "department", "designation", "temporary_password"].map((field) => (
          <label key={field}>
            <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{field.replace(/_/g, " ")}</span>
            <input name={field} type={field === "email" ? "email" : field === "temporary_password" ? "password" : "text"} className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue" required={["full_name", "email"].includes(field)} />
          </label>
        ))}
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Role</span>
          <select name="role_id" className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue">
            {roles.map((role) => <option key={role.id} value={role.id}>{role.role_name}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Status</span>
          <select name="status" className="h-10 w-full rounded-md border border-solva-line px-3 outline-none focus:border-solva-blue">
            <option>Active</option><option>Inactive</option><option>Suspended</option><option>Pending</option>
          </select>
        </label>
        <Button className="md:col-span-3">Create User</Button>
      </form>
      <section className="overflow-hidden rounded-md border border-solva-line bg-white shadow-panel">
        <div className="border-b border-solva-line px-4 py-3 font-bold">Users</div>
        <table className="min-w-full divide-y divide-solva-line text-sm">
          <thead className="bg-slate-50"><tr>{["Name", "Email", "Role", "Status", "Security"].map((head) => <th key={head} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{head}</th>)}</tr></thead>
          <tbody className="divide-y divide-solva-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-semibold">{user.full_name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.roles?.role_name ?? "-"}</td>
                <td className="px-4 py-3">
                  <select value={user.status} onChange={(event) => updateUser(user.id, { status: event.target.value })} className="rounded border border-solva-line px-2 py-1">
                    <option>Active</option><option>Inactive</option><option>Suspended</option><option>Pending</option>
                  </select>
                </td>
                <td className="space-x-2 px-4 py-3">
                  <button onClick={() => updateUser(user.id, { force_password_change: true })} className="rounded-md border border-solva-line px-3 py-1 font-semibold">Force Reset</button>
                  <button onClick={() => updateUser(user.id, { mfa_enabled: !user.mfa_enabled })} className="rounded-md border border-solva-line px-3 py-1 font-semibold">{user.mfa_enabled ? "Disable MFA" : "Enable MFA"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
