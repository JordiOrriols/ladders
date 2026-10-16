import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LoginDialog } from "../LoginDialog";

const { requestPasswordReset, signInWithGitHub } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  signInWithGitHub: vi.fn(),
}));
vi.mock("@/data/DataProvider", () => ({
  useData: () => ({ signIn: vi.fn(), signInWithGitHub, signUp: vi.fn(), requestPasswordReset }),
}));

const renderDialog = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <LoginDialog isOpen onClose={vi.fn()} />
    </I18nextProvider>
  );

describe("LoginDialog password reset", () => {
  afterEach(async () => {
    cleanup();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  beforeEach(() => {
    requestPasswordReset.mockReset();
    signInWithGitHub.mockReset();
  });

  it("starts GitHub OAuth", async () => {
    signInWithGitHub.mockResolvedValue(undefined);
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(signInWithGitHub).toHaveBeenCalledOnce();
  });

  it("requests a reset email without asking for a password", async () => {
    requestPasswordReset.mockResolvedValue(undefined);
    renderDialog();
    await userEvent.click(screen.getByText("Forgot password?"));
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent
      .click(screen.getByRole("button", { name: "Send reset email" }))
      .catch(() => undefined);
    expect(requestPasswordReset).toHaveBeenCalledWith("ada@example.com");
    expect(await screen.findByText(/Check your email/)).toBeInTheDocument();
  });

  it("can return to sign in", async () => {
    renderDialog();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.click(screen.getByText("Back to sign in"));
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("retranslates a visible reset confirmation when the language changes", async () => {
    requestPasswordReset.mockResolvedValue(undefined);
    renderDialog();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset email" }));
    expect(await screen.findByText(i18n.t("auth.passwordResetSent"))).toBeInTheDocument();
    await act(async () => {
      await i18n.changeLanguage("fr");
    });
    expect(screen.getByText(i18n.t("auth.passwordResetSent"))).toBeInTheDocument();
    expect(
      screen.queryByText("Check your email for password reset instructions.")
    ).not.toBeInTheDocument();
  });
});
