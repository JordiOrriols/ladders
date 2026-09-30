import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import type { Evaluation, Member } from "@/types";
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
