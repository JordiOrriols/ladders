import React from "react";
import { AssessmentFormColumn } from "@/components/organisms/AssessmentFormColumn";
import type { TFunction } from "i18next";

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

export function MemberAssessmentFormColumn(props: Props) {
  const { t } = props;

  return (
    <AssessmentFormColumn
      {...props}
      labels={{
        personalTitle: t("memberAssessment.personalInfo"),
        competenciesTitle: t("memberAssessment.competencies"),
        nameLabel: t("forms.name", "Name"),
        roleLabel: t("forms.role", "Role"),
        namePlaceholder: "Enter member name",
        rolePlaceholder: "e.g. Senior Engineer",
      }}
      hideGoal={false}
      selfAssessmentLevels={props.selfAssessmentLevels}
    />
  );
}
