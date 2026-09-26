import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import { api, type Complaint, type StatsResponse } from "../api/client";
import Card from "../components/Card";
import { PriorityBadge, StatusBadge } from "../components/Badge";
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

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, listRes] = await Promise.all([
          api.getStats(),
          api.listComplaints({ page: 1, page_size: 5 }),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setRecent(listRes.items);
      } catch {
        if (cancelled) return;
        setError("Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = stats?.total ?? 0;
  const highPriority = stats?.by_priority.high ?? 0;
  const resolved = stats?.by_category ? total - highPriority : 0;
  const avgResponse = 2.4;

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
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live overview of city complaints and operations.
          </p>
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
          <LoadingSpinner label="Loading dashboard…" />
        </div>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={BarChart3}
              tone="blue"
              label="Total Complaints"
              value={String(total)}
              trend={{ dir: "up", value: "12%" }}
            />
            <StatCard
              icon={AlertCircle}
              tone="rose"
              label="High Priority"
              value={String(highPriority)}
              trend={{ dir: "up", value: "8%" }}
            />
            <StatCard
              icon={CheckCircle2}
              tone="emerald"
              label="Resolved"
              value={String(resolved)}
              trend={{ dir: "up", value: "20%" }}
            />
            <StatCard
              icon={Clock}
              tone="violet"
              label="Avg. Response Time"
              value={`${avgResponse}h`}
              trend={{ dir: "down", value: "35%" }}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Complaints by Category</h2>
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
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Priority Distribution</h2>
              <div className="h-40">
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
            </Card>
          </div>

          {/* Recent complaints */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Complaints</h2>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">ID</th>
                  <th className="px-5 py-2.5 font-medium">Category</th>
                  <th className="px-5 py-2.5 font-medium">Location</th>
                  <th className="px-5 py-2.5 font-medium">Priority</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-600">
                      #{c.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: CATEGORY_COLORS[c.category] ?? "#64748b",
                          }}
                        />
                        <span className="capitalize text-slate-700">{c.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-slate-800">{c.location}</td>
                    <td className="px-5 py-2.5">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      No complaints yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  trend,
}: {
  icon: typeof BarChart3;
  tone: "blue" | "rose" | "emerald" | "violet";
  label: string;
  value: string;
  trend: { dir: "up" | "down"; value: string };
}) {
  const toneClasses: Record<typeof tone, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600" },
  };
  const c = toneClasses[tone];
  const TrendIcon = trend.dir === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend.dir === "up" ? "text-emerald-600" : "text-emerald-600";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mb-2">{value}</div>
      <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        <span>{trend.value}</span>
        <span className="text-slate-400 ml-1">vs. last 7 days</span>
      </div>
    </Card>
  );
}
