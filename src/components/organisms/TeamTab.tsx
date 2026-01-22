import React from "react";
import { Download } from "lucide-react";
import type { Member } from "../../types";
import MemberCard from "../atoms/memberCard";
import { EmptyTeamState } from "../molecules/EmptyTeamState";
import { Button } from "../ui/button";

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
  const handleExportTeam = () => {
    const data = {
      teamName: "Engineering Team",
      exportedAt: new Date().toISOString(),
      totalMembers: members.length,
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        currentLevels: member.currentLevels,
        goalLevels: member.goalLevels,
        selfAssessmentLevels: member.selfAssessmentLevels,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (members.length === 0) {
    return <EmptyTeamState onAddMember={onAddMember} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Team Overview</h2>
          <p className="text-sm text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleExportTeam} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Team
        </Button>
      </div>
      
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
    </div>
  );
}
