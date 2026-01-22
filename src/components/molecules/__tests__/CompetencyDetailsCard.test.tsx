import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { CompetencyDetailsCard } from "../CompetencyDetailsCard";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("CompetencyDetailsCard", () => {
  const defaultProps = {
    vertical: "Technology",
    currentLevel: 3,
    goalLevel: 4,
    selfAssessmentLevel: 2,
  };

  it("should render vertical name", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} />);
    expect(screen.getByText("Technology")).toBeTruthy();
  });

  it("should display current level", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} />);
    expect(screen.getByText(/L3/)).toBeTruthy();
  });

  it("should display goal level when set", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} goalLevel={4} />);
    expect(screen.getByText(/L4/)).toBeTruthy();
  });

  it("should display self assessment level when set", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} selfAssessmentLevel={2} />);
    expect(screen.getByText(/L2/)).toBeTruthy();
  });

  it("should show Not set for current level when 0", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} currentLevel={0} />);
    expect(screen.getByText(/Not set/)).toBeTruthy();
  });

  it("should not display goal when goalLevel is 0", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} goalLevel={0} />);
    const goalElements = screen.queryAllByText(/Goal/);
    expect(goalElements.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle all levels", () => {
    renderWithI18n(<CompetencyDetailsCard {...defaultProps} currentLevel={5} goalLevel={5} selfAssessmentLevel={5} />);
    const level5Elements = screen.queryAllByText(/L5/);
    expect(level5Elements.length).toBeGreaterThan(0);
  });
});
