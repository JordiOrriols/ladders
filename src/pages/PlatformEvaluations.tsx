import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppSkeleton, ErrorState } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import { platformRepository, type PlatformRoster } from "../data/platform";
import type { Evaluation } from "../types";
import { PlatformLayout } from "../components/PlatformLayout";
import { EvaluationViewer } from "../components/organisms/EvaluationViewer";
import { CommentVisibilityPanel } from "../components/organisms/CommentVisibilityPanel";
import { localizeError } from "../utils/localizeError";

export default function PlatformEvaluations() {
  const { workspace, member } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState<{
    member: PlatformRoster["members"][number];
    evaluations: Evaluation[];
    editable: boolean;
  }>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(undefined);
    setError(undefined);
    const load = async () => {
      if (!workspace || !member) throw new Error("Member unavailable in this workspace");
      const [roster, evaluations, directory] = await Promise.all([
        platformRepository.teams(workspace),
        platformRepository.evaluations(workspace, member),
        platformRepository.workspaces(),
      ]);
      const profile = roster.members.find((profile) => profile.id === member);
      const access = directory.find((item) => item.id === workspace);
      if (!profile || !access) throw new Error("Member unavailable in this workspace");
      return { member: profile, evaluations, editable: access.role !== "viewer" };
    };
    void load().then(
      (data) => {
        if (active) {
          setData(data);
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
  }, [workspace, member, revision]);
  return (
    <PlatformLayout>
      <Link to="/">{t("platform.workspaces")}</Link>
      {workspace && <Link to={`/workspaces/${workspace}/teams`}>{t("platform.teams")}</Link>}
      {workspace && member && (
        <Link to={`/workspaces/${workspace}/members/${member}`}>{t("platform.profile")}</Link>
      )}
      <h2 className="text-2xl font-semibold">
        {t("versions.title")}
        {data ? ` - ${data.member.name}` : ""}
      </h2>
      {loading ? (
        <AppSkeleton label={t("pageMessage.loading")} />
      ) : error ? (
        <ErrorState
          message={localizeError(error, t)}
          retryLabel={t("errors.retry")}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : data ? (
        <>
          <EvaluationViewer evaluations={data.evaluations} templateId={data.member.template_id} />
          {data.editable && (
            <CommentVisibilityPanel
              evaluations={data.evaluations}
              onChange={async (id, category, visible) => {
                if (!workspace || !member) throw new Error("Member unavailable in this workspace");
                const evaluations = await platformRepository.setCommentVisibility(
                  workspace,
                  member,
                  id,
                  category,
                  visible
                );
                setData((data) => (data?.member.id === member ? { ...data, evaluations } : data));
              }}
            />
          )}
        </>
      ) : null}
    </PlatformLayout>
  );
}
