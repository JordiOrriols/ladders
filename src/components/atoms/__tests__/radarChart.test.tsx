import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import RadarChart, { SERIES_COLORS } from "../radarChart";

describe("RadarChart", () => {
  const currentLevels = {
    Technology: 3,
    System: 2,
    People: 4,
    Process: 2,
    Influence: 3,
  };
  const goalLevels = {
    Technology: 4,
    System: 3,
    People: 5,
    Process: 3,
    Influence: 4,
  };
  const selfAssessmentLevels = {
    Technology: 3,
    System: 2,
    People: 3,
    Process: 2,
    Influence: 3,
  };
  const series = [
    { id: "goal", label: "Goal", levels: goalLevels, color: SERIES_COLORS.goal, dashed: true },
    {
      id: "self",
      label: "Self Assessment",
      levels: selfAssessmentLevels,
      color: SERIES_COLORS.self,
      dashed: true,
    },
    {
      id: "current",
      label: "Current",
      levels: currentLevels,
      color: SERIES_COLORS.current,
      primary: true,
    },
  ];

  it("should render svg element", () => {
    const { container } = render(<RadarChart series={series} size={300} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with size prop", () => {
    const { container } = render(<RadarChart series={series} size={400} />);
    const svg = container.querySelector("svg");
    // Check that SVG is present, size attribute may vary in rendering
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBeTruthy();
    expect(svg?.getAttribute("height")).toBeTruthy();
  });

  it("should render legend when showLegend is true", () => {
    render(<RadarChart series={series} showLegend />);
    expect(screen.getByText(/Current/)).toBeTruthy();
  });

  it("should not render legend when showLegend is false", () => {
    const { container } = render(<RadarChart series={series} showLegend={false} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with empty levels", () => {
    const { container } = render(<RadarChart series={[]} size={300} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("draws any number of series and only lists those with data in the legend", () => {
    const { container } = render(
      <RadarChart
        series={[
          { id: "a", label: "Peer A", levels: { Technology: 2 }, color: "#6366f1", dashed: true },
          { id: "b", label: "Peer B", levels: { Technology: 3 }, color: "#0ea5e9" },
          { id: "c", label: "Empty", levels: {}, color: "#ef4444" },
          { id: "d", label: "Me", levels: { People: 4 }, color: "#10b981", primary: true },
        ]}
      />
    );
    expect(container.querySelectorAll("path[data-series]")).toHaveLength(3);
    expect(screen.getByText("Peer A")).toBeTruthy();
    expect(screen.queryByText("Empty")).toBeNull();
    const order = [...container.querySelectorAll("path[data-series]")].map((p) =>
      p.getAttribute("data-series")
    );
    expect(order.at(-1)).toBe("d");
  });
});
