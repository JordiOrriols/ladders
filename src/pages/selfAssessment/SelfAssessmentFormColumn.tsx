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

export function SelfAssessmentFormColumn(props: Props) {
  const { t } = props;
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
