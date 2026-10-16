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
  const categories = VERTICALS.map((vertical) => t(`verticals.${vertical}`));
  return (
    <CommentGroupsView
      groups={groups.map((group) => ({
        ...group,
        comments: Object.fromEntries(
          VERTICALS.map((vertical, index) => [categories[index]!, group.comments[vertical] ?? ""])
        ),
      }))}
      categories={categories}
      title={t("comments.title")}
      {...(commentAction
        ? {
            commentAction: (group: CommentGroup, category: string) =>
              commentAction(
                groups.find((original) => original.id === group.id)!,
                VERTICALS[categories.indexOf(category)]!
              ),
          }
        : {})}
    />
  );
}
