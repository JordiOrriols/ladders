import React from "react";
import { useTranslation } from "react-i18next";
import { VERTICALS } from "@/components/atoms/levelSelector";
import type { CommentMap } from "@/types";

export type CommentGroup = {
  id: string;
  label: string;
  color: string;
  comments: CommentMap;
};

export function CommentGroups({ groups }: { groups: CommentGroup[] }) {
  const { t } = useTranslation();
  const verticals = VERTICALS.filter((vertical) =>
    groups.some((group) => group.comments[vertical]?.trim())
  );

  if (verticals.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="comment-groups">
      <h3 className="text-sm font-semibold text-slate-700">{t("comments.title")}</h3>
      {verticals.map((vertical) => (
        <div key={vertical} className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600">{vertical}</h4>
          {groups.map((group) => {
            const comment = group.comments[vertical]?.trim();
            if (!comment) return null;
            return (
              <div
                key={`${vertical}-${group.id}`}
                className="rounded-r-md border-l-2 bg-slate-50 px-3 py-2"
                style={{ borderLeftColor: group.color }}
              >
                <p className="text-[11px] font-medium text-slate-500">{group.label}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comment}</p>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
