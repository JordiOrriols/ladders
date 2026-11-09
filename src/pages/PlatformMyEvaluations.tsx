import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppSkeleton, ErrorState } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import {
  platformRepository,
  type PlatformMemberEvaluations,
  type PlatformMemberProfile,
} from "../data/platform";
import { PlatformLayout } from "../components/PlatformLayout";
import { EvaluationViewer } from "../components/organisms/EvaluationViewer";
import { localizeError } from "../utils/localizeError";

type View =
  | { kind: "directory"; members: PlatformMemberProfile[] }
  | { kind: "history"; data: PlatformMemberEvaluations };

export default function PlatformMyEvaluations() {
  const { member } = useParams();
  const { t } = useTranslation();
  const [view, setView] = useState<View>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setView(undefined);
    setError(undefined);
    const load = async (): Promise<View> =>
      member
        ? { kind: "history", data: await platformRepository.myEvaluations(member) }
        : { kind: "directory", members: await platformRepository.myMembers() };
    void load().then(
      (view) => {
        if (active) {
          setView(view);
          setLoading(false);
        }
      },
      (error: unknown) => {
        if (active) {
          setError(error);
          setLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [member, revision]);
  return (
    <PlatformLayout>
      <Link to="/">{t("platform.workspaces")}</Link>
      {member && <Link to="/me">{t("platform.myEvaluations")}</Link>}
      {view?.kind === "history" && (
        <>
          <Link to={`/me/members/${view.data.member.id}/self-evaluation`}>
            {t("selfAssessment.title")}
          </Link>
          <Link to={`/me/members/${view.data.member.id}/goals`}>{t("smartGoals.title")}</Link>
        </>
      )}
      <h2 className="text-2xl font-semibold">
        {t("platform.myEvaluations")}
        {view?.kind === "history" ? ` - ${view.data.member.name}` : ""}
      </h2>
      {loading ? (
        <AppSkeleton label={t("pageMessage.loading")} />
      ) : error ? (
        <ErrorState
          message={localizeError(error, t)}
          retryLabel={t("errors.retry")}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : view?.kind === "directory" ? (
        view.members.length ? (
          <ul className="space-y-3">
            {view.members.map((profile) => (
              <li key={profile.id}>
                <Link to={`/me/members/${profile.id}/evaluations`}>
                  {profile.workspace_name} - {profile.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("platform.memberUnavailable")}</p>
        )
      ) : view?.kind === "history" ? (
        <EvaluationViewer
          key={view.data.member.id}
          evaluations={view.data.evaluations}
          templateId={view.data.member.template_id}
        />
      ) : null}
    </PlatformLayout>
  );
}
