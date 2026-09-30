import type { Evaluation, TeamMember } from "@/types";
import { fromLegacyMembers, loadLocalTeam } from "./localRepository";
import type { LocalTeamData } from "./localRepository";
import type { Repository } from "./repository";
import { isEvaluation, isLegacyMemberList, isRecord, isTeamMember } from "./validators";

export async function buildTeamExport(repo: Repository) {
  const [members, evaluations] = await Promise.all([repo.listMembers(), repo.listEvaluations()]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    members: members.map(
      (m): TeamMember => ({ ...m, selfToken: null, peerToken: null, viewToken: null })
    ),
    evaluations,
  };
}

/** Accepts both the current export format and the legacy `members[]` with inline levels. */
export function parseTeamFile(value: unknown): LocalTeamData | null {
  if (!isRecord(value)) return null;
  const members = value["members"];
  const evaluations = value["evaluations"];
  if (
    Array.isArray(members) &&
    members.every(isTeamMember) &&
    Array.isArray(evaluations) &&
    evaluations.every(isEvaluation)
  ) {
    return { members, evaluations };
  }
  if (isLegacyMemberList(members)) return fromLegacyMembers(members);
  return null;
}

/** Copies members and their history into `repo`, assigning new ids. */
export async function importTeamData(repo: Repository, data: LocalTeamData) {
  for (const member of data.members) {
    const created = await repo.createMember({
      name: member.name,
      role: member.role,
      templateId: member.templateId,
    });
    const history = data.evaluations
      .filter((e: Evaluation) => e.memberId === member.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const {
      kind,
      createdAt,
      status,
      authorName,
      currentLevels,
      goalLevels,
      comments,
    } of history) {
      await repo.createEvaluation(
        created.id,
        kind,
        { status, authorName, currentLevels, goalLevels, comments },
        createdAt
      );
    }
  }
}

const migrationFlag = (userId: string) => `ladders-migrated-${userId}`;

/** Uploads device data once, only into an empty account. */
export async function migrateLocalTeam(remote: Repository, userId: string): Promise<boolean> {
  if (localStorage.getItem(migrationFlag(userId))) return false;
  const local = loadLocalTeam();
  const existing = await remote.listMembers();
  if (existing.length === 0 && local.members.length > 0) {
    await importTeamData(remote, local);
  }
  localStorage.setItem(migrationFlag(userId), new Date().toISOString());
  return existing.length === 0 && local.members.length > 0;
}
