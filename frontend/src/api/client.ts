const API_BASE = "/api";

export type Category = "water" | "electricity" | "sanitation" | "roads" | "streetlights" | "other";

export type Priority = "high" | "normal" | "low";
export type Status = "open" | "in_progress" | "resolved" | "rejected";

export interface Complaint {
  id: string;
  text: string;
  location: string;
  reporter_contact: string | null;
  category: Category;
  priority: Priority;
  status: Status;
  ai_summary: string | null;
  triaged_by: string;
  triage_latency_ms: number;
  created_at: string;
  updated_at: string;
}

export interface ComplaintListResponse {
  items: Complaint[];
  total: number;
  page: number;
  page_size: number;
}

export interface ComplaintCreatePayload {
  text: string;
  location: string;
  reporter_contact?: string;
}

export interface StatsResponse {
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  total: number;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  detail?: string;
  errors?: FieldError[];
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestResult<T> {
  data: T;
  headers: Headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<RequestResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: text };
    }
  }

  if (!res.ok) {
    const errBody = (body as ApiErrorBody) || {};
    const message = errBody.detail || "Request failed";
    throw new ApiError(res.status, errBody, message);
  }

  return { data: body as T, headers: res.headers };
}

export const api = {
  async createComplaint(payload: ComplaintCreatePayload): Promise<Complaint> {
    const { data } = await request<Complaint>("/complaints", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data;
  },

  async getComplaint(id: string): Promise<Complaint> {
    const { data } = await request<Complaint>(`/complaints/${id}`);
    return data;
  },

  async listComplaints(params: {
    category?: Category;
    priority?: Priority;
    status?: Status;
    page?: number;
    page_size?: number;
  }): Promise<ComplaintListResponse> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const query = qs.toString();
    const { data } = await request<ComplaintListResponse>(`/complaints${query ? `?${query}` : ""}`);
    return data;
  },

  async updateStatus(id: string, status: Status): Promise<Complaint> {
    const { data } = await request<Complaint>(`/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return data;
  },

  async getStats(): Promise<{ data: StatsResponse; cache: string | null }> {
    const { data, headers } = await request<StatsResponse>("/stats");
    return { data, cache: headers.get("X-Cache") };
  },

  async getMeta(): Promise<{ active_provider: string; last_outcomes: unknown[] }> {
    const { data } = await request<{ active_provider: string; last_outcomes: unknown[] }>(
      "/meta/providers"
    );
    return data;
  },
};
