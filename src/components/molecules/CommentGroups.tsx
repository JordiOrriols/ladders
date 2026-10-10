import React, { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CommentGroups as CommentGroupsView, type CommentGroup } from "@jordiorriols/ui";
import { VERTICALS } from "@/components/atoms/levelSelector";

export type { CommentGroup } from "@jordiorriols/ui";
export function CommentGroups({
  groups,
  commentAction,
}: {
  groups: CommentGroup[];
  commentAction?: (group: CommentGroup, category: string) => ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <CommentGroupsView
      groups={groups}
      categories={VERTICALS}
      title={t("comments.title")}
      {...(commentAction ? { commentAction } : {})}
    />
  );
}
