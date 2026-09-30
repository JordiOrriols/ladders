import type {
  Evaluation,
  EvaluationInput,
  EvaluationKind,
  EvaluationStatus,
  MemberProfile,
  TeamMember,
} from "@/types";
import { loadFromStorage, saveToStorage } from "@/utils/storage";
import { newId } from "./evaluations";
import type { Repository } from "./repository";
import * as tokenApi from "./tokenApi";
import { isEvaluation, isRecord } from "./validators";

export type StoreSnapshot = {
  profile: MemberProfile;
  evaluations: Evaluation[];
  member?: TeamMember;
};

/** Scoped access to one person's evaluations, regardless of where they are stored. */
export interface EvaluationStore {
  /** Kind of the versions this store creates. */
  kind: EvaluationKind;
  editableProfile: boolean;
  showHistory: boolean;
  memberId(): string | null;
  load(): Promise<StoreSnapshot | null>;
  saveProfile(profile: MemberProfile): Promise<void>;
  create(input: EvaluationInput): Promise<Evaluation>;
  updateDraft?(id: string, input: EvaluationInput): Promise<Evaluation>;
  setStatus(id: string, status: EvaluationStatus): Promise<void>;
  remove(id: string): Promise<void>;
  canChangeStatus(evaluation: Evaluation): boolean;
  canDelete(evaluation: Evaluation): boolean;
}

export function createManagerStore(repo: Repository, initialMemberId: string | null) {
  let memberId = initialMemberId;
  const store: EvaluationStore = {
    kind: "manager",
    editableProfile: true,
    showHistory: true,
    memberId: () => memberId,
    async load() {
      if (!memberId) return { profile: { name: "", role: "", templateId: null }, evaluations: [] };
      const member = await repo.getMember(memberId);
      if (!member) return null;
      const evaluations = await repo.listEvaluations(memberId);
      return {
        profile: { name: member.name, role: member.role, templateId: member.templateId },
        evaluations,
        member,
      };
    },
    async saveProfile(profile) {
      if (memberId) {
        await repo.updateMember(memberId, profile);
      } else {
        memberId = (await repo.createMember(profile)).id;
      }
    },
    async create(input) {
      if (!memberId) throw new Error("Save the member first");
      return repo.createEvaluation(memberId, "manager", input);
    },
    updateDraft: (id, input) => repo.updateEvaluationDraft(id, input),
    setStatus: (id, status) => repo.setEvaluationStatus(id, status),
    remove: (id) => repo.deleteEvaluation(id),
    // Self versions belong to the evaluated person; the owner can only hide them by deleting.
    canChangeStatus: (evaluation) => evaluation.kind !== "self",
    canDelete: () => true,
  };
  return store;
}

export function createSelfTokenStore(token: string): EvaluationStore {
  return {
    kind: "self",
    editableProfile: false,
    showHistory: true,
    memberId: () => null,
    async load() {
      const info = await tokenApi.resolveToken(token);
      if (!info || info.linkKind !== "self") return null;
      return {
        profile: { name: info.name, role: info.role, templateId: info.templateId },
        evaluations: await tokenApi.listSelfEvaluations(token),
      };
    },
    async saveProfile() {},
    create: (input) => tokenApi.saveSelfEvaluation(token, input),
    updateDraft: (id, input) => tokenApi.updateSelfEvaluationDraft(token, id, input),
    setStatus: (id, status) => tokenApi.setSelfEvaluationStatus(token, id, status),
    remove: (id) => tokenApi.deleteSelfEvaluation(token, id),
    canChangeStatus: () => true,
    canDelete: () => true,
  };
}

export function createPeerTokenStore(token: string): EvaluationStore {
  return {
    kind: "peer",
    editableProfile: false,
    showHistory: false,
    memberId: () => null,
    async load() {
      const info = await tokenApi.resolveToken(token);
      if (!info || info.linkKind !== "peer") return null;
      return {
        profile: { name: info.name, role: info.role, templateId: info.templateId },
        evaluations: [],
      };
    },
    async saveProfile() {},
    async create(input) {
      await tokenApi.submitPeerEvaluation(token, input);
      return {
        ...input,
        id: newId(),
        memberId: "",
        kind: "peer",
        createdAt: new Date().toISOString(),
      };
    },
    async setStatus() {},
    async remove() {},
    canChangeStatus: () => false,
    canDelete: () => false,
  };
}

export const SELF_STORAGE_KEY = "self-assessment-data";
const SELF_STORAGE_VERSION = 2;
const LOCAL_SELF_ID = "local-self";

type LocalSelfData = MemberProfile & { evaluations: Evaluation[] };

const isLocalSelfData = (value: unknown): value is LocalSelfData =>
  isRecord(value) &&
  typeof value["name"] === "string" &&
  typeof value["role"] === "string" &&
  Array.isArray(value["evaluations"]) &&
  value["evaluations"].every(isEvaluation);

function loadLocalSelf(): LocalSelfData {
  return (
    loadFromStorage<LocalSelfData>(SELF_STORAGE_KEY, isLocalSelfData, SELF_STORAGE_VERSION) ?? {
      name: "",
      role: "",
      templateId: null,
      evaluations: [],
    }
  );
}

function updateLocalSelf(mutator: (data: LocalSelfData) => LocalSelfData) {
  saveToStorage(SELF_STORAGE_KEY, mutator(loadLocalSelf()), SELF_STORAGE_VERSION);
}

/** Anonymous self-assessment kept on this device only. */
export function createLocalSelfStore(): EvaluationStore {
  const build = (input: EvaluationInput, createdAt?: string): Evaluation => ({
    ...input,
    id: newId(),
    memberId: LOCAL_SELF_ID,
    kind: "self",
    createdAt: createdAt ?? new Date().toISOString(),
  });
  return {
    kind: "self",
    editableProfile: true,
    showHistory: true,
    memberId: () => null,
    async load() {
      const { evaluations, ...profile } = loadLocalSelf();
      return { profile, evaluations };
    },
    async saveProfile(profile) {
      updateLocalSelf((data) => ({ ...data, ...profile }));
    },
    async create(input) {
      const existingDraft = loadLocalSelf().evaluations.some(
        (evaluation) => evaluation.kind === "self" && evaluation.status === "draft"
      );
      if (input.status === "draft" && existingDraft) throw new Error("A draft already exists");
      const evaluation = build(input);
      updateLocalSelf((data) => ({ ...data, evaluations: [...data.evaluations, evaluation] }));
      return evaluation;
    },
    async updateDraft(id, input) {
      let updated: Evaluation | undefined;
      updateLocalSelf((data) => ({
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
    async setStatus(id, status) {
      const data = loadLocalSelf();
      if (
        status === "draft" &&
        data.evaluations.some((evaluation) => evaluation.id !== id && evaluation.status === "draft")
      ) {
        throw new Error("A draft already exists");
      }
      updateLocalSelf((data) => ({
        ...data,
        evaluations: data.evaluations.map((e) => (e.id === id ? { ...e, status } : e)),
      }));
    },
    async remove(id) {
      updateLocalSelf((data) => ({
        ...data,
        evaluations: data.evaluations.filter((e) => e.id !== id),
      }));
    },
    canChangeStatus: () => true,
    canDelete: () => true,
  };
}
