"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Factory, LogOut, Search, ShieldCheck } from "lucide-react";
import { navigation, entityConfigs } from "@/lib/entities";
import { manufacturingNavigation } from "@/lib/manufacturing";
import { inventoryNavigation } from "@/lib/inventory";
import { salesDistributionNavigation } from "@/lib/sales-distribution";
import { aiNavigation, collectionsNavigation, enterpriseNavigation } from "@/lib/collections";
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
    <div className="enterprise-shell min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-80 overflow-y-auto border-r border-white/10 bg-solva-ink text-white lg:block">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-solva-blue shadow-lg">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-normal">SolvaFlow</div>
              <div className="text-xs font-semibold text-slate-300">From Production to Payment.</div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-300">Workspace</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-2 text-sm font-black">Safa Dairy Ltd</div>
            <div className="mt-1 text-xs font-medium text-slate-300">Manufacturing ERP tenant</div>
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
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  pathname === item.href && "bg-white text-solva-ink shadow-lg"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Master Data</div>
          {Object.values(entityConfigs).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  pathname === item.path && "bg-white text-solva-ink shadow-lg"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.path && "bg-blue-50 text-solva-blue")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.title}</span>
                {pathname === item.path && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Manufacturing</div>
          {manufacturingNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  pathname === item.href && "bg-white text-solva-ink shadow-lg"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Inventory & Warehouse</div>
          {inventoryNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  pathname === item.href && "bg-white text-solva-ink shadow-lg"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Sales & Distribution</div>
          {salesDistributionNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  pathname === item.href && "bg-white text-solva-ink shadow-lg"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Collections & Receivables</div>
          {collectionsNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white", pathname === item.href && "bg-white text-solva-ink shadow-lg")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}><Icon className="h-4 w-4" /></span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">SolvaFlow AI</div>
          {aiNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white", pathname === item.href && "bg-white text-solva-ink shadow-lg")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}><Icon className="h-4 w-4" /></span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Enterprise</div>
          {enterpriseNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white", pathname === item.href && "bg-white text-solva-ink shadow-lg")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === item.href && "bg-blue-50 text-solva-blue")}><Icon className="h-4 w-4" /></span>
                <span className="flex-1">{item.label}</span>
                {pathname === item.href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
              </Link>
            );
          })}
          <div className="px-3 pt-5 text-xs font-bold uppercase text-slate-500">Administration</div>
          {[
            ["/settings/company", "Company & Branding"],
            ["/settings/roles", "Roles & Permissions"],
            ["/settings/audit", "Audit Trail"]
          ].map(([href, label]) => (
            <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white", pathname === href && "bg-white text-solva-ink shadow-lg")}>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-slate-200", pathname === href && "bg-blue-50 text-solva-blue")}><ShieldCheck className="h-4 w-4" /></span>
              <span className="flex-1">{label}</span>
              {pathname === href && <ChevronRight className="h-4 w-4 text-solva-blue" />}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-80">
        <header className="sticky top-0 z-10 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
          <div className="flex h-20 items-center gap-4 px-4 lg:px-8">
            <Link href="/dashboard" className="font-black lg:hidden">SolvaFlow</Link>
            <div className="relative max-w-3xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-xl border border-solva-line bg-white pl-12 pr-4 text-sm font-medium outline-none focus:border-solva-blue"
                placeholder="Search products, customers, suppliers, warehouses, users, vehicles, routes..."
              />
              {results.length > 0 && (
                <div className="absolute left-0 right-0 top-14 rounded-xl border border-solva-line bg-white p-2 shadow-2xl">
                  {results.map((result, index) => (
                    <Link key={`${result.entity}-${index}`} href={result.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-solva-soft" onClick={() => setQuery("")}>
                      <span className="font-semibold">{result.title}</span>
                      <span className="ml-2 text-xs text-slate-500">{result.entity.replace(/_/g, " ")}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 xl:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live tenant
            </div>
            <Link href="/settings/audit" className="icon-button" title="Audit trail">
              <Bell className="h-4 w-4" />
            </Link>
            <button onClick={logout} className="icon-button" title="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="px-4 py-7 lg:px-8 xl:px-10">{children}</div>
      </main>
    </div>
  );
}
