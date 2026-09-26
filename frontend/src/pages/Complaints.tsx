import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Filter, Search } from "lucide-react";
import {
  api,
  ApiError,
  type Category,
  type Complaint,
  type Priority,
  type Status,
} from "../api/client";
import Button from "../components/Button";
import Card from "../components/Card";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";

const CATEGORIES: Category[] = [
  "water",
  "electricity",
  "sanitation",
  "roads",
  "streetlights",
  "other",
];
const PRIORITIES: Priority[] = ["high", "normal", "low"];
const STATUSES: Status[] = ["open", "in_progress", "resolved", "rejected"];

const PAGE_SIZE = 10;

export default function Complaints() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<Category | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listComplaints({
        category: category || undefined,
        priority: priority || undefined,
        status: status || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setError("Failed to load complaints");
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
        const res = await api.listComplaints({
          category: category || undefined,
          priority: priority || undefined,
          status: status || undefined,
          page,
          page_size: PAGE_SIZE,
        });
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      } catch {
        if (cancelled) return;
        setError("Failed to load complaints");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, category, priority, status]);

  async function changeStatus(id: string, next: Status) {
    setFlash(null);
    setError(null);
    try {
      await api.updateStatus(id, next);
      setFlash(`Complaint moved to ${next.replace("_", " ")}`);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.detail || "Update failed");
      } else {
        setError("Update failed");
      }
    }
  }

  function nextStatus(current: Status): Status | null {
    if (current === "open") return "in_progress";
    if (current === "in_progress") return "resolved";
    return null;
  }

  function resetFilters() {
    setCategory("");
    setPriority("");
    setStatus("");
    setPage(1);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
        <p className="text-sm text-slate-500 mt-1">Filter, inspect, and advance complaints.</p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search complaints…"
              disabled
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category | "");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as Priority | "");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status | "");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>

          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>

          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
      </Card>

      {flash && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          {flash}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="py-6">
          <LoadingSpinner label="Loading complaints…" />
        </div>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No complaints match these filters.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    #{c.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{c.location}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-slate-700">{c.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {nextStatus(c.status) && (
                        <Button
                          size="sm"
                          variant={nextStatus(c.status) === "resolved" ? "success" : "lavender"}
                          onClick={() => changeStatus(c.id, nextStatus(c.status)!)}
                        >
                          Mark as {nextStatus(c.status)!.replace("_", " ")}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                      {(c.status === "open" || c.status === "in_progress") && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => changeStatus(c.id, "rejected")}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Showing {items.length} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span className="text-xs text-slate-600 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
