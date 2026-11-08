import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { PlatformMemberProfile } from "../components/PlatformMemberProfile";
import { PlatformDeleteAction } from "../components/PlatformDeleteAction";

export default function PlatformTeams() {
  const { workspace, member: memberId, team: createTeam } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  }, [load, revision, t, memberId, createTeam]);
  const access = directory?.find((item) => item.id === workspace);
  const member = data?.members.find((item) => item.id === memberId);
  return (
    <PlatformLayout>
      {workspace && <Link to="/">{t("platform.workspaces")}</Link>}
      {workspace && (memberId || createTeam) && (
        <Link to={`/workspaces/${workspace}/teams`}>{t("platform.teams")}</Link>
      )}
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
        createTeam ? (
          workspace &&
          access.role !== "viewer" &&
          data.teams.some((team) => team.id === createTeam) ? (
            <PlatformMemberProfile
              key={`${workspace}:${createTeam}`}
              workspace={workspace}
              member={{
                id: "",
                team_id: createTeam,
                name: "",
                role: "",
                planning_role: null,
                template_id: null,
              }}
              editable
              createTeam={createTeam}
              onSaved={() => setRevision((value) => value + 1)}
              onCreated={(id) =>
                navigate(`/workspaces/${workspace}/members/${id}`, { replace: true })
              }
            />
          ) : (
            <p role="alert">{t("platform.noAccess")}</p>
          )
        ) : memberId ? (
          member && workspace ? (
            <PlatformMemberProfile
              key={`${workspace}:${member.id}:${revision}`}
              workspace={workspace}
              member={member}
              editable={access.role !== "viewer"}
              onSaved={() => setRevision((value) => value + 1)}
              {...(access.role === "owner"
                ? {
                    onDeleted: () => navigate(`/workspaces/${workspace}/teams`),
                  }
                : {})}
            />
          ) : (
            <p role="alert">{t("platform.memberUnavailable")}</p>
          )
        ) : (
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
                  <Link to={`/workspaces/${workspace}/teams/${team.id}/members/new`}>
                    {t("teams.addMemberTo", { name: team.name })}
                  </Link>
                )}
                {access.role !== "viewer" && (
                  <Button
                    aria-label={t("teams.renameAria", { name: team.name })}
                    onClick={() => setEditing(team)}
                  >
                    {t("teams.rename")}
                  </Button>
                )}
                {access.role === "owner" && workspace && (
                  <PlatformDeleteAction
                    kind="team"
                    name={team.name}
                    disabled={data.members.some((member) => member.team_id === team.id)}
                    onDelete={async () => {
                      await platformRepository.deleteTeam(workspace, team.id);
                      setRevision((value) => value + 1);
                    }}
                  />
                )}
                <ul>
                  {data.members
                    .filter((member) => member.team_id === team.id)
                    .map((member) => (
                      <li key={member.id}>
                        <Link to={`/workspaces/${workspace}/members/${member.id}`}>
                          {member.name}
                        </Link>
                        {member.role ? ` - ${member.role}` : ""}
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )
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
