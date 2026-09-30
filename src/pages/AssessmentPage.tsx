import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, FileUp, Save, Send } from "lucide-react";
import { AssessmentFormColumn } from "@/components/organisms/AssessmentFormColumn";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
import { AssessmentPreview } from "@/components/organisms/AssessmentPreview";
import { ShareAction } from "@/components/molecules/ShareAction";
import { TemplatePanel } from "@/components/molecules/TemplatePanel";
import { VersionPanel } from "@/components/molecules/VersionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/data/DataProvider";
import {
  createLocalSelfStore,
  createManagerStore,
  createPeerTokenStore,
  createSelfTokenStore,
} from "@/data/evaluationStore";
import type { EvaluationStore } from "@/data/evaluationStore";
import { findTemplate } from "@/data/ladderTemplates";
import { buildRadarSeries } from "@/data/radarSeries";
import { isValidToken, resolveToken } from "@/data/tokenApi";
import { EditorValidationError, useEvaluationEditor } from "@/hooks/useEvaluationEditor";
import type { EvaluationStatus } from "@/types";
import { PageMessage } from "./PageMessage";

type StoreState = { store: EvaluationStore } | { error: "notFound" | "loading" };

function useRouteStore(): StoreState {
  const { id, token } = useParams();
  const { pathname } = useLocation();
  const { repository, loading } = useData();
  const [tokenStore, setTokenStore] = useState<StoreState>({ error: "loading" });

  const direct = useMemo<StoreState | null>(() => {
    if (token) return null;
    if (loading) return { error: "loading" };
    if (pathname.startsWith("/member")) {
      return { store: createManagerStore(repository, id && id !== "new" ? id : null) };
    }
    return { store: createLocalSelfStore() };
  }, [id, token, pathname, repository, loading]);

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
  const template = findTemplate(editor.profile.templateId);

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

  const handleSave = async (status: EvaluationStatus) => {
    try {
      await editor.save(status);
      if (!isPeer) alert(t(status === "published" ? "alerts.published" : "alerts.draftSaved"));
    } catch (error) {
      if (error instanceof EditorValidationError) {
        alert(t(`alerts.${error.message}`));
        return;
      }
      console.error("Failed to save evaluation", error);
      alert(t("alerts.saveFailed"));
    }
  };

  const handleImport = async (file: File) => {
    try {
      const count = await editor.importFile(file);
      alert(
        count > 0 ? t("alerts.importSelfAssessmentSuccess") : t("alerts.noSelfAssessmentFound")
      );
    } catch (error) {
      console.error("Failed to import", error);
      alert(
        t(
          isManager && !editor.memberId
            ? "alerts.saveMemberFirst"
            : "alerts.failedToImportSelfAssessment"
        )
      );
    }
  };

  const handleEnableView = async () => {
    if (!editor.memberId) return;
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
  const canUseFiles = !!store.importSelf;

  return (
    <div className="min-h-screen bg-slate-50">
      <AssessmentHeader
        {...(isManager ? { onBack: () => navigate("/") } : {})}
        title={t(`${mode}.title`, { name: editor.profile.name })}
        subtitle={t(`${mode}.subtitle`)}
        extraActions={
          isManager &&
          repository.kind === "remote" &&
          editor.member?.selfToken &&
          editor.member.peerToken &&
          editor.member.viewToken ? (
            <ShareAction member={editor.member} onEnableView={handleEnableView} />
          ) : null
        }
        actions={[
          ...(canUseFiles
            ? [
                {
                  type: "file" as const,
                  label: t(isManager ? "memberAssessment.importSelfAssessment" : "buttons.import"),
                  icon: <FileUp className="w-4 h-4" />,
                  onFile: handleImport,
                  eventId: `${mode}_import`,
                },
              ]
            : []),
          ...(canUseFiles && !isManager
            ? [
                {
                  type: "button" as const,
                  label: t("buttons.export"),
                  icon: <Download className="w-4 h-4" />,
                  onClick: editor.exportFile,
                  eventId: `${mode}_export`,
                },
              ]
            : []),
          ...(isPeer
            ? []
            : [
                {
                  type: "button" as const,
                  label: t("buttons.saveDraft"),
                  icon: <Save className="w-4 h-4" />,
                  onClick: () => void handleSave("draft"),
                  eventId: `${mode}_save_draft`,
                },
              ]),
          {
            type: "button" as const,
            variant: "default" as const,
            label: t(isPeer ? "buttons.submit" : "buttons.publish"),
            icon: <Send className="w-4 h-4" />,
            onClick: () => void handleSave("published"),
            eventId: `${mode}_publish`,
          },
        ]}
      />

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {editor.dirty && (
          <p className="mb-4 text-xs text-amber-700" role="status">
            {t("versions.unsaved")}
          </p>
        )}
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
                onNew={editor.startNewVersion}
                isNewSelected={editor.editingId === null}
                onSetStatus={(e, s) => void editor.setVersionStatus(e, s)}
                onDelete={(e) => void editor.deleteVersion(e)}
                canChangeStatus={store.canChangeStatus}
                canDelete={store.canDelete}
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
          >
            <TemplatePanel templateId={editor.profile.templateId} onChange={editor.setTemplateId} />
          </AssessmentPreview>
        </div>
      </main>
    </div>
  );
}

export function LegacyMemberRedirect() {
  const { search } = useLocation();
  const id = new URLSearchParams(search).get("id");
  return <Navigate to={`/member/${id ?? "new"}`} replace />;
}
