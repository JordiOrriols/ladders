import React from "react";
import { useTranslation } from "react-i18next";
import { LevelSelector as LevelSelectorView, type LevelSelectorProps } from "@jordiorriols/ui";

export const VERTICALS = ["Technology", "System", "People", "Process", "Influence"];
export const LEVELS = [1, 2, 3, 4, 5];
const verticalColors: Record<string, string> = {
  Technology: "bg-indigo-500",
  System: "bg-cyan-500",
  People: "bg-amber-500",
  Process: "bg-emerald-500",
  Influence: "bg-pink-500",
};
const verticalBgColors: Record<string, string> = {
  Technology: "bg-indigo-50 border-indigo-200",
  System: "bg-cyan-50 border-cyan-200",
  People: "bg-amber-50 border-amber-200",
  Process: "bg-emerald-50 border-emerald-200",
  Influence: "bg-pink-50 border-pink-200",
};
export function LevelExample({ vertical, level }: { vertical: string; level: number }) {
  const { t } = useTranslation();
  const example = t(`levels.${vertical}.${level}.example`, { defaultValue: "" });
  if (!example) return null;
  return (
    <p className="text-xs text-slate-500 italic mt-1">
      {t("forms.example")}: {example}
    </p>
  );
}

type Props = Pick<
  LevelSelectorProps,
  | "currentLevel"
  | "goalLevel"
  | "selfAssessmentLevel"
  | "onCurrentChange"
  | "onGoalChange"
  | "hideGoal"
  | "comment"
  | "onCommentChange"
  | "expanded"
  | "onToggle"
> & { vertical: string };

export default function LevelSelector({
  vertical,
  currentLevel,
  goalLevel,
  selfAssessmentLevel = 0,
  hideGoal = false,
  ...props
}: Props) {
  const { t } = useTranslation();
  const accentClassName = verticalColors[vertical];
  const className = verticalBgColors[vertical];
  if (!accentClassName || !className) throw new Error(`Unknown assessment vertical: ${vertical}`);
  const currentLevelData = LEVELS.includes(currentLevel);
  const goalLevelData = LEVELS.includes(goalLevel);
  const selfAssessmentLevelData = LEVELS.includes(selfAssessmentLevel);
  return (
    <LevelSelectorView
      {...props}
      id={vertical}
      title={vertical}
      currentLevel={currentLevel}
      goalLevel={goalLevel}
      selfAssessmentLevel={selfAssessmentLevel}
      hideGoal={hideGoal}
      accentClassName={accentClassName}
      className={className}
      ariaLabel={`${vertical} competency details. Current level: ${currentLevel || "not set"}. Goal level: ${goalLevel || "not set"}`}
      options={LEVELS.map((level) => ({
        value: level,
        name: t(`levels.${vertical}.${level}.name`),
        description: t(`levels.${vertical}.${level}.description`),
        example: <LevelExample vertical={vertical} level={level} />,
      }))}
      labels={{
        current: t("buttons.current"),
        currentPlus: t("buttons.currentPlus"),
        goal: t("buttons.goal"),
        goalPlus: t("buttons.goalPlus"),
        self: "Self",
        comments: t("forms.comments"),
        commentsPlaceholder: t("forms.commentsPlaceholder"),
      }}
      summary={
        <>
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
        </>
      }
    />
  );
}
