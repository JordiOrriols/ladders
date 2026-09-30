import type {
  Evaluation,
  EvaluationInput,
  EvaluationKind,
  EvaluationStatus,
  MemberProfile,
  TeamMember,
} from "@/types";

export type MemberPatch = Partial<MemberProfile> & { viewEnabled?: boolean };

export interface Repository {
  readonly kind: "remote";
  listMembers(): Promise<TeamMember[]>;
  getMember(id: string): Promise<TeamMember | null>;
  createMember(profile: MemberProfile): Promise<TeamMember>;
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
  deleteEvaluation(id: string): Promise<void>;
}
