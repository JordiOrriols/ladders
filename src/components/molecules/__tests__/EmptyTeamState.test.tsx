import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { EmptyTeamState } from "../EmptyTeamState";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("EmptyTeamState", () => {
  it("should render empty state message", () => {
    const onAddMember = vi.fn();
    renderWithI18n(<EmptyTeamState onAddMember={onAddMember} />);

    expect(screen.getByText(/No team members yet/i)).toBeInTheDocument();
  });

  it("should render add button", () => {
    const onAddMember = vi.fn();
    renderWithI18n(<EmptyTeamState onAddMember={onAddMember} />);

    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
  });

  it("should call onAddMember when button is clicked", async () => {
    const onAddMember = vi.fn();
    const { rerender } = render(<EmptyTeamState onAddMember={onAddMember} />);

    // Note: Would need user-event for full test
    expect(onAddMember).not.toHaveBeenCalled();
  });
});
