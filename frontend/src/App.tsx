import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";

type Tab = "submit" | "dashboard";

export default function App() {
  const [tab, setTab] = useState<Tab>("submit");

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh" }}>
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid #ddd",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>CivicPulse</h1>
        <span style={{ color: "#888", fontSize: "0.9rem" }}>Municipal complaint intake</span>
        <nav style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setTab("submit")}
            disabled={tab === "submit"}
            style={{ fontWeight: tab === "submit" ? 700 : 400 }}
          >
            Submit
          </button>
          <button
            onClick={() => setTab("dashboard")}
            disabled={tab === "dashboard"}
            style={{ fontWeight: tab === "dashboard" ? 700 : 400 }}
          >
            Dashboard
          </button>
        </nav>
      </header>
      <main>
        {tab === "submit" && <Submit />}
        {tab === "dashboard" && <Dashboard />}
      </main>
    </div>
  );
}
