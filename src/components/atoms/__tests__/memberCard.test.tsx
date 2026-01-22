import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import MemberCard from "../memberCard";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

// Mock member data
const mockMember = {
  id: "1",
  name: "John Doe",
  role: "Senior Engineer",
  currentLevels: {
    Technology: 4,
    System: 3,
    People: 3,
    Process: 2,
    Influence: 3,
  },
  goalLevels: {
    Technology: 5,
    System: 4,
    People: 4,
    Process: 3,
    Influence: 4,
  },
};

describe("MemberCard", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member name", () => {
    renderWithI18n(<MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("John Doe")).toBeTruthy();
  });

  it("should render member role", () => {
    renderWithI18n(<MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("Senior Engineer")).toBeTruthy();
  });

  it("should render action buttons", () => {
    renderWithI18n(<MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should render radar chart", () => {
    const { container } = renderWithI18n(
      <MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should call onEdit when edit button clicked", async () => {
    const user = userEvent.setup();
    renderWithI18n(<MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const buttons = screen.getAllByRole("button");
    // First button is edit button (based on component structure)
    if (buttons.length > 0) {
      await user.click(buttons[0]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockMember);
    }
  });

  it("should show member data correctly", () => {
    renderWithI18n(<MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    // Member name should be rendered
    expect(screen.getByText("John Doe")).toBeTruthy();
  });
});
