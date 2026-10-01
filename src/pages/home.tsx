import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Evaluation, TeamMember } from "../types";
import { Header } from "../components/molecules/Header";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { ReferenceModal } from "../components/molecules/ReferenceModal";
import { MainTabs } from "../components/organisms/MainTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useData } from "@/data/DataProvider";
import { toMemberSummary } from "@/data/evaluations";

type TeamState = { members: TeamMember[]; evaluations: Evaluation[] };

export default function Home() {
  const navigate = useNavigate();
  const { repository, loading } = useData();
  const [team, setTeam] = useState<TeamState>({ members: [], evaluations: [] });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);

  const reload = useCallback(async () => {
    if (!repository) return;
    const [members, evaluations] = await Promise.all([
      repository.listMembers(),
      repository.listEvaluations(),
    ]);
    setTeam({ members, evaluations });
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

  const openMember = (id: string) => navigate(`/member/${id}`);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="main-content">
      <ErrorBoundary componentName="Header">
        <Header />
      </ErrorBoundary>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="main-area">
        <ErrorBoundary componentName="MainTabs">
          <MainTabs
            members={summaries}
            evaluations={team.evaluations}
            onAddMember={() => navigate("/member/new")}
            onEditMember={(member) => openMember(member.id)}
            onDeleteMember={(id) => setDeleteId(id)}
            onSelectMember={(member) => openMember(member.id)}
            onShowReference={() => setShowReference(true)}
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
    </div>
  );
}
