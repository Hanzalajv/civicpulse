import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Submit from "./Submit";
import { api, ApiError, type Complaint } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    api: {
      createComplaint: vi.fn(),
    },
  };
});

const SAMPLE: Complaint = {
  id: "abc-123",
  text: "Burst water pipe on Street 12",
  location: "Street 12",
  reporter_contact: null,
  category: "water",
  priority: "high",
  status: "open",
  ai_summary: "Burst water pipe",
  triaged_by: "simulated",
  triage_latency_ms: 7,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

describe("Submit view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form", () => {
    render(<Submit />);
    expect(screen.getByText(/Submit a Complaint/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/provide as much detail/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Street name, landmark/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit Complaint/i })).toBeInTheDocument();
  });

  it("shows local validation errors when fields are empty", () => {
    render(<Submit />);
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(api.createComplaint).not.toHaveBeenCalled();
  });

  it("shows loading state while submitting", async () => {
    let resolveFn: (value: Complaint) => void = () => {};
    (api.createComplaint as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<Complaint>((resolve) => (resolveFn = resolve))
    );

    render(<Submit />);
    fireEvent.change(screen.getByPlaceholderText(/provide as much detail/i), {
      target: { value: "Burst water pipe on Street 99 flooding the road" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Street name, landmark/i), {
      target: { value: "Street 99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));

    expect(screen.getByText(/Analyzing your complaint/i)).toBeInTheDocument();

    resolveFn(SAMPLE);
    await waitFor(() =>
      expect(screen.queryByText(/Analyzing your complaint/i)).not.toBeInTheDocument()
    );
  });

  it("submits and renders the triage result", async () => {
    (api.createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(SAMPLE);

    render(<Submit />);
    fireEvent.change(screen.getByPlaceholderText(/provide as much detail/i), {
      target: { value: "Burst water pipe on Street 99 flooding the road" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Street name, landmark/i), {
      target: { value: "Street 99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));

    await waitFor(() => expect(screen.getByText(/Complaint received/i)).toBeInTheDocument());
    expect(screen.getByText("water")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("simulated")).toBeInTheDocument();
    expect(screen.getByText("7 ms")).toBeInTheDocument();
  });

  it("surfaces server error detail verbatim", async () => {
    (api.createComplaint as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError(429, { detail: "Rate limit exceeded" }, "Rate limit exceeded", null)
    );

    render(<Submit />);
    fireEvent.change(screen.getByPlaceholderText(/provide as much detail/i), {
      target: { value: "Burst water pipe on Street 99 flooding the road" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Street name, landmark/i), {
      target: { value: "Street 99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));

    await waitFor(() => expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument());
  });
});
