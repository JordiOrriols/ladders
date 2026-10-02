import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import { MemberDetailsPanel } from "../MemberDetailsPanel";

const repository = createInMemoryRepository();
vi.mock("@/data/DataProvider", () => ({ useData: () => ({ repository }) }));

describe("MemberDetailsPanel SMART goals", () => {
  it("always shows goals as read-only text", async () => {
    const member = await repository.createMember({ name: "Ada", role: "Dev", templateId: null });
    const goal = await repository.createGoal(member.id, {
      title: "Lead onboarding",
      description: "Own the first-week plan.",
      dueDate: null,
      progress: 60,
    });
    await repository.appendGoalComment(goal.id, "On track");

    render(
      <I18nextProvider i18n={i18n}>
        <MemberDetailsPanel
          member={{ ...member, currentLevels: {}, goalLevels: {} }}
          onEdit={vi.fn()}
        />
      </I18nextProvider>
    );

    await userEvent.click(screen.getByRole("tab", { name: "SMART Goals" }));

    expect(await screen.findByText("Lead onboarding")).toBeInTheDocument();
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add goal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });
});
