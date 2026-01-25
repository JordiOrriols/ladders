import React from "react";
import { User, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RadarChart from "./radarChart";

interface Member {
  id: string;
  name: string;
  role?: string;
  currentLevels: Record<string, number>;
  goalLevels: Record<string, number>;
  selfAssessmentLevels?: Record<string, number>;
}

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

export default function MemberCard({ member, onEdit, onDelete, onClick }: MemberCardProps) {
  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit(member);
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete(member.id);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group"
      onClick={onClick}
      data-testid={`member-card-${member.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800" data-testid="member-name">
              {member.name}
            </h3>
            {member.role && (
              <p className="text-xs text-slate-500" data-testid="member-role">
                {member.role}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            eventId="member_card_edit"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleEditClick}
          >
            <Pencil className="w-4 h-4 text-slate-400" />
          </Button>
          <Button
            eventId="member_card_delete"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleDeleteClick}
          >
            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <RadarChart
          currentLevels={member.currentLevels}
          goalLevels={member.goalLevels}
          selfAssessmentLevels={member.selfAssessmentLevels}
          size={180}
          showLabels={false}
          showLegend={false}
        />
      </div>
    </div>
  );
}
