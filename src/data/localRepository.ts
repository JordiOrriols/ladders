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
    (data, version) => {
      if (version !== 1 || !isLegacyMemberList(data)) return null;
      const migrated = fromLegacyMembers(data);
      saveToStorage(TEAM_STORAGE_KEY, migrated, TEAM_STORAGE_VERSION);
      return migrated;
    }
  );
  if (current) return current;
  const legacy = loadFromStorage(TEAM_STORAGE_KEY, isLegacyMemberList, 1);
  if (!legacy) return { members: [], evaluations: [] };
  const migrated = fromLegacyMembers(legacy);
  saveToStorage(TEAM_STORAGE_KEY, migrated, TEAM_STORAGE_VERSION);
  return migrated;
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
      const current = loadLocalTeam();
      const hasDraft = current.evaluations.some(
        (evaluation) =>
          evaluation.memberId === memberId &&
          evaluation.kind === kind &&
          evaluation.status === "draft"
      );
      if (input.status === "draft" && kind !== "peer" && hasDraft) {
        throw new Error("A draft already exists");
      }
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
    async updateEvaluationDraft(id, input) {
      let updated: Evaluation | undefined;
      update((data) => ({
        ...data,
        evaluations: data.evaluations.map((evaluation) => {
          if (evaluation.id !== id) return evaluation;
          if (evaluation.status !== "draft") throw new Error("Only drafts can be updated");
          updated = { ...evaluation, ...input, authorName: evaluation.authorName };
          return updated;
        }),
      }));
      if (!updated) throw new Error("Evaluation not found");
      return updated;
    },
    async setEvaluationStatus(id, status) {
      const current = loadLocalTeam();
      const target = current.evaluations.find((evaluation) => evaluation.id === id);
      if (!target) throw new Error("Evaluation not found");
      const hasOtherDraft = current.evaluations.some(
        (evaluation) =>
          evaluation.id !== id &&
          evaluation.memberId === target.memberId &&
          evaluation.kind === target.kind &&
          evaluation.status === "draft"
      );
      if (status === "draft" && target.kind !== "peer" && hasOtherDraft) {
        throw new Error("A draft already exists");
      }
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
