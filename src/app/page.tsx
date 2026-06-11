import Link from "next/link";
import { BarChart3, Bot, Boxes, CreditCard, Factory, Route, Truck } from "lucide-react";

export default function Home() {
  const sections = [
    ["Manufacturing", "Plan production, control recipes, track batches, inspect quality, and understand variance.", Factory],
    ["Inventory", "See stock balances, warehouse movements, expiry risk, valuation, and reorder pressure.", Boxes],
    ["Sales", "Manage field visits, GPS check-ins, routes, orders, and customer activity.", Route],
    ["Dispatch", "Pick by FEFO, load vehicles, track drivers, confirm deliveries, and manage returns.", Truck],
    ["Collections", "Automate invoices, M-Pesa matching, cash, cheques, bank transfers, and customer ledgers.", CreditCard],
    ["AI Insights", "Forecast demand, procurement needs, collections risk, delivery delays, and production losses.", Bot]
  ] as const;

  return (
    <main className="min-h-screen bg-white text-solva-ink">
      <section className="relative min-h-[92vh] overflow-hidden bg-solva-ink">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,92,255,0.55),rgba(8,17,31,0.92)),url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-between px-6 py-6 lg:px-8">
          <nav className="flex items-center justify-between text-white">
            <div>
              <div className="text-2xl font-black">SolvaFlow</div>
              <div className="text-sm font-semibold text-white/75">From Production to Payment.</div>
            </div>
            <Link href="/login" className="rounded-md bg-white px-4 py-2 text-sm font-bold text-solva-ink">Sign in</Link>
          </nav>
          <div className="max-w-4xl pb-20 pt-24 text-white">
            <h1 className="text-5xl font-black tracking-normal md:text-7xl">SolvaFlow</h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-white/85">Track every product, every order, every delivery and every payment from one intelligent manufacturing ERP platform.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-md bg-solva-blue px-5 py-3 text-sm font-black text-white">Open ERP</Link>
              <Link href="/onboarding" className="rounded-md border border-white/50 px-5 py-3 text-sm font-black text-white">Company setup</Link>
            </div>
          </div>
          <div className="grid gap-3 pb-6 md:grid-cols-3">
            {["Manufacturing", "Distribution", "Collections"].map((item) => (
              <div key={item} className="border-t border-white/30 pt-3 text-sm font-bold text-white">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase text-solva-blue">Why SolvaFlow?</div>
          <h2 className="mt-2 text-3xl font-black tracking-normal">Built for manufacturers who need operational truth, not disconnected spreadsheets.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map(([title, body, Icon]) => (
            <article key={title} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
              <Icon className="h-5 w-5 text-solva-blue" />
              <h3 className="mt-4 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-solva-line bg-solva-soft">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1fr_1.2fr] lg:px-8">
          <div>
            <div className="text-sm font-bold uppercase text-solva-blue">Executive command center</div>
            <h2 className="mt-2 text-3xl font-black tracking-normal">Production, dispatch, sales, collections, and AI signals in one boardroom view.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Production Value", "Sales Value", "Dispatch Value", "Collections", "Outstanding Receivables", "Near Expiry Stock"].map((metric) => (
              <div key={metric} className="rounded-md border border-solva-line bg-white p-4">
                <BarChart3 className="h-4 w-4 text-solva-blue" />
                <div className="mt-3 text-sm font-bold">{metric}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
