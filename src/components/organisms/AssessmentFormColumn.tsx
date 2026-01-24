import React from "react";
import LevelSelector, { VERTICALS } from "@/components/atoms/levelSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LevelMap = Record<string, number>;
type CommentMap = Record<string, string>;

type Labels = {
  personalTitle: string;
  competenciesTitle: string;
  nameLabel: string;
  roleLabel: string;
  namePlaceholder: string;
  rolePlaceholder: string;
};

type HowTo = {
  title: string;
  items: string[];
};

type Props = {
  name: string;
  role: string;
  currentLevels: LevelMap;
  goalLevels: LevelMap;
  comments: CommentMap;
  expandedVertical: string | null;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onCurrentChange: (vertical: string, level: number) => void;
  onGoalChange: (vertical: string, level: number) => void;
  onCommentChange: (vertical: string, value: string) => void;
  onToggleVertical: (vertical: string) => void;
  labels: Labels;
  hideGoal?: boolean;
  selfAssessmentLevels?: LevelMap;
  howTo?: HowTo;
};

export function AssessmentFormColumn({
  name,
  role,
  currentLevels,
  goalLevels,
  comments,
  expandedVertical,
  onNameChange,
  onRoleChange,
  onCurrentChange,
  onGoalChange,
  onCommentChange,
  onToggleVertical,
  labels,
  hideGoal = false,
  selfAssessmentLevels,
  howTo,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.personalTitle}</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{labels.nameLabel}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={labels.namePlaceholder}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="role">{labels.roleLabel}</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              placeholder={labels.rolePlaceholder}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.competenciesTitle}</h2>
        <div className="space-y-3">
          {VERTICALS.map((vertical) => (
            <LevelSelector
              key={vertical}
              vertical={vertical}
              currentLevel={currentLevels[vertical] || 0}
              goalLevel={goalLevels[vertical] || 0}
              selfAssessmentLevel={selfAssessmentLevels?.[vertical] || 0}
              comment={comments[vertical] || ""}
              onCurrentChange={(level) => onCurrentChange(vertical, level)}
              onGoalChange={(level) => onGoalChange(vertical, level)}
              onCommentChange={(value) => onCommentChange(vertical, value)}
              expanded={expandedVertical === vertical}
              onToggle={() => onToggleVertical(vertical)}
              hideGoal={hideGoal}
            />
          ))}
        </div>
      </div>

      {howTo && howTo.items.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
          <h3 className="font-semibold text-indigo-900 mb-2">{howTo.title}</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            {howTo.items.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
