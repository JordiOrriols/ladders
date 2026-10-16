import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { CreateTeamDialog } from "../CreateTeamDialog";

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

  it("renames a team starting from its current name", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithI18n(
      <CreateTeamDialog isOpen initialName="Platform" onClose={vi.fn()} onCreate={onCreate} />
    );
    const input = screen.getByLabelText("Team name");
    expect(input).toHaveValue("Platform");
    await userEvent.clear(input);
    await userEvent.type(input, "Core");
    await userEvent.click(screen.getByRole("button", { name: "Rename" }));
    expect(onCreate).toHaveBeenCalledWith("Core");
  });
});
