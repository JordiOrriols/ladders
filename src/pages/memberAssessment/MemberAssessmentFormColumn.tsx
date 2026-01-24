import React from "react";
import type { TFunction } from "i18next";
import LevelSelector from "@/components/atoms/levelSelector";
import { VERTICALS } from "@/components/atoms/levelSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LevelMap = Record<string, number>;
type CommentMap = Record<string, string>;

type Props = {
  name: string;
  role: string;
  currentLevels: LevelMap;
  goalLevels: LevelMap;
  selfAssessmentLevels: LevelMap;
  comments: CommentMap;
  expandedVertical: string | null;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onCurrentChange: (vertical: string, level: number) => void;
  onGoalChange: (vertical: string, level: number) => void;
  onCommentChange: (vertical: string, value: string) => void;
  onToggleVertical: (vertical: string) => void;
  t: TFunction<"translation">;
};

export function MemberAssessmentFormColumn({
  name,
  role,
  currentLevels,
  goalLevels,
  selfAssessmentLevels,
  comments,
  expandedVertical,
  onNameChange,
  onRoleChange,
  onCurrentChange,
  onGoalChange,
  onCommentChange,
  onToggleVertical,
  t,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {t("memberAssessment.personalInfo")}
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("forms.name", "Name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter member name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="role">{t("forms.role", "Role")}</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              placeholder="e.g. Senior Engineer"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {t("memberAssessment.competencies")}
        </h2>
        <div className="space-y-3">
          {VERTICALS.map((vertical) => (
            <LevelSelector
              key={vertical}
              vertical={vertical}
              currentLevel={currentLevels[vertical] || 0}
              goalLevel={goalLevels[vertical] || 0}
              selfAssessmentLevel={selfAssessmentLevels[vertical] || 0}
              comment={comments[vertical] || ""}
              onCurrentChange={(level) => onCurrentChange(vertical, level)}
              onGoalChange={(level) => onGoalChange(vertical, level)}
              onCommentChange={(value) => onCommentChange(vertical, value)}
              expanded={expandedVertical === vertical}
              onToggle={() => onToggleVertical(vertical)}
              hideGoal={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
