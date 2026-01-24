import React from "react";
import type { TFunction } from "i18next";
import RadarChart from "@/components/atoms/radarChart";

export type VerticalStat = {
  vertical: string;
  current: number;
  goal: number;
  self: number;
};

type Props = {
  name: string;
  t: TFunction<"translation">;
  currentAverage: number;
  goalAverage: number;
  verticalStats: VerticalStat[];
};

export function MemberAssessmentPreview({ name, t, currentAverage, goalAverage, verticalStats }: Props) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
          {t("memberAssessment.preview", { name: name || t("memberAssessment.member") })}
        </h2>

        <div className="flex justify-center mb-8">
          <RadarChart
            currentLevels={verticalStats.reduce((acc, item) => ({ ...acc, [item.vertical]: item.current }), {})}
            goalLevels={verticalStats.reduce((acc, item) => ({ ...acc, [item.vertical]: item.goal }), {})}
            selfAssessmentLevels={verticalStats.reduce((acc, item) => ({ ...acc, [item.vertical]: item.self }), {})}
            size={350}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs text-emerald-600 font-medium mb-1">
              {t("memberAssessment.currentAverage")}
            </p>
            <p className="text-2xl font-bold text-emerald-700">{currentAverage.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-600 font-medium mb-1">{t("memberAssessment.goalAverage")}</p>
            <p className="text-2xl font-bold text-amber-700">{goalAverage.toFixed(1)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            {t("memberAssessment.competencyLevels")}
          </h3>
          {verticalStats.map(({ vertical, current, goal, self }) => (
            <div key={vertical} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{vertical}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 w-8">L{current || 0}</span>
                </div>
                {self > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-slate-500 w-8">L{self}</span>
                  </div>
                )}
                {goal > 0 && goal !== current && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">→</span>
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-500 w-8">L{goal}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
