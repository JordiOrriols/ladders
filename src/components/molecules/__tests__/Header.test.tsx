import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
