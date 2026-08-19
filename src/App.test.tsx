import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const responses: Record<string, unknown> = {
  "/metadata/": { years: [2023, 2022], regions: ["Europe & Central Asia"] },
  "/metrics/": {
    count: 1,
    next: null,
    previous: null,
    results: [{
      id: 1,
      country_code: "FRA",
      country_name: "France",
      region: "Europe & Central Asia",
      year: 2023,
      arrivals: 100_000_000,
      receipts_usd: "68000000000.00",
      source: "World Bank / UN Tourism",
    }],
  },
  "/summary/": { arrivals: 100_000_000, receipts_usd: 68_000_000_000, countries: 1 },
  "/trends/": [{ year: 2022, arrivals: 80_000_000 }, { year: 2023, arrivals: 100_000_000 }],
};

describe("App", () => {
  beforeEach(() => {
    responses["/metadata/"] = { years: [2023, 2022], regions: ["Europe & Central Asia"] };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const key = Object.keys(responses).find(path => url.pathname.endsWith(path));
      return Promise.resolve(new Response(JSON.stringify(responses[key ?? ""]), { status: key ? 200 : 404 }));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads server-side summary, trend, and paginated country data", async () => {
    render(<App />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/metadata/"), expect.anything()));
    expect(await screen.findByText("France")).toBeInTheDocument();
    expect(screen.getByText("100M")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
  });

  it("shows a useful empty state when metadata has no years", async () => {
    responses["/metadata/"] = { years: [], regions: [] };
    render(<App />);
    expect(await screen.findByText("No tourism data available")).toBeInTheDocument();
  });
});
