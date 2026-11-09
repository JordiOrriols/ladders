import type { SmartGoal, SmartGoalInput, TeamAccess } from "../types";
import type { GoalStore } from "./goalStore";
import { platformRepository } from "./platform";

export function createPlatformMemberGoalStore(member: string): GoalStore {
  return {
    mode: "member",
    canDelete: async () => false,
    list: () => platformRepository.myGoals(member),
    async create() {
      throw new Error("Employees cannot create goals");
    },
    update: (id, input) => platformRepository.updateMyGoalProgress(member, id, input.progress),
    async remove() {
      throw new Error("Employees cannot delete goals");
    },
    appendComment: (id, text) => platformRepository.appendMyGoalComment(member, id, text),
  };
}

export function createPlatformGoalStore(
  workspace: string,
  member: string,
  role: TeamAccess
): GoalStore {
  return {
    mode: "manager",
    canDelete: async () => role === "owner",
    list: () => platformRepository.goals(workspace, member),
    create: (input: SmartGoalInput) => platformRepository.saveGoal(workspace, member, null, input),
    update: (id: string, input: SmartGoalInput) =>
      platformRepository.saveGoal(workspace, member, id, input),
    async remove(id: string) {
      if (role !== "owner") throw new Error("Only the workspace owner can delete goals");
      await platformRepository.deleteGoal(workspace, member, id);
    },
    appendComment: (id: string, text: string): Promise<SmartGoal> =>
      platformRepository.appendGoalComment(workspace, member, id, text),
  };
}
