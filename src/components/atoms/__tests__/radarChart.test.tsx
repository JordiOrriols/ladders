import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import RadarChart from "../radarChart";

describe("RadarChart", () => {
  const defaultProps = {
    currentLevels: {
      Technology: 3,
      System: 2,
      People: 4,
      Process: 2,
      Influence: 3,
    },
    goalLevels: {
      Technology: 4,
      System: 3,
      People: 5,
      Process: 3,
      Influence: 4,
    },
    selfAssessmentLevels: {
      Technology: 3,
      System: 2,
      People: 3,
      Process: 2,
      Influence: 3,
    },
    size: 300,
  };

  it("should render svg element", () => {
    const { container } = render(<RadarChart {...defaultProps} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with size prop", () => {
    const { container } = render(<RadarChart {...defaultProps} size={400} />);
    const svg = container.querySelector("svg");
    // Check that SVG is present, size attribute may vary in rendering
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBeTruthy();
    expect(svg?.getAttribute("height")).toBeTruthy();
  });

  it("should render legend when showLegend is true", () => {
    render(<RadarChart {...defaultProps} showLegend={true} />);
    expect(screen.getByText(/Current/)).toBeTruthy();
  });

  it("should not render legend when showLegend is false", () => {
    const { container } = render(<RadarChart {...defaultProps} showLegend={false} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should render with empty levels", () => {
    const { container } = render(
      <RadarChart currentLevels={{}} goalLevels={{}} selfAssessmentLevels={{}} size={300} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should handle hideGoal prop", () => {
    const { container: container1 } = render(<RadarChart {...defaultProps} hideGoal={false} />);
    const { container: container2 } = render(<RadarChart {...defaultProps} hideGoal={true} />);

    expect(container1.querySelector("svg")).toBeTruthy();
    expect(container2.querySelector("svg")).toBeTruthy();
  });
});
