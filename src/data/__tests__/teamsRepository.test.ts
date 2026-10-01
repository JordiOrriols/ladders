import { describe, expect, it } from "vitest";
import { createInMemoryRepository } from "./inMemoryRepository";

describe("team repository contract", () => {
  it("creates a default team and moves members between teams", async () => {
    const repo = createInMemoryRepository();
    const [defaultTeam] = await repo.listTeams();
    const platform = await repo.createTeam("Platform");
    const member = await repo.createMember({ name: "Ada", role: "Dev", templateId: null });

    expect(defaultTeam?.isDefault).toBe(true);
    expect(member.teamId).toBe(defaultTeam?.id);
    expect((await repo.moveMember(member.id, platform.id)).teamId).toBe(platform.id);
  });

  it("manages team shares and blocks populated team deletion", async () => {
    const repo = createInMemoryRepository();
    const platform = await repo.createTeam("Platform");
    await repo.shareTeamByEmail(platform.id, "ada@example.com", "editor");
    const [share] = await repo.listTeamShares(platform.id);
    expect(share).toMatchObject({ email: "ada@example.com", access: "editor" });

    await repo.updateTeamShare(platform.id, share!.userId, "viewer");
    expect((await repo.listTeamShares(platform.id))[0]?.access).toBe("viewer");

    await repo.createMember({ name: "Ada", role: "Dev", templateId: null }, platform.id);
    await expect(repo.deleteTeam(platform.id)).rejects.toThrow("Team is not empty");
  });
});
