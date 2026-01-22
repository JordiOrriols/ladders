import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Label } from "../label";

describe("Label Component", () => {
  it("should render label element", () => {
    render(<Label>Test Label</Label>);
    const label = screen.getByText("Test Label");
    expect(label).toBeTruthy();
  });

  it("should apply htmlFor attribute", () => {
    render(<Label htmlFor="input-id">Form Label</Label>);
    const label = screen.getByText("Form Label");
    expect(label.getAttribute("for")).toBe("input-id");
  });

  it("should support custom className", () => {
    render(<Label className="custom">Custom Label</Label>);
    const label = screen.getByText("Custom Label");
    expect(label.className).toContain("custom");
  });

  it("should render with multiple children", () => {
    render(
      <Label>
        <span>Part 1</span>
        <span>Part 2</span>
      </Label>
    );
    expect(screen.getByText("Part 1")).toBeTruthy();
    expect(screen.getByText("Part 2")).toBeTruthy();
  });
});
