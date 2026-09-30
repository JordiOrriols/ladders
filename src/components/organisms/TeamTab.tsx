import React from "react";
import { useTranslation } from "react-i18next";
import type { Member } from "../../types";
import MemberCard from "../atoms/memberCard";
import { EmptyTeamState } from "../molecules/EmptyTeamState";

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
  const { t } = useTranslation();

  const handleMemberSelect = (member: Member) => {
    onSelectMember(member);
  };

  if (!members || members.length === 0) {
    return <EmptyTeamState onAddMember={onAddMember} />;
  }

  return (
    <div className="space-y-4" data-testid="team-tab">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800" data-testid="team-overview-title">
            {t("labels.teamOverview")}
          </h2>
          <p className="text-sm text-slate-500" data-testid="team-member-count">
            {members.length} {members.length !== 1 ? t("labels.members") : t("labels.member")}
          </p>
        </div>
      </div>

      <div
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        data-testid="team-grid"
      >
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onEdit={onEditMember}
            onDelete={(id) => onDeleteMember(id)}
            onClick={() => handleMemberSelect(member)}
          />
        ))}
      </div>
    </div>
  );
}
