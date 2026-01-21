import React, { useState } from "react";
import { EmptyIndividualState } from "../molecules/EmptyIndividualState";
import { MemberList } from "../molecules/MemberList";
import { MemberDetailsPanel } from "../molecules/MemberDetailsPanel";

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
      <MemberList
        members={members}
        selectedMemberId={selectedMember?.id}
        onSelectMember={setSelectedMember}
      />
      <div className="lg:col-span-2">
        <MemberDetailsPanel member={selectedMember} onEdit={onEditMember} />
      </div>
    </div>
  );
}
