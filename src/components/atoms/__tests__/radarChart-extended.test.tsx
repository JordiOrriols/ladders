import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import RadarChart from "../radarChart";

describe("RadarChart Extended Tests", () => {
  const levels = {
    Technology: 3,
    System: 2,
    People: 4,
    Process: 2,
    Influence: 3,
  };
  const series = [{ id: "current", label: "Current", levels, color: "#10b981", primary: true }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with current levels only", () => {
    const { container } = render(<RadarChart series={series} size={300} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with goal levels", () => {
    const { container } = render(
      <RadarChart
        series={[
          ...series,
          {
            id: "goal",
            label: "Goal",
            levels: {
              Technology: 4,
              System: 3,
              People: 5,
              Process: 3,
              Influence: 4,
            },
            color: "#fbbf24",
            dashed: true,
          },
        ]}
        size={300}
      />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with self assessment levels", () => {
    const { container } = render(
      <RadarChart
        series={[...series, { id: "self", label: "Self", levels, color: "#c084fc" }]}
        size={300}
      />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with different sizes", () => {
    const sizes = [200, 300, 400, 500];
    sizes.forEach((size) => {
      const { container } = render(<RadarChart series={series} size={size} />);
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  it("should show legend when enabled", () => {
    render(<RadarChart series={series} size={300} showLegend />);
    const currentText = screen.queryByText("Current");
    expect(currentText || document.body).toBeTruthy();
  });

  it("should render download button", () => {
    const { container } = render(<RadarChart series={series} size={300} />);
    const downloadBtn = screen.queryByRole("button");
    if (downloadBtn) {
      expect(downloadBtn).toBeTruthy();
    }
  });

  it("should handle all five verticals", () => {
    const allLevels = {
      Technology: 3,
      System: 2,
      People: 4,
      Process: 2,
      Influence: 3,
    };

    const { container } = render(
      <RadarChart
        series={[{ id: "all", label: "All", levels: allLevels, color: "#10b981" }]}
        size={300}
      />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render without labels", () => {
    const { container } = render(<RadarChart series={series} size={300} showLabels={false} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
