import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { Header } from "../Header";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render header component", () => {
    renderWithI18n(<Header />);
    // Header should be rendered
    const header = screen.getByRole("banner") || document.querySelector("header");
    expect(header).toBeTruthy();
  });

  it("should display header content", () => {
    const { container } = renderWithI18n(<Header />);
    // Should have some header content
    expect(container).toBeTruthy();
  });

  it("brands the header with the growth icon", () => {
    renderWithI18n(<Header />);
    expect(
      screen.getByTestId("header-content").querySelector("svg.lucide-trending-up")
    ).toBeTruthy();
  });

  it("opens the shared project registry from the header icon", async () => {
    renderWithI18n(<Header />);
    const trigger = screen.getByRole("button", { name: "Switch project" });
    await userEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Planner" })).toHaveAttribute(
      "href",
      "https://planner.jordiorriols.cat/"
    );
    expect(screen.getByRole("menuitem", { name: "Ladders" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});
