import { useEffect, useState } from "react";
import { AlertCircle, BarChart3, RefreshCw, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, type StatsResponse } from "../api/client";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";

const CATEGORY_COLORS: Record<string, string> = {
  water: "#3b82f6",
  electricity: "#f59e0b",
  sanitation: "#10b981",
  roads: "#ef4444",
  streetlights: "#8b5cf6",
  other: "#64748b",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10b981",
  normal: "#f59e0b",
  high: "#ef4444",
};

export default function Stats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [cache, setCache] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, cache } = await api.getStats();
      setStats(data);
      setCache(cache);
    } catch {
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getStats();
        if (cancelled) return;
        setStats(res.data);
        setCache(res.cache);
      } catch {
        if (cancelled) return;
        setError("Failed to load statistics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = stats?.total ?? 0;

  const categoryData = stats
    ? Object.entries(stats.by_category).map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name] ?? "#64748b",
      }))
    : [];

  const priorityData = stats
    ? Object.entries(stats.by_priority).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill: PRIORITY_COLORS[name] ?? "#64748b",
      }))
    : [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
          <p className="text-sm text-slate-500 mt-1">Aggregate view of all complaints.</p>
        </div>
        <div className="flex items-center gap-3">
          {cache && (
            <span className="flex items-center gap-2 text-xs">
              <Zap
                className={`w-3.5 h-3.5 ${cache === "HIT" ? "text-emerald-500" : "text-amber-500"}`}
              />
              <span className="text-slate-500">Cache:</span>
              <strong className={cache === "HIT" ? "text-emerald-600" : "text-amber-600"}>
                {cache}
              </strong>
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && !stats && (
        <div className="py-10">
          <LoadingSpinner label="Loading statistics…" />
        </div>
      )}

      {stats && (
        <>
          {/* Total card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5 md:col-span-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-500">Total Complaints</div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{total}</div>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">By Category</h2>
              <div className="flex items-center gap-6">
                <div className="w-40 h-40 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={75}
                        strokeWidth={0}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{total}</span>
                    <span className="text-xs text-slate-500">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map((c) => {
                    const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
                    return (
                      <div key={c.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: c.fill }}
                        />
                        <span className="capitalize text-slate-700 flex-1 truncate">{c.name}</span>
                        <span className="text-slate-500">{c.value}</span>
                        <span className="text-slate-400 w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">By Priority</h2>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip cursor={{ fill: "rgba(148,163,184,0.1)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                {priorityData.map((p) => (
                  <div key={p.name} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                      <span className="text-xs text-slate-500">{p.name}</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-900">{p.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
