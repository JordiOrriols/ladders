import React from "react";
import type { ReactNode } from "react";
import RadarChart from "@/components/atoms/radarChart";

export type PreviewMetric = {
  label: string;
  value: string;
  tone: "current" | "goal" | "single";
};

export type PreviewVerticalStat = {
  vertical: string;
  current: number;
  goal?: number;
  self?: number;
};

type Props = {
  title: string;
  radar: {
    currentLevels: Record<string, number>;
    goalLevels?: Record<string, number>;
    selfAssessmentLevels?: Record<string, number>;
    hideGoal?: boolean;
    size?: number;
  };
  metrics: PreviewMetric[];
  verticalStats: PreviewVerticalStat[];
  labels: {
    sectionTitle: string;
    currentLabel: string;
    goalLabel?: string;
    selfLabel?: string;
    arrow?: ReactNode;
  };
};

const toneStyles: Record<PreviewMetric["tone"], string> = {
  current: "bg-emerald-50 border-emerald-200 text-emerald-700",
  goal: "bg-amber-50 border-amber-200 text-amber-700",
  single: "bg-slate-50 border-slate-200 text-slate-700",
};

export function AssessmentPreview({ title, radar, metrics, verticalStats, labels }: Props) {
  const arrow = labels.arrow ?? <span className="text-slate-400">→</span>;

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">{title}</h2>

        <div className="flex justify-center mb-8">
          <RadarChart
            currentLevels={radar.currentLevels}
            goalLevels={radar.goalLevels}
            selfAssessmentLevels={radar.selfAssessmentLevels}
            hideGoal={radar.hideGoal}
            size={radar.size ?? 350}
          />
        </div>

        <div className={`grid gap-4 ${metrics.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {metrics.map((metric, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${toneStyles[metric.tone]}`}>
              <p className="text-xs font-medium mb-1 text-current">{metric.label}</p>
              <p className="text-2xl font-bold text-current">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">{labels.sectionTitle}</h3>
          {verticalStats.map(({ vertical, current, goal, self }) => (
            <div key={vertical} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{vertical}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 w-10">
                    {labels.currentLabel}
                    {current || 0}
                  </span>
                </div>
                {typeof self === "number" && self > 0 && labels.selfLabel && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-slate-500 w-10">
                      {labels.selfLabel}
                      {self}
                    </span>
                  </div>
                )}
                {typeof goal === "number" && goal > 0 && goal !== current && labels.goalLabel && (
                  <div className="flex items-center gap-1">
                    {arrow}
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-500 w-10">
                      {labels.goalLabel}
                      {goal}
                    </span>
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
