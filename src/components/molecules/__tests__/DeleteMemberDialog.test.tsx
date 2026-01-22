import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { DeleteMemberDialog } from "../DeleteMemberDialog";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("DeleteMemberDialog", () => {
  it("should render delete confirmation dialog when open", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithI18n(<DeleteMemberDialog isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    expect(screen.getByText(/Delete team member/i)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = renderWithI18n(<DeleteMemberDialog isOpen={false} onConfirm={onConfirm} onCancel={onCancel} />);

    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("should render cancel button", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithI18n(<DeleteMemberDialog isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    expect(cancelButton).toBeTruthy();
  });
});
