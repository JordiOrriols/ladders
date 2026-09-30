import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import type { TeamMember } from "@/types";
import { ShareAction } from "../ShareAction";

const member: TeamMember = {
  id: "member-id-that-never-enters-the-url",
  name: "Ada",
  role: "Engineer",
  templateId: null,
  selfToken: "11111111-1111-4111-8111-111111111111",
  peerToken: "22222222-2222-4222-8222-222222222222",
  viewToken: "33333333-3333-4333-8333-333333333333",
  viewEnabled: false,
  createdAt: "",
};

const renderAction = (onEnableView = vi.fn(async () => {})) => {
  render(
    <I18nextProvider i18n={i18n}>
      <ShareAction member={member} onEnableView={onEnableView} />
    </I18nextProvider>
  );
  return onEnableView;
};

describe("ShareAction", () => {
  const writeText = vi.fn(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  it("copies the permanent self UUID from the primary action", async () => {
    renderAction();
    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(`#/e/${member.selfToken}`));
    expect(writeText).not.toHaveBeenCalledWith(expect.stringContaining(member.name));
  });

  it("offers peer and public UUID links", async () => {
    const onEnableView = renderAction();
    await userEvent.click(screen.getByRole("button", { name: "Choose a sharing link" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Peer evaluation" }));
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining(`#/e/${member.peerToken}`));

    await userEvent.click(screen.getByRole("button", { name: "Choose a sharing link" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "View my evaluation" }));
    expect(onEnableView).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining(`#/v/${member.viewToken}`));
  });

  it("does not re-enable an already public link", async () => {
    const onEnableView = vi.fn(async () => {});
    render(
      <I18nextProvider i18n={i18n}>
        <ShareAction member={{ ...member, viewEnabled: true }} onEnableView={onEnableView} />
      </I18nextProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "Choose a sharing link" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "View my evaluation" }));
    expect(onEnableView).not.toHaveBeenCalled();
  });
});
