import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError, type Complaint } from "./client";

const SAMPLE_COMPLAINT: Complaint = {
  id: "abc-123",
  text: "Burst water pipe on Street 12",
  location: "Street 12",
  reporter_contact: null,
  category: "water",
  priority: "high",
  status: "open",
  ai_summary: "Burst water pipe",
  triaged_by: "simulated",
  triage_latency_ms: 5,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

function mockFetch(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  const status = init.status ?? 200;
  const headers = new Headers(init.headers ?? {});
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  });
}

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("createComplaint posts and returns the created complaint", async () => {
    const fetchMock = mockFetch(SAMPLE_COMPLAINT, { status: 201 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await api.createComplaint({
      text: "Burst water pipe on Street 12",
      location: "Street 12",
    });

    expect(result.id).toBe("abc-123");
    expect(result.category).toBe("water");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/complaints");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body as string)).toEqual({
      text: "Burst water pipe on Street 12",
      location: "Street 12",
    });
  });

  it("getComplaint fetches by id", async () => {
    const fetchMock = mockFetch(SAMPLE_COMPLAINT);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await api.getComplaint("abc-123");

    expect(result.id).toBe("abc-123");
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/complaints/abc-123");
  });

  it("listComplaints builds query string from params", async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 1, page_size: 10 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await api.listComplaints({ category: "water", priority: "high", page: 2, page_size: 5 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/complaints?");
    expect(url).toContain("category=water");
    expect(url).toContain("priority=high");
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=5");
  });

  it("listComplaints omits undefined params", async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 1, page_size: 10 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await api.listComplaints({ category: "water" });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("category=water");
    expect(url).not.toContain("priority=");
    expect(url).not.toContain("status=");
  });

  it("updateStatus sends PATCH with new status", async () => {
    const fetchMock = mockFetch({ ...SAMPLE_COMPLAINT, status: "in_progress" });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await api.updateStatus("abc-123", "in_progress");

    expect(result.status).toBe("in_progress");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/complaints/abc-123/status");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body as string)).toEqual({ status: "in_progress" });
  });

  it("getStats returns data and X-Cache header", async () => {
    const fetchMock = mockFetch(
      { by_category: { water: 5 }, by_priority: { high: 3 }, total: 5 },
      { headers: { "X-Cache": "HIT" } }
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { data, cache } = await api.getStats();

    expect(data.total).toBe(5);
    expect(cache).toBe("HIT");
  });

  it("throws ApiError with parsed detail on 409", async () => {
    const fetchMock = mockFetch(
      { detail: "Invalid status transition: in_progress->open" },
      { status: 409 }
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(api.updateStatus("abc-123", "open")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      body: { detail: "Invalid status transition: in_progress->open" },
    });
  });

  it("throws ApiError with field errors on 400", async () => {
    const fetchMock = mockFetch(
      { errors: [{ field: "text", message: "too short" }] },
      { status: 400 }
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await api.createComplaint({ text: "x", location: "Street 12" });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.body.errors?.[0].field).toBe("text");
    }
  });
});
