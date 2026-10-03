import React from "react";
import { useTranslation } from "react-i18next";
import { CommentGroups as CommentGroupsView, type CommentGroup } from "@jordiorriols/ui";
import { VERTICALS } from "@/components/atoms/levelSelector";

export type { CommentGroup } from "@jordiorriols/ui";
export function CommentGroups({ groups }: { groups: CommentGroup[] }) {
  const { t } = useTranslation();
  return <CommentGroupsView groups={groups} categories={VERTICALS} title={t("comments.title")} />;
}
