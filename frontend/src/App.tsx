import Submit from "./pages/Submit";

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh" }}>
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid #ddd",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>CivicPulse</h1>
        <span style={{ color: "#888", fontSize: "0.9rem" }}>Municipal complaint intake</span>
      </header>
      <main>
        <Submit />
      </main>
    </div>
  );
}
