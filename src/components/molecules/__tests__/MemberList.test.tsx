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
  const mockOnAddMember = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member names", () => {
    renderWithI18n(
      <MemberList
        members={mockMembers}
        selectedMemberId={null}
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );
    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Jane Smith")).toBeTruthy();
  });

  it("should render member roles", () => {
    renderWithI18n(
      <MemberList
        members={mockMembers}
        selectedMemberId={null}
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );
    expect(screen.getByText("Senior Engineer")).toBeTruthy();
    expect(screen.getByText("Tech Lead")).toBeTruthy();
  });

  it("should highlight selected member", () => {
    renderWithI18n(
      <MemberList
        members={mockMembers}
        selectedMemberId="1"
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].className).toMatch(/bg-indigo-50/);
  });

  it("should render empty list", () => {
    renderWithI18n(
      <MemberList
        members={[]}
        selectedMemberId={null}
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );
    // No members should be rendered
    expect(screen.queryByText("John Doe")).toBeNull();
  });

  it("should call onSelectMember when member is clicked", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <MemberList
        members={mockMembers}
        selectedMemberId={null}
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );

    const button = screen.getByRole("button", { name: /John Doe/i });
    await user.click(button);

    expect(mockOnSelectMember).toHaveBeenCalledWith(mockMembers[0]);
  });

  it("renders an Add Member row", async () => {
    renderWithI18n(
      <MemberList
        members={mockMembers}
        selectedMemberId={null}
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );
    await userEvent.click(screen.getByTestId("add-member-row"));
    expect(mockOnAddMember).toHaveBeenCalledOnce();
  });

  it("groups members under one heading per team with a team add button", async () => {
    const team = (id: string, name: string) => ({
      id,
      ownerId: "o",
      name,
      isDefault: false,
      access: "owner" as const,
      createdAt: "",
      updatedAt: "",
    });
    renderWithI18n(
      <MemberList
        teams={[team("a", "Alpha"), team("b", "Beta")]}
        members={[
          { ...mockMembers[0]!, teamId: "a" },
          { ...mockMembers[1]!, teamId: "b" },
          { id: "3", name: "Third", teamId: "a", currentLevels: {}, goalLevels: {} },
        ]}
        selectedMemberId={null}
        onSelectMember={mockOnSelectMember}
        onAddMember={mockOnAddMember}
      />
    );
    expect(screen.getAllByText("Alpha")).toHaveLength(1);
    const alpha = screen.getByRole("region", { name: "Alpha" });
    expect(alpha.textContent).toContain("John Doe");
    expect(alpha.textContent).toContain("Third");
    await userEvent.click(screen.getByRole("button", { name: "Add member to Beta" }));
    expect(mockOnAddMember).toHaveBeenCalledWith("b");
  });
});
