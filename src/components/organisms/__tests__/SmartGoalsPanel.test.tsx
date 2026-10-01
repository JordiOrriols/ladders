import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { SmartGoalsPanel } from "../SmartGoalsPanel";
import { createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import { createRepositoryGoalStore } from "@/data/goalStore";

describe("SmartGoalsPanel", () => {
  it("creates and updates a SMART goal", async () => {
    const repository = createInMemoryRepository();
    const member = await repository.createMember({ name: "Ada", role: "Dev", templateId: null });
    render(
      <I18nextProvider i18n={i18n}>
        <SmartGoalsPanel store={createRepositoryGoalStore(repository, member.id)} />
      </I18nextProvider>
    );

    await userEvent.type(await screen.findByLabelText("Title"), "Improve onboarding");
    await userEvent.type(screen.getByLabelText("Description"), "Document the first-week path.");
    await userEvent.click(screen.getByRole("button", { name: "Add goal" }));

    expect(await screen.findByDisplayValue("Improve onboarding")).toBeInTheDocument();
    const progress = screen.getByLabelText("Progress");
    await userEvent.click(progress);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(async () => {
      expect((await repository.listGoals(member.id))[0]?.title).toBe("Improve onboarding");
    });
  });
});
