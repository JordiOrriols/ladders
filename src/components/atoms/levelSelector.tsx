import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export const VERTICALS = ["Technology", "System", "People", "Process", "Influence"];
export const LEVELS = [1, 2, 3, 4, 5];

const VERTICALS_DATA = {
  Technology: [
    { level: 1, name: "Adopts" },
    { level: 2, name: "Specializes" },
    { level: 3, name: "Evangelizes" },
    { level: 4, name: "Masters" },
    { level: 5, name: "Creates" },
  ],
  System: [
    { level: 1, name: "Enhances" },
    { level: 2, name: "Designs" },
    { level: 3, name: "Owns" },
    { level: 4, name: "Evolves" },
    { level: 5, name: "Leads" },
  ],
  People: [
    { level: 1, name: "Learns" },
    { level: 2, name: "Supports" },
    { level: 3, name: "Mentors" },
    { level: 4, name: "Coordinates" },
    { level: 5, name: "Manages" },
  ],
  Process: [
    { level: 1, name: "Follows" },
    { level: 2, name: "Enforces" },
    { level: 3, name: "Challenges" },
    { level: 4, name: "Adjusts" },
    { level: 5, name: "Defines" },
  ],
  Influence: [
    { level: 1, name: "Subsystem" },
    { level: 2, name: "Team" },
    { level: 3, name: "Multiple Teams" },
    { level: 4, name: "Company" },
    { level: 5, name: "Community" },
  ],
};

const verticalColors = {
  Technology: "bg-indigo-500",
  System: "bg-cyan-500",
  People: "bg-amber-500",
  Process: "bg-emerald-500",
  Influence: "bg-pink-500",
};

const verticalBgColors = {
  Technology: "bg-indigo-50 border-indigo-200",
  System: "bg-cyan-50 border-cyan-200",
  People: "bg-amber-50 border-amber-200",
  Process: "bg-emerald-50 border-emerald-200",
  Influence: "bg-pink-50 border-pink-200",
};

export default function LevelSelector({
  vertical,
  currentLevel,
  goalLevel,
  selfAssessmentLevel = 0,
  onCurrentChange,
  onGoalChange,
  hideGoal = false,
  comment = "",
  onCommentChange,
  expanded,
  onToggle,
}) {
  const { t } = useTranslation();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const levels = VERTICALS_DATA[vertical];
  const currentLevelData = levels.find((l) => l.level === currentLevel);
  const goalLevelData = levels.find((l) => l.level === goalLevel);
  const selfAssessmentLevelData = levels.find((l) => l.level === selfAssessmentLevel);

  const isExpanded = expanded ?? internalExpanded;
  const toggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const handleHeaderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  const handleDivClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleCurrentButtonClick = (level: number) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      // Cycle: not set -> level -> level+0.5 -> not set
      if (currentLevel === level) {
        onCurrentChange(level + 0.5);
      } else if (currentLevel === level + 0.5) {
        onCurrentChange(0);
      } else {
        onCurrentChange(level);
      }
    };
  };

  const handleGoalButtonClick = (level: number) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      // Cycle: not set -> level -> level+0.5 -> not set
      if (goalLevel === level) {
        onGoalChange(level + 0.5);
      } else if (goalLevel === level + 0.5) {
        onGoalChange(0);
      } else {
        onGoalChange(level);
      }
    };
  };

  return (
    <div className={`rounded-xl border ${verticalBgColors[vertical]} overflow-hidden`}>
      <button
        type="button"
        onClick={handleHeaderClick}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        aria-expanded={isExpanded}
        aria-label={`${vertical} competency details. Current level: ${currentLevel || "not set"}. Goal level: ${goalLevel || "not set"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${verticalColors[vertical]}`} />
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">{vertical}</h3>
            <div className="text-xs space-y-0.5">
              <p className="text-slate-600">
                {currentLevelData
                  ? `Current: L${currentLevel} ${t(`levels.${vertical}.${Math.floor(currentLevel)}.name`)}`
                  : currentLevel === Math.floor(currentLevel) + 0.5
                    ? `Current: L${Math.floor(currentLevel)}+ ${t(`levels.${vertical}.${Math.floor(currentLevel)}.name`)}`
                    : "Current: Not set"}
              </p>
              {!hideGoal &&
                (goalLevelData || goalLevel === Math.floor(goalLevel) + 0.5) &&
                goalLevel > 0 && (
                  <p className="text-slate-600">
                    Goal: L{goalLevel}
                    {goalLevel !== Math.floor(goalLevel) && "+"}
                    {goalLevel !== Math.floor(goalLevel)
                      ? ""
                      : ` ${t(`levels.${vertical}.${Math.floor(goalLevel)}.name`)}`}
                    {goalLevel === Math.floor(goalLevel) &&
                      ` ${t(`levels.${vertical}.${goalLevel}.name`)}`}
                  </p>
                )}
              {selfAssessmentLevelData && selfAssessmentLevel > 0 && (
                <p className="text-purple-600">
                  Self: L{selfAssessmentLevel} {t(`levels.${vertical}.${selfAssessmentLevel}.name`)}
                </p>
              )}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2" onClick={handleDivClick}>
          {levels.map((level) => (
            <div
              key={level.level}
              className={`p-3 rounded-lg bg-white border transition-all ${
                currentLevel === level.level
                  ? "border-emerald-400 ring-1 ring-emerald-200"
                  : goalLevel === level.level
                    ? "border-amber-400 ring-1 ring-amber-200"
                    : selfAssessmentLevel === level.level
                      ? "border-purple-400 ring-1 ring-purple-200"
                      : "border-slate-200"
              }`}
              onClick={handleDivClick}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">L{level.level}</span>
                    <span className="font-medium text-slate-700">
                      {t(`levels.${vertical}.${level.level}.name`)}
                    </span>
                    {selfAssessmentLevel === level.level && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Self
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t(`levels.${vertical}.${level.level}.description`)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      currentLevel === level.level || currentLevel === level.level + 0.5
                        ? "default"
                        : "outline"
                    }
                    className={`h-7 px-2 text-xs ${
                      currentLevel === level.level || currentLevel === level.level + 0.5
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : ""
                    }`}
                    onClick={handleCurrentButtonClick(level.level)}
                  >
                    {currentLevel === level.level
                      ? "Current"
                      : currentLevel === level.level + 0.5
                        ? "Current +"
                        : "Current"}
                  </Button>
                  {!hideGoal && (
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        goalLevel === level.level || goalLevel === level.level + 0.5
                          ? "default"
                          : "outline"
                      }
                      className={`h-7 px-2 text-xs ${
                        goalLevel === level.level || goalLevel === level.level + 0.5
                          ? "bg-amber-500 hover:bg-amber-600"
                          : ""
                      }`}
                      onClick={handleGoalButtonClick(level.level)}
                    >
                      {goalLevel === level.level
                        ? "Goal"
                        : goalLevel === level.level + 0.5
                          ? "Goal +"
                          : "Goal"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="space-y-1 pt-2">
            <label className="text-xs font-semibold text-slate-700">Comments</label>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange?.(e.target.value)}
              placeholder="Add notes for this competency"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}
