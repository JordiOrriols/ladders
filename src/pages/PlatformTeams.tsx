import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppSkeleton, Button, ErrorState } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import {
  platformRepository,
  type PlatformRoster,
  type PlatformTeam,
  type PlatformWorkspace,
} from "../data/platform";
import { PlatformLayout } from "../components/PlatformLayout";
import { CreateTeamDialog } from "../components/molecules/CreateTeamDialog";

export default function PlatformTeams() {
  const { workspace } = useParams();
  const { t } = useTranslation();
  const [directory, setDirectory] = useState<PlatformWorkspace[]>();
  const [data, setData] = useState<PlatformRoster>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlatformTeam | "new" | null>(null);
  const load = useCallback(async () => {
    const [directory, data] = await Promise.all([
      platformRepository.workspaces(),
      workspace ? platformRepository.teams(workspace) : Promise.resolve(undefined),
    ]);
    return { directory, data };
  }, [workspace]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    setDirectory(undefined);
    setData(undefined);
    setEditing(null);
    void load().then(
      (result) => {
        if (active) {
          setDirectory(result.directory);
          setData(result.data);
          setLoading(false);
        }
      },
      (error: unknown) => {
        if (active) {
          setError(error instanceof Error ? error.message : t("errors.generic"));
          setLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [load, revision, t]);
  const access = directory?.find((item) => item.id === workspace);
  return (
    <PlatformLayout>
      {workspace && <Link to="/">{t("platform.workspaces")}</Link>}
      <h2 className="text-2xl font-semibold">{access?.name ?? t("platform.workspaces")}</h2>
      {loading ? (
        <AppSkeleton label={t("pageMessage.loading")} />
      ) : error ? (
        <ErrorState
          message={error}
          retryLabel={t("errors.retry")}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : !workspace ? (
        directory?.length ? (
          <ul className="space-y-3">
            {directory.map((item) => (
              <li key={item.id}>
                <Link to={`/workspaces/${item.id}/teams`}>{item.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("platform.noAccess")}</p>
        )
      ) : access && data ? (
        <div className="space-y-6">
          <p>{t("platform.migration")}</p>
          {access.role === "owner" && (
            <Button onClick={() => setEditing("new")}>{t("teams.create")}</Button>
          )}
          {data.teams.length === 0 && <p>{t("platform.emptyTeams")}</p>}
          {data.teams.map((team) => (
            <section key={team.id} className="panel space-y-3">
              <h3 className="text-xl font-semibold">{team.name}</h3>
              {access.role !== "viewer" && (
                <Button
                  aria-label={t("teams.renameAria", { name: team.name })}
                  onClick={() => setEditing(team)}
                >
                  {t("teams.rename")}
                </Button>
              )}
              <ul>
                {data.members
                  .filter((member) => member.team_id === team.id)
                  .map((member) => (
                    <li key={member.id}>
                      {member.name}
                      {member.role ? ` - ${member.role}` : ""}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p role="alert">{t("platform.noAccess")}</p>
      )}
      <CreateTeamDialog
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        {...(editing && editing !== "new" ? { initialName: editing.name } : {})}
        onCreate={async (name) => {
          if (!workspace || !editing) throw new Error(t("platform.noAccess"));
          await platformRepository.saveTeam(workspace, name, editing === "new" ? null : editing.id);
          setRevision((value) => value + 1);
        }}
      />
    </PlatformLayout>
  );
}
