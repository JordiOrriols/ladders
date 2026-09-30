import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import RadarChart from "@/components/atoms/radarChart";
import { SERIES_COLORS } from "@/components/atoms/radarChart";
import { VERTICALS } from "@/components/atoms/levelSelector";
import { CompetencyDetailsCard } from "@/components/molecules/CompetencyDetailsCard";
import { CommentGroups } from "@/components/molecules/CommentGroups";
import { TemplatePanel } from "@/components/molecules/TemplatePanel";
import { VersionPanel } from "@/components/molecules/VersionPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { latestOf, versionLabel } from "@/data/evaluations";
import { findTemplate } from "@/data/ladderTemplates";
import { buildRadarSeries, comparisonColor, evaluationAuthor } from "@/data/radarSeries";
import { useVersionSelection } from "@/hooks/useVersionSelection";
import type { Evaluation } from "@/types";

type Props = {
  evaluations: Evaluation[];
  templateId: string | null;
  showVersionPanel?: boolean;
};

/** Read-only history browser: version side panel, radar with overlays and level details. */
export function EvaluationViewer({ evaluations, templateId, showVersionPanel = true }: Props) {
  const { t, i18n } = useTranslation();
  const { sorted, selected, select, compare, compareIds, toggleCompare } = useVersionSelection(
    evaluations,
    "manager"
  );
  const template = findTemplate(templateId);
  const self = selected?.kind === "self" ? undefined : latestOf(sorted, "self", true);

  const series = useMemo(
    () =>
      buildRadarSeries({
        primary: selected
          ? {
              currentLevels: selected.currentLevels,
              goalLevels: selected.goalLevels,
              hideGoal: selected.kind !== "manager",
            }
          : undefined,
        compare,
        all: sorted,
        template,
        t,
        locale: i18n.language,
      }),
    [selected, compare, sorted, template, t, i18n.language]
  );
  const commentGroups = [
    ...(selected
      ? [
          {
            id: selected.id,
            label: `${evaluationAuthor(selected, t)} · ${versionLabel(
              selected,
              sorted,
              i18n.language
            )}`,
            color: SERIES_COLORS.current,
            comments: selected.comments,
          },
        ]
      : []),
    ...compare.map((evaluation) => ({
      id: evaluation.id,
      label: `${evaluationAuthor(evaluation, t)} · ${versionLabel(
        evaluation,
        sorted,
        i18n.language
      )}`,
      color: comparisonColor(evaluation),
      comments: evaluation.comments,
    })),
  ];

  return (
    <div
      className={showVersionPanel ? "grid gap-6 md:grid-cols-[220px_1fr]" : "grid gap-6"}
      data-testid="evaluation-viewer"
    >
      {showVersionPanel && (
        <VersionPanel
          evaluations={sorted}
          selectedId={selected?.id ?? null}
          compareIds={compareIds}
          onSelect={select}
          onToggleCompare={toggleCompare}
        />
      )}
      <div className="space-y-6 min-w-0">
        {selected && (
          <p className="text-sm text-slate-500 text-center capitalize">
            {evaluationAuthor(selected, t)} · {versionLabel(selected, sorted, i18n.language)}
          </p>
        )}
        <div className="flex justify-center">
          <ErrorBoundary componentName="RadarChart">
            <RadarChart series={series} size={350} />
          </ErrorBoundary>
        </div>
        <TemplatePanel templateId={templateId} />
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">{t("memberAssessment.competencyLevels")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {VERTICALS.map((vertical) => (
              <CompetencyDetailsCard
                key={vertical}
                vertical={vertical}
                currentLevel={selected?.currentLevels[vertical] || 0}
                goalLevel={selected?.kind === "manager" ? selected.goalLevels[vertical] || 0 : 0}
                selfAssessmentLevel={self?.currentLevels[vertical] || 0}
                expectedLevel={template?.levels[vertical] || 0}
                {...(template ? { expectedLabel: template.id } : {})}
              />
            ))}
          </div>
        </div>
        <CommentGroups groups={commentGroups} />
      </div>
    </div>
  );
}
