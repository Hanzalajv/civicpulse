import { useEffect, useMemo, useState } from "react";
import {
  api,
  ApiError,
  type Category,
  type Complaint,
  type Priority,
  type Status,
} from "../api/client";
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

export default function Dashboard() {
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
      setFlash(`Complaint moved to ${next}`);
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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Operations Dashboard</h1>
      <p style={{ color: "#666" }}>Filter, inspect, and advance complaints.</p>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          margin: "1rem 0",
        }}
      >
        <label>
          Category:{" "}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category | "");
              setPage(1);
            }}
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority:{" "}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as Priority | "");
              setPage(1);
            }}
          >
            <option value="">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status:{" "}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status | "");
              setPage(1);
            }}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button onClick={load}>Refresh</button>
      </div>

      {flash && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "#e6f7ea",
            border: "1px solid #2a8",
            borderRadius: 4,
            marginBottom: "1rem",
            color: "#186",
          }}
        >
          {flash}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "#fee",
            border: "1px solid #c00",
            borderRadius: 4,
            marginBottom: "1rem",
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div style={{ marginBottom: "1rem" }}>
          <LoadingSpinner label="Loading complaints…" />
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>ID</th>
            <th style={{ padding: "0.5rem" }}>Location</th>
            <th style={{ padding: "0.5rem" }}>Category</th>
            <th style={{ padding: "0.5rem" }}>Priority</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: 12 }}>
                {c.id.slice(0, 8)}
              </td>
              <td style={{ padding: "0.5rem" }}>{c.location}</td>
              <td style={{ padding: "0.5rem" }}>{c.category}</td>
              <td style={{ padding: "0.5rem" }}>{c.priority}</td>
              <td style={{ padding: "0.5rem" }}>{c.status}</td>
              <td style={{ padding: "0.5rem" }}>
                {nextStatus(c.status) && (
                  <button
                    onClick={() => changeStatus(c.id, nextStatus(c.status)!)}
                    style={{ marginRight: "0.5rem" }}
                  >
                    Move to {nextStatus(c.status)}
                  </button>
                )}
                {(c.status === "open" || c.status === "in_progress") && (
                  <button onClick={() => changeStatus(c.id, "rejected")}>Reject</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages} — {total} total
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
