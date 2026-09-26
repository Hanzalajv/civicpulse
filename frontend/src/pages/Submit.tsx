import { useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError, type Complaint } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const MIN_TEXT = 10;
const MAX_TEXT = 2000;
const MIN_LOCATION = 3;
const MAX_LOCATION = 200;

interface FormErrors {
  text?: string;
  location?: string;
  general?: string;
}

export default function Submit() {
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<Complaint | null>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (text.length < MIN_TEXT) errs.text = `Must be at least ${MIN_TEXT} characters`;
    if (text.length > MAX_TEXT) errs.text = `Must be at most ${MAX_TEXT} characters`;
    if (location.length < MIN_LOCATION)
      errs.location = `Must be at least ${MIN_LOCATION} characters`;
    if (location.length > MAX_LOCATION)
      errs.location = `Must be at most ${MAX_LOCATION} characters`;
    return errs;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    const localErrors = validate();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const created = await api.createComplaint({
        text,
        location,
        reporter_contact: contact.trim() || undefined,
      });
      setResult(created);
      setText("");
      setLocation("");
      setContact("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.body.errors && err.body.errors.length > 0) {
          const fieldErrs: FormErrors = {};
          for (const fe of err.body.errors) {
            if (fe.field === "text") fieldErrs.text = fe.message;
            else if (fe.field === "location") fieldErrs.location = fe.message;
          }
          setErrors(fieldErrs);
        } else {
          setErrors({ general: err.body.detail || "Submission failed" });
        }
      } else {
        setErrors({ general: "Unexpected error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Report a Complaint</h1>
      <p style={{ color: "#666" }}>
        Describe the issue in your own words. The system will route it automatically.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="text" style={{ display: "block", marginBottom: "0.25rem" }}>
            Complaint
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderColor: errors.text ? "#c00" : "#ccc",
            }}
            placeholder="e.g. Burst water main on Street 12 flooding the road"
            disabled={loading}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#888",
            }}
          >
            <span style={{ color: errors.text ? "#c00" : "#888" }}>{errors.text || ""}</span>
            <span>
              {text.length}/{MAX_TEXT}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="location" style={{ display: "block", marginBottom: "0.25rem" }}>
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderColor: errors.location ? "#c00" : "#ccc",
            }}
            placeholder="e.g. Street 12, Block C"
            disabled={loading}
          />
          <div style={{ fontSize: 12, color: errors.location ? "#c00" : "#888" }}>
            {errors.location || ""}
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="contact" style={{ display: "block", marginBottom: "0.25rem" }}>
            Contact (optional)
          </label>
          <input
            id="contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
            placeholder="Phone or email"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
          }}
        >
          {loading ? "Submitting…" : "Submit complaint"}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: "1rem" }}>
          <LoadingSpinner label="Analyzing your complaint…" />
        </div>
      )}

      {errors.general && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#fee",
            border: "1px solid #c00",
            borderRadius: 4,
            color: "#c00",
          }}
        >
          {errors.general}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.25rem",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Complaint received</h2>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "max-content 1fr",
              rowGap: 6,
              columnGap: 12,
            }}
          >
            <dt style={{ fontWeight: 600 }}>ID</dt>
            <dd style={{ margin: 0, fontFamily: "monospace", fontSize: 13 }}>{result.id}</dd>

            <dt style={{ fontWeight: 600 }}>Category</dt>
            <dd style={{ margin: 0 }}>{result.category}</dd>

            <dt style={{ fontWeight: 600 }}>Priority</dt>
            <dd style={{ margin: 0 }}>{result.priority}</dd>

            <dt style={{ fontWeight: 600 }}>Status</dt>
            <dd style={{ margin: 0 }}>{result.status}</dd>

            <dt style={{ fontWeight: 600 }}>Summary</dt>
            <dd style={{ margin: 0 }}>{result.ai_summary || "—"}</dd>

            <dt style={{ fontWeight: 600 }}>Triaged by</dt>
            <dd style={{ margin: 0 }}>{result.triaged_by}</dd>

            <dt style={{ fontWeight: 600 }}>Latency</dt>
            <dd style={{ margin: 0 }}>{result.triage_latency_ms} ms</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
