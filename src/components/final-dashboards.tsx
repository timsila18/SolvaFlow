"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, Bot, Wallet } from "lucide-react";

export function CollectionsDashboard() {
  return <MetricDashboard endpoint="/api/final-modules/collections-dashboard" eyebrow="Collections & Receivables" title="Collections Dashboard" icon="wallet" />;
}

export function ExecutiveCommandCenter() {
  return <MetricDashboard endpoint="/api/final-modules/executive-dashboard" eyebrow="Enterprise" title="Executive Command Center" icon="chart" />;
}

export function AiDashboard() {
  return <MetricDashboard endpoint="/api/final-modules/executive-dashboard" eyebrow="SolvaFlow AI" title="AI Insights Dashboard" icon="bot" />;
}

function MetricDashboard({ endpoint, eyebrow, title, icon }: { endpoint: string; eyebrow: string; title: string; icon: "wallet" | "chart" | "bot" }) {
  const [data, setData] = useState<any>({ metrics: [] });

  useEffect(() => {
    fetch(endpoint).then((response) => response.json()).then(setData);
  }, [endpoint]);

  const Icon = icon === "wallet" ? Wallet : icon === "bot" ? Bot : BarChart3;
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-bold uppercase text-solva-blue">{eyebrow}</div>
        <h1 className="mt-1 text-3xl font-black tracking-normal">{title}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(data.metrics ?? []).map((metric: any) => (
          <div key={metric.label} className="rounded-md border border-solva-line bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">{metric.label}</div>
              {String(metric.label).toLowerCase().includes("overdue") || String(metric.label).toLowerCase().includes("failed") || String(metric.label).toLowerCase().includes("stockout") ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Icon className="h-4 w-4 text-solva-blue" />}
            </div>
            <div className="mt-3 text-3xl font-black">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
