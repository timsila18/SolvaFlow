"use client";

import { useEffect, useState } from "react";

export function RolesAdmin() {
  const [data, setData] = useState<any>({ roles: [], permissions: [] });

  useEffect(() => {
    fetch("/api/roles").then((response) => response.json()).then(setData);
  }, []);

  const pages = Array.from(new Set<string>((data.permissions ?? []).map((permission: any) => `${permission.module_key}.${permission.page_key}`)));
  const actions = ["view", "create", "edit", "delete", "approve", "reject", "export", "print", "administer"];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">Security</div>
        <h1 className="mt-1 text-3xl font-black">Permission Matrix</h1>
      </div>
      <section className="overflow-x-auto rounded-md border border-solva-line bg-white shadow-panel">
        <table className="min-w-full divide-y divide-solva-line text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Role</th>
              {pages.map((page) => <th key={page} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{page}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-solva-line">
            {(data.roles ?? []).map((role: any) => (
              <tr key={role.id}>
                <td className="sticky left-0 bg-white px-4 py-3 font-bold">{role.role_name}</td>
                {pages.map((page) => {
                  const granted = role.role_permissions?.map((rp: any) => `${rp.permissions.module_key}.${rp.permissions.page_key}.${rp.permissions.action_key}`) ?? [];
                  return (
                    <td key={page} className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {actions.map((action) => (
                          <span key={action} className={`rounded px-2 py-1 text-xs font-bold ${granted.includes(`${page}.${action}`) ? "bg-blue-50 text-solva-blue" : "bg-slate-100 text-slate-400"}`}>{action}</span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
