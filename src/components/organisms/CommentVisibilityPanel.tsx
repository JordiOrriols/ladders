import React from "react";
import { Button } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import type { Evaluation } from "@/types";
import { versionLabel } from "@/data/evaluations";
import { comparisonColor, evaluationAuthor } from "@/data/radarSeries";
import { localizeError } from "@/utils/localizeError";
import { CommentGroups } from "../molecules/CommentGroups";

export function CommentVisibilityPanel({
  evaluations,
  disabled = false,
  onChange,
}: {
  evaluations: Evaluation[];
  disabled?: boolean;
  onChange: (id: string, category: string, visible: boolean) => Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const action = useAsyncAction();
  return (
    <section
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
      aria-label={t("comments.visibilityTitle")}
    >
      <h2 className="font-semibold text-slate-800">{t("comments.visibilityTitle")}</h2>
      <p className="text-sm text-slate-500 mb-4">{t("comments.visibilityDescription")}</p>
      <CommentGroups
        groups={evaluations.map((evaluation) => ({
          id: evaluation.id,
          label: `${evaluationAuthor(evaluation, t)} · ${versionLabel(evaluation, evaluations, i18n.language)}`,
          color: comparisonColor(evaluation),
          comments: evaluation.comments,
        }))}
        commentAction={(group, category) => {
          const evaluation = evaluations.find((item) => item.id === group.id);
          if (!evaluation) return null;
          const visible = evaluation.commentVisibility?.[category] ?? evaluation.kind !== "peer";
          return (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">
                {t(visible ? "comments.visible" : "comments.hidden")}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || action.busy}
                data-testid={`comment-visibility-${evaluation.id}-${category}`}
                aria-label={`${t(visible ? "comments.hide" : "comments.show")}: ${group.label} · ${category}`}
                onClick={() => void action.run(() => onChange(evaluation.id, category, !visible))}
              >
                {t(visible ? "comments.hide" : "comments.show")}
              </Button>
            </div>
          );
        }}
      />
      {action.error && (
        <p role="alert" className="text-sm text-red-600">
          {localizeError(action.error, t)}
        </p>
      )}
    </section>
  );
}
