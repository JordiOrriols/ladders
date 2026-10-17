import { AppPage, WorkspaceBar, getWorkspaceLabels } from "@jordiorriols/ui";
import { useWorkspaceList } from "@jordiorriols/ui/hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Evaluation, Team, TeamMember } from "../types";
import { Header } from "../components/molecules/Header";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { CreateTeamDialog } from "../components/molecules/CreateTeamDialog";
import { ReferenceModal } from "../components/molecules/ReferenceModal";
import { MainTabs } from "../components/organisms/MainTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "@/data/DataProvider";
import { toMemberSummary } from "@/data/evaluations";
import { takePendingInvite } from "@/utils/pendingInvite";
import { MemberHome } from "./MemberHome";

type TeamState = { teams: Team[]; members: TeamMember[]; evaluations: Evaluation[] };

export default function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { repository, workspaceApi, loading } = useData();
  const directory = useWorkspaceList(workspaceApi, "ladders");
  const workspaceId = directory.workspace?.id;
  const access = directory.workspace?.access_level;
  const [team, setTeam] = useState<TeamState>({ teams: [], members: [], evaluations: [] });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [renamingTeam, setRenamingTeam] = useState<Team | null>(null);

  // Home shows the teams of the selected workspace; sharing happens on the workspace.
  const reload = useCallback(async () => {
    if (!repository) return;
    if (!workspaceId || !access || access === "member") {
      setTeam({ teams: [], members: [], evaluations: [] });
      return;
    }
    const [teams, allMembers, allEvaluations] = await Promise.all([
      repository.listWorkspaceTeams(workspaceId, access),
      repository.listMembers(),
      repository.listEvaluations(),
    ]);
    const teamIds = new Set(teams.map((item) => item.id));
    const members = allMembers.filter((member) => teamIds.has(member.teamId));
    const memberIds = new Set(members.map((member) => member.id));
    const evaluations = allEvaluations.filter((evaluation) => memberIds.has(evaluation.memberId));
    setTeam({ teams, members, evaluations });
  }, [repository, workspaceId, access]);

  // An invite opened before signing in continues once the account is back here.
  useEffect(() => {
    const invite = takePendingInvite();
    if (invite) navigate(`/join/${invite}`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    reload().catch((error) => console.error("Failed to load team", error));
  }, [loading, reload]);

  const summaries = useMemo(
    () => team.members.map((m) => toMemberSummary(m, team.evaluations)),
    [team]
  );

  const handleDeleteMember = async (id: string) => {
    if (!repository) return;
    setDeleteId(null);
    await repository.deleteMember(id);
    await reload();
  };

  const handleMoveMember = async (memberId: string, teamId: string) => {
    if (!repository) return;
    await repository.moveMember(memberId, teamId);
    await reload();
  };

  const handleDeleteTeam = async () => {
    if (!repository || !deleteTeamId) return;
    const teamId = deleteTeamId;
    setDeleteTeamId(null);
    await repository.deleteTeam(teamId);
    await reload();
  };

  const openMember = (id: string) => navigate(`/member/${id}`);

  // New members always join a team of the selected workspace; an empty workspace gets a team first.
  const openNewMember = (teamId?: string) => {
    const target = teamId ?? team.teams.find((item) => item.access !== "viewer")?.id;
    if (target) navigate(`/member/new?team=${encodeURIComponent(target)}`);
    else if (access === "owner") setShowCreateTeam(true);
  };

  const workspaceBar =
    workspaceApi && directory.workspaces ? (
      <WorkspaceBar
        api={workspaceApi}
        app="ladders"
        workspaces={directory.workspaces}
        value={workspaceId ?? ""}
        onValueChange={directory.select}
        onCreated={async (created) => {
          directory.select(created.id);
          await directory.refresh();
        }}
        labels={getWorkspaceLabels(i18n.language)}
      />
    ) : undefined;

  if (workspaceId && access === "member")
    return <MemberHome workspaceId={workspaceId} workspaceBar={workspaceBar} />;

  return (
    <AppPage data-testid="main-content">
      <ErrorBoundary componentName="MainTabs">
        <MainTabs
          teams={team.teams}
          members={summaries}
          evaluations={team.evaluations}
          onAddMember={openNewMember}
          onEditMember={(member) => openMember(member.id)}
          onDeleteMember={(id) => setDeleteId(id)}
          onSelectMember={(member) => openMember(member.id)}
          onShowReference={() => setShowReference(true)}
          {...(access === "owner" ? { onCreateTeam: () => setShowCreateTeam(true) } : {})}
          onMoveMember={(memberId, teamId) => void handleMoveMember(memberId, teamId)}
          onDeleteTeam={(selectedTeam) => setDeleteTeamId(selectedTeam.id)}
          onRenameTeam={setRenamingTeam}
          workspaceActions={workspaceBar}
          renderHeader={(navigation) => (
            <ErrorBoundary componentName="Header">
              <Header navigation={navigation} />
            </ErrorBoundary>
          )}
        />
      </ErrorBoundary>

      <ErrorBoundary componentName="ConfirmDialog">
        <ConfirmDialog
          isOpen={!!deleteId}
          onConfirm={() => deleteId && void handleDeleteMember(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      </ErrorBoundary>

      {directory.error && (
        <p role="alert" className="px-6 text-sm text-destructive">
          {directory.error}
        </p>
      )}

      <ConfirmDialog
        isOpen={!!deleteTeamId}
        onConfirm={() => void handleDeleteTeam()}
        onCancel={() => setDeleteTeamId(null)}
        title={t("teams.deleteTitle")}
        description={t("teams.deleteDescription")}
        confirmLabel={t("teams.delete")}
      />

      <ErrorBoundary componentName="ReferenceModal">
        <ReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
      </ErrorBoundary>

      <CreateTeamDialog
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onCreate={async (name) => {
          if (!repository || !workspaceId) return;
          await repository.createTeam(name, workspaceId);
          await reload();
        }}
      />

      <CreateTeamDialog
        isOpen={!!renamingTeam}
        initialName={renamingTeam?.name ?? ""}
        onClose={() => setRenamingTeam(null)}
        onCreate={async (name) => {
          if (!repository || !renamingTeam) return;
          await repository.updateTeam(renamingTeam.id, name);
          await reload();
        }}
      />
    </AppPage>
  );
}
