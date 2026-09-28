import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Complaints from "./Complaints";
import { api, ApiError, type Complaint } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    api: {
      listComplaints: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
});

function makeComplaint(overrides: Partial<Complaint> = {}): Complaint {
  return {
    id: "00000000-0000-0000-0000-000000000001",
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
    ...overrides,
  };
}

describe("Complaints view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the list of complaints", async () => {
    (api.listComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        makeComplaint({ location: "Street 12", category: "water" }),
        makeComplaint({
          id: "00000000-0000-0000-0000-000000000002",
          location: "GT Road",
          category: "other",
        }),
      ],
      total: 2,
      page: 1,
      page_size: 10,
    });

    render(<Complaints />);

    await waitFor(() => expect(screen.getByText("Street 12")).toBeInTheDocument());
    expect(screen.getByText("GT Road")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
  });

  it("shows error banner when list fails", async () => {
    (api.listComplaints as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));

    render(<Complaints />);

    await waitFor(() => expect(screen.getByText(/Failed to load complaints/i)).toBeInTheDocument());
  });

  it("passes filters to the API when changed", async () => {
    (api.listComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });

    render(<Complaints />);

    await waitFor(() => expect(api.listComplaints).toHaveBeenCalled());

    const categorySelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(categorySelect, { target: { value: "water" } });

    await waitFor(() =>
      expect(api.listComplaints).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "water", page: 1 })
      )
    );

    const prioritySelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(prioritySelect, { target: { value: "high" } });

    await waitFor(() =>
      expect(api.listComplaints).toHaveBeenLastCalledWith(
        expect.objectContaining({ priority: "high", page: 1 })
      )
    );
  });

  it("advances status and reloads", async () => {
    (api.listComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [makeComplaint({ id: "abc", status: "open" })],
      total: 1,
      page: 1,
      page_size: 10,
    });
    (api.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeComplaint({ id: "abc", status: "in_progress" })
    );

    render(<Complaints />);

    await waitFor(() => screen.getByText("Street 12"));

    fireEvent.click(screen.getByRole("button", { name: /Mark as in progress/i }));

    await waitFor(() => expect(api.updateStatus).toHaveBeenCalledWith("abc", "in_progress"));
    await waitFor(() =>
      expect(screen.getByText(/Complaint moved to in progress/)).toBeInTheDocument()
    );
  });

  it("surfaces server 409 message verbatim", async () => {
    (api.listComplaints as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [makeComplaint({ id: "abc", status: "in_progress" })],
      total: 1,
      page: 1,
      page_size: 10,
    });
    (api.updateStatus as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError(
        409,
        { detail: "Invalid status transition: resolved->resolved" },
        "Invalid status transition: resolved->resolved",
        null
      )
    );

    render(<Complaints />);

    await waitFor(() => screen.getByText("Street 12"));

    fireEvent.click(screen.getByRole("button", { name: /Mark as resolved/i }));

    await waitFor(() =>
      expect(screen.getByText("Invalid status transition: resolved->resolved")).toBeInTheDocument()
    );
  });
});
