import React, { useState } from "react";
import { EmptyIndividualState } from "../molecules/EmptyIndividualState";
import { MemberList } from "../molecules/MemberList";
import { MemberDetailsPanel } from "../molecules/MemberDetailsPanel";
import { ErrorBoundary } from "../ErrorBoundary";

interface Member {
  id: string;
  name: string;
  role?: string;
  currentLevels: Record<string, number>;
  goalLevels: Record<string, number>;
  selfAssessmentLevels?: Record<string, number>;
  [key: string]: any;
}

interface IndividualTabProps {
  members: Member[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
}

export function IndividualTab({
  members,
  onAddMember,
  onEditMember,
}: IndividualTabProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  if (members.length === 0) {
    return <EmptyIndividualState onAddMember={onAddMember} />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <ErrorBoundary componentName="MemberList">
        <MemberList
          members={members}
          selectedMemberId={selectedMember?.id}
          onSelectMember={setSelectedMember}
        />
      </ErrorBoundary>
      <div className="lg:col-span-2">
        <ErrorBoundary componentName="MemberDetailsPanel">
          <MemberDetailsPanel member={selectedMember} onEdit={onEditMember} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
