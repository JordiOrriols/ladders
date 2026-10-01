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
  it("shows goals read-only for view-only access", async () => {
    const member = await repository.createMember({ name: "Ada", role: "Dev", templateId: null });
    await repository.createGoal(member.id, {
      title: "Lead onboarding",
      description: "Own the first-week plan.",
      dueDate: null,
      progress: 60,
      comments: "On track",
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemberDetailsPanel
          member={{ ...member, currentLevels: {}, goalLevels: {} }}
          onEdit={vi.fn()}
          readOnly
        />
      </I18nextProvider>
    );

    await userEvent.click(screen.getByRole("tab", { name: "SMART Goals" }));

    expect(await screen.findByDisplayValue("Lead onboarding")).toBeDisabled();
    expect(screen.getByDisplayValue("On track")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add goal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
