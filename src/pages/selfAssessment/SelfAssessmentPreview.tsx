import React from "react";
import type { TFunction } from "i18next";
import RadarChart from "@/components/atoms/radarChart";

export type VerticalStat = {
  vertical: string;
  current: number;
  goal: number;
};

type Props = {
  name: string;
  t: TFunction<"translation">;
  currentAverage: number;
  verticalStats: VerticalStat[];
};

export function SelfAssessmentPreview({ name, t, currentAverage, verticalStats }: Props) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
          {t("selfAssessment.preview", { name: name || t("selfAssessment.yourAssessment") })}
        </h2>

        <div className="flex justify-center mb-8">
          <RadarChart
            currentLevels={verticalStats.reduce((acc, item) => ({ ...acc, [item.vertical]: item.current }), {})}
            goalLevels={verticalStats.reduce((acc, item) => ({ ...acc, [item.vertical]: item.goal }), {})}
            hideGoal={true}
            size={350}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs text-emerald-600 font-medium mb-1">
              {t("selfAssessment.currentAverage")}
            </p>
            <p className="text-2xl font-bold text-emerald-700">{currentAverage.toFixed(1)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            {t("selfAssessment.competencyLevels")}
          </h3>
          {verticalStats.map(({ vertical, current }) => (
            <div key={vertical} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{vertical}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 w-8">L{current || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
