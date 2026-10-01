import React, { useState } from "react";
import type { Evaluation, Member, Team } from "../../types";
import { EmptyIndividualState } from "../molecules/EmptyIndividualState";
import { MemberList } from "../molecules/MemberList";
import { MemberDetailsPanel } from "../molecules/MemberDetailsPanel";
import { ErrorBoundary } from "../ErrorBoundary";

interface IndividualTabProps {
  teams?: Team[];
  members: Member[];
  evaluations?: Evaluation[];
  onAddMember: (teamId?: string) => void;
  onEditMember: (member: Member) => void;
}

export function IndividualTab({
  teams = [],
  members,
  evaluations = [],
  onAddMember,
  onEditMember,
}: IndividualTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!members || members.length === 0) {
    return <EmptyIndividualState onAddMember={onAddMember} />;
  }

  const selectedMember = members.find((m) => m.id === selectedId) ?? members[0] ?? null;

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <ErrorBoundary componentName="MemberList">
        <MemberList
          teams={teams}
          members={members}
          selectedMemberId={selectedMember?.id}
          onSelectMember={(member) => setSelectedId(member.id)}
          onAddMember={onAddMember}
        />
      </ErrorBoundary>
      <div className="lg:col-span-3">
        <ErrorBoundary componentName="MemberDetailsPanel">
          <MemberDetailsPanel
            member={selectedMember}
            evaluations={evaluations}
            onEdit={onEditMember}
            readOnly={teams.find((team) => team.id === selectedMember?.teamId)?.access === "viewer"}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
