"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { navigation, entityConfigs } from "@/lib/entities";
import { manufacturingNavigation } from "@/lib/manufacturing";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ title: string; href: string; entity: string }>>([]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!query.trim()) return setResults([]);
      const response = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
      if (response.ok) setResults((await response.json()).results);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-solva-soft">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-solva-line bg-white lg:block">
        <div className="flex h-20 items-center border-b border-solva-line px-6">
          <div>
            <div className="text-xl font-black tracking-normal text-solva-ink">SolvaFlow</div>
            <div className="text-xs font-semibold text-slate-500">From Production to Payment.</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600",
                  pathname === item.href && "bg-blue-50 text-solva-blue"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="px-3 pt-4 text-xs font-bold uppercase text-slate-400">Master Data</div>
          {Object.values(entityConfigs).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600",
                  pathname === item.path && "bg-blue-50 text-solva-blue"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
          <div className="px-3 pt-4 text-xs font-bold uppercase text-slate-400">Manufacturing</div>
          {manufacturingNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600",
                  pathname === item.href && "bg-blue-50 text-solva-blue"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="px-3 pt-4 text-xs font-bold uppercase text-slate-400">Administration</div>
          {[
            ["/settings/company", "Company & Branding"],
            ["/settings/roles", "Roles & Permissions"],
            ["/settings/audit", "Audit Trail"]
          ].map(([href, label]) => (
            <Link key={href} href={href} className={cn("block rounded-md px-3 py-2 text-sm font-semibold text-slate-600", pathname === href && "bg-blue-50 text-solva-blue")}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-solva-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
            <Link href="/dashboard" className="font-black lg:hidden">SolvaFlow</Link>
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-md border border-solva-line bg-white pl-9 pr-3 text-sm outline-none focus:border-solva-blue"
                placeholder="Search products, customers, suppliers, warehouses, users, vehicles, routes..."
              />
              {results.length > 0 && (
                <div className="absolute left-0 right-0 top-12 rounded-md border border-solva-line bg-white p-2 shadow-lg">
                  {results.map((result, index) => (
                    <Link key={`${result.entity}-${index}`} href={result.href} className="block rounded px-3 py-2 text-sm hover:bg-solva-soft" onClick={() => setQuery("")}>
                      <span className="font-semibold">{result.title}</span>
                      <span className="ml-2 text-xs text-slate-500">{result.entity.replace(/_/g, " ")}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/settings/audit" className="rounded-md border border-solva-line p-2 text-slate-600" title="Audit trail">
              <Bell className="h-4 w-4" />
            </Link>
            <button onClick={logout} className="rounded-md border border-solva-line p-2 text-slate-600" title="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="px-4 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
