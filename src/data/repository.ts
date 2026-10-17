import type {
  Evaluation,
  LinkedMember,
  MemberInvite,
  EvaluationInput,
  EvaluationKind,
  EvaluationStatus,
  MemberProfile,
  SmartGoal,
  SmartGoalInput,
  Team,
  TeamAccess,
  TeamMember,
} from "@/types";

export type MemberPatch = Partial<MemberProfile> & { viewEnabled?: boolean };

export interface Repository {
  readonly kind: "remote";
  listTeams(): Promise<Team[]>;
  /** The teams of one workspace; their access is the caller's Ladders access to it. */
  listWorkspaceTeams(workspaceId: string, access: TeamAccess): Promise<Team[]>;
  createTeam(name: string, workspaceId: string): Promise<Team>;
  updateTeam(id: string, name: string): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  moveMember(memberId: string, teamId: string): Promise<TeamMember>;
  listGoals(memberId: string): Promise<SmartGoal[]>;
  createGoal(memberId: string, input: SmartGoalInput): Promise<SmartGoal>;
  updateGoal(id: string, input: SmartGoalInput): Promise<SmartGoal>;
  deleteGoal(id: string): Promise<void>;
  appendGoalComment(id: string, text: string): Promise<SmartGoal>;
  listMembers(teamId?: string): Promise<TeamMember[]>;
  getMember(id: string): Promise<TeamMember | null>;
  createMember(profile: MemberProfile, teamId?: string): Promise<TeamMember>;
  updateMember(id: string, patch: MemberPatch): Promise<TeamMember>;
  deleteMember(id: string): Promise<void>;
  /** All evaluations visible to the owner, optionally scoped to one member. */
  listEvaluations(memberId?: string): Promise<Evaluation[]>;
  createEvaluation(
    memberId: string,
    kind: EvaluationKind,
    input: EvaluationInput,
    createdAt?: string
  ): Promise<Evaluation>;
  updateEvaluationDraft(id: string, input: EvaluationInput): Promise<Evaluation>;
  setEvaluationStatus(id: string, status: EvaluationStatus): Promise<void>;
  setCommentVisibility(id: string, category: string, visible: boolean): Promise<Evaluation>;
  deleteEvaluation(id: string): Promise<void>;
  /** The member the signed-in account is linked to in a workspace. */
  myMember(workspaceId: string): Promise<LinkedMember | null>;
  /** A one-time token the person opens, signed in, to link their account to the member. */
  createMemberInvite(memberId: string): Promise<string>;
  unlinkMember(memberId: string): Promise<void>;
  previewMemberInvite(token: string): Promise<MemberInvite>;
  claimMemberInvite(token: string): Promise<{ memberId: string; workspaceId: string }>;
}
