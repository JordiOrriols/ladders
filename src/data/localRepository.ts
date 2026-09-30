import type { Evaluation, TeamMember } from "@/types";
import { loadFromStorage, saveToStorage } from "@/utils/storage";
import { hasLevels, newId } from "./evaluations";
import type { Repository } from "./repository";
import { isEvaluation, isLegacyMemberList, isRecord, isTeamMember } from "./validators";
import type { LegacyMember } from "./validators";

export const TEAM_STORAGE_KEY = "engineering-ladder-data";
const TEAM_STORAGE_VERSION = 2;

export type LocalTeamData = { members: TeamMember[]; evaluations: Evaluation[] };

const isLocalTeamData = (value: unknown): value is LocalTeamData =>
  isRecord(value) &&
  Array.isArray(value["members"]) &&
  value["members"].every(isTeamMember) &&
  Array.isArray(value["evaluations"]) &&
  value["evaluations"].every(isEvaluation);

export function fromLegacyMembers(legacy: LegacyMember[], now = new Date()): LocalTeamData {
  const createdAt = now.toISOString();
  const members: TeamMember[] = [];
  const evaluations: Evaluation[] = [];
  for (const old of legacy) {
    members.push({
      id: old.id,
      name: old.name,
      role: old.role ?? "",
      templateId: null,
      selfToken: null,
      peerToken: null,
      viewToken: null,
      viewEnabled: false,
      createdAt,
    });
    if (hasLevels(old.currentLevels) || hasLevels(old.goalLevels)) {
      evaluations.push({
        id: newId(),
        memberId: old.id,
        kind: "manager",
        status: "published",
        authorName: null,
        currentLevels: old.currentLevels,
        goalLevels: old.goalLevels,
        comments: old.comments ?? {},
        createdAt,
      });
    }
    if (old.selfAssessmentLevels && hasLevels(old.selfAssessmentLevels)) {
      evaluations.push({
        id: newId(),
        memberId: old.id,
        kind: "self",
        status: "published",
        authorName: old.name,
        currentLevels: old.selfAssessmentLevels,
        goalLevels: {},
        comments: {},
        createdAt,
      });
    }
  }
  return { members, evaluations };
}

export function loadLocalTeam(): LocalTeamData {
  const current = loadFromStorage<LocalTeamData>(
    TEAM_STORAGE_KEY,
    isLocalTeamData,
    TEAM_STORAGE_VERSION,
    (data, version) => (version === 1 && isLegacyMemberList(data) ? fromLegacyMembers(data) : null)
  );
  if (current) return current;
  const legacy = loadFromStorage(TEAM_STORAGE_KEY, isLegacyMemberList, 1);
  return legacy ? fromLegacyMembers(legacy) : { members: [], evaluations: [] };
}

function write(data: LocalTeamData) {
  saveToStorage(TEAM_STORAGE_KEY, data, TEAM_STORAGE_VERSION);
}

function update(mutator: (data: LocalTeamData) => LocalTeamData) {
  const next = mutator(loadLocalTeam());
  write(next);
  return next;
}

export function createLocalRepository(): Repository {
  return {
    kind: "local",
    async listMembers() {
      return loadLocalTeam().members;
    },
    async getMember(id) {
      return loadLocalTeam().members.find((m) => m.id === id) ?? null;
    },
    async createMember(profile) {
      const member: TeamMember = {
        id: newId(),
        ...profile,
        selfToken: null,
        peerToken: null,
        viewToken: null,
        viewEnabled: false,
        createdAt: new Date().toISOString(),
      };
      update((data) => ({ ...data, members: [...data.members, member] }));
      return member;
    },
    async updateMember(id, patch) {
      let updated: TeamMember | undefined;
      update((data) => ({
        ...data,
        members: data.members.map((m) => {
          if (m.id !== id) return m;
          updated = { ...m, ...patch };
          return updated;
        }),
      }));
      if (!updated) throw new Error("Member not found");
      return updated;
    },
    async deleteMember(id) {
      update((data) => ({
        members: data.members.filter((m) => m.id !== id),
        evaluations: data.evaluations.filter((e) => e.memberId !== id),
      }));
    },
    async listEvaluations(memberId) {
      const { evaluations } = loadLocalTeam();
      return memberId ? evaluations.filter((e) => e.memberId === memberId) : evaluations;
    },
    async createEvaluation(memberId, kind, input, createdAt) {
      const evaluation: Evaluation = {
        ...input,
        id: newId(),
        memberId,
        kind,
        createdAt: createdAt ?? new Date().toISOString(),
      };
      update((data) => ({ ...data, evaluations: [...data.evaluations, evaluation] }));
      return evaluation;
    },
    async setEvaluationStatus(id, status) {
      update((data) => ({
        ...data,
        evaluations: data.evaluations.map((e) => (e.id === id ? { ...e, status } : e)),
      }));
    },
    async deleteEvaluation(id) {
      update((data) => ({ ...data, evaluations: data.evaluations.filter((e) => e.id !== id) }));
    },
  };
}
