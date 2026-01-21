import React from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import MemberCard from "../atoms/memberCard";
import { EmptyTeamState } from "../molecules/EmptyTeamState";

interface Member {
  id: string;
  name: string;
  role?: string;
  [key: string]: any;
}

interface TeamTabProps {
  members: Member[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (member: Member) => void;
}

export function TeamTab({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
}: TeamTabProps) {
  if (members.length === 0) {
    return <EmptyTeamState onAddMember={onAddMember} />;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onEdit={onEditMember}
          onDelete={(id) => onDeleteMember(id)}
          onClick={() => onSelectMember(member)}
        />
      ))}
    </div>
  );
}
