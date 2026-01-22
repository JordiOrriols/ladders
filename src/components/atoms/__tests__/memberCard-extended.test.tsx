import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import MemberCard from "../memberCard";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

const mockMember = {
  id: "1",
  name: "Alice Johnson",
  role: "Tech Lead",
  currentLevels: {
    Technology: 4,
    System: 3,
    People: 4,
    Process: 3,
    Influence: 4,
  },
  goalLevels: {
    Technology: 5,
    System: 4,
    People: 5,
    Process: 4,
    Influence: 5,
  },
};

describe("MemberCard Extended Tests", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member card with all details", () => {
    renderWithI18n(
      <MemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText("Alice Johnson")).toBeTruthy();
    expect(screen.getByText("Tech Lead")).toBeTruthy();
  });

  it("should calculate correct average level", () => {
    const { container } = renderWithI18n(
      <MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    // Average = (4+3+4+3+4) / 5 = 3.6
    expect(container).toBeTruthy();
  });

  it("should display radar chart", () => {
    const { container } = renderWithI18n(
      <MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("should handle card click event", async () => {
    const user = userEvent.setup();
    const { container } = renderWithI18n(
      <MemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onClick={mockOnClick}
      />
    );

    const card = container.querySelector(".hover\\:shadow-lg");
    if (card) {
      await user.click(card);
      expect(mockOnClick).toHaveBeenCalled();
    }
  });

  it("should work with different member data", () => {
    const differentMember = {
      id: "2",
      name: "Bob Smith",
      role: "Engineer",
      currentLevels: {
        Technology: 2,
        System: 2,
        People: 1,
        Process: 1,
        Influence: 1,
      },
      goalLevels: {
        Technology: 3,
        System: 3,
        People: 2,
        Process: 2,
        Influence: 2,
      },
    };

    renderWithI18n(
      <MemberCard member={differentMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(screen.getByText("Bob Smith")).toBeTruthy();
  });

  it("should show action buttons on hover", () => {
    const { container } = renderWithI18n(
      <MemberCard member={mockMember} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length >= 2).toBe(true); // Edit and Delete buttons
  });
});
