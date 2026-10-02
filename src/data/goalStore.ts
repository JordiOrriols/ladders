import type { SmartGoal, SmartGoalInput } from "@/types";
import type { Repository } from "./repository";
import * as tokenApi from "./tokenApi";

/** Goal access scoped to one member, via the owner's repository or a personal link. */
export interface GoalStore {
  canDelete(): Promise<boolean>;
  list(): Promise<SmartGoal[]>;
  create(input: SmartGoalInput): Promise<SmartGoal>;
  update(id: string, input: SmartGoalInput): Promise<SmartGoal>;
  remove(id: string): Promise<void>;
}

export const createRepositoryGoalStore = (repo: Repository, memberId: string): GoalStore => ({
  async canDelete() {
    const [member, teams] = await Promise.all([repo.getMember(memberId), repo.listTeams()]);
    return teams.find((team) => team.id === member?.teamId)?.access === "owner";
  },
  list: () => repo.listGoals(memberId),
  create: (input) => repo.createGoal(memberId, input),
  update: (id, input) => repo.updateGoal(id, input),
  async remove(id) {
    const [member, teams] = await Promise.all([repo.getMember(memberId), repo.listTeams()]);
    if (teams.find((team) => team.id === member?.teamId)?.access !== "owner") {
      throw new Error("Only the team owner can delete goals");
    }
    await repo.deleteGoal(id);
  },
});

export const createTokenGoalStore = (token: string): GoalStore => ({
  canDelete: async () => false,
  list: () => tokenApi.listTokenGoals(token),
  create: (input) => tokenApi.createTokenGoal(token, input),
  update: (id, input) => tokenApi.updateTokenGoal(token, id, input),
  async remove() {
    throw new Error("Personal links cannot delete goals");
  },
});
