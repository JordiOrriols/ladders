import type {
  Evaluation,
  EvaluationInput,
  EvaluationKind,
  EvaluationStatus,
  MemberProfile,
  TeamMember,
} from "@/types";
import type { MemberPatch, Repository } from "../repository";

let sequence = 0;
const id = (prefix: string) => `${prefix}-${++sequence}`;

export function createInMemoryRepository(): Repository {
  let members: TeamMember[] = [];
  let evaluations: Evaluation[] = [];

  return {
    kind: "remote",
    async listMembers() {
      return members;
    },
    async getMember(memberId: string) {
      return members.find((member) => member.id === memberId) ?? null;
    },
    async createMember(profile: MemberProfile) {
      const member: TeamMember = {
        id: id("member"),
        ...profile,
        selfToken: id("self"),
        peerToken: id("peer"),
        viewToken: id("view"),
        viewEnabled: false,
        createdAt: new Date().toISOString(),
      };
      members = [...members, member];
      return member;
    },
    async updateMember(memberId: string, patch: MemberPatch) {
      const current = members.find((member) => member.id === memberId);
      if (!current) throw new Error("Member not found");
      const updated = { ...current, ...patch };
      members = members.map((member) => (member.id === memberId ? updated : member));
      return updated;
    },
    async deleteMember(memberId: string) {
      members = members.filter((member) => member.id !== memberId);
      evaluations = evaluations.filter((evaluation) => evaluation.memberId !== memberId);
    },
    async listEvaluations(memberId?: string) {
      return memberId
        ? evaluations.filter((evaluation) => evaluation.memberId === memberId)
        : evaluations;
    },
    async createEvaluation(
      memberId: string,
      kind: EvaluationKind,
      input: EvaluationInput,
      createdAt?: string
    ) {
      const evaluation: Evaluation = {
        ...input,
        id: id("evaluation"),
        memberId,
        kind,
        createdAt: createdAt ?? new Date().toISOString(),
      };
      evaluations = [...evaluations, evaluation];
      return evaluation;
    },
    async updateEvaluationDraft(evaluationId: string, input: EvaluationInput) {
      const current = evaluations.find((evaluation) => evaluation.id === evaluationId);
      if (!current) throw new Error("Evaluation not found");
      if (current.status !== "draft") throw new Error("Only drafts can be updated");
      const updated = { ...current, ...input, authorName: current.authorName };
      evaluations = evaluations.map((evaluation) =>
        evaluation.id === evaluationId ? updated : evaluation
      );
      return updated;
    },
    async setEvaluationStatus(evaluationId: string, status: EvaluationStatus) {
      evaluations = evaluations.map((evaluation) =>
        evaluation.id === evaluationId ? { ...evaluation, status } : evaluation
      );
    },
    async deleteEvaluation(evaluationId: string) {
      evaluations = evaluations.filter((evaluation) => evaluation.id !== evaluationId);
    },
  };
}
