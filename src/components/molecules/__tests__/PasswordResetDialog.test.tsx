import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { PasswordResetDialog } from "../PasswordResetDialog";

const { state, updatePassword } = vi.hoisted(() => ({
  state: { passwordRecovery: true },
  updatePassword: vi.fn(),
}));
vi.mock("@/data/DataProvider", () => ({
  useData: () => ({ passwordRecovery: state.passwordRecovery, updatePassword }),
}));

const renderDialog = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <PasswordResetDialog />
    </I18nextProvider>
  );

describe("PasswordResetDialog", () => {
  beforeEach(() => {
    state.passwordRecovery = true;
    updatePassword.mockReset();
  });

  it("validates password length and confirmation", async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("New password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at least 8 characters");
    expect(updatePassword).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText("New password"));
    await userEvent.clear(screen.getByLabelText("Confirm password"));
    await userEvent.type(screen.getByLabelText("New password"), "new-password");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different-password");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("updates a valid password", async () => {
    updatePassword.mockResolvedValue(undefined);
    renderDialog();
    await userEvent.type(screen.getByLabelText("New password"), "new-password");
    await userEvent.type(screen.getByLabelText("Confirm password"), "new-password");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(updatePassword).toHaveBeenCalledWith("new-password");
  });

  it("stays hidden outside a recovery session", () => {
    state.passwordRecovery = false;
    const { container } = renderDialog();
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });
});
