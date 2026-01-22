export interface Member {
  id: string;
  name: string;
  role?: string;
  currentLevels: Record<string, number>;
  goalLevels: Record<string, number>;
   comments?: Record<string, string>;
  selfAssessmentLevels?: Record<string, number>;
   selfAssessmentComments?: Record<string, string>;
}
