import type { SmartGoal, SmartGoalInput } from "@/types";
import type { Repository } from "./repository";
import * as tokenApi from "./tokenApi";

/** Goal access scoped to one member, via the owner's repository or a personal link. */
export interface GoalStore {
  list(): Promise<SmartGoal[]>;
  create(input: SmartGoalInput): Promise<SmartGoal>;
  update(id: string, input: SmartGoalInput): Promise<SmartGoal>;
  remove(id: string): Promise<void>;
}

export const createRepositoryGoalStore = (repo: Repository, memberId: string): GoalStore => ({
  list: () => repo.listGoals(memberId),
  create: (input) => repo.createGoal(memberId, input),
  update: (id, input) => repo.updateGoal(id, input),
  remove: (id) => repo.deleteGoal(id),
});

export const createTokenGoalStore = (token: string): GoalStore => ({
  list: () => tokenApi.listTokenGoals(token),
  create: (input) => tokenApi.createTokenGoal(token, input),
  update: (id, input) => tokenApi.updateTokenGoal(token, id, input),
  remove: (id) => tokenApi.deleteTokenGoal(token, id),
});
