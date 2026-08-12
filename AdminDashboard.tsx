import { useEffect, useState } from "react";
import { fetchAdminStats } from "../api";
import type { AdminStats } from "../types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAdminStats().then((s) => {
      if (active) {
        setStats(s);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  if (!stats) {
    return (
      <p className="text-sm text-slate-500">
        Couldn't reach the admin API. Make sure the backend is running.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total requests" value={stats.totalRequests} />
        <MetricCard label="Successful" value={stats.successful} accent="emerald" />
        <MetricCard label="Failed" value={stats.failed} accent="rose" />
        <MetricCard label="Success rate" value={`${stats.successRate}%`} />
        <MetricCard label="Avg processing" value={`${stats.averageProcessingTimeMs}ms`} />
        <MetricCard label="Rate limited" value={stats.rateLimited} accent="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-5">
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
            Most common domains
          </p>
          {stats.topDomains.length === 0 ? (
            <p className="text-xs text-slate-600">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topDomains.map((d) => (
                <li key={d.domain} className="flex items-center justify-between text-xs">
                  <span className="truncate font-mono text-slate-300">{d.domain}</span>
                  <span className="ml-2 shrink-0 text-slate-500">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card p-5">
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
            Error statistics
          </p>
          {stats.errorBreakdown.length === 0 ? (
            <p className="text-xs text-slate-600">No errors recorded.</p>
          ) : (
            <ul className="space-y-2">
              {stats.errorBreakdown.map((e) => (
                <li key={e.code} className="flex items-center justify-between text-xs">
                  <span className="truncate font-mono text-rose-300">{e.code}</span>
                  <span className="ml-2 shrink-0 text-slate-500">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "emerald" | "rose" | "amber";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "rose"
      ? "text-rose-300"
      : accent === "amber"
      ? "text-amber-300"
      : "text-slate-100";
  return (
    <div className="glass-card p-4">
      <p className={`font-display text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
