import type { EvaluationStore } from "./evaluationStore";
import { platformRepository } from "./platform";

export function createPlatformPeerStore(assignment: string): EvaluationStore {
  let member: string | null = null;
  return {
    kind: "peer",
    authorNameRequired: false,
    editableProfile: false,
    showHistory: false,
    memberId: () => member,
    async load() {
      const target = (await platformRepository.myPeerAssignments()).find(
        (row) => row.id === assignment
      );
      if (!target || target.submitted) return null;
      member = target.member_id;
      return {
        profile: { name: target.name, role: target.role, templateId: target.template_id },
        evaluations: [],
      };
    },
    async saveProfile() {
      throw new Error("Reviewer profiles are read-only");
    },
    async create(input) {
      if (!member) throw new Error("Peer assignment unavailable");
      return platformRepository.submitPeer(assignment, member, input);
    },
    async setStatus() {
      throw new Error("Only managers can publish peer reviews");
    },
    async remove() {
      throw new Error("Reviewers cannot delete evaluations");
    },
    canDelete: () => false,
    canChangeStatus: () => false,
  };
}

export function createPlatformSelfEvaluationStore(member: string): EvaluationStore {
  return {
    kind: "self",
    editableProfile: false,
    showHistory: true,
    memberId: () => member,
    async load() {
      const { member: profile, evaluations } = await platformRepository.mySelfEvaluations(member);
      return {
        profile: {
          name: profile.name,
          role: profile.role,
          planningRole: profile.planning_role,
          templateId: profile.template_id,
        },
        evaluations,
      };
    },
    async saveProfile() {
      throw new Error("Employee profiles are read-only");
    },
    create: (input) => platformRepository.saveMyEvaluation(member, null, input),
    updateDraft: (id, input) => platformRepository.saveMyEvaluation(member, id, input),
    async setStatus(id, status) {
      if (status !== "published") throw new Error("Published evaluation content is immutable");
      await platformRepository.publishMyEvaluation(member, id);
    },
    async remove() {
      throw new Error("Employees cannot delete evaluations");
    },
    canDelete: () => false,
    canChangeStatus: () => false,
  };
}

export function createPlatformEvaluationStore(
  workspace: string,
  member: string,
  isOwner = false
): EvaluationStore {
  return {
    kind: "manager",
    editableProfile: false,
    showHistory: true,
    memberId: () => member,
    async load() {
      const [roster, evaluations] = await Promise.all([
        platformRepository.teams(workspace),
        platformRepository.evaluations(workspace, member),
      ]);
      const profile = roster.members.find((profile) => profile.id === member);
      if (!profile) return null;
      return {
        profile: {
          name: profile.name,
          role: profile.role,
          planningRole: profile.planning_role,
          templateId: profile.template_id,
        },
        evaluations,
      };
    },
    async saveProfile() {
      throw new Error("Use the member profile page to edit this profile");
    },
    create: (input) => platformRepository.saveEvaluation(workspace, member, null, input),
    updateDraft: (id, input) => platformRepository.saveEvaluation(workspace, member, id, input),
    async setStatus(id, status) {
      await platformRepository.setEvaluationStatus(workspace, member, id, status);
    },
    remove: (id) => platformRepository.deleteEvaluation(workspace, member, id),
    canDelete: (evaluation) =>
      isOwner && (evaluation.kind !== "self" || evaluation.status === "published"),
    canChangeStatus: (evaluation) => evaluation.kind !== "self",
    async setCommentVisibility(id, category, visible) {
      const evaluations = await platformRepository.setCommentVisibility(
        workspace,
        member,
        id,
        category,
        visible
      );
      const updated = evaluations.find((evaluation) => evaluation.id === id);
      if (!updated) throw new Error("Invalid API response");
      return updated;
    },
  };
}
