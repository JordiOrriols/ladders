import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { CreateTeamDialog } from "../CreateTeamDialog";
import { ShareTeamDialog } from "../ShareTeamDialog";
import type { Team, TeamShare } from "@/types";

const team: Team = {
  id: "team-1",
  ownerId: "user-1",
  name: "Platform",
  isDefault: false,
  access: "owner",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const share: TeamShare = {
  teamId: team.id,
  userId: "user-2",
  email: "ada@example.com",
  access: "viewer",
  sharedAt: "2026-01-02T00:00:00.000Z",
};

const renderWithI18n = (node: React.ReactNode) =>
  render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);

describe("team dialogs", () => {
  it("creates a named team", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithI18n(<CreateTeamDialog isOpen onClose={vi.fn()} onCreate={onCreate} />);

    await userEvent.type(screen.getByLabelText("Team name"), " Platform ");
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));

    expect(onCreate).toHaveBeenCalledWith("Platform");
  });

  it("shares with an existing user and manages permissions", async () => {
    const onShare = vi.fn().mockResolvedValue(undefined);
    const onChangeAccess = vi.fn().mockResolvedValue(undefined);
    const onRemove = vi.fn().mockResolvedValue(undefined);
    renderWithI18n(
      <ShareTeamDialog
        team={team}
        shares={[share]}
        isOpen
        onClose={vi.fn()}
        onShare={onShare}
        onChangeAccess={onChangeAccess}
        onRemove={onRemove}
      />
    );

    await userEvent.type(screen.getByLabelText("Email"), "GRACE@EXAMPLE.COM");
    await userEvent.selectOptions(screen.getByLabelText("Permission"), "editor");
    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(onShare).toHaveBeenCalledWith("grace@example.com", "editor");

    await userEvent.selectOptions(
      screen.getByLabelText("Permission for ada@example.com"),
      "editor"
    );
    expect(onChangeAccess).toHaveBeenCalledWith("user-2", "editor");

    await userEvent.click(screen.getByRole("button", { name: "Remove ada@example.com" }));
    expect(onRemove).toHaveBeenCalledWith("user-2");
  });
});
