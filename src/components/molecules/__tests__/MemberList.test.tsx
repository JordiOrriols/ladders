import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { MemberList } from "../MemberList";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

const mockMembers = [
  {
    id: "1",
    name: "John Doe",
    role: "Senior Engineer",
    currentLevels: {},
    goalLevels: {},
  },
  {
    id: "2",
    name: "Jane Smith",
    role: "Tech Lead",
    currentLevels: {},
    goalLevels: {},
  },
];

describe("MemberList", () => {
  const mockOnSelectMember = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member names", () => {
    renderWithI18n(<MemberList members={mockMembers} selectedMemberId={null} onSelectMember={mockOnSelectMember} />);
    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Jane Smith")).toBeTruthy();
  });

  it("should render member roles", () => {
    renderWithI18n(<MemberList members={mockMembers} selectedMemberId={null} onSelectMember={mockOnSelectMember} />);
    expect(screen.getByText("Senior Engineer")).toBeTruthy();
    expect(screen.getByText("Tech Lead")).toBeTruthy();
  });

  it("should highlight selected member", () => {
    renderWithI18n(<MemberList members={mockMembers} selectedMemberId="1" onSelectMember={mockOnSelectMember} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].className).toMatch(/bg-indigo-50/);
  });

  it("should render empty list", () => {
    renderWithI18n(<MemberList members={[]} selectedMemberId={null} onSelectMember={mockOnSelectMember} />);
    // No members should be rendered
    expect(screen.queryByText("John Doe")).toBeNull();
  });

  it("should call onSelectMember when member is clicked", async () => {
    const user = userEvent.setup();
    renderWithI18n(<MemberList members={mockMembers} selectedMemberId={null} onSelectMember={mockOnSelectMember} />);

    const button = screen.getByRole("button", { name: /John Doe/i });
    await user.click(button);

    expect(mockOnSelectMember).toHaveBeenCalledWith(mockMembers[0]);
  });
});
