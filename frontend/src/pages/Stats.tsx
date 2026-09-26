import { useEffect, useState } from "react";
import { api, type StatsResponse } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Statistics</h1>
      <p style={{ color: "#666" }}>Aggregate view of all complaints.</p>

      <div style={{ margin: "1rem 0" }}>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {cache && (
          <span style={{ marginLeft: "1rem" }}>
            Cache: <strong style={{ color: cache === "HIT" ? "#186" : "#c80" }}>{cache}</strong>
          </span>
        )}
      </div>

      {loading && !stats && (
        <div>
          <LoadingSpinner label="Loading statistics…" />
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "#fee",
            border: "1px solid #c00",
            borderRadius: 4,
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      {stats && (
        <>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                flex: "1 1 180px",
                padding: "1rem",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "#888" }}>Total complaints</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
            </div>
          </div>

          <h2>By category</h2>
          <AggregateTable data={stats.by_category} />

          <h2>By priority</h2>
          <AggregateTable data={stats.by_priority} />
        </>
      )}
    </div>
  );
}

function AggregateTable({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p style={{ color: "#888" }}>No data.</p>;
  }
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
          <th style={{ padding: "0.5rem" }}>Key</th>
          <th style={{ padding: "0.5rem" }}>Count</th>
          <th style={{ padding: "0.5rem" }}>Share</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "0.5rem" }}>{key}</td>
            <td style={{ padding: "0.5rem" }}>{value}</td>
            <td style={{ padding: "0.5rem", width: "40%" }}>
              <div
                style={{
                  background: "#eef",
                  height: 12,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#446",
                    width: `${(value / max) * 100}%`,
                    height: "100%",
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
