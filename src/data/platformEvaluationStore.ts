import type { EvaluationStore } from "./evaluationStore";
import { platformRepository } from "./platform";

export function createPlatformEvaluationStore(workspace: string, member: string): EvaluationStore {
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
    async remove() {
      throw new Error("Evaluation deletion is not enabled");
    },
    canDelete: () => false,
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
