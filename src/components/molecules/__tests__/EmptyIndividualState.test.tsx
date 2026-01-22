import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { EmptyIndividualState } from "../EmptyIndividualState";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("EmptyIndividualState", () => {
  it("should render empty state message", () => {
    const onAddMember = vi.fn();
    renderWithI18n(<EmptyIndividualState onAddMember={onAddMember} />);

    expect(screen.getByText(/No team members/i)).toBeInTheDocument();
  });

  it("should render add button", () => {
    const onAddMember = vi.fn();
    renderWithI18n(<EmptyIndividualState onAddMember={onAddMember} />);

    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
  });
});
