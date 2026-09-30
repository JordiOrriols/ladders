import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import type { Evaluation, Member } from "@/types";
import { TeamTab } from "../TeamTab";
import { IndividualTab } from "../IndividualTab";

const renderWithI18n = (ui: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

const members: Member[] = [
  { id: "a", name: "Ada", currentLevels: { Technology: 2 }, goalLevels: {}, templateId: "D2" },
  { id: "b", name: "Bo", currentLevels: {}, goalLevels: {} },
];

const evaluations: Evaluation[] = [
  {
    id: "e1",
    memberId: "a",
    kind: "manager",
    status: "published",
    authorName: null,
    currentLevels: { Technology: 2 },
    goalLevels: { Technology: 3 },
    comments: {},
    createdAt: "2026-05-01T00:00:00.000Z",
  },
];

describe("TeamTab import/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates export and import to the parent", async () => {
    const onExportTeam = vi.fn();
    const onImportTeam = vi.fn();
    renderWithI18n(
      <TeamTab
        members={members}
        onAddMember={vi.fn()}
        onEditMember={vi.fn()}
        onDeleteMember={vi.fn()}
        onSelectMember={vi.fn()}
        onExportTeam={onExportTeam}
        onImportTeam={onImportTeam}
      />
    );
    await userEvent.click(screen.getByTestId("export-team-button"));
    expect(onExportTeam).toHaveBeenCalled();

    const file = new File(["{}"], "team.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("import-team-input"), { target: { files: [file] } });
    expect(onImportTeam).toHaveBeenCalledWith(file);
  });

  it("offers import on the empty state", () => {
    renderWithI18n(
      <TeamTab
        members={[]}
        onAddMember={vi.fn()}
        onEditMember={vi.fn()}
        onDeleteMember={vi.fn()}
        onSelectMember={vi.fn()}
        onImportTeam={vi.fn()}
      />
    );
    expect(screen.getByTestId("import-team-button")).toBeInTheDocument();
  });
});

describe("IndividualTab", () => {
  it("selects the first member without showing version history", async () => {
    const onEditMember = vi.fn();
    renderWithI18n(
      <IndividualTab
        members={members}
        evaluations={evaluations}
        onAddMember={vi.fn()}
        onEditMember={onEditMember}
      />
    );
    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(screen.queryByTestId("version-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("template-panel")).toHaveTextContent("D2");

    await userEvent.click(screen.getByTestId("member-card-b"));
    expect(screen.getByRole("heading", { name: "Bo" })).toBeInTheDocument();
    expect(screen.queryByText("No versions saved yet")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEditMember).toHaveBeenCalledWith(members[1]);
  });
});
