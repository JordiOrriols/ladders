import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { SmartGoalsPanel } from "../SmartGoalsPanel";
import { createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import { createRepositoryGoalStore } from "@/data/goalStore";

describe("SmartGoalsPanel", () => {
  it("allows member progress and append-only comments, but no goal details or removal", async () => {
    const repository = createInMemoryRepository();
    const member = await repository.createMember({ name: "Ada", role: "", templateId: null });
    const goal = await repository.createGoal(member.id, {
      title: "Mentor",
      description: "Help the team",
      dueDate: "2026-12-01",
      progress: 20,
    });
    await repository.appendGoalComment(goal.id, "Existing comment");
    const managerStore = createRepositoryGoalStore(repository, member.id);
    const appendComment = vi.fn(managerStore.appendComment);
    const store = {
      ...managerStore,
      mode: "member" as const,
      canDelete: async () => false,
      appendComment,
    };
    render(
      <I18nextProvider i18n={i18n}>
        <SmartGoalsPanel store={store} />
      </I18nextProvider>
    );
    expect(await screen.findByText("Mentor")).toBeInTheDocument();
    expect(screen.getByText("Help the team")).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Target date")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add goal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete goal" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "80" } });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled());
    expect((await repository.listGoals(member.id))[0]?.progress).toBe(80);
    await userEvent.type(screen.getByLabelText("New comment"), "Second comment");
    await userEvent.click(screen.getByRole("button", { name: "Add comment" }));
    expect(await screen.findByText("Second comment")).toBeInTheDocument();
    expect(screen.getByText("Existing comment")).toBeInTheDocument();
    expect(screen.getByLabelText("New comment")).toHaveValue("");
    expect(appendComment).toHaveBeenCalledOnce();
    appendComment.mockRejectedValueOnce(new Error("Network error"));
    await userEvent.type(screen.getByLabelText("New comment"), "Keep this text");
    await userEvent.click(screen.getByRole("button", { name: "Add comment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
    expect(screen.getByLabelText("New comment")).toHaveValue("Keep this text");
  });
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
