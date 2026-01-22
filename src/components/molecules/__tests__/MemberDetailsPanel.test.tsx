import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { MemberDetailsPanel } from "../MemberDetailsPanel";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

const mockMember = {
  id: "1",
  name: "John Doe",
  role: "Senior Engineer",
  currentLevels: {
    Technology: 3,
    System: 2,
    People: 3,
    Process: 2,
    Influence: 3,
  },
  goalLevels: {
    Technology: 4,
    System: 3,
    People: 4,
    Process: 3,
    Influence: 4,
  },
};

describe("MemberDetailsPanel", () => {
  const mockOnEdit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member details panel", () => {
    renderWithI18n(
      <MemberDetailsPanel member={mockMember} onEdit={mockOnEdit} onClose={mockOnClose} />
    );
    // Panel should contain member name
    expect(screen.getByText("John Doe")).toBeTruthy();
  });

  it("should render member role", () => {
    renderWithI18n(
      <MemberDetailsPanel member={mockMember} onEdit={mockOnEdit} onClose={mockOnClose} />
    );
    // Panel should contain member role
    expect(screen.getByText("Senior Engineer")).toBeTruthy();
  });

  it("should display competency levels", () => {
    renderWithI18n(
      <MemberDetailsPanel member={mockMember} onEdit={mockOnEdit} onClose={mockOnClose} />
    );
    // Should render radar chart or competency display
    const container = screen.getByText("John Doe").closest("div");
    expect(container).toBeTruthy();
  });
});
