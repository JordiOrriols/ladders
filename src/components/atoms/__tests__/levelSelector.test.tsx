import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import LevelSelector from "../levelSelector";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("LevelSelector", () => {
  const mockVertical = "Technology";
  const defaultProps = {
    vertical: mockVertical,
    currentLevel: 0,
    goalLevel: 0,
    selfAssessmentLevel: 0,
    comment: "",
    onCurrentChange: vi.fn(),
    onGoalChange: vi.fn(),
    onCommentChange: vi.fn(),
    expanded: false,
    onToggle: vi.fn(),
    hideGoal: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render vertical name", () => {
    renderWithI18n(<LevelSelector {...defaultProps} />);
    expect(screen.getByText(mockVertical)).toBeTruthy();
  });

  it("should display current level when set", () => {
    renderWithI18n(<LevelSelector {...defaultProps} currentLevel={2} />);
    expect(screen.getByText(/Current:/)).toBeTruthy();
  });

  it("should display goal level when set", () => {
    renderWithI18n(<LevelSelector {...defaultProps} goalLevel={3} />);
    expect(screen.getByText(/Goal:/)).toBeTruthy();
  });

  it("should display self assessment level when set", () => {
    renderWithI18n(<LevelSelector {...defaultProps} selfAssessmentLevel={2} />);
    expect(screen.getByText(/Self:/)).toBeTruthy();
  });

  it("should toggle expanded state", async () => {
    const onToggle = vi.fn();
    renderWithI18n(<LevelSelector {...defaultProps} onToggle={onToggle} expanded={false} />);

    const buttons = screen.getAllByRole("button");
    if (buttons.length > 0) {
      await userEvent.click(buttons[0]);
      expect(onToggle).toHaveBeenCalled();
    }
  });

  it("should handle hideGoal prop", () => {
    renderWithI18n(<LevelSelector {...defaultProps} expanded={true} hideGoal={false} />);
    // With hideGoal false, Goal buttons should be available
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should support expanded prop", () => {
    renderWithI18n(<LevelSelector {...defaultProps} expanded={true} />);
    // When expanded, comments section should be available
    expect(screen.getByPlaceholderText(/Add notes/)).toBeTruthy();
  });
});
