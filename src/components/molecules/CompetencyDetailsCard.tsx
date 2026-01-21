import React from "react";
import { VERTICALS_DATA } from "../atoms/levelSelector";

interface CompetencyDetailsProps {
  vertical: string;
  currentLevel: number;
  goalLevel: number;
  selfAssessmentLevel: number;
}

export function CompetencyDetailsCard({
  vertical,
  currentLevel,
  goalLevel,
  selfAssessmentLevel,
}: CompetencyDetailsProps) {
  const currentData = VERTICALS_DATA[vertical]?.find(
    (l) => l.level === currentLevel,
  );
  const goalData = VERTICALS_DATA[vertical]?.find((l) => l.level === goalLevel);
  const selfAssessmentData = VERTICALS_DATA[vertical]?.find(
    (l) => l.level === selfAssessmentLevel,
  );

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <h4 className="font-medium text-slate-700 mb-2">{vertical}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600">
            {currentData ? `L${currentLevel}: ${currentData.name}` : "Not set"}
          </span>
        </div>
        {goalData && goalLevel > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600">
              Goal L{goalLevel}: {goalData.name}
            </span>
          </div>
        )}
        {selfAssessmentData && selfAssessmentLevel > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-slate-600">
              Self L{selfAssessmentLevel}: {selfAssessmentData.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
