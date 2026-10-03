import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, LoaderCircle, Send, TriangleAlert } from "lucide-react";
import { AssessmentFormColumn } from "@/components/organisms/AssessmentFormColumn";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
import { AssessmentPreview } from "@/components/organisms/AssessmentPreview";
import { SmartGoalsPanel } from "@/components/organisms/SmartGoalsPanel";
import { ShareAction } from "@/components/molecules/ShareAction";
import { CommentGroups } from "@/components/molecules/CommentGroups";
import { TemplatePanel } from "@/components/molecules/TemplatePanel";
import { VersionPanel } from "@/components/molecules/VersionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/data/DataProvider";
import {
  createManagerStore,
  createPeerTokenStore,
  createSelfTokenStore,
} from "@/data/evaluationStore";
import type { EvaluationStore } from "@/data/evaluationStore";
import { findTemplate } from "@/data/ladderTemplates";
import { versionLabel } from "@/data/evaluations";
import { buildRadarSeries, comparisonColor, evaluationAuthor } from "@/data/radarSeries";
import { SERIES_COLORS } from "@/components/atoms/radarChart";
import { isValidToken, resolveToken } from "@/data/tokenApi";
import { createRepositoryGoalStore, type GoalStore } from "@/data/goalStore";
import { EditorValidationError, useEvaluationEditor } from "@/hooks/useEvaluationEditor";
import { PageMessage } from "./PageMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StoreState = { store: EvaluationStore } | { error: "notFound" | "loading" };

function useRouteStore(): StoreState {
  const { id, token } = useParams();
  const { pathname } = useLocation();
  const { search } = useLocation();
  const { repository, loading } = useData();
  const [tokenStore, setTokenStore] = useState<StoreState>({ error: "loading" });

  const direct = useMemo<StoreState | null>(() => {
    if (token) return null;
    if (loading) return { error: "loading" };
    if (pathname.startsWith("/member")) {
      if (!repository) return { error: "notFound" };
      const teamId = new URLSearchParams(search).get("team") ?? undefined;
      return {
        store: createManagerStore(repository, id && id !== "new" ? id : null, teamId),
      };
    }
    return { error: "notFound" };
  }, [id, token, pathname, search, repository, loading]);

  useEffect(() => {
    if (!token) return;
    if (!isValidToken(token)) {
      setTokenStore({ error: "notFound" });
      return;
    }
    let active = true;
    resolveToken(token)
      .then((info) => {
        if (!active) return;
        if (info?.linkKind === "self") setTokenStore({ store: createSelfTokenStore(token) });
        else if (info?.linkKind === "peer") setTokenStore({ store: createPeerTokenStore(token) });
        else setTokenStore({ error: "notFound" });
      })
      .catch(() => active && setTokenStore({ error: "notFound" }));
    return () => {
      active = false;
    };
  }, [token]);

  return direct ?? tokenStore;
}

export default function AssessmentPage() {
  const state = useRouteStore();
  if ("error" in state) return <PageMessage kind={state.error} />;
  return <AssessmentEditor store={state.store} />;
}

function AssessmentEditor({ store }: { store: EvaluationStore }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { repository } = useData();
  const editor = useEvaluationEditor(store);
  const isManager = store.kind === "manager";
  const isPeer = store.kind === "peer";
  const hideGoal = !isManager;
  const template = isManager ? findTemplate(editor.profile.templateId) : undefined;

  const goalStore = useMemo<GoalStore | null>(() => {
    if (isManager) {
      return repository && editor.memberId
        ? createRepositoryGoalStore(repository, editor.memberId)
        : null;
    }
    return null;
  }, [isManager, repository, editor.memberId]);
  const showGoals = isManager;

  useEffect(() => {
    if (isManager && routeId === "new" && editor.memberId && editor.editingId) {
      navigate(`/member/${editor.memberId}`, { replace: true });
    }
  }, [isManager, routeId, editor.memberId, editor.editingId, navigate]);

  const series = useMemo(
    () =>
      buildRadarSeries({
        primary: {
          currentLevels: editor.form.currentLevels,
          goalLevels: editor.form.goalLevels,
          hideGoal,
        },
        compare: editor.compare,
        all: editor.evaluations,
        template,
        t,
        locale: i18n.language,
      }),
    [editor.form, editor.compare, editor.evaluations, hideGoal, template, t, i18n.language]
  );

  if (editor.loadState !== "ready") return <PageMessage kind={editor.loadState} />;

  const handleSave = async () => {
    try {
      await editor.save("published");
      if (!isPeer) alert(t("alerts.published"));
    } catch (error) {
      if (error instanceof EditorValidationError) {
        alert(t(`alerts.${error.message}`));
        return;
      }
      console.error("Failed to save evaluation", error);
      alert(t("alerts.saveFailed"));
    }
  };

  const handleEnableView = async () => {
    if (!editor.memberId || !repository) return;
    try {
      editor.setMember(await repository.updateMember(editor.memberId, { viewEnabled: true }));
    } catch (error) {
      console.error("Failed to update view link", error);
      throw error;
    }
  };

  if (isPeer && editor.submitted) {
    return (
      <PageMessage kind="thanks">
        <Button eventId="peer_submit_another" onClick={() => window.location.reload()}>
          {t("peerAssessment.another")}
        </Button>
      </PageMessage>
    );
  }

  const mode = isManager ? "memberAssessment" : isPeer ? "peerAssessment" : "selfAssessment";
  const howToItems = isManager
    ? []
    : ((t(`${mode}.howToUseItems`, { returnObjects: true }) as unknown as string[]) ?? []);
  const commentGroups = isManager
    ? [
        {
          id: "manager-current",
          label: t("versions.kind.manager"),
          color: SERIES_COLORS.current,
          comments: editor.form.comments,
        },
        ...editor.compare.map((evaluation) => ({
          id: evaluation.id,
          label: `${evaluationAuthor(evaluation, t)} · ${versionLabel(
            evaluation,
            editor.evaluations,
            i18n.language
          )}`,
          color: comparisonColor(evaluation),
          comments: evaluation.comments,
        })),
      ]
    : [];

  const autosaveStatus =
    !isPeer && editor.autosaveState !== "idle" ? (
      <span
        className={`hidden items-center gap-1 text-xs sm:inline-flex ${
          editor.autosaveState === "error" ? "text-red-600" : "text-slate-500"
        }`}
        role="status"
      >
        {editor.autosaveState === "saving" ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : editor.autosaveState === "error" ? (
          <TriangleAlert className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {t(`autosave.${editor.autosaveState}`)}
      </span>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AssessmentHeader
        {...(isManager ? { onBack: () => navigate("/") } : {})}
        title={t(`${mode}.title`, { name: editor.profile.name })}
        subtitle={t(`${mode}.subtitle`)}
        extraActions={
          <>
            {autosaveStatus}
            {isManager &&
            repository &&
            editor.member?.selfToken &&
            editor.member.peerToken &&
            editor.member.viewToken ? (
              <ShareAction member={editor.member} onEnableView={handleEnableView} />
            ) : null}
          </>
        }
        actions={[
          ...(isPeer
            ? [
                {
                  type: "button" as const,
                  variant: "default" as const,
                  label: t("buttons.submit"),
                  icon: <Send className="w-4 h-4" />,
                  disabled: editor.saving,
                  onClick: () => void handleSave(),
                  eventId: `${mode}_publish`,
                },
              ]
            : [
                {
                  type: "button" as const,
                  variant: "default" as const,
                  label: t("buttons.publish"),
                  icon: <Send className="w-4 h-4" />,
                  disabled: !editor.canPublish,
                  onClick: () => void handleSave(),
                  eventId: `${mode}_publish`,
                },
              ]),
        ]}
      />

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="evaluation" className="space-y-6">
          {showGoals && (
            <TabsList className="bg-white border border-slate-200" data-testid="assessment-tabs-list">
              <TabsTrigger value="evaluation" data-testid="assessment-tab-evaluation">
                {t("memberAssessment.evaluationTab")}
              </TabsTrigger>
              <TabsTrigger value="goals" data-testid="assessment-tab-goals">
                {t("smartGoals.tab")}
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="evaluation">
            <div
              className={`grid gap-6 ${
                store.showHistory || isManager ? "xl:grid-cols-[260px_1fr_1fr]" : "lg:grid-cols-2"
              }`}
            >
              {store.showHistory && (
                <div className="space-y-4">
                  <VersionPanel
                    evaluations={editor.evaluations}
                    selectedId={editor.editingId}
                    compareIds={editor.compareIds}
                    onSelect={editor.selectVersion}
                    onToggleCompare={editor.toggleCompare}
                    onDelete={(e) => void editor.deleteVersion(e)}
                    canDelete={store.canDelete}
                    canChangeStatus={store.canChangeStatus}
                    onChangeStatus={editor.changeVersionStatus}
                  />
                </div>
              )}

              <AssessmentFormColumn
                name={editor.profile.name}
                role={editor.profile.role}
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
                readOnlyProfile={!store.editableProfile}
                hideGoal={hideGoal}
                labels={{
                  personalTitle: t(`${mode}.personalInfo`),
                  competenciesTitle: t(`${mode}.competencies`),
                  nameLabel: t("forms.name"),
                  roleLabel: t("forms.role"),
                  namePlaceholder: t(
                    isManager ? "forms.memberNamePlaceholder" : "forms.namePlaceholder"
                  ),
                  rolePlaceholder: t("forms.rolePlaceholder"),
                }}
                {...(howToItems.length > 0
                  ? { howTo: { title: t("selfAssessment.howToUse"), items: howToItems } }
                  : {})}
                profileExtra={
                  isPeer ? (
                    <div>
                      <Label htmlFor="author-name">{t("peerAssessment.yourName")}</Label>
                      <Input
                        id="author-name"
                        value={editor.authorName}
                        required
                        maxLength={120}
                        onChange={(e) => editor.setAuthorName(e.target.value)}
                        placeholder={t("forms.namePlaceholder")}
                        className="mt-1"
                      />
                    </div>
                  ) : null
                }
              />

              <AssessmentPreview
                title={t(`${mode}.preview`, {
                  name: editor.profile.name || t("memberAssessment.member"),
                })}
                radar={{ series, size: 350 }}
                metrics={[
                  {
                    label: t("memberAssessment.currentAverage"),
                    value: editor.currentAverage.toFixed(1),
                    tone: "current",
                  },
                  ...(hideGoal
                    ? []
                    : [
                        {
                          label: t("memberAssessment.goalAverage"),
                          value: editor.goalAverage.toFixed(1),
                          tone: "goal" as const,
                        },
                      ]),
                ]}
                verticalStats={editor.verticalStats.map(({ vertical, current, goal }) =>
                  hideGoal ? { vertical, current } : { vertical, current, goal }
                )}
                labels={{
                  sectionTitle: t("memberAssessment.competencyLevels"),
                  currentLabel: "L",
                  goalLabel: "L",
                }}
                comments={isManager ? <CommentGroups groups={commentGroups} /> : null}
              >
                {isManager && (
                  <TemplatePanel
                    templateId={editor.profile.templateId}
                    onChange={editor.setTemplateId}
                  />
                )}
              </AssessmentPreview>
            </div>
          </TabsContent>
          {showGoals && (
            <TabsContent value="goals">
              <SmartGoalsPanel store={goalStore} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
