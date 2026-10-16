import { describe, expect, it } from "vitest";
import { DEFAULT_WORKSPACE, createInMemoryRepository } from "./inMemoryRepository";
import type { GoalComment } from "@/types";

describe("team repository contract", () => {
  it("creates a default team and moves members between teams", async () => {
    const repo = createInMemoryRepository();
    const [defaultTeam] = await repo.listTeams();
    const platform = await repo.createTeam("Platform", DEFAULT_WORKSPACE);
    const member = await repo.createMember({ name: "Ada", role: "Dev", templateId: null });

    expect(defaultTeam?.isDefault).toBe(true);
    expect(member.teamId).toBe(defaultTeam?.id);
    expect((await repo.moveMember(member.id, platform.id)).teamId).toBe(platform.id);
  });

  it("lists teams per workspace and blocks populated team deletion", async () => {
    const repo = createInMemoryRepository();
    const platform = await repo.createTeam("Platform", "workspace-two");
    expect(
      (await repo.listWorkspaceTeams("workspace-two", "viewer")).map(({ name, access }) => ({
        name,
        access,
      }))
    ).toEqual([{ name: "Platform", access: "viewer" }]);
    expect((await repo.listWorkspaceTeams(DEFAULT_WORKSPACE, "owner")).map((t) => t.name)).toEqual([
      "Default Team",
    ]);

    await repo.createMember({ name: "Ada", role: "Dev", templateId: null }, platform.id);
    await expect(repo.deleteTeam(platform.id)).rejects.toThrow("Team is not empty");
  });

  it("keeps SMART goals scoped to their member", async () => {
    const repo = createInMemoryRepository();
    const member = await repo.createMember({ name: "Ada", role: "Dev", templateId: null });
    const goal = await repo.createGoal(member.id, {
      title: "Improve onboarding",
      description: "Document the first-week path.",
      dueDate: null,
      progress: 0,
    });

    expect((await repo.listGoals(member.id))[0]).toMatchObject({
      id: goal.id,
      title: "Improve onboarding",
    });
    await repo.appendGoalComment(goal.id, "First comment");
    await repo.appendGoalComment(goal.id, "Second comment");
    await repo.updateGoal(goal.id, {
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate,
      progress: 50,
    });
    expect(
      (await repo.listGoals(member.id))[0]?.comments.map((comment: GoalComment) => comment.text)
    ).toEqual(["First comment", "Second comment"]);
    expect((await repo.listGoals(member.id))[0]?.progress).toBe(50);
    await repo.deleteGoal(goal.id);
    expect(await repo.listGoals(member.id)).toHaveLength(0);
  });
});
