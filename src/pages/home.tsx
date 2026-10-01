import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Evaluation, SharedTeamAccess, Team, TeamMember, TeamShare } from "../types";
import { Header } from "../components/molecules/Header";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { CreateTeamDialog } from "../components/molecules/CreateTeamDialog";
import { ReferenceModal } from "../components/molecules/ReferenceModal";
import { ShareTeamDialog } from "../components/molecules/ShareTeamDialog";
import { MainTabs } from "../components/organisms/MainTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "@/data/DataProvider";
import { toMemberSummary } from "@/data/evaluations";

type TeamState = { teams: Team[]; members: TeamMember[]; evaluations: Evaluation[] };

export default function Home() {
  const navigate = useNavigate();
  const { repository, loading } = useData();
  const [team, setTeam] = useState<TeamState>({ teams: [], members: [], evaluations: [] });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [sharedTeam, setSharedTeam] = useState<Team | null>(null);
  const [shares, setShares] = useState<TeamShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!repository) return;
    const [teams, members, evaluations] = await Promise.all([
      repository.listTeams(),
      repository.listMembers(),
      repository.listEvaluations(),
    ]);
    setTeam({ teams, members, evaluations });
  }, [repository]);

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

  const openMember = (id: string) => navigate(`/member/${id}`);

  const openNewMember = (teamId?: string) =>
    navigate(teamId ? `/member/new?team=${encodeURIComponent(teamId)}` : "/member/new");

  const refreshShares = async (teamId: string) => {
    if (!repository) return;
    setShares(await repository.listTeamShares(teamId));
  };

  const openTeamSharing = async (selectedTeam: Team) => {
    setSharedTeam(selectedTeam);
    setSharesLoading(true);
    setShares([]);
    try {
      await refreshShares(selectedTeam.id);
    } finally {
      setSharesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="main-content">
      <ErrorBoundary componentName="Header">
        <Header />
      </ErrorBoundary>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="main-area">
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
            onCreateTeam={() => setShowCreateTeam(true)}
            onShareTeam={(selectedTeam) => void openTeamSharing(selectedTeam)}
            onMoveMember={(memberId, teamId) => void handleMoveMember(memberId, teamId)}
          />
        </ErrorBoundary>
      </main>

      <ErrorBoundary componentName="ConfirmDialog">
        <ConfirmDialog
          isOpen={!!deleteId}
          onConfirm={() => deleteId && void handleDeleteMember(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      </ErrorBoundary>

      <ErrorBoundary componentName="ReferenceModal">
        <ReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
      </ErrorBoundary>

      <CreateTeamDialog
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onCreate={async (name) => {
          if (!repository) return;
          await repository.createTeam(name);
          await reload();
        }}
      />

      <ShareTeamDialog
        team={sharedTeam}
        shares={shares}
        isOpen={!!sharedTeam}
        loading={sharesLoading}
        onClose={() => setSharedTeam(null)}
        onShare={async (email, access) => {
          if (!repository || !sharedTeam) return;
          await repository.shareTeamByEmail(sharedTeam.id, email, access);
          await refreshShares(sharedTeam.id);
        }}
        onChangeAccess={async (userId, access: SharedTeamAccess) => {
          if (!repository || !sharedTeam) return;
          await repository.updateTeamShare(sharedTeam.id, userId, access);
          await refreshShares(sharedTeam.id);
        }}
        onRemove={async (userId) => {
          if (!repository || !sharedTeam) return;
          await repository.removeTeamShare(sharedTeam.id, userId);
          await refreshShares(sharedTeam.id);
        }}
      />
    </div>
  );
}
