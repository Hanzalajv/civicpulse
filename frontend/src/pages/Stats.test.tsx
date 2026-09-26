import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Stats from "./Stats";
import { api, type StatsResponse } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    api: {
      getStats: vi.fn(),
    },
  };
});

const SAMPLE_STATS: StatsResponse = {
  by_category: {
    water: 5,
    electricity: 5,
    sanitation: 5,
    roads: 5,
    streetlights: 5,
    other: 5,
  },
  by_priority: {
    high: 16,
    normal: 10,
    low: 4,
  },
  total: 30,
};

describe("Stats view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders total and aggregates from the API", async () => {
    (api.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: SAMPLE_STATS,
      cache: "MISS",
    });

    render(<Stats />);

    await waitFor(() => expect(screen.getByText("30")).toBeInTheDocument());
    expect(screen.getByText("water")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("shows X-Cache MISS on first load", async () => {
    (api.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: SAMPLE_STATS,
      cache: "MISS",
    });

    render(<Stats />);

    await waitFor(() => expect(screen.getByText("MISS")).toBeInTheDocument());
  });

  it("shows X-Cache HIT after refresh", async () => {
    (api.getStats as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: SAMPLE_STATS, cache: "MISS" })
      .mockResolvedValueOnce({ data: SAMPLE_STATS, cache: "HIT" });

    render(<Stats />);

    await waitFor(() => expect(screen.getByText("MISS")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => expect(screen.getByText("HIT")).toBeInTheDocument());
  });

  it("shows error when API fails", async () => {
    (api.getStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));

    render(<Stats />);

    await waitFor(() => expect(screen.getByText(/Failed to load statistics/i)).toBeInTheDocument());
  });

  it("renders both category and priority sections", async () => {
    (api.getStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: SAMPLE_STATS,
      cache: "MISS",
    });

    render(<Stats />);

    await waitFor(() => expect(screen.getByText("By category")).toBeInTheDocument());
    expect(screen.getByText("By priority")).toBeInTheDocument();
    expect(screen.getByText("Total complaints")).toBeInTheDocument();
  });
});
