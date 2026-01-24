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
  comments: CommentMap;
  expandedVertical: string | null;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onCurrentChange: (vertical: string, level: number) => void;
  onGoalChange: (vertical: string, level: number) => void;
  onCommentChange: (vertical: string, value: string) => void;
  onToggleVertical: (vertical: string) => void;
};

export function SelfAssessmentFormColumn(props: Props) {
  const { t } = useTranslation();
  const howToItems: string[] =
    (t("selfAssessment.howToUseItems", { returnObjects: true }) as unknown as string[]) || [];

  return (
    <AssessmentFormColumn
      {...props}
      labels={{
        personalTitle: t("selfAssessment.personalInfo") as string,
        competenciesTitle: t("selfAssessment.competencies") as string,
        nameLabel: t("forms.name", "Name") as string,
        roleLabel: t("forms.role", "Role") as string,
        namePlaceholder: "Enter your name",
        rolePlaceholder: "e.g. Senior Engineer",
      }}
      hideGoal
      howTo={{
        title: t("selfAssessment.howToUse") as string,
        items: howToItems,
      }}
    />
  );
}
