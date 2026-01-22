import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Input } from "../input";

describe("Input Component", () => {
  it("should render input element", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeTruthy();
  });

  it("should accept placeholder prop", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeTruthy();
  });

  it("should handle user input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Test" />);
    const input = screen.getByRole("textbox");

    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("should apply custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("custom-class");
  });

  it("should support disabled state", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });
});
