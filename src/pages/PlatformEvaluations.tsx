import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppSkeleton, ErrorState } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import { platformRepository, type PlatformRoster } from "../data/platform";
import type { Evaluation } from "../types";
import { PlatformLayout } from "../components/PlatformLayout";
import { EvaluationViewer } from "../components/organisms/EvaluationViewer";
import { localizeError } from "../utils/localizeError";

export default function PlatformEvaluations() {
  const { workspace, member } = useParams();
  const { t } = useTranslation();
  const [data, setData] = useState<{
    member: PlatformRoster["members"][number];
    evaluations: Evaluation[];
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
      const [roster, evaluations] = await Promise.all([
        platformRepository.teams(workspace),
        platformRepository.evaluations(workspace, member),
      ]);
      const profile = roster.members.find((profile) => profile.id === member);
      if (!profile) throw new Error("Member unavailable in this workspace");
      return { member: profile, evaluations };
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
        <EvaluationViewer evaluations={data.evaluations} templateId={data.member.template_id} />
      ) : null}
    </PlatformLayout>
  );
}
