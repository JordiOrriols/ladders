import React, { useState } from "react";
import type { Evaluation, Member } from "../../types";
import { EmptyIndividualState } from "../molecules/EmptyIndividualState";
import { MemberList } from "../molecules/MemberList";
import { MemberDetailsPanel } from "../molecules/MemberDetailsPanel";
import { ErrorBoundary } from "../ErrorBoundary";

interface IndividualTabProps {
  members: Member[];
  evaluations?: Evaluation[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
}

export function IndividualTab({
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
          members={members}
          selectedMemberId={selectedMember?.id}
          onSelectMember={(member) => setSelectedId(member.id)}
        />
      </ErrorBoundary>
      <div className="lg:col-span-3">
        <ErrorBoundary componentName="MemberDetailsPanel">
          <MemberDetailsPanel
            member={selectedMember}
            evaluations={evaluations}
            onEdit={onEditMember}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
