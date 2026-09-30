import { describe, it, expect, beforeEach } from "vitest";
import { createLocalRepository, loadLocalTeam, TEAM_STORAGE_KEY } from "../localRepository";
import { importTeamData, parseTeamFile } from "../teamTransfer";

const legacyMember = {
  id: "m1",
  name: "Ada",
  role: "Engineer",
  currentLevels: { Technology: 2 },
  goalLevels: { Technology: 3 },
  selfAssessmentLevels: { Technology: 1 },
};

describe("localRepository", () => {
  beforeEach(() => localStorage.clear());

  it("migrates v1 members into members plus manager and self versions", () => {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify({ version: 1, data: [legacyMember] }));
    const { members, evaluations } = loadLocalTeam();
    expect(members).toHaveLength(1);
    expect(members[0]?.name).toBe("Ada");
    expect(evaluations.map((e) => e.kind).sort()).toEqual(["manager", "self"]);
    expect(evaluations.find((e) => e.kind === "manager")?.goalLevels).toEqual({ Technology: 3 });
  });

  it("migrates unversioned legacy arrays", () => {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify([legacyMember]));
    expect(loadLocalTeam().members).toHaveLength(1);
  });

  it("keeps every save as a new version and cascades member deletes", async () => {
    const repo = createLocalRepository();
    const member = await repo.createMember({ name: "Bo", role: "", templateId: "D3" });
    const input = {
      status: "draft" as const,
      authorName: null,
      currentLevels: { Technology: 1 },
      goalLevels: {},
      comments: {},
    };
    const first = await repo.createEvaluation(member.id, "manager", input);
    await repo.createEvaluation(member.id, "manager", { ...input, status: "published" });
    expect(await repo.listEvaluations(member.id)).toHaveLength(2);

    await repo.setEvaluationStatus(first.id, "published");
    expect((await repo.listEvaluations()).every((e) => e.status === "published")).toBe(true);

    await repo.deleteEvaluation(first.id);
    expect(await repo.listEvaluations(member.id)).toHaveLength(1);

    await repo.updateMember(member.id, { name: "Bob" });
    expect((await repo.getMember(member.id))?.name).toBe("Bob");

    await repo.deleteMember(member.id);
    expect(await repo.listMembers()).toHaveLength(0);
    expect(await repo.listEvaluations()).toHaveLength(0);
  });
});

describe("teamTransfer", () => {
  beforeEach(() => localStorage.clear());

  it("parses the legacy team export and imports it with history", async () => {
    const data = parseTeamFile({ teamName: "x", members: [legacyMember] });
    expect(data).not.toBeNull();
    const repo = createLocalRepository();
    await importTeamData(repo, data!);
    const members = await repo.listMembers();
    expect(members).toHaveLength(1);
    expect(members[0]?.id).not.toBe("m1");
    expect(await repo.listEvaluations(members[0]!.id)).toHaveLength(2);
  });

  it("rejects unknown shapes", () => {
    expect(parseTeamFile({ foo: 1 })).toBeNull();
    expect(parseTeamFile("nope")).toBeNull();
  });
});
