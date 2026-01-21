export interface Member {
  id: string;
  name: string;
  role?: string;
  currentLevels: Record<string, number>;
  goalLevels: Record<string, number>;
  selfAssessmentLevels?: Record<string, number>;
}
