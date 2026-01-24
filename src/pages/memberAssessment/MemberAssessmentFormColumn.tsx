import React from "react";
import { useTranslation } from "react-i18next";
import { AssessmentFormColumn } from "@/components/organisms/AssessmentFormColumn";

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
};

export function MemberAssessmentFormColumn(props: Props) {
  const { t } = useTranslation();

  return (
    <AssessmentFormColumn
      {...props}
      labels={{
        personalTitle: t("memberAssessment.personalInfo"),
        competenciesTitle: t("memberAssessment.competencies"),
        nameLabel: t("forms.name", "Name"),
        roleLabel: t("forms.role", "Role"),
        namePlaceholder: t("forms.memberNamePlaceholder"),
        rolePlaceholder: t("forms.rolePlaceholder"),
      }}
      hideGoal={false}
      selfAssessmentLevels={props.selfAssessmentLevels}
    />
  );
}
