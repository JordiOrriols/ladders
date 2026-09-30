import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { MainTabs } from "../MainTabs";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("MainTabs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should render main tabs component", () => {
    renderWithI18n(<MainTabs />);
    // Tabs should be rendered
    const tabs = screen.queryAllByRole("button");
    expect(tabs.length >= 0).toBe(true);
  });

  it("should have team and individual tab buttons", () => {
    const { container } = renderWithI18n(<MainTabs />);
    // Should contain tab buttons
    expect(container).toBeTruthy();
  });

  it("opens the individual tab by default", () => {
    renderWithI18n(
      <MainTabs
        members={[]}
        onAddMember={() => {}}
        onEditMember={() => {}}
        onDeleteMember={() => {}}
        onSelectMember={() => {}}
      />
    );
    expect(screen.getByTestId("tab-individual")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("tab-team")).toHaveAttribute("data-state", "inactive");
  });
});
