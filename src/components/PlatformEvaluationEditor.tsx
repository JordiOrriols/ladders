import React, { useMemo } from "react";
import { AppSkeleton, Button, ErrorState } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { createPlatformEvaluationStore } from "../data/platformEvaluationStore";
import { useEvaluationEditor } from "../hooks/useEvaluationEditor";
import { AssessmentFormColumn } from "./organisms/AssessmentFormColumn";
import { AssessmentPreview } from "./organisms/AssessmentPreview";
import { CommentVisibilityPanel } from "./organisms/CommentVisibilityPanel";
import { VersionPanel } from "./molecules/VersionPanel";
import { localizeError } from "../utils/localizeError";
import { buildRadarSeries, comparisonColor, evaluationAuthor } from "../data/radarSeries";
import { findTemplate } from "../data/ladderTemplates";
import { versionLabel } from "../data/evaluations";
import { CommentGroups } from "./molecules/CommentGroups";
import { TemplatePanel } from "./molecules/TemplatePanel";
import { SERIES_COLORS } from "./atoms/radarChart";

export function PlatformEvaluationEditor({
  workspace,
  member,
}: {
  workspace: string;
  member: string;
}) {
  const { t, i18n } = useTranslation();
  const store = useMemo(
    () => createPlatformEvaluationStore(workspace, member),
    [workspace, member]
  );
  const editor = useEvaluationEditor(store);
  const action = useAsyncAction();
  const template = findTemplate(editor.profile.templateId);
  const series = useMemo(
    () =>
      buildRadarSeries({
        primary: { currentLevels: editor.form.currentLevels, goalLevels: editor.form.goalLevels },
        compare: editor.compare,
        all: editor.evaluations,
        template,
        t,
        locale: i18n.language,
      }),
    [editor.form, editor.compare, editor.evaluations, template, t, i18n.language]
  );
  if (editor.loadState === "loading") return <AppSkeleton label={t("pageMessage.loading")} />;
  if (editor.loadState !== "ready")
    return (
      <ErrorState
        message={t("errors.generic")}
        retryLabel={t("errors.retry")}
        onRetry={() => void editor.reload()}
      />
    );
  return (
    <div className="space-y-6">
      <VersionPanel
        evaluations={editor.evaluations}
        selectedId={editor.editingId}
        compareIds={editor.compareIds}
        onSelect={editor.selectVersion}
        onToggleCompare={editor.toggleCompare}
        canChangeStatus={store.canChangeStatus}
        onChangeStatus={editor.changeVersionStatus}
      />
      <fieldset disabled={editor.saving || action.busy}>
        <AssessmentFormColumn
          name={editor.profile.name}
          role={editor.profile.role}
          readOnlyProfile
          currentLevels={editor.form.currentLevels}
          goalLevels={editor.form.goalLevels}
          comments={editor.form.comments}
          expandedVertical={editor.expandedVertical}
          onNameChange={editor.setName}
          onRoleChange={editor.setRole}
          onCurrentChange={editor.handleCurrentChange}
          onGoalChange={editor.handleGoalChange}
          onCommentChange={editor.handleCommentChange}
          onToggleVertical={editor.toggleVertical}
          labels={{
            personalTitle: t("platform.profile"),
            competenciesTitle: t("memberAssessment.competencyLevels"),
            nameLabel: t("forms.name"),
            roleLabel: t("forms.role"),
            namePlaceholder: t("forms.memberNamePlaceholder"),
            rolePlaceholder: t("forms.rolePlaceholder"),
          }}
        />
      </fieldset>
      {editor.autosaveState !== "idle" && (
        <p role="status" data-testid="evaluation-autosave">
          {t(`autosave.${editor.autosaveState}`)}
        </p>
      )}
      {editor.autosaveState === "error" && <p role="alert">{t("errors.generic")}</p>}
      <Button
        data-testid="manager-evaluation-publish"
        disabled={!editor.canPublish || action.busy}
        onClick={() => void action.run(() => editor.save("published"))}
      >
        {t("buttons.publish")}
      </Button>
      {action.error && <p role="alert">{localizeError(action.error, t)}</p>}
      <div>
        <AssessmentPreview
          title={t("forms.preview")}
          radar={{ series }}
          metrics={[
            {
              label: t("series.current"),
              value: editor.currentAverage.toFixed(1),
              tone: "current",
            },
            { label: t("series.goal"), value: editor.goalAverage.toFixed(1), tone: "goal" },
          ]}
          verticalStats={editor.verticalStats}
          labels={{
            sectionTitle: t("memberAssessment.competencyLevels"),
            currentLabel: t("buttons.current"),
            goalLabel: t("buttons.goal"),
          }}
          comments={
            <CommentGroups
              groups={[
                {
                  id: editor.editingId ?? "draft",
                  label: t("versions.kind.manager"),
                  color: SERIES_COLORS.current,
                  comments: editor.form.comments,
                },
                ...editor.compare.map((evaluation) => ({
                  id: evaluation.id,
                  label: `${evaluationAuthor(evaluation, t)} · ${versionLabel(evaluation, editor.evaluations, i18n.language)}`,
                  color: comparisonColor(evaluation),
                  comments: evaluation.comments,
                })),
              ]}
            />
          }
        >
          <TemplatePanel templateId={editor.profile.templateId} />
        </AssessmentPreview>
      </div>
      <CommentVisibilityPanel
        evaluations={editor.evaluations}
        disabled={editor.autosaveState === "saving"}
        onChange={editor.setCommentVisibility}
      />
    </div>
  );
}
