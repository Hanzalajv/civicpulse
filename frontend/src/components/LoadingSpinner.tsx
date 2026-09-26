export default function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0",
        color: "#555",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 16,
          height: 16,
          border: "2px solid #ccc",
          borderTopColor: "#333",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span>{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
