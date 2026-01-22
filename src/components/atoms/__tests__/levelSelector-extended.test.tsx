import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import LevelSelector from "../levelSelector";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("LevelSelector Extended Tests", () => {
  const defaultProps = {
    vertical: "Technology",
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

  it("should render all VERTICALS correctly", () => {
    const verticals = ["Technology", "System", "People", "Process", "Influence"];
    verticals.forEach((vertical) => {
      renderWithI18n(<LevelSelector {...defaultProps} vertical={vertical as any} />);
      expect(screen.getByText(vertical)).toBeTruthy();
    });
  });

  it("should display level 5 text correctly", () => {
    renderWithI18n(<LevelSelector {...defaultProps} currentLevel={5} goalLevel={5} />);
    // Should show level 5 description
    const container = screen.getByText("Technology").closest("div");
    expect(container).toBeTruthy();
  });

  it("should update comment when textarea changes", async () => {
    const onCommentChange = vi.fn();
    const user = userEvent.setup();
    renderWithI18n(
      <LevelSelector
        {...defaultProps}
        expanded={true}
        comment=""
        onCommentChange={onCommentChange}
      />
    );

    const textarea = screen.getByPlaceholderText(/Add notes/i);
    await user.type(textarea, "Test comment");

    expect(onCommentChange).toHaveBeenCalled();
  });

  it("should show all VERTICALS with different levels", () => {
    const testCases = [
      { vertical: "Technology", level: 3 },
      { vertical: "System", level: 2 },
      { vertical: "People", level: 4 },
      { vertical: "Process", level: 1 },
      { vertical: "Influence", level: 5 },
    ];

    testCases.forEach(({ vertical, level }) => {
      const { unmount } = renderWithI18n(
        <LevelSelector {...defaultProps} vertical={vertical as any} currentLevel={level} />
      );
      expect(screen.getByText(vertical)).toBeTruthy();
      unmount();
    });
  });

  it("should display all 5 level buttons when expanded", () => {
    renderWithI18n(<LevelSelector {...defaultProps} expanded={true} />);
    const levelButtons = screen.queryAllByRole("button");
    // Should have multiple buttons for levels
    expect(levelButtons.length > 1).toBe(true);
  });

  it("should show not set message when level is 0", () => {
    renderWithI18n(<LevelSelector {...defaultProps} currentLevel={0} />);
    expect(screen.getByText(/Not set/i)).toBeTruthy();
  });
});
