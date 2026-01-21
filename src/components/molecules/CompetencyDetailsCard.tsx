import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <h4 className="font-medium text-slate-700 mb-2">{vertical}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600">
            {currentLevel > 0 ? `L${currentLevel}: ${t(`levels.${vertical}.${currentLevel}.name`)}` : "Not set"}
          </span>
        </div>
        {goalLevel > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600">
              Goal L{goalLevel}: {t(`levels.${vertical}.${goalLevel}.name`)}
            </span>
          </div>
        )}
        {selfAssessmentLevel > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-slate-600">
              Self L{selfAssessmentLevel}: {t(`levels.${vertical}.${selfAssessmentLevel}.name`)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
