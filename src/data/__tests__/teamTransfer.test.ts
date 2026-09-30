import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLocalRepository } from "../localRepository";
import type { Repository } from "../repository";
import { buildTeamExport, migrateLocalTeam } from "../teamTransfer";

const seedLocal = async () => {
  const local = createLocalRepository();
  const member = await local.createMember({ name: "Ada", role: "", templateId: null });
  await local.createEvaluation(member.id, "self", {
    status: "published",
    authorName: "Ada",
    currentLevels: { Technology: 2 },
    goalLevels: {},
    comments: {},
  });
  return local;
};

const remoteWith = (existing: number) => {
  const remote = createLocalRepository() as Repository & { kind: "remote" };
  return {
    ...remote,
    listMembers: vi.fn(async () => Array.from({ length: existing }, () => ({}) as never)),
    createMember: vi.fn(async () => ({ id: "r1" }) as never),
    createEvaluation: vi.fn(async () => ({}) as never),
  };
};

describe("migrateLocalTeam", () => {
  beforeEach(() => localStorage.clear());

  it("uploads device data once into an empty account", async () => {
    await seedLocal();
    const remote = remoteWith(0);
    expect(await migrateLocalTeam(remote, "u1")).toBe(true);
    expect(remote.createMember).toHaveBeenCalledTimes(1);
    expect(remote.createEvaluation).toHaveBeenCalledWith(
      "r1",
      "self",
      expect.objectContaining({ status: "published" }),
      expect.any(String)
    );
    expect(await migrateLocalTeam(remote, "u1")).toBe(false);
    expect(remote.createMember).toHaveBeenCalledTimes(1);
  });

  it("never touches an account that already has members", async () => {
    await seedLocal();
    const remote = remoteWith(2);
    expect(await migrateLocalTeam(remote, "u2")).toBe(false);
    expect(remote.createMember).not.toHaveBeenCalled();
  });

  it("strips share tokens from exports", async () => {
    const local = await seedLocal();
    const data = await buildTeamExport(local);
    expect(data.members[0]?.selfToken).toBeNull();
    expect(data.evaluations).toHaveLength(1);
  });
});
