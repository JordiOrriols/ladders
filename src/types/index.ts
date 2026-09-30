export type LevelMap = Record<string, number>;
export type CommentMap = Record<string, string>;

export type EvaluationKind = "manager" | "self" | "peer";
export type EvaluationStatus = "draft" | "published";

/** Summary used by team views; levels come from the latest manager and self versions. */
export interface Member {
  id: string;
  name: string;
  role?: string;
  currentLevels: LevelMap;
  goalLevels: LevelMap;
  comments?: CommentMap;
  selfAssessmentLevels?: LevelMap;
  selfAssessmentComments?: CommentMap;
  templateId?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  templateId: string | null;
  selfToken: string | null;
  peerToken: string | null;
  viewToken: string | null;
  viewEnabled: boolean;
  createdAt: string;
}

export interface EvaluationInput {
  status: EvaluationStatus;
  authorName: string | null;
  currentLevels: LevelMap;
  goalLevels: LevelMap;
  comments: CommentMap;
}

export interface Evaluation extends EvaluationInput {
  id: string;
  memberId: string;
  kind: EvaluationKind;
  createdAt: string;
}

export type MemberProfile = {
  name: string;
  role: string;
  templateId: string | null;
};
